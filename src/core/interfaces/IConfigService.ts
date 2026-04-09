export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigValue[]
  | { [key: string]: ConfigValue };

export interface IConfigService {
  get<T extends ConfigValue>(key: string, defaultValue?: T): T;
  set<T extends ConfigValue>(key: string, value: T): void;
  has(key: string): boolean;
  load(source: ConfigSource): Promise<void>;
  watch(key: string, callback: (value: ConfigValue) => void): void;
  unwatch(key: string, callback: (value: ConfigValue) => void): void;
}

export interface ConfigSource {
  type: 'file' | 'env' | 'remote';
  path?: string;
  url?: string;
  refreshInterval?: number;
}
