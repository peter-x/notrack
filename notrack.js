var Proxy = require('./proxy').Proxy;
var Logger = require('./logger').Logger;
var Filter = require('./filter').Filter;

var config = {
    "listen_port": "8080",
    "listen_host": "127.0.0.1"
}

process.on('uncaughtException', function(err) {
    console.log('Uncaught exception: %s', err);
});

var filter = new Filter();
var proxy = new Proxy(filter, config);
var logger = new Logger(proxy);
proxy.start();
