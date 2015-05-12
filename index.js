var utils = require('loader-utils');
var sass = require('node-sass');
var path = require('path');
var sassGraph = require('sass-graph');

var asyncLoader = function (content, callback) {
    var opt = utils.parseQuery(this.query);
    opt.data = content;

    // skip empty files, otherwise it will stop webpack, see issue #21
    if (opt.data.trim() === '') {
        return callback(null, content);
    }

    // set include path to fix imports
    opt.includePaths = opt.includePaths || [];
    opt.includePaths.push(path.dirname(this.resourcePath));
    if (this.options.resolve && this.options.resolve.root) {
        var root = [].concat(this.options.resolve.root);
        opt.includePaths = opt.includePaths.concat(root);
    }

    // output compressed by default
    opt.outputStyle = opt.outputStyle || 'compressed';
    opt.stats = {};

    var loadPaths = opt.includePaths;
    var markDependencies = function () {
        try {
            var graph = sassGraph.parseFile(this.resourcePath, {loadPaths: loadPaths});
            graph.visitDescendents(this.resourcePath, function (imp) {
                this.addDependency(imp);
            }.bind(this));
        } catch (err) {
            this.emitError(err);
        }
    }.bind(this);

    opt.success = function (result) {
        markDependencies();

        if (result.map && result.map !== '{}') {
            result.map = JSON.parse(result.map);
            result.map.file = this.resourcePath;
            // The first source is 'stdin' according to libsass because we've used the data input
            // Now let's override that value with the correct relative path
            result.map.sources[0] = path.relative(self.options.output.path, resourcePath);
        } else {
            result.map = null;
        }

        callback(null, result.css.toString(), result.map);
    }.bind(this);

    opt.error = function (err) {
        markDependencies();
        this.emitError(err);
        callback(err);
    }.bind(this);

    sass.render(opt);
};

var syncLoader = function (content, callback) {
    var opt = utils.parseQuery(this.query);
    opt.data = content;

    // skip empty files, otherwise it will stop webpack, see issue #21
    if (opt.data.trim() === '') {
        return content;
    }

    // set include path to fix imports
    opt.includePaths = opt.includePaths || [];
    opt.includePaths.push(path.dirname(this.resourcePath));
    if (this.options.resolve && this.options.resolve.root) {
        var root = [].concat(this.options.resolve.root);
        opt.includePaths = opt.includePaths.concat(root);
    }

    // output compressed by default
    opt.outputStyle = opt.outputStyle || 'compressed';
    opt.stats = {};

    try {
        var result = sass.renderSync(opt);
        return result.css.toString();
    } catch(e) {
        console.error(e);
        return '';
    }
};

module.exports = function (content) {
    this.cacheable();
    var callback = this.async();

    if(!callback) return syncLoader.call(this, content);
    asyncLoader.call(this, content, callback);
};
