
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
    
    function addHeader(key, value) {
        
        addHandler({
            onRequest: function (req) {
                if (!key || key.length === 0) throw new Error("Header key is required")
                req.headers[key] = value
            }
        })
        return this
    }
    
    function setAuthorization(scheme, value) {
        addHandler({
            onRequest : function(req) {
                req.headers.authorization = scheme + " " + value
            }
        })
        return this;
    }
    
    function setBasicAuth(username, password) {
        var param = username + ":" + password;
        setAuthorization("Basic", new Buffer(param).toString("base64"))
        return this;
    }

    function get(url, data) {
        return queryStringInternal(url, data, "get");  
    }

    function del(url, data) {
        return queryStringInternal(url, data, "delete");
    }

    function head(url, data) {
        return queryStringInternal(url, data, "head");  
    }

    function options(url, data) {
        return queryStringInternal(url, data, "options");
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
    
    function patch(url, data) {
        var request = getRequest(url);
        request.method = "patch";
        return sendRequest(request, data);
    }
    
    function sendRaw(request, data) {
        return sendRequest(request, data);
    }

    function queryStringInternal(url, data, method) {
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
        var promise = new Promise(function (resolve, reject) {
            
            _handlers.forEach(function (h) {
                if (h.onRequest) { h.onRequest(request, body); }    
            });
            
            if (body) {
                if (body.constructor !== String) {
                    body = JSON.stringify(body);
                }
                
                if (!request.headers) {
                    request.headers = {}
                }
                
                request.headers['Content-Length'] = body.length;
            }
            
            var req = getProtocol(request).request(request, function (response) {
                
                var body = "";
                response.on("data", function (chunk) {
                   body += chunk; 
                });
                response.on("end", function () {
                   response.body = body;
                   for (var i = _handlers.length - 1; i >= 0; i--) {
                       var h = _handlers[i];
                       if (h.onResponse) {
                            h.onResponse(response);
                       }
                   }
                   resolve(response);
                });
            });
            
            if (body) {
                req.write(body);
            }
            
            req.on("error", (err) => {
                reject(err)
            })
            req.end();
        });
        
        return promise;
    }
    
    return {
        get: get,
        delete: del,
        head: head,
        options: options,
        put: put,
        post: post,
        patch: patch,
        send: sendRaw,
        addHeader: addHeader,
        setAuthorization: setAuthorization,
        setBasicAuth: setBasicAuth,
        addHandler: addHandler
    };
}

module.exports = {
    getClient: getClient
};