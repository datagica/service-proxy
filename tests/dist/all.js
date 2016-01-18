'use strict';

var _serviceProxy = require('../../lib/service-proxy');

var _serviceProxy2 = _interopRequireDefault(_serviceProxy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var chai = require('chai');
chai.use(require('chai-fuzzy'));
var expect = chai.expect;
var assert = chai.assert;

var util = require('util');

// this is only installed and used for tests
var EIO = require('engine.io-client');
var RIO = require('@datagica/remoting.io-client-tweaked');

// local functions
function pretty(obj) {
  return util.inspect(obj, false, 20, true);
};

describe('ServiceProxy', function () {
  it('should return a valid instance', function (done) {

    var socket = EIO("ws://localhost:9000");
    var rpc = RIO(socket);

    var serviceProxy = (0, _serviceProxy2.default)({
      services: ['session'],
      socket: socket,
      rpc: rpc
    });

    serviceProxy.then(function (ok) {
      console.log('service is ok');
      done();
    }).catch(function (err) {
      console.error('error: ' + err);
      done();
    });
  });
});