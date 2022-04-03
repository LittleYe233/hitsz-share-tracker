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
    params.compact = typeof params.compact === 'undefined' ? 0 : params.compact;
    assert([0, 1].includes(params.compact), RangeError('property compact should be 0 or 1'));

    // `params.no_peer_id`
    params.no_peer_id = typeof params.no_peer_id === 'undefined' ? 0 : params.no_peer_id;
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
      peers: []
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
    peers: []
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

module.exports = {
  validate: validate
};