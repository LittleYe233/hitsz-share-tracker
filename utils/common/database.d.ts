/**
 * @file database.d.ts
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-27
 * @brief Declarations of database.js.
 */

/** */

import * as mysql from 'mysql';
import { RedisClientType as _RedisClientType } from '@node-redis/client';
import { BasicConnectionConfig, BasicRedisConfig } from './config';

type _DatabaseConn = BasicConnectionConfig & {
  // important for internal use
  conn?: unknown;  // connection

  // methods
  connect?(): unknown;
  disconnect?(): unknown;
}

export type _MySQLConn = _DatabaseConn & {
  // from arguments
  db?: string;
  tbl?: string;

  // important for internal use
  conn?: mysql.Connection;

  // methods
  query?: mysql.QueryFunction;
}

export type _RedisConn = _DatabaseConn & {
  // from arguments
  db?: number;
  key?: string;

  // important for internal use
  conn?: _RedisClientType;

  // methods
  // NOTE: For Redis built-in commands, use `RedisConn.conn` instead.
}

type _ProjectDatabaseConn = {
  initialize?(): Promise<number>;
}

type _ActiveClientsSpecConfig = {
  max_clients?: number;
}

export type _ActiveClientsConfig = BasicRedisConfig & _ActiveClientsSpecConfig;

export type _AuthUsersConn = _MySQLConn & _ProjectDatabaseConn;
export type _ActiveClientsConn = _RedisConn & _ProjectDatabaseConn & _ActiveClientsSpecConfig;