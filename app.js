//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({
    secret: "ourlittlesecret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.route("/")
    .get((req, res)=> {
        res.render("home");
    })




app.route("/login")
    .get((req, res)=> {
        res.render("login");
    })
    .post((req, res)=> {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function(err){
            if(err){
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets")
                });
            }
        })
    })

app.get("/logout", function (req, res) { 
    req.logout(function (err) {
        if(err) {
            console.log(err);
        }else {
            res.redirect("/login");
        }
    });
 });


app.get("/secrets", function(req, res){
    if(req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

 app.route("/register")
    .get((req, res)=> {
        res.render("register");
    })
    .post((req, res)=> {
        User.register({username: req.body.username}, req.body.password, function(err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets")
                });
            }
        })
    })



app.route("/submit")
    .get((req, res)=> {
        res.render("submit");
    })






app.listen('3000', ()=> {
    console.log('server is running on port 3000');
});