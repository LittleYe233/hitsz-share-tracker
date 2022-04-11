/**
 * @file database.js
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-27
 * @brief An utility to process with databases.
 */

// @ts-check

/** */

const mysql = require('mysql');
const pmysql = require('promise-mysql');
const MD5 = require('crypto-js/md5');
const assert = require('assert');

const activeClientsNames = ['passkey', 'peer_id', 'info_hash', 'ip', 'port', 'left'];
const activeClientsMembers = client => activeClientsNames.map(k => client[k]);
// /** @returns {string[]} */
// const activeClientsMemberStrings = client => activeClientsMembers(client).filter(m => m !== undefined).map(m => m.toString());

/**
 * Get the hash string of an active client.
 * 
 * @note It is used for primary key to avoid duplication. But "left" field is
 * not included.
 */
const _gethash = (client) => MD5(activeClientsNames.filter(v => v !== 'left' && client[v] !== undefined).map(v => client[v].toString()).join('')).toString();

/**
 * @param {import('./config').BasicMySQLConfig} params
 */
function MySQLConn(params) {
  /** @type {import('./database').MySQLConn} */
  let inst = {
    host: params.host,
    port: params.port,
    user: params.user,
    pass: params.pass,
    db: params.db,
    tbl: params.tbl
  };

  /**
   * Connect to the database asynchronously.
   * @returns a promise returning a `MySQL.Connection` if fulfilled
   */
  inst.connect = async (...args) => {
    return new Promise((resolve, reject) => {
      pmysql.createConnection({
        host: inst.host,
        port: inst.port,
        user: inst.user,
        password: inst.pass,
        database: inst.db
      })
        .then(conn => {
          inst.conn = conn;
          resolve(conn);
        })
        .catch(err => reject({
          code: err.code,
          errno: err.errno,
          fatal: err.fatal,
          sql: err.sql,
          sqlState: err.sqlState,
          sqlMessage: err.sqlMessage
        }));
    });
  };

  return inst;
}

/**
 * @param {import('./database').ActiveClientsConfig} params
 */
function ActiveClientsConn(params={}) {
  /** @type {import('./database')._ActiveClientsConn} */
  let inst = MySQLConn(params);

  /**
   * Initialize the database asynchronously.
   * @note This is a destructive operation that will erase all previous data and
   * reset the database to a default state.
   * @returns a promise returning an array of results of two statements if fulfilled
   */
  inst.initialize = () => Promise.all([
    inst.conn.query(`DROP TABLE IF EXISTS ${mysql.escapeId(inst.tbl)}`),
    // `hashval` is for primary key to avoid duplication
    // NOTE: See <http://www.bittorrent.org/beps/bep_0023.html> for an
    // explanation of type of `ip` field, or have a look at the documentation
    // of this project.
    inst.conn.query(`CREATE TABLE ${mysql.escapeId(inst.tbl)} (\`passkey\` CHAR(16) NOT NULL, \`peer_id\` CHAR(32) NOT NULL, \`info_hash\` CHAR(40) NOT NULL, \`ip\` VARCHAR(256) NOT NULL, \`port\` SMALLINT UNSIGNED NOT NULL, \`left\` BIGINT UNSIGNED NOT NULL, \`_hashval\` CHAR(32) NOT NULL, PRIMARY KEY (\`_hashval\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8`)
  ]);

  /**
   * Add an active client to the database asynchronously.
   * @returns a promise returning the result of the statement
   */
  inst.addClient = (client) => {
    activeClientsNames.forEach(n => {
      assert(client[n] !== undefined, ReferenceError(`property ${n} is not defined`));
    });

    return inst.conn.query(
      `INSERT INTO ${mysql.escapeId(inst.tbl)} (\`passkey\`, \`peer_id\`, \`info_hash\`, \`ip\`, \`port\`, \`left\`, \`_hashval\`) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [...activeClientsMembers(client), _gethash(client)]);
  };

  /**
   * Remove active clients from the database asynchronously.
   * @param cond Conditions of the clients to be removed.
   * 
   * A condition is a valid condition only when its field is one of "passkey",
   * "peer_id", "ip", "port", "left" and "info_hash", regardless whether its
   * value is valid or not. So you should validate these conditions first.
   * 
   * If `client` has multiple conditions, the target clients should meet all of
   * them.
   * @note Specially, this will remove all active clients if `client` doesn't
   * contain a valid condition.
   * @returns a promise returning the result of the statement if fulfilled
   */
  inst.removeClients = (cond) => {
    // a definitely true statement, causing all clients are selected
    let whereClasue = '1=1';
    // as a prefix
    let cond1 = cond === undefined, cond2 = null;
    if (!cond1) {
      cond2 = activeClientsMembers(cond).some(v => v !== undefined);
    }
    if (cond1 || cond2) {
      if (!cond1) {
        activeClientsNames.forEach(n => {
          if (cond[n] !== undefined) {
            whereClasue += ` AND ${mysql.escapeId(n)}=${mysql.escape(cond[n])}`;
          }
        });
      }
    } else return Promise.reject('unsupported type');

    return inst.conn.query(`DELETE FROM ${mysql.escapeId(inst.tbl)} WHERE ` + whereClasue);
  };

  /**
   * Update active clients from the database asynchronously.
   * @param cond Conditions of the clients to be updated.
   * @param client New client fields to update.
   * 
   * A condition is a valid condition only when its field is one of "passkey",
   * "peer_id", "ip", "port", "left" and "info_hash", regardless whether its
   * value is valid or not. So you should validate these conditions first.
   * 
   * If `client` has multiple conditions, the target clients should meet all of
   * them. All target clients will be affected by `client` parameter.
   * 
   * You don't need to pass a `_hashval` field, for it will be calculated
   * automatically. If it is same as that of *another* row, a "duplicate entry"
   * error will be thrown. There is no error if this field isn't changed.
   * 
   * @note Specially, this will update all active clients if `client` doesn't
   * contain a valid condition.
   * @returns a promise returning the result of the statement if fulfilled
   */
  inst.updateClients = async (cond, client) => {
    // a definitely true statement, causing all clients are selected
    let whereClasue = '1=1';
    // as a prefix
    let cond1 = cond === undefined, cond2 = null;
    if (!cond1) {
      cond2 = activeClientsMembers(cond).some(v => v !== undefined);
    }
    if (cond1 || cond2) {
      if (!cond1) {
        activeClientsNames.forEach(n => {
          if (cond[n] !== undefined) {
            whereClasue += ` AND ${mysql.escapeId(n)}=${mysql.escape(cond[n])}`;
          }
        });
      }
    } else return Promise.reject('unsupported type of condition');

    if (client === undefined) {
      return Promise.reject('parameter client should exist');
    }
    if (activeClientsMembers(client).some(v => v !== undefined)) {
      let targets = null, results = [];
      try {
        targets = await inst.queryClients(cond);
      } catch (e) {
        return Promise.reject(e);
      }
      // `target` has full fields
      for (const target of targets) {
        let newClient = { ...target };  // copy `target`
        for (const k of Object.keys(client)) {
          if (activeClientsNames.includes(k)) {
            newClient[k] = client[k];
          }
        }
        let newClientMembers = activeClientsNames.map(v => newClient[v]);
        try {
          results.push(await inst.conn.query(
            `UPDATE ${mysql.escapeId(inst.tbl)} SET \`passkey\`=?, \`peer_id\`=?, \`info_hash\`=?, \`ip\`=?, \`port\`=?, \`left\`=?, \`_hashval\`=? WHERE ` + whereClasue,
            [ ...newClientMembers, _gethash(newClient) ]
          ));
        } catch (e) {
          return Promise.reject({ message: e, results: results });
        }
      }
      return Promise.resolve(results);
    } else return Promise.reject('unsupport type of client');
  };

  /**
   * Query active clients from the database asynchronously.
   * @param cond Conditions of the target clients.
   * 
   * A condition is a valid condition only when its field is one of "passkey",
   * "peer_id", "ip", "port", "left" and "info_hash", regardless whether its
   * value is valid or not. So you should validate these conditions first.
   * 
   * If `client` has multiple conditions, the target clients should meet all of
   * them.
   * @note Specially, this will return all active clients if `client` doesn't
   * contain a valid condition.
   * @returns a promise returning the result of the statement if fulfilled
   */
  inst.queryClients = (cond) => {
    // a definitely true statement, causing all clients are selected
    let whereClasue = '1=1';
    // as a prefix
    let cond1 = cond === undefined, cond2 = null;
    if (!cond1) {
      cond2 = activeClientsMembers(cond).some(v => v !== undefined);
    }
    if (cond1 || cond2) {
      if (!cond1) {
        activeClientsNames.forEach(n => {
          if (cond[n] !== undefined) {
            whereClasue += ` AND ${mysql.escapeId(n)}=${mysql.escape(cond[n])}`;
          }
        });
      }
    } else return Promise.reject('unsupported type');

    return inst.conn.query(`SELECT \`passkey\`, \`peer_id\`, \`info_hash\`, \`ip\`, \`port\`, \`left\` FROM ${mysql.escapeId(inst.tbl)} WHERE ` + whereClasue);
  };

  inst.queryTable = () => inst.conn.query(`SELECT * FROM ${mysql.escapeId(inst.tbl)}`);

  return inst;
}

module.exports = {
  MySQLConn: MySQLConn,
  ActiveClientsConn: ActiveClientsConn,
  getActiveClientsRowHash: _gethash
};