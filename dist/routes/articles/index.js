'use strict';

var _db = require('../../db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ArticleRouter = require('express').Router();


// route to add an article
ArticleRouter.route("/").post(function (req, res) {
  var title = req.body.title || 'no title';
  var article = req.body.article;
  var user_id = req.user_id;
  if (!title || !article) {
    return res.status(400).json({ "status": "invalid input", "error": "title and article must be supplied" });
  } else {
    _db2.default.run('insert into article (title, article, users_user_id) values (?,?,?)', [title, article, req.userId], function (err) {
      if (err) {
        return res.status(400).json({ err: err });
      }
      _db2.default.all('select article_id, title, dateCreated, article, firstName, lastName from article\n      join users\n      on article.users_user_id = users.user_id\n      where article_id = ' + this.lastID, [], function (err, rows) {
        return res.status(200).json({
          "status": "success",
          "data": {
            "message": "article successfully posted",
            "articleId": rows[0].article_id,
            "createdOn": rows[0].dateCreated,
            "title": rows[0].title,
            "article": rows[0].article
          }
        });
      });
    });
  }
});

// routes to  edit, delete and get an article
ArticleRouter.route("/:articleId").patch(function (req, res) {
  var article_id = req.params.articleId;
  var title = req.body.title || 'no title';
  var article = req.body.article;
  if (title === '' || article === '') {
    return res.status(400).json({ "status": "invalid input", "error": "title and article must be supplied" });
  } else {
    var sql = 'update article set title =?, article=? where article_id=? and users_user_id=?';
    _db2.default.run(sql, [title, article, article_id, req.userId], function (err, rows) {
      if (err) {
        return res.status(400).json({ "status": "update failed", "error": "unable to update the article" });
      } else {
        _db2.default.all('select * from article where article_id = ' + article_id, [], function (err, rows) {
          if (err) {
            return res.status(400).json({ err: err });
          }
          return res.status(200).json({
            "status": "success",
            "data": {
              "message": "Article successfully updated",
              "title": rows[0].title,
              "article": rows[0].article
            }
          });
        });
      }
    });
  }
}).delete(function (req, res) {
  var article_id = req.params.articleId;
  var sql = 'delete from article where article_id = ? and users_user_id=?';
  _db2.default.run(sql, [article_id, req.userId], function (err) {
    if (err) {
      return res.json({ "status": "error", "error": "unable to delete the record from database" });
    } else {
      return res.status(200).json({
        "status": "success",
        "data": {
          "message": 'Article with id ' + article_id + ' successfully deleted'
        }
      });
    }
  });
}).get(function (req, res) {
  var article_id = req.params.articleId;
  var sql = 'select article_id, title, article, datetime(datecreated, \'localtime\') \'datecreated\',firstname, lastname, userImage, flagged, users_user_id from article\n  join users\n  on article.users_user_id = users.user_id where article_id = ?';
  //if article is found
  _db2.default.all(sql, [article_id], function (err, rows) {
    if (rows.length === 0) {
      return res.status(404).json({ "status": "Not found", "message": "article doesnt exist or already deleted" });
    } else {
      var answer = rows[0];
      sql = 'select comment_id, comment, article_article_id,datetime(article_comment.createdOn, \'localtime\') \'createdon\',firstname, lastname,userimage from article_comment\n      join users on article_comment.users_user_id = users.user_id where article_article_id = ?';
      _db2.default.all(sql, [article_id], function (err, details) {

        return res.status(200).json({
          "status": "success",
          "data": {
            "id": answer.article_id,
            "createdOn": answer.datecreated,
            "title": answer.title,
            "article": answer.article,
            "firstname": answer.firstName,
            "lastname": answer.lastName,
            "userimage": answer.userImage,
            "comments": details
          }
        });
      });
    }
  });
});

//add a comment to a post/article
ArticleRouter.route("/:articleId/comment").post(function (req, res) {
  var article_id = req.params.articleId;
  //verify comment is not empty
  var comment = req.body.comment;
  var patt = /[a-zA-Z0-9\W]+/i;
  var patt1 = /[$-/:-?{-~!"^_`\[\]@]/;
  //check if the comment contains at least a character or symbol
  if (patt.test(comment) || patt1.test(comment)) {
    //check if the article to be commented exists
    var sql = 'select * from article where article_id = ?';
    _db2.default.all(sql, [article_id], function (err, rows) {
      var answer = rows[0];
      if (rows.length === 0) {
        return res.status(404).json({ "status": "failed", "error": "article does not exists" });
      } else {
        //if article exists, then add a comment
        sql = 'insert into article_comment (users_user_id, article_article_id, comment) values (?,?,?)';
        _db2.default.run(sql, [req.userId, article_id, comment], function (err) {
          if (err) {
            return res.json({ "status": "error", "error": "unable to add comment" });
          } else {
            //get the creation date of the comment
            sql = 'select createdOn from article_comment where comment_id = ?';
            _db2.default.all(sql, [this.lastID], function (err, rows1) {
              return res.status(201).json({
                "status": "success",
                "data": {
                  "message": "comment successfully created",
                  "createdOn": rows1[0].createdOn,
                  "articleTitle": answer.title,
                  "article": answer.article,
                  "comment": comment
                }
              });
            });
          }
        });
      }
    });
  }
});

module.exports = ArticleRouter;
//# sourceMappingURL=index.js.map