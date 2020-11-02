//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const ejs = require("ejs");
const app = express();
const { registerUser, loginUser, getUserInfo, updateUser } = require('./src/storage/db');

let IS_LOGGED = false;
let USER_ID = null;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

function redirectLogin (req, res, next){
    if(!IS_LOGGED){
        res.redirect('/login');
    } else {
        next();
    }
}

function redirectHome (req, res, next){
    if(IS_LOGGED){
        res.redirect('/home');
    } else {
        next();
    }
}

app.get("/", function(req, res){
    res.render("landingPage");
});

app.get("/home", redirectLogin, function(req, res){
    res.send('<h1>hola</h1> <a href="/logout">Cerrar sesión</a>');
})

app.get("/signup", redirectHome,  function(req, res){
    const { name, lastName, age, school, email, error} = req.query;
    const signInfo = {
        name: name || '', 
        lastName: lastName || '', 
        age: age || '', 
        school: school || '', 
        email: email || '', 
        error: error
    }
    res.render("user/register", signInfo);
});

app.post("/signup", redirectHome,  async function(req, res){
    const succesSignUp = await registerUser(req.body);
    if (succesSignUp){
        IS_LOGGED = true;
        USER_ID = succesSignUp._id;
        res.redirect("/home");
    }else{
        const { name, lastName, age, school, email} = req.body;
        res.redirect(`/signup?error=true&name=${name}&lastName=${lastName}&age=${age}&school=${school}&email=${email}`);
    }
});

app.get("/login", redirectHome, function(req, res){
    const { error, email } = req.query;
    res.render("user/login", { error, email: email || '' });
});

app.post("/login", redirectHome, async function(req, res){
    const isSuccesLogIn = await loginUser(req.body);
    if (isSuccesLogIn){
        IS_LOGGED = true;
        USER_ID = isSuccesLogIn._id;
        res.redirect("/home");
    }else{
        res.redirect(`/login?error=true&email=${req.body.email}`);
    }
});

app.get('/logout', redirectLogin, function(req, res){
    IS_LOGGED = false;
    USER_ID = null;
    res.redirect('/login');
});


app.get("/profile", redirectLogin, async function(req, res){
    const user = await getUserInfo(USER_ID);
    res.render("profile/profile", {user});
});

app.post("/profile", redirectLogin, async function(req, res){
    await updateUser(req.body, USER_ID);
    const user = await getUserInfo(USER_ID);
    res.render("profile/profile", {user});
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});