"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var socket = _ref.socket;
  var rpc = _ref.rpc;
  var services = _ref.services;

  return _promise2.default.all(services.map(function (name) {
    return rpc.proxy(name).then(function (proxy) {
      return {
        name: name,
        proxy: proxy
      };
    });
  })).then(function (results) {
    return _promise2.default.resolve(results.reduce(function (proxies, result) {
      result.proxy.on = function (eventName, onData, onError) {
        return new ServiceProxy({
          socket: socket,
          proxy: result.proxy,
          name: result.name,
          eventName: eventName,
          onData: onData,
          onError: onError
        }).init();
      };
      proxies[result.name] = result.proxy;
      return proxies;
    }, {}));
  });
};

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ServiceProxy = (function () {
  function ServiceProxy(_ref2) {
    var socket = _ref2.socket;
    var proxy = _ref2.proxy;
    var name = _ref2.name;
    var eventName = _ref2.eventName;
    var onData = _ref2.onData;
    var onError = _ref2.onError;
    (0, _classCallCheck3.default)(this, ServiceProxy);

    this.socket = socket;
    this.proxy = proxy;
    this.name = name;
    this.eventName = eventName;
    this.isReady = false;
    this.queue = [];

    this.onData = onData || function () {};
    this.onError = onError || function () {};
  }

  (0, _createClass3.default)(ServiceProxy, [{
    key: "init",
    value: function init() {
      var _this = this;

      this.socket.on('message', function (message) {

        // if we are not ready, we queue messages
        if (!_this.isReady) return _this.queue.push(message);

        // if we are ready and nothing is in queue, we play the message
        if (_this.queue.length == 0) return _this.onMessage(message);

        // if we just got ready, we replay queued messages
        _this.queue.concat([message]).map(function (msg) {
          return _this.onMessage(msg);
        });
        _this.queue = [];
      });

      return new _promise2.default(function (resolve, reject) {
        _this.proxy.changes(_this.eventName).then(function (ready) {
          _this.isReady = true;
          resolve(_this);
        }).catch(function (err) {
          reject("ServiceProxy: couldn't attach changes listener to service " + _this.name);
        });
      });
    }
  }, {
    key: "onMessage",
    value: function onMessage(message) {
      var _this2 = this;

      var response = undefined;
      try {
        response = JSON.parse(message);
        if (typeof response === "undefined" || response === "null" || typeof response.id !== "undefined" || response.type !== 'changes' || response.changes !== this.name) return;
      } catch (exc) {
        return;
      }
      _promise2.default.resolve(response.data).then(function (resp) {
        try {
          _this2.onData(resp);
        } catch (exc) {
          _this2.onError(exc);
        }
      }).catch(function (exc) {
        _this2.onError(exc);
      });
    }
  }]);
  return ServiceProxy;
})();