'use strict';

var _sqlite = require('sqlite3');

var _sqlite2 = _interopRequireDefault(_sqlite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var db = new _sqlite2.default.Database('teamwork.db', function (err) {
  if (err) {
    return console.log(err.message);
  }
  console.log('Connected to database');
});

module.exports = db;
//# sourceMappingURL=db.js.map