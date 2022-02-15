/**
 * @file config.d.ts
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-15
 * @brief Declarations of config.d.ts.
 */

export type ParseConfigReturns = {
  secrets?: Array<string>;
  databases: Record<string, Record<string, unknown>>;
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