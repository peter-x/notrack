var util = require('util'),
    fs = require('fs');

/* TODO listen for file change and save rules */

exports.Filter = Filter = function() {
    var me = this;
    this.ruleList = [];
    try {
        this.ruleList = JSON.parse(fs.readFileSync('./rules.json', 'utf-8'));
    } catch (e) {
        /* TODO report error? */
        this.ruleList = [];
    }

    this.rules = {};
    for (var i in this.ruleList) {
        var rule = this.ruleList[i];
        if (rule.action === undefined)
            rule.action = 'PROXY';
        if (rule.pattern === undefined)
            rule.pattern = '.*'; /* TODO really? */
        rule.pattern = RegExp(rule.pattern) /* TODO exceptions */
        if (this.rules[rule.action] === undefined)
            this.rules[rule.action] = [];
        this.rules[rule.action].push(rule);
    }
    if (this.rules['PROXY TEMP'] === undefined)
        this.rules['PROXY TEMP'] = [];
    if (this.rules['PROXY'] === undefined)
        this.rules['PROXY'] = [];
    if (this.rules['REDIRECT'] === undefined)
        this.rules['REDIRECT'] = [];
    if (this.rules['BLOCK'] === undefined)
        this.rules['BLOCK'] = [];
}

Filter.prototype.filter_request = function(req) {
    var m;
    m = this.find_match(req, this.rules['PROXY TEMP']);
    if (m !== null)
        return true;
    m = this.find_match(req, this.rules['PROXY']);
    if (m !== null)
        return true;
    m = this.find_match(req, this.rules['REDIRECT']);
    if (m !== null) {
        /* TODO */
        return true;
    }
    m = this.find_match(req, this.rules['BLOCK']);
    if (m !== null)
        return false;
    return true;
}

Filter.prototype.find_match = function(req, ruleList) {
    for (var i in ruleList) {
        var rule = ruleList[i];
        var m = rule.pattern.exec(req.url);
        if (m !== null) return [rule, m];
    }
    return null;
}
