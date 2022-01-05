var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var announceRouter = require('./routes/announce');
var _test_reqRouter = require('./routes/_test_req');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', announceRouter);
app.use('/', _test_reqRouter);

module.exports = app;