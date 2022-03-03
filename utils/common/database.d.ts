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
import { BasicConnectionConfig } from './config';

type DatabaseConn = BasicConnectionConfig & {
  // important for internal use
  conn?: unknown;  // connection

  // methods
  connect?: CallableFunction;
  disconnect?: CallableFunction;
}

export type _MySQLConn = DatabaseConn & {
  // from arguments
  db?: string;
  tbl?: string;

  // important for internal use
  conn?: mysql.Connection;

  // methods
  query?: CallableFunction;
}

export type _RedisConn = DatabaseConn & {
  // from arguments
  db?: number;
  key?: string;

  // important for internal use
  conn?: _RedisClientType;

  // methods
  // NOTE: For Redis built-in commands, use `RedisConn.conn` instead.
}