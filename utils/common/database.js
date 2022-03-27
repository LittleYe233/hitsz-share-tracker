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
    inst.query = inst.conn.query;

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

  /**
   * Initialize the database.
   * @note This is a destructive operation that will erase all previous data and
   * reset the database to a default state.
   * @returns 
   */
  // It leads to a callback hell, and needs to be fixed later.
  inst.initialize = () => {
    // NOTE: You can't use `inst.query` here.
    inst.conn.query({
      sql: `DROP TABLE IF EXISTS \`${inst.tbl}\``,
    }, (err, results, fields) => {
      // `DROP TABLE` can't be rollbacked
      if (err) { throw err; }
      inst.conn.query({
        sql: `CREATE TABLE \`${inst.tbl}\` (\`passkey\` CHAR(16) NOT NULL, \`peer_id\` CHAR(20) NOT NULL, \`info_hash\` CHAR(20) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8`
      }, (err, results, fields) => {
        if (err) { throw err; }
      });
    });
  };

  return inst;
}

module.exports = {
  MySQLConn: MySQLConn,
  ActiveClientsConn: _ActiveClientsConn
};