const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const mongoose = require('mongoose');
const cors = require("cors");
const exphbs = require("express-handlebars");
const path = require("path");

// configuration for .env file
dotenv.config();

// view engine setup
app.engine(
  "handlebars",
  exphbs({
    extname: "hbs",
    defaultLayout: "emailTemplate",
    layoutsDir: path.join(__dirname, "views/layouts"),
  })
);
app.set('view engine', 'handlebars');

// to serve all static files
// Function to serve all static files
// inside public directory.
app.use("/public", express.static("public"));
app.use("/uploads", express.static("uploads"));

mongoose.set("useCreateIndex", false);
mongoose.set("debug", false);
mongoose.connect(process.env.MONGO_DB_CONNECT, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// route import from folder
const userRoute = require('./routes/users');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Access Origin Set for incoming request
app.use(cors());
app.use((req, res, next) => {
  req.header('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Headers", "*");
  if (req.method === 'OPTIONS') {
    req.header('Access-Control-Allow-Methods', '*');
    return res.status(200).json({});
  }
  next();
});

// rest api routes
app.use("/api", [userRoute]);

app.use((req, res, next) => {
  const error = new Error('Page not found!');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    result: [],
    error: {
      message: error.message
    }
  })
});

module.exports = app;