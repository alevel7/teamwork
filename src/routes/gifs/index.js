const gifRouter = require('express').Router();
import db from '../../db';


// route to post a gif
gifRouter.route("/")
.post((req, res) => {
  const file = req.file;
  const title = req.body.title;
  if (!file){
    return res.status(400).json({"status":"error", "data":"No image was selected"})
  } else if (title === "" || title === null){
    return res.status(400).json({"status":"error", "data":"No title was provided"})
  }
  let sql = `insert into gifs (imageUrl,title,users_user_id) values (?,?,?)`;
  db.run(sql, [file.filename, title, req.userId], function(err){
    if (err) {
      return res.status(400).json({ err })
    }
    db.all(`select * from gifs where gif_id = ${this.lastID}`, [], function (err, rows) {
      return res.status(200).json({
        "status": "success",
        "data": {
          "message": "image successfully posted",
          "imageId": rows[0].gif_id,
          "createdOn": rows[0].dateCreated,
          "title": rows[0].title,
          "imageUrl": rows[0].imageUrl
        }
  })
  })
  })})

//working with a single gif
gifRouter.route("/:gifId")
.get((req, res) => {
  const gifId = req.params.gifId;
  let sql = `select * from gifs where gif_id = ?`;
  //if article is found
  db.all(sql, [gifId], function (err, rows) {
    if (rows.length === 0) {
      return res.status(404).json({ "status": "Not found", "message": "gif doesn't exist or already deleted" })
    } else {
      const answer = rows[0];
      sql = `select * from gif_comment where gifs_gif_id = ? and users_user_id=?`;
      db.all(sql, [gifId, req.userId], function (err, details) {
        return res.status(200).json({
          "status": "success",
          "data": {
            "id": answer.gif_id,
            "createdOn": answer.dateCreated,
            "title": answer.title,
            "url": answer.imageUrl,
            "comments": details
          }
        })
      })
    }
  })
})
.delete((req, res)=>{
  const gifId = req.params.gifId;
  let sql = `delete from gifs where gif_id = ?`;
  db.run(sql, [gifId], function (err) {
    if (err) {
      return res.status(400).json({ "status": "failed", "error": "unable to delete specified gif image" })
    } else {
      return res.status(200).json({
        "status": "success",
        "data": {
          "message": "gif post successfully deleted"
        }
      })
    }
  })
})

//comments on gifs
gifRouter.route("/:gifId/comment")
.post((req, res)=>{
  const gifId = req.params.gifId;
  //verify comment is not empty
  const comment = req.body.comment;
  const patt = /[a-zA-Z0-9\W]+/i
  const patt1 = /[$-/:-?{-~!"^_`\[\]@]/
  //check if the comment contains at least a character or symbol
  if (patt.test(comment) || patt1.test(comment)) {
    //check if the article to be commented exists
    let sql = `select * from gifs where gif_id = ?`
    db.all(sql, [gifId], function (err, rows) {
      if (rows.length === 0) {
        return res.status(404).json({ "status": "failed", "error": "gif does not exists" })
      } else {
        const answer = rows[0];
        //if article exists, then add a comment
        sql = `insert into gif_comment (comment, gifs_gif_id, users_user_id) values (?,?,?)`;
        db.run(sql, [comment, gifId, req.userId], function (err) {
          if (err) {
            return res.json({ "status": "error", "error": "unable to add comment" })
          } else {
            //get the creation date of the comment
            sql = `select createdOn from gif_comment where gif_comment_id = ?`;
            db.all(sql, [this.lastID], function (err, result_1) {
              return res.status(201).json({
                "status": "success",
                "data": {
                  "message": "comment successfully created",
                  "createdOn": result_1[0].createdOn,
                  "gifTitle": answer.title,
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

module.exports = gifRouter