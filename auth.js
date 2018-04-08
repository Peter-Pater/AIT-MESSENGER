const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const LoginInfo = mongoose.model('LoginInfo');

passport.use(new LocalStrategy(LoginInfo.authenticate()));

passport.serializeUser(LoginInfo.serializeUser());
passport.deserializeUser(LoginInfo.deserializeUser());
