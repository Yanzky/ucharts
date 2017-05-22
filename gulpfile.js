var gulp = require("gulp");
var gutil = require("gulp-util");
var runSeq = require('run-sequence');
var open = require('open');
var del = require('del');

var webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");
var webpackConfig = require("./webpack.config.js");


// The development server (the recommended option for development)
gulp.task("default", ["webpack-dev-server"]);


gulp.task('build:clean', function(cb){
    del.sync(['./dist/**/*']);
    cb();
});

// Production build
gulp.task("build", function(cb){
    runSeq('build:clean', 'webpack:build', cb);
});

gulp.task("webpack:build", function(callback) {
    // modify some webpack config options
    var myConfig = Object.create(webpackConfig);
    myConfig.entry.unshift('babel-polyfill');
    myConfig.plugins = myConfig.plugins.concat(
        new webpack.DefinePlugin({
            "process.env": {
                // This has effect on the react lib size
                "NODE_ENV": JSON.stringify("production")
            }
        }),
        new webpack.optimize.UglifyJsPlugin({ mangle: false,
                                             sourcemap: false,
                                             minimize: true,
                                             compress: {
                                                 warnings: true
                                             } })
    );

    // run webpack
    webpack(myConfig, function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:build", err);
        gutil.log("[webpack:build]", stats.toString({
            colors: true
        }));
        callback();
    });
});


// 开发服务器
gulp.task("webpack-dev-server", function(callback) {
    // modify some webpack config options
    var myConfig = Object.create(webpackConfig),
        port = 6000 + Math.floor(Math.random() * 1000);

    myConfig.devtool = "sourcemap";
    // myConfig.debug = true;
    //
    // inline mode & hot mode
    myConfig.entry.unshift("webpack-dev-server/client?http://localhost:" + port +"/", "webpack/hot/dev-server");
    myConfig.plugins = myConfig.plugins.concat(
        new webpack.HotModuleReplacementPlugin()
    );

    // Start a webpack-dev-server
    var server = new WebpackDevServer(webpack(myConfig), {
        publicPath: '/' + myConfig.output.publicPath,
        hot: true,
        stats: {
            colors: true
        }
    });

    server.listen(port, "localhost", function(err) {
        if(err) throw new gutil.PluginError("webpack-dev-server", err);
        gutil.log("[webpack-dev-server]", "http://localhost:" + port + "/webpack-dev-server/index.html");
        open('http://localhost:' + port);
    });
});
