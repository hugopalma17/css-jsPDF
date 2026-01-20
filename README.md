# CSS-jsPDF

**A CSS-to-PDF rendering engine built on jsPDF with ATS-optimized ghost tags**

CSS-jsPDF solves the fundamental problem of converting CSS spacing and typography into pixel-perfect PDF layouts. Unlike traditional approaches that measure DOM elements (device-dependent, unreliable), CSS-jsPDF uses **device-independent formulas** to translate CSS source values directly into PDF coordinates.

---

## What This Solves

Building a resume/CV generator? You've hit the wall where:
-CSS-to-PDF tools don't support ghost tags for ATS parsing
-DOM measurement breaks across devices (mobile vs desktop vs Retina)
-jsPDF has no CSS support - you're stuck with raw coordinates
-You need perfect spacing consistency between preview and PDF

**CSS-jsPDF fixes all of this.**

---

## Key Features

### Device-Independent CSS → PDF Conversion
```javascript
// The breakthrough formulas
PX_TO_MM = 25.4 / 96   // CSS pixels → PDF millimeters
PT_TO_MM = 25.4 / 72   // Points → millimeters

// Apply CSS spacing directly to jsPDF
y += px(theme, 12)     // margin-bottom: 12px in CSS
```

### ATS-Optimized Ghost Tags
Invisible markdown syntax embedded in PDFs for perfect ATS parsing:
```javascript
// Ghost tags (background color = invisible to humans, visible to ATS)
doc.setTextColor(...bg);
doc.text('## ', margin, y);  // Marks section header

// Visible content
doc.setTextColor(...theme.colors.heading);
doc.text('PROFESSIONAL EXPERIENCE', margin, y);
```

### Modular Theme System
Themes are data + rendering functions - extend infinitely:
```javascript
export default {
  name: 'Modern Professional',
  spacing: { h2MarginTop: 12, h2MarginBottom: 6 },
  fonts: { h1: 18, h2: 10, body: 9 },
  colors: { heading: [37, 99, 235], text: [71, 85, 105] },
  prefixes: { bullet: '•' },
}
```

Six themes included:
- **Modern Professional** - Clean, corporate
- **Classic Minimalist** - Traditional serif
- **Compact Executive** - Maximum info density
- **Terminal/Hacker** - Dark mode with code aesthetics
- **Creative Designer** - Purple gradients + vector bullets
- **Creative 2** - Teal variant

### Pixel-Perfect Alignment
Baseline calculations ensure text aligns exactly as designed:
```javascript
// jsPDF draws from baseline, CSS measures from top
baselineOffset(fontSize, lineHeight) {
  const lineBox = fontSize * lineHeight;
  const halfLeading = (lineBox - fontSize) / 2;
  const fontAscent = fontSize * 0.8;  // Inter/Helvetica
  return (halfLeading + fontAscent) * PT_TO_MM;
}
```

---

## Quick Start

### Installation
```bash
# Include jsPDF (peer dependency)
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

# Load CSS-jsPDF core + theme
<script type="module">
  import { generatePDF } from './src/core.js';
  import modernTheme from './src/themes/theme-modern.js';

  // Your resume data
  const data = {
    sections: [
      {
        type: 'header',
        content: {
          name: 'Jane Developer',
          contact: 'jane@example.com | linkedin.com/in/jane'
        }
      },
      {
        type: 'summary',
        title: 'Professional Summary',
        content: {
          text: 'Full-stack engineer with 5 years experience...'
        }
      },
      {
        type: 'experience',
        title: 'Professional Experience',
        content: {
          jobs: [{
            company: 'TechCorp',
            roles: [{
              title: 'Senior Engineer',
              period: '2020 - Present',
              bullets: [
                'Built microservices architecture serving 10M users',
                'Led team of 4 engineers on critical infrastructure'
              ]
            }]
          }]
        }
      }
    ]
  };

  // Generate PDF
  await generatePDF(modernTheme, data);
</script>
```

---

## The Journey

Read the full story in [`docs/CSS-jsPDF_Building_a_CSS_to_PDF_Compiler.md`](docs/CSS-jsPDF_Building_a_CSS_to_PDF_Compiler.md)

**The Breakthrough Moment:**

> "FUCK what the person sees, the user is seeing OUR css, as long as we have defined numbers to our css, not auto, not 100%, but actual numbers, we can use the formula. that way it will generate pdf even on a phone"

**TLDR:** After failed attempts at DOM measurement (device-dependent) and hardcoded conversions (inflexible), the breakthrough was a **hybrid approach**: Use the mathematical formulas (`25.4/96` and `25.4/72`), but apply them to CSS source values (not rendered DOM). Both approaches were correct in isolation—the combination was the solution.

The journey includes:
- The Retina display trap (physical vs logical pixels)
- The browser zoom problem
- Custom font integration (Inter + JetBrains Mono)
- Vector shape drawing (when unicode fails)
- 6 themes, each with unique visual identity

---

## Documentation

### Core Files
- **`src/core.js`** - Main rendering engine (22KB)
- **`src/themes/`** - Example theme implementations
- **`docs/CV_SPACING_IMPLEMENTATION.js`** - Reference implementation with annotated formulas
- **`docs/CSS-jsPDF_Building_a_CSS_to_PDF_Compiler.md`** - Complete development story

### Data Structure
```javascript
{
  sections: [
    {
      type: 'header' | 'summary' | 'section' | 'experience',
      title?: string,  // Section heading
      content: {
        // For header
        name?: string,
        contact?: string,

        // For summary
        text?: string,

        // For section (bullet list)
        bullets?: string[],

        // For experience
        jobs?: [{
          company: string,
          roles: [{
            title: string,
            period: string,
            bullets: string[]
          }]
        }]
      }
    }
  ]
}
```

### Theme API
```javascript
export default {
  name: string,           // Theme display name
  margin: number,         // Page margins (mm)

  spacing: {              // All values in px
    headerBottomMargin: number,
    h1MarginBottom: number,
    h2MarginTop: number,
    // ... etc
  },

  fonts: {                // All values in pt
    h1: number,
    h2: number,
    body: number,
    // ... etc
  },

  lineHeights: {          // Unitless multipliers
    li: number,
    body: number
  },

  colors: {               // RGB arrays [r, g, b]
    bg: [number, number, number],
    name: [number, number, number],
    heading: [number, number, number],
    // ... etc
  },

  prefixes: {             // Text prefixes for themes like Terminal
    h1?: string,
    h2?: string,
    bullet?: string,
    // ... etc
  },

  images?: {              // Optional PNG graphics (Creative themes)
    headerBar: string,    // Path to image
    sectionBar: string,
    headerBarHeight: number,  // mm
    sectionBarWidth: number,  // mm
    // ... etc
  },

  fontFamily: string      // 'Inter' | 'JetBrainsMono'
}
```

---

## Creating Custom Themes

1. Copy an existing theme from `src/themes/`
2. Modify colors, spacing, fonts as needed
3. Add custom prefixes or images
4. Import and use:

```javascript
import myTheme from './my-custom-theme.js';
await generatePDF(myTheme, data);
```

**Pro tip:** Start with `theme-modern.js` for clean layouts, `theme-terminal.js` for dark mode, or `theme-creative.js` for visual flair.

---

## Advanced: Vector Bullets

Creative themes draw custom bullet shapes using jsPDF primitives:

```javascript
// Diamond bullet (4-pointed star)
const cx = margin + 6;
const cy = y - 1;
const size = 0.9;

doc.triangle(cx, cy - size, cx - size*0.3, cy - size*0.3, cx, cy, 'F');
doc.triangle(cx + size, cy, cx + size*0.3, cy - size*0.3, cx, cy, 'F');
// ... 2 more triangles for bottom half
```

See `theme-creative.js` for the complete implementation.

---

## Testing with Different Devices

The beauty of device-independent formulas: **PDFs look identical everywhere.**

Test on:
- Desktop (96 DPI)
- Retina displays (2x, 3x pixel density)
- Mobile devices (variable DPI)
- Print preview

Spacing will be pixel-perfect across all devices.

---

## Contributing

This project is the culmination of solving a real problem through first principles. Contributions that maintain the **device-independent** philosophy are welcome:

- ✓New themes
- ✓Enhanced ghost tag support
- ✓Better font loading
- ✓Improved page break logic
-DOM measurement (breaks the core principle)
-CSS parsing (reinventing the wheel)

---

## License

MIT License - See LICENSE file for details

CSS-jsPDF is built on top of [jsPDF](https://github.com/parallax/jsPDF), which is also MIT licensed. We comply with jsPDF's license by:
- Listing jsPDF as a peer dependency
- Maintaining clear attribution
- Not redistributing jsPDF code (users install it separately)

---

## Acknowledgments

Built during the development of a privacy-first resume builder where all PDF generation happens client-side. The theme toggle integration that destroys and re-renders charts taught us the importance of **true device independence**.

**Special thanks to:**
- The [jsPDF maintainers](https://github.com/parallax/jsPDF) (MIT License) for providing the foundational PDF library that made this possible
- The CSS and PDF specification authors for defining the device-independent standards we rely on

---

## Related Projects

- [jsPDF](https://github.com/parallax/jsPDF) - The underlying PDF library
- [Inter Font](https://rsms.me/inter/) - Beautiful UI font used in modern themes
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) - Code-style font for Terminal theme

---

**Built with first principles thinking**

Questions? Found a bug? Open an issue!
