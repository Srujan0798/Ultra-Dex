// Copyright (c) 2026 Ultra-Dex

import jira from './jira.js';
import linear from './linear.js';
import notion from './notion.js';
import trello from './trello.js';
import slack from './slack.js';
import discord from './discord.js';
import githubProjects from './github-projects.js';
import vercel from './vercel.js';
import supabase from './supabase.js';
import stripe from './stripe.js';
import segment from './segment.js';

export const integrations = {
  jira,
  linear,
  notion,
  trello,
  slack,
  discord,
  'github-projects': githubProjects,
  vercel,
  supabase,
  stripe,
  segment,
};

export default integrations;
