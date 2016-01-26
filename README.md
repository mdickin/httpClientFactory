# Http Client Factory

This library is aimed at improving the development experience for REST-like calls in
NodeJS. It builds off the Node `http` library. It's inspired by the 
System.Net.Http.HttpClientFactory library in .NET. 

##Basic Usage

```javascript
var HttpClientFactory = require("http-client-factory")

//Issues a GET request to http://www.tempuri.org/my/endpoint?some=value&search=text
var promise = HttpClientFactory.getClient()
    .get("http://www.tempuri.org/my/endpoint", { some: "value", search: "text"})
  
promise.then(function (response) {
    //Do something with the response
})
.catch(function (error) {
    //Do something with the error
})
```

## API
`HttpClientFactory`
- `.getClient(AgentOptions)`
 - Returns `HttpClient`
 - `AgentOptions` is from `http` library
 - If `AgentOptions` is null, default settings are used (recommended)

HttpClient
- `.setAuthorization(scheme, parameter)`
 - Sets the Authorization header to `scheme parameter`
 - Returns `HttpClient`
- `.setBasicAuth(username, password)`
 - Sets the Authorization header to use basic authentication with the given credentials
 - Returns `HttpClient`
- `.addHandler(HttpClientHandler)`
 - Adds an HttpClientHandler to run on requests and responses
 - Request handlers are run in the order they're added. The first handler added will 
run first
 - Response handlers are run in the reverse order. The _last_ handler added will run first
 - Returns `HttpClient`
- `.get(url, RequestBody)`
 - Returns `Promise`
- `.post(url, RequestBody)`
 - Returns `Promise`
- `.put(url, RequestBody)`
 - Returns `Promise`
- `.delete(url, RequestBody)`
 - Returns `Promise`
- `.send(HttpRequest, RequestBody)`
 - Sends a [raw request](https://nodejs.org/api/http.html#http_http_request_options_callback)
 - Returns `Promise`

HttpClientHandler
- `onRequest: function (HttpRequest, body)`
 - Reads or modifies request and/or body as needed
 - Leave undefined if not needed
- `onResponse: function (HttpResponse)`
 - Reads or modifies response if needed
 - Leave undefined if not needed
 
RequestBody
- Normal JSON object
- For `.get()` and `.delete()` requests, this will be converted into query string parameters
- For `.put()` and `.post()` requests, this will be sent as JSON content


##Reading the Response
The response is a typical HTTP response as defined by the `http` library,
with the addition of a `body` property which contains the response content
(in string form).


##Handlers

### Setting authorization headers
```javascript
var handler = {
    onRequest: function (req) {
        req.headers.authorization = "sampleAuthScheme authValue";
    }   
}

//Issues a POST request to the URL 
//with the authorization header set to "sampleAuthScheme authValue"
//and a JSON payload  of { "postdata": "goes here" }
HttpClientFactory.getClient()
    .addHandler(handler)
    .post("http://www.tempuri.org/my/endpoint", { postdata: "goes here" })
```

As of v0.2.0, this can be accomplished by calling 
`client.setAuthorization("sampleAuthScheme", "authValue")`

### Logging request/response data
```javascript
var traceLogHandler = {
    onRequest: function (req, body) {
        var logger = require("myTraceLogger")
        logger.logRequest(req.href, req.headers, body)
    },
    onResponse: function (response) {
        var logger = require("myTraceLogger")
        logger.logResponse(response.headers, response.body)
    } 
}

//Logs both request and response data to myTraceLogger
HttpClientFactory.getClient()
    .addHandler(traceLogHandler)
    .post("http://www.tempuri.org/my/endpoint", { postdata: "goes here" })
```

##Promises

`httpClientFactory` uses the [bluebird](http://www.npmjs.org/package/bluebird) library for promises