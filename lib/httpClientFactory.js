
function getClient(agentOptions)
{
    var _url = require("url");
    var _qs = require("querystring");
    var Promise = require("bluebird");

    var _handlers = [];
    
    function addHandler(handler) {
        _handlers.push(handler);
        return this;
    }

    function get(url, data) {
        return getDeleteInternal(url, data, "get");  
    }

    function del(url, data) {
        return getDeleteInternal(url, data, "delete");
    }
    
    function put(url, data) {
        var request = getRequest(url);
        request.method = "put";
        return sendRequest(request, data);
    }
    
    function post(url, data) {
        var request = getRequest(url);
        request.method = "post";
        return sendRequest(request, data);
    }
    
    function sendRaw(request, data) {
        return sendRequest(request, data);
    }

    function getDeleteInternal(url, data, method) {
        if (data) {
            var query = _qs.stringify(data);
            url += "?" + query;
        }
        var request = getRequest(url);
        request.method = method;
        return sendRequest(request);
    }
    
    function getRequest(url) {
        var request = _url.parse(url);
        request.headers = {
            "Content-Type": "application/json"
        }
        
        if (agentOptions) {
            var agent = getProtocol(request).Agent;
            request.agent = new agent(agentOptions);
        }
        
        return request;
    }
    
    function getProtocol(request) {
        return request.protocol == "https:"
                ? require("https")
                : require("http");
    }

    function sendRequest(request, body) {
        var promise = new Promise(function (resolve) {
            
            _handlers.forEach(function (h) {
                if (h.onRequest) { h.onRequest(request, body); }    
            });
            
            var req = getProtocol(request).request(request, function (response) {
                
                var body = "";
                response.on("data", function (chunk) {
                   body += chunk; 
                });
                response.on("end", function () {
                   response.body = body;
                    _handlers.forEach(function (h) {
                        if (h.onResponse) {
                            h.onResponse(response);
                        }
                    });
                   resolve(response);
                });
            });
            
            if (body) {
                if (body.constructor !== String) {
                    body = JSON.stringify(body);
                }
                req.write(body);
            }
            
            req.end();
        });
        
        return promise;
    }
    
    return {
        get: get,
        delete: del,
        put: put,
        post: post,
        send: sendRaw,
        addHandler: addHandler
    };
}

module.exports = {
    getClient: getClient
};