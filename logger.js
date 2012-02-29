var util = require('util'),
    fs = require('fs');


exports.Logger = Logger = function(proxy) {
    var me = this;
    this.proxy = proxy;
    this.logfile = fs.createWriteStream('./log.txt', {flags: 'a'});
    proxy.on('request', function(req, pass) { me.logRequest(req, pass); });
}

Logger.prototype.logRequest = function(method, url, actionAndArgs) {
    /* TODO wait for drain signal? */
    this.logfile.write(JSON.stringify({date: Date(), method: method, url: url, action: actionAndArgs}) + "\n");
}

