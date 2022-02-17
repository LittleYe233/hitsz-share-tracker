/**
 * @file config.d.ts
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-15
 * @brief Declarations of config.d.ts.
 */

export type BasicConnectionConfig = {
  host?: string,
  port?: number,
  user: string,   // forcely require this field for convenience
  pass?: string
};

export type BasicMySQLConfig = BasicConnectionConfig & {
  db: string,
  tbl: string
};

export type BasicRedisConfig = BasicConnectionConfig & {
  db?: number,    // Redis database index (0-15)
  key: string
};

export type ParseConfigReturns = {
  secrets?: Array<string>;
  clients: {
    databases: {
      auth_user: BasicMySQLConfig
    }
  },
  server: {
    databases: {
      auth_user: BasicMySQLConfig
    }
  }
};

export function parseConfig(
  filename: string,
  encoding: BufferEncoding
): ParseConfigReturns;

export function parseConfigWithSecrets(
  filename: string,
  options?: {
    encoding?: BufferEncoding,
    rmsecrets?: boolean
  }
): ParseConfigReturns;