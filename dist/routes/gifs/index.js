'use strict';

var _db = require('../../db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var gifRouter = require('express').Router();


// route to post a gif
gifRouter.route("/").post(function (req, res) {
  console.log(req.file);
  return res.json({ 'status': 'success', 'data': "file upload successfull", "file": req.file });
});

//working with a single gif
gifRouter.route("/:gifId").get(function (req, res) {
  var gifId = req.params.gifId;
  var sql = 'select * from gifs where gif_id = ?';
  //if article is found
  _db2.default.all(sql, [gifId], function (err, rows) {
    if (rows.length === 0) {
      return res.status(404).json({ "status": "Not found", "message": "gif doesn't exist or already deleted" });
    } else {
      var answer = rows[0];
      sql = 'select * from gif_comment where gifs_gif_id = ? and users_user_id=?';
      _db2.default.all(sql, [gifId, req.userId], function (err, details) {
        return res.status(200).json({
          "status": "success",
          "data": {
            "id": answer.gif_id,
            "createdOn": answer.dateCreated,
            "title": answer.title,
            "url": answer.imageUrl,
            "comments": details
          }
        });
      });
    }
  });
}).delete(function (req, res) {
  var gifId = req.params.gifId;
  var sql = 'delete from gifs where gif_id = ?';
  _db2.default.run(sql, [gifId], function (err) {
    if (err) {
      return res.status(400).json({ "status": "failed", "error": "unable to delete specified gif image" });
    } else {
      return res.status(200).json({
        "status": "success",
        "data": {
          "message": "gif post successfully deleted"
        }
      });
    }
  });
});

//comments on gifs
gifRouter.route("/:gifId/comment").post(function (req, res) {
  var gifId = req.params.gifId;
  //verify comment is not empty
  var comment = req.body.comment;
  var patt = /[a-zA-Z0-9\W]+/i;
  var patt1 = /[$-/:-?{-~!"^_`\[\]@]/;
  //check if the comment contains at least a character or symbol
  if (patt.test(comment) || patt1.test(comment)) {
    //check if the article to be commented exists
    var sql = 'select * from gifs where gif_id = ?';
    _db2.default.all(sql, [gifId], function (err, rows) {
      if (rows.length === 0) {
        return res.status(404).json({ "status": "failed", "error": "gif does not exists" });
      } else {
        var answer = rows[0];
        //if article exists, then add a comment
        sql = 'insert into gif_comment (comment, gifs_gif_id, users_user_id) values (?,?,?)';
        _db2.default.run(sql, [comment, gifId, req.userId], function (err) {
          if (err) {
            return res.json({ "status": "error", "error": "unable to add comment" });
          } else {
            //get the creation date of the comment
            sql = 'select createdOn from gif_comment where gif_comment_id = ?';
            _db2.default.all(sql, [this.lastID], function (err, result_1) {
              return res.status(201).json({
                "status": "success",
                "data": {
                  "message": "comment successfully created",
                  "createdOn": result_1[0].createdOn,
                  "gifTitle": answer.title,
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

module.exports = gifRouter;
//# sourceMappingURL=index.js.map