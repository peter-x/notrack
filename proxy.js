var util = require('util'),
    events = require('events'),
    http = require('http'),
    net = require('net');


/* TODO handle keep-alive connections correctly */

exports.proxy = function Proxy(request_filter, options) {
    events.EventEmitter.call(this);

    this.request_filter = request_filter;
    this.options = options;
}

util.inherits(Proxy, events.EventEmitter);

Proxy.prototype.start = function() {
    var proxy = http.createServer();
    var me = this;
    proxy.on('request', function(req, res) { me.handleRequest(req, res); });
    proxy.on('upgrade', function(req, socket, head) { me.handleUpgrade(req, socket, head); });
    proxy.listen(this.options.listen_port, this.options.listen_host);
}

Proxy.prototype.handleRequest = function(req, res, request_filter) {
    var hostHeader = req.headers.host.split(':');
    var host = hostHeader[0];
    var port = hostHeader.length > 1 ? hostHeader[1] : '80';

    if (!host || !port) return;

    /* TODO send the actual url to request_filter (host from Host-header and
     * uri from request header */
    var pass = this.request_filter(req);
    
    emit('request', req, pass);
    
    if (pass) {
        this.proxyRequest(req, res, {host: host, port: port});
    } else {
        this.blockRequest(req, res);
    }
}

Proxy.prototype.handleUpgrade = function(req, socket, head) {
    var hostHeader = req.url.split(':');
    var host = hostHeader[0];
    var port = hostHeader.length > 1 ? hostHeader[1] : '80';

    if (!host || !port) return;
    var pass = this.request_filter(req);
    if (pass) {
        this.proxyConnectRequest(req, socket, head, {host: host, port: port});
    } else {
        this.blockRequest(req, socket);
    }
}

Proxy.prototype.blockRequest = function(req, res, proxy) {
    res.writeHead(404); /* TODO does not work for "connect resposes" (socket) */
    res.end();
}

Proxy.prototype.proxyRequest = function(req, res, options) {
    var proxy = http.createClient(options.port, options.host);
    var proxyReq = proxy.request(req.method, req.url, req.headers);

    /* TODO listen for drain signals */
    proxyReq.on('response', function(proxyRes) {
        res.writeHeader(proxyRes.statusCode, proxyRes.headers);

        proxyRes.on('data', function(data) {
            res.write(data, 'binary');
        });

        proxyRes.on("end", function() {
            res.end();
        });
    });

    req.on("data", function (chunk) {
        proxyReq.write(chunk, 'binary');
    });

    req.on("end", function () {
        proxyReq.end();
    });
}

Proxy.prototype.proxyConnectRequest = function(req, socket, head, options) {
    var proxyReq = net.createConnection(options.port, options.host);
    proxyReq.on('connect', function() {
        /* TODO see how to do this correctly */
        socket.write('HTTP/1.1 200 OK\r\n\r\n');
        if (head.length !== 0) {
            proxyReq.write(head, 'binary');
        }
    });

    /* TODO listen for drain signals */
    proxyReq.on('data', function(data) {
        socket.write(data, 'binary');
    });
    proxyReq.on('end', function() {
        socket.end();
    });

    socket.on("data", function (chunk) {
        proxyReq.write(chunk, 'binary');
    });

    socket.on("end", function () {
        proxyReq.end();
    });
}

