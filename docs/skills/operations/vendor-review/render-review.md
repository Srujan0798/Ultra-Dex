# Vendor Review: Render.com (Hosting)

**Generated:** 2026-04-11  
**Vendor:** Render.com  
**Purpose:** Production hosting + managed services

---

## Vendor Overview

| Attribute    | Value                      |
| ------------ | -------------------------- |
| **Service**  | Cloud hosting + managed DB |
| **Pricing**  | $20-100/month              |
| **Rating**   | ⭐⭐⭐⭐ (4.5/5)           |
| **Contract** | Monthly (cancel anytime)   |

---

## Cost Analysis

| Service     | Current     | Render  | Monthly       |
| ----------- | ----------- | ------- | ------------- |
| Web service | Self-hosted | Starter | $25           |
| PostgreSQL  | Self-hosted | Managed | $15           |
| Redis       | Self-hosted | Managed | $15           |
| **Total**   | **$0**      | -       | **$55/month** |

**Break-even:** At 3 months (vs. self-hosted + ops time)

---

## Risk Assessment

| Risk           | Level  | Mitigation                   |
| -------------- | ------ | ---------------------------- |
| Vendor lock-in | Low    | Exportable, standard configs |
| Downtime       | Low    | 99.9% SLA available          |
| Cost spike     | Medium | Set budget alerts            |
| Data loss      | Low    | Daily backups included       |

---

## Comparison

| Factor      | Render     | AWS        | Heroku   |
| ----------- | ---------- | ---------- | -------- |
| Ease of use | ⭐⭐⭐⭐⭐ | ⭐⭐       | ⭐⭐⭐⭐ |
| Pricing     | ⭐⭐⭐⭐   | ⭐⭐⭐     | ⭐⭐     |
| Features    | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐   |
| Support     | ⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐⭐⭐ |

---

## Recommendation

**✅ RECOMMEND**

- Use Render for production (Postgres + Redis)
- Self-host for dev/local (cost savings)
- Enable $20/month SLA for production
- Estimated savings: 10+ hours/month ops time

**Next step:** Deploy staging to Render by April 18
