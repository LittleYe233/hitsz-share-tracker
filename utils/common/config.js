/**
 * @file config.js
 * @author LittleYe233
 * @email 30514318+LittleYe233@users.noreply.github.com
 * @date 2022-02-13
 * @brief An utility to process with project configurations.
 */

const yaml = require('yaml');
const fs = require('fs');
const path = require('path');
const { merge } = require('lodash');

const DEFAULT_CONFIG_PATH = '../../config.yml';

/**
 * Parse a configuration file.
 * @param {String} filename Filename of the configuration file
 * @param {String} encoding Encoding of the configuration file (default: utf8)
 * @returns {Object} Parsed configurations
 */
function parseConfig(filename, encoding='utf8') {
  const cfgFile = fs.readFileSync(filename, encoding);
  const cfg = yaml.parse(cfgFile);
  
  return cfg;
}

/**
 * Parse a configuration file with secrets.
 * @param {String} filename Filename of the configuration file
 * @param {String} encoding Encoding of all the configuration files including
 *                          the secrets (default: utf8)
 * @returns {Object} Parsed configurations
 */
function parseConfigWithSecrets(filename, encoding='utf8') {
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

  return cfg;
}

const parseProjectConfig = (encoding) => parseConfigWithSecrets(DEFAULT_CONFIG_PATH, encoding);

module.exports = {
  parseProjectConfig: parseProjectConfig
};