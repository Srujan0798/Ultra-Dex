# Comprehensive Analysis & Enhancement Plan: Ultra-Dex Agent Prompts

## 1. Status Report

### 1.1 Overview

The `docs/AgPrompts` directory contains the "Cognitive Core" of the Ultra-Dex system. It is a mix of high-quality "Persona Prompts" (System Prompts) and detailed "Technical Specifications" (Implementation Plans).

### 1.2 Current File Classification

| File                                    | Type          | Quality      | Issue                           |
| :-------------------------------------- | :------------ | :----------- | :------------------------------ |
| `ARCHITECT-PROMPT.md`                   | **Persona**   | ⭐ Excellent | None                            |
| `CODER-PROMPT.md`                       | **Persona**   | ⭐ Excellent | None                            |
| `REVIEWER-PROMPT.md`                    | **Persona**   | ⭐ Excellent | None                            |
| `DEBUGGER-PROMPT.md`                    | **Persona**   | ⭐ Excellent | None                            |
| `AGENT_SWARM_ORCHESTRATION_ENHANCED.md` | **Spec**      | ⭐ High      | Misidentified as Prompt         |
| `PERSISTENT_MEMORY_ENHANCED.md`         | **Spec**      | ⭐ High      | Misidentified as Prompt         |
| `QUALITY_ASSURANCE_ENHANCED.md`         | **Spec**      | ⭐ High      | Misidentified as Prompt         |
| `GOVERNANCE_AGENT.md`                   | **Mixed**     | Medium       | Needs upgrade to "Brutal" style |
| `PROMPT_09_V5_MOONSHOTS.md`             | **Task List** | High         | Clear, but not a prompt         |

### 1.3 Identified Issues

1.  **Identity Crisis**: The `core-systems` folder mixes _Agent Personas_ (who the agent IS) with _System Specs_ (what the agent BUILDS). This causes context confusion.
2.  **Broken Links**: `core-systems/00-PROMPT-INDEX.md` uses incorrect relative paths (`../`) for files that are in the same directory.
3.  **Missing Personas**: There are no "Brutal" standard persona prompts for the **Swarm Orchestrator**, **Memory Manager**, or **QA Specialist**.
4.  **Inconsistent Naming**: "ENHANCED" suffix is noise. "SPEC" vs "PROMPT" suffix is necessary for clarity.

## 2. Execution Plan

### Phase 1: Structural Cleanup

1.  **Rename Specs**: Rename `*_ENHANCED.md` files to `*_SPEC.md` to clearly distinguish them from prompts.
    - `AGENT_SWARM_ORCHESTRATION_ENHANCED.md` -> `AGENT_SWARM_SPEC.md`
    - `PERSISTENT_MEMORY_ENHANCED.md` -> `MEMORY_SPEC.md`
    - `QUALITY_ASSURANCE_ENHANCED.md` -> `QA_SPEC.md`
    - `MCP_SERVER_V2_ENHANCED.md` -> `MCP_SERVER_SPEC.md`
2.  **Fix Index Links**: Repair all broken relative paths in `00-PROMPT-INDEX.md` and `INDEX.md`.

### Phase 2: Persona Creation (The "Trinity" Expansion)

Create new "Brutal" standard prompts for the missing roles, referencing the Specs as their "Bible".

1.  **`SWARM-PROMPT.md`**: "You are the HIVE MIND. You do not do the work; you orchestrate it."
2.  **`MEMORY-PROMPT.md`**: "You are the LIBRARIAN. Total recall is your mandate."
3.  **`QA-PROMPT.md`**: "You are the GATEKEEPER. Nothing reaches production without your stamp."
4.  **`GOVERNANCE-PROMPT.md`**: Rewrite of `GOVERNANCE_AGENT.md` to match the "Sacred/Brutal" format.

### Phase 3: Final Integration

1.  **Update Indexes**: clear distinction between **ACTIVE PERSONAS** (Prompts) and **REFERENCE SPECS** (Documentation).
2.  **Verify**: Ensure all links work and the tone is consistent across the "Cognitive Core".

## 3. Next Steps

I will proceed with Phase 1 (Renaming & Fixes) and then Phase 2 (Creation).
