//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from "passport-local-mongoose";
import GoogleStrategy from "passport-google-oauth20";
import findOrCreate from "mongoose-findorcreate";

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
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
   
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/sercet"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.route("/")
    .get((req, res)=> {
        res.render("home");
    })


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));
  
app.get('/auth/google/sercet', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });


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
    User.find({secret: {$ne: null}}).then((foundUser)=>{
        res.render("secrets", {usersWithSecrets: foundUser});
    })

});

app.get("/submit", (req, res)=> {
    if(req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", (req, res)=> {
    const userSecret = req.body.secret;
    const userId = req.user._id.toString();
    console.log(userId);
    User.findById(userId).then((foundUser)=> {
        foundUser.secret = userSecret;
        foundUser.save().then(()=>{
            res.redirect("/secrets")
        })
    })
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



app.listen('3000', ()=> {
    console.log('server is running on port 3000');
});