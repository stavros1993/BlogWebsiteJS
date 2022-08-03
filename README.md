# BlogWebsiteJS
A site that resembles a blog. Implemented with Nodejs/Expressjs, EJS and MongoDB.

The "blog posts", which are dynamically retrieved from the database, are displayed
shortened in the Homepage. To read the full posts, you have to click the clikable
title, or the "read more" button, both of which take you to the post page. The blog 
posts are saved as strings in the database, but with the help of JS, the 
text is normally displayed with paragraphs.

The site so far includes the following features: 

  1) Posting, editing and deleting posts. Editing and deleting can be done in the 
  post page, which also includes social media links, the date the post was added 
  to the site and a "random" button, which takes you to a random post.
 
  2) A contact page with a form which allows visitors to send messages to the blog
  owner. The messages and posts are saved in a database. Input validations has been
  implemented in every case the user must type text.

What I want to implement in the future:

  1) Clickable tags next to each post.
  2) User sessions. Since sessions haven't been implemented, everyone can now post,
  edit or delete the posts of the site without having to sign in as the admin.
 
Thanks for checking out my project :)
