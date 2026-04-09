# 🚀 Quick Start: Nemotron Setup

## 3 Simple Steps

### 1️⃣ Get Your Free API Key (1 minute)

1. Visit: **https://build.nvidia.com/**
2. Sign up (free)
3. Find **Nemotron-3-Super-120B-A12B**
4. Click **"Get API Key"**
5. Copy the key (starts with `nvapi-...`)

---

### 2️⃣ Install Dependency (1 minute)

```bash
npm install openai@^4.0.0
```

---

### 3️⃣ Configure API Key (30 seconds)

Create `.env.local` file:

```bash
echo "NVIDIA_API_KEY=nvapi-your-actual-key-here" > .env.local
```

Or manually create `.env.local` with:

```
NVIDIA_API_KEY=nvapi-your-actual-key-here
```

---

## ✅ You're Done! Test It:

```bash
# Run the examples (matches NVIDIA's Python API)
npm run nemotron:example

# Basic CLI usage
npm run nemotron "Hello, can you help me write a Python function?"

# Stream responses
npm run nemotron -- --stream "Create a simple Express.js server"

# Quick answers (no reasoning)
npm run nemotron -- --no-thinking "What is Node.js?"
```

---

## 📝 JavaScript API (Matches Python Example)

```javascript
import { createNemotronClient } from './src/services/ai-providers/nemotron.js';

const client = createNemotronClient(process.env.NVIDIA_API_KEY);
const MODEL = 'nvidia/nemotron-3-super-120b-a12b';

// Exact match to NVIDIA's Python example
const response = await client.chat.completions.create({
  model: MODEL,
  messages: [{ role: 'user', content: 'Write a haiku about GPUs' }],
  max_tokens: 16000,
  temperature: 1.0,
  top_p: 0.95,
  extra_body: {
    chat_template_kwargs: {
      enable_thinking: true,
    },
  },
});

console.log(response.choices[0].message.content);
```

---

## 📝 Example Session

````bash
$ npm run nemotron "Write a function to check if a number is prime"

🚀 Ultra-Dex Nemotron CLI
   Powered by NVIDIA Nemotron-3-Super 120B

Prompt: Write a function to check if a number is prime

Response:

Here's a JavaScript function to check if a number is prime:

```javascript
function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
        if (n % i === 0) return false;
    }
    return true;
}
````

````

---

## 🆘 Troubleshooting

**Error: NVIDIA_API_KEY not found**
```bash
# Make sure .env.local exists and has your key
cat .env.local
# Should show: NVIDIA_API_KEY=nvapi-xxxxx
````

**Rate limit error**

- Free tier has limits - wait a few minutes and retry
- Use `--no-thinking` for simpler queries

**Command not found**

```bash
# Install dependency first
npm install openai@^4.0.0
```

---

## 📚 Learn More

See full documentation: `NEMOTRON-SETUP.md`
