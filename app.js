//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const lodash = require('lodash');


const homeStartingContent = "This is the Home page, which contains all of my posts. Please click on the title or select 'read more' if you want to read each post in full.";
const aboutContent = "This is the Home page, which contains all of my posts. Please click on the title or select 'read more' if you want to read each post in full.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public")); //We're telling express that our static files are held inside the "public" folder.

mongoose.connect("mongodb://localhost:27017/BlogDB", {
  useNewUrlParser: true
});

/*const BlogPostSchema = {
  title: String,
  content: String
};*/

const BlogPostSchema = mongoose.Schema({
  title: String,
  content: String,
}, {
  timestamps: true
});

const BlogPost = mongoose.model("BlogPost", BlogPostSchema);

let posts = [];
let randomPostId = "";


app.get("/", function(req, res) { //app.get is used to create routes in our server. We're telling the server to redirect to "home" if the user goes to the root route

  BlogPost.find({}, function(err, posts) {
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts
    });
  });
});

app.get("/about", function(req, res) { //app.get is used to create routes in our server
  res.render(__dirname + "/views/about.ejs", {
    aboutContent: aboutContent
  });
});

app.get("/contact", function(req, res) { //app.get is used to create routes in our server
  res.render(__dirname + "/views/contact.ejs", {
    contactContent: contactContent
  });
});

app.get("/compose", function(req, res) { //app.get is used to create routes in our server
  res.render("compose.ejs");
});

app.get("/post/:postName", function(req, res) { //app.get is used to create routes in our server

  console.log("post/start");
  const requestedPostID = req.params.postName;
  randomPostGenerator();
  if (randomPostId === "") {
    randomPostGenerator();
  }

  BlogPost.findById(requestedPostID, function(err, requestedPost) {

    if (err) {
      console.log("error: 404"); //write code later to redirect to an error page
    } else {
      let fixedMinutes;
      let dateAdded = requestedPost.createdAt;

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
      console.log("error: 404"); //write code later to redirect to an error page
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
      console.log(err); //404
    } else {
      console.log("Deleted : ", docs);
    }
  });

  res.redirect("/");

});

app.post("/compose", function(req, res) {
  const newPost = new BlogPost({
    title: req.body.postTitle,
    content: req.body.postBody
  });

  newPost.save(function(err) {
    if (!err) {
      res.redirect("/");
    }
  });
});

app.post("/edit/:editID", function(req, res) {

  console.log("we have this id" + req.params.editID + " and with the help of the server we have the following:" + req.body.newTitle + req.body.newBody);

  BlogPost.updateOne({
    _id: {
      $eq: req.params.editID
    }
  }, {
    title: req.body.newTitle,
    content: req.body.newBody
  }, function(err, docs) {
    if (err) {
      console.log(err); //404
    }
  });

  res.redirect("/");

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

app.listen("3000", function() {
  console.log("Server started on port 3000");
});
