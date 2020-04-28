'use strict';

var _db = require('../../db');

var _db2 = _interopRequireDefault(_db);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MainUserRouter = require('express').Router();

var jwt = require('jsonwebtoken');

// sigin of user
MainUserRouter.route("/signin").post(function (req, res) {
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
  _db2.default.all('select * from users where email=\'' + email + '\' and password=\'' + password + '\'', [], function (err, result) {
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
            "userId": payload.user_id,
            "userData": result
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
// to create new user
MainUserRouter.route("/users").post(function (req, res) {
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
    var sql = 'insert into users (firstName, lastName, email, password, gender, jobRole, dept, address, userImage) values\n       (\'' + firstName + '\',\'' + lastName + '\',\'' + email + '\',\'' + password + '\',\'' + gender + '\',\'' + jobrole + '\',\'' + dept + '\',\'' + address + '\',\'' + req.file.originalname + '\')';
    _db2.default.all(sql, [], function (err, result) {
      if (err) {
        console.log("there was an error executing script");
        console.log(err);
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

module.exports = MainUserRouter;
//# sourceMappingURL=index.js.map