const MainUserRouter = require('express').Router();
import db from '../../db';
const jwt = require('jsonwebtoken');

// sigin of user
MainUserRouter.route("/signin").post((req, res) => {
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
// to create new user
MainUserRouter.route("/users").post((req, res) => {
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
      let sql = `insert into users (firstName, lastName, email, password, gender, jobRole, dept, address, userImage) values
       ('${firstName}','${lastName}','${email}','${password}','${gender}','${jobrole}','${dept}','${address}','${'images/' + req.file.originalname}')`
      db.all(sql, [], (err, result) => {
        if (err) {
          console.log("there was an error executing script")
          console.log(err)
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



module.exports = MainUserRouter