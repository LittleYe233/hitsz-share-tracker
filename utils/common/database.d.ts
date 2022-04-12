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
import { validateParams } from '../announce/process';

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

export type ActiveClientsQueryParams = {
  passkey?: string;
  peer_id?: string;
  info_hash?: string;
  ip?: string;
  port?: number;  // SMALLINT UNSIGNED (0~65535)
  left?: number;  // BIGINT UNSIGNED (0~2^64-1)
};

type ActiveClientsSpecMethods = {
  _gethash?(client: ActiveClientsQueryParams): string;
  initialize?(): Promise<unknown>;

  addClient?(client: ActiveClientsQueryParams, params: validateParams | undefined): Promise<unknown> | Bluebird<unknown>;

  removeClients?(cond: ActiveClientsQueryParams, params: validateParams | undefined): Promise<unknown> | Bluebird<unknown>;

  updateClients?(cond: ActiveClientsQueryParams, client: ActiveClientsQueryParams, options: Record<string, unknown>, params: validateParams | undefined): Promise<unknown> | Bluebird<unknown>;

  queryClients?(cond: ActiveClientsQueryParams, params: validateParams | undefined): Promise<Record<string, unknown>[]> | Bluebird<Record<string, unknown>[]>;

  queryTable?(): Promise<unknown> | Bluebird<unknown>;
};

type AuthUsersSpecMethods = {};

export type ActiveClientsConfig = BasicMySQLConfig;
export type AuthUsersConfig = BasicMySQLConfig;

export type _AuthUsersConn = MySQLConn & AuthUsersSpecMethods;
export type _ActiveClientsConn = MySQLConn & ActiveClientsSpecMethods;

export function AuthUsersConn(params: AuthUsersConfig): _AuthUsersConn;
export function ActiveClientsConn(params: ActiveClientsConfig): _ActiveClientsConn;