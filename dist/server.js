'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _sqlite = require('sqlite3');

var _sqlite2 = _interopRequireDefault(_sqlite);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var bodyParser = require('body-parser');
var Cors = require('cors');

var jwt = require('jsonwebtoken');


var port = process.env.PORT || 3000;
var app = (0, _express2.default)();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/images', _express2.default.static('images'));
//to store images in a folder in node js
var storage = _multer2.default.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, './images');
  },
  filename: function filename(req, file, cb) {
    cb(null, file.originalname);
  }
});
//to configure which type of file to accept
var fileFilter = function fileFilter(req, file, cb) {
  if (file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
var upload = (0, _multer2.default)({ storage: storage /*fileFilter*/ });

// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'Oluranti08056965',
//   database: 'teamwork'
// })
var db = new _sqlite2.default.Database('teamwork.db', function (err) {
  if (err) {
    return console.log(err.message);
  }
  console.log('Connected to database');
});

// db.connect((err) => {
//   if (err) {
//     console.log('database connection error')
//     throw err
//   }
//   console.log('Connected to database')
// })


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // parse form data client


var verifyToken = function verifyToken(req, res, next) {
  if (!req.headers.token) {
    return res.status(401).json({ "status": "token error", "error": "Unauthorized request" });
  }
  var token = req.headers.token;
  if (token === 'null') {
    return res.status(401).json({ "status": "token error", "error": "Token is required" });
  }
  jwt.verify(token, 'secretkey', function (err, decoded) {
    if (err) {
      return res.status(401).json({ "status": "token error", "error": "Unauthorized request" });
    }
    req.userId = decoded.user_id;
  });
  next();
};
//routes for creating and authenticating users
app.get('/', function (req, res) {
  res.send('Welcome to the TeamWork');
});

//login a user
app.post('/v1/auth/signin', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({
      'status': 'invalid request',
      'error': "username and password are required"
    });
  }
  if (email === '' || password === '') {
    return res.status(401).json({
      "status": "forbidden",
      "error": "username and password are required"
    });
  }
  var pattern = /^[a-zA-Z0-9]+@[\w]+\.com$/i;
  if (!pattern.test(email)) {
    return res.status(401).json({
      "status": "forbidden",
      "error": "email is invalid"
    });
  }
  db.all('select * from users where email=\'' + email + '\' and password=\'' + password + '\'', [], function (err, result) {
    if (err) {
      console.log(err);
    } else {

      if (result.length > 0) {
        var payload = { user_id: result[0].user_id };
        var token = jwt.sign(payload, 'secretkey');
        res.status(200).json({
          "status": "success",
          "data": {
            "token": token,
            "userId": payload.user_id
          }
        });
      } else {
        res.status(401).json({
          "status": "forbidden",
          "error": "No account match for specified username and password"
        });
      }
    }
  });
});

//get all users
app.get('/v1/users', verifyToken, function (req, res) {
  var sql = 'select * from users';
  db.all(sql, [], function (err, result) {
    if (err) {
      return res.status(400).json({ err: err });
    } else {
      return res.status(200).json(result);
    }
  });
});

//create  a user
app.post('/v1/auth/users', upload.single('userImage'), function (req, res) {
  if (req.file === undefined) {
    return res.status(400).json({
      "status": "bad request", "error": "No user image specified"
    });
  } else {
    var user = req.body;
    var firstName = user.firstName;
    var lastName = user.lastName;
    var email = user.email;
    var password = user.password;
    var gender = user.gender;
    var jobrole = user.jobRole;
    var dept = user.dept;
    var address = user.address;
    if (firstName.length < 1 || lastName.length < 0 || dept.length < 0) {
      return res.status(401).json({
        "status": "forbidden",
        "error": "one or more required field not supplied"
      });
    }
    var pattern = /^[a-zA-Z0-9]+@[\w]+\.com$/i;
    if (!pattern.test(email)) {
      return res.status(401).json({
        "status": "forbidden",
        "error": "email is invalid"
      });
    }
    var sql = 'insert into users (firstName, lastName, email, password, gender, jobRole, dept, address, userImage) values (\'' + firstName + '\',\'' + lastName + '\',\'' + email + '\',\'' + password + '\',\'' + gender + '\',\'' + jobrole + '\',\'' + dept + '\',\'' + address + '\',\'' + ('images/' + req.file.originalname) + '\')';
    db.all(sql, [], function (err, result) {
      if (err) {
        console.log("there was an error executing script");
        res.send(err);
      } else {
        var payload = { user_id: result.insertId };
        var token = jwt.sign(payload, 'secretkey');
        res.status(201).json({
          "status": "success",
          "message": "User account successfully created",
          "token": token,
          "userId": result.insertId
        });
      }
    });
  }
});

//add an article
app.post('/v1/articles', verifyToken, function (req, res) {
  var title = req.body.title || 'no title';
  var article = req.body.article;
  var user_id = req.user_id;
  if (!title || !article) {
    return res.status(400).json({ "status": "invalid input", "error": "title and article must be supplied" });
  } else {
    db.run('insert into article (title, article, users_user_id) values (?,?,?)', [title, article, req.userId], function (err) {
      if (err) {
        return res.status(400).json({ err: err });
      }
      db.all('select * from article where article_id = ' + this.lastID, [], function (err, rows) {
        return res.status(200).json({
          "status": "success",
          "data": {
            "message": "article successfully posted",
            "articleId": rows[0].article_id,
            "createdOn": rows[0].createdOn,
            "title": rows[0].title
          }
        });
      });
    });
  }
});

//edit an article
app.patch('/v1/articles/:articleId', verifyToken, function (req, res) {
  var article_id = req.params.articleId;
  var title = req.body.title || 'no title';
  var article = req.body.article;
  if (title === '' || article === '') {
    return res.status(400).json({ "status": "invalid input", "error": "title and article must be supplied" });
  } else {
    var sql = 'update article set title =?, article=? where article_id=? and users_user_id=?';
    db.run(sql, [title, article, article_id, req.userId], function (err, rows) {
      if (err) {
        return res.status(400).json({ "status": "update failed", "error": "unable to update the article" });
      } else {
        db.all('select * from article where article_id = ' + article_id, [], function (err, rows) {
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
});

//delete an article
app.delete('/v1/articles/:articleId', verifyToken, function (req, res) {
  var article_id = req.params.articleId;
  var sql = 'delete from article where article_id = ? and users_user_id=?';
  db.run(sql, [article_id, req.userId], function (err) {
    if (err) {
      console.log(err);
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
});

//add a comment to a post/article
app.post('/v1/articles/:articleId/comment', verifyToken, function (req, res) {
  var article_id = req.params.articleId;
  //verify comment is not empty
  var comment = req.body.comment;
  var patt = /[a-zA-Z0-9\W]+/i;
  var patt1 = /[$-/:-?{-~!"^_`\[\]@]/;
  //check if the comment contains at least a character or symbol
  if (patt.test(comment) || patt1.test(comment)) {
    //check if the article to be commented exists
    var sql = 'select * from article where article_id = ?';
    db.all(sql, [article_id], function (err, rows) {
      var answer = rows[0];
      if (rows.length === 0) {
        return res.status(404).json({ "status": "failed", "error": "article does not exists" });
      } else {
        //if article exists, then add a comment
        sql = 'insert into article_comment (users_user_id, article_article_id, comment) values (?,?,?)';
        db.run(sql, [req.userId, article_id, comment], function (err) {
          if (err) {
            return res.json({ "status": "error", "error": "unable to add comment" });
          } else {
            //get the creation date of the comment
            sql = 'select createdOn from article_comment where comment_id = ?';
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
              });
            });
          }
        });
      }
    });
  }
});

//get an article
app.get('/v1/articles/:articleId', verifyToken, function (req, res) {
  var article_id = req.params.articleId;
  var sql = 'select * from article where article_id = ?';
  //if article is found
  db.all(sql, [article_id], function (err, rows) {
    if (rows.length === 0) {
      return res.status(404).json({ "status": "Not found", "message": "article doesnt exist or already deleted" });
    } else {
      var answer = rows[0];
      sql = 'select * from article_comment where article_article_id = ? and users_user_id=?';
      db.all(sql, [article_id, req.userId], function (err, details) {

        return res.status(200).json({
          "status": "success",
          "data": {
            "id": answer.article_id,
            "createdOn": answer.dateCreated,
            "title": answer.title,
            "article": answer.article,
            "comments": details
          }
        });
      });
    }
  });
});

// post gif
app.post('/v1/gifs', verifyToken, upload.single('image'), function (req, res, next) {
  if (req.file === undefined) {
    return res.status(400).json({
      "status": "bad request", "error": "No gif image specified"
    });
  } else {
    var sql = 'insert into gifs (imageUrl, title, users_user_id) values (?,?,?)';
    db.run(sql, ['images/' + req.file.originalname, req.body.title || 'no title', req.userId], function (err) {
      if (err) {
        return res.status(500).json({ "status": "failed", "error": err });
      } else {
        sql = 'select * from gifs where gif_id=? and users_user_id=?';
        db.all(sql, [this.lastID, req.userId], function (err, rows) {
          return res.status(201).json({
            "status": "success",
            "data": {
              "gifId": rows[0].gif_id,
              "message": "GIF image successfully posted",
              "createdOn": rows[0].dateCreated,
              "title": rows[0].title,
              "imageUrl": 'images/' + req.file.originalname
            }
          });
        });
      }
    });
  }
});

//delete a gif
app.delete('/v1/gifs/:gifId', verifyToken, function (req, res) {
  var gifId = req.params.gifId;
  var sql = 'delete from gifs where gif_id = ?';
  db.run(sql, [gifId], function (err) {
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

//add comment to a gif
app.post('/v1/gifs/:gifId/comment', verifyToken, function (req, res) {
  var gifId = req.params.gifId;
  //verify comment is not empty
  var comment = req.body.comment;
  var patt = /[a-zA-Z0-9\W]+/i;
  var patt1 = /[$-/:-?{-~!"^_`\[\]@]/;
  //check if the comment contains at least a character or symbol
  if (patt.test(comment) || patt1.test(comment)) {
    //check if the article to be commented exists
    var sql = 'select * from gifs where gif_id = ?';
    db.all(sql, [gifId], function (err, rows) {
      if (rows.length === 0) {
        return res.status(404).json({ "status": "failed", "error": "gif does not exists" });
      } else {
        var answer = rows[0];
        //if article exists, then add a comment
        sql = 'insert into gif_comment (comment, gifs_gif_id, users_user_id) values (?,?,?)';
        db.run(sql, [comment, gifId, req.userId], function (err) {
          if (err) {
            return res.json({ "status": "error", "error": "unable to add comment" });
          } else {
            //get the creation date of the comment
            sql = 'select createdOn from gif_comment where gif_comment_id = ?';
            db.all(sql, [this.lastID], function (err, result_1) {
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

//get a specific gif
app.get('/v1/gifs/:gifId', verifyToken, function (req, res) {
  var gifId = req.params.gifId;
  var sql = 'select * from gifs where gif_id = ?';
  //if article is found
  db.all(sql, [gifId], function (err, rows) {
    if (rows.length === 0) {
      return res.status(404).json({ "status": "Not found", "message": "gif doesn't exist or already deleted" });
    } else {
      var answer = rows[0];
      sql = 'select * from gif_comment where gifs_gif_id = ? and users_user_id=?';
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
        });
      });
    }
  });
});

var compare = function compare(a, b) {
  if (a.dateCreated > b.dateCreated) {
    return -1;
  } else if (a.dateCreated < b.dateCreated) {
    return 1;
  } else {
    return 0;
  }
};
//get all articles and gif
app.get('/v1/feed', verifyToken, function (req, res) {
  var sql = '\n  select article_id,title,article,dateCreated,users_user_id,flagged,firstName,lastname\nfrom article\njoin users on users.user_id = article.users_user_id;\n  ';
  db.all(sql, [], function (err, rows) {
    var result = rows;
    if (err) {
      return res.json({ err: err });
    } else {

      var _sql = 'select gif_id,imageUrl,title,dateCreated,users_user_id, firstname,lastname\n      from gifs join users on users.user_id = gifs.users_user_id';

      db.all(_sql, [], function (err, details) {
        var result1 = details;
        console.log(result1);
        var all_feed = result.concat(result1);
        all_feed.sort(compare);
        res.status(200).json({
          "status": "success",
          "data": all_feed
        });
      });
    }
  });
});

//get all article and gif for a single user
app.get('/v1/feed/:userId', verifyToken, function (req, res) {
  var sql = 'select * from article where users_user_id = ?';

  db.all(sql, [req.userId], function (err, rows) {
    if (err) {
      return res.json({ err: err });
    } else {
      var result = rows;
      var _sql2 = 'select * from gifs where users_user_id = ?';
      db.all(_sql2, [req.userId], function (err, rows) {
        if (err) {
          return res.json({ err: err });
        }
        var gif_result = rows;
        var all_feed = result.concat(gif_result);
        all_feed.sort(compare);
        res.status(200).json({
          "status": "success",
          "data": all_feed
        });
      });
    }
  });
});

//get all flagged post
app.get('/v1/flagged', verifyToken, function (req, res) {
  var sql = 'select * from article where flagged = \'t\' ';
  db.all(sql, [], function (err, result) {
    if (err) {
      return res.status(400).json({ err: err });
    } else {
      return res.status(200).json({
        "status": "success",
        "data": result
      });
    }
  });
});

//flag a post
app.post('/v1/flagged/:articleId', verifyToken, function (req, res) {
  var article_id = req.params.articleId;
  var flagged = 't';
  var sql = 'select * from article where article_id = ?';
  db.all(sql, [article_id], function (err, result) {
    if (err) {
      return res.status(400).json({ err: err });
    } else {
      flagged = result[0].flagged;
      if (flagged == 'f') {
        sql = 'update article set flagged = \'t\' where article_id = ?';
      } else {
        sql = 'update article set flagged = \'f\' where article_id = ?';
      }
      db.run(sql, [article_id], function (err) {
        if (err) {
          return res.status(400).json({ err: err });
        } else {
          return res.status(200).json({
            "message": "flagged successfully",
            "article_id": article_id
          });
        }
      });
    }
  });
});

app.listen(port, function (err) {
  if (err) {
    console.log(err);
  }
  console.log(_chalk2.default.red('listening of port ' + port + '. starting app in dev mode'));
});
//# sourceMappingURL=server.js.map