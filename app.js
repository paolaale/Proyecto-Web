//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const ejs = require("ejs");
const app = express();
//const { findProductById } = require('./src/storage/db');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res){
    res.render("landingPage");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});