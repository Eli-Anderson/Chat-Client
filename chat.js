$(document).ready(function(){
	let socket = io.connect();
	let userList = document.getElementById("user_list");
	let chatArea = document.getElementById("chat_area");
	let chatBox = document.getElementById("chat_box");
	let inputBox = document.getElementById("input_box");
	let sendButton = document.getElementById("send_button");

	let input_username = document.getElementById("username");
	let input_password = document.getElementById("password");
	let loginButton = document.getElementById("login_button");

	let username = "";
	let messageArray = [];
	let userArray = [];

	let chatAreaSize = {
		'width': $("#chat_area").width(),
		'height': $("#chat_area").height(),
	}

	$("#chat_area").resize(function () {
		chatAreaSize.width = $("#chat_area").width();
		chatAreaSize.height = $("#chat_area").height();
	});

	let onResize = function () {
		// update the stored chatAreaSize, to make sure we can go
		// back to the user's modified size after the window is
		// restored to a size greater than our default
		if (chatArea.style.height != "100%") {
			// the window is not smaller than the default chat area height
			chatAreaSize.height = $("#chat_area").height();
		}
		if (chatArea.style.width != "100%") {
			// the window is not smaller than the default chat area width
			chatAreaSize.width = $("#chat_area").width();
		}



		// hide user list if window width is too small
		if (chatAreaSize.width + $("#user_list_area").width() > $(window).width() - 30) {
			$("#user_list_area").hide();
		} else {
			$("#user_list_area").show();
		}

		// if window width is smaller than default chat area width,
		// sets the chat area to the width of the window
		if ($(window).width() < chatAreaSize.width + 10) {
			$("#chat_area").width("100%");
		} else {
			$("#chat_area").width(chatAreaSize.width);
		}


		// if window height is smaller than default chat area height
		// (user_list_area and chat_area), sets the container area
		// and its child divs to the height of the window
		if ($(window).height() < Math.max(590, chatAreaSize.height)) {
			$("#chat_area").height("100%");
			$("#user_list_area").height("100%");
			$("#container").height("calc(100% - 10px)");
		} else {
			$("#chat_area").height(chatAreaSize.height);
			$("#user_list_area").height(580);
			$("#container").height(580);
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
		// data = {username, time stamp, message}
		let div = document.createElement("div");
		let pUsername = document.createElement("p");
		let pContent = document.createElement("p");
		let pTimestamp = document.createElement("p");

		pUsername.innerText = data.username;
		pUsername.classList.add("msg_username");

		pContent.innerHTML = getParsedText(data.text);
		pContent.classList.add("msg_content");

		pTimestamp.innerText = "0m";
		pTimestamp.classList.add("msg_timestamp");

		div.time = data.timestamp;
		div.classList.add("chat_message");
		div.appendChild(pUsername);
		div.appendChild(pContent);
		div.appendChild(pTimestamp);
		
		chatBox.appendChild(document.createElement("br"));
		chatBox.appendChild(div);
		
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
			let timestamp = messages[i].querySelector(".msg_timestamp");
			let d = new Date(messages[i].time)
			d = Math.floor((Date.now() - d.getTime()) / 60000);
			let relativeTime = ""
			if (d < 60) {
				relativeTime = d + "m";
			} else if (d < 60 * 24) {
				relativeTime = Math.floor(d / 60) + "h";
			} else {
				relativeTime = Math.floor(d / (60 * 24)) + "d";
			}
			timestamp.innerText = relativeTime;
		}
	}
	setInterval(updateLoop, 1000);
});