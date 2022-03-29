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
  /** @type {import('./database')._MySQLConn} */
  let inst = {
    host: params.host,
    port: params.port,
    user: params.user,
    pass: params.pass,
    db: params.db,
    tbl: params.tbl
  };

  inst.connect = (...args) => {
    inst.conn = mysql.createConnection({
      host: inst.host,
      port: inst.port,
      user: inst.user,
      password: inst.pass,
      database: inst.db
    });

    inst.disconnect = inst.conn.end;

    return inst.conn.connect(...args);
  };

  return inst;
}

/**
 * @param {import('./database')._ActiveClientsConfig} params
 */
function _ActiveClientsConn(params={}) {
  /** @type {import('./database')._ActiveClientsConn} */
  let inst = MySQLConn(params);

  /// These asynchronous functions are currrently under maintenance.

  /**
   * Connect to the database asynchronously.
   * @returns
   */
  inst.connect = (...args) => {
    inst.conn = mysql.createConnection({
      host: inst.host,
      port: inst.port,
      user: inst.user,
      password: inst.pass,
      database: inst.db
    });

    inst.disconnect = inst.conn.end;

    return inst.conn.connect(...args);
  };

  /**
   * Initialize the database asynchronously.
   * @note This is a destructive operation that will erase all previous data and
   * reset the database to a default state.
   * @returns
   */
  inst.initialize = () => {
    inst.conn.query({
      sql: `DROP TABLE IF EXISTS ${mysql.escapeId(inst.tbl)}`,
    }, (err, results, fields) => {
      // `DROP TABLE` can't be rollbacked
      if (err) { throw err; }
      inst.conn.query({
        sql: `CREATE TABLE ${mysql.escapeId(inst.tbl)} (\`passkey\` CHAR(16) NOT NULL, \`peer_id\` CHAR(20) NOT NULL, \`info_hash\` CHAR(20) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8`
      }, (err, results, fields) => {
        if (err) { throw err; }
        // It doesn't need a commit.
        // execute successfully
        return results;
      });
    });
  };

  /**
   * Add an active client to the database asynchronously.
   * @returns
   */
  inst.addClient = (client) => {
    if (client.passkey === undefined) {
      throw ReferenceError('property passkey is not defined');
    }
    if (client.peer_id === undefined) {
      throw ReferenceError('property peer_id is not defined');
    }
    if (client.info_hash === undefined) {
      throw ReferenceError('property info_hash is not defined');
    }
    inst.conn.query({
      sql: `INSERT INTO ${mysql.escapeId(inst.tbl)} (passkey, peer_id, info_hash) VALUES (?, ?, ?)`
    },
    [client.passkey, client.peer_id, client.info_hash],
    (err, results, fields) => {
      if (err) { throw err; }
      return results;
    });
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
   * @returns
   */
  inst.removeClients = (cond) => {
    // a definitely true statement, causing all clients are selected
    let whereClasue = '1=1';
    // as a prefix
    if (cond.passkey !== undefined || cond.peer_id !== undefined || cond.info_hash !== undefined) {
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
    inst.conn.query({
      sql: `DELETE FROM ${mysql.escapeId(inst.tbl)} WHERE ` + whereClasue
    }, (err, results, fields) => {
      if (err) { throw err; }
      return results;
    });
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
   * @returns
   */
  inst.queryClients = (cond) => {
    // a definitely true statement, causing all clients are selected
    let whereClasue = '1=1';
    // as a prefix
    if (cond.passkey !== undefined || cond.peer_id !== undefined || cond.info_hash !== undefined) {
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
    inst.conn.query({
      sql: `SELECT passkey, peer_id, info_hash FROM ${mysql.escapeId(inst.tbl)} WHERE ` + whereClasue
    }, (err, results, fields) => {
      if (err) { throw err; }
      return results;
    });
  };

  return inst;
}

module.exports = {
  MySQLConn: MySQLConn,
  ActiveClientsConn: _ActiveClientsConn
};