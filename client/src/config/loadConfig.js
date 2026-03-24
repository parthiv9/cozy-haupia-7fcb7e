import yaml from 'js-yaml';
import rawYaml from './config.yaml?raw';

/** @type {Record<string, unknown>} */
let cached = null;

export function getAppConfig() {
  if (!cached) {
    try {
      cached = yaml.load(rawYaml) || {};
    } catch {
      cached = {};
    }
  }
  return cached;
}
