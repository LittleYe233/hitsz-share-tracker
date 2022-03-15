/**
 * @file database.d.ts
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-27
 * @brief Declarations of database.js.
 */

/** */

import * as mysql from 'mysql';
import { BasicConnectionConfig, BasicMySQLConfig } from './config';

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

type _ActiveClientsSpecMethods = {
  initialize?(): unknown;
};

export type _ActiveClientsConfig = BasicMySQLConfig;

export type _AuthUsersConn = _MySQLConn;
export type _ActiveClientsConn = _MySQLConn & _ActiveClientsSpecMethods;