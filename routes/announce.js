const chalk = require('chalk');
const Bencode = require('bencode-js');
const { validate, validateAsync, getPeers, compactPeers } = require('../utils/announce/process');
const { parseProjectConfig } = require('../utils/common/config');
const { ActiveClientsConn, TorrentsConn } = require('../utils/common/database');
const router = require('express-promise-router')();

const cfg = parseProjectConfig();

router.get('/announce', async function(req, res, next) {
  // process
  let params = req.query;
  params.ip = params.ip ?? req.ip;  // ip must exist
  // parse IPv6 & IPv4 mixed form to standard IPv4
  if (params.ip.substring(0, 7) === '::ffff:') {
    params.ip = params.ip.substring(7);
  }
  // validate
  const validated = await validateAsync(params);
  if (validated.status === 'failed') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(Bencode.encode(validated.rawResp));
    return;
  }
  
  // communicate with databases
  const activeClientsNames = ['passkey', 'peer_id', 'info_hash', 'ip', 'port', 'left'];
  const activeClientsMembers = client => activeClientsNames.map(k => client[k]);

  let logstr = 'Active client request:', targets = null, targetTorrents = null, conn = null;
  console.log(chalk.green('INFO'), logstr, activeClientsMembers(params));
  try {
    // Active Client Database
    conn = ActiveClientsConn(cfg.client.databases.active_clients);
    await conn.connect();
    if (['stopped', 'paused'].includes(validated.params.event)) {
      await conn.removeClients({
        passkey: params.passkey,
        peer_id: params.peer_id,
        info_hash: params.info_hash,
        ip: params.ip,
        port: params.port
      }, validated.params);
    } else {
      // `targets` stores the query result before updating active client database
      [ targets ] = await conn.updateClients({
        passkey: params.passkey,
        peer_id: params.peer_id,
        info_hash: params.info_hash,
        ip: params.ip,
        port: params.port
      }, { left: params.left }, { allowAdd: true }, validated.params);
    }
    await conn.conn.end();

    // Torrents Database
    let newTorrent;
    // torrent already exists
    conn = TorrentsConn(cfg.client.databases.torrents);
    await conn.connect();
    targetTorrents = await conn.queryTorrents({
      info_hash: validated.params.info_hash
    });
    if (targetTorrents !== null && targetTorrents.length) {
      newTorrent = targetTorrents[0];
    }
    // These below won't be executed normally. Here is only a fallback method.
    else {
      newTorrent = {
        info_hash: validated.params.info_hash,
        category: -1,               // not configured
        title: 'null',              // not configured
        dateUploaded: new Date(0),  // not configured
        size: 0,                    // not configured
        seeders: 0,                 // not configured
        leechers: 0,                // not configured
        completes: 0,               // not configured
        uploader: -1                // not configured
      };
    }
    let flagActiveClientExists = targets !== null && targets.length;
    if (validated.params.event === 'completed') {
      ++newTorrent.completes;
      ++newTorrent.seeders;
      --newTorrent.leechers;
    } else if (['stopped', 'paused'].includes(validated.params.event)) {
      /**
       * @note It's hard to avoid mistaken active client living status, for a
       * client will be wiped out by `ActiveClientsConn` when a BT client goes
       * offline, which misleading `TorrentsConn` to consider this client has
       * been removed and that there is no need to change `seeders` value
       * anymore. So we directly comment out the if-condition.
       */
      if (/* flagActiveClientExists */ true) {
        if (validated.params.left === 0) {
          --newTorrent.seeders;
        } else {
          --newTorrent.leechers;
        }
      } else {
        /** @note We suppose there is a mistaken request when going here. */
      }
    } else {
      if (!flagActiveClientExists) {
        if (validated.params.left === 0) {
          ++newTorrent.seeders;
        } else {
          ++newTorrent.leechers;
        }
      } else {
        /** @note We suppose there is a mistaken request when going here. */
      }
    }
    // fallbacks
    if (newTorrent.completes < 0) newTorrent.completes = 0;
    if (newTorrent.seeders < 0) newTorrent.seeders = 0;
    if (newTorrent.leechers < 0) newTorrent.leechers = 0;
    if (targetTorrents !== null && targetTorrents.length) {
      await conn.updateTorrents({
        info_hash: validated.params.info_hash
      }, newTorrent, { allowAdd: true });
    } else {
      await conn.addTorrent(newTorrent);
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
  const bencoded = Buffer.from(Bencode.encode(validated.rawResp), 'binary');
  console.log(chalk.blue('DEBUG'), 'Base64 of bencoded result:', bencoded.toString('base64'));
  console.log(chalk.blue('DEBUG'), 'validated.rawResp:', JSON.stringify(validated.rawResp));
  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': bencoded.length.toString()  // expected to fix issue #5
  });
  res.end(bencoded);
});

router.get('/_test_announce', function(req, res, next) {
  // process
  let params = req.query;
  params.ip = params.ip ?? req.ip;  // ip must exist
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