'use strict'; // enable let

// DEPENDENCIES

const pjson = require('./package.json');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const expressSanitizer = require('express-sanitizer');
const ejs = require('ejs');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const flash = require('connect-flash');
const middleware = require('./middleware')


// CONSTANTS

const DEFAULT_PORT = 3000;
const PORT = process.env.PORT || DEFAULT_PORT;
const SERVER_MSG = `Serving ${pjson.name} on port ${PORT}`;
// const DEFAULT_MONGO_URL = 'mongodb://localhost/restful_blog';
// const MONGO_URL = process.env.MONGO_URL || DEFAULT_MONGO_URL;
const blogSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  body: String,
  created: {type: Date, default: Date.now}
});
const Blog = mongoose.model('blog', blogSchema);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
})

// SETTINGS

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(flash());
app.use(methodOverride('_method'));
ejs.delimiter = '?';
mongoose.connect('mongodb://umrrajap:grimm123@ds247191.mlab.com:47191/fallen', {useMongoClient: true});

// PASSPORT CONFIG
app.use(require("express-session")({ secret: "Army talk with Fallen", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware
app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next(); //without next(), it stops and doesn't move to next middleware/route handler
});

// SERVER

app.listen(PORT, function() {
  console.log(SERVER_MSG);
});

// ROUTES

app.get('/', function(req, res) {
  res.redirect('/blogs');
});

  // index route
app.get('/blogs', function(req, res) {
  Blog.find({}, function(err, blogs) {
    if (err) {
      console.log('ERROR:', err);
    } else {
      res.render('index', {blogs: blogs});
    }
  }).sort(
    {"_id":-1}
  )
});

  // new route
app.get('/blogs/new', middleware.isLoggedIn, function(req, res) {
  res.render('new');
});

  // create route
app.post('/blogs', middleware.isLoggedIn, function(req, res) {
  const requestedBlog  = req.body.blog;
  requestedBlog.body = req.sanitize(requestedBlog.body);

  Blog.create(requestedBlog, function(err, createdBlog) {
    if (err) {
      res.render('new');
    } else {
      res.redirect('/blogs');
    }
  });

});

  // show route
app.get('/blogs/:id', function(req, res) {
  const id = req.params.id;

  Blog.findById(id, function(err, foundBlog) {
    if(err) {
      console.log('ERROR:', err);
      res.redirect('/blogs');
    } else {
      res.render('show', {blog: foundBlog});
    }
  });
});

  // edit route
app.get('/blogs/:id/edit', middleware.isLoggedIn, function(req, res) {
  const id = req.params.id;

  Blog.findById(id, function(err, foundBlog) {
    if(err) {
      console.log('ERROR', err);
      res.redirect('/blogs');
    } else {
      res.render('edit', {blog: foundBlog});
    }
  });
});

  // update route
app.put('/blogs/:id', middleware.isLoggedIn, function(req, res) {
  const id = req.params.id;
  const requestedBlog = req.body.blog;
  requestedBlog.body = req.sanitize(requestedBlog.body);

  Blog.findByIdAndUpdate(id, requestedBlog, function(err, updatedBlog) {
    if (err) {
      console.log('ERROR:', err);
      res.redirect('/blogs');
    } else {
      res.redirect('/blogs/' + id);
    }
  });
});

  // destroy route
app.delete('/blogs/:id/', middleware.isLoggedIn, function(req, res){
  const id = req.params.id;

  Blog.findByIdAndRemove(id, function(err) {
    if(err) {
      console.log('ERROR:', err);
    }
    res.redirect('/blogs');
  });
});

  //Auth Route
var authRoutes = require('./routes/auth');

//Require routes

app.use(authRoutes);


// FUNCTIONS

// MAIN
