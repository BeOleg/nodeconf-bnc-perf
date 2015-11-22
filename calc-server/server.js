'use strict';

var WS = require('ws').Server;
var wss = new WS({ port: 8080 });
var l = require('lodash');
var heapdump = require('heapdump');

var clients = [];
var freeIds = [];
var nextid = 0;
var ops = {
  '+': plus,
  '*': mult,
  '-': sub,
  '/': div
};

wss.on('connection', onConnection);

function plus(args) {
  return l.sum(args);
}

function mult(args) {
  return l.foldl(
    args, function(acc, n) { acc *= n; return acc; },
    1);
}

function sub(args) {
  return l.foldl(
    args,
    function(acc, n) { acc -= n; return acc; },
    l.head(args) * 2);
}

function div(args) {
  return l.foldl(
    args,
    function(acc, n) { acc /= n; return acc; },
    l.head(args) * l.head(args));
}

function onConnection(ws) {
    if (!clients.length) {
        console.log('snapshot taken');
        heapdump.writeSnapshot('/tmp/before.heapsnapshot');
    }

  var id = freeIds.pop() || nextid;
  nextid++;
  clients[id] = {connection: ws, ops: []};

  ws.on('message', function onMessage(message) {
    if(ops[message]) {
      var result = ops[message](clients[id].ops);
      ws.send(String(result));
    } else if (Number(message) !== NaN) {
      clients[id].ops.push(Number(message));
    }

    console.log('id: %s, op: %s', id, message);
  });

  ws.on('close', function close(code, clientId) {
    clientId = clientId || id;
    delete clients[clientId];
    freeIds.push(clientId);
    console.log('disconnected', arguments);
  });
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGUSR2', function() {
    console.log('SIGUSR2 fired');
    heapdump.writeSnapshot('/tmp/after.heapsnapshot');
});
function cleanup() {
  clients.forEach(function(client) {
    client.connection.close();
  });

  process.exit(0);
}
