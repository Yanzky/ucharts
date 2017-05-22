var webpack = require('webpack');
var path = require('path');
var package = require('./package.json');



module.exports = {
  context: __dirname, // path.join(__dirname, "src"),
  entry: ['./src/index.js'],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-2'],
          plugins: [],
        }
      }
    ]
  },
  output: {
    path: __dirname + '/dist/',
    publicPath: '',
    filename: 'uchartlib.js',
    library: 'UCL'
  },
  externals: [
  	{
//        d3: true
    }
  ],
  plugins: []
};
