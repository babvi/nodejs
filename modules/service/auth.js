const jwt = require('jsonwebtoken');
const config = require('../../config/index');

/**
 * Generate Token
 * This function used to generate user token
 * @return {string} jwt token
 */
exports.generateToken = function() {
  const user = {
    userId: 123,
    userName: 'userName',
    profileImage: '',
    gender: 'male',
  };
  return jwt.sign(user, config.secret, {
    expiresIn: 86400, // expires in 24 hours
  });
};


/**
 * JWT Authentication
 * This function used to authenticates all rest endpoints
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 * @param {Object} next The next action.
 * @return {Object} next()
 */
exports.jwt = function(req, res, next) {
  const token = req.headers['authorization'];
  const result = token ? token.substr(token.indexOf(' ') + 1) : false;
  if (!result) {
    return res.status(403).send({'status': false, 'code': 403, 'message': 'Unauthorized !'});
  }
  jwt.verify(result, config.secret, function(err, decoded) {
    if (err) {
      return res.status(500).send({'status': false, 'code': 500, 'message': 'Failed to authenticate token. !'});
    }
    req.user = decoded;
    next();
  });
};

/**
 * Authenticate Socket
 * This function used to authenticates all socket events
 * @param {Object} socket The socket object.
 * @param {Object} next The next action.
 * @return {Object} next()
 */
exports.authSocket = function(socket, next) {
  const token = socket.handshake.query.token;
  if (!token) {
    return next(new Error('Unauthorized'));
  }
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err) {
      return next(new Error('Failed to authenticate token'));
    }
    socket.decoded = decoded;
    next();
  });
};
