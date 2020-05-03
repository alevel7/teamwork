import express from 'express';
import chalk from 'chalk';
import multer from 'multer';
const bodyParser = require('body-parser');
const Cors = require('cors')
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 3000;
const app = express();
const db = require('./db');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, PUT, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use('/images', express.static('images'));
//to store images in a folder in node js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
})
const upload = multer({
  storage: storage
})
const errHandler=(err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.json({
      error: "upload failed",
      message: err.message
    })
  }
}
app.use(errHandler);
app.use(Cors())

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // parse form data client


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
require("./routes")(app,verifyToken, upload);
//routes for creating and authenticating users
app.get('/', (req, res) => {
  res.send('Welcome to the TeamWork')
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

const compare = (a, b) => {
  if (a.dateCreated > b.dateCreated) { return -1 } else if (a.dateCreated < b.dateCreated) { return 1 } else { return 0 }
}
//get all articles and gif
app.get('/v1/feed', verifyToken, (req, res) => {
  let sql = `
  select article_id,title,article,dateCreated,users_user_id,flagged,firstName,lastname,userImage
from article
join users on users.user_id = article.users_user_id
where flagged = 'f';
  `
  db.all(sql, [], function (err, rows) {
    const result = rows
    if (err) {
      return res.json({ err })
    } else {

      let sql = `select gif_id,imageUrl,title,dateCreated,users_user_id, firstname,lastname,userImage
      from gifs join users on users.user_id = gifs.users_user_id`;

      db.all(sql, [], function (err, details) {
        const result1 = details;
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
            "message": flagged === 't'? "unflagged successfully": 'flagged successfully',
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