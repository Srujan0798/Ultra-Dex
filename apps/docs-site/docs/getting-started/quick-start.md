# Quick Start

## 1. Create a project

```bash
mkdir my-ai-router && cd my-ai-router
npm init -y
npm install @ultra-dex/sdk openai
```

## 2. Write your first router

Create `index.js`:

```javascript
import { UltraDex } from '@ultra-dex/sdk'
import OpenAI from 'openai'

// 1. Create client
const dex = new UltraDex({ defaultProvider: 'openai' })

// 2. Register a provider
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

dex.registerProvider('openai', {
  async chat(messages, opts = {}) {
    const res = await openai.chat.completions.create({
      model: opts.model || 'gpt-4o',
      messages,
    })
    return {
      content: res.choices[0].message.content,
      usage: {
        promptTokens: res.usage.prompt_tokens,
        completionTokens: res.usage.completion_tokens,
      },
      provider: 'openai',
      model: res.model,
    }
  },

  async *stream(messages, opts = {}) {
    const res = await openai.chat.completions.create({
      model: opts.model || 'gpt-4o',
      messages,
      stream: true,
    })
    for await (const chunk of res) {
      yield { content: chunk.choices[0]?.delta?.content || '' }
    }
  },

  async embed(text, opts = {}) {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return { embedding: res.data[0].embedding }
  },
})

// 3. Enable router
dex.enableRouter({ strategy: 'cheapest' })

// 4. Send a message
const response = await dex.chat([{ role: 'user', content: 'Hello world' }])
console.log(response.content)
```

## 3. Run it

```bash
node index.js
```

## Next steps

- [Add multiple providers](../providers)
- [Change routing strategy](../guides/routing-strategies)
- [Add middleware](../guides/middleware)
- [Track costs](../sdk#cost-tracking)
