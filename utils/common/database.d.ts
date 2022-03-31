/**
 * @file database.d.ts
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-27
 * @brief Declarations of database.js.
 */

/** */

import * as pmysql from 'promise-mysql';
import * as Bluebird from 'bluebird';
import { BasicConnectionConfig, BasicMySQLConfig } from './config';

type DatabaseConn = BasicConnectionConfig;

export type MySQLConn = DatabaseConn & {
  // from arguments
  db?: string;
  tbl?: string;

  // important for internal use
  conn?: pmysql.Connection;

  // methods
  connect?(...args: any[]): Promise<unknown>;
}

type ActiveClientsSpecMethods = {
  _gethash?(client: { passkey: string, peer_id: string, info_hash: string }): string;
  initialize?(): Promise<unknown>;
  addClient?(client: { passkey: string, peer_id: string, info_hash: string }): Promise<unknown> | Bluebird<unknown>;
  removeClients?(cond: { passkey?: string, peer_id?: string, info_hash?: string }): Promise<unknown> | Bluebird<unknown>;
  queryClients?(cond: { passkey?: string, peer_id?: string, info_hash?: string }): Promise<unknown> | Bluebird<unknown>;
  queryTable?(): Promise<unknown> | Bluebird<unknown>;
};

type AuthUsersSpecMethods = {};

export type ActiveClientsConfig = BasicMySQLConfig;
export type AuthUsersConfig = BasicMySQLConfig;

export type _AuthUsersConn = MySQLConn & AuthUsersSpecMethods;
export type _ActiveClientsConn = MySQLConn & ActiveClientsSpecMethods;

export function AuthUsersConn(params: AuthUsersConfig): _AuthUsersConn;
export function ActiveClientsConn(params: ActiveClientsConfig): _ActiveClientsConn;