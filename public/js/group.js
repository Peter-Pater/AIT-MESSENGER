// group.js
const domain = "http://linserv1.cims.nyu.edu:14424";
// const domain = "http://127.0.0.1:3000";
const socket = io();

document.addEventListener("DOMContentLoaded", main);

function main(){
    const textArea = document.querySelector("#textArea");
    const self = document.querySelector("#self").value;
    console.log(`${self} enters the group`);
    const ajax = new Ajax(domain);
    let selfImg;
    let chatting;
    socket.emit("reportIn", `${self},2`);
    ajax.ajaxPost("/selfImg", {username: self}, function(response){
        selfImg = response;
        console.log(selfImg);
        chatting = new Chatting(self, selfImg, ajax);
        chatting.initialize();
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
    document.querySelector("#send").addEventListener("click", function(){
        if (textArea.value !== ""){
            const msg = textArea.value;
            textArea.value= "";
            chatting.addMyMsg(msg);
            const data = {
                from: self,
                message: msg
            }
            socket.emit("sendGroupMsg", JSON.stringify(data));
        }
    });
    socket.on("system", function(msg){
        console.log(msg);
    });
    socket.on("getGroupMsg", function(data){
        data = JSON.parse(data);
        ajax.ajaxPost("/friendImg", {username: data.from}, function(response){
            chatting.addFriendMsg(data.message, response, data.from);
        });
    });
}

class Chatting{
    constructor(self, selfImg, ajax){
        this.self = self;
        this.selfImg = selfImg;
        this.ajax = ajax;
    }

    initialize(){
        const data = {};
        this.ajax.ajaxGet("/getGroupHistory", function(response){
            console.log(response);
            response.forEach(function(value){
                if (value[0] === this.self){
                    this.addMyMsg(value[1]);
                }else if(value[0] === "System"){
                    this.addFriendMsg(value[1], "/img/bot.png", "System");
                }else{
                    this.ajax.ajaxPost("/friendImg", {username: value[0]}, function(response){
                        this.addFriendMsg(value[1], response, value[0]);
                    }.bind(this));
                }
            }.bind(this));
        }.bind(this));
    }

    addFriendMsg(msg, friendImg, friendName){
        const messageBox = document.createElement("div");
        messageBox.setAttribute("class", "groupMessageBox");
        const member = document.createElement("div");
        member.setAttribute("class", "group_member");
        const img = document.createElement("img");
        img.src = friendImg;
        messageBox.appendChild(member);
        member.appendChild(img);
        const name = document.createElement("p");
        name.setAttribute("class", "group_member_name");
        name.innerHTML = friendName.slice(0, 6);
        member.appendChild(name);
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
