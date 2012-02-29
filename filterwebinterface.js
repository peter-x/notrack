var util = require('util'),
    fs = require('fs');


exports.FilterWebInterface = FilterWebInterface = function(webserver, filter) {
    webserver.expose('rules', {
        get_all: function(res) {
            return filter.ruleList;
        }
    });
}
