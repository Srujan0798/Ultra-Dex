# Capacity Plan: Ultra-Dex Team Q2-Q4 2026

**Generated:** 2026-04-11  
**Period:** Q2-Q4 2026  
**Team:** Ultra-Dex Core Team (2 FTE + contractors)

---

## 1. Current Utilization

### Team Composition

| Role              | Headcount | Capacity (hrs/week) |
| ----------------- | --------- | ------------------- |
| Lead Dev (Srujan) | 1         | 40                  |
| Senior Dev        | 1         | 40                  |
| **Total**         | **2**     | **80**              |

### Current Workload Analysis

| Project          | Hours/Week | % Capacity | Status           |
| ---------------- | ---------- | ---------- | ---------------- |
| Core Development | 30         | 37.5%      | ✅ Sustainable   |
| Bug Fixes        | 10         | 12.5%      | ✅ Sustainable   |
| Code Review      | 8          | 10%        | ⚠️ Heavy         |
| Planning/Admin   | 4          | 5%         | ✅ Sustainable   |
| Technical Debt   | 8          | 10%        | ⚠️ Heavy         |
| **Total**        | **60**     | **75%**    | ⚠️ Near capacity |

---

## 2. Forecast: Q2-Q4 2026

### Planned Projects

| Project                  | Start      | Duration | Hours Needed | Team Impact |
| ------------------------ | ---------- | -------- | ------------ | ----------- |
| Redis/Postgres Migration | Week 2     | 3 weeks  | 40           | +20%        |
| npm Publish + Docker     | Week 3     | 2 weeks  | 30           | +15%        |
| v3.2.0 Launch            | Week 8     | 2 weeks  | 40           | +20%        |
| LiteLLM Adapter          | Q3 Week 1  | 4 weeks  | 60           | +30%        |
| Agent Marketplace        | Q3 Week 12 | 6 weeks  | 80           | +40%        |
| VS Code Extension        | Q4 Month 5 | 8 weeks  | 100          | +50%        |

### Utilization Forecast

```
Q2 (Weeks 1-12):
  Base: 75%
  + Redis migration: +20% → 95% peak
  + Launch prep: +20% → 100%+ (overload)

Q3 (Weeks 13-24):
  Base: 75%
  + LiteLLM: +30% → 105% (overload)
  + Marketplace start: +40% → 115% (critical)

Q4 (Weeks 25-36):
  Base: 75%
  + VS Code: +50% → 125% (critical)
```

---

## 3. Gap Analysis

| Quarter | Capacity | Demand  | Gap      | Risk     |
| ------- | -------- | ------- | -------- | -------- |
| Q2      | 480 hrs  | 520 hrs | -40 hrs  | HIGH     |
| Q3      | 480 hrs  | 600 hrs | -120 hrs | CRITICAL |
| Q4      | 480 hrs  | 680 hrs | -200 hrs | CRITICAL |

---

## 4. Recommendations

### Option A: Hire (Recommended)

| Role                  | Timing | Cost   | Impact       |
| --------------------- | ------ | ------ | ------------ |
| Senior Dev (contract) | Q2     | $8K/mo | +40 hrs/week |
| Part-time PM          | Q3     | $3K/mo | +20 hrs/week |

**Total additional cost:** ~$11K/month

### Option B: Deprioritize

| Project           | Delay   | Impact                 |
| ----------------- | ------- | ---------------------- |
| VS Code Extension | Q1 2027 | Low priority           |
| LiteLLM Adapter   | Q4 2027 | Loses competitive edge |

### Option C: Outsource

| Component    | Vendor | Cost        | Timeline |
| ------------ | ------ | ----------- | -------- |
| Frontend dev | Toptal | $6K/project | 4 weeks  |

---

## 5. Decision Required

**Recommendation:** Option A (Hire contractor in Q2)

- Immediate: Hire 1 senior dev contractor (8 hrs/day)
- Q3: Add part-time PM
- Total investment: ~$55K for 9 months
- Benefit: Deliver all planned features on time

**Alternative:** Defer VS Code extension to preserve team health

---

**Capacity analysis complete!** Decision needed by April 18 to meet Q2 timeline.
