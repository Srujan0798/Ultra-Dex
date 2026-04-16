import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

interface PackageJson {
  version: string;
}

interface ProjectConfig {
  version?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function getCliVersion(): Promise<string> {
  const pkgPath = path.resolve(__dirname, '../../../package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8')) as PackageJson;
  return pkg.version;
}
async function getProjectVersion(): Promise<string> {
  const configPath = path.resolve(process.cwd(), '.ultra-dex/config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf8')) as ProjectConfig;
  return config.version || '0.0.0';
}
async function compareVersions(): Promise<{
  cliVersion: string;
  projectVersion: string | null;
  ok: boolean;
}> {
  const cliVersion = await getCliVersion();
  let projectVersion = '0.0.0';
  try {
    projectVersion = await getProjectVersion();
  } catch {
    return { cliVersion, projectVersion: null, ok: false };
  }
  return {
    cliVersion,
    projectVersion,
    ok: projectVersion >= cliVersion,
  };
}
var version_check_default = { getCliVersion, getProjectVersion, compareVersions };
export { compareVersions, version_check_default as default, getCliVersion, getProjectVersion };
