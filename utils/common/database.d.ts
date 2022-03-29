/**
 * @file database.d.ts
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-27
 * @brief Declarations of database.js.
 */

/** */

import * as mysql from 'mysql';
import * as pmysql from 'promise-mysql';
import * as Bluebird from 'bluebird';
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
  conn?: pmysql.Connection;

  // methods
  connect?(...args: any[]): Promise<unknown>;
  disconnect?(options?: mysql.QueryOptions): Bluebird<void>;
  query?(options: string, values?: unknown): Bluebird<unknown>
}

type _ActiveClientsSpecMethods = {
  initialize?(): Promise<unknown>;
  addClient?(client: { passkey: string, peer_id: string, info_hash: string }): Promise<unknown> | Bluebird<unknown>;
  removeClients?(cond: { passkey?: string, peer_id?: string, info_hash?: string }): Promise<unknown> | Bluebird<unknown>;
  queryClients?(cond: { passkey?: string, peer_id?: string, info_hash?: string }): Promise<unknown> | Bluebird<unknown>;
};

export type _ActiveClientsConfig = BasicMySQLConfig;

export type _AuthUsersConn = _MySQLConn;
export type _ActiveClientsConn = _MySQLConn & _ActiveClientsSpecMethods;