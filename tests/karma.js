#!/usr/bin/env node
'use strict';

function config(once) {
    var autoWatch, singleRun, reporters;

    if (once) {
        autoWatch = false;
        singleRun = true;
        reporters = ['spec'];
    } else {
        autoWatch = true;
        singleRun = false;
        reporters = ['kjhtml'];
    }

    return {
        basePath: __dirname,
        frameworks: ['jasmine', 'browserify'],
        plugins: [
            'karma-jasmine',
            'karma-babel-preprocessor',
            'karma-jasmine-html-reporter',
            'karma-html-reporter',
            'karma-spec-reporter',
            'karma-browserify',
            'karma-chrome-launcher'
        ],
        files: [
            './unit/**/*Spec.js'
        ],
        exclude: [
            './karma.js',
            '../node_modules',
            '../lib'
        ],
        preprocessors: {
            '../src/**/*': ['browserify'],
            './**/*': ['browserify']
        },
        browserify: {
            debug: true,
            extensions: ['.js', '.jsx'],
            transform: ['babelify'],
            fullPaths: true
        },
        reporters: reporters,
        port: 9876,
        colors: true,
        logLevel: 'DEBUG',
        browsers: ['ChromeHeadless'],
        autoWatch: autoWatch,
        singleRun: singleRun
    };
}

module.exports = function(configuration) {
    var once = process.argv.indexOf("--once") > -1;
    configuration.set(config(once));
};
