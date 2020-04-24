'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _multer = require('multer');

var _multer2 = _interopRequireDefault(_multer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var bodyParser = require('body-parser');
var Cors = require('cors');
var jwt = require('jsonwebtoken');
var port = process.env.PORT || 3000;
var app = (0, _express2.default)();
var db = require('./db');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, PUT, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.use('/images', _express2.default.static('images'));
//to store images in a folder in node js
var storage = _multer2.default.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, 'images');
  },
  filename: function filename(req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
var upload = (0, _multer2.default)({
  storage: storage
});
var errHandler = function errHandler(err, req, res, next) {
  if (err instanceof _multer2.default.MulterError) {
    return res.json({
      error: "upload failed",
      message: err.message
    });
  }
};
app.use(errHandler);
app.use(Cors());

app.use(bodyParser.urlencoded({ extended: true }));
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
require("./routes")(app, verifyToken, upload);
//routes for creating and authenticating users
app.get('/', function (req, res) {
  res.send('Welcome to the TeamWork');
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