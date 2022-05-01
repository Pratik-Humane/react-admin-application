const jwt = require('jsonwebtoken');
const userModel = require('../models/UserModel');
const auth = async (req, res, next) => {
  let authorization = req.headers["authorization"];
  try {
    if (authorization) {
      let authtoken = authorization.split(" ");
      const result = await jwt.verify(authtoken[1], process.env.JWT_SECRET_KEY);
      if (result) {
        let userdata = await userModel
          .findOne({ _id: result.userId })
          .lean();
        req.body.userid = userdata._id;
        req.body.email_id = userdata.email;
        req.body.usertypeid = userdata.user_type;
        next();
      } else {
        res.status(400).json({
          message: "Invalid token",
        });
      }
    } else {
      res.status(400).json({
        message: "Authorization header is needed",
      });
    }

  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
}

module.exports = auth;