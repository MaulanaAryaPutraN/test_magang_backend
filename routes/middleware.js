const jwt = require("jsonwebtoken");
const JWT_SECRET = "1234SHA";

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({
      status: "error",
      message: "Authorization header is required",
    });
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).send({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    req.user = user;
    next();
  });
}

module.exports = verifyToken;
