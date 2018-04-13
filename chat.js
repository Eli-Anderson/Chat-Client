$(document).ready(function(){
	let socket = io.connect();
	let userList = document.getElementById("user_list");
	let chatBox = document.getElementById("chat_box");
	let inputBox = document.getElementById("input_box");
	let sendButton = document.getElementById("send_button");

	let input_username = document.getElementById("username");
	let input_password = document.getElementById("password");
	let loginButton = document.getElementById("login_button");

	let username = "User"+Math.floor(Math.random()*10000000)
	let messageArray = [];
	let userArray = [];

	let ORIGINAL_CHAT_AREA_HEIGHT = $("#chat_area").height();

	let onResize = function () {

		// hide user list if window width is too small
		if ($("#chat_area").width() + $("#user_list_area").width() > $(window).width() - 30) {
			$("#user_list_area").hide();
		} else {
			$("#user_list_area").show();
		}

		// if window width is smaller than default chat area size,
		// sets the chat area to the width of the window
		if ($(window).width() < 480) {
			$("#chat_area").width("100%");
		} else {
			$("#chat_area").width(480);
		}
		if ($(window).height() < ORIGINAL_CHAT_AREA_HEIGHT) {
			$("#chat_box").height($(window).height() - ($("#chat_form").height() + 41));
			//@TODO: Also change user list height
		}
	}
	onResize();
	$(window).resize(onResize);
	

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
		para.innerHTML = ("Just now: " + data.username + ": "+text);
		para.time = data.timestamp;
		para.classList.add("chat_message");
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

	$(chat_box).resize(function (e) {
		console.log('resizing')
	});

	$("#chat_form").submit(function (e) {
		e.preventDefault();
		console.log("called")
		if (inputBox.value != ""){
			let d = new Date();

			let data = {
				"username":username,
				"text":inputBox.value,
				"timestamp": d.getTime(),

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
	function updateLoop() {
		let messages = document.getElementsByClassName("chat_message");
		for (let i=0; i<messages.length; i++) {
			let msg = messages[i];
			let d = new Date(msg.time)
			d = Math.floor((Date.now() - d.getTime()) / 60000);
			console.log(d);
			let relativeTime = ": ";
			if (d < 1) {
				relativeTime = "Just now: ";
			}
			else if (d < 60) {
				relativeTime = d + " min ago: ";
			} else {
				relativeTime = Math.floor(d / 60) + " hour ago: ";
			}
			msg.innerText = relativeTime + msg.innerText.substring(msg.innerText.indexOf(": ")+2);
		}
	}
	setInterval(updateLoop, 1000);
});