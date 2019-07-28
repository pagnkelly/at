import ReactDOM from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import LazyLoad from 'react-lazyload';
import cls from 'classnames';
import Chat from './chat';
import $ from "./lib/caret";
import consts from './consts';
import './lib/kindeditor-all';
import './style.less';

const { USERS } = consts;
window.KindEditor.ready(() => { });

const At = () => {
  const [ showAtList, setShowAtList ] = useState(false);
  const [ atListPos, setAtListPos ] = useState([]);
  const [ el, setEditor ] = useState(null);
  const active = useRef(0);
  const lastEl = useRef(el);
  const iframe = useRef(null);
  const iframeBody = useRef(null);
  const lastShowAtList = useRef(showAtList);
  const [ userList, setUserList ] = useState(USERS);
  const userInfo = { jid: 'aaa@2333.com', nickname: 'aaa' }

  const sendMessage = () => {

  };

  const onAtItemClick = (item) => {
    const el = el || lastEl.current;
    const dType = el.cmd.range.startContainer.data ? 'data' : 'innerHTML';
    const sVal = el.cmd.range.startContainer[dType];
    const lAt = sVal.lastIndexOf('@');
    el.cmd.range.startContainer[dType] = sVal.substring(0, lAt);
    const nickname = item.userInfo.nickname;
    el.insertHtml(`<span contenteditable='false'>@${nickname}</span>&nbsp;<span id='input-textarea-caret-position-mirror-span'></span>`);
    const span = el.edit.doc
      .getElementById('input-textarea-caret-position-mirror-span');
    const range = el.edit.doc.createRange();
    range.selectNodeContents(span);
    range.collapse(false);
    const sel = el.edit.win.getSelection();
    sel.removeAllRanges();
    sel.addRange(range); // hack：修正下一次startOffset
    span.parentNode.removeChild(span);
  };

  useEffect(() => {
    const { current } = active;
    const $al = $('.at-list');
    const wrapH = $al.height();
    const st = $al.scrollTop();
    const $li = $al.find('li').eq(current);
    const liH = $li.height();
    if ($al.find('li').eq(current).length > 0) {
      if ($al.find('li').eq(current)[0].offsetTop + liH > wrapH + st) {
        // 5 margin-top
        $al.scrollTop(((current + 1) * (liH + 5)) - wrapH);
      } else if ($al.find('li').eq(current)[0].offsetTop + liH <= st) {
        // 5 margin-top
        $al.scrollTop(current * (liH + 5));
      }
    }
    
  }, [ active.current ]);

  useEffect(() => {
    window.KindEditor.ready((k) => {
      const editor = k.create('#editor', {
        loadStyleMode: false,
        pasteType: 1,
        items: [],
        newlineTag: 'br',
        htmlTags: {
          br: [],
          img: ['src', 'data-emoticon', 'data-type', 'data-categery', 'width', 'height', 'alt', 'title', '.width', '.height']
        },
        afterChange: () => {
          // 获取选定对象
          setTimeout(() => {
            const selection = editor.edit.win.getSelection();
            if (selection.type === 'None') {
              return false;
            }
            // 设置最后光标对象
            const lastEditRange = selection.getRangeAt(0);
            const val = lastEditRange.startContainer.data || '';
            const currentPos = lastEditRange.startOffset;
            for (let i = currentPos; i >= 0; i--) {
              const subChar = $.trim(val.substring(i - 1, i));
              if (!subChar) {
                setShowAtList(false);
                lastShowAtList.current = false;
                break;
              }
              if (subChar === '@') {
                const query = val.substring(i, currentPos);
                const rltData = [];
                
                const atList = userList;
                atList.forEach((item) => {
                  const [username] = item.userInfo.username.split('@');
                  const [nickname] = item.userInfo.nickname.split('@');
                  if ((username && username.indexOf(query) > -1) ||
                      (nickname && nickname.indexOf(query) > -1)) {
                    rltData.push(item);
                  }
                });
  
                setUserList(rltData);
                setShowAtList(rltData.length > 0);
                lastShowAtList.current = rltData.length > 0;
                if (rltData.length !== userList.length) {
                  active.current = 0;
                }
                
                break;
              }
            }
          }, 0);
          return true;
        }
      });

      setEditor(editor);
      lastEl.current = editor;
      // 获取光标的坐标
      [iframe.current] = $('.ke-edit-iframe');
      const ifrBody = iframe.current.contentDocument.body;
      ifrBody.contentEditable = true;
      iframeBody.current = ifrBody;
      // 屏蔽内置右键的菜单，不屏蔽浏览器右键
      // eslint-disable-next-line
      editor['_contextmenus'] = [];
      $(editor.edit.iframe[0].contentWindow.window)
        .on('keydown', (e) => {
          if (lastShowAtList.current) {
            const { current } = active;
            if (e.keyCode === 13) {
              onAtItemClick(userList[current]);
              return true;
            } else if (e.keyCode === 40) {
              active.current = current + 1 < userList.length ? current + 1 : 0;
              return false;
            } else if (e.keyCode === 38) {
              active.current = current - 1 < 0 ? userList.length - 1 : current - 1;
              return false;
            }
          }

          if (e.keyCode === 13 && e.ctrlKey) {
            editor.insertHtml('<br>\u200B');
            return false;
          } else if (e.keyCode === 13) {
            sendMessage();
            return false;
          }
          return true;
        })
    });
  }, []);

  useEffect(() => {
    if (iframe && iframeBody) {
      const offset = $(iframeBody.current).caret('offset', { iframe: iframe.current });
      if (offset) {
        // 200 接近列表高度位置 40 输入框和列表框距离
        const top = userList.length * 26 > 200 ? 200 : userList.length * 26;
        const atPos = {
          top: offset.top - 30 - (top),
          left: offset.left - 30
        };
        setAtListPos(atPos);
      }
    }
  }, [ userList ])

  const imgError = (e) => {
    e.target.src = 'https://qim.qunar.com/file/v2/download/perm/ff1a003aa731b0d4e2dd3d39687c8a54.png';
  }

  return (
    <div className="container">
      <Chat />
      <div className="chat-footer">
        <div className="content">
        <div
          id="editor"
          className="edit-area"
        />
        {
          showAtList &&
            <ul className={cls('at-list', { 'animation animating bounceIn': showAtList })} style={{ left: atListPos.left, top: atListPos.top }}>
              {
                userList.map((item, idx) => (
                  <li
                    key={`at-list-${item.userInfo.username}`}
                    onClick={() => onAtItemClick(item)}
                    className={cls({ active: active.current === idx })}
                  >
                    <div className="icon-wrap">
                      <i
                        className={cls('icon', { admin: item.affiliation === 'admin', owner: item.affiliation === 'owner' })}
                      />
                    </div>
                    <div className="img-wrap">
                      {
                        userList.length > 20 ?
                          <LazyLoad height={26} overflow>
                            <img src={item.userInfo.imageurl} alt='' onError={imgError} />
                          </LazyLoad> :
                          <img src={item.userInfo.imageurl} alt='' onError={imgError} />
                      }
                    </div>
                    <div className="name">{item.userInfo.nickname}</div>
                  </li>
                ))
              }
            </ul>
        }
      </div>
    </div>
    </div>
  )
}

ReactDOM.render(
<At />,
document.getElementById('root')
)