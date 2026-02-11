/**
 * @fileoverview Svelte Config module
 * @module sveltekit-drizzle/svelte.config
 */

import adapter from '@sveltejs/adapter-auto';

export default {
  kit: { adapter: adapter() },
};

