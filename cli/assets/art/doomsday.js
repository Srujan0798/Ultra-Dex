// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Doomsday module
 * @module art/doomsday
 */

export const doomsdayBanner = `
 █████╗ ██╗   ██╗███████╗███╗   ██╗ ██████╗ ███████╗██████╗
██╔══██╗██║   ██║██╔════╝████╗  ██║██╔════╝ ██╔════╝██╔══██╗
███████║██║   ██║█████╗  ██╔██╗ ██║██║  ███╗█████╗  ██████╔╝
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗
██║  ██║╚██████╔╝███████╗██║ ╚████║╚██████╔╝███████╗██║  ██║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
`;

export const doomsdayMessages = {
  assemble: 'Project Assembler online. Avengers, deploy.',
  success: 'Perfectly balanced, as all code should be.',
  warning: 'Reality wavers. Stabilize the build.',
};

export const infinityStones = {
  soul: '🟠',
  time: '🟢',
  space: '🔵',
  mind: '🟡',
  reality: '🔴',
  power: '🟣',
};

export const doomsdayStatusIcons = {
  success: `${infinityStones.time} `,
  error: `${infinityStones.reality} `,
  warning: `${infinityStones.mind} `,
  info: `${infinityStones.space} `,
  pending: `${infinityStones.soul} `,
  running: `${infinityStones.power} `,
};

export default {
  doomsdayBanner,
  doomsdayMessages,
  infinityStones,
  doomsdayStatusIcons,
};

/**
 * Error handler for doomsday
 * @param {Error} error - Error to handle
 */
function handleDoomsdayError(error) {
  try {
    console.error('[doomsday]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
