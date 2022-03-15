/**
 * @file process.d.ts
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-15
 * @brief Declarations of process.js.
 */

export type RawResp = {
  'failure reason'?: string;
  'warning meesage'?: string;
  interval: number;
  'min interval'?: number;
  'tracker id'?: unknown;
  complete: number;
  incomplete: number;
  peers: Array<{ peer_id: string; ip: string; port: number }>;
};

export type validateParams = {
  passkey: string,
  info_hash: string,
  peer_id: string,
  port: number,
  uploaded: number,
  downloaded: number,
  left: number,
  compact?: 0 | 1,
  no_peer_id?: 0 | 1,
  event?: 'started' | 'completed' | 'stopped' | '',
  ip?: '',
  numwant?: number,
  trackerid?: unknown
};

export type ValidateReturns = {
  status: string,
  message?: string,
  params: validateParams,
  result: string,
  rawResp: RawResp
};

export function validate(params: validateParams): ValidateReturns;