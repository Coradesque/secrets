//Database Setup
require('dotenv').config();
const mongoose = require('mongoose');
const {Schema} = require('mongoose');
const encryption = require('mongoose-encryption')
mongoose.connect('mongodb://localhost:27017/secretsdb', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(encryption, {secret: process.env.ENC_KEY, encryptedFields: ['password']});
const User = mongoose.model("User", userSchema);

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

//Server setup
const express = require('express');
const app = express();
const bodyPArser = require('body-parser');
const ejs = require ('ejs');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("home");
});

//LOGIN ROUTE
app.route("/login") 
.get((req, res) => {
    res.render("login");
})
.post((req, res) => {
    User.find({email:req.body.username}, (err, data) => {
        if(err) {
            console.log(err);
        } else {
            if (data.length > 0){
                if(data[0].password === req.body.password) {
                    res.render("secrets");
                } else {
                    res.render("login");
                }
            } else {
                res.render("login");
            }
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
        } else {
            if (data.length <= 0){
                User.create({
                    email: req.body.username,
                    password:req.body.password
                }, () => res.render("home"));
            } else {
                res.send("try other email")
            }
        }
    });
});



app.listen(3000, () => console.log("Connected on port 3000."))