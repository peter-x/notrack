var Proxy = require('./proxy').Proxy;
var Logger = require('./logger').Logger;

var config = {
    "listen_port": "8080",
    "listen_host": "127.0.0.1"
}

process.on('uncaughtException', function(err) {
    console.log('Uncaught exception: %s', err);
});

function request_filter(req) {
    if (req.url.indexOf('google') >= 0)
        return false;
    return true;
}

var proxy = new Proxy(request_filter, config);
var logger = new Logger(proxy);
proxy.start();
