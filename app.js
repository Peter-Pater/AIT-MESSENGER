// app.js
const express = require('express');
const app = express();
// set up socket.io
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const publicPath = path.resolve(__dirname, "public");
require("./db.js");
require('./auth.js');

const passport = require('passport');

const User = mongoose.model("User");
const Group = mongoose.model("Group");
const LoginInfo = mongoose.model("LoginInfo");
const Hist = mongoose.model("Hist");

const sessionOptions = {
    secret: 'secret for signing session id',
    saveUninitialized: false,
    resave: false,
};

const status = {};
const socket_user_pair = {};

app.set('view engine', 'hbs');
app.use(express.static(publicPath));
app.use(session(sessionOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});

// globals:
let logInError = false;
let accountError = false;

/*---------------------initialize the a group if there's not already one---------------*/
Group.find({}, function(err, result){
    if (result.length === 0){
        new Group({
            member: 0,
            history: [["System", "Be the first one to say something!"]]
        }).save(function(err){
            console.log("Group created!");
        });
    }
});

/*---------------------------------Server functionality--------------------------------*/
app.get("/", (req, res) => {
    res.redirect("/login");
});

app.get("/login", (req, res) => {
    if (req.session.keepLogin === true){
        res.redirect("/home");
    }else{
        res.render("login", {err: logInError});
    }
    logInError = false;
});

app.post("/login", (req, res, next) => {
    passport.authenticate("local", function(err, user){
        if (user){
            req.logIn(user, function(err){
                req.session.clientInfo = {
                    username: req.body.username,
                }
                if (req.body.keepLogin !== undefined){
                    req.session.keepLogin = true;
                }else{
                    req.session.keepLogin = false;
                }
                res.redirect("/home");
            });
        }else{
            logInError = true;
            res.redirect("/login");
        }
    })(req, res, next);
});

app.get("/register", (req, res) => {
    res.render("register", {err: accountError});
    accountError = false;
});

app.post('/register', function(req, res) {
    LoginInfo.register(new LoginInfo({username: req.body.username}), req.body.password, function(err, user){
        if (err){
            accountError = err;
            res.redirect("register");
        }else{
            passport.authenticate('local')(req, res, function() {
                new User({
                    username: req.body.username,
                    online: false,
                    name: req.body.username,
                    gender: req.body.gender,
                    age: 0,
                    school: "",
                    location: "",
                    img: ((req.body.gender === "Female")? "/img/girl.png" : "/img/boy.png")
                }).save(function(err){
                    if (err){
                        accountError = err;
                        res.redirect("/register");
                    }else{
                        status[req.body.username] = 0;
                        console.log(status);
                        res.redirect("/login");
                    }
                });
            });
        }
    });
});

app.get("/home", (req, res) => {
    // to do
    if (req.session.clientInfo === undefined){
        res.redirect("/login");
    }else{
        User.findOne({username: req.session.clientInfo.username}, function(err, result){
            res.render("home", {name: req.session.clientInfo.username, profile: result});
        });
    }
});

app.get("/home/friend/:whom", (req, res) => {
    if (req.session.clientInfo === undefined){
        res.redirect("/login");
    }else{
        console.log(req.session.clientInfo.username + " is chatting with " + req.params.whom);
        User.findOne({username: req.params.whom}, function(err, result){
            res.render("friend", {friendName: req.params.whom, profile: result, self: req.session.clientInfo.username});
        });
    }
});

app.get("/home/group", (req, res) => {
    if (req.session.clientInfo === undefined){
        res.redirect("/login");
    }else{
        console.log(req.session.clientInfo.username + " enters the group");
        User.findOne({username: req.session.clientInfo.username}, function(err, result){
            res.render("group", {profile: result, self: req.session.clientInfo.username});
        });
    }
});

app.get("/home/profile", (req, res) => {
    if (req.session.clientInfo === undefined){
        res.redirect("/login");
    }else{
        User.findOne({username: req.session.clientInfo.username}, function(err, result){
            res.render("profile", {name: req.session.clientInfo.username, profile: result});
            ageError = false;
        });
    }
});

app.post("/edit", (req, res) => {
    User.findOne({username: req.session.clientInfo.username}, function(err, result){
        for (key in req.body){
            if (req.body[key] !== ""){
                result[key] = req.body[key];
            }
        }
        result.save(function(err){
            res.redirect("/home");
        });
    });
});

app.post("/logout", (req, res) => {
    req.session.keepLogin = false;
    req.session.clientInfo = undefined;
    res.redirect("/login");
});

/*------------------------------Ajax Communication------------------//--------*/
// search for friends by the conditions received, and send back
app.post("/search", (req, res) => {
    const data = JSON.parse(req.body.data);
    // console.log(data);
    User.find(data, function(err, result){
        if (err){
            console.log(err);
            res.status(500).send(`{"data" : "error occurred: database error"}`);
        }else{
            // console.log(JSON.stringify(result));
            res.status(200).send(JSON.stringify(result));
        }
    });
});

// get the friend list by the conditions received, and send back
app.get("/friendList", (req, res) => {
    const username = req.session.clientInfo.username;
    const response = [];
    User.findOne({"username" : username}, function(err, result){
        const len = result.friends.length;
        if (len === 0){
            res.status(200).send(JSON.stringify(response));
        }else{
            repeatedlyFind(len - 1);
            function repeatedlyFind(i){
                User.findOne({"username" : result.friends[i]}, function(err, oneResult){
                    response.push(oneResult);
                    i = i - 1;
                    if (i < 0){
                        res.status(200).send(JSON.stringify(response));
                    }else{
                        repeatedlyFind(i);
                    }
                });
            }
        }
    });
});

// get the infomation necessay for start chatting
app.post("/selfImg", (req, res) => {
    User.findOne(JSON.parse(req.body.data), function(err, result){
        if (err){
            console.log(err);
            res.status(500).send(`{"data" : "error occurred: database error"}`);
        }else{
            result = result.img;
            // console.log(result);
            res.status(200).send(result);
        }
    });
});

app.post("/friendImg", (req, res) => {
    User.findOne(JSON.parse(req.body.data), function(err, result){
        if (err){
            console.log(err);
            res.status(500).send(`{"data" : "error occurred: database error"}`);
        }else{
            result = result.img;
            // console.log(result);
            res.status(200).send(result);
        }
    });
});

app.post("/getHistory", (req, res) => {
    const data = JSON.parse(req.body.data);
    User.findOne({username: data.username}, function(err, result){
        if (err){
            console.log(err);
            res.status(500).send(`{"data" : "error occurred: database error"}`);
        }else{
            hist = result.history.filter((value) => value.friend === data.friend)[0];
            if (hist.pending_msgs > 0){
                let data = hist.history.slice(hist.history.length - hist.pending_msgs);
                hist.pending_msgs = 0;
                result.save(function(){
                    res.status(200).send(JSON.stringify(data));
                });
            }else{
                res.status(200).send(JSON.stringify(hist.history.slice(hist.history.length - 1)));
            }
        }
    });
});

app.get("/getGroupHistory", (req, res) => {
    Group.findOne({}, function(err, result){
        if (err){
            console.log(err);
            res.status(500).send(`{"data" : "error occurred: database error"}`);
        }else{
            if (result.history.length > 5){
                res.status(200).send(JSON.stringify(result.history.slice(result.history.length - 5)));
            }else{
                res.status(200).send(JSON.stringify(result.history));
            }
        }
    });
});

/*-----------------------------------Socket io--------------------------------*/
io.on("connection", function(socket){
    console.log(socket.id, " connected");
    socket.on("disconnect", function(){
        console.log(socket.id, " disconnected");
        if (status[socket_user_pair[socket.id]] === 2){
            Group.findOne({}, function(err, result){
                result.member --;
                result.save(function(){
                    socket.broadcast.emit("getGroupMember", result.member);
                });
            });
        }
        status[socket_user_pair[socket.id]] = 0;
        delete socket_user_pair[socket.id];
        console.log(status);
    });
    // handle add Friend request, send back success, and broadcast
    socket.on("addFriend", function(msg){
        const username = msg.split("+")[0];
        const friendName = msg.split("+")[1];
        User.findOne({"username" : username}, function(err, result1){
            result1.friends.push(friendName);
            result1.history.push(new Hist({
                friend: friendName,
                history: ["You have just added " + friendName + ", start chatting!"],
                pending_msgs: 0
            }));
            result1.save(function(err){
                if (err){
                    socket.emit("confirm", `failed to add ${friendName} to ${username}`);
                }else{
                    User.findOne({"username" : friendName}, function(err, result2){
                        result2.friends.push(username);
                        result2.history.push(new Hist({
                            friend: username,
                            history: ["You have just added " + username + ", shart chatting!"],
                            pending_msgs: 0
                        }));
                        result2.save(function(err){
                            if (err){

                            }else{
                                const data = {};
                                data[friendName] = result1;
                                socket.broadcast.emit("addedFriend", JSON.stringify(data));
                            }
                        });
                    });
                }
            });
        });
    });

    socket.on("getHistory", function(msg){
        User.findOne({"username" : msg}, function(err, result){
            socket.emit("getHistory", JSON.stringify(result.history));
        });
    });

    socket.on("reportIn", function(msg){
        msg = msg.split(",");
        socket_user_pair[socket.id] = msg[0];
        if (msg[1] === "1"){
            status[msg[0]] = 1;
        }else if(msg[1] === "2"){
            status[msg[0]] = 2;
            Group.findOne({}, function(err, result){
                result.member ++;
                result.save(function(){
                    socket.broadcast.emit("getGroupMember", result.member);
                });
            });
        }else{
            status[msg[0]] = msg[1];
        }
        console.log(status);
    });

    // data = {from: self, to: friend, message: msg}
    socket.on("sendMsg", function(data){
        data = JSON.parse(data);
        User.findOne({username: data.to}, function(err, result){
            if (err){
                socket.emit("system", "data base error");
            }else{
                let temp = result.friends.splice(result.friends.indexOf(data.from), 1);
                result.friends = result.friends.concat(temp);
                User.findOne({username: data.from}, function(err, result){
                    if(err){
                        socket.emit("system", "data base error");
                    }else{
                        let temp = result.friends.splice(result.friends.indexOf(data.to), 1);
                        result.friends = result.friends.concat(temp);
                        result.save();
                    }
                });
                let obj;
                obj = result.history.filter((value) => value.friend === data.from)[0];
                obj.history.push(data.message);
                if (status[data.to] !== data.from){
                    // if not currently talking to me
                    obj.pending_msgs ++;
                }
                result.save(function(err){
                    if (err){
                        socket.emit("system", "data base error");
                    }else{
                        if(status[data.to] === 1){
                            // the user is at home page
                            socket.broadcast.emit("getMsg_home", `${data.to},${data.from},${data.message}`);
                            console.log(`sent: ${data.to},${data.from},${data.message}`);
                        }else if(status[data.to] === data.from){
                            // the user is chatting with me, post msg right away
                            socket.broadcast.emit("getMsg_chat", `${data.to},${data.message}`);
                            console.log(`sent: ${data.to},${data.message}`);
                        }else{
                            console.log(`${data.to}'s pending message': ${obj.pending_msgs}`);
                        }
                    }
                });
            }
        });
    });

    socket.on("getGroupMember", function(msg){
        Group.findOne({}, function(err, result){
            socket.emit("getGroupMember", result.member);
        });
    });

    socket.on("sendGroupMsg", function(data){
        data = JSON.parse(data);
        Group.findOne({}, function(err, result){
            if (err){
                socket.emit("system", "data base error");
            }else{
                result.history.push([data.from, data.message]);
                result.save(function(err){
                    if (err){
                        socket.emit("system", "data base error");
                    }else{
                        console.log("Group: ", data.message);
                        socket.broadcast.emit("getGroupMsg", JSON.stringify(data));
                    }
                });
            }
        });
    });
});

server.listen(process.env.PORT || 3000);
