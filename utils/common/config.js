/**
 * @file config.js
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-13
 * @brief An utility to process with project configurations.
 */

//@ts-check

const yaml = require('yaml');
const fs = require('fs');
const path = require('path');
const { merge } = require('lodash');

const DEFAULT_CONFIG_PATH = '../../config.yml';

/**
 * Parse a configuration file.
 * @param {String} filename Filename of the configuration file
 * @param {BufferEncoding} encoding Encoding of the configuration file (default: utf8)
 * @returns {Object} Parsed configurations
 */
function parseConfig(filename, encoding='utf8') {
  const cfgFile = fs.readFileSync(filename, {encoding: encoding});
  const cfg = yaml.parse(cfgFile);
  
  return cfg;
}

/**
 * Parse a configuration file with secrets.
 * @param {String} filename Filename of the configuration file
 * @param {Object} options Optional parameters
 * @param {BufferEncoding=} options.encoding
 *    Encoding of all the configuration files including the secrets
 *    (default: utf8)
 * @param {Boolean=} options.rmsecrets
 *    Whether to remove secrets (default: true)
 * @returns {Object} Parsed configurations
 */
function parseConfigWithSecrets(filename, options={}) {
  // parse options
  const {
    encoding = 'utf-8',
    rmsecrets = true
  } = options;

  // parse raw config
  let cfg = parseConfig(filename, encoding);

  // parse secret configs and merge all
  if (Array.isArray(cfg.secrets)) {
    for (let fp of cfg.secrets) {
      if (typeof fp === 'string') {
        var resolvedFp = path.join(path.dirname(filename), fp);
        const secretCfg = parseConfig(resolvedFp, encoding);
        cfg = merge(cfg, secretCfg);
      }
    }
  }
  // delete this key to protect privacy
  if (rmsecrets) {
    delete cfg.secrets;
  }

  return cfg;
}

const parseProjectConfig = (options={}) => parseConfigWithSecrets(DEFAULT_CONFIG_PATH, options);

module.exports = {
  parseProjectConfig: parseProjectConfig
};