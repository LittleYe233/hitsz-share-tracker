/**
 * @file process.js
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-11
 * @brief An utility to process with requests to and responses from /announce.
 */

const assert = require('assert');
const { isIP } = require('net');
const Bencode = require('bencode-js');

const DEFAULT_NUMWANT = 50;
const DEFAULT_INTERVAL = 1200;  // 20 min
const DEFAULT_MIN_INTERVAL = 60;  // 1 min
const DEFAULT_BUILTIN_RAW_RESP = {
    interval: DEFAULT_INTERVAL,
    'min interval': DEFAULT_MIN_INTERVAL
}

/**
 * @typedef {Object} ValidateReturns
 * @property {String} status Validation status
 * @property {String=} message A human-readable error message as to why the
 *                            validation failed
 * @property {String} result Bencoded result
 * @property {Object} rawResp Raw response object
 */

/**
 * Validate the parameter objects of requests.
 * @param {Object} params Parameter objects of requests
 * @param {String} params.passkey
 * @param {String} params.info_hash
 * @param {String} params.peer_id
 * @param {Number} params.port
 * @param {Number} params.uploaded
 * @param {Number} params.downloaded
 * @param {Number} params.left
 * @param {Number=} params.compact Can be 0 or 1. Default: 0
 * @param {Number=} params.no_peer_id Can be 0 or 1. Default: 0
 * @param {String=} params.event Can be "started", "completed", "stopped" or "".
 *                               Default: ""
 * @param {String=} params.ip Default: ""
 * @param {Number=} params.numwant Can be 0. Default: 50
 * @param {any=} params.trackerid
 * @returns {ValidateReturns} Object containing validation results and other
 *                            messages
 */
function validate(params) {
    // the very first validation
    try {
        // ``params``
        assert(typeof params === 'object', TypeError('params should be an object'));

        // ``params.passkey``
        assert(typeof params.passkey !== 'undefined', ReferenceError('property passkey is not defined'));
        assert(typeof params.passkey === 'string', TypeError('property passkey should be a string'));
        assert.match(params.passkey, /^[0-9a-f]{16}$/i, RangeError('property passkey should represent a 16-digit hexadecimal number'));

        // ``params.info_hash``
        assert(typeof params.info_hash !== 'undefined', ReferenceError('property info_hash is not defined'));
        assert(typeof params.info_hash === 'string', TypeError('property info_hash should be a string'));
        assert.match(params.info_hash, /^[0-9a-f]{20}$/i, RangeError('property info_hash should represent a 20-digit hexadecimal number'));
        
        // ``params.peer_id``
        assert(typeof params.peer_id !== 'undefined', ReferenceError('property peer_id is not defined'));
        assert(typeof params.peer_id === 'string', TypeError('property peer_id should be a string'));
        assert.match(params.peer_id, /^-[a-z]{2}[0-9]{4}-[0-9]{12}$/i, RangeError('property peer_id should be in Azureus-style'));
        /** @todo validate the BT client ID string */
        
        // ``params.port``
        assert(typeof params.port !== 'undefined', ReferenceError('property port is not defined'));
        params.port = Number(params.port);
        assert(Number.isInteger(params.port), TypeError('property port should be an integer'));
        assert(params.port > 0 && params.port < 65536, RangeError('property port should be greater than 0 and less than 65536'));
        
        // ``params.uploaded``
        assert(typeof params.uploaded !== 'undefined', ReferenceError('property uploaded is not defined'));
        params.uploaded = Number(params.uploaded);
        assert(Number.isInteger(params.uploaded), TypeError('property uploaded should be an integer'));
        assert(params.uploaded >= 0, RangeError('property uploaded should not be negative'));
        
        // ``params.downloaded``
        assert(typeof params.downloaded !== 'undefined', ReferenceError('property downloaded is not defined'));
        params.downloaded = Number(params.downloaded);
        assert(Number.isInteger(params.downloaded), TypeError('property downloaded should be an integer'));
        assert(params.downloaded >= 0, RangeError('property downloaded should not be negative'));
        
        // ``params.left``
        assert(typeof params.left !== 'undefined', ReferenceError('property left is not defined'));
        params.left = Number(params.left);
        assert(Number.isInteger(params.left), TypeError('property left should be an integer'));
        assert(params.left >= 0, RangeError('property left should not be negative'));
        
        // ``params.compact``
        params.compact = typeof params.compact === 'undefined' ? 0 : params.compact;
        assert([0, 1].includes(params.compact), RangeError('property compact should be 0 or 1'));

        // ``params.no_peer_id``
        params.no_peer_id = typeof params.no_peer_id === 'undefined' ? 0 : params.no_peer_id;
        assert([0, 1].includes(params.no_peer_id), RangeError('property no_peer_id should be 0 or 1'));

        // ``params.event``
        params.event = typeof params.event === 'undefined' ? '' : params.event;
        assert(['started', 'completed', 'stopped', ''].includes(params.event), RangeError('property event should be "started", "completed", "stopped" or ""'));

        // ``params.ip``
        params.ip = typeof params.ip === 'undefined' ? '' : params.ip;
        /** @note Matching IPv6 addresses by RegEx is very complicated! */
        assert(params.ip === '' || isIP(params.ip), RangeError('property ip is an invalid IP address'));

        // ``params.numwant``
        params.numwant = typeof params.numwant === 'undefined' ? DEFAULT_NUMWANT : params.numwant;
        assert(params.numwant >= 0, RangeError('property numwant should not be negative'));
    } catch (e) {
        let rawResp = {
            ...DEFAULT_BUILTIN_RAW_RESP,
            'failure reason': e.message
            /** complete, incomplete, peers */
        }
        if (typeof params.trackerid !== 'undefined') {
            rawResp.trackerid = params.trackerid;
        }

        return {
            status: 'failed',
            message: e.message,
            rawResp: rawResp,
            result: Bencode.encode(rawResp)
        };
    }

    // return the result
    let rawResp = {
        ...DEFAULT_BUILTIN_RAW_RESP
        /** complete, incomplete, peers */
    }
    if (typeof params.trackerid !== 'undefined') {
        rawResp.trackerid = params.trackerid;
    }

    return {
        status: 'passed',
        rawResp: rawResp,
        result: Bencode.encode(rawResp)
    };
}

module.exports = {
    validate: validate
}