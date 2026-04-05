# Nvidia Models: Official OpenCode Roster

**Document Status:** 2026 Official Documentation Verified  
**Source:** OpenCode Provider (Nvidia)  
**Tool:** Comprehensive taxonomy, classification and priority ranking of the 30+ agentic AI models available through the Nvidia OpenCode provider, strictly categorized without assumptions.

---

## 1. Meta / Llama Family

_The core open-source standard, heavily optimized by NVIDIA (Nemotron)._

| Model                                  | Classification   | Best For                         |
| -------------------------------------- | ---------------- | -------------------------------- |
| `Llama 3.1 405b Instruct`              | Frontier / Heavy | Max capability Meta              |
| `Llama 3.1 / 3.3 70b Instruct`         | General Purpose  | Daily driver balance             |
| `Llama Nemotron 70b / 51b / Super 49b` | Nvidia Optimized | Fine-tuned instruction following |
| `Llama-3.1-Nemotron-Ultra-253B-v1`     | Heavy Nvidia Ops | Massive token workflows          |
| `Llama 4 Maverick / Scout (Preview)`   | Next-Gen / Edge  | Lightweight architecture prep    |
| `Llama 3.2 1b / 11b Vision`            | Small / Modality | Edge devices, multimodal         |
| `Llama 4 Maverick`                     | Next-Gen         | Lightweight architecture         |

---

## 2. DeepSeek Family

_Highly efficient MoE and RL-trained models._

| Model                             | Classification       | Best For                             |
| --------------------------------- | -------------------- | ------------------------------------ |
| `DeepSeek V3.2 / V3.1 / Terminus` | General MoE          | Fast coding and agentic chat         |
| `Deepseek R1 / R1 0528`           | Heavy Reasoning (RL) | Logical puzzles, structural planning |
| `Deepseek Coder 6.7b Instruct`    | Coding Specialist    | Focused basic code generation        |

---

## 3. Alibaba / Qwen Family

_Powerhouse models scaling up autonomous coding architectures._

| Model                                  | Classification   | Best For                         |
| -------------------------------------- | ---------------- | -------------------------------- |
| `Qwen3 Coder 480B A35B Instruct`       | Frontier Coding  | Extreme codebase architecture    |
| `Qwen3-Next-80B-A3B Instruct/Thinking` | Efficiency MoE   | Low-cost high-intelligence tasks |
| `Qwen3 / 3.5 Massive Models`           | Heavy General    | Broad, ultra-long context        |
| `Qwen2.5 Coder 32b / 7b`               | Mid/Small Coding | Rapid CLI generation, Ollama     |
| `Qwq 32b`                              | Reasoning        | Qwen's experimental logic branch |

---

## 4. Mistral & Ministral Family

_French AI lab known for high-efficiency logic._

| Model                                | Classification   | Best For                          |
| ------------------------------------ | ---------------- | --------------------------------- |
| `Mistral Large 2 / 3 675B`           | Frontier General | Complex standard instruction sets |
| `Devstral-2-123B-Instruct-2512`      | Next-Gen Coding  | Multi-file codebase refactors     |
| `Codestral 22b / Mamba Codestral 7b` | Mid-Size Coding  | Context-heavy code completion     |
| `Mistral Small 3.1 / Ministral 3`    | Edge / Small     | Low latency tasks                 |

---

## 5. NVIDIA First-Party Models

_Nvidia's proprietary infrastructure and application-layer models._

| Model                        | Classification    | Best For                         |
| ---------------------------- | ----------------- | -------------------------------- |
| `Cosmos Nemotron 34B`        | VLM               | Visual reading and UI processing |
| `Nemotron 4 340b Instruct`   | Heavy General     | Deep inference logic             |
| `Nemotron 3 Super / Nano 9b` | Mid/Small General | Scanning and reading codebases   |
| `Parakeet TDT 0.6B v2`       | Audio             | High-speed ASR / Transcription   |
| `NeMo Retriever OCR v1`      | Data Protocol     | RAG document & image extraction  |

---

## 6. Moonshot AI / Kimi

_Advanced agentic MoE models._

| Model                         | Classification | Best For                    |
| ----------------------------- | -------------- | --------------------------- |
| `Kimi K2 Instruct / Thinking` | Frontier MoE   | Native reasoning modalities |
| `Kimi K2.5`                   | Multimodal     | Unified vision/text         |

---

## 7. Microsoft / Phi Family

_High reasoning in small footprints._

| Model                      | Classification    | Best For                                   |
| -------------------------- | ----------------- | ------------------------------------------ |
| `Phi 3 Medium / Small`     | Mid/Small General | Cheap, capable backend servers             |
| `Phi-4-Mini`               | Edge Scaling      | Max capability for lowest parameter        |
| `Phi 3 / 3.5 Vision / MoE` | Modality          | Quick vision reads without massive context |

---

## 8. Google / Z.ai / OSS Special

_Other unique models of value._

| Model                     | Provider     | Best For                           |
| ------------------------- | ------------ | ---------------------------------- |
| `Gemma 2 / 3 / Codegemma` | Google       | General OS tier compute            |
| `GLM-4.7 / GLM5`          | Zhipu AI     | Interleaved agentic thinking loops |
| `GPT-OSS-120B`            | OpenAI (OSS) | Optimized agentic tool usage       |
| `Step 3.5 Flash`          | StepFun      | 196B MoE with self-improving RL    |
| `FLUX.1-dev`              | Black Forest | Pure UI image generation / Mockups |

---

## 9. Ultra-Dex Swarm Role & Dispatch

Given the Ultra-Dex platform's reliance on autonomous engineering swarms, recommended tiering for tasks:

- **Role:** High Intelligence Reasoning and Specific Modalities
- **Best For:** Injecting specialized intelligence into swarm workflows.
- **Windows:** Varied depending on tool wrapper.
- **$0 Strategy:** Use OpenCode CLI wrappers for accessing premium Nvidia models.

### Priority 1: Heavy System Engineering & Complex Bug Fixing

_Deep reasoning, planning, and highly complex multi-file codebase manipulation._

1. **Deepseek R1 / R1 0528**
2. **Qwen3 Coder 480B A35B Instruct**
3. **Devstral-2-123B-Instruct**

### Priority 2: High-Speed Coding & Assistant Tasks

_Rapid code generation, quick file refactors, test assertion writing._

1. **DeepSeek V3.2 / V3.1**
2. **Qwen2.5 Coder 32b Instruct**
3. **Step 3.5 Flash**

### Dispatch Templates

```bash
# Complex Codebase Fix utilizing OpenCode
opencode run -m opencode/devstral-2-123b-instruct-2512 -p "Execute the multi-file migration plan"
```

