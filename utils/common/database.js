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
  /** @type {import('./database').ActiveClientsConn} */
  let inst = MySQLConn(params);

  /**
   * Get hash string of an active client.
   * @note It is used for primary key to avoid duplication.
   */
  inst._gethash = (client) => client.passkey + client.peer_id + client.info_hash;

  /**
   * Initialize the database asynchronously.
   * @note This is a destructive operation that will erase all previous data and
   * reset the database to a default state.
   * @returns a promise returning an array of results of two statements if fulfilled
   */
  inst.initialize = () => Promise.all([
    inst.conn.query(`DROP TABLE IF EXISTS ${mysql.escapeId(inst.tbl)}`),
    // `hashval` is for primary key to avoid duplication
    inst.conn.query(`CREATE TABLE ${mysql.escapeId(inst.tbl)} (\`passkey\` CHAR(16) NOT NULL, \`peer_id\` CHAR(20) NOT NULL, \`info_hash\` CHAR(20) NOT NULL, \`_hashval\` CHAR(56), PRIMARY KEY (\`_hashval\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8`)
  ]);

  /**
   * Add an active client to the database asynchronously.
   * @returns a promise returning the result of the statement
   */
  inst.addClient = (client) => {
    for (let k of ['passkey', 'peer_id', 'info_hash']) {
      if (client[k] === undefined) {
        Promise.reject(ReferenceError(`property ${k} is not defined`));
      }
    }

    return inst.conn.query(
      `INSERT INTO ${mysql.escapeId(inst.tbl)} (passkey, peer_id, info_hash, _hashval) VALUES (?, ?, ?, ?)`,
      [client.passkey, client.peer_id, client.info_hash, inst._gethash(client)]);
  };

  /**
   * Remove active clients from the database asynchronously.
   * @param cond Conditions of the clients to be removed.
   * 
   * A condition is a valid condition only when its field is one of "passkey",
   * "peer_id" and "info_hash", regardless whether its value is valid or not. So
   * you should validate these conditions first.
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
      cond2 = (cond.passkey !== undefined) || (cond.peer_id !== undefined) || (cond.info_hash !== undefined);
    }
    if (cond1 || cond2) {
      if (!cond1) {
        if (cond.passkey !== undefined) {
          whereClasue += ' AND passkey=' + mysql.escape(cond.passkey);
        }
        if (cond.peer_id !== undefined) {
          whereClasue += ' AND peer_id=' + mysql.escape(cond.peer_id);
        }
        if (cond.info_hash !== undefined) {
          whereClasue += ' AND info_hash=' + mysql.escape(cond.info_hash);
        }
      }
    } else return Promise.reject(TypeError('unsupported type'));

    return inst.conn.query(`DELETE FROM ${mysql.escapeId(inst.tbl)} WHERE ` + whereClasue);
  };

  /**
   * Query active clients from the database asynchronously.
   * @param cond Conditions of the target clients.
   * 
   * A condition is a valid condition only when its field is one of "passkey",
   * "peer_id" and "info_hash", regardless whether its value is valid or not. So
   * you should validate these conditions first.
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
      cond2 = (cond.passkey !== undefined) || (cond.peer_id !== undefined) || (cond.info_hash !== undefined);
    }
    if (cond1 || cond2) {
      if (!cond1) {
        if (cond.passkey !== undefined) {
          whereClasue += ' AND passkey=' + mysql.escape(cond.passkey);
        }
        if (cond.peer_id !== undefined) {
          whereClasue += ' AND peer_id=' + mysql.escape(cond.peer_id);
        }
        if (cond.info_hash !== undefined) {
          whereClasue += ' AND info_hash=' + mysql.escape(cond.info_hash);
        }
      }
    } else return Promise.reject(TypeError('unsupported type'));

    return inst.conn.query(`SELECT passkey, peer_id, info_hash FROM ${mysql.escapeId(inst.tbl)} WHERE ` + whereClasue);
  };

  inst.queryTable = () => inst.conn.query(`SELECT * FROM ${mysql.escapeId(inst.tbl)}`);

  return inst;
}

module.exports = {
  MySQLConn: MySQLConn,
  ActiveClientsConn: ActiveClientsConn
};