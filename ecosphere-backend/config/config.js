// Configuration file
const path = require('path');

module.exports = {
  port: process.env.PORT || 3001,
  usersFile: path.join(__dirname, '../../ecosphere-frontend/src/data/users.json'),
  env: process.env.NODE_ENV || 'development'
};
