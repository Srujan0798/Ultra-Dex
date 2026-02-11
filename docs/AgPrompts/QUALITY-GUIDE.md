# 📋 Ultra-Dex AgPrompts Quality Guide

> **Standards for World-Class Production-Grade Prompts**
> **Version:** 6.0.0 OVERPOWERED
> **Last Updated:** 2026-02-10

---

## 🎯 QUALITY OBJECTIVES

This guide establishes the standards for creating and maintaining world-class, production-grade prompts for the Ultra-Dex system. All prompts must meet these quality benchmarks to ensure consistency, reliability, and effectiveness.

### Quality Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Completeness** | 95%+ | All required sections present |
| **Clarity** | 98%+ | Understandable by any AI model |
| **Effectiveness** | 90%+ | Produces desired output consistently |
| **Maintainability** | 95%+ | Easy to update and modify |
| **Consistency** | 98%+ | Follows established patterns |

---

## 📐 STANDARDIZED PROMPT STRUCTURE

Every prompt must follow this standardized structure:

```markdown
---
id: PROMPT-XXX
title: 'Descriptive Title'
category: core|phase|active|archive
priority: critical|high|medium|low
status: active|completed|in-progress|pending
version: 6.0.0
last-updated: YYYY-MM-DD
author: Ultra-Dex Team
related:
  - PROMPT-XXX
  - SPEC-XXXX
tags:
  - tag1
  - tag2
dependencies:
  - PROMPT-XXX
testing:
  - method: automated|manual
  - coverage: XX%
---

# [Emoji] PROMPT TITLE

> **Brief overview of the prompt's purpose**
> **Context:** Relevant background information

---

## ⚠️ CRITICAL MANDATE (Read First)

### Core DNA (SACRED — Never Deviate)
| Principle | Why It's Sacred |
| :--- | :--- |
| **Core Principle 1** | **Justification for importance** |
| **Core Principle 2** | **Justification for importance** |

### Current Context (v6.0.0)
- **Engine:** Technology stack and tools
- **Constraints:** Important limitations
- **Success Criteria:** How to measure success

---

## 🔥 THE BRUTAL SPECIFICATIONS (2026 Standards)

### 1. Primary Objective
- **The Problem:** What challenge this prompt addresses
- **Your Job:** Specific responsibilities
- **Audit:** How to verify completion

### 2. Secondary Requirements
- **Performance:** Speed, efficiency, or scale requirements
- **Compatibility:** Integration or interoperability needs
- **Security:** Safety or compliance requirements

---

## 📋 IMPLEMENTATION INSTRUCTIONS

### Step 1: Preparation
1. **Verify prerequisites** are met
2. **Set up environment** with required tools
3. **Review dependencies** and constraints

### Step 2: Execution
1. **Follow the process** outlined below
2. **Document decisions** and rationale
3. **Test intermediate results** for correctness

### Step 3: Validation
1. **Run verification tests** to confirm functionality
2. **Check quality metrics** against targets
3. **Document outcomes** and lessons learned

---

## ✅ EXPECTED OUTPUT

### Deliverables
- **Artifact 1:** Description of expected output
- **Artifact 2:** Description of expected output
- **Documentation:** Required documentation

### Quality Gates
- [ ] **Completeness:** All required elements present
- [ ] **Correctness:** Output meets specifications
- [ ] **Performance:** Meets speed/efficiency targets
- [ ] **Maintainability:** Code/docs are clear and organized

---

## 🧪 TESTING INSTRUCTIONS

### Manual Testing
1. **Execute the prompt** with sample inputs
2. **Verify outputs** match expected results
3. **Check edge cases** and error conditions

### Automated Testing
- **Unit tests:** Cover core functionality
- **Integration tests:** Verify system interactions
- **Regression tests:** Ensure no breaking changes

### Success Criteria
- [ ] **Functional:** All features work as expected
- [ ] **Performance:** Meets speed requirements
- [ ] **Reliability:** Consistent results across runs

---

## 🔗 RELATED PROMPTS

### Dependencies
- **[ARCHITECT-PROMPT.md](./core-systems/ARCHITECT-PROMPT.md):** Required prerequisite
- **[AGENT_SWARM_SPEC.md](./core-systems/AGENT_SWARM_SPEC.md):** Related specification

### Related Work
- **[CODER-PROMPT.md](./core-systems/CODER-PROMPT.md):** Complementary functionality
- **[REVIEWER-PROMPT.md](./core-systems/REVIEWER-PROMPT.md):** Alternative approach

---

## 📝 CHANGELOG

### [Version] - Date - Summary
- **Added:** New features or capabilities
- **Changed:** Modifications to existing functionality
- **Fixed:** Resolved issues or bugs
- **Removed:** Deprecated elements

---

## 💡 BEST PRACTICES

### Writing Effective Prompts
1. **Be Specific:** Clearly define the task and expected output
2. **Provide Context:** Include relevant background information
3. **Use Examples:** Show concrete examples when possible
4. **Define Constraints:** Specify limitations and requirements
5. **Include Validation:** Explain how to verify results

### Maintaining Quality
1. **Regular Review:** Periodically assess prompt effectiveness
2. **Update Dependencies:** Keep references current
3. **Improve Continuously:** Refine based on usage feedback
4. **Document Changes:** Maintain clear changelog
5. **Test Thoroughly:** Verify changes don't break existing functionality

---

## ⚠️ COMMON PITFALLS TO AVOID

### Structural Issues
- **Missing sections:** Ensure all required sections are present
- **Inconsistent formatting:** Follow established patterns
- **Unclear objectives:** Define clear success criteria

### Content Issues
- **Ambiguous instructions:** Be specific and unambiguous
- **Missing prerequisites:** Include all necessary context
- **Unrealistic expectations:** Set achievable goals

### Maintenance Issues
- **Outdated references:** Keep links and dependencies current
- **Poor documentation:** Maintain clear explanations
- **Inadequate testing:** Ensure thorough validation

---

## 🎯 DEFINITION OF DONE

A prompt is considered complete when:

- [ ] **Structure:** Follows standardized template
- [ ] **Content:** Addresses all requirements
- [ ] **Quality:** Meets effectiveness targets
- [ ] **Testing:** Includes validation instructions
- [ ] **Documentation:** Provides clear explanations
- [ ] **Maintenance:** Includes changelog and metadata
- [ ] **Integration:** Works with existing system
- [ ] **Performance:** Meets speed/efficiency targets

---

## 📊 QUALITY SCORECARD

Rate each prompt on the following dimensions (1-10 scale):

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Clarity** | /10 | How clear and understandable |
| **Completeness** | /10 | How thoroughly specified |
| **Specificity** | /10 | How precisely defined |
| **Actionability** | /10 | How easy to execute |
| **Measurability** | /10 | How well-defined success is |
| **Maintainability** | /10 | How easy to update |
| **Reusability** | /10 | How broadly applicable |
| **Integration** | /10 | How well it fits the system |

**Overall Quality Score:** /80 = **_%**

---

## 🚀 CONTINUOUS IMPROVEMENT

### Feedback Collection
- **Usage Metrics:** Track prompt effectiveness
- **User Feedback:** Gather input from prompt users
- **Performance Data:** Monitor execution results
- **Quality Assessments:** Regular reviews and audits

### Improvement Process
1. **Identify Opportunities:** Analyze feedback and metrics
2. **Prioritize Changes:** Focus on highest impact improvements
3. **Implement Updates:** Make targeted enhancements
4. **Validate Results:** Confirm improvements are effective
5. **Document Changes:** Update all relevant documentation

---

**Maintained by:** Ultra-Dex Core Team
**Next Review:** Quarterly or as needed