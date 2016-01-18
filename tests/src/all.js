const chai = require('chai');
chai.use(require('chai-fuzzy'));
const expect = chai.expect;
const assert = chai.assert;

var util = require('util');

// this is only installed and used for tests
const EIO = require('engine.io-client');
const RIO = require('@datagica/remoting.io-client-tweaked');

// local functions
function pretty(obj) {
  return util.inspect(obj, false, 20, true)
};

import ServiceProxy from "../../lib/service-proxy";

describe('ServiceProxy', () => {
  it('should return a valid instance', (done) => {

    const socket = EIO("ws://localhost:9000");
    const rpc = RIO(socket);

    const serviceProxy = ServiceProxy({
      services: ['session'],
      socket: socket,
      rpc: rpc
    });

    serviceProxy.then(ok => {
      console.log(`service is ok`);
      done();
    }).catch(err => {
      console.error(`error: ${err}`);
      done();
    })
  });
})
