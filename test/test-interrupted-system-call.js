var test = require('tape');
var omdp = require('../');
var MDP = require('../lib/mdp')


test('catch interrupted system call', function(t) {

  var location = 'inproc://#1';
  var broker = new omdp.Broker(location, {
    HEARTBEAT_INTERVAL : 1
  });
  var worker = new omdp.Worker(location, 'echo');
  worker.start();

  // hotwire the addition of this worker to make the test run
  // immediately.
  broker.workers[worker.name] = worker;

  // wrap heartbeat in a try/catch to detect errors
  var heartbeat = broker.heartbeat;
  broker.heartbeat = function override(workerId) {
    var caught = false;
    try {
      heartbeat.call(broker, workerId);
    } catch (e) {
      caught = true;
    }

    t.ok(!caught);
    broker.stop();
    worker.stop();
    t.end();
  }

  broker.start(function() {

    var send = broker.socket.send;
    broker.socket.send = function sender(arr) {

      if (arr[2] === MDP.W_HEARTBEAT) {
        throw new Error('Interrupted System Call');
      } else {
        send.call(broker.socket, arr);
      }
    }
  });
});

test('allow other errors to flow through', function(t) {
  var location = 'inproc://#1';
  var broker = new omdp.Broker(location, {
    HEARTBEAT_INTERVAL : 1
  });
  var worker = new omdp.Worker(location, 'echo');
  worker.start();

  // hotwire the addition of this worker to make the test run
  // immediately.
  broker.workers[worker.name] = worker;

  // wrap heartbeat in a try/catch to detect errors
  var heartbeat = broker.heartbeat;
  broker.heartbeat = function override(workerId) {
    var caught = false;
    try {
      heartbeat.call(broker, workerId);
    } catch (e) {
      caught = true;
    }
    t.ok(caught);
    broker.stop();
    worker.stop();
    t.end();
  }

  broker.start(function() {

    var send = broker.socket.send;
    broker.socket.send = function sender(arr) {

      if (arr[2] === MDP.W_HEARTBEAT) {
        throw new Error('some other thing');
      } else {
        send.call(broker.socket, arr);
      }
    }
  });
});
