// npm install jsonwebtoken

const jwt = require("jsonwebtoken"); // Ensure you have required the jwt module

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Assumes "Bearer TOKEN" format

  if (!token) {
    return res
      .status(401)
      .json({ error: "Unauthorized", message: "Token is required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      // Check if the error is because the token has expired
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Token is required",
        });
      }
      return res.status(403).json({
        error: "Unauthorized",
        message: "Failed to authenticate token",
      });
    }
    req.user = decoded;
    next();
  });
};
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

module.exports = verifyToken;
