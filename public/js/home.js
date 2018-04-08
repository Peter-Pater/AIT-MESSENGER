// home.js
const domain = "http://linserv1.cims.nyu.edu:14424";
// const domain = "http://127.0.0.1:3000";
const socket = io();
const self = document.querySelector("#self").value;
// let state = 0; // 0 : initialize, 1 : standBy, 2 : IndChat, 3 : group chat
// the local storage of <friendNames>, to avoid frequent query to database
document.addEventListener("DOMContentLoaded", main);

function main(){
    console.log(self);
    const friendOpts = new FriendOperation();
    // initialize
    socket.emit("reportIn", `${self},1`);
    socket.emit("getGroupMember", self);
    socket.on("getGroupMember", function(msg){
        document.querySelector("#count").innerHTML = msg;
    });
    socket.emit("getHistory", self);
    socket.on("getHistory", function(msg){
        friendOpts.initializeFriendList(msg);
    });
    // End of initialization, standing by
    friendOpts.standByForFriends();
    // Individual Chat
    // socket.broadcast.emit("getMsg", `${data.to},${data.from},${data.message}`);
    socket.on("getMsg_home", function(msg){
        msg = msg.split(",");
        if (msg[0] === self){
            console.log(msg[1], msg[2]);
            const oldNode = document.querySelector("#" + msg[1]);
            const newNode = oldNode.cloneNode(true);
            document.querySelector("#friend_list").removeChild(oldNode);
            if (document.querySelector("#friend_list").children[0] === null){
                document.querySelector("#friend_list").appendChild(newNode);
            }else{
                document.querySelector("#friend_list").insertBefore(newNode, document.querySelector("#friend_list").children[0]);
            }
            document.querySelector("#" + msg[1] + "Message").textContent = msg[2];
            const link = document.createElement("a");
            link.setAttribute("href", "/home/friend/" + newNode.id);
            newNode.appendChild(link);
            newNode.addEventListener("click", function(){
                link.click();
            });
        }
    });
}

/*---------------------------Ajax Commnunication------------------------------*/
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
                const response = JSON.parse(req.responseText);
                callback(response);
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

/*-----------------------------------Friends----------------------------------*/
class FriendOperation{
    constructor(){
        this.ajax = new Ajax(domain);
        this.friendList = [];
        this.friendObjList = [];
        this.index = 0;
    }

    initializeFriendList(msg){
        this.ajax.ajaxGet("/friendList", (response) => {
            response = response.reverse()
            while(response.length > 0){
                const newFriend = response.pop();
                this.friendList.push(newFriend.username);
                document.querySelector("#friend_list").appendChild(this.createFriend(newFriend, msg));
            }
            const search = document.querySelector("#searchButton");
            search.addEventListener("click", this.findFriend.bind(this));
            search.click();
            this.initializeButtons();
        });
    }

    // takes the username as input
    // returns the node object
    createFriend(friendObj, msg){
        const friend = document.createElement("div");
        friend.setAttribute("class", "friend_box");
        friend.setAttribute("id", friendObj.username);
        const friend_img = document.createElement("img");
        friend_img.src = friendObj.img;
        friend.appendChild(friend_img);
        const friend_info = document.createElement("div");
        friend_info.setAttribute("class", "friend_info");
        const nameTag = document.createElement("p1");
        nameTag.appendChild(document.createTextNode(friendObj.username));
        friend_info.append(nameTag);
        const message = document.createElement("em");
        message.setAttribute("id", friendObj.username + "Message");
        if (msg !== undefined){
            msg = JSON.parse(msg);
            msg = msg.filter((value) => value.friend === friendObj.username)[0];
            // console.log(friendObj.username);
            msg = msg.history[msg.history.length - 1]
            if (msg.length > 75){
                msg = msg.slice(0, 80);
                msg += "...";
            }
        }else{
            msg = "You have just added " + friendObj.username + ", start chatting!"
        }
        message.appendChild(document.createTextNode(msg));
        friend_info.appendChild(message);
        friend.appendChild(friend_info);
        const link = document.createElement("a");
        link.setAttribute("href", "/home/friend/" + friend.id);
        friend.appendChild(link);
        friend.addEventListener("click", function(){
            link.click();
        });
        return friend;
    }

    findFriend(){
        const name = document.querySelector("#search_name").value;
        const gender = document.querySelector("#search_gender").value;
        const age = document.querySelector("#search_age").value;
        const school = document.querySelector("#search_school").value;
        const location = document.querySelector("#search_location").value;
        const condition = {
            "name": name,
            "gender": gender,
            "age": age,
            "school": school,
            "location": location
        }

        let data = {}
        for (let key in condition){
            if (condition[key] !== ""){
                data[key] = condition[key];
            }
        }

        this.ajax.ajaxPost("/search", data, (response) => {
            this.friendObjList = [...response];
            if (this.friendObjList.length === 0){
                document.querySelector("#result").childNodes.forEach(value => {
                    if (value.style !== undefined){
                        value.style.display = "none";
                    }
                });
            }else{
                document.querySelector("#result").childNodes.forEach(value => {
                    if (value.style !== undefined){
                        value.style.display = "block";
                    }
                });
            }
            this.showFriends(this.friendObjList[0]);
            this.index = 0;
        });
    }

    initializeButtons(){
        document.querySelector("#previous").addEventListener("click", function(){
            if (this.index - 1 === -1){
                this.index = this.friendObjList.length - 1;
            }else{
                this.index--;
            }
            this.showFriends(this.friendObjList[this.index]);
        }.bind(this));
        document.querySelector("#next").addEventListener("click", function(){
            if (this.index + 1 === this.friendObjList.length){
                this.index = 0;
            }else{
                this.index++;
            }
            this.showFriends(this.friendObjList[this.index]);
        }.bind(this));
        document.querySelector("#add_friend").addEventListener("click", function(){
            console.log("addFriend", `${self}+${this.friendObjList[this.index].username}`);
            socket.emit("addFriend", `${self}+${this.friendObjList[this.index].username}`);
            document.querySelector("#add_friend").style.display = "none";
            const newFriend = this.createFriend(this.friendObjList[this.index]);
            document.querySelector("#friend_list").insertBefore(newFriend, document.querySelector("#" + this.friendList[0]));
            document.querySelector("#" + newFriend.id + "Message").textContent = "You have just added " + newFriend.id + ", start chatting!";
            this.friendList = [this.friendObjList[this.index].username].concat(this.friendList);
        }.bind(this));
    }

    showFriends(friendObj){
        const profile_photo = document.querySelector("#profile_photo");
        const result_name = document.querySelector("#result_name");
        const result_age = document.querySelector("#result_age");
        const result_gender = document.querySelector("#result_gender");
        const result_school = document.querySelector("#result_school");
        const result_location = document.querySelector("#result_location");
        profile_photo.src = friendObj.img;
        result_name.textContent = "Name: " + friendObj.name;
        result_age.textContent = "Age: " + friendObj.age;
        result_gender.textContent = "Gender: " + friendObj.gender;
        result_school.textContent = "School: " + friendObj.school;
        result_location.textContent = "Location: " + friendObj.location;
        if (this.friendList.indexOf(friendObj.username) > -1 || friendObj.username === self){
            document.querySelector("#add_friend").style.display = "none";
        }else{
            document.querySelector("#add_friend").style.display = "block";
        }
    }

    standByForFriends(){
        socket.on("addedFriend", (msg) => {
            msg = JSON.parse(msg);
            if (msg[self] !== undefined){
                console.log("adding " + msg[self].username);
                const newFriend = this.createFriend(msg[self]);
                document.querySelector("#friend_list").insertBefore(newFriend, document.querySelector("#" + this.friendList[0]));
                this.friendList = [msg[self].username].concat(this.friendList);
                document.querySelector("#searchButton").click();
            }
        });
    }
}
