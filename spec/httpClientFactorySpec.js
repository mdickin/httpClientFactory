var _ = require("underscore");
var _proxyquire = require("proxyquire");
var _httpMock = {
    request: function () {}
};
var _httpsMock = {
    request: function () {}
};
_proxyquire("../lib/httpClientFactory", {
    "http": _httpMock,
    "https": _httpsMock,
    "@noCallThru": true
}); 
var _httpClientFactory;

    
beforeEach(function () {
    _httpClientFactory = require("../lib/httpClientFactory");
});

describe("Basic HTTP calls", function () {
    
    it("sends delete method for delete", function() {
        //Arrange
        setHttpResult({
            statusCode: 404
        });
        
        //Act
        var result = _httpClientFactory.getClient().delete("http://www.tempuri.org/some/path", { query: "param1", q2: "p2" }).value();
        
        //Assert
        expect(result.statusCode).toBe(404);
        expectRequestCalled({
            protocol: "http:",
            host: "www.tempuri.org",
            pathname: "/some/path",
            query: "query=param1&q2=p2",
            method: "delete"
        });
    });
    
    it("sends get method for get", function() {
        //Arrange
        setHttpResult({
            statusCode: 200
        });
        
        //Act
        var result = _httpClientFactory.getClient().get("http://www.tempuri.org/some/path", { query: "param1", q2: "p2" }).value();
        
        //Assert
        expect(result.statusCode).toBe(200);
        expectRequestCalled({
            protocol: "http:",
            host: "www.tempuri.org",
            pathname: "/some/path",
            query: "query=param1&q2=p2",
            method: "get"
        });
    });
    
    it("sends put method and body for put", function () {
       //Arrange
        var response = {
            some: "content"
        };
        setHttpResult({
            statusCode: 200,
        }, response);
        var request = {
                req: "something",
                obj: {
                    deep: "request"
                }
            };
        
       //Act
       var result = _httpClientFactory.getClient().put(
           "http://www.tempuri.org/some/path",
            request).value();
       
       //Assert 
       expect(result.statusCode).toBe(200);
       expect(_.isEqual(JSON.parse(result.body), response)).toBe(true);
       expectRequestCalled({
            protocol: "http:",
            host: "www.tempuri.org",
            pathname: "/some/path",
            method: "put"
       }, request);
    });
    
    it("sends put method and body for post", function () {
       //Arrange
        var response = {
            some: "content"
        };
        setHttpResult({
            statusCode: 200,
        }, response);
        var request = {
                req: "something",
                obj: {
                    deep: "request"
                }
            };
        
       //Act
       var result = _httpClientFactory.getClient().post(
           "http://www.tempuri.org/some/path",
            request).value();
       
       //Assert 
       expect(result.statusCode).toBe(200);
       expect(_.isEqual(JSON.parse(result.body), response)).toBe(true);
       expectRequestCalled({
            protocol: "http:",
            host: "www.tempuri.org",
            pathname: "/some/path",
            method: "post"
       }, request);
    });
    
    it("allows sending of any content", function () {
       //Arrange
        var response = {
            some: "content"
        };
        setHttpResult({
            statusCode: 200,
        }, response);
        var request = {
            method: "post"
        }
        
       //Act
       var result = _httpClientFactory.getClient().send(request,
            "this is not json").value();
       
       //Assert 
       expect(result.statusCode).toBe(200);
       expect(_.isEqual(JSON.parse(result.body), response)).toBe(true);
       expectRequestCalled(request, "this is not json");
    });
    
    it("allows sending requests over HTTPS", function () {
        var response = {
            some: "content"
        };
        setHttpResult({
            statusCode: 200,
        }, response, true);
        var request = {
            method: "post"
        }
        
       //Act
       var result = _httpClientFactory.getClient().post(
           "https://www.tempuri.org/some/path", request).value();
       
       //Assert 
       expect(result.statusCode).toBe(200);
       expectRequestCalled({
            protocol: "https:",
            host: "www.tempuri.org",
            pathname: "/some/path",
            method: "post"
       }, request, true)
    })
});

describe("HTTP agent", function () {
    it("allows passing agent information", function () {
        //Arrange
        setHttpResult({ statusCode: 200 }, null, true);
        var agentConfig = {
            keepAlive: true
        }
        
        //Act
        _httpClientFactory.getClient(agentConfig).post(
           "https://www.tempuri.org/some/path").value();
        
        //Assert
        expectRequestCalled({
            agent: jasmine.objectContaining({
                keepAlive: true
            })
        }, null, true)
    })  
})

describe("handlers", function () {
    
    it("allows handlers to modify the request header", function () {
        //Arrange
        setHttpResult({ statusCode: 200})
        var handler = {
            onRequest: function (req, body) {
                req.headers.authorization = "someAuth authValue"
            }
        };
        
        //Act
        _httpClientFactory.getClient()
            .addHandler(handler)
            .get("testuri");
        
        //Assert
        expectRequestCalled({
            headers: {
                authorization: "someAuth authValue",
                "Content-Type": "application/json"
            }
        })
        
    });
    
    it("allows handlers to modify the request body", function () {
        //Arrange
        setHttpResult({ statusCode: 200})
        var handler = {
            onRequest: function (req, body) {
                body.test = "extra value"
            }
        };
        
        //Act
        _httpClientFactory.getClient()
            .addHandler(handler)
            .post("testuri", {
                data: 5
            });
        
        //Assert
        expectRequestCalled({}, {
            data: 5,
            test: "extra value"
        })
        
    });
    
    it("allows handlers to modify the response header", function () {
        //Arrange
        setHttpResult({ statusCode: 200, headers: {}})
        var handler = {
            onResponse: function (req, body) {
                req.headers.testVal = "updated header"
            }
        };
        
        //Act
        var result = _httpClientFactory.getClient()
            .addHandler(handler)
            .get("testuri").value();
        
        //Assert
        expect(result.headers.testVal).toBe("updated header")
        
    });
    
    it("allows handlers to modify the response body", function () {
        //Arrange
        setHttpResult({ statusCode: 200}, "return value")
        var handler = {
            onResponse: function (req) {
                req.body += "-extra value"
            }
        };
        
        //Act
        var result = _httpClientFactory.getClient()
            .addHandler(handler)
            .post("testuri", {
                data: 5
            }).value();
        
        //Assert
        expect(result.body).toBe("return value-extra value")
        
    })
})
    
var _requestMock;
function setHttpResult(response, body, isHttps) {
    var mock = isHttps ? _httpsMock : _httpMock;
    var responseBody;
    if (body) {
        responseBody = body.constructor === String ? body : JSON.stringify(body)
    }
    spyOn(mock, "request").and.callFake(function (req, cb) {
        _requestMock = _.extend({ write: function() {}}, req);
        spyOn(_requestMock, "write");
        response.on = function(eventName, func) {
            if (eventName == "data") {
                func(responseBody);
                return;
            }
            if (eventName == "end") {
                func();
            }
        };
        cb(response);
        _requestMock.end = function() {};
        return _requestMock;
    });
}

function expectRequestCalled(request, body, isHttps) {
    var mock = isHttps ? _httpsMock : _httpMock;
    expect(mock.request)
        .toHaveBeenCalledWith(jasmine.objectContaining(request), 
            jasmine.any(Function));
            
    if (body) {
        var bodyAsString;
        if (body.constructor === String) {
            bodyAsString = body;
        } else {
            bodyAsString = JSON.stringify(body);
        }
        expect(_requestMock.write).toHaveBeenCalledWith(bodyAsString);
    }
}