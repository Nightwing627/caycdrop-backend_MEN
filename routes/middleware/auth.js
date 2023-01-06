const jwt = require('jsonwebtoken');

const verifyToken = function (req, res, next) {
  var header = req.headers['authorization'];
  console.log(header);
  if (header == undefined)
    return res.status(400).json({ error: 'Authorization header must be filled' });

  const token = header.split(' ')[1];
  
  if (!header || !token) { 
    return res.status(403).json({ error: "Token is required for authentication" });
  }

  try {
    const userData = jwt.verify(token, process.env.TOKEN_KEY);
    req.body.userCode = userData.userCode;
  } catch (error) {
    console.error('@@-- Token verification middleware', error);
    return res.status(401).json({ error: 'Token is expired' });
  }

  return next();
}

module.exports = verifyToken;