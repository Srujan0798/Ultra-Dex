# 🔒 PROJECT CONSTRAINTS - Rules & Limits

> **Purpose:** All project constraints in one place so nothing is forgotten.
> These constraints MUST be followed in every decision.

---

## ⚙️ Technical Constraints

### Tech Stack Requirements

| Layer    | Required             | Reason            |
| -------- | -------------------- | ----------------- |
| Frontend | [React/Vue/Next.js]  | [Why this choice] |
| Backend  | [Node.js/Python/Go]  | [Why this choice] |
| Database | [PostgreSQL/MongoDB] | [Why this choice] |
| Hosting  | [Vercel/AWS/Render]  | [Why this choice] |

### Performance Targets

| Metric                 | Target | Hard Limit |
| ---------------------- | ------ | ---------- |
| Page Load Time         | <2s    | <3s        |
| API Response (p95)     | <200ms | <500ms     |
| First Contentful Paint | <1.5s  | <2.5s      |
| Lighthouse Score       | >90    | >80        |
| Time to Interactive    | <3s    | <5s        |

### Code Quality Thresholds

| Metric                | Minimum | Target |
| --------------------- | ------- | ------ |
| Test Coverage         | 80%     | 90%    |
| Cyclomatic Complexity | <10     | <8     |
| Bundle Size           | <500KB  | <300KB |
| Security Score        | A       | A+     |

---

## 💰 Business Constraints

### Budget Limits

| Category           | Allocated | Hard Limit |
| ------------------ | --------- | ---------- |
| Hosting (monthly)  | $[X]      | $[Max]     |
| Third-party APIs   | $[X]      | $[Max]     |
| Development tools  | $[X]      | $[Max]     |
| Total monthly cost | $[X]      | $[Max]     |

### Timeline Constraints

| Milestone | Target Date | Hard Deadline |
| --------- | ----------- | ------------- |
| MVP       | [DATE]      | [DATE]        |
| Beta      | [DATE]      | [DATE]        |
| Launch    | [DATE]      | [DATE]        |

### Scope Limits

> [!CAUTION]
> The following features are OUT OF SCOPE for v1:

- [ ] [Feature explicitly not included]
- [ ] [Feature explicitly not included]
- [ ] [Feature explicitly not included]

---

## 📜 Legal & Compliance

### Required Compliance

| Regulation | Applies | Requirements          |
| ---------- | ------- | --------------------- |
| GDPR       | Yes/No  | [Requirements if yes] |
| CCPA       | Yes/No  | [Requirements if yes] |
| HIPAA      | Yes/No  | [Requirements if yes] |
| SOC 2      | Yes/No  | [Requirements if yes] |
| PCI-DSS    | Yes/No  | [Requirements if yes] |

### Privacy Requirements

- [ ] Privacy policy required
- [ ] Cookie consent required
- [ ] Data deletion capability required
- [ ] Data export capability required
- [ ] Encryption at rest required
- [ ] Encryption in transit required

### Terms of Service

- [ ] No illegal content
- [ ] Age restrictions: [None / 13+ / 18+]
- [ ] Geographic restrictions: [None / List countries]

---

## 🎨 Design Constraints

### Brand Guidelines

| Element         | Constraint  |
| --------------- | ----------- |
| Primary Color   | [HEX code]  |
| Secondary Color | [HEX code]  |
| Font Family     | [Font name] |
| Logo Usage      | [Rules]     |

### Accessibility Requirements

| Standard              | Level | Required |
| --------------------- | ----- | -------- |
| WCAG 2.1              | AA    | ✅ Yes   |
| WCAG 2.1              | AAA   | ⬜ No    |
| Screen Reader Support | -     | ✅ Yes   |
| Keyboard Navigation   | -     | ✅ Yes   |

### Responsive Breakpoints

| Device  | Min Width | Max Width |
| ------- | --------- | --------- |
| Mobile  | 320px     | 767px     |
| Tablet  | 768px     | 1023px    |
| Desktop | 1024px    | 1440px    |
| Large   | 1441px    | ∞         |

---

## 🔌 Integration Constraints

### Third-Party API Limits

| API        | Rate Limit | Cost Limit | Fallback |
| ---------- | ---------- | ---------- | -------- |
| [API Name] | [X]/min    | $[X]/mo    | [Plan B] |

### Authentication Providers

| Provider       | Allowed     | Priority |
| -------------- | ----------- | -------- |
| Email/Password | ✅ Yes      | 1        |
| Google OAuth   | ✅ Yes      | 2        |
| GitHub OAuth   | ⬜ Optional | 3        |

---

## 🚫 Hard Rules (Non-Negotiable)

> [!IMPORTANT]
> These rules CANNOT be broken under any circumstances:

1. **Security:** No plaintext passwords EVER
2. **Privacy:** No selling or sharing user data
3. **Quality:** No deployment without tests passing
4. **Performance:** No blocking the main thread
5. **Accessibility:** No unlabeled interactive elements

---

_Last Updated: [DATE]_
