var _ = require("underscore");
var _proxyquire = require("proxyquire");
var _httpMock = {
    request: function () {}
};
_proxyquire("../lib/httpClientFactory", {
    "http": _httpMock,
    "@noCallThru": true
}); 
var _httpClientFactory;

describe("Basic HTTP calls", function () {
    
    beforeEach(function () {
        _httpClientFactory = require("../lib/httpClientFactory");
    });
    
    it("sends delete method for delete", function() {
        //Arrange
        setHttpResult({
            statusCode: 404
        });
        
        //Act
        var result = _httpClientFactory.getClient().del("http://www.tempuri.org/some/path", { query: "param1", q2: "p2" }).value();
        
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
    
    
    
    var _requestMock;
    function setHttpResult(response, body) {
        spyOn(_httpMock, "request").and.callFake(function (req, cb) {
            _requestMock = _.extend({ write: function() {}}, req);
            spyOn(_requestMock, "write");
            response.on = function(eventName, func) {
                if (eventName == "data") {
                    func(JSON.stringify(body));
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
    
    function expectRequestCalled(request, body) {
        expect(_httpMock.request)
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
    
    function expectRequestCalledRaw(request, body) {
        expect(_httpMock.request)
            .toHaveBeenCalledWith(jasmine.objectContaining(request), 
                jasmine.any(Function));
                
        if (body) {
            expect(_requestMock.write).toHaveBeenCalledWith(JSON.stringify(body));
        }
    }
});