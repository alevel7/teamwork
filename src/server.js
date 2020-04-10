import express from 'express';
import chalk from 'chalk';
import mysql from 'mysql';
import sqlite3 from 'sqlite3';
import multer from 'multer';
const bodyParser = require('body-parser');
const Cors = require('cors')

const jwt = require('jsonwebtoken');


const port = process.env.PORT || 3000;
const app = express();


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, PUT, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use('/images', express.static('images'));
//to store images in a folder in node js
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = MIMETYPEMAP[file.mimetype];
    let error = new Error('invalid mime type');
    if (isValid) {
      error = null
      console.log(file)
      cb(error, './images');
    }

  },
  filename: function (req, file, cb) {
    const name = file.originalname;
    cb(null, name);
  }
})
const MIMETYPEMAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg'
}
//to configure which type of file to accept
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'image/gif') {
//     cb(null, true);
//   } else {
//     cb(null, false)
//   }
// }
const upload = multer({ storage: storage, /*fileFilter*/ });

const db = new sqlite3.Database('teamwork.db', (err) => {
  if (err) {
    return console.log(err.message);
  }
  console.log('Connected to database')
});

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' })); // parse form data client


const verifyToken = (req, res, next) => {
  if (!req.headers.token) {
    return res.status(401).json({ "status": "token error", "error": "Unauthorized request" })
  }
  const token = req.headers.token
  if (token === 'null') {
    return res.status(401).json({ "status": "token error", "error": "Token is required" })
  }
  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) {
      return res.status(401).json({ "status": "token error", "error": "Unauthorized request" })
    }
    req.userId = decoded.user_id
  })
  next()
}
//routes for creating and authenticating users
app.get('/api', (req, res) => {
  res.send('Welcome to the TeamWork')
})

//login a user
app.post('/v1/auth/signin', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      'status': 'invalid request',
      'error': "username and password are required"
    })
  }
  if (email === '' || password === '') {
    return res.status(401).json({
      "status": "forbidden",
      "error": "username and password are required"
    })
  }
  let pattern = /^[a-zA-Z0-9]+@[\w]+\.com$/i
  if (!pattern.test(email)) {
    return res.status(401).json({
      "status": "forbidden",
      "error": "email is invalid"
    })
  }
  db.all(`select * from users where email='${email}' and password='${password}'`, [], (err, result) => {
    if (err) {
      console.log(err)
    } else {

      if (result.length > 0) {
        let payload = { user_id: result[0].user_id }
        let token = jwt.sign(payload, 'secretkey')
        res.status(200).json({
          "status": "success",
          "data": {
            "token": token,
            "userId": payload.user_id,
            "userData": result
          }
        })
      } else {
        res.status(401).json({
          "status": "forbidden",
          "error": "No account match for specified username and password"
        })

      }
    }
  })
})

//get all users
app.get('/v1/users', verifyToken, (req, res) => {
  let sql = `select * from users`;
  db.all(sql, [], (err, result) => {
    if (err) {
      return res.status(400).json({ err })
    } else {
      return res.status(200).json(result);
    }
  })
})


//create  a user
app.post('/v1/auth/users', upload.single('userImage'), (req, res) => {
  if (req.file === undefined) {
    return res.status(400).json({
      "status": "bad request", "error": "No user image specified"
    })
  } else {
    const user = req.body
    const firstName = user.firstName
    const lastName = user.lastName
    const email = user.email
    const password = user.password
    const gender = user.gender
    const jobrole = user.jobRole
    const dept = user.dept
    const address = user.address
    if (firstName.length < 1 || lastName.length < 0 || dept.length < 0) {
      return res.status(401).json({
        "status": "forbidden",
        "error": "one or more required field not supplied"
      })
    }
    let pattern = /^[a-zA-Z0-9]+@[\w]+\.com$/i
    if (!pattern.test(email)) {
      return res.status(401).json({
        "status": "forbidden",
        "error": "email is invalid"
      })
    }
    let sql = `insert into users (firstName, lastName, email, password, gender, jobRole, dept, address, userImage) values ('${firstName}','${lastName}','${email}','${password}','${gender}','${jobrole}','${dept}','${address}','${'images/' + req.file.originalname}')`
    db.all(sql, [], (err, result) => {
      if (err) {
        console.log("there was an error executing script")
        res.send(err)
      } else {
        let payload = { user_id: result.insertId }
        let token = jwt.sign(payload, 'secretkey')
        res.status(201).json({
          "status": "success",
          "message": "User account successfully created",
          "token": token,
          "userId": result.insertId
        })
      }
    })
  }
})

//add an article
app.post('/v1/articles', verifyToken, (req, res) => {
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

//edit an article
app.patch('/v1/articles/:articleId', verifyToken, (req, res) => {
  const article_id = req.params.articleId
  const title = req.body.title || 'no title';
  const article = req.body.article;
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

//delete an article
app.delete('/v1/articles/:articleId', verifyToken, (req, res) => {
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

//add a comment to a post/article
app.post('/v1/articles/:articleId/comment', verifyToken, (req, res) => {
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

//get an article
app.get('/v1/articles/:articleId', verifyToken, (req, res) => {
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

// post gif
app.post('/v1/gifs', verifyToken, upload.single('image'), (req, res, next) => {
  return res.send('your file was uploaded');

  // if (!req.file) {
  //   console.log(req.file)
  //   return res.status(400).json({
  //     "status": "bad request", "error": "No gif image specified"
  //   })
  // } else {
  //   let sql = `insert into gifs (imageUrl, title, users_user_id) values (?,?,?)`;
  //   db.run(sql, ['images/' + req.file.originalname, req.body.title || 'no title', req.userId], function (err) {
  //     if (err) {
  //       return res.status(500).json({ "status": "failed", "error": "there was an erro storing the image" })
  //     } else {
  //       sql = `select * from gifs where gif_id=? and users_user_id=?`;
  //       db.all(sql, [this.lastID, req.userId], function (err, rows) {
  //         return res.status(201).json({
  //           "status": "success",
  //           "data": {
  //             "gifId": rows[0].gif_id,
  //             "message": "GIF image successfully posted",
  //             "createdOn": rows[0].dateCreated,
  //             "title": rows[0].title,
  //             "imageUrl": 'images/' + req.file.originalname
  //           }
  //         })
  //       })
  //     }
  //   })
  // }
})

//delete a gif
app.delete('/v1/gifs/:gifId', verifyToken, (req, res) => {
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

//add comment to a gif
app.post('/v1/gifs/:gifId/comment', verifyToken, (req, res) => {
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

//get a specific gif
app.get('/v1/gifs/:gifId', verifyToken, (req, res) => {
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

const compare = (a, b) => {
  if (a.dateCreated > b.dateCreated) { return -1 } else if (a.dateCreated < b.dateCreated) { return 1 } else { return 0 }
}
//get all articles and gif
app.get('/v1/feed', verifyToken, (req, res) => {
  let sql = `
  select article_id,title,article,dateCreated,users_user_id,flagged,firstName,lastname
from article
join users on users.user_id = article.users_user_id;
  `
  db.all(sql, [], function (err, rows) {
    const result = rows
    if (err) {
      return res.json({ err })
    } else {

      let sql = `select gif_id,imageUrl,title,dateCreated,users_user_id, firstname,lastname
      from gifs join users on users.user_id = gifs.users_user_id`;

      db.all(sql, [], function (err, details) {
        const result1 = details;
        console.log(result1);
        let all_feed = result.concat(result1);
        all_feed.sort(compare);
        res.status(200).json({
          "status": "success",
          "data": all_feed
        })
      })
    }
  })
})

//get all article and gif for a single user
app.get('/v1/feed/:userId', verifyToken, (req, res) => {
  let sql = `select * from article where users_user_id = ?`

  db.all(sql, [req.userId], function (err, rows) {
    if (err) {
      return res.json({ err });
    } else {
      const result = rows;
      let sql = `select * from gifs where users_user_id = ?`;
      db.all(sql, [req.userId], function (err, rows) {
        if (err) {
          return res.json({ err });
        }
        const gif_result = rows;
        let all_feed = result.concat(gif_result);
        all_feed.sort(compare);
        res.status(200).json({
          "status": "success",
          "data": all_feed
        })
      })
    }
  })
})

//get all flagged post
app.get('/v1/flagged', verifyToken, (req, res) => {
  let sql = `select * from article where flagged = 't' `
  db.all(sql, [], function (err, result) {
    if (err) {
      return res.status(400).json({ err })
    } else {
      return res.status(200).json({
        "status": "success",
        "data": result
      })
    }
  })
})

//flag a post
app.post('/v1/flagged/:articleId', verifyToken, (req, res) => {
  const article_id = req.params.articleId;
  let flagged = 't';
  let sql = `select * from article where article_id = ?`;
  db.all(sql, [article_id], function (err, result) {
    if (err) {
      return res.status(400).json({ err });
    } else {
      flagged = result[0].flagged;
      if (flagged == 'f') {
        sql = `update article set flagged = 't' where article_id = ?`;
      } else {
        sql = `update article set flagged = 'f' where article_id = ?`;
      }
      db.run(sql, [article_id], function (err) {
        if (err) {
          return res.status(400).json({ err })
        } else {
          return res.status(200).json({
            "message": "flagged successfully",
            "article_id": article_id,
          })
        }
      })
    }
  })
})

app.listen(port, (err) => {
  if (err) {
    console.log(err)
  }
  console.log(chalk.red(`listening of port ${port}. starting app in dev mode`))
})