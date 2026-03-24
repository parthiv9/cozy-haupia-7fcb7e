import yaml from 'js-yaml';
import configYaml from './config.yaml?raw';

/** Parsed `config/config.yaml` — safe defaults if parse fails */
export function loadAppConfig() {
  try {
    const data = yaml.load(configYaml);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

export const appConfig = loadAppConfig();

export function appName() {
  return appConfig?.app?.name || 'SkyCast Ultra Pro Max';
}
