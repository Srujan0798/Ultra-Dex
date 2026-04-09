var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
let ShadowSector = class {
  async manifest(projectRoot) {
    const shadowPath = path.join(process.cwd(), '.ultra-dex', 'shadow-sector');
    console.log(
      chalk.cyan(`\u{1F311} Shadow: Materializing simulation sector at ${shadowPath}...`)
    );
    await fs.mkdir(shadowPath, { recursive: true });
    execSync(`rsync -av --exclude 'node_modules' --exclude '.git' ${projectRoot}/ ${shadowPath}/`);
    console.log(chalk.green('\u2705 Shadow: Simulation sector materialized.'));
    return shadowPath;
  }
  async collapse() {
    const shadowPath = path.join(process.cwd(), '.ultra-dex', 'shadow-sector');
    await fs.rm(shadowPath, { recursive: true, force: true });
    console.log(chalk.gray('\u{1F311} Shadow: Simulation sector collapsed.'));
  }
};
ShadowSector = __decorateClass([singleton()], ShadowSector);
const shadow = new ShadowSector();
export { ShadowSector, shadow };
