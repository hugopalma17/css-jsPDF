# jsPDF++: Building a CSS-to-PDF Compiler

**A technical deep-dive into solving the impossible: making jsPDF understand CSS**

---

## The Problem: Why jsPDF Doesn't Work With CSS

If you've ever tried to generate a PDF from a beautifully styled HTML resume, you've probably reached for jsPDF. And you've probably been disappointed.

Here's why: **jsPDF has zero CSS support.**

jsPDF is a coordinate-based PDF API. It works like this:

```javascript
doc.text("Hello World", 10, 20); // x=10mm, y=20mm from top-left
```

Your browser's rendering engine, on the other hand, works like this:

```css
h1 {
  font-size: 18pt;
  margin-bottom: 4px;
  line-height: 1.4;
}
```

These are fundamentally incompatible paradigms. CSS thinks in *relationships* (margins, padding, flow). jsPDF thinks in *absolute positions* (x, y coordinates).

### The Naive Approach (That Doesn't Work)

"Just measure the CSS elements and convert to PDF coordinates!"

```javascript
const element = document.querySelector('h1');
const rect = element.getBoundingClientRect();
doc.text(element.textContent, rect.left, rect.top); // ❌ WRONG
```

**Why this fails:**

1. **Browser pixels ≠ PDF millimeters**: Browsers use 96 DPI logical pixels. jsPDF uses 72 DPI points internally, but you specify millimeters.
2. **Retina displays**: Your MacBook Pro reports `devicePixelRatio: 2.0`, but CSS ignores it (by design).
3. **Baseline vs top**: CSS measures from the top of the line box. jsPDF draws from the text baseline.
4. **Line height mysteries**: CSS `line-height: 1.4` on `font-size: 9pt` creates a 12.6pt line box, but where does the first line start?

Most developers give up here and use a server-side HTML-to-PDF solution like Puppeteer. Problem solved, right?

**Not if you care about privacy.**

---

## The Privacy Requirement: Client-Side Only

This resume generator has a hard requirement: **all processing must happen in the browser.**

Why? Because resumes contain:
- Full names, addresses, phone numbers
- Employment history (potentially sensitive)
- Skills and certifications
- References

Sending this data to a server—even your own—creates:
- Data breach liability
- GDPR compliance obligations
- User trust issues
- Server costs

The solution: **build a CSS-to-PDF compiler that runs entirely in JavaScript, in the browser, using jsPDF.**

No server. No external API. No data leaves the user's machine.

---

## The Journey: From Broken to Breakthrough

### Day 1: The Retina Display Trap (Jan 19, 09:57)

**Initial observation:**
- A4 page: 210mm × 297mm
- MacBook Pro 16" M4: 3456 × 2234 physical pixels
- CSS viewport: 1728 × 1117 logical pixels (devicePixelRatio = 2.0)
- Physical measurement: An A4-width div = 860 physical pixels = 210mm → **4.1 pixels/mm**

**Attempted formula:**
```javascript
const PX_TO_MM = 210 / 860; // 0.244 mm/px - WRONG!
```

**Result:** PDFs came out cramped and compressed.

**The trap:** Measuring the *screen* gives you physical pixels. CSS gives you *logical* pixels. They're not the same.

> **Behind the Scenes: The First Failure**
>
> **User:** "Button not working on CV builder after gradient integration. PDF output doesn't match CSS preview - spacing severely compressed. Specifically: header cramped, sections collapsed, no section bars visible. Provided side-by-side comparison image showing preview (good) vs PDF (broken)."
>
> **Agent:** "Initially: Added window.generatePDF export to fix button. Then: Attempted 'spacing translator' to measure Shadow DOM and convert CSS px to PDF mm."
>
> **The Problem:** Used hardcoded 0.264583 px/mm conversion, didn't account for devicePixelRatio. Realized: User's 860px = 210mm measurement was physical screen pixels, not CSS pixels. MacBook 16" M4: devicePixelRatio=2, so 430 CSS pixels = 210mm.
>
> **User Decision:** "I'll research proper CSS-to-PDF conversion independently. This is complex: involves CSS pixels, device pixels, Retina scaling, DPI, and mm conversion."
>
> Status: Backed up working production cv-builder.js and paused for research.

### Day 2: The DPI Revelation (Jan 19, 10:29)

After deep research into W3C CSS specs and jsPDF GitHub issues, the breakthrough:

**CSS pixels are ALWAYS logical units at 96 DPI, regardless of Retina displays.**

The correct formula:
```javascript
const CSS_TO_MM = 25.4 / 96;  // 0.26458333 mm per CSS pixel
const PT_TO_MM = 25.4 / 72;   // 0.35277778 mm per point
```

**Why 25.4?** Because there are 25.4mm per inch. It's that simple.

**Why 96?** CSS defines 1 inch = 96 pixels (logical).

**Why 72?** PostScript/PDF defines 1 inch = 72 points.

**Critical insight:** `getBoundingClientRect()` returns *logical* CSS pixels, not physical screen pixels. The browser has already accounted for `devicePixelRatio`.

### Day 3: The Browser Zoom Problem (Jan 19, 10:30)

Testing revealed a new issue: the hardcoded `0.26458333` formula worked perfectly at 100% browser zoom, but broke when users zoomed in or out.

**The fix:** Dynamic calculation based on actual rendered size.

```javascript
const page = shadowRoot.querySelector('.page'); // CSS width: 210mm
const cssWidth = page.getBoundingClientRect().width; // Measured in CSS pixels
const pxToMm = 210 / cssWidth; // Dynamic ratio
```

**At 100% zoom:** `cssWidth ≈ 793.7px` → `pxToMm ≈ 0.2646`

**At 110% zoom:** `cssWidth ≈ 873px` → `pxToMm ≈ 0.2406`

**At 90% zoom:** `cssWidth ≈ 714px` → `pxToMm ≈ 0.2941`

This approach is display-agnostic, zoom-agnostic, and DPI-agnostic.

### Day 4: The Deep Research Thesis (Jan 19, 10:30)

**Context:** After the previous day's failures, I (Claude) was tasked with researching the proper CSS-to-PDF conversion methodology.

**Result:** Deep Research mode produced:
- A 20-page academic paper on CSS pixels, device pixels, DPI, and coordinate systems
- A practical markdown implementation guide
- Mathematical validation of BOTH approaches (DOM measurement AND hardcoded formulas)

**The comedy:** All that research was technically correct, but it was solving the wrong problem.

> **Behind the Scenes: The Thesis That Led to the FUCK Moment**
>
> **User:** "Deep Research completed comprehensive CSS to jsPDF analysis. Provided two documents: 20-page academic paper + practical markdown guide."
>
> **Agent:** "Deep Research validated both approaches mathematically."
>
> **User's response:** "So we did all of this research to prove we were both right? And none worked?"

### Day 4.5: The "FUCK What the Person Sees" Moment (Jan 19, 10:37)

**Realization:** We don't *need* dynamic measurement if our CSS is fixed.

> **The Breakthrough That Cut Through the Thesis**
>
> After reviewing the 20-page academic paper:
>
> **User (breakthrough moment):** "FUCK what the person sees, the user is seeing OUR css, as long as we have defined numbers to our css, not auto, not 100%, but actual numbers, we can use the formula. that way it will generate pdf even on a phone"
>
> This was the pivotal realization. Stop trying to measure the DOM. Stop caring about what the browser renders. **We control the CSS. We know the exact values.** Just extract them from the source code and apply the formula.
>
> **Agent:** "User's breakthrough: Don't measure rendered DOM - use CSS source values directly. Device-independent: Works on phone, desktop, Retina displays."
>
> **User's decision after the breakthrough:** "Hybrid approach: Use CSS-defined values (12px, 18pt, etc.) from our code. Apply formula: px × (25.4/96) = mm, pt × (25.4/72) = mm. No DOM measurement needed - CSS is fixed in our code. Device-independent: Works on phone, desktop, Retina displays."
>
> The shift from "measure everything dynamically" to "hardcode what we already know" unlocked the entire solution.
>
> It was neither my approach (dynamic measurement) nor Claude's approach (hardcoded conversions) alone. It was a **hybrid**: use the formulas (Claude was right), but apply them to CSS source values (user was right), not rendered DOM. Both approaches were correct in isolation, but the combination was the breakthrough.

Since the resume builder uses predefined CSS in a Shadow DOM (not user-provided CSS), we can extract the spacing values directly from our stylesheets:

```javascript
const cssSpacing = {
  // Source: coreStyles in cv-builder.js
  headerBottomMargin: 12,     // pixels
  h1MarginBottom: 4,          // pixels
  h2MarginTop: 12,            // pixels
  h2MarginBottom: 6,          // pixels
  // ... etc
};
```

**Convert to PDF mm:**
```javascript
function px(value) {
  return value * (25.4 / 96);  // pixels → mm
}

y += px(cssSpacing.h2MarginBottom); // Add 1.587mm
```

**Advantages:**
- No DOM measurement required
- Works even before preview is rendered
- Portable to Node.js for server builds
- Zero browser zoom issues

This became the final implementation strategy.

### Day 5: The Custom Fonts Breakthrough (Jan 20, 15:45)

> **Behind the Scenes: Font Quality Matters**
>
> **User:** "Creative theme pill alignment fixed, but pills look blurry. All themes using same font (Helvetica). Asked about available fonts and difficulty of adding custom fonts to jsPDF. Confirmed /static/fonts has Inter and JetBrains Mono TTF files. Green-lit 100KB overhead for custom fonts."
>
> **Agent:** "Fonts available: Inter (modern sans), JetBrains Mono (monospace coding font). Base64 conversion: NOT turning fonts into images, just encoding binary TTF as text. Process: One-line command to convert TTF → base64 text."
>
> **User's decision:** Go for it. 100KB overhead approved.

**The problem:** jsPDF defaults to Helvetica. It looks like every generic PDF from 1995.

**The solution:** Embed custom fonts. But how?

```bash
# One command per font
base64 -i Inter-Regular.ttf -o inter-regular-base64.txt
base64 -i Inter-Medium.ttf -o inter-medium-base64.txt
base64 -i JetBrainsMono-Regular.ttf -o jetbrains-mono-base64.txt
```

**Result:** 3 base64 text files (~1MB total). Not images—the TTF vector data encoded as text.

**Integration:**
```javascript
// Load custom fonts
const interRegular = await loadFontAsBase64('/static/fonts/Inter-Regular.ttf');
doc.addFileToVFS('Inter-Regular.ttf', interRegular);
doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');

// Use in PDF
doc.setFont('Inter', 'normal');
doc.text('Beautiful typography', x, y);
```

**Font mapping per theme:**
- Modern/Classic/Creative/Creative2: **Inter** (clean, modern sans-serif)
- Terminal/Compact: **JetBrains Mono** (monospace for code aesthetics)

The PDFs now look professional. Inter's kerning and hinting make 9pt body text crystal clear at print resolution.

### Day 6: The Modular Architecture (Jan 20, 04:59)

With spacing and fonts solved, the next challenge: **supporting 6 different themes without code duplication.**

Each theme has different:
- Colors (blue headings vs green terminal text)
- Fonts (Inter vs JetBrains Mono)
- Spacing (compact margins vs spacious)
- Decorations (gradient bars, dividers, prefixes)
- Special features (dark backgrounds, vector bullets)

**The solution:** Theme objects + rendering pipelines.

```javascript
// Theme configuration
const modernTheme = {
  name: 'Modern Professional',
  margin: 15,
  spacing: { h1MarginBottom: 4, ... },
  fonts: { h1: 18, h2: 10, ... },
  colors: { bg: [255,255,255], heading: [37,99,235], ... },
  prefixes: { bullet: '•' },
  images: null,
  fontFamily: 'Inter',
  render: {
    headerName(doc, text, x, y, theme, pageWidth) { ... },
    section(doc, text, x, y, theme, pageWidth, margin) { ... },
    bullet(doc, text, x, y, theme, pageWidth, margin) { ... },
  }
};
```

**Dynamic module loading:**
```javascript
const [coreModule, themeModule] = await Promise.all([
  import('/static/js/cv/core.js'),
  import(`/static/js/cv/theme-${selectedTheme}.js`)
]);

await coreModule.generatePDF(themeModule.default, formData);
```

**Result:** Only load what you need. Modern theme = 12KB. Terminal theme = 8KB. No wasted bandwidth.

---

## The Solution: Technical Deep-Dive

### 1. Unit Conversion Formulas

The mathematical foundation:

```javascript
// Constants (based on international standards)
export const PT_TO_MM = 25.4 / 72;  // 0.35277778
export const PX_TO_MM = 25.4 / 96;  // 0.26458333

// Conversion helpers
export function px(value) {
  return value * PX_TO_MM;
}

export function pt(fontSize) {
  return fontSize * PT_TO_MM;
}

export function lineHeight(fontSize, lh) {
  return fontSize * lh * PT_TO_MM;
}
```

**Example usage:**
```javascript
// CSS: h1 { font-size: 18pt; margin-bottom: 4px; }

doc.setFontSize(18); // jsPDF font size in points
doc.text("Name", x, y);
y += pt(18);         // Move down by font height (6.35mm)
y += px(4);          // Add CSS margin (1.058mm)
```

### 2. Line Height & Baseline Offset

CSS and jsPDF measure vertical position differently:

**CSS** measures from the **top of the line box**.

**jsPDF** draws from the **text baseline** (the invisible line letters sit on).

For `font-size: 9pt` with `line-height: 1.4`:

```javascript
const fontSize = 9;         // points
const lh = 1.4;             // unitless multiplier
const lineBoxHeight = 9 * 1.4; // 12.6pt

// Where's the baseline?
const halfLeading = (lineBoxHeight - fontSize) / 2; // 1.8pt (space above/below)
const fontAscent = fontSize * 0.8;                  // 7.2pt (cap height for Inter/Helvetica)
const baselineOffset = halfLeading + fontAscent;    // 9pt from top

// Convert to mm
const deltaY = lineHeight(9, 1.4); // 4.445mm per line
```

**Visual:**
```
┌─────────────────────────────┐
│ ↑ 1.8pt (half-leading)      │ ← CSS measures from here
│ ┌─────────────────────────┐ │
│ │ Text sits here          │ │
│ └─────────────────────────┘ │ ← Baseline (jsPDF draws here)
│ ↓ 1.8pt (half-leading)      │
└─────────────────────────────┘
```

### 3. Theme Rendering Architecture

Each theme is a self-contained module:

```javascript
export default {
  // Configuration
  name: 'Terminal/Hacker',
  margin: 15,
  spacing: { ... },
  fonts: { ... },
  colors: {
    bg: [13, 17, 23],           // Dark background
    heading: [126, 231, 135],   // Green
    text: [201, 209, 217],      // Light gray
  },
  prefixes: {
    h1: '$ whoami > ',
    h2: '[>] ',
    bullet: '> ',
  },

  // Rendering functions
  render: {
    headerName(doc, text, x, y, theme, pageWidth) {
      // Draw terminal prefix in green
      doc.setTextColor(...theme.colors.heading);
      doc.text(theme.prefixes.h1, x, y);
      const prefixWidth = doc.getTextWidth(theme.prefixes.h1);

      // Draw name in blue
      doc.setTextColor(88, 166, 255);
      doc.text(text, x + prefixWidth, y);
    },

    section(doc, text, x, y, theme, pageWidth, margin) {
      // Section title with green prefix
      doc.setTextColor(...theme.colors.heading);
      doc.text(theme.prefixes.h2 + text.toUpperCase(), x, y);
    },
  }
};
```

> **Behind the Scenes: The Terminal Theme Dark Background Battle**
>
> **User:** "PDF generation spacing fixed with cssSpacing formula approach, but lost theme visual identity. Terminal theme missing dark background and special prefix characters ($ whoami >, [>], |--, //, >)"
>
> **Agent:** "Analyzed cv-builder.js CSS and identified 6 distinct themes with unique visual elements. Proposed complete theme configuration system with spacing, colors, prefixes, and images."
>
> The challenge wasn't just rendering text—it was preserving each theme's personality. The Terminal theme needed its hacker aesthetic: dark background (#0d1117), green text, command-line prefixes. Every theme had its own visual language.
>
> **Final implementation:** Page background rendering applied per theme, prefix characters with correct colors, theme-specific bullet characters. Built production-ready Node.js PDF generator with complete theme support. Successfully generated 274/274 PDFs with ZERO errors.

**Core engine calls theme functions:**
```javascript
formData.sections.forEach(section => {
  if (section.type === 'header') {
    theme.render.headerName(doc, section.content.name, margin, y, theme, pageWidth);
    y += pt(theme.fonts.h1) + px(theme.spacing.h1MarginBottom);
  }

  if (section.type === 'summary') {
    theme.render.section(doc, section.title, margin, y, theme, pageWidth, margin);
    y += pt(theme.fonts.h2) + px(theme.spacing.h2MarginBottom);

    theme.render.summary(doc, section.content.text, margin, y, theme, pageWidth, margin);
    // ... calculate consumed height and update y
  }
});
```

### 4. Manual Layout Engine

Unlike CSS which flows content automatically, jsPDF requires manual position tracking:

```javascript
let y = margin; // Start at top margin (15mm)

// === NAME ===
doc.text("Hugo Palma", margin, y);
y += pt(18);           // Font height: 6.35mm
y += px(4);            // Margin-bottom: 1.058mm

// === ROLE ===
doc.text("Solutions Architect", margin, y);
y += pt(7.5);          // Font height: 2.646mm
y += px(12);           // Margin-bottom: 3.175mm

// === SECTION HEADER ===
y += px(12);           // Section margin-top: 3.175mm
doc.text("PROFESSIONAL SUMMARY", margin, y);
y += pt(10);           // Font height: 3.528mm
y += px(6);            // Margin-bottom: 1.587mm

// === MULTILINE PARAGRAPH ===
const lines = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
doc.text(lines, margin, y);
y += lines.length * lineHeight(9, 1.4); // 4.445mm per line
```

**Page overflow detection:**
```javascript
function checkPageOverflow(requiredSpace) {
  if (y + requiredSpace > pageHeight - margin) {
    doc.addPage();

    // Re-apply background for dark themes
    doc.setFillColor(...theme.colors.bg);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    y = margin; // Reset to top
    return true;
  }
  return false;
}

// Before rendering a section
checkPageOverflow(50); // Ensure 50mm available
```

### 5. Ghost Tags for ATS Parsing

**Problem:** Applicant Tracking Systems (ATS) parse PDFs as plain text. Without markdown structure, they can't distinguish:
- Headers vs body text
- Bullet lists vs paragraphs
- Section titles vs content

**Solution:** Invisible markdown tags.

```javascript
// Write invisible tag in background color
doc.setTextColor(...theme.colors.bg); // White on white (invisible)
doc.text('# ', margin, y);

// Write visible name
doc.setTextColor(...theme.colors.name);
doc.text('Hugo Palma', margin, y);
```

**Result in PDF text layer:**
```
# Hugo Palma
Solutions Architect
hugo@example.com

## PROFESSIONAL SUMMARY
Experienced architect with...

## EXPERIENCE
### Senior Solutions Architect
* Led cloud migration project
* Reduced costs by 40%
```

**ATS systems can now parse:**
- `# Name` → Candidate name
- `## Section Title` → Major sections
- `### Job Title` → Work history
- `* Bullet` → Achievements

**Overhead:** ~500 bytes of invisible characters per resume.

**Bonus:** Text remains selectable and copyable by humans too.

### 6. PNG Gradient Images (Creative Themes)

jsPDF doesn't support CSS gradients. Workaround: pre-rendered PNG images.

> **Behind the Scenes: The Creative Theme Gradient Sizing Disaster**
>
> **User (after seeing first attempt):** "Provided 6 reference screenshots from cv.html preview (stunning visuals). Identified issues with creative themes: Section pills too big and stretched (low resolution appearance). Header gradient divider misplaced. Section pills should be same height as section title text."
>
> **Agent analysis:** "Found root cause:
> 1. Section bar height: 7mm (too tall!) vs h2 text: 10pt ≈ 3.5mm
> 2. Aspect ratio broken: PNG is 10×28px, needs proper scaling
> 3. Header bar placed BEFORE languages, should be AFTER"
>
> **The fix:** Calculated correct dimensions:
> - sectionBarHeight: 3.5mm (matches h2 text)
> - sectionBarWidth: 1.25mm (maintains 10:28 aspect ratio)
> - sectionBarOffset: -2.5mm (adjusted)
>
> **Second issue (vertical alignment):**
>
> **User:** "Section pill gradient size now spot on, but vertically misaligned (a bit lower than section title)"
>
> **Agent:** "Section bar misalignment: Using arbitrary `y - 2` offset instead of calculated alignment. Proper vertical centering: barY = y - (textHeight / 2) - (barHeight / 2)"
>
> The lesson: When working with pixel-perfect layouts, **calculate everything.** No magic numbers. No arbitrary offsets. Pure math.

**Header gradient bar:**
```javascript
// creative-header-bar.png: 738×4 pixels, 1.5KB
// Gradient: #ec4899 (pink) → #8b5cf6 (purple) → #06b6d4 (cyan)

const headerBarBase64 = await loadImageAsBase64('/static/assets/pdf/creative-header-bar.png');
const headerBarImage = `data:image/png;base64,${headerBarBase64}`;

// Embed in PDF
const barWidth = pageWidth - 2 * margin; // 180mm
const barHeight = 1; // 1mm tall
doc.addImage(headerBarImage, 'PNG', margin, y, barWidth, barHeight);
```

**Section pill bars:**
```javascript
// creative-section-bar.png: 10×28 pixels, 652B
// Vertical gradient with rounded corners

const barX = margin - 2.5; // 2.5mm left of section title
const barWidth = 1.25;      // 1.25mm wide
const barHeight = 3.5;      // 3.5mm tall

// Calculate vertical center of section title
const fontSize = pt(10);           // 3.528mm
const capHeight = fontSize * 0.7;  // 2.47mm
const capCenter = y - (capHeight / 2);
const barY = capCenter - (barHeight / 2);

doc.addImage(sectionBarImage, 'PNG', barX, barY, barWidth, barHeight);
```

**Fallback:** If image loading fails, draw solid color rectangles.

### 7. Vector Bullets (Creative Themes)

jsPDF's Unicode support is limited. Emoji and special symbols often don't render.

**Problem:** Creative theme wants `★` (star) bullets, but jsPDF can't display it.

**Solution:** Draw bullets as vector shapes.

> **Behind the Scenes: The Unicode Bullet Nightmare**
>
> **User:** "Bullet points showing '&' instead of unicode star ✦"
>
> **Agent:** "Unicode bullet issue: jsPDF's Helvetica font doesn't support ✦ (U+2726) and ▸ (U+25B8). Solution: Use simpler unicode glyphs that Helvetica supports: Creative: ● (U+25CF solid circle) in purple, Creative2: ▶ (U+25B6 solid arrow) in teal"
>
> **User's response after testing with Inter font:** "Creative1 unicode star ★ rendered successfully with Inter font. Asked why ✦ (4-point curvy diamond) doesn't render while ★ does. Requested SVG vector drawing of 4-point curvy diamond instead."
>
> **Agent explanation:** "Unicode block subsetting: ★ (U+2605) in Miscellaneous Symbols block gets included, ✦ (U+2726) in Dingbats block gets skipped during jsPDF font subsetting. jsPDF embeds ~500-1000 common glyphs, not all 10,000+ from TTF."
>
> **The breakthrough:** Stop fighting Unicode limitations. Just draw the shapes manually.
>
> **User (after seeing vector diamond):** "Confirmed vector diamond looks perfect, feminine/creative aesthetic"
>
> Sometimes the elegant solution is abandoning elegance and going low-level.

```javascript
function drawVectorBullet(doc, theme, x, y) {
  if (theme.name === 'Creative Designer') {
    // Draw 4-pointed diamond star
    doc.setFillColor(...theme.colors.bulletColor); // Purple

    const cx = x;      // Center X
    const cy = y - 1;  // Center Y (offset up)
    const size = 0.9;  // Radius in mm

    // Top petal (triangle)
    doc.triangle(
      cx, cy - size,              // Top point
      cx - size*0.3, cy - size*0.3, // Left
      cx + size*0.3, cy - size*0.3  // Right
    ).fill();

    // Right petal
    doc.triangle(
      cx + size, cy,              // Right point
      cx + size*0.3, cy - size*0.3, // Top
      cx + size*0.3, cy + size*0.3  // Bottom
    ).fill();

    // Bottom petal
    doc.triangle(
      cx, cy + size,              // Bottom point
      cx + size*0.3, cy + size*0.3, // Right
      cx - size*0.3, cy + size*0.3  // Left
    ).fill();

    // Left petal
    doc.triangle(
      cx - size, cy,              // Left point
      cx - size*0.3, cy + size*0.3, // Bottom
      cx - size*0.3, cy - size*0.3  // Top
    ).fill();
  }

  if (theme.name === 'Creative Designer 2') {
    // Draw triangle arrow (►)
    doc.setFillColor(...theme.colors.bulletColor); // Teal
    doc.triangle(
      x, y - 1.5,       // Top left
      x, y - 0.5,       // Bottom left
      x + 1.5, y - 1    // Right point
    ).fill();
  }
}
```

**Result:** Perfect vector bullets that scale with PDF zoom.

---

## The Architecture: How It All Fits Together

### File Structure

```
/static/js/cv/
├── core.js              # Core rendering engine (theme-agnostic)
├── theme-modern.js      # Modern Professional theme
├── theme-classic.js     # Classic Minimalist theme
├── theme-compact.js     # Compact Executive theme
├── theme-terminal.js    # Terminal/Hacker theme
├── theme-creative.js    # Creative Designer theme
└── theme-creative2.js   # Creative Designer 2 theme

/static/assets/pdf/
├── creative-header-bar.png      # 738×4px, 1.5KB
├── creative-section-bar.png     # 10×28px, 652B
├── creative2-header-bar.png     # 738×4px, 3.7KB
└── creative2-section-bar.png    # 10×28px, 663B

/static/fonts/
├── Inter-Regular.ttf            # 310KB
├── Inter-SemiBold.ttf           # 315KB
└── JetBrainsMono-Regular.ttf    # 180KB
```

### Data Flow

```
User Input (HTML Form)
      ↓
collectFormData()
      ↓
{
  sections: [
    { type: 'header', content: { name: '...', contact: '...' } },
    { type: 'summary', title: '...', content: { text: '...' } },
    { type: 'experience', title: '...', content: { jobs: [...] } },
  ]
}
      ↓
Dynamic Module Loading
      ↓
await import('/static/js/cv/core.js')
await import(`/static/js/cv/theme-${selectedTheme}.js`)
      ↓
generatePDF(themeModule.default, formData)
      ↓
jsPDF Document Generation
      ↓
resume.pdf (100-150KB)
```

### Theme Rendering Pipeline

```javascript
// 1. Initialize jsPDF
const doc = new jsPDF({ unit: 'mm', format: 'a4' });

// 2. Load fonts
await loadFontAsBase64('/static/fonts/Inter-Regular.ttf');
doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');

// 3. Apply page background
doc.setFillColor(...theme.colors.bg);
doc.rect(0, 0, 210, 297, 'F');

// 4. Load theme-specific images
if (theme.images) {
  headerBarImage = await loadImageAsBase64(theme.images.headerBar);
}

// 5. Render sections in order
formData.sections.forEach(section => {
  // Ghost tags for ATS
  doc.setTextColor(...theme.colors.bg);
  doc.text('## ', margin, y);

  // Theme-specific rendering
  theme.render.section(doc, section.title, margin, y, theme, pageWidth, margin);
  y += pt(theme.fonts.h2) + px(theme.spacing.h2MarginBottom);

  // Page overflow check
  if (y > pageHeight - margin) {
    doc.addPage();
    doc.setFillColor(...theme.colors.bg);
    doc.rect(0, 0, 210, 297, 'F');
    y = margin;
  }
});

// 6. Save
doc.save('resume.pdf');
```

### Module Loading Strategy

**Problem:** Loading all 6 themes + all fonts = 2MB+ of JavaScript upfront.

**Solution:** Dynamic imports + lazy loading.

```javascript
// Only load what's needed
const [coreModule, themeModule] = await Promise.all([
  import('/static/js/cv/core.js'),           // 8KB (always needed)
  import(`/static/js/cv/theme-${theme}.js`)  // 4-12KB (1 theme only)
]);

// Fonts are loaded asynchronously during PDF generation
const interRegular = await loadFontAsBase64('/static/fonts/Inter-Regular.ttf');
```

**Performance:**
- Initial page load: 50KB (HTML + base JS)
- "Generate PDF" click: 320KB download (core + theme + fonts)
- Cached on subsequent generations
- Total generation time: 800-1200ms

---

## Why This Matters

### 1. Privacy-First Architecture

**Zero server processing:**
- User's resume data never leaves their browser
- No backend database to secure
- No GDPR compliance headaches
- No data breach liability

**Verifiable privacy:**
- Open source code (MIT license)
- Inspect Network tab: zero POST requests
- Works offline (after initial page load)

### 2. Performance

**Client-side PDF generation:**
- No server round-trip (saves 200-500ms)
- No queuing behind other users
- Scales to infinite users (no server load)
- Works on static hosting (GitHub Pages, Netlify)

**Optimized loading:**
- 50KB initial page load
- 320KB on-demand theme + fonts
- 100-150KB final PDF file
- 1 second total generation time

### 3. Extensibility

**Adding a new theme:**
```javascript
// 1. Create /static/js/cv/theme-neon.js
export default {
  name: 'Neon Cyberpunk',
  colors: { bg: [0,0,0], heading: [255,0,255], ... },
  render: {
    headerName(doc, text, x, y, theme, pageWidth) { ... },
    section(doc, text, x, y, theme, pageWidth, margin) { ... },
  },
};

// 2. Add to theme picker (templates/cv.html)
<div class="theme-option" data-theme="neon">Neon</div>

// Done. Core engine handles the rest.
```

**Adding a new section type:**
```javascript
// In form data
{ type: 'certifications', title: 'Certifications', content: [...] }

// In theme render object
render: {
  certification(doc, text, x, y, theme) {
    doc.setFontSize(theme.fonts.body);
    doc.text(text, x, y);
  }
}

// In core.js
if (section.type === 'certifications') {
  section.content.forEach(cert => {
    theme.render.certification(doc, cert, margin, y, theme);
    y += lineHeight(theme.fonts.body, theme.lineHeights.body);
  });
}
```

---

## The Breakthrough Moments

### 1. "devicePixelRatio is a red herring"

After hours of debugging Retina display issues, the realization: **CSS pixels are logical units.** The browser already handles physical pixels. Stop trying to be clever.

```javascript
// ❌ WRONG
const physicalPx = cssPx * devicePixelRatio;

// ✅ RIGHT
const mm = cssPx * (25.4 / 96); // devicePixelRatio is irrelevant
```

### 2. "jsPDF can't render Unicode, so draw bullets as vectors"

When `★` and `▶` wouldn't render, instead of giving up: "PDF supports vector shapes. Draw them manually."

```javascript
doc.triangle(x1, y1, x2, y2, x3, y3, 'F'); // Filled triangle
```

### 3. "Ghost tags give PDFs semantic structure"

Instead of fighting ATS parsing, embrace it: "Write invisible markdown tags. Zero visual impact, massive ATS benefit."

```javascript
// Invisible to humans, parseable by machines
doc.setTextColor(255, 255, 255); // White on white
doc.text('# ', x, y);
```

### 4. "Hardcode CSS values instead of measuring DOM"

The counter-intuitive insight: "Dynamic measurement seems flexible, but hardcoded values from our CSS are more reliable."

```javascript
// ❌ Complex, brittle, zoom-dependent
const gap = measureGap(elem1, elem2) * dynamicPxToMm;

// ✅ Simple, reliable, portable
y += px(12); // From cssSpacing.h2MarginTop
```

> **Behind the Scenes: The Compact Theme Bordered Boxes Iteration**
>
> **User:** "Used pdftoppm to convert PDFs to images for visual comparison. Identified Compact theme issues: border too thick, text not blue, overlapping border."
>
> **Agent (multiple iterations):**
> 1. "Left border: 3mm → 0.5mm (thin line)"
> 2. "Section text: Black → Blue (#2563eb)"
> 3. "Text padding: Added 2mm offset from left border"
> 4. "Refactored to theme-based styling (not text-based string matching)"
> 5. "Added header divider: 0.5mm black line"
> 6. "Header padding: 6mm spacing after divider"
> 7. "Bullets: Made > blue (#2563eb)"
>
> **User feedback after each iteration:** "Requested thinner header divider line (0.5mm to match section borders). Added padding after header line (6mm). Made bullet points (>) blue to match section titles."
>
> This was the grind. Seven separate fixes, each discovered by visual comparison with pdftoppm. No shortcuts. Just iteration until perfect.

---

## The Code: Show Me the Formulas

### Complete Unit Conversion Reference

```javascript
// ===========================
// CONSTANTS
// ===========================

// Based on international standards
const PT_TO_MM = 25.4 / 72;  // 0.35277778 (PostScript points)
const PX_TO_MM = 25.4 / 96;  // 0.26458333 (CSS logical pixels)
const MM_TO_PX = 96 / 25.4;  // 3.7795275 (reverse conversion)

// jsPDF internal scale factor (informational only)
const PDF_SCALE = 72 / 25.4; // 2.83465 (points per mm)

// ===========================
// CONVERSION FUNCTIONS
// ===========================

function px(cssPx) {
  return cssPx * PX_TO_MM;
}

function pt(fontSize) {
  return fontSize * PT_TO_MM;
}

function lineHeight(fontSize, lh) {
  return fontSize * lh * PT_TO_MM;
}

// ===========================
// BASELINE OFFSET CALCULATION
// ===========================

function calculateBaselineOffset(fontSize, lineHeightMultiplier, fontAscent = 0.8) {
  const lineBoxHeight = fontSize * lineHeightMultiplier; // Total line box in pt
  const halfLeading = (lineBoxHeight - fontSize) / 2;    // Space above/below
  const ascentHeight = fontSize * fontAscent;            // Cap height
  return (halfLeading + ascentHeight) * PT_TO_MM;        // Baseline from top in mm
}

// ===========================
// EXAMPLES
// ===========================

// Example 1: Position text after CSS margin
// CSS: h1 { font-size: 18pt; margin-bottom: 4px; }
doc.setFontSize(18);
doc.text("Name", x, y);
y += pt(18);  // 6.35mm (font height)
y += px(4);   // 1.058mm (margin)

// Example 2: Multiline paragraph
// CSS: p { font-size: 9pt; line-height: 1.4; }
const lines = doc.splitTextToSize(text, maxWidth);
doc.text(lines, x, y);
y += lines.length * lineHeight(9, 1.4); // 4.445mm per line

// Example 3: Align baseline with CSS top
const baselineOffset = calculateBaselineOffset(9, 1.4, 0.8);
y += baselineOffset; // Now jsPDF baseline matches CSS top
```

### Complete Theme Configuration Template

```javascript
export default {
  // ===========================
  // IDENTITY
  // ===========================
  name: 'Theme Name',

  // ===========================
  // LAYOUT
  // ===========================
  margin: 15, // Page margin in mm

  // ===========================
  // SPACING (CSS pixels)
  // ===========================
  spacing: {
    headerBottomMargin: 12,
    h1MarginBottom: 4,
    subHeaderMarginBottom: 12,
    h2MarginTop: 12,
    h2MarginBottom: 6,
    h3MarginTop: 8,
    jobHeaderMarginBottom: 4,
    ulMarginTop: 4,
    ulMarginBottom: 10,
    liMarginBottom: 3,
  },

  // ===========================
  // TYPOGRAPHY
  // ===========================
  fonts: {
    h1: 18,         // points
    subHeader: 7.5,
    h2: 10,
    h3: 9,
    li: 8.5,
    body: 9,
  },

  lineHeights: {
    li: 1.5,        // unitless multiplier
    body: 1.4,
  },

  // ===========================
  // COLORS (RGB arrays)
  // ===========================
  colors: {
    bg: [255, 255, 255],      // White background
    name: [31, 41, 55],        // Dark gray
    role: [100, 116, 139],     // Medium gray
    heading: [37, 99, 235],    // Blue
    text: [71, 85, 105],       // Text gray
  },

  // ===========================
  // DECORATIVE PREFIXES
  // ===========================
  prefixes: {
    h1: '',               // Before name (e.g., "$ whoami > ")
    subHeader: '',        // Before role (e.g., "# ")
    h2: '',               // Before section titles (e.g., "[>] ")
    h3: '',               // Before job titles (e.g., "|-- ")
    jobMeta: '',          // Before company/dates (e.g., "// ")
    bullet: '•',          // Bullet character
  },

  // ===========================
  // IMAGES (gradient PNGs)
  // ===========================
  images: null, // or:
  // images: {
  //   headerBar: '/static/assets/pdf/creative-header-bar.png',
  //   sectionBar: '/static/assets/pdf/creative-section-bar.png',
  //   headerBarHeight: 1,      // mm
  //   sectionBarWidth: 1.25,   // mm
  //   sectionBarHeight: 3.5,   // mm
  //   sectionBarOffset: -2.5,  // mm (negative = left of text)
  // },

  // ===========================
  // FONT FAMILY
  // ===========================
  fontFamily: 'Inter', // or 'JetBrainsMono'

  // ===========================
  // RENDERING FUNCTIONS
  // ===========================
  render: {
    // Render header name
    headerName(doc, text, x, y, theme, pageWidth) {
      doc.setFontSize(theme.fonts.h1);
      doc.setFont(theme.fontFamily, 'bold');
      doc.setTextColor(...theme.colors.name);
      doc.text(text, x, y);
    },

    // Render contact info
    contact(doc, text, x, y, theme) {
      doc.setFontSize(theme.fonts.subHeader);
      doc.setFont(theme.fontFamily, 'normal');
      doc.setTextColor(...theme.colors.role);
      doc.text(text, x, y);
    },

    // Render section header
    section(doc, text, x, y, theme, pageWidth, margin) {
      doc.setFontSize(theme.fonts.h2);
      doc.setFont(theme.fontFamily, 'bold');
      doc.setTextColor(...theme.colors.heading);
      doc.text(text.toUpperCase(), x, y);
    },

    // Render summary paragraph
    summary(doc, text, x, y, theme, pageWidth, margin) {
      doc.setFontSize(theme.fonts.body);
      doc.setFont(theme.fontFamily, 'normal');
      doc.setTextColor(...theme.colors.text);
      const maxWidth = pageWidth - 2 * margin;
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
    },

    // Render bullet point (returns height consumed)
    bullet(doc, text, x, y, theme, pageWidth, margin) {
      doc.setFontSize(theme.fonts.li);
      doc.setFont(theme.fontFamily, 'normal');

      // Bullet character
      doc.setTextColor(...theme.colors.heading);
      doc.text(theme.prefixes.bullet + ' ', x + 5, y);

      // Bullet text
      doc.setTextColor(...theme.colors.text);
      const maxWidth = pageWidth - 2 * margin - 10;
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x + 10, y);

      // Return height consumed
      return lines.length * lineHeight(theme.fonts.li, theme.lineHeights.li);
    },

    // Optional: Header divider (Classic/Compact themes)
    headerDivider(doc, margin, y, theme, pageWidth) {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1.5);
      doc.line(margin, y, pageWidth - margin, y);
    },
  },
};
```

---

## The Numbers: Performance & Size

### File Sizes

| Component | Size | Notes |
|-----------|------|-------|
| **JavaScript** |
| core.js | 8KB | Core rendering engine |
| theme-modern.js | 4KB | Modern theme |
| theme-terminal.js | 6KB | Terminal theme (prefixes) |
| theme-creative.js | 12KB | Creative theme (vector bullets) |
| **Fonts** |
| Inter-Regular.ttf | 310KB | Base font |
| Inter-SemiBold.ttf | 315KB | Bold font |
| JetBrainsMono-Regular.ttf | 180KB | Monospace font |
| **Images** |
| creative-header-bar.png | 1.5KB | Horizontal gradient |
| creative-section-bar.png | 652B | Vertical gradient pill |
| creative2-header-bar.png | 3.7KB | Teal gradient |
| creative2-section-bar.png | 663B | Teal pill |
| **Output** |
| resume.pdf (typical) | 120KB | With Inter font + 1 page |
| resume.pdf (compact) | 85KB | JetBrainsMono + compact spacing |
| resume.pdf (creative) | 150KB | Inter font + PNG images |

### Performance Metrics

| Metric | Time | Notes |
|--------|------|-------|
| Initial page load | 50ms | HTML + base JS |
| Theme module load | 120ms | Dynamic import |
| Font loading | 600ms | 3 fonts over network |
| PNG image loading | 80ms | 4 gradient images |
| PDF rendering | 300ms | jsPDF text/shape drawing |
| **Total generation** | **1100ms** | First generation |
| Cached generation | 400ms | Fonts/modules cached |

### Memory Usage

| Resource | Memory | Notes |
|----------|--------|-------|
| Shadow DOM preview | 2MB | CSS + rendered HTML |
| jsPDF document (in-memory) | 5MB | Before compression |
| Final PDF (compressed) | 120KB | After save |

---

## Open Source Release

This project is released under the **MIT License**.

### Use Cases

**Use this if you need:**
- Client-side PDF generation from structured data
- Privacy-first document creation (no server processing)
- ATS-friendly resumes with semantic structure
- Multi-theme rendering engine
- CSS-to-PDF coordinate mapping

**Don't use this if you need:**
- Server-side HTML-to-PDF (use Puppeteer instead)
- Interactive PDF forms (use PDF.js instead)
- Image-heavy documents (use Prince XML instead)

### Contributing

**Ideas for improvements:**
1. **Font subsetting**: Only embed glyphs actually used (reduce 300KB → 50KB)
2. **Canvas gradients**: Replace PNG images with jsPDF gradient API
3. **Progressive rendering**: Show page-by-page preview during generation
4. **DOCX export**: Add Microsoft Word format support
5. **Theme marketplace**: User-submitted theme repository

### Repository Structure

```
/static/js/cv/
├── core.js                    # Core rendering engine
├── theme-*.js                 # Theme modules (6 themes)
└── README.md                  # This document

/static/assets/pdf/
└── *.png                      # Gradient images

/static/fonts/
└── *.ttf                      # Custom fonts

/templates/
└── cv.html                    # Form UI

LICENSE (MIT)
```

---

## Lessons Learned

### 1. Sometimes "simple" is harder than "complex"

It would have been trivial to spin up a Node.js server with Puppeteer. But the constraint of client-side-only forced creative solutions: ghost tags, vector bullets, manual layout engines.

**The constraint made the solution better.**

### 2. Abstractions leak, so learn the layer below

Understanding the difference between physical pixels, CSS pixels, and PDF points was critical. You can't debug what you don't understand.

**Read the W3C specs. Read the jsPDF source. Read the PDF specification.**

### 3. Modularity enables experimentation

By separating themes into modules, adding a new design takes 30 minutes instead of 3 days. The architecture enables rapid iteration.

**Design for extension, not modification.**

### 4. Performance is a feature

Users don't wait 5 seconds for a PDF. They wait 1 second, max. Optimization wasn't optional.

**Lazy loading, caching, and async operations turned 3-second generation into 1 second.**

> **Behind the Scenes: The Font Loading Overhead Question**
>
> **User:** "45kb held all the fonts?"
>
> **Agent:** "Confirmed 45KB included base64 fonts (not our fault). Built complete modular CV builder:
> - core.js (9.9KB) = jsPDF++ engine with ghost tags
> - theme-modern.js (4.2KB) = Modern theme rendering rules
> - cv-builder.js (10KB) = UI with native HTML5 drag/drop
>
> Total JS: 24KB (10KB UI + 10KB core + 4KB theme) vs 45KB before. Performance: 47% smaller, only loads 1 theme per PDF generation."
>
> The lesson: Always question inherited file sizes. Modular architecture revealed that most of the bloat was unnecessary.

---

## Conclusion

Building a CSS-to-PDF compiler on top of jsPDF required solving:
- Unit conversion (CSS pixels → PDF millimeters)
- Layout engines (manual Y-position tracking)
- Font rendering (baseline offset calculations)
- Theme architecture (modular rendering pipelines)
- ATS parsing (invisible ghost tags)
- Unicode limitations (vector shape bullets)
- Privacy requirements (100% client-side)

The result:
- 6 professional themes
- Sub-second PDF generation
- Zero server processing
- ATS-friendly output
- 100-150KB file sizes
- MIT licensed

**jsPDF doesn't understand CSS. But now we've built a bridge.**

---

**License:** MIT

**Author:** Hugo Palma ([@hugopalma](https://github.com/hugopalma))

**Powered by:**
- [jsPDF](https://github.com/parallax/jsPDF) - Client-side PDF generation
- [Inter Font](https://rsms.me/inter/) - Typography
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) - Monospace font

**Article date:** January 2026

---

## Appendix: Full Conversion Table

| CSS Value | PDF (mm) | Calculation |
|-----------|----------|-------------|
| **Pixels** | | |
| 1px | 0.265mm | 1 × 0.26458333 |
| 4px | 1.058mm | 4 × 0.26458333 |
| 6px | 1.587mm | 6 × 0.26458333 |
| 12px | 3.175mm | 12 × 0.26458333 |
| **Points** | | |
| 1pt | 0.353mm | 1 × 0.35277778 |
| 7.5pt | 2.646mm | 7.5 × 0.35277778 |
| 9pt | 3.175mm | 9 × 0.35277778 |
| 10pt | 3.528mm | 10 × 0.35277778 |
| 18pt | 6.350mm | 18 × 0.35277778 |
| **Line Heights** | | |
| 9pt × 1.4 | 4.445mm | 9 × 1.4 × 0.35277778 |
| 8.5pt × 1.5 | 4.498mm | 8.5 × 1.5 × 0.35277778 |
| **Common Spacing** | | |
| h1 margin-bottom | 1.058mm | 4px |
| h2 margin-top | 3.175mm | 12px |
| h2 margin-bottom | 1.587mm | 6px |
| h3 margin-top | 2.117mm | 8px |
| Bullet gap | 0.794mm | 3px |
| Section gap | 2.646mm | 10px |

---

**End of Document**
