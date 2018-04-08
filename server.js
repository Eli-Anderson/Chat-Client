var express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server);
server.listen(8000);
app.use(express.static(__dirname + '/'));
app.get('/', function (req, res) {
    res.sendfile(__dirname + "/index.html");
});

var userList = {}
var sockets = {}
var messageArray = [];
var lastMessage;
var lastUser;



let Users = {
	"users" : [],
	"emit" : function (func, arg) {
		for (let index in this.users) {
			sockets[this.users[index].id].emit(func, arg);
		}
	},
	"exists" : function (id) {
		for (let index in this.users) {
			if (this.users[index].id == id)
				return true;
		}
		return false;
	}
}

function readUserList(path) {
	let fs = require('fs')
	let os = require('os')
	fs.readFile(path, 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		for (let index in data.split(os.EOL)) {
			let nameAndPass = data.split(os.EOL)[index].split(" ");
			userList[nameAndPass[0]] = nameAndPass[1];
		}
	});
}

readUserList("users.txt");

io.sockets.on("connection", function (socket) {
	console.log("A client has connected: "+ socket.id+" "+socket.handshake.address);
	sockets[socket.id] = socket;
	socket.emit("getLoginDetails");

	socket.on("loginDetailsSent", ( obj )=>{
		// obj = {'username':xxxxxx, 'password':xxxxxx}
		if (userList[obj.username] == obj.password) {
			let user = {'username': obj.username, 'id': socket.id}
			Users.users.push(user);
			socket.emit("loginSuccessful");
			Users.emit("addUser", user);
			socket.emit("updateUsers", Users.users);
		} else {
			socket.emit("loginError");
		}

	});

	socket.on("disconnect", function () {
		console.log("A client has disconnected: "+socket.id+" "+socket.handshake.address);
		for (var i = Users.users.length - 1; i >= 0; i--) {
			if (Users.users[i].id == socket.id) {
				Users.users.splice(i, 1)
			}
		}
		Users.emit("removeUser", socket.id)

	})

	socket.on("sendMessage", function (data) {
		if (Users.exists(socket.id)) {
			lastMessage = data
			messageArray.push(data)
			Users.emit("receiveMessage", lastMessage)
		}
		
	})
})