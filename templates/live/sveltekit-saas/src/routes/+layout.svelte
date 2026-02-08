<script lang="ts">
  import '../app.css'
  import { page } from '$app/stores'
  
  export let data
</script>

<svelte:head>
  <title>SvelteKit SaaS</title>
  <meta name="description" content="Production-ready SvelteKit SaaS template" />
</svelte:head>

<div class="min-h-screen bg-gray-900 text-white">
  <nav class="flex justify-between items-center p-6 max-w-7xl mx-auto">
    <a href="/" class="text-2xl font-bold">SaaS Name</a>
    <div class="flex gap-4">
      {#if data.user}
        <a href="/dashboard" class="px-4 py-2 rounded bg-primary hover:bg-primary/90">Dashboard</a>
        <form method="POST" action="/auth/logout">
          <button type="submit" class="px-4 py-2 rounded border border-white/20 hover:bg-white/10">
            Sign Out
          </button>
        </form>
      {:else}
        <a href="/auth/login" class="px-4 py-2 rounded border border-white/20 hover:bg-white/10">
          Sign In
        </a>
        <a href="/auth/register" class="px-4 py-2 rounded bg-primary hover:bg-primary/90">
          Get Started
        </a>
      {/if}
    </div>
  </nav>
  
  <slot />
</div>
