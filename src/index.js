import _ from 'lodash'
import Promise from 'bluebird'
import { Bacon } from 'sigh-core'
import { mapEvents } from 'sigh-core/lib/stream'

function stylusTask(opts) {
  // this function is called once for each subprocess in order to cache state,
  // it is not a closure and does not have access to the surrounding state, use
  // `require` to include any modules you need, for further info see
  // https://github.com/ohjames/process-pool
  var log = require('sigh-core').log;
  var stylus = require("stylus");
  var Promise = require("bluebird");
  var fs = require("fs");
  var {resolve: path_resolve} = require("path")

  // this task runs inside the subprocess to transform each event
  return event => {
    return new Promise((resolve, reject) => {
      var styl = stylus(event.data)
          .set('filename', event.path)
          .set('sourcemap', {
            comment: false,
            sourceRoot: event.projectPath
          })
      ;
      if (opts && opts.use) {
        opts.use.forEach(function(use) {
          styl = styl.use(require(use)());
        })
      }
      if (opts && opts.import) {
        opts.import.forEach(function(_import) {
          styl = styl.import(_import);
        })
      }
      styl.render(function(err, css) {
        if (err) {
          reject(err)
        } else {
          delete styl.sourcemap.sourceRoot
          styl.sourcemap.sourcesContent = styl.sourcemap.sources.map(fname => fs.readFileSync(path_resolve(fname), "utf8"))
          resolve({
            data: css,
            map: styl.sourcemap
          })
        }
      })
    });
  }
}

function adaptEvent(compiler) {
  // data sent to/received from the subprocess has to be serialised/deserialised
  return event => {
    if (event.type !== 'add' && event.type !== 'change')
      return event;

    if (event.fileType !== 'styl') return event

    return compiler(_.pick(event, 'type', 'data', 'path', 'projectPath', 'sourcePath')).then(({data, map}) => {
      event.data = data;

      if (map) {
        event.applySourceMap(map);
      }

      event.changeFileSuffix('css')
      return event
    })
  }
}

var pooledProc;

export default function(op, opts = {}) {
  if (! pooledProc)
    pooledProc = op.procPool.prepare(stylusTask, opts);

  return mapEvents(op.stream, adaptEvent(pooledProc))
}
