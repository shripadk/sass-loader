'use strict';

var sass = require('node-sass');
var fs = require('fs');
var path = require('path');

['scss', 'sass'].forEach(function (ext) {
    var files = [];

    fs.readdirSync(path.join(__dirname, ext))
        .filter(function (file) {
            return path.extname(file) === '.' + ext;
        })
        .map(function (file) {
            var filename;

            files.push(filename = path.join(__dirname, ext, file));

            var result = sass.renderSync({
                outputStyle: 'compressed',
                file: filename,
                includePaths: [
                    path.join(__dirname, ext, 'another')
                ]
            })

            return result.css;
        })
        .forEach(function (content, index) {
            fs.writeFileSync(files[index].replace(new RegExp('\\.' + ext + '$', 'gi'), '.css'), content, 'utf8');
        });
});