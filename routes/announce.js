var express = require('express');
var router = express.Router();

router.get('/announce', function(req, res, next) {
  res.end('Need Maintenance');
});

module.exports = router;