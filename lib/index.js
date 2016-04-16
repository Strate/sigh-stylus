'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _sighCore = require('sigh-core');

var _sighCoreLibStream = require('sigh-core/lib/stream');

function stylusTask(opts) {
  // this function is called once for each subprocess in order to cache state,
  // it is not a closure and does not have access to the surrounding state, use
  // `require` to include any modules you need, for further info see
  // https://github.com/ohjames/process-pool
  var log = require('sigh-core').log;
  var stylus = require("stylus");
  var Promise = require("bluebird");
  var fs = require("fs");

  var _require = require("path");

  var path_resolve = _require.resolve;

  // this task runs inside the subprocess to transform each event
  return function (event) {
    return new Promise(function (resolve, reject) {
      var styl = stylus(event.data).set('filename', event.path).set('sourcemap', {
        comment: false,
        sourceRoot: event.projectPath
      });
      if (opts && opts.use) {
        opts.use.forEach(function (use) {
          styl = styl.use(require(use)());
        });
      }
      if (opts && opts['import']) {
        opts['import'].forEach(function (_import) {
          styl = styl['import'](_import);
        });
      }
      styl.render(function (err, css) {
        if (err) {
          reject(err);
        } else {
          delete styl.sourcemap.sourceRoot;
          styl.sourcemap.sourcesContent = styl.sourcemap.sources.map(function (fname) {
            return fs.readFileSync(path_resolve(fname), "utf8");
          });
          resolve({
            data: css,
            map: styl.sourcemap
          });
        }
      });
    });
  };
}

function adaptEvent(compiler) {
  // data sent to/received from the subprocess has to be serialised/deserialised
  return function (event) {
    if (event.type !== 'add' && event.type !== 'change') return event;

    if (event.fileType !== 'styl') return event;

    return compiler(_lodash2['default'].pick(event, 'type', 'data', 'path', 'projectPath', 'sourcePath')).then(function (_ref) {
      var data = _ref.data;
      var map = _ref.map;

      event.data = data;

      if (map) {
        event.applySourceMap(map);
      }

      event.changeFileSuffix('css');
      return event;
    });
  };
}

var pooledProc;

exports['default'] = function (op) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  if (!pooledProc) pooledProc = op.procPool.prepare(stylusTask, opts);

  return (0, _sighCoreLibStream.mapEvents)(op.stream, adaptEvent(pooledProc));
};

module.exports = exports['default'];
//# sourceMappingURL=index.js.map