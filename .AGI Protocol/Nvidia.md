# NVIDIA Route — Final High-Power Operator Manual (Maya Lane)

## Role in .AGI Protocol
High-scale NVIDIA/API supply lane for broad model availability and fallback resilience.
**Mandatory inclusion in Fallback #3 policy.**

## Source of Truth
Refresh available NVIDIA routes with:
```bash
opencode models | grep -iE '^nvidia/|^openrouter/nvidia/|nemotron'
```

## Live Model Roster (Extracted 2026-04)

### Free Models
| Model | Provider | Notes |
|-------|----------|-------|
| opencode/nemotron-3-super-free | OpenCode | Free tier |
| openrouter/nvidia/nemotron-3-nano-30b-a3b:free | OpenRouter | Free |
| openrouter/nvidia/nemotron-3-super-120b-a12b:free | OpenRouter | Free |
| openrouter/nvidia/nemotron-nano-12b-v2-vl:free | OpenRouter | Free, Vision |
| openrouter/nvidia/nemotron-nano-9b-v2:free | OpenRouter | Free |

### NVIDIA Nemotron Family
| Model | Size | Best For |
|-------|------|----------|
| nvidia/nvidia/nemotron-4-340b-instruct | 340B | Largest, highest quality |
| nvidia/nvidia/llama-3.1-nemotron-ultra-253b-v1 | 253B | Ultra-class reasoning |
| nvidia/nvidia/nemotron-3-super-120b-a12b | 120B | High-power general |
| nvidia/nvidia/llama-3.3-nemotron-super-49b-v1.5 | 49B | Balanced super |
| nvidia/nvidia/llama-3.3-nemotron-super-49b-v1 | 49B | Super reasoning |
| nvidia/nvidia/llama-3.1-nemotron-70b-instruct | 70B | Strong instruct |
| nvidia/nvidia/llama-3.1-nemotron-51b-instruct | 51B | Mid-tier instruct |
| nvidia/nvidia/cosmos-nemotron-34b | 34B | Specialized |
| nvidia/nvidia/nemotron-3-nano-30b-a3b | 30B | Efficient nano |
| nvidia/nvidia/nvidia-nemotron-nano-9b-v2 | 9B | Small efficient |
| nvidia/nvidia/llama-embed-nemotron-8b | 8B | Embeddings |

### DeepSeek Models (via NVIDIA)
| Model | Best For |
|-------|----------|
| nvidia/deepseek-ai/deepseek-r1 | Reasoning |
| nvidia/deepseek-ai/deepseek-r1-0528 | Reasoning (newer) |
| nvidia/deepseek-ai/deepseek-v3.2 | General v3 |
| nvidia/deepseek-ai/deepseek-v3.1-terminus | Terminal tasks |
| nvidia/deepseek-ai/deepseek-v3.1 | General v3.1 |
| nvidia/deepseek-ai/deepseek-coder-6.7b-instruct | Coding |

### Llama Family (via NVIDIA)
| Model | Size | Best For |
|-------|------|----------|
| nvidia/meta/llama-3.1-405b-instruct | 405B | Largest Llama |
| nvidia/meta/llama-3.3-70b-instruct | 70B | Strong general |
| nvidia/meta/llama-3.1-70b-instruct | 70B | Instruct |
| nvidia/meta/llama3-70b-instruct | 70B | Classic Llama3 |
| nvidia/meta/llama-4-maverick-17b-128e-instruct | 17B | Llama 4 |
| nvidia/meta/llama-4-scout-17b-16e-instruct | 17B | Llama 4 Scout |
| nvidia/meta/llama-3.2-11b-vision-instruct | 11B | Vision |
| nvidia/meta/llama3-8b-instruct | 8B | Small efficient |
| nvidia/meta/llama-3.2-1b-instruct | 1B | Tiny |
| nvidia/meta/codellama-70b | 70B | Code specialized |

### Qwen Models (via NVIDIA)
| Model | Best For |
|-------|----------|
| nvidia/qwen/qwen3-coder-480b-a35b-instruct | Largest coder |
| nvidia/qwen/qwen3.5-397b-a17b | General 397B |
| nvidia/qwen/qwen3-235b-a22b | General 235B |
| nvidia/qwen/qwen3-next-80b-a3b-thinking | Thinking |
| nvidia/qwen/qwen3-next-80b-a3b-instruct | Instruct |
| nvidia/qwen/qwq-32b | QwQ reasoning |
| nvidia/qwen/qwen2.5-coder-32b-instruct | Coder 32B |
| nvidia/qwen/qwen2.5-coder-7b-instruct | Coder 7B |

### Mistral Models (via NVIDIA)
| Model | Size | Best For |
|-------|------|----------|
| nvidia/mistralai/mistral-large-3-675b-instruct-2512 | 675B | Largest Mistral |
| nvidia/mistralai/devstral-2-123b-instruct-2512 | 123B | Dev-focused |
| nvidia/mistralai/mistral-large-2-instruct | Large | General |
| nvidia/mistralai/mistral-small-3.1-24b-instruct-2503 | 24B | Small efficient |
| nvidia/mistralai/codestral-22b-instruct-v0.1 | 22B | Code |
| nvidia/mistralai/ministral-14b-instruct-2512 | 14B | Mini |
| nvidia/mistralai/mamba-codestral-7b-v0.1 | 7B | Mamba code |

### Google Models (via NVIDIA)
| Model | Best For |
|-------|----------|
| nvidia/google/gemma-3-27b-it | Gemma 27B |
| nvidia/google/gemma-3-12b-it | Gemma 12B |
| nvidia/google/gemma-2-27b-it | Gemma 2 27B |
| nvidia/google/gemma-2-2b-it | Gemma 2B |
| nvidia/google/gemma-3-1b-it | Tiny |
| nvidia/google/gemma-3n-e4b-it | Nano 4B |
| nvidia/google/gemma-3n-e2b-it | Nano 2B |
| nvidia/google/codegemma-1.1-7b | Code 7B |
| nvidia/google/codegemma-7b | Code 7B classic |

### Microsoft Phi Models (via NVIDIA)
| Model | Context | Best For |
|-------|---------|----------|
| nvidia/microsoft/phi-3-medium-128k-instruct | 128K | Long context |
| nvidia/microsoft/phi-3-medium-4k-instruct | 4K | Standard |
| nvidia/microsoft/phi-3-small-128k-instruct | 128K | Small long |
| nvidia/microsoft/phi-3-small-8k-instruct | 8K | Small |
| nvidia/microsoft/phi-3.5-moe-instruct | MoE | Mixture |
| nvidia/microsoft/phi-3.5-vision-instruct | Vision | Multimodal |
| nvidia/microsoft/phi-3-vision-128k-instruct | 128K | Vision long |
| nvidia/microsoft/phi-4-mini-instruct | Mini | Smallest Phi |

### Other Notable Models
| Model | Provider | Notes |
|-------|----------|-------|
| nvidia/moonshotai/kimi-k2.5 | Moonshot | Latest Kimi |
| nvidia/moonshotai/kimi-k2-thinking | Moonshot | Thinking mode |
| nvidia/moonshotai/kimi-k2-instruct | Moonshot | Instruct |
| nvidia/minimaxai/minimax-m2.5 | MiniMax | Latest |
| nvidia/minimaxai/minimax-m2.1 | MiniMax | Stable |
| nvidia/stepfun-ai/step-3.5-flash | StepFun | Fast |
| nvidia/z-ai/glm5 | Z-AI | GLM 5 |
| nvidia/z-ai/glm4.7 | Z-AI | GLM 4.7 |
| nvidia/openai/gpt-oss-120b | OpenAI | OSS variant |
| nvidia/openai/whisper-large-v3 | OpenAI | Speech |
| nvidia/nvidia/parakeet-tdt-0.6b-v2 | NVIDIA | TTS |
| nvidia/nvidia/nemoretriever-ocr-v1 | NVIDIA | OCR |
| nvidia/nvidia/llama3-chatqa-1.5-70b | NVIDIA | QA |
| nvidia/black-forest-labs/flux.1-dev | BFL | Image gen |

## Power Routing Presets

### LOW (Free/Cheap, Quick)
```
opencode/nemotron-3-super-free
openrouter/nvidia/nemotron-nano-9b-v2:free
openrouter/nvidia/nemotron-3-nano-30b-a3b:free
nvidia/nvidia/nvidia-nemotron-nano-9b-v2
nvidia/google/gemma-3-1b-it
nvidia/microsoft/phi-4-mini-instruct
```

### BALANCED (30B-120B, Good Quality)
```
nvidia/nvidia/nemotron-3-super-120b-a12b
nvidia/nvidia/llama-3.3-nemotron-super-49b-v1.5
nvidia/meta/llama-3.3-70b-instruct
nvidia/qwen/qwen2.5-coder-32b-instruct
nvidia/mistralai/mistral-small-3.1-24b-instruct-2503
nvidia/deepseek-ai/deepseek-r1
```

### HIGH (Top-Tier, Maximum Quality)
```
nvidia/nvidia/nemotron-4-340b-instruct
nvidia/nvidia/llama-3.1-nemotron-ultra-253b-v1
nvidia/meta/llama-3.1-405b-instruct
nvidia/mistralai/mistral-large-3-675b-instruct-2512
nvidia/qwen/qwen3-coder-480b-a35b-instruct
nvidia/qwen/qwen3.5-397b-a17b
```

## Assignment Rules for Maya
Use for:
- **Mandatory** fallback supply when primary lanes saturate
- Model elasticity for high-tier tasks
- Free-tier fallback via nemotron-*:free routes
- Cost optimization with nano/small models
- Specialized tasks (vision, code, reasoning)

**Fallback #3 MUST include at least one route from this file.**

## Example Dispatch Commands
```bash
# Free fallback route
opencode run -m "opencode/nemotron-3-super-free" "Quick analysis"

# High-power reasoning
opencode run -m "nvidia/nvidia/nemotron-4-340b-instruct" "Complex architecture review"

# Balanced coding
opencode run -m "nvidia/qwen/qwen2.5-coder-32b-instruct" "Refactor this module"

# DeepSeek reasoning
opencode run -m "nvidia/deepseek-ai/deepseek-r1" "Solve this problem step by step"
```

## Cost Class
- FREE (routes tagged :free or opencode/nemotron-3-super-free)
- API-KEY-USAGE (most routes)
