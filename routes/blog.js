const express = require("express");
const mongodb = require("mongodb");
const db = require("../data/database");

const ObjectID = mongodb.ObjectId;
const router = express.Router();

router.get("/", function (req, res) {
  res.redirect("/posts");
});

router.get("/posts", async function (req, res) {
  const posts = await db
    .getDatabase()
    .collection("posts")
    .find({}, { title: 1, "author.name": 1, summary: 1 })
    .toArray();
  res.render("posts-list", { posts: posts });
});

router.get("/posts/:id", async (req, res, next) => {
  let postid;
  try {
    postid = new ObjectID(req.params.id);
  } catch (error) {
    return res.status(404).render("404");
    // return next(error);
  }
  const post = await db
    .getDatabase()
    .collection("posts")
    .findOne({ _id: postid }, { summary: 0 });

  post.hrDate = post.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  post.date = post.date.toISOString();

  res.render("post-detail", { post });
});

router.post("/posts/:id/delete", async (req, res) => {
  const postid = new ObjectID(req.params.id);
  await db.getDatabase().collection("posts").deleteOne({ _id: postid });
  res.redirect("/posts");
});

router.get("/posts/:id/edit", async (req, res) => {
  let postid;
  try {
    postid = new ObjectID(req.params.id);
  } catch (error) {
    return res.status(404).render("404");
    //return next(error);
  }
  const post = await db
    .getDatabase()
    .collection("posts")
    .findOne({ _id: postid }, { title: 1, summary: 1, content: 1 });
  res.render("update-post", { post });
});

router.post("/posts/:id/edit", async (req, res) => {
  const postid = new ObjectID(req.params.id);
  const post = await db
    .getDatabase()
    .collection("posts")
    .updateOne(
      { _id: postid },
      {
        $set: {
          title: req.body.title,
          summary: req.body.summary,
          content: req.body.content,
        },
      }
    );

  res.redirect("/posts");
});

router.post("/posts", async (req, res) => {
  const authorId = new ObjectID(req.body.author);
  const author = await db
    .getDatabase()
    .collection("authors")
    .findOne({ _id: authorId });
  const newPost = {
    title: req.body.title,
    summary: req.body.summary,
    content: req.body.content,
    date: new Date(),
    author: {
      id: author._id,
      name: author.name,
      email: author.email,
    },
  };

  const result = await db.getDatabase().collection("posts").insertOne(newPost);

  res.redirect("/posts");
});

router.get("/new-post", async function (req, res) {
  const authors = await db.getDatabase().collection("authors").find().toArray();
  res.render("create-post", { authors: authors });
});

module.exports = router;
