var express = require('express');
const url = require('url');
const { validate } = require('../utils/announce/process');
var router = express.Router();

router.get('/announce', function(req, res, next) {
  // process
  const validation = validate(url.parse(req.url, true).query);

  // send responses
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(validation.result);
});

router.get('/_test_announce', function(req, res, next) {
  // process
  const validation = validate(url.parse(req.url, true).query);

  // send responses
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(validation));
});

module.exports = router;