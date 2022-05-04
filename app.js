var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const createError = require('http-errors');

var announceRouter = require('./routes/announce');

var app = express();

// show the real IP even if Express is behind a reversed proxy
app.set('trust proxy', true);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', announceRouter);

// HTTP 404 handler
app.use((req, res, next) => {
  next(createError(404));
});

// HTTP 500 handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.end(JSON.stringify({
    message: res.locals.message,
    error: {
      status: res.locals.error.status,
      stack: res.locals.error.stack
    }
  }));
});

module.exports = app;