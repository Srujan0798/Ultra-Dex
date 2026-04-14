# Provider Setup

`@ultra-dex/sdk` uses a simple `BaseProvider` interface: `chat()`, `stream()`, and `embed()`. You can wrap any official SDK in ~10 lines.

## OpenAI

```javascript
import OpenAI from 'openai'

class OpenAIProvider {
  constructor({ apiKey, model = 'gpt-4o' }) {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async chat(messages, opts = {}) {
    const res = await this.client.chat.completions.create({
      model: opts.model || this.model,
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
  }

  async *stream(messages, opts = {}) {
    const res = await this.client.chat.completions.create({
      model: opts.model || this.model,
      messages,
      stream: true,
    })
    for await (const chunk of res) {
      yield { content: chunk.choices[0]?.delta?.content || '' }
    }
  }

  async embed(text, opts = {}) {
    const res = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return { embedding: res.data[0].embedding }
  }
}

// Register
dex.registerProvider('openai', new OpenAIProvider({ apiKey: process.env.OPENAI_KEY }))
```

## Anthropic

```javascript
import Anthropic from '@anthropic-ai/sdk'

class AnthropicProvider {
  constructor({ apiKey, model = 'claude-3-5-sonnet-20241022' }) {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async chat(messages, opts = {}) {
    const res = await this.client.messages.create({
      model: opts.model || this.model,
      max_tokens: 4096,
      messages,
    })
    return {
      content: res.content[0].text,
      usage: {
        promptTokens: res.usage.input_tokens,
        completionTokens: res.usage.output_tokens,
      },
      provider: 'anthropic',
      model: res.model,
    }
  }

  async *stream(messages, opts = {}) {
    const res = await this.client.messages.create({
      model: opts.model || this.model,
      max_tokens: 4096,
      messages,
      stream: true,
    })
    for await (const chunk of res) {
      if (chunk.type === 'content_block_delta') {
        yield { content: chunk.delta.text || '' }
      }
    }
  }

  async embed() {
    throw new Error('Anthropic does not support embeddings via this provider')
  }
}
```

## Google (Gemini)

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai'

class GoogleProvider {
  constructor({ apiKey, model = 'gemini-1.5-flash' }) {
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  async chat(messages, opts = {}) {
    const model = this.client.getGenerativeModel({ model: opts.model || this.model })
    const res = await model.generateContent(messages[messages.length - 1].content)
    return {
      content: res.response.text(),
      usage: {},
      provider: 'google',
      model: opts.model || this.model,
    }
  }
}
```

## Tips

- Return `usage` with `promptTokens` and `completionTokens` so the router can track cost.
- If a provider doesn't support streaming, return an async generator that yields the full response once.
