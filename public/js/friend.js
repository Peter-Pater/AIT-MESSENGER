// friend.js
const domain = "http://linserv1.cims.nyu.edu:14424";
// const domain = "http://127.0.0.1:3000";
const socket = io();
document.addEventListener("DOMContentLoaded", main);

function main(){
    const textArea = document.querySelector("#textArea");
    const self = document.querySelector("#self").value;
    const friend = document.querySelector("#friend").value;
    console.log(`${self} chatting with ${friend}`);
    const ajax = new Ajax(domain);
    let selfImg;
    let friendImg;
    let chatting;
    socket.emit("reportIn", `${self},${friend}`);
    ajax.ajaxPost("/selfImg", {username: self}, function(response){
        selfImg = response;
        ajax.ajaxPost("/friendImg", {username: friend}, function(response){
            friendImg = response;
            chatting = new Chatting(self, friend, selfImg, friendImg, ajax);
            chatting.initialize();
        });
    });
    textArea.addEventListener("click", function(){
        textArea.innerHTML = "";
        textArea.style.color = "black";
    });
    textArea.addEventListener("keyup", function(ev){
        if(ev.keyCode == 13){
            textArea.value = textArea.value.slice(0, textArea.value.length - 1);
            if (textArea.value.length > 0){
                document.querySelector("#send").click();
            }
		}
    });
    // chatting starts
    document.querySelector("#send").addEventListener("click", function(){
        if (textArea.value !== ""){
            const msg = textArea.value;
            textArea.value= "";
            chatting.addMyMsg(msg);
            const data = {
                "from": self,
                "to": friend,
                "message": msg
            }
            socket.emit("sendMsg", JSON.stringify(data));
        }
    });
    socket.on("system", function(msg){
        console.log(msg);
    });
    // socket.broadcast.emit("getMsg", `${data.to},${data.message}`);
    socket.on("getMsg_chat", function(msg){
        msg = msg.split(",");
        if (msg[0] === self){
            console.log(msg[1]);
            chatting.addFriendMsg(msg[1]);
        }
    });
}

class Chatting{
    constructor(self, friend, selfImg, friendImg, ajax){
        this.self = self;
        this.friend = friend;
        this.selfImg = selfImg;
        this.friendImg = friendImg;
        this.ajax = ajax;
    }

    initialize(){
        const data = {};
        data.username = this.self;
        data.friend = this.friend;
        let msgs;
        this.ajax.ajaxPost("/getHistory", data, function(response){
            msgs = JSON.parse(response);
            console.log(msgs);
            for (let i = 0; i < msgs.length; i ++){
                const func = this.addFriendMsg.bind(this);
                func(msgs[i]);
            }
        }.bind(this));
    }

    addFriendMsg(msg){
        const messageBox = document.createElement("div");
        messageBox.setAttribute("class", "friendMessageBox");
        const img = document.createElement("img");
        img.src = this.friendImg;
        messageBox.appendChild(img);
        const message = document.createElement("div");
        message.setAttribute("class", "message");
        if (msg.length > 48){
            message.style.width = "35%";
        }
        const text = document.createElement("p");
        text.appendChild(document.createTextNode(msg));
        text.style.fontSize = "14pt";
        message.appendChild(text);
        messageBox.appendChild(message);
        messageBox.style.height = message.style.height;
        document.querySelector("#msgArea").appendChild(messageBox);
        document.querySelector("#msgArea").scrollTop = document.querySelector("#msgArea").scrollHeight;
    }

    addMyMsg(msg){
        const messageBox = document.createElement("div");
        messageBox.setAttribute("class", "selfMessageBox");
        const img = document.createElement("img");
        img.src = this.selfImg;
        messageBox.appendChild(img);
        const message = document.createElement("div");
        message.setAttribute("class", "message");
        if (msg.length > 48){
            message.style.width = "35%";
        }
        const text = document.createElement("p");
        text.appendChild(document.createTextNode(msg));
        text.style.fontSize = "14pt";
        message.appendChild(text);
        messageBox.appendChild(message);
        messageBox.style.height = message.style.height;
        document.querySelector("#msgArea").appendChild(messageBox);
        document.querySelector("#msgArea").scrollTop = document.querySelector("#msgArea").scrollHeight;
    }
}

class Ajax{
    constructor(domain){
        this.domain = domain;
    }

    ajaxPost(url, data, callback){
        data = JSON.stringify(data);
        const req = new XMLHttpRequest();
        req.open("POST", this.domain + url, true);
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        req.addEventListener("load", function(){
            if (req.status >= 200 && req.status < 300){
                callback(req.responseText);
            }else{
                console.log("error", req.status);
            }
        });
        req.send("data=" + data);
    }

    ajaxGet(url, callback){
        const req = new XMLHttpRequest();
        req.open("GET", this.domain + url, true);
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        req.addEventListener("load", function(){
            if (req.status >= 200 && req.status < 300){
                const response = JSON.parse(req.responseText);
                callback(response);
            }else{
                console.log("error", req.status);
            }
        });
        req.send();
    }
}
