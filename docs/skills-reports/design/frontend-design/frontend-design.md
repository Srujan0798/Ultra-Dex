# /frontend-design

Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.

---

## Trigger

Use this skill when building or redesigning:
- Components
- Pages and landing sites
- Dashboards
- Frontend applications
- Styled HTML/CSS/JS or React/Vue/Svelte interfaces

---

## Required Input

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

1. `request` - What to build
2. `purpose` - Why it exists
3. `audience` - Who uses it
4. `aestheticDirection` - One bold direction (required for best quality)
5. `technicalConstraints` - Framework/accessibility/performance constraints
6. `differentiation` - One memorable design element

---

## Design Thinking

**Before coding, understand the context and commit to a BOLD aesthetic direction:**

- **Purpose:** What problem does this interface solve? Who uses it?
- **Tone:** Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints:** Technical requirements (framework, performance, accessibility).
- **Differentiation:** What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL:** Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

---

## Design Mandate

Before writing code:
1. Lock the visual concept and tone.
2. Choose one strong aesthetic and execute consistently.
3. Define the "unforgettable" element.
4. Match implementation complexity to the chosen style.

---

## Frontend Aesthetics Guidelines

Focus on:

### Typography
Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.

### Color & Theme
Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

### Motion
Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.

### Spatial Composition
Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.

### Backgrounds & Visual Details
Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

---

## Execution Standards

- Typography must be distinctive and intentional.
- Palette must be cohesive with dominant/accent contrast.
- Motion must be deliberate and high-impact.
- Layout should show clear composition decisions (not generic templates).
- Atmosphere and depth should come from layered details.
- Accessibility must meet WCAG AA or higher.
- Output must be functional, production-grade code.

**IMPORTANT:** Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

---

## Anti-Patterns

**NEVER use generic AI-generated aesthetics like:**
- Overused font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

**Also avoid:**
- Generic AI look-and-feel
- Overused safe font choices (including Space Grotesk convergence)
- Predictable card-grid-only composition
- Placeholder aesthetics without strong direction
- Motion without purpose

**Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices.**

---

## Expected Output

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

JSON response with:
- `concept`
- `designDirection`
- `implementationSummary`
- `code` (framework-specific implementation)
- `accessibilityChecklist`
- `polishChecklist`
- `nextSteps`
- `confidence`

---

**Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.**
