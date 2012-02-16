var httpProxy = require('http-proxy');

function blockRequest(req, res, proxy) {
    try {
        res.writeHead(404);
        res.end();
    } catch (error) {
        console.error("res.writeHead/res.end error: %s", error.message);
    }
}

httpProxy.createServer(function(req, res, proxy) {
    try {
        var hostHeader = req.headers.host.split(':');
        var host = hostHeader[0];
        var port = hostHeader.length > 1 ? hostHeader[1] : '80';

        var block = false;
        console.log("%s request for %s:%s.", block ? "BLOCK" : "PROXY", host, port);
        if (block) {
            blockRequest(req, res);
        } else {
            proxy.proxyRequest(req, res, {'host': host, 'port': port});
        }
    } catch (error) {
        console.error("Error handling request: %s", error.message);
    }
}).listen(8080);

