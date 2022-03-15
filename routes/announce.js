var express = require('express');
const url = require('url');
const { validate } = require('../utils/announce/process');
var router = express.Router();

router.get('/announce', function(req, res, next) {
  // process
  let params = url.parse(req.url, true).query;
  params.ip = params.ip || req.ip;  // ip must exist
  // parse IPv6 & IPv4 mixed form to standard IPv4
  if (params.ip.substring(0, 7) === '::ffff:') {
    params.ip = params.ip.substring(7);
  }
  const validation = validate(params);

  // send responses
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(validation.result);
});

router.get('/_test_announce', function(req, res, next) {
  // process
  let params = url.parse(req.url, true).query;
  params.ip = params.ip || req.ip;  // ip must exist
  // parse IPv6 & IPv4 mixed form to standard IPv4
  if (params.ip.substring(0, 7) === '::ffff:') {
    params.ip = params.ip.substring(7);
  }
  const validation = validate(params);

  // send responses
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(validation));
});

module.exports = router;