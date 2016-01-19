
function getClient()
{
    var _http = require ("http");
    var _url = require("url");
    var _qs = require("querystring");
    var Promise = require("bluebird");

    var _handlers = [];
    
    function addHandler(handler) {
        _handlers.push(handler);
    }

    function get(url, data) {
        return getDelInternal(url, data, "get");  
    }

    function del(url, data) {
        return getDelInternal(url, data, "delete");
    }
    
    function put(url, data) {
        var request = _url.parse(url);
        request.method = "put";
        return sendRequest(request, JSON.stringify(data));
    }
    
    function post(url, data) {
        var request = _url.parse(url);
        request.method = "post";
        return sendRequest(request, JSON.stringify(data));
    }
    
    function sendRaw(request, data) {
        return sendRequest(request, data);
    }

    function getDelInternal(url, data, method) {
        if (data) {
            var query = _qs.stringify(data);
            url += "?" + query;
        }
        var request = _url.parse(url);
        request.method = method;
        return sendRequest(request);
    }

    function sendRequest(request, body) {
        var promise = new Promise(function (resolve) {
            
            _handlers.forEach(function (h) {
                if (h.onRequest) { h.onRequest(request, body); }    
            });
            
            var req = _http.request(request, function (response) {
                _handlers.forEach(function (h) {
                    if (h.onResponse) {
                        h.onResponse(response);
                    }
                });
                
                var body = "";
                response.on("data", function (chunk) {
                   body += chunk; 
                });
                response.on("end", function () {
                   response.body = body;
                   resolve(response);
                });
            });
            
            if (body) {
                req.write(body);
            }
            
            req.end();
        });
        
        return promise;
    }
    
    return {
        get: get,
        del: del,
        put: put,
        post: post,
        send: sendRaw
    };
}

module.exports = {
    getClient: getClient
};