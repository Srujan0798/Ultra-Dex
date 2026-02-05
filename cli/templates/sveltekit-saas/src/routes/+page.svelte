<script lang="ts">
  export let data
</script>

<main class="min-h-screen bg-gradient-to-b from-gray-900 to-black">
  <section class="max-w-4xl mx-auto text-center py-32 px-6">
    <h1 class="text-5xl font-bold mb-6">Build Your SaaS in Record Time</h1>
    <p class="text-xl text-gray-400 mb-12">
      A production-ready SvelteKit template with authentication, payments, and more.
    </p>
    <div class="flex gap-4 justify-center">
      <a href="/auth/register" class="px-8 py-4 rounded-lg bg-primary hover:bg-primary/90 text-lg font-semibold">
        Start Free Trial
      </a>
      <a href="#pricing" class="px-8 py-4 rounded-lg border border-white/20 hover:bg-white/10 text-lg">
        View Pricing
      </a>
    </div>
  </section>
  
  <section id="features" class="max-w-6xl mx-auto py-24 px-6">
    <h2 class="text-3xl font-bold text-center mb-12">Features</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 class="text-xl font-semibold mb-2">🔐 Authentication</h3>
        <p class="text-gray-400">Secure user authentication with Clerk</p>
      </div>
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 class="text-xl font-semibold mb-2">💳 Payments</h3>
        <p class="text-gray-400">Stripe subscriptions and billing</p>
      </div>
      <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 class="text-xl font-semibold mb-2">🗄️ Database</h3>
        <p class="text-gray-400">Prisma ORM with PostgreSQL</p>
      </div>
    </div>
  </section>
</main>
