/**
 * @file process.js
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-11
 * @brief An utility to process with requests to and responses from /announce.
 */

// @ts-check

/** */

const assert = require('assert');
const { isIP } = require('net');
const Bencode = require('bencode-js');
const ip6addr = require('ip6addr');
const { ActiveClientsConn } = require('../common/database');
const { parseProjectConfig } = require('../common/config');

const DEFAULT_NUMWANT = 50;
const DEFAULT_INTERVAL = 1200;  // 20 min
const DEFAULT_MIN_INTERVAL = 60;  // 1 min
const DEFAULT_BUILTIN_RAW_RESP = {
  interval: DEFAULT_INTERVAL,
  'min interval': DEFAULT_MIN_INTERVAL
};
const CLIENT_ID_WHITELIST = [
  'BT',   // mainline BitTorrent (version>=7.9)
  'qB',   // qBittorrent
  'TR',   // Transmission
  'UM',   // μTorrent for Mac
  'UT'    // μTorrent
];

const cfg = parseProjectConfig();

/** @type {import('./process').dumpEscaped} */
function dumpEscaped(escaped) {
  let n;
  return Array.from(unescape(escaped)).map(c => (n = c.charCodeAt(0).toString(16)).length === 1 ? '0' + n : n).join('');
}

/** @type {import('./process').validate}  */
function validate(params) {
  /** @type {import('./process').RawResp} */
  let rawResp;

  try {
    /* validate simply */
    // `params`
    assert(typeof params === 'object', TypeError('params should be an object'));

    // `params.passkey`
    assert(typeof params.passkey !== 'undefined', ReferenceError('property passkey is not defined'));
    assert(typeof params.passkey === 'string', TypeError('property passkey should be a string'));
    assert.match(params.passkey, /^[0-9a-f]{16}$/i, RangeError('property passkey should represent a 16-digit hexadecimal number'));

    // `params.info_hash`
    // dump to an SHA-1 hash string, with length of 40
    params.info_hash = dumpEscaped(params.info_hash);
    assert(typeof params.info_hash !== 'undefined', ReferenceError('property info_hash is not defined'));
    assert(typeof params.info_hash === 'string', TypeError('property info_hash should be a string'));
    assert.match(params.info_hash, /^[0-9a-f]{40}$/i, RangeError('property info_hash should be with length of 20'));

    // `params.peer_id`
    params.peer_id = params.peer_id.substring(0, 8) + dumpEscaped(params.peer_id.substring(8));
    assert(typeof params.peer_id !== 'undefined', ReferenceError('property peer_id is not defined'));
    assert(typeof params.peer_id === 'string', TypeError('property peer_id should be a string'));
    assert.match(params.peer_id, /^-[a-z]{2}[0-9a-z]{4}-[0-9a-f]{24}$/i, RangeError('property peer_id should be in Azureus-style'));

    // `params.port`
    assert(typeof params.port !== 'undefined', ReferenceError('property port is not defined'));
    params.port = Number(params.port);
    assert(Number.isInteger(params.port), TypeError('property port should be an integer'));
    assert(params.port > 0 && params.port < 65536, RangeError('property port should be greater than 0 and less than 65536'));

    // `params.uploaded`
    assert(typeof params.uploaded !== 'undefined', ReferenceError('property uploaded is not defined'));
    params.uploaded = Number(params.uploaded);
    assert(Number.isInteger(params.uploaded), TypeError('property uploaded should be an integer'));
    assert(params.uploaded >= 0, RangeError('property uploaded should not be negative'));

    // `params.downloaded`
    assert(typeof params.downloaded !== 'undefined', ReferenceError('property downloaded is not defined'));
    params.downloaded = Number(params.downloaded);
    assert(Number.isInteger(params.downloaded), TypeError('property downloaded should be an integer'));
    assert(params.downloaded >= 0, RangeError('property downloaded should not be negative'));

    // `params.left`
    assert(typeof params.left !== 'undefined', ReferenceError('property left is not defined'));
    params.left = Number(params.left);
    assert(Number.isInteger(params.left), TypeError('property left should be an integer'));
    assert(params.left >= 0, RangeError('property left should not be negative'));

    // `params.compact`
    params.compact = typeof params.compact === 'undefined' ? 0 : Number(params.compact);
    assert([0, 1].includes(params.compact), RangeError('property compact should be 0 or 1'));

    // `params.no_peer_id`
    params.no_peer_id = typeof params.no_peer_id === 'undefined' ? 0 : Number(params.no_peer_id);
    assert([0, 1].includes(params.no_peer_id), RangeError('property no_peer_id should be 0 or 1'));

    // `params.event`
    params.event = typeof params.event === 'undefined' ? '' : params.event;
    assert(['started', 'completed', 'stopped', ''].includes(params.event), RangeError('property event should be "started", "completed", "stopped" or ""'));

    // `params.ip`
    params.ip = typeof params.ip === 'undefined' ? '' : params.ip;
    /** @note Matching IPv6 addresses by RegEx is very complicated! */
    assert(params.ip === '' || isIP(params.ip), RangeError('property ip is an invalid IP address'));

    // `params.numwant`
    params.numwant = typeof params.numwant === 'undefined' ? DEFAULT_NUMWANT : params.numwant;
    assert(params.numwant >= 0, RangeError('property numwant should not be negative'));

    /* validate `params.peer_id` */
    // block clients in the blacklist
    let client_id = params.peer_id.slice(1, 3);
    assert(CLIENT_ID_WHITELIST.includes(client_id), RangeError('property peer_id represents a blocked client'));
  } catch (e) {
    rawResp = {
      ...DEFAULT_BUILTIN_RAW_RESP,
      'failure reason': e.message,
      /** @todo complete, incomplete, peers */
      complete: 0,
      incomplete: 0,
      peers: [],
      peers6: []
    };
    if (typeof params.trackerid !== 'undefined') {
      rawResp['tracker id'] = params.trackerid;
    }

    return {
      status: 'failed',
      message: e.message,
      params: params,
      rawResp: rawResp,
      result: Bencode.encode(rawResp)
    };
  }

  // return the result
  rawResp = {
    ...DEFAULT_BUILTIN_RAW_RESP,
    /** @todo complete, incomplete, peers */
    complete: 0,
    incomplete: 0,
    peers: [],
    peers6: []
  };
  if (typeof params.trackerid !== 'undefined') {
    rawResp['tracker id'] = params.trackerid;
  }

  return {
    status: 'passed',
    params: params,
    rawResp: rawResp,
    result: Bencode.encode(rawResp)
  };
}

/** @type {import('./process').validateAsync} */
async function validateAsync(params) {
  try {
    return validate(params);
  } catch (e) {
    return Promise.reject(e);
  }
}

/** @type {import('./process').getPeers} */
async function getPeers(params) {
  if (typeof params === 'string') {
    params = { info_hash: params };
  }

  const conn = ActiveClientsConn(cfg.server.databases.active_clients);
  /** @type {import('../common/database').ActiveClientsQueryParams[]} */
  let clients;
  try {
    await conn.connect();
    clients = await conn.queryClients({info_hash: params.info_hash}, undefined);
    await conn.conn.end();
  } catch (e) {
    return Promise.reject(e);
  }

  // NOTE: This seems to be a bug of TypeScript, for it thinks the anonymous
  // function inside should has an explicit function body (including statements)
  // instead of an object.
  let peers = clients.map(v => {
    /** @type {import('./process').Peer} */
    let ret = {
      'peer id': v.peer_id,
      ip: v.ip,
      port: v.port
    };
    return ret;
  });

  let completeNum = clients.filter(v => v.left == 0).length;
  let incompleteNum = clients.length - completeNum;

  return {
    peers: peers,
    complete: completeNum,
    incomplete: incompleteNum
  };
}

/**
 * Compact peers (with "ip" and "port" fields at least) into a peer-list string
 * like what BitTorrent clients announce with "compact=1".
 * 
 * Invalid IP addresses will be ignored.
 * 
 * @param options a character sequence of "4" and "6"
 * - "4": (default) parse peers to IPv4-style peer string, incompatible with "6" option
 * - "6": parse peers to IPv6-style peer string, incompatible with "4" option
 * 
 * @type {import('./process').compactPeers}
 */
function compactPeers(peers, options='4') {
  let opt4 = options.includes('4'), opt6 = options.includes('6'), peerString;
  if (opt4 && opt6) {
    throw RangeError('options "4" is conflict with "6"');
  }

  // only with option "6" does it indicate compact IPv6 peers, otherwise
  // indicates IPv4
  if (opt6) {
    peers = peers.filter(v => isIP(v.ip) == 6);
    peerString = peers.map(v => {
      let addr = ip6addr.parse(v.ip);
      let _slots = [ ...addr._fields, v.port ];
      return _slots.map(n => String.fromCharCode(Math.floor(n / 256)) + String.fromCharCode(n % 256)).join('');
    }).join('');
  } else {
    peers = peers.filter(v => isIP(v.ip) == 4);
    peerString = peers.map(v => {
      let addr = ip6addr.parse(v.ip);
      // for IPv4 addresses `_fields` still returns array of 8 numbers
      let _slots = [ ...addr._fields.slice(-2), v.port ];
      return _slots.map(n => String.fromCharCode(Math.floor(n / 256)) + String.fromCharCode(n % 256)).join('');
    }).join('');
  }

  return peerString;
}

module.exports = {
  validate: validate,
  validateAsync: validateAsync,
  getPeers: getPeers,
  compactPeers: compactPeers
};