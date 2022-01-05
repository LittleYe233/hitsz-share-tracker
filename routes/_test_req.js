var express = require('express');
var util = require('util');
var url = require('url');
var router = express.Router();

router.get('/_test_req', function(req, res, next) {
  res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
  res.end(util.inspect(url.parse(req.url, true)));
});

module.exports = router;