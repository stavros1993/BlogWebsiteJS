//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const {
  check,
  validationResult
} = require('express-validator');

const lodash = require('lodash');

const app = express();

app.set('view engine', 'ejs');

const urlencodedParser = bodyParser.urlencoded({
  extended: false
});

app.use(express.static("public")); //We're telling express that our static files are held inside the "public" folder.

mongoose.connect("mongodb://localhost:27017/BlogDB", {
  useNewUrlParser: true
});

const BlogPostSchema = mongoose.Schema({
  title: String,
  content: String,
}, {
  timestamps: true
});

const BlogPost = mongoose.model("BlogPost", BlogPostSchema);

const UserFeedbackSchema = mongoose.Schema({
  userFullName: String,
  email: String,
  title: String,
  content: String,
}, {
  timestamps: true
});

const UserMessage = mongoose.model("UserMessage", UserFeedbackSchema);

let randomPostId = "";

app.get("/", function(req, res) { //app.get is used to create routes in our server. We're telling the server to redirect to "home" if the user goes to the root route

  BlogPost.find({}, function(err, posts) {
    res.render("home", {
      posts: posts
    });
  });
});

app.get("/about", function(req, res) { //app.get is used to create routes in our server
  res.render(__dirname + "/views/about.ejs", {});
});

app.get("/contact", function(req, res) { //app.get is used to create routes in our server
  res.render(__dirname + "/views/contact.ejs", {});
});

app.get("/compose", function(req, res) { //app.get is used to create routes in our server
  res.render("compose.ejs");
});

app.get("/post/:postName", function(req, res) { //app.get is used to create routes in our server

  const requestedPostID = req.params.postName;
  randomPostGenerator();
  /* if (randomPostId === "") {
    randomPostGenerator();
  }*/

  BlogPost.findById(requestedPostID, function(err, requestedPost) {

    if (err) {
      res.render("errorPage");
    } else {

      let fixedMinutes, dateAdded = requestedPost.createdAt;

      if (dateAdded.getMinutes() < 10) {
        fixedMinutes = "" + "0" + dateAdded.getMinutes();
      } else {
        fixedMinutes = "" + dateAdded.getMinutes();
      }

      dateAdded = "Posted: " + dateAdded.getDate() + "/" + (dateAdded.getMonth() + 1) + "/" + dateAdded.getFullYear() + " " + dateAdded.getHours() + ":" + fixedMinutes;

      let fixedContent = requestedPost.content.replace(/(?:\r\n|\r|\n)/g, "FoundNewLine");
      fixedContent = fixedContent.split("FoundNewLine");

      res.render(__dirname + "/views/post.ejs", {
        postTitle: requestedPost.title,
        postBody: fixedContent,
        randomPostLink: randomPostId,
        postId: requestedPost._id,
        dateAdded: dateAdded
      });
    }
  });

});

app.get("/edit/:editID", function(req, res) {

  const requestedPostID = req.params.editID;

  BlogPost.findOne({ //get the ID from the link and check if a corresponding entry exists in the database.
    _id: requestedPostID
  }, function(err, postData) {
    if (err) {
      res.render("errorPage");
    } else {
      res.render(__dirname + "/views/edit.ejs", {
        postId: requestedPostID,
        postTitle: postData.title,
        postContent: postData.content
      });
    }
  });

});

app.get("/delete/:deleteID", function(req, res) {

  const requestedPostID = req.params.deleteID;

  BlogPost.findByIdAndDelete(requestedPostID, function(err, docs) {
    if (err) {
      res.render("errorPage");
    } else {
      console.log("Deleted : ", docs);
    }
  });
  res.redirect("/");

});

app.post("/compose", urlencodedParser, [
  check('postTitle', 'The post title is empty or less than 3 chars long. Please try again.')
  .exists()
  .isLength({
    min: 5
  }),
  check('postBody', 'The post body is empty or less than 10 chars long. Please try again.')
  .exists()
  .isLength({
    min: 10
  }),
], function(req, res) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const alert = errors.array();
    console.log(alert);
    res.render("compose", {
      alert: alert
    });

  } else {

    const newPost = new BlogPost({
      title: req.body.postTitle,
      content: req.body.postBody
    });

    newPost.save(function(err) {
      if (!err) {
        res.redirect("/");
      }
    });
  }
});

app.post("/edit/:editID", urlencodedParser, [
  check('newTitle', 'Title is empty or less than 5 chars long. Please try again.')
  .exists()
  .isLength({
    min: 5
  }),
  check('newBody', 'Body is empty or less than 10 chars long. Please try again.')
  .exists()
  .isLength({
    min: 10
  }),
], function(req, res) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const alert = errors.array();
    //console.log(alert); req.params.editID
    res.render("edit", {
      alert: alert,
      postId: req.params.editID,
      postTitle: req.body.newTitle,
      postContent: req.body.newBody
    });
  } else {

    BlogPost.updateOne({
      _id: {
        $eq: req.params.editID
      }
    }, {
      title: req.body.newTitle,
      content: req.body.newBody
    }, function(err, docs) {
      if (err) {
        res.render("errorPage");
      } else {
        res.redirect("/");
      }
    });
  }
});

function randomPostGenerator() {

  BlogPost.find().count(function(err, count) { //we count the num of posts saved in the DB. This will be useful for the randomButton
    if (err) {
      console.log(err);
    } else {

      let postIndex = Math.floor(Math.random() * count);

      BlogPost.find({}, null, {
        skip: postIndex,
        limit: 1
      }, function(err, results) {
        if (err) {
          console.log(err); //404
        } else {
          randomPostId = results[0]._id; //now the random ID is retrieved
        }
      });
    }
  });

}

app.post("/contact", urlencodedParser, [
  check('name', 'Name is empty or less than 3 chars long. Please try again.')
  .exists()
  .isLength({
    min: 3
  }),
  check('email', 'Email is invalid. Please try again')
  .isEmail()
  .normalizeEmail(),
  check('subject', 'Subject is empty or less than 3 chars long. Please try again.')
  .exists()
  .isLength({
    min: 2
  }),
  check('message', 'The message body is empty or less than 10 chars long. Please try again.')
  .exists()
  .isLength({
    min: 10
  }),
], function(req, res) {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const alert = errors.array();
    console.log(alert);
    res.render("contact", {
      alert: alert
    });
  } else {
    const newMessage = new UserMessage({
      userFullName: req.body.name,
      email: req.body.email,
      title: req.body.subject,
      content: req.body.message
    });

    newMessage.save(function(err) {
      let successMsg = "Your message has been sent. I'll reply soon.";
      if (!err) {
        res.render("contact", {
          successMsg: successMsg
        });
      }
    });
  }
});


app.get("/errorPage", function(req, res) {
  res.render("errorPage");
});

app.listen("3000", function() {
  console.log("Server started on port 3000");
});
