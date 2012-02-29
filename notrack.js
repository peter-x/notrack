var Proxy = require('./proxy').Proxy;
var WebServer = require('./webserver').WebServer;
var Logger = require('./logger').Logger;
var Filter = require('./filter').Filter;
var FilterWebInterface = require('./filterwebinterface').FilterWebInterface;

var config = {
    "listen_port": "8080",
    "listen_host": "127.0.0.1"
}

process.on('uncaughtException', function(err) {
    console.log('Uncaught exception: %s', err);
});

var webserver = new WebServer();
var filter = new Filter();
var proxy = new Proxy(filter, webserver, config);
var logger = new Logger(proxy);
var filterWebInterface = new FilterWebInterface(webserver, filter);
proxy.start();
