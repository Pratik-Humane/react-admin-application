const express = require('express');
const router = express.Router();
const multer = require('multer');
const randomstring = require("randomstring");
const User = require('../models/UserModel');
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { sendMail } = require("../helpers/sendMail");
const resetPassValidator = require('../validations/resetPasswordValidation');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir = "./uploads/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      cb(null, "./uploads/");
    } else {
      cb(null, "./uploads/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, randomstring.generate() + file.originalname);
  }
})
const fileFilter = (req, file, cb) => {
  // accept file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    // reject file
    cb(new Error("Only images with type jpeg,png are allowed."), false);
  }
}
const upload = multer({
  storage: storage,
  limits: { fieldSize: 1024 * 1024 * 5 }, //5MB
  fileFilter: fileFilter,
});


// update user profile
router.post("/update-profile", upload.single("avatar"), auth, async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.body.userid }).lean();
    if (req.file) {
      if (fs.existsSync(`./uploads/${user.avatar}`)) {
        fs.unlinkSync(`./uploads/${user.avatar}`)
      }
    }
    let { username, email, mobile, gender } = req.body
    let userdata = { name: username, username, email, mobile, gender, avatar: !req.file ? user.avatar : req.file.filename };
    let update = await User.findOneAndUpdate(
      { _id: req.body.userid },
      userdata,
      { useFindAndModify: false }
    ).exec();
    if (update) {
      res.status(200).json({ message: "Profile Updated successfully" });
    } else {
      res.status(400).json({ message: "Profile Update Failed!!" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: "Error Occured." });
  }
});

// register new user
router.post("/auth/register", async (req, res) => {
  try {
    let isEmailExist = await User.findOne({ email: req.body.email }).lean();
    if (isEmailExist) return res.status(400).json({ message: "This email already exist!" });
    let hash = await bcrypt.hashSync(req.body.password, 10);
    const userdata = { password: hash, email: req.body.email, username: req.body.username };
    let user = new User(userdata);
    await user.save();
    res.status(200).json({ message: "Register successfully. Please login now." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// authenticate user
router.post("/auth/login", async (req, res) => {
  try {
    let user = await User.findOne({ email: req.body.email }).lean();
    if (user) {
      let isValidPass = bcrypt.compareSync(req.body.password, user.password);
      if (isValidPass) {
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
          expiresIn: process.env.JWT_EXPIRY,
        })

        res.status(200).json({
          accessToken,
          user: { id: user._id, avatar: user.avatar, email: user.email, username: user.username, role: user.role, },
        })
      } else {
        res.status(400).json({ message: 'Invalid Credentials' });
      }
    } else {
      res.status(400).json({ message: 'Username doesn not exist' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid Credentials' });
  }
});

// get login user innformation
router.get("/auth/profile", auth, async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.body.userid }).select('_id avatar email mobile username role gender').lean();
    if (user) {
      if (user.avatar) {
        user.avatar = `${process.env.API_URL}/uploads/${user.avatar}`;
      }
      res.status(200).json({ user });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', });
  }
});

// forgot password
router.post("/auth/forgot-password", async (req, res) => {
  let emailUser = await User.findOne({ email: req.body.email }).select('name email').lean();
  let verification_code = randomstring.generate();
  if (emailUser) {
    await User.findOneAndUpdate({ email: req.body.email }, { verification_code }, { useFindAndModify: false }).exec();
    res.render("mail-template/forgot-password", { userdata: emailUser, admin_url: process.env.ADMIN_URL + '/reset-password/' + verification_code },
      (err, html) => {
        if (err) {
          res.json({ status: 400, message: "Something went wrong with html", });
        } else {
          let mail = sendMail("humane.pratik1994@gmail.com", "React Admin-Forgot Password", html);
          if (mail) {
            res.json({ status: 200, message: "Reset password link send to your account", });
          } else {
            res.json({ status: 400, message: "Something went wrong", });
          }
        }
      }
    );
  } else {
    res.json({ status: 400, message: "This email is not exist!!!", });
  }
});

// reset password 
router.post("/auth/reset-password", async (req, res) => {
  let { verification_code, password, c_password } = req.body;
  try {
    // validation
    const { error } = await resetPassValidator.validate({ password, c_password, verification_code, });
    if (error) {
      res.status(400).json({
        message: error.message,
      });
    } else {
      let user = await User.findOne({ verification_code }).select("_id").lean();
      if (user) {
        let hash = await bcrypt.hashSync(password, 10);
        await User.findOneAndUpdate(
          { _id: user._id },
          { verification_code: null, password: hash },
          { useFindAndModify: false }
        ).exec();
        res.status(200).json({
          message: "Password updated successfully. Please login now.",
        });
      } else {
        res.status(400).json({
          message: "Sorry!!. Link is expired.",
        });
      }
    }
  } catch (error) {
    res.status(400).json({ message: "Something went wrong. Please try again!!" });
  }
});

module.exports = router;