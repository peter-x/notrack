var util = require('util'),
    events = require('events'),
    http = require('http'),
    net = require('net'),
    url = require('url');


/* TODO handle keep-alive connections correctly */

/* options: listen_port, listen_host */
exports.Proxy = Proxy = function(filter, webserver, options) {
    events.EventEmitter.call(this);

    this.filter = filter;
    this.webserver = webserver;
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

Proxy.prototype.handleRequest = function(req, res) {
    var parsedUrl = url.parse(req.url);
    parsedUrl.protocol = 'http:';

    if (!parsedUrl.hostname) {
        /* copy host from Host:-header to url */
        var hostHeader = req.headers.host.split(':');
        parsedUrl.hostname = hostHeader[0];
        if (hostHeader.length > 1) {
            parsedUrl.port = hostHeader[1];
            parsedUrl.host = parsedUrl.hostname + ':' + parsedUrl.port;
        } else {
            delete parsedUrl.port;
            parsedUrl.host = parsedUrl.hostname;
        }
        parsedUrl = url.parse(url.format(parsedUrl));
    }

    if (parsedUrl.hostname == this.webserver.hostname) {
        /* TODO log this? */
        this.webserver.handleRequest(req, res);
        return;
    }

    var actionAndArgs = this.filter.filter_request(req, parsedUrl);
    this.emit('request', req.method, parsedUrl.href, actionAndArgs);
    
    if (actionAndArgs[0] == 'PROXY') {
        this.proxyRequest(req, res, parsedUrl);
    } else {
        this.blockRequest(req, res);
    }
}

Proxy.prototype.handleUpgrade = function(req, socket, head) {
    var hostname = req.url.split('/')[0];
    var parsedUrl = url.parse(url.format('https://' + hostname));

    var actionAndArgs = this.filter.filter_request(req, parsedUrl);
    this.emit('request', req.method, parsedUrl.href, actionAndArgs);

    if (actionAndArgs[0] == 'PROXY') {
        this.proxyConnectRequest(req, socket, head, parsedUrl);
    } else {
        socket.write("HTTP/1.1 404 Not found\r\n\r\n");
        socket.end();
    }
}

Proxy.prototype.blockRequest = function(req, res, proxy) {
    res.writeHead(404); /* TODO does not work for "connect resposes" (socket) */
    res.end();
}

Proxy.prototype.proxyRequest = function(req, res, parsedUrl) {
    var proxy = http.createClient(parsedUrl.port || '80', parsedUrl.hostname);
    /* TODO is || correct? */
    var relativeUrl = (parsedUrl.pathname || '/') + (parsedUrl.search || '') + (parsedUrl.hash || '');
    var proxyReq = proxy.request(req.method, relativeUrl, req.headers);

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

Proxy.prototype.proxyConnectRequest = function(req, socket, head, parsedUrl) {
    var proxyReq = net.createConnection(parsedUrl.port || '443', parsedUrl.hostname);
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

