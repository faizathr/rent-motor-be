// npm install jsonwebtoken

const jwt = require("jsonwebtoken"); // Ensure you have required the jwt module

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Assumes "Bearer TOKEN" format

  if (!token) {
    return res.status(401).json({
      status: "error", 
      message: "Unauthorized: Authentication required",
      data: {}
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: "error", 
        message: "Unauthorized: Invalid Authentication",
        data: {}
      });
    }
    req.user = decoded;
    next();
  });
};

/*
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});
*/

module.exports = verifyToken;
