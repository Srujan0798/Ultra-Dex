# Ultra-Dex CLI — Professional Purple Theme

> **"Modern, Clean, and Powerful AI Orchestration."**

---

## 🎨 Theme Colors

The new Ultra-Dex interface uses a sophisticated indigo-to-pink gradient, providing a modern look for high-performance development.

| Element | Color | Hex |
|---------|-------|-----|
| **Primary** | Indigo | `#6366f1` |
| **Secondary** | Purple | `#8b5cf6` |
| **Accent** | Pink | `#d946ef` |
| **Success** | Emerald | `#22c55e` |
| **Warning** | Amber | `#f59e0b` |
| **Error** | Rose | `#ef4444` |
| **Dim** | Slate | `#6b7280` |

---

## ✨ Visual Components

### Brand Gradient
We use a 3-step gradient for main headers and banners:
```javascript
import gradient from 'gradient-string';
const ultraGradient = gradient(['#6366f1', '#8b5cf6', '#d946ef']);
```

### Typography
- **Titles**: Purple Bold
- **Subtitles**: Indigo
- **Code**: Pink
- **Muted**: Slate Gray

---

## 🏗️ UI Architecture

The CLI follows a component-based UI structure defined in `cli/lib/ui/theme.js`.

### 1. Boxes & Containers
Professional bordered boxes for important content.
```javascript
import { box } from './ui/theme.js';
console.log(box("Your message here", "Title"));
```

### 2. Status Indicators
Clean, consistent status icons across all commands.
- `✓` Success (Green)
- `✗` Error (Red)
- `⚠` Warning (Amber)
- `◉` Running (Pink)

### 3. Progressive Loading
Modern spinners and progress bars for long-running agent tasks.
```javascript
import { progressBar } from './ui/theme.js';
console.log(progressBar(50, 100)); // [██████████░░░░░░░░░░] 50%
```

---

## 🛠️ Usage in Commands

To use the theme in new CLI commands, import the theme object:

```javascript
import { theme, status } from '../ui/theme.js';

console.log(theme.title("Deploying Agent..."));
console.log(`${status.running} Working on task...`);
```

---

## 🎬 Final Visual Preview

```
██╗   ██╗██╗  ████████╗██████╗  █████╗       ██████╗ ███████╗██╗  ██╗
██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝ 
██║   ██║██║     ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗ 
╚██████╔╝███████╗██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝
                 (INDIGO → PURPLE → PINK GRADIENT)

╭──────────────────────────────────────────────────────────╮
│                      ULTRA-DEX v3.2                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ✓ Context loaded                                        │
│  ◉ Spawning agents...                                    │
│  [██████████████████░░░░░░░] 65%                         │
│                                                          │
╰──────────────────────────────────────────────────────────╯

  ENTER  Start Task    ESC  Cancel    ?  Help
```

---

*"Precision engineering for the AI era." — Ultra-Dex*
