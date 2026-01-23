# VS Code Terminal Setup - Visual Step-by-Step Guide

> **Follow these exact steps tomorrow morning**

---

## 🎯 **STEP 1: Open VS Code with Your Project**

```bash
# In macOS Terminal or iTerm:
cd /Applications/Rest-iN-U-1
code .
```

This opens VS Code with your REST-iN-U project.

---

## 🎯 **STEP 2: Open First Terminal**

**Method 1**: Press `` Ctrl+` `` (Control + backtick key)

**Method 2**: Menu → Terminal → New Terminal

**Method 3**: Press `Cmd+J` to toggle terminal panel

**What you'll see**:
```
┌────────────────────────────────────┐
│  Your code files                   │
│                                    │
│                                    │
├────────────────────────────────────┤
│  bash                          ✕   │  ← Terminal tab
│  /Applications/Rest-iN-U-1         │
│  $                                 │  ← Cursor waiting
│                                    │
└────────────────────────────────────┘
```

---

## 🎯 **STEP 3: Split Into 3 Terminals**

**Find the Split Icon**: Look at top-right of terminal panel:
```
[bash ▼]  [⊞]  [🗑]  [▲] [▼] [✕]
           ↑
      Click this!
```

**Or use keyboard**: While in terminal, press `Cmd+\`

**Do this 2 times** to create 3 terminals total:

**After 1st split**:
```
├─────────────────────────────────────┤
│  bash        │  bash             ✕  │
│  Terminal 1  │  Terminal 2          │
│  $           │  $                   │
└──────────────┴──────────────────────┘
```

**After 2nd split**:
```
├──────────────────────────────────────────────┤
│  bash     │  bash      │  bash            ✕  │
│  Term 1   │  Term 2    │  Term 3             │
│  $        │  $         │  $                  │
└───────────┴────────────┴───────────────────┘
```

---

## 🎯 **STEP 4: Set Up Each Terminal**

### **Terminal 1 (Left): Ollama Server**

**Click on Terminal 1**, type:
```bash
ollama serve
```

Press Enter. You'll see:
```
Listening on 127.0.0.1:11434 (version 0.1.48)
```

**✅ KEEP THIS RUNNING - Don't close!**

---

### **Terminal 2 (Middle): Dev Servers**

**Click on Terminal 2**, type:
```bash
npm run dev
```

Press Enter. You'll see:
```
> concurrently "npm run dev:frontend" "npm run dev:backend"

[0] Starting frontend on http://localhost:3000
[1] Starting backend on http://localhost:3001

✓ Compiled successfully
```

**✅ KEEP THIS RUNNING - Don't close!**

---

### **Terminal 3 (Right): Your Commands**

**Click on Terminal 3**, type:
```bash
git status
```

Press Enter. You'll see your git status.

**✅ Use this terminal for**:
- `git add .`
- `git commit -m "..."`
- `npm install ...`
- `opencode run "..."`
- `npm test`

---

## 🎯 **STEP 5: Name Your Terminals (Optional)**

**Right-click on "bash" tab** → Select "Rename"

Name them:
- Terminal 1: "Ollama"
- Terminal 2: "Dev Servers"  
- Terminal 3: "Commands"

**Result**:
```
├──────────────────────────────────────────────┤
│  Ollama   │  Dev Servers │  Commands      ✕  │
│  serve    │  npm run dev │  $                │
│  running  │  running     │                   │
└───────────┴──────────────┴───────────────────┘
```

---

## 🎯 **STEP 6: Open Cline Sidebar**

**Click the Cline icon** in left sidebar (looks like a chat bubble)

**Or**: View → Command Palette (`Cmd+Shift+P`) → "Cline: Focus on Cline View"

**Your final layout**:
```
┌────────────────────────────────────────────────┐
│ File  Edit  View  Terminal               Cline│
├──────┬─────────────────────────────────────┬───┤
│📁    │  Code Editor                        │💬 │
│Rest  │  (Your files open here)             │   │
│├agents│                                     │Cline│
│├docs │  FREE_SETUP_GUIDE.md               │Chat│
│├front│                                     │   │
│└back │                                     │   │
├──────┴─────────────────────────────────────┴───┤
│ Ollama     │ Dev Servers  │ Commands        ✕ │
│ ollama     │ npm run dev  │ $ git status      │
│ serve      │              │                   │
│ running... │ running...   │                   │
└───────────┴──────────────┴───────────────────┘
```

---

## ✅ **VERIFICATION CHECKLIST**

Check that you have:
- [ ] **3 terminals** visible at bottom
- [ ] **Terminal 1** running `ollama serve` (shows "Listening...")
- [ ] **Terminal 2** running `npm run dev` (shows URLs)
- [ ] **Terminal 3** ready for commands (shows `$`)
- [ ] **Cline** sidebar open on right
- [ ] **Project files** visible in explorer on left

---

## 🚀 **YOU'RE READY! Now What?**

**In Cline chat, type**:
```
Read .claude/agents/FREE_SETUP_GUIDE.md and let me know the 3 steps to configure you for Ollama
```

Then:
```
Read docs/Final Plan/HYBRID-FINAL.md Phase 1. 
Act as @C1-CTO and approve the architecture for ESTATE mode.
```

**Then start building!** 🎉

---

## 🔧 **Troubleshooting**

**If Ollama shows error**:
```bash
# Try this in Terminal 1:
pkill ollama
ollama serve
```

**If dev servers won't start**:
```bash
# In Terminal 2:
pkill node
npm run dev
```

**If terminals are too small**:
- Drag the divider line up to make terminal panel bigger
- Or drag vertical dividers between terminals

**To close a terminal**:
- Click the `✕` on its tab
- Or type `exit` and press Enter

---

## 📊 **Quick Reference Card**

| Action | Shortcut |
|--------|----------|
| Open/Close Terminal | `` Ctrl+` `` |
| New Terminal | `` Ctrl+Shift+` `` |
| Split Terminal | `Cmd+\` |
| Switch Terminal | `Cmd+1/2/3` |
| Clear Terminal | `Cmd+K` |
| Kill Process | `Ctrl+C` |

---

**Save this file! Reference it every morning when you start work!** 📌
