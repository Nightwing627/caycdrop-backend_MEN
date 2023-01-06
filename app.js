// const createError = require('http-errors');
const http = require('http')
const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
var cors = require('cors');
var util = require('./util');
require('dotenv').config();


const Handler = require('./socket');

const mongoose = require('mongoose')
const { MongoClient, ServerApiVersion } = require('mongodb')

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');


// set middleware
const corsOpts = {
  origin: '*'
};

app.use(cors(corsOpts));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.use(require('morgan')('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  // set session for API request
  session({
    secret: process.env.SECRET,
    cookie: {
      maxAge: 60000,
    },
    resave: false,
    saveUninitialized: false,
  })
);
app.use('/api', require('./routes'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const error = new Error('Not Found 404');
  error.status = 404;
  next(error);
});

// error handler
app.use(function(err, req, res) {
  console.log(err.status);
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      error: err
    }
  });
});

mongoose.connect(
  process.env.DB_CONNECTION,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  },
  async () => {
    console.log(">> Connected to the database!");
    require('./model');
    await util.CryptoRate();
  }
)

if (process.env.NODE_ENV == 'dev') {
  mongoose.set("debug", true);
  mongoose.set("autoIndex", true);
  
  app.use(require('errorhandler')());
}

// Lookout the user's wallet address
require('./walletManage').lookOut();

const httpServer = http.createServer(app);
require('./socket').init(httpServer);

process.on("uncaughtException", (error, origin) => {
  console.log("----- Uncaught exception -----");
  console.log(error);
  console.log("----- Exception origin -----");
  console.log(origin);
});

httpServer.listen(process.env.PORT, () => {
  console.log("Server is running on port: ", process.env.PORT)
});
