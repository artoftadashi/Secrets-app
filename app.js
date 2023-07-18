//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
const saltRounds = 11;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.set('view engine', 'ejs');

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);



app.route("/")
    .get((req, res)=> {
        res.render("home");
    })




app.route("/login")
    .get((req, res)=> {
        res.render("login");
    })
    .post((req, res)=> {
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username}).then((foundUser)=>{
            bcrypt.compare(password, foundUser.password, function(err, result) {
                // result == true
                if (result === true) {
                    res.render("secrets");
                } else{
                    res.redirect("/login");
                }
            });

        })
    })



 app.route("/register")
    .get((req, res)=> {
        res.render("register");
    })
    .post((req, res)=> {
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            const newUser = new User({
                email: req.body.username,
                password: hash
            });
            newUser.save().then(()=> {
                res.render("secrets");
            });
        });
        
    })



app.route("/submit")
    .get((req, res)=> {
        res.render("submit");
    })






app.listen('3000', ()=> {
    console.log('server is running on port 3000');
});