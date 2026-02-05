<script lang="ts">
  export let data
</script>

<main class="min-h-screen bg-gray-900 text-white p-8">
  <div class="max-w-6xl mx-auto">
    <header class="flex justify-between items-center mb-12">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <span class="px-3 py-1 rounded bg-primary/20 text-primary text-sm">
        {data.subscription?.plan || 'FREE'}
      </span>
    </header>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 class="text-gray-400 text-sm mb-2">Current Plan</h3>
        <p class="text-2xl font-bold">{data.subscription?.plan || 'Free'}</p>
      </div>
      
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 class="text-gray-400 text-sm mb-2">API Calls This Month</h3>
        <p class="text-2xl font-bold">{data.usage || 0}</p>
      </div>
      
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 class="text-gray-400 text-sm mb-2">Status</h3>
        <p class="text-2xl font-bold text-green-400">
          {data.subscription?.status || 'Active'}
        </p>
      </div>
    </div>
    
    <section class="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button class="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
          📊 View Analytics
        </button>
        <button class="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
          ⚙️ Settings
        </button>
        <button class="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
          📝 API Keys
        </button>
        <a href="/billing" class="p-4 bg-primary/20 rounded-lg hover:bg-primary/30 transition text-primary text-center">
          ⬆️ Upgrade Plan
        </a>
      </div>
    </section>
  </div>
</main>
