$(document).ready(function(){
	var socket = io.connect();
	var userList = document.getElementById("user_list");
	var chatBox = document.getElementById("chat_box");
	var inputBox = document.getElementById("input_box");
	var sendButton = document.getElementById("send_button");

	var input_username = document.getElementById("username");
	var input_password = document.getElementById("password");
	var loginButton = document.getElementById("login_button");

	var username = "User"+Math.floor(Math.random()*10000000)
	var messageArray = [];
	var userArray = [];

	socket.on("getLoginDetails", function (data) {
		document.getElementById("login_popup").style.display = "block";
	})

	socket.on("loginSuccessful", function () {
		document.getElementById("login_popup").style.display = "none";
		console.log("Successfully logged in");
	});

	socket.on("loginError", function () {
		document.getElementById("login_popup_text").innerText = "Login Failure";
		console.log("An error occurred when logging in");
	});

	socket.on("receiveMessage", function (data) {
		console.log("new message received")
		// data = {name, time stamp, message}
		let para = document.createElement("p");
		let text = getParsedText(data.text);
		para.innerHTML = (data.timestamp + " " +data.username + ": "+text);
		para.class = "chat_message";
		chatBox.appendChild(para);
		
		chatBox.scrollTop = chatBox.scrollHeight;
	});
	socket.on("updateUsers", function (data) {
		for (let index in data) {
			addUser(data[index]);
		}
	});
	socket.on("addUser", function (data) {
		addUser(data);
	});

	$("#chat_form").submit(function (e) {
		e.preventDefault();
		console.log("called")
		if (inputBox.value != ""){
			var d = new Date();

			var data = {
				"username":username,
				"text":inputBox.value,
				"timestamp": d.getHours()+":"+d.getMinutes()+":"+d.getSeconds(),

			}
			socket.emit("sendMessage", data)
			inputBox.value = ""
		}
		return false
	})

	$("#login_form").submit(function (e) {
		e.preventDefault();
		console.log("login attempted")
		if (input_username.value.length >= 3) {
			username = input_username.value;
		}
		socket.emit("loginDetailsSent", {'username':username, 'password':input_password.value})
	});

	function addUser(data) {
		// data = {username, socket id}
		for (let index in userArray) {
			if (userArray[index].id == data.id) {
				return; // prevent this user from being added twice
			}
		}
		console.log("new user joined", data)
		userArray.push(data);
		let para = document.createElement("p");
		para.innerText = data.username;
		userList.appendChild(para);
		userList.scrollTop += userList.scrollHeight;
	}

	function getParsedText(text) {
		let result = "";
		let regex = /(((http|ftp|https):\/\/)|www\.|WWW\.)([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?/;
		// checks for URLs in the text
		let match = text.match(regex);
		let substr = text;
		while (match != null) {
			match = match[0];
			let index = substr.search(regex);
			if (match.substring(match.length-5, match.length).search(/\.png|\.jpg|\.jpeg|\.gif|\.gifv/) >= 0) {
				// is an image
				result += substr.substring(0, index) +
					"<image src=" + match + " target='_blank'>"
			} else {
				// is a link
				result += substr.substring(0, index) + 
				"<a href=" + match + " target='_blank'>"+match+"</a>"
			}
			substr = substr.substring(index+match.length, substr.length);
			match = substr.match(regex);
			console.log(match)
		}
		result += substr;
		return result;
	}
});