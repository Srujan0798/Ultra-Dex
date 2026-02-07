// Copyright (c) 2026 Ultra-Dex

import { scaffoldCommand } from '../commands/scaffold.js';

export async function scaffoldProject(template, options = {}) {
  return scaffoldCommand(template, options);
}

export default {
  scaffoldProject,
};
