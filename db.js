// db.js
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
mongoose.Promise = global.Promise;

// my schemas go here
const LoginInfo = new mongoose.Schema({});
LoginInfo.plugin(passportLocalMongoose);

const Hist = new mongoose.Schema({
    friend: String,
    history: [String],
    pending_msgs: Number
});

const User = new mongoose.Schema({
    username: {type: String, required: [true, "Username cannot be absent"]},
    online: Boolean,
    groups: [Number], // groupids
    friends: [String], // username
    // profile
    name: String,
    img: String, // a link, at least for now
    gender: String,
    age: Number,
    school: String,
    location: String,
    history: [Hist]
});

const Group = new mongoose.Schema({
    member: Number,
    history: [[]] // [[userid, String], [userid, String] ...]
});

mongoose.model("LoginInfo", LoginInfo);
mongoose.model("Hist", Hist);
mongoose.model("User", User);
mongoose.model("Group", Group);


let dbconf;

if (process.env.NODE_ENV === 'PRODUCTION'){
    const fs = require('fs');
    const path = require('path');
    const fn = path.join(__dirname, "config.json");
    const data = fs.readFileSync(fn);

    const conf = JSON.parse(data);
    dbconf = conf.dbconf;
}else{
    dbconf = "mongodb://localhost/final";
}
mongoose.connect(dbconf, {useMongoClient: true});
