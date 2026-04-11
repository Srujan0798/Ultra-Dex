# Developer Handoff Spec: Ultra-Dex Dashboard Components

**Generated:** 2026-04-11  
**Design:** v3.2.0 Dashboard  
**Status:** Ready for Engineering

---

## Component: KPI Card

### Layout

```
┌─────────────────────────────────┐
│  Icon  │  Label                  │
│         │  Value                 │
│         │  Trend (+/- %)        │
└─────────────────────────────────┘
```

### Design Tokens

```css
--kpi-bg: #ffffff;
--kpi-border: 1px solid #e5e7eb;
--kpi-radius: 8px;
--kpi-padding: 16px;
--kpi-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
```

### Props

| Prop   | Type                        | Required | Default   |
| ------ | --------------------------- | -------- | --------- |
| icon   | string                      | yes      | -         |
| label  | string                      | yes      | -         |
| value  | string/number               | yes      | -         |
| trend  | number                      | no       | 0         |
| status | 'success'/'warning'/'error' | no       | 'neutral' |

### States

| State   | Style                      |
| ------- | -------------------------- |
| Default | bg-white, border-gray-200  |
| Hover   | shadow-md, border-blue-300 |
| Loading | skeleton pulse animation   |
| Error   | border-red-500, bg-red-50  |

### Responsive

- Desktop: 4 columns
- Tablet: 2 columns
- Mobile: 1 column

---

## Component: Chart Container

### Layout

```html
<div class="chart-container">
  <div class="chart-header">
    <h3>Title</h3>
    <div class="chart-controls">...</div>
  </div>
  <div class="chart-body">
    <!-- Chart.js or Plotly -->
  </div>
</div>
```

### Animation

- Entry: fade-in 300ms ease-out
- Update: transition 200ms

---

## Edge Cases

| Case     | Handling                      |
| -------- | ----------------------------- |
| No data  | Show empty state illustration |
| Loading  | Skeleton with pulse           |
| Error    | Retry button + error message  |
| Overflow | Horizontal scroll or truncate |

---

## Developer Notes

- Use CSS custom properties for theming
- Charts must be keyboard accessible
- Include aria-labels for screen readers
- Mobile: simplify charts, hide legends

---

**Handoff complete!** Ready for implementation.
