'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _processPool = require('process-pool');

var _processPool2 = _interopRequireDefault(_processPool);

var _sighCore = require('sigh-core');

var _sighLibEvent = require('sigh/lib/Event');

var _sighLibEvent2 = _interopRequireDefault(_sighLibEvent);

var _2 = require('../');

var _3 = _interopRequireDefault(_2);

require('source-map-support').install();
require('chai').should();

describe('sigh-stylus', function () {
  var procPool;
  beforeEach(function () {
    procPool = new _processPool2['default']();
  });
  afterEach(function () {
    procPool.destroy();
  });

  xit('TODO: should do something', function () {
    // TODO:
  });
});
//# sourceMappingURL=index.spec.js.map