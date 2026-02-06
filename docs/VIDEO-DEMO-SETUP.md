# 🎬 Ultra-Dex Video Demo - Technical Setup Guide

## Prerequisites Checklist

### System Requirements

- [ ] Terminal: iTerm2 or Hyper with custom theme
- [ ] VS Code: With Ultra-Dex extension installed
- [ ] Browser: Chrome with Ultra-Dex dashboard
- [ ] Screen Recorder: OBS Studio or ScreenFlow
- [ ] Microphone: Clear audio, no background noise

### Demo Environment Setup

```bash
# 1. Create clean demo directory
mkdir -p ~/ultra-dex-demo
cd ~/ultra-dex-demo

# 2. Ensure Ultra-Dex is installed globally
npm install -g ultra-dex

# 3. Set up API keys (for AI generation)
export ANTHROPIC_API_KEY=your-key-here
# or
export OPENAI_API_KEY=your-key-here

# 4. Clear any existing projects
rm -rf taskflow-saas demo-*

# 5. Pre-warm caches
npx ultra-dex --help > /dev/null
```

### Terminal Configuration

**Theme Settings:**

```json
// ~/.hyper.js or iTerm2 profile
{
  "fontSize": 14,
  "fontFamily": "JetBrains Mono, Fira Code",
  "cursorColor": "#6366f1",
  "backgroundColor": "#0f0f23",
  "foregroundColor": "#e2e8f0",
  "padding": "20px"
}
```

**Prompt:**

```bash
# Use a clean, minimal prompt
export PS1="\[\033[36m\]demo\[\033[0m\]:\[\033[33m\]\W\[\033[0m\]$ "
```

### VS Code Setup

**Extensions Installed:**

- Ultra-Dex VS Code extension
- One Dark Pro theme (or similar dark theme)
- JetBrains Mono font

**Settings:**

```json
{
  "workbench.colorTheme": "One Dark Pro",
  "editor.fontFamily": "JetBrains Mono",
  "editor.fontSize": 14,
  "terminal.integrated.fontSize": 14
}
```

### Browser Setup

**Chrome:**

- Open localhost:3001 (dashboard)
- Zoom: 110%
- DevTools: Closed
- Clean tab (no extensions visible)

### Recording Setup

**OBS Studio Configuration:**

```
Resolution: 1920x1080
Frame Rate: 30fps
Output Format: MKV (remux to MP4)
Audio: 48kHz, 320kbps
Video: H.264, 6000kbps
```

**Scene Layout:**

- Scene 1: Full terminal
- Scene 2: Split (VS Code + Browser)
- Scene 3: Full browser (dashboard)

---

## Pre-Demo Checklist

### 5 Minutes Before

- [ ] Terminal: Clear screen, check prompt
- [ ] VS Code: Open to empty folder
- [ ] Browser: Dashboard tab ready
- [ ] API keys: Verified working
- [ ] Recording: Test audio level
- [ ] Timer: 5-minute countdown visible

### Demo Scenes Ready

**Scene 1: The Problem** (0:00-0:30)

- Visual: Split screen showing scattered docs
- Script: "You've got a brilliant SaaS idea..."

**Scene 2: Meet Ultra-Dex** (0:30-1:00)

- Command: `npx ultra-dex --help`
- Show: 45 commands available

**Scene 3: Initialize** (1:00-1:30)

- Command: `npx ultra-dex init taskflow --live --stack next15-prisma-clerk`
- Show: Project scaffold generated

**Scene 4: AI Plan** (1:30-2:00)

- Command: `npx ultra-dex generate "Task management SaaS"`
- Show: Streaming AI output

**Scene 5: Agent Swarm** (2:00-2:45)

- Command: `npx ultra-dex swarm "Build authentication"`
- Show: Terminal + Browser dashboard

**Scene 6: Context Sync** (2:45-3:15)

- Command: `npx ultra-dex brain && npx ultra-dex diff`
- Show: Alignment score

**Scene 7: VS Code** (3:15-3:45)

- Show: Extension sidebars
- Click: @backend agent

**Scene 8: Validation** (3:45-4:15)

- Command: `npx ultra-dex validate --scan`
- Show: 15 checks passed

**Scene 9: Deploy** (4:15-4:45)

- Command: `npx ultra-dex build`
- Show: Live app

**Scene 10: Summary** (4:45-5:00)

- Visual: Stats overlay
- CTA: npm install command

---

## Post-Recording

### Editing Checklist

- [ ] Remove all waiting time (jump cuts)
- [ ] Add text overlays for key stats
- [ ] Zoom in on terminal output
- [ ] Add upbeat background music (optional)
- [ ] Export: 1080p, 30fps, H.264

### Upload Checklist

- [ ] Thumbnail: 1280x720, text "Idea → Production 5 min"
- [ ] Title: "Ultra-Dex: From Idea to Production SaaS in 5 Minutes"
- [ ] Description: Include install command, GitHub link
- [ ] Tags: AI, SaaS, CLI, development tools
- [ ] End screen: Subscribe + GitHub link

### Promotion Checklist

- [ ] Tweet with video link
- [ ] Post to Hacker News
- [ ] Share in developer Discord/Slack groups
- [ ] Add to Product Hunt (if applicable)

---

## Troubleshooting

### If AI generation is slow

**Fix:** Use `--provider openai --model gpt-4o-mini` for faster generation

### If commands fail

**Fix:** Pre-run all commands once to warm caches

### If dashboard doesn't load

**Fix:** Ensure port 3001 is free: `lsof -ti:3001 | xargs kill -9`

### If recording is choppy

**Fix:** Lower OBS settings: 720p, 2500kbps

---

## Success Metrics

**Target:**

- Views: 10,000+ in first week
- Likes: 500+
- Comments: 100+
- Conversions: 500+ npm installs

**Track:**

- YouTube analytics
- npm download stats
- GitHub stars increase

---

_Ready to record! 🎬_
