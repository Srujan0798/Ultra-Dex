var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
let TeamManager = class {
  constructor(workspacePath) {
    this.workspacePath = workspacePath || process.cwd();
    this.teamDir = path.join(this.workspacePath, ".ultra-dex");
    this.teamFile = path.join(this.teamDir, "team.json");
  }
  async ensureTeamDir() {
    await fs.mkdir(this.teamDir, { recursive: true });
  }
  async getTeam() {
    try {
      const content = await fs.readFile(this.teamFile, "utf8");
      return JSON.parse(content);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }
  async createTeam(name, ownerId, options = {}) {
    await this.ensureTeamDir();
    const team = {
      id: uuidv4(),
      name,
      ownerId,
      description: options.description || "",
      members: [
        {
          userId: ownerId,
          email: null,
          role: "owner",
          joinedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      workspaces: [],
      activeWorkspace: null,
      agentAccess: options.agentAccess || {},
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await fs.writeFile(this.teamFile, JSON.stringify(team, null, 2));
    return team;
  }
  async updateConfig(teamId, key, value) {
    const team = await this.getTeam();
    if (!team) {
      throw new Error("Team not initialized");
    }
    team[key] = value;
    team.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await fs.writeFile(this.teamFile, JSON.stringify(team, null, 2));
    return team;
  }
  async addMember(teamId, userId, role = "member") {
    const team = await this.getTeam();
    if (!team || team.id !== teamId) {
      throw new Error("Team not found");
    }
    const existingMember = team.members.find(
      (m) => m.userId === userId
    );
    if (existingMember) {
      throw new Error("Member already exists");
    }
    team.members.push({
      userId,
      email: null,
      role,
      joinedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    team.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await fs.writeFile(this.teamFile, JSON.stringify(team, null, 2));
    return team;
  }
  async removeMember(teamId, email) {
    const team = await this.getTeam();
    if (!team) {
      throw new Error("Team not initialized");
    }
    const initialLength = team.members.length;
    team.members = team.members.filter((m) => m.email !== email);
    if (team.members.length === initialLength) {
      throw new Error("Member not found");
    }
    team.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await fs.writeFile(this.teamFile, JSON.stringify(team, null, 2));
    return team;
  }
  async getTeamMembers(teamId) {
    const team = await this.getTeam();
    if (!team) {
      return [];
    }
    return team.members || [];
  }
};
TeamManager = __decorateClass([
  singleton()
], TeamManager);
var team_manager_default = TeamManager;
export {
  TeamManager,
  team_manager_default as default
};
