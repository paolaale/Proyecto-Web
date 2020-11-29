//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const ejs = require("ejs");
const app = express();
const { IMGAGES_URL } = require('./src/imagesProfileUrls');
const { registerUser, loginUser, getUserInfo, updateUser, addProblem, loadProblems, getProblem, searchProblem, addProblemToUser, getUsers, addBlast, loadBlasts, getBlast, addBlastToUser } = require('./src/storage/db');


let IS_LOGGED = false;
let USER_ID = null;
let currentGrade = '';

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

function redirectLogin(req, res, next) {
    if (!IS_LOGGED) {
        res.redirect('/login');
    } else {
        next();
    }
}

function redirectHome(req, res, next) {
    if (IS_LOGGED) {
        res.redirect('/home');
    } else {
        next();
    }
}

app.get("/", function (req, res) {
    res.render("landingPage");
});

app.get('/api/getImage', async function(req, res){
    const { imageProfile } = await getUserInfo(USER_ID);
    return res.json({img: imageProfile});
});

// vista principal iniciando sesión
app.get("/home", redirectLogin, function (req, res) {
    res.render("dashboard", { tab: 'home' });
});

// vista tras escoger grado
app.get("/lista-problemas", redirectLogin, async function (req, res, next) {
    currentGrade = req.query.grado;
    const problemas = await loadProblems(currentGrade);
    res.render("problemsBoard", { problems: problemas, tab: 'problemas' });
});

// vista de un problema
app.get("/problema", redirectLogin, async function (req, res) {
    const problema = await getProblem(req.query.id);
    res.render("problem/problem", { problem: problema, length: 1, index: 0, problemAction: 'problema', problemType: 'normal' });
});

app.get("/all-blasts", redirectLogin, async function (req, res) {
    const rafagas = await loadBlasts();
    res.render("blasts-list", { blasts: rafagas, tab: 'rafaga' });
});

app.get('/blast', redirectLogin, async function (req, res) {
    const blastId = req.query.id;
    const blastSelected = await getBlast(blastId);
    let array = [];
    for (let i = 0; i < blastSelected.problemsBlast.length; i++) {
        const problem = await getProblem(blastSelected.problemsBlast[i]);
        array.push(problem);
    }


    // me gustaria cambiar el nombre de la variable rafagas por questions
    res.render('problem/rafaga', { blast: blastSelected, rafagas: array, length: array.length, index: 0, problemAction: 'rafaga', tab: 'rafaga', problemType: 'rafaga' });
});

app.get("/signup", redirectHome, function (req, res) {
    const { name, lastName, age, school, email, error } = req.query;
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

app.post("/signup", redirectHome, async function (req, res) {
    const succesSignUp = await registerUser(req.body);
    if (succesSignUp) {
        IS_LOGGED = true;
        USER_ID = succesSignUp._id;
        res.redirect("/home");
    } else {
        const { name, lastName, age, school, email } = req.body;
        res.redirect(`/signup?error=true&name=${name}&lastName=${lastName}&age=${age}&school=${school}&email=${email}`);
    }
});

app.get("/login", redirectHome, function (req, res) {
    const { error, email } = req.query;
    res.render("user/login", { error, email: email || '' });
});

app.post("/login", redirectHome, async function (req, res) {
    const isSuccesLogIn = await loginUser(req.body);
    if (isSuccesLogIn) {
        IS_LOGGED = true;
        USER_ID = isSuccesLogIn._id;
        res.redirect("/home");
    } else {
        res.redirect(`/login?error=true&email=${req.body.email}`);
    }
});

//Buscador de problemas en el board de problemas
app.post("/search-problem", redirectLogin, async function (req, res) {
    const problemas = await searchProblem(req.body.search);
    res.render("problemsBoard", { problems: problemas, tab: 'problemas' });
});

app.get('/logout', redirectLogin, function (req, res) {
    IS_LOGGED = false;
    USER_ID = null;
    res.redirect('/login');
});


app.get("/profile", redirectLogin, async function (req, res) {
    const user = await getUserInfo(USER_ID);
    res.render("profile/profile", { user, tab: 'home', images: IMGAGES_URL });
});

app.post("/profile", redirectLogin, async function (req, res) {
    await updateUser(req.body, USER_ID);
    const user = await getUserInfo(USER_ID);
    res.render("profile/profile", { user, tab: 'home', images: IMGAGES_URL });
});

app.post("/submit-answer", function (req, res, next) {
    if (req.body.type == "blast") {

        addBlastToUser(req.body.blastId, USER_ID);
    }

    addProblemToUser(req.body.responses, USER_ID);
    res.json(true);
});

app.get('/ranking', redirectLogin, async function (req, res) {
    const allUsers = await getUsers();
    const top = [];
    for (let i = 0; i < 3; i++) {
        top.push(allUsers[i]);
    }
    res.render('ranking/ranking', { allUsers, tops: top, userId: USER_ID, tab: 'ranking' });
});

//ADMIN METHODS
//manipulación de problemas
app.get("/admin", function (req, res) {
    res.render("admin/addProblem");
});

app.post("/admin", function (req, res) {
    addProblem(req.body);
    res.render("admin/addProblem");
});

//manipulación de ráfagas
app.get("/admin/addBlast", function (req, res) {
    res.render("admin/addBlast");
});

app.post("/admin/addBlast", function (req, res) {
    addBlast(req.body);
    res.render("admin/addBlast");
});

app.listen(process.env.PORT || 3000, function () {
    console.log("Server started on port 3000");
});