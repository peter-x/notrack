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
    /* TODO string and date formatting */
    /* TODO remove tabs */
    this.logfile.write(Date() + "\t" + req.method + "\t" + req.url + "\n");
}

