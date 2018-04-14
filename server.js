let express = require("express"),
    app = express(),
    server = require("http").createServer(app),
    io = require("socket.io").listen(server);
server.listen(8088, "0.0.0.0");
app.use(express.static(__dirname + '/'));
app.get('/', function (req, res) {
    res.sendfile(__dirname + "/index.html");
});

let userList = {}
let sockets = {}
let messageArray = [];
let lastMessage;
let lastUser;



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
	},
	"getById" : function (id) {
		for (let index in this.users) {
			if (this.users[index].id == id)
				return this.users[index];
		}
		return null;
	},
}

function readUserList(path) {
	let fs = require('fs')
	let os = require('os')
	fs.readFile(path, 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		for (let index in data.split(os.EOL)) {
			let line = data.split(os.EOL)[index].split(" ");
			// username password color
			userList[line[0]] = {'password': line[1], 'color':line[2]};
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
		if (obj.password == userList[obj.username].password) {
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
		let user;
		for (let i = Users.users.length - 1; i >= 0; i--) {
			if (Users.users[i].id == socket.id) {
				user = Users.users[i];
				Users.users.splice(i, 1);
			}
		}
		Users.emit("removeUser", user);
	})

	socket.on("sendMessage", function (data) {
		if (Users.exists(socket.id)) {
			lastMessage = data
			lastMessage.color = userList[Users.getById(socket.id).username].color;
			messageArray.push(data)
			Users.emit("receiveMessage", lastMessage)
		}
		
	})
})