const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const Visualizer = require('webpack-visualizer-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = {
  entry: {
    app: './src/index.js'
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    hot: true
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'at',
      template: 'index.html',
      inject: true
    }),
    // new webpack.NamedModulesPlugin(),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'common' // 指定公共 bundle 的名称。
    // })
    new Visualizer({
      filename: './statistics.html'
    })
  ],
  optimization: {
    moduleIds: 'hashed',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          minChunks: 2
        }
      }
    },
    runtimeChunk: 'single',
    minimizer: [
      // 自定义js优化配置，将会覆盖默认配置
      new UglifyJsPlugin({
        exclude: /\.min\.js$/, // 过滤掉以".min.js"结尾的文件，我们认为这个后缀本身就是已经压缩好的代码，没必要进行二次压缩
        cache: true,
        parallel: true, // 开启并行压缩，充分利用cpu
        sourceMap: false,
        extractComments: false, // 移除注释
        uglifyOptions: {
          compress: {
            unused: true,
            warnings: false,
            drop_debugger: true
          },
          output: {
            comments: false
          }
        }
      }),
      // 用于优化css文件
      new OptimizeCssAssetsPlugin({
        assetNameRegExp: /\.css$/g,
        cssProcessorOptions: {
          safe: true,
          autoprefixer: { disable: true }, // 这里是个大坑，稍后会提到
          mergeLonghand: false,
          discardComments: {
            removeAll: true // 移除注释
          }
        },
        canPrint: true
      })
    ]
  },
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       commons: {
  //         test: /[\\/]node_modules[\\/]/,
  //         // cacheGroupKey here is `commons` as the key of the cacheGroup
  //         name(module, chunks, cacheGroupKey) {
  //           const moduleFileName = module.identifier().split('/').reduceRight(item => item);
  //           const allChunksNames = chunks.map((item) => item.name).join('~');
  //           return `${cacheGroupKey}-${allChunksNames}-${moduleFileName}`;
  //         },
  //         chunks: 'all'
  //       }
  //     }
  //   }
  // },
  output: {
    // filename: '[name].bundle.js',
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
            plugins: ['react-hot-loader/babel'], // 热更新插件
            presets: ['@babel/preset-env', '@babel/preset-react'] // jsx转为js函数
        },
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      }
    ]
  },
  mode: 'development'
};