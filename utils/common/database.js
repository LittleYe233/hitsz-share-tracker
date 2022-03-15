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
const redis = require('redis');

const MAX_CLIENTS = 1000;  // It's a placeholder, and may be removed later.

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
 * @param {import('./config').BasicRedisConfig} params
 */
function RedisConn(params={}) {
  /** @type {import('./database')._RedisConn} */
  let inst = {
    host: params.host,
    port: params.port,
    user: params.user,
    pass: params.pass,
    db: params.db,
    key: params.key
  };

  inst.connect = () => {
    // pattern: redis://[[username][:password]@][host][:port][/db-number]
    let url = 'redis://';
    if (inst.user || inst.pass) {
      if (inst.user) {
        url += inst.user;
      }
      if (inst.pass) {
        url += `:${inst.pass}`;
      }
      url += '@';
    }
    if (inst.host) {
      url += inst.host;
    }
    if (inst.port) {
      url += `:${inst.port}`;
    }
    if (inst.db) {
      url += `/${inst.db}`;
    }

    inst.conn = redis.createClient({ url: url });
    
    return inst.conn.connect();
  };

  return inst;
}

/**
 * @param {import('./database')._ActiveClientsConfig} params
 */
// @ts-ignore
function _ActiveClientsConn(params={}) {
  /** @type {import('./database')._ActiveClientsConn} */
  let inst = {
    ...RedisConn(params),
    max_clients: (params.max_clients == 0) ? MAX_CLIENTS : params.max_clients
  };

  /**
   * Initialize the database.
   * @note This is a destructive operation that will erase all previous data and
   * reset the database to a default state.
   * @returns a Promise storing the returning value of the last command
   */
  inst.initialize = async () => {
    return await inst.conn.del(inst.key);
  };

  return inst;
}

module.exports = {
  MySQLConn: MySQLConn,
  RedisConn: RedisConn
};