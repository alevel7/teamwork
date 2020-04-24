const ArticleRouter = require('express').Router();
import db from '../../db';


// route to add an article
ArticleRouter.route("/")
.post((req, res) => {
  const title = req.body.title || 'no title';
  const article = req.body.article;
  const user_id = req.user_id;
  if (!title || !article) {
    return res.status(400).json({ "status": "invalid input", "error": "title and article must be supplied" });
  } else {
    db.run(`insert into article (title, article, users_user_id) values (?,?,?)`, [title, article, req.userId], function (err) {
      if (err) {
        return res.status(400).json({ err })
      }
      db.all(`select * from article where article_id = ${this.lastID}`, [], function (err, rows) {
        return res.status(200).json({
          "status": "success",
          "data": {
            "message": "article successfully posted",
            "articleId": rows[0].article_id,
            "createdOn": rows[0].createdOn,
            "title": rows[0].title
          }
        })
      })
    }
    )
  }
})

// routes to  edit, delete and get an article
ArticleRouter.route("/:articleId")
.patch((req, res) => {
  const article_id = req.params.articleId
  const title = req.body.title || 'no title';
  const article = req.body.article;
  console.log(article_id, title, article)
  if (title === '' || article === '') {
    return res.status(400).json({ "status": "invalid input", "error": "title and article must be supplied" });
  } else {
    let sql = `update article set title =?, article=? where article_id=? and users_user_id=?`;
    db.run(sql, [title, article, article_id, req.userId], function (err, rows) {
      if (err) {
        return res.status(400).json({ "status": "update failed", "error": "unable to update the article" })
      } else {
        db.all(`select * from article where article_id = ${article_id}`, [], function (err, rows) {
          if (err) {
            return res.status(400).json({ err })
          }
          return res.status(200).json({
            "status": "success",
            "data": {
              "message": "Article successfully updated",
              "title": rows[0].title,
              "article": rows[0].article
            }
          })
        });

      }
    })
  }
})
.delete((req, res) => {
  const article_id = req.params.articleId
  const sql = `delete from article where article_id = ? and users_user_id=?`;
  db.run(sql, [article_id, req.userId], function (err) {
    if (err) {
      console.log(err)
      return res.json({ "status": "error", "error": "unable to delete the record from database" })
    } else {
      return res.status(200).json({
        "status": "success",
        "data": {
          "message": `Article with id ${article_id} successfully deleted`
        }
      })
    }
})
})
.get((req, res) => {
  const article_id = req.params.articleId;
  let sql = `select * from article where article_id = ?`;
  //if article is found
  db.all(sql, [article_id], function (err, rows) {
    if (rows.length === 0) {
      return res.status(404).json({ "status": "Not found", "message": "article doesnt exist or already deleted" })
    } else {
      let answer = rows[0];
      sql = `select * from article_comment where article_article_id = ?`;
      db.all(sql, [article_id], function (err, details) {

        return res.status(200).json({
          "status": "success",
          "data": {
            "id": answer.article_id,
            "createdOn": answer.dateCreated,
            "title": answer.title,
            "article": answer.article,
            "comments": details
          }
        })
      })
    }
  })
})

//add a comment to a post/article
ArticleRouter.route("/:articleId/comment")
.post((req, res)=> {
  const article_id = req.params.articleId;
  //verify comment is not empty
  const comment = req.body.comment;
  const patt = /[a-zA-Z0-9\W]+/i
  const patt1 = /[$-/:-?{-~!"^_`\[\]@]/
  //check if the comment contains at least a character or symbol
  if (patt.test(comment) || patt1.test(comment)) {
    //check if the article to be commented exists
    let sql = `select * from article where article_id = ?`;
    db.all(sql, [article_id], function (err, rows) {
      let answer = rows[0]
      if (rows.length === 0) {
        return res.status(404).json({ "status": "failed", "error": "article does not exists" })
      } else {
        //if article exists, then add a comment
        sql = `insert into article_comment (users_user_id, article_article_id, comment) values (?,?,?)`;
        db.run(sql, [req.userId, article_id, comment], function (err) {
          if (err) {
            return res.json({ "status": "error", "error": "unable to add comment" })
          } else {
            //get the creation date of the comment
            sql = `select createdOn from article_comment where comment_id = ?`;
            db.all(sql, [this.lastID], function (err, rows1) {
              return res.status(201).json({
                "status": "success",
                "data": {
                  "message": "comment successfully created",
                  "createdOn": rows1[0].createdOn,
                  "articleTitle": answer.title,
                  "article": answer.article,
                  "comment": comment
                }
              })
            })
          }
        })
      }
    })
  }
})

module.exports = ArticleRouter