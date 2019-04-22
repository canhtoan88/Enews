const bcrypt = require('bcrypt');
const config = require('config');

const hashPassword = function(password) {
  return bcrypt.hashSync(password, config.get('saltRound'));
}

const comparePassword = function(password, hashPass) {
  return bcrypt.compareSync(password, hashPass);
}

module.exports = {
  hashPassword,
  comparePassword
}
