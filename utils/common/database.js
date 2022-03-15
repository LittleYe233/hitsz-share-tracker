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

    return inst.conn.connect(...args);
  };

  inst.disconnect = inst.conn.end;
  inst.query = inst.conn.query;

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
  inst.initialize;

  return inst;
}

module.exports = {
  MySQLConn: MySQLConn,
  ActiveClientsConn: _ActiveClientsConn
};