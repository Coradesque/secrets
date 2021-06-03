const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const encryption = require('mongoose-encryption');
const bodyParser = require('body-parser');
const ejs = require ('ejs');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
    secret: 'another super long exposed secret',
    resave: false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());


//Database Setup
mongoose.connect('mongodb://localhost:27017/secretsdb', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const secretSchema = new mongoose.Schema ({
    title: String,
    content: String,
});
  
const Secret = mongoose.model("Secret", secretSchema);

db.once("open", function() {
    console.log("Connected to database on port 27017");
    Secret.find({}, (err, secretsArray) => {
        if (err) {
            console.log (err);
        } else {
            if (secretsArray.length === 0) {
                const secret1 = new Secret ({
                    title: "secret1",
                    content: "Lorem ipsum dolor sit amet...",
                });

                const secret2 = new Secret ({
                    title: "secret2",
                    content: "Lorem ipsum dolor sit amet...",
                });

                const secret3 = new Secret ({
                    title: "secret3",
                    content: "Lorem ipsum dolor sit amet...",
                });

                Secret.insertMany([secret1, secret2, secret3], 
                    (err, docs) => err ? console.log(err) : console.log("Default secrets saved"));
            } else {
                console.log("There are " + secretsArray.length + " secrets in wikiDB");
            }
        }
    });
});

app.get("/", (req, res) => {
    res.render("home");
});

//LOGIN ROUTE
app.route("/login") 
.get((req, res) => {
    res.render("login");
})
.post((req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) => {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local") (req, res, function(){res.redirect("/secrets");});
        }
    });
});

//REGISTER ROUTE
app.route("/register")
.get((req, res) => {
    res.render("register");
})

.post((req, res) => {
    User.find({email:req.body.username}, (err, data) => {
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            if (data.length <= 0){
                User.register({username: req.body.username}, req.body.password, (erro, user) => {
                    if(erro) {
                        console.log(erro)
                        res.redirect("/register"); 
                    } else {
                        res.redirect("/login");
                    }
                });
            } else {
                res.send("try other email");
                res.redirect("/register");
            }
        }
    });
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

app.listen(3000, () => console.log("Connected on port 3000."))