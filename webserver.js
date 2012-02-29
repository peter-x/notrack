var util = require('util'),
    url = require('url'),
    fs = require('fs');


exports.WebServer = WebServer = function() {
    this.hostname = 'notrack.local';
    this.exposedObjects = {};
}

WebServer.prototype.expose = function(context, object) {
    /* TODO error if already exists */
    this.exposedObjects[context] = object;
}

WebServer.prototype.returnAsJSON = function(res, data) {
    var data = JSON.stringify(data);
    res.writeHead(200, {'Content-Type': 'application/json',
                        'Content-Length': data.length});
    res.end(data);
}

WebServer.prototype._handleRequestInternal = function(res, obj, method, data) {
    var params = (data == '' || data === undefined) ? [] : JSON.parse(data);
    params = [res].concat(params);
    var result = obj[method].apply(obj, params);
    if (result !== null) {
        this.returnAsJSON(res, result);
    }
}

WebServer.prototype.handleRequest = function(req, res) {
    if (req.method != 'POST' && req.method != 'GET' && req.method != 'HEAD') {
        res.writeHead(405);
        res.end();
        return;
    }
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname.split('/');
    if (path.length >= 1 && path[0] == '')
        path.shift();
    if (path.length < 2) {
        res.writeHead(404);
        res.end();
        return;
    }
    var context = path[0];
    var method = path[1];
    var obj = this.exposedObjects[context];
    if (obj === undefined || obj[method] === undefined) {
        res.writeHead(404);
        res.end();
        return;
    }
    if (req.method == 'HEAD') {
        res.writeHead(200);
        res.end();
    } else if (req.method == 'GET') {
        this._handleRequestInternal(res, obj, method, parsedUrl.query.params);
    } else {
        var jsonString = '';
        req.on('data', function(chunk) { jsonString += chunk; });
        req.on('end', function() {
            this._handleRequestInternal(res, obj, method, jsonString);
        });
    }
}
