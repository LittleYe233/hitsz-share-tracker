const chalk = require('chalk');
const mysql = require('promise-mysql');
const { validate } = require('../utils/announce/process');
const { parseProjectConfig } = require('../utils/common/config');
const { ActiveClientsConn } = require('../utils/common/database');
const router = require('express-promise-router')();

const cfg = parseProjectConfig();
console.log(chalk.blue('DEBUG'), JSON.stringify(cfg));

router.get('/announce', async function(req, res, next) {
  // process
  let params = req.query;
  params.ip = params.ip || req.ip;  // ip must exist
  // parse IPv6 & IPv4 mixed form to standard IPv4
  if (params.ip.substring(0, 7) === '::ffff:') {
    params.ip = params.ip.substring(7);
  }
  // validate
  const validated = validate(params);
  // communicate with databases
  const conn = ActiveClientsConn(cfg.server.databases.active_clients);
  let logstr = `Active client request: (${mysql.escape(params.passkey)}, ${mysql.escape(params.peer_id)}, ${mysql.escape(params.info_hash)})`;
  console.log(chalk.green('INFO'), logstr);
  try {
    await conn.connect();
    await conn.addClient({
      passkey: params.passkey,
      peer_id: params.peer_id,
      info_hash: params.info_hash,
      ip: params.ip,
      port: params.port
    });
    await conn.conn.end();
  } catch (e) {
    console.log(chalk.red('ERR'), 'Reason:', e);
    return res.status(500).end(JSON.stringify(e));
  }

  // send responses
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(validated.result);
});

router.get('/_test_announce', function(req, res, next) {
  // process
  let params = req.query;
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