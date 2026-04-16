# Ultra-Dex Data Visualization Guide

**Version:** 3.1.0  
**Last Updated:** April 10, 2026  
**Purpose:** Chart selection, Python examples, design principles, and accessibility guidelines  
**Data Source:** Ultra-Dex Test Suite Analytics

---

## 1. Chart Type Selection Guide

### 1.1 Decision Tree

```
What do you want to show?
═══════════════════════════════════════════════════════════════

COMPARISON
  Category vs Category    → Bar Chart
  Time vs Value           → Line Chart
  Part-to-Whole           → Stacked Bar or Pie Chart (limited)
  Before/After            → Slope Chart or Diverging Bar

DISTRIBUTION
  Single variable         → Histogram
  Multiple groups         → Box Plot or Violin Plot
  Cumulative              → CDF or P-P Plot
  2D distribution         → Scatter Plot or Heatmap

COMPOSITION
  Static                  → Pie Chart or Donut Chart (max 6 categories)
  Changing over time      → Stacked Area Chart
  Hierarchy               → Treemap or Sunburst
  Flows                   → Sankey Diagram

RELATIONSHIP
  Two variables           → Scatter Plot
  Three variables         → Bubble Chart
  Many variables          → Correlation Matrix / Heatmap
  Temporal connection     → Network Graph
```

### 1.2 Ultra-Dex Specific Recommendations

| Use Case                     | Recommended Chart | Alternative      | Avoid          |
| ---------------------------- | ----------------- | ---------------- | -------------- |
| **Test Duration by Module**  | Horizontal Bar    | Grouped Bar      | Pie Chart      |
| **Coverage Trend Over Time** | Line Chart        | Area Chart       | 3D Line        |
| **Pass Rate Distribution**   | Histogram         | Box Plot         | Pie Chart      |
| **Error Type Breakdown**     | Donut Chart       | Treemap          | Multiple Pies  |
| **Provider Cost Comparison** | Grouped Bar       | Radar Chart      | Stacked Bar    |
| **Test Dependencies**        | Network Graph     | Adjacency Matrix | Force-directed |
| **Performance Correlation**  | Scatter + Trend   | Bubble Chart     | 3D Scatter     |
| **Flakiness Heatmap**        | Calendar Heatmap  | Matrix           | 3D Bars        |

### 1.3 Chart Selection Matrix

| Data Characteristics        | Best Chart Type                  |
| --------------------------- | -------------------------------- |
| 1-2 Categories              | Bar chart                        |
| 3-7 Categories              | Grouped bar or small multiples   |
| 8+ Categories               | Horizontal bar or table          |
| Time Series (continuous)    | Line chart                       |
| Time Series (categorical)   | Bar chart or heatmap             |
| Percentages (part of whole) | Stacked bar or treemap           |
| Rankings                    | Horizontal bar or lollipop chart |
| Correlations                | Scatter plot or heatmap          |
| Geographic                  | Choropleth or bubble map         |
| Hierarchies                 | Treemap, sunburst, or icicle     |
| Flows                       | Sankey or chord diagram          |

---

## 2. Python Code Examples

### 2.1 Setup and Configuration

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.patches import Rectangle
import warnings
warnings.filterwarnings('ignore')

# Ultra-Dex color palette
ULTRA_DEX_COLORS = {
    'primary': '#2563EB',
    'secondary': '#7C3AED',
    'success': '#059669',
    'warning': '#D97706',
    'danger': '#DC2626',
    'info': '#0891B2',
    'neutral': '#6B7280',
    'background': '#F9FAFB',
    'text': '#111827',
}

# Set default style
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette([
    ULTRA_DEX_COLORS['primary'],
    ULTRA_DEX_COLORS['secondary'],
    ULTRA_DEX_COLORS['success'],
    ULTRA_DEX_COLORS['warning'],
    ULTRA_DEX_COLORS['danger'],
    ULTRA_DEX_COLORS['info'],
])

# Sample Ultra-Dex data
MODULE_DATA = {
    'module': ['Governance', 'Memory', 'AI Router', 'Orchestration',
               'Performance', 'Security', 'CLI', 'Integration'],
    'test_count': [78, 65, 54, 87, 24, 20, 76, 44],
    'avg_duration_ms': [234, 189, 267, 198, 689, 156, 145, 345],
    'coverage_pct': [82.4, 87.1, 76.8, 81.2, 68.5, 89.3, 73.2, 64.1],
    'pass_rate': [100, 100, 100, 100, 100, 100, 100, 100],
    'flake_rate': [0.8, 0.0, 2.1, 0.5, 3.2, 0.0, 1.5, 2.8],
}

df = pd.DataFrame(MODULE_DATA)
print(f"Dataset: {len(df)} modules, {df['test_count'].sum()} total tests")
```

### 2.2 Horizontal Bar Chart (Test Duration)

```python
fig, ax = plt.subplots(figsize=(10, 6))

# Sort by duration for better readability
df_sorted = df.sort_values('avg_duration_ms', ascending=True)

# Create horizontal bar chart
bars = ax.barh(df_sorted['module'], df_sorted['avg_duration_ms'],
               color=ULTRA_DEX_COLORS['primary'], edgecolor='white', linewidth=0.5)

# Add value labels
for i, (idx, row) in enumerate(df_sorted.iterrows()):
    ax.text(row['avg_duration_ms'] + 10, i, f"{row['avg_duration_ms']:.0f}ms",
            va='center', fontsize=10, color=ULTRA_DEX_COLORS['text'])

# Styling
ax.set_xlabel('Average Duration (ms)', fontsize=12, fontweight='bold')
ax.set_title('Test Duration by Module\nUltra-Dex Test Suite',
             fontsize=14, fontweight='bold', pad=20)
ax.set_xlim(0, max(df['avg_duration_ms']) * 1.15)
ax.grid(axis='x', alpha=0.3)
ax.set_axisbelow(True)

# Color code outliers (> 500ms)
for i, (idx, row) in enumerate(df_sorted.iterrows()):
    if row['avg_duration_ms'] > 500:
        bars[i].set_color(ULTRA_DEX_COLORS['warning'])

plt.tight_layout()
plt.savefig('test_duration_by_module.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 2.3 Grouped Bar Chart (Coverage vs Target)

```python
fig, ax = plt.subplots(figsize=(12, 6))

x = np.arange(len(df))
width = 0.35

# Current coverage vs target
bars1 = ax.bar(x - width/2, df['coverage_pct'], width,
               label='Current Coverage', color=ULTRA_DEX_COLORS['primary'])
bars2 = ax.bar(x + width/2, [85]*len(df), width,
               label='Target (85%)', color=ULTRA_DEX_COLORS['neutral'], alpha=0.5)

# Add threshold line
ax.axhline(y=85, color=ULTRA_DEX_COLORS['success'], linestyle='--',
           linewidth=2, label='Target Line')

# Color bars below target
for i, bar in enumerate(bars1):
    if df.iloc[i]['coverage_pct'] < 85:
        bar.set_color(ULTRA_DEX_COLORS['warning'])
    else:
        bar.set_color(ULTRA_DEX_COLORS['success'])

ax.set_xlabel('Module', fontsize=12, fontweight='bold')
ax.set_ylabel('Coverage (%)', fontsize=12, fontweight='bold')
ax.set_title('Code Coverage vs Target by Module',
             fontsize=14, fontweight='bold', pad=20)
ax.set_xticks(x)
ax.set_xticklabels(df['module'], rotation=45, ha='right')
ax.legend(loc='upper right')
ax.set_ylim(0, 100)

# Add value labels on bars
for bar in bars1:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height + 1,
            f'{height:.1f}%', ha='center', va='bottom', fontsize=9)

plt.tight_layout()
plt.savefig('coverage_comparison.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 2.4 Line Chart with Confidence Interval

```python
# Generate trend data
np.random.seed(42)
days = pd.date_range('2026-04-01', periods=10, freq='D')
pass_rates = [94.2, 95.1, 96.3, 97.0, 98.2, 98.9, 99.4, 99.8, 99.9, 100.0]
upper = [min(100, p + 2) for p in pass_rates]
lower = [max(90, p - 2) for p in pass_rates]

fig, ax = plt.subplots(figsize=(12, 6))

# Plot line
ax.plot(days, pass_rates, color=ULTRA_DEX_COLORS['success'],
        linewidth=3, marker='o', markersize=8, label='Pass Rate')

# Confidence interval
ax.fill_between(days, lower, upper, alpha=0.2,
                color=ULTRA_DEX_COLORS['success'],
                label='95% Confidence Interval')

# Target line
ax.axhline(y=99, color=ULTRA_DEX_COLORS['primary'], linestyle='--',
           linewidth=2, label='Quality Gate (99%)')

# Annotations
ax.annotate('Optimization Sprint', xy=(days[4], pass_rates[4]),
            xytext=(days[2], 91),
            arrowprops=dict(arrowstyle='->', color=ULTRA_DEX_COLORS['text']),
            fontsize=10, fontweight='bold')

ax.annotate('100% Achieved!', xy=(days[-1], pass_rates[-1]),
            xytext=(days[-3], 96),
            arrowprops=dict(arrowstyle='->', color=ULTRA_DEX_COLORS['success']),
            fontsize=10, fontweight='bold', color=ULTRA_DEX_COLORS['success'])

ax.set_xlabel('Date', fontsize=12, fontweight='bold')
ax.set_ylabel('Pass Rate (%)', fontsize=12, fontweight='bold')
ax.set_title('Test Pass Rate Trend\n10-Day Sprint Analysis',
             fontsize=14, fontweight='bold', pad=20)
ax.set_ylim(90, 102)
ax.legend(loc='lower right')
ax.grid(True, alpha=0.3)

ax.xaxis.set_major_formatter(plt.matplotlib.dates.DateFormatter('%m/%d'))
plt.xticks(rotation=45)

plt.tight_layout()
plt.savefig('pass_rate_trend.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 2.5 Histogram with KDE

```python
np.random.seed(42)
# Simulate duration data matching Ultra-Dex statistics
durations = np.concatenate([
    np.random.exponential(50, 400),
    np.random.exponential(200, 80),
    np.random.exponential(1000, 18),
])
durations = np.clip(durations, 2, 9000)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Histogram with KDE
sns.histplot(durations, bins=50, kde=True, ax=ax1,
             color=ULTRA_DEX_COLORS['primary'])
ax1.axvline(np.mean(durations), color=ULTRA_DEX_COLORS['danger'],
            linestyle='--', linewidth=2,
            label=f'Mean: {np.mean(durations):.1f}ms')
ax1.axvline(np.median(durations), color=ULTRA_DEX_COLORS['success'],
            linestyle='--', linewidth=2,
            label=f'Median: {np.median(durations):.1f}ms')
ax1.set_xlabel('Duration (ms)', fontsize=11, fontweight='bold')
ax1.set_ylabel('Frequency', fontsize=11, fontweight='bold')
ax1.set_title('Test Duration Distribution', fontsize=13, fontweight='bold')
ax1.legend()

# Box plot by module
module_data = []
module_labels = []
for module in df['module']:
    base = df[df['module'] == module]['avg_duration_ms'].values[0]
    module_data.append(np.random.lognormal(np.log(base), 0.5, 50))
    module_labels.append(module)

ax2.boxplot(module_data, labels=module_labels, patch_artist=True,
            boxprops=dict(facecolor=ULTRA_DEX_COLORS['primary'], alpha=0.7),
            medianprops=dict(color=ULTRA_DEX_COLORS['danger'], linewidth=2))
ax2.set_xticklabels(module_labels, rotation=45, ha='right')
ax2.set_ylabel('Duration (ms)', fontsize=11, fontweight='bold')
ax2.set_title('Duration Distribution by Module', fontsize=13, fontweight='bold')
ax2.set_yscale('log')

plt.tight_layout()
plt.savefig('duration_distribution.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 2.6 Correlation Heatmap

```python
# Create correlation matrix
corr_data = df[['test_count', 'avg_duration_ms', 'coverage_pct', 'flake_rate']].corr()

fig, ax = plt.subplots(figsize=(8, 6))

# Create heatmap
mask = np.triu(np.ones_like(corr_data, dtype=bool))
sns.heatmap(corr_data, mask=mask, annot=True, fmt='.2f',
            cmap='RdYlBu_r', center=0, vmin=-1, vmax=1,
            square=True, linewidths=0.5, cbar_kws={"shrink": 0.8},
            annot_kws={'size': 12, 'weight': 'bold'})

ax.set_title('Module Metrics Correlation Matrix',
             fontsize=14, fontweight='bold', pad=20)

labels = ['Test Count', 'Avg Duration', 'Coverage %', 'Flake Rate']
ax.set_xticklabels(labels, rotation=45, ha='right')
ax.set_yticklabels(labels, rotation=0)

plt.tight_layout()
plt.savefig('correlation_heatmap.png', dpi=150, bbox_inches='tight')
plt.show()
```

---

## 3. Design Principles

### 3.1 Visual Hierarchy

```
ATTENTION (What matters most)
  - Current status indicators (pass/fail)
  - Critical thresholds (red zones)
  - Trend direction (arrows)

UNDERSTANDING (Context)
  - Historical comparison (previous period)
  - Benchmark lines (targets)
  - Annotations (key events)

DETAIL (For exploration)
  - Raw values (on hover/tooltip)
  - Confidence intervals (uncertainty)
  - Breakdown by category
```

**Implementation:**

- Size: Most important = largest
- Color: Most important = highest contrast
- Position: Most important = top-left (reading pattern)

### 3.2 Color Usage

```python
COLOR_GUIDELINES = {
    'quantitative': {
        'description': 'Sequential color scale for continuous data',
        'usage': ['test counts', 'duration', 'coverage %'],
        'palette': ['#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8', '#1E40AF'],
    },
    'diverging': {
        'description': 'Two-color scale for data with midpoint',
        'usage': ['variance from target', 'improvement/decline'],
        'palette': ['#DC2626', '#FEF3C7', '#059669'],
    },
    'categorical': {
        'description': 'Distinct colors for categories',
        'usage': ['modules', 'providers', 'test types'],
        'palette': ['#2563EB', '#7C3AED', '#059669',
                    '#D97706', '#DC2626', '#0891B2'],
    },
    'semantic': {
        'pass': '#059669',
        'fail': '#DC2626',
        'warning': '#D97706',
        'info': '#2563EB',
        'neutral': '#6B7280',
    }
}
```

### 3.3 Typography

| Hierarchy   | Font Size | Weight  | Usage               |
| ----------- | --------- | ------- | ------------------- |
| Chart Title | 14-16px   | Bold    | Main title only     |
| Subtitle    | 12px      | Regular | Context/description |
| Axis Labels | 11-12px   | Medium  | Axis descriptions   |
| Tick Labels | 9-10px    | Regular | Data values         |
| Legend      | 10px      | Regular | Category labels     |
| Annotations | 10px      | Medium  | Callouts            |

**Font Stack:**

- System fonts: -apple-system, BlinkMacSystemFont, "Segoe UI"
- Web-safe: Roboto, Helvetica, Arial, sans-serif
- Monospace: "SF Mono", Consolas, monospace

### 3.4 Layout Principles

```
WHITESPACE
  - Margins: Minimum 40px around chart
  - Padding: 10-15px within chart area
  - Gap between elements: 20px

ALIGNMENT
  - Left-align text for readability
  - Right-align numbers for comparison
  - Center-align short labels only

PROPORTION
  - Chart should fill 70-80% of figure
  - Legend maximum 15% of width
  - Margins and labels: 10-15%

ASPECT RATIO
  - Line charts: 16:9 or 4:3
  - Bar charts: Golden ratio (1.618:1)
  - Heatmaps: Square or data-driven
  - Avoid extreme ratios (> 3:1 or < 1:3)
```

---

## 4. Accessibility Guidelines

### 4.1 WCAG 2.1 AA Compliance

**Color & Contrast:**

- [x] Color is not the only means of conveying information
- [x] Text contrast ratio >= 4.5:1 against background
- [x] Large text (18px+) contrast ratio >= 3:1
- [x] UI components contrast ratio >= 3:1
- [x] Pattern/texture used in addition to color

**Text Alternatives:**

- [x] All charts have descriptive titles
- [x] Data tables provided as alternatives
- [x] Alt text for exported images
- [x] Values labeled directly (not just on hover)

**Navigation:**

- [x] Keyboard navigable if interactive
- [x] Focus indicators visible
- [x] Skip links for complex visualizations

### 4.2 Color Blindness Safe Palettes

```python
COLORBLIND_PALETTES = {
    'deuteranopia_safe': ['#1f77b4', '#ff7f0e', '#2ca02c',
                          '#d62728', '#9467bd'],
    'protanopia_safe': ['#0072B2', '#E69F00', '#009E73',
                        '#CC79A7', '#56B4E9'],
    'tritanopia_safe': ['#332288', '#88CCEE', '#44AA99',
                        '#117733', '#999933'],
    'monochrome': ['#000000', '#333333', '#666666',
                   '#999999', '#CCCCCC'],
}

PATTERNS = ['/', '\\', '|', '-', '+', 'x', 'o', '.', '*']
```

### 4.3 Screen Reader Support

```html
<figure role="img" aria-labelledby="chart-title chart-desc">
  <figcaption id="chart-title">Test Pass Rate by Module</figcaption>
  <div id="chart-desc" class="sr-only">
    Bar chart showing test pass rates for 8 modules. All modules achieve 100% pass rate.
  </div>

  <table class="sr-only">
    <caption>
      Test Pass Rate Data
    </caption>
    <thead>
      <tr>
        <th>Module</th>
        <th>Pass Rate</th>
        <th>Test Count</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Governance</td>
        <td>100%</td>
        <td>78</td>
      </tr>
      <tr>
        <td>Memory</td>
        <td>100%</td>
        <td>65</td>
      </tr>
    </tbody>
  </table>
</figure>
```

### 4.4 Responsive Design

```python
RESPONSIVE_CONFIG = {
    'mobile': {
        'figsize': (8, 6),
        'fontsize': 9,
        'legend': False,
        'x_rotation': 90,
        'tick_interval': 2,
    },
    'tablet': {
        'figsize': (10, 6),
        'fontsize': 10,
        'legend': 'best',
        'x_rotation': 45,
        'tick_interval': 1,
    },
    'desktop': {
        'figsize': (12, 7),
        'fontsize': 11,
        'legend': 'best',
        'x_rotation': 0,
        'tick_interval': 1,
    },
}
```

### 4.5 Export Guidelines

```python
EXPORT_CONFIGS = {
    'web': {
        'format': 'png',
        'dpi': 150,
        'transparent': False,
        'facecolor': '#FFFFFF',
    },
    'print': {
        'format': 'pdf',
        'dpi': 300,
        'transparent': False,
        'facecolor': '#FFFFFF',
    },
    'presentation': {
        'format': 'png',
        'dpi': 200,
        'transparent': True,
    },
    'accessibility': {
        'format': 'svg',
        'dpi': 150,
        'transparent': False,
        'facecolor': '#FFFFFF',
    }
}
```

---

## 5. Quick Reference

### 5.1 Chart Selection Decision Tree

| I want to show...             | Use this chart                         |
| ----------------------------- | -------------------------------------- |
| Comparison between categories | Bar chart (horizontal for long labels) |
| Change over time              | Line chart                             |
| Part-to-whole relationship    | Stacked bar or treemap                 |
| Distribution of values        | Histogram or box plot                  |
| Correlation between variables | Scatter plot                           |
| Ranking                       | Horizontal bar chart                   |
| Geographic distribution       | Choropleth map                         |
| Hierarchical data             | Treemap or sunburst                    |
| Flow between stages           | Sankey diagram                         |
| Progress toward goal          | Bullet chart                           |
| Multiple metrics summary      | Radar/spider chart                     |

### 5.2 Common Pitfalls

| Pitfall                  | Why It is Bad                | Solution            |
| ------------------------ | ---------------------------- | ------------------- |
| 3D Charts                | Distorts perception          | Use 2D alternatives |
| Pie Charts (many slices) | Hard to compare angles       | Use bar chart       |
| Dual Y-Axes              | Encourages false correlation | Use separate charts |
| Truncated Y-Axis         | Exaggerates differences      | Start at 0          |
| Rainbow Colormaps        | Not perceptually uniform     | Use Viridis, Plasma |
| Overplotting             | Hides data density           | Use transparency    |
| Chart Junk               | Distracts from data          | Remove decorations  |

### 5.3 When to Use Each Color Scale

| Scale Type  | Best For                       | Example              |
| ----------- | ------------------------------ | -------------------- |
| Sequential  | Ordered data from low to high  | Test duration        |
| Diverging   | Data with meaningful midpoint  | Variance from target |
| Qualitative | Categorical data with no order | Module names         |

---

**Document Version:** 3.1.0  
**Next Review:** April 17, 2026  
**Author:** Ultra-Dex Data Engineering Team
