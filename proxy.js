var sys = require('sys'),
    http = require('http'),
    net = require('net');

function blockRequest(req, res, proxy) {
    res.writeHead(404);
    res.end();
}

function proxyRequest(req, res, options) {
    var proxy = http.createClient(options.port, options.host);
    var proxyReq = proxy.request(req.method, req.url, req.headers);

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

function proxyConnectRequest(req, socket, head, options) {
    var proxyReq = net.createConnection(options.port, options.host);
    proxyReq.on('connect', function() {
        /* TODO see how to do this correctly */
        socket.write('HTTP/1.1 200 OK\r\n\r\n');
        if (head.length !== 0) {
            proxyReq.write(head, 'binary');
        }
    });

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

function handleRequest(req, res, request_filter) {
    var hostHeader = req.headers.host.split(':');
    var host = hostHeader[0];
    var port = hostHeader.length > 1 ? hostHeader[1] : '80';

    if (!host || !port) return;
    /* TODO send the actual url to request_filter (host from Host-header and
     * uri from request header */
    var pass = request_filter(req);
    if (pass) {
        proxyRequest(req, res, {host: host, port: port});
    } else {
        blockRequest(req, res);
    }
}

function handleUpgrade(req, socket, head, request_filter) {
    var hostHeader = req.url.split(':');
    var host = hostHeader[0];
    var port = hostHeader.length > 1 ? hostHeader[1] : '80';

    if (!host || !port) return;
    var pass = request_filter(req);
    if (pass) {
        proxyConnectRequest(req, socket, head, {host: host, port: port});
    } else {
        blockRequest(req, socket);
    }
}

/* TODO handle keep-alive connections correctly */

exports.start = function start(request_filter, options) {
    var proxy = http.createServer();
    proxy.on('request', function(req, res) { handleRequest(req, res, request_filter); });
    proxy.on('upgrade', function(req, socket, head) { handleUpgrade(req, socket, head, request_filter); });
    proxy.listen(options.listen_port, options.listen_host);
}
