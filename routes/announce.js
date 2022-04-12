const chalk = require('chalk');
const Bencode = require('bencode-js');
const { validate, validateAsync, getPeers, compactPeers } = require('../utils/announce/process');
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
  const validated = await validateAsync(params);
  
  // communicate with databases
  const activeClientsNames = ['passkey', 'peer_id', 'info_hash', 'ip', 'port', 'left'];
  const activeClientsMembers = client => activeClientsNames.map(k => client[k]);

  const conn = ActiveClientsConn(cfg.server.databases.active_clients);
  let logstr = 'Active client request:';
  console.log(chalk.green('INFO'), logstr, activeClientsMembers(params));
  try {
    await conn.connect();
    if (validated.params.event === 'stopped') {
      await conn.removeClients({
        passkey: params.passkey,
        peer_id: params.peer_id,
        info_hash: params.info_hash,
        ip: params.ip,
        port: params.port
      }, validated.params);
    } else {
      await conn.updateClients({
        passkey: params.passkey,
        peer_id: params.peer_id,
        info_hash: params.info_hash,
        ip: params.ip,
        port: params.port
      }, { left: params.left }, { allowAdd: true }, validated.params);
    }
    await conn.conn.end();
  } catch (e) {
    console.log(chalk.red('ERR'), 'Reason:', e);
    return res.status(500).end(JSON.stringify(e) === '{}' ? JSON.stringify({
      name: e.name,
      message: e.message
    }) : JSON.stringify(e));
  }
  let _gp = await getPeers(params);
  let peersString = compactPeers(_gp.peers, '4'), peers6String = compactPeers(_gp.peers, '6');
  validated.rawResp.peers = peersString;
  validated.rawResp.peers6 = peers6String;
  validated.rawResp.complete = _gp.complete;
  validated.rawResp.incomplete = _gp.incomplete;

  // send responses
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(Bencode.encode(validated.rawResp));
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