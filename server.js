// TODO: HANDLE SAME USERNAME CASE //
var http = require("http");
//ARRAY HOLDING ROUTES
var routes = [];
// ARRAY HOLDING USERNAMES
var usernames = [];
// ARRAY HOLDING REPONSE OBJECTS
var clientList = [];
// INDEX & USERNAME ROUTE

// user=([%20]*\w+[%20]*)
addRoute("GET", /\?user=[^&$#@!]+/,/(user=)([^&$#@!]+)/,function(req, res, data) {
	if(usernames.indexOf(data.user) != -1){
		clientList.push(res);
		res.name = data.user;
		//console.log("within if, res.name is "+ res.name);
	} else {
		usernames.push(data.user);
		//console.log("in else, data.user is"+ data.user);
		data.event = "enter";
		dataStr = JSON.stringify(data);
		res.write(dataStr);
		broadcast(dataStr);
		res.end();
	}
});
// MESSAGE ROUTE
addRoute("GET", /\/\?user=.+&message=[^&]+/,/user=(([^&$#@!])+)&message=(.+)/,function(req, res, data) {
	res.name = data.user;
	// REPLACE ASCII CODE
	data.message = data.message.split('%20').join(' ').split('%27').join('\'');
	data.event = "message";
	var dataStr = JSON.stringify(data);
	broadcast(dataStr);
	res.end();
});
// CREATE SERVER
var server = http.createServer(function(request, response) {
	response.writeHead(200, {"Content-Type": "text/html", "Access-control-allow-origin": "*"});
	resolve(request,response);
	// ON WINDOW OR BROWSER DISCONNECT
	request.on("close",function(){
		var dataStr = JSON.stringify({
			user: response.name,
			event: "leave"
		});
		// REMOVE RESPONSE OBJECT
		clientList.splice(clientList.indexOf(response),1);
		// ANNOUNCE DISCONNECT TO OTHER USERS
		broadcast(dataStr);
		response.end();
	});
});
function broadcast(dataObj){
	// WRITE TO ALL USERS CONNECTED
	clientList.forEach(function(participant) {
		participant.write(dataObj);
		console.log("client name: "+dataObj);
		participant.end();
	});
	clientList = [];
}

function addRoute(method,url,data,handler){
	routes.push(
		{
			method: method,
			url: url,
			data: data,
			handler: handler
		}
	);
}
function resolve(req,res){
	var queryString = req.url;
	console.log("queryString is " + queryString);
	for(var i = 0; i < routes.length; i++){
		if(routes[i].method == req.method && routes[i].url.test(queryString)){
			queryData = {
				user:'',
				message:''
			};
			var regex = routes[i].data;
				console.log("queryString is "+queryString);
				//console.log(regex.exec(queryString)[2]);
			var userMessageArr=regex.exec(queryString);
			queryData.user = userMessageArr[1];
			queryData.message = userMessageArr[userMessageArr.length-1];
				//console.log("queryData.message is " + queryData.message);
				console.log("queryString, when regexed, is "+userMessageArr);
			routes[i].handler(req,res,queryData);
		}
	}
}
server.listen(8000);
