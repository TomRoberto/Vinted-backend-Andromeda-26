const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    // console.log("req.headers.authorization => ", req.headers.authorization);
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = req.headers.authorization.replace("Bearer ", "");

    // console.log("token => ", token);

    const user = await User.findOne({ token: token }).select("email account");

    // console.log("user => ", user);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;

const obj = { a: 1 };

obj.b = 56; // {a: 1, b: 56}

//{query: {}, params: {}, body: {}, files:{ picture: {}}, user: {}}
