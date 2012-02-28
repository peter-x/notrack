var util = require('util'),
    fs = require('fs');


exports.Logger = Logger = function(proxy) {
    var me = this;
    this.proxy = proxy;
    this.logfile = fs.createWriteStream('./log.txt', {flags: 'a'});
    proxy.on('request', function(req, pass) { me.logRequest(req, pass); });
}

Logger.prototype.logRequest = function(req, pass) {
    /* TODO wait for drain signal? */
    this.logfile.write(JSON.stringify({date: Date(), method: req.method, url: req.url}) + "\n");
}

