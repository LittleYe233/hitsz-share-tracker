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

module.exports = {
  MySQLConn: MySQLConn,
  RedisConn: RedisConn
};