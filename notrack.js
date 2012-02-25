var proxy = require('./proxy');

var config = {
    "listen_port": "8080",
    "listen_host": "127.0.0.1"
}

process.on('uncaughtException', function(err) {
    console.log('Uncaught exception: %s', err);
});

function request_filter(req) {
    console.log("%s %s", req.method, req.url);
    if (req.url.indexOf('google') >= 0)
        return false;
    return true;
}

proxy.start(request_filter, config);

