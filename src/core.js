/**
 * jsPDF++ - CSS-to-PDF rendering engine with ATS optimization
 * Built on top of jsPDF (MIT License) - https://github.com/parallax/jsPDF
 *
 * @license MIT
 * @requires jsPDF ^2.5.1 (peer dependency)
 *
 * Features:
 * - Device-independent CSS → PDF conversion using standard formulas
 * - Ghost tags for ATS parsing (invisible markdown in background color)
 * - Theme-based rendering with modular design
 * - Terminal prefixes, PNG images, vector bullets
 * - Compact theme section boxes with borders
 * - Creative theme gradient bars
 *
 * This library does not redistribute jsPDF - users must install it separately.
 */

// CSS-to-PDF conversion constants
export const PT_TO_MM = 25.4 / 72;
export const PX_TO_MM = 25.4 / 96;

// Helper functions
export function px(theme, value) {
  return value * PX_TO_MM;
}

export function pt(theme, value) {
  return value * PT_TO_MM;
}

export function lineHeight(theme, fontSize, lh) {
  return fontSize * lh * PT_TO_MM;
}

// Font loading helper
async function loadFontAsBase64(fontPath) {
  const response = await fetch(fontPath);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// PNG image loading helper
async function loadImageAsBase64(imagePath) {
  try {
    const response = await fetch(imagePath);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:image/png;base64,${btoa(binary)}`;
  } catch (error) {
    console.error(`Failed to load image ${imagePath}:`, error);
    return null;
  }
}

// Font family mapping for themes (based on theme.name)
const themeFonts = {
  'Modern Professional': 'Inter',
  'Classic Minimalist': 'Inter',
  'Compact Executive': 'JetBrainsMono',
  'Terminal/Hacker': 'JetBrainsMono',
  'Creative Designer': 'Inter',
  'Creative Designer 2': 'Inter',
};

/**
 * Helper: Parse inline **bold** text
 */
function parseInlineBold(text) {
  const segments = [];
  let current = '';
  let inBold = false;
  let i = 0;

  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] === '*') {
      if (current) {
        segments.push({ text: current, bold: inBold });
        current = '';
      }
      inBold = !inBold;
      i += 2;
    } else {
      current += text[i];
      i++;
    }
  }

  if (current) {
    segments.push({ text: current, bold: inBold });
  }

  return segments;
}

/**
 * Helper: Render inline bold text with wrapping
 */
function renderInlineBold(doc, text, x, y, theme, maxWidth, pageWidth, margin, fontFamily) {
  const segments = parseInlineBold(text);
  let currentX = x;
  let currentY = y;
  const rightEdge = pageWidth - margin;

  segments.forEach(segment => {
    // Split segment into words to handle wrapping
    const words = segment.text.split(' ');

    words.forEach((word, idx) => {
      const textToRender = idx < words.length - 1 ? word + ' ' : word;
      const font = segment.bold ? 'bold' : 'normal';
      doc.setFont(fontFamily, font);

      const textWidth = doc.getTextWidth(textToRender);

      // Check if word fits on current line
      if (currentX + textWidth > rightEdge && currentX > x) {
        // Wrap to next line
        currentY += lineHeight(theme, theme.fonts.li, theme.lineHeights.li);
        currentX = x;
      }

      // Render bold markers and text
      if (segment.bold && idx === 0) {
        doc.setTextColor(...theme.colors.bg);
        doc.text('**', currentX, currentY);
      }

      doc.setTextColor(...theme.colors.text);
      doc.text(textToRender, currentX, currentY);
      currentX += textWidth;

      if (segment.bold && idx === words.length - 1) {
        doc.setTextColor(...theme.colors.bg);
        doc.text('**', currentX, currentY);
      }
    });
  });

  return currentY; // Return final Y position
}

/**
 * Helper: Draw full-width grey bar with left border for Compact theme section headers
 */
function drawCompactSectionBox(doc, text, x, y, theme, fontFamily, pageWidth, margin) {
  if (theme.name === 'Compact Executive') {
    const fontSize = pt(theme, theme.fonts.h2);
    const textHeight = fontSize * 0.7; // Cap height
    const padding = 1; // Vertical padding

    // Full-width grey background bar
    const barY = y - textHeight - padding;
    const barHeight = textHeight + padding * 2;

    doc.setFillColor(230, 231, 235); // #E6E7EB grey background
    doc.rect(margin, barY, pageWidth - 2 * margin, barHeight, 'F');

    // Thin black left border
    doc.setDrawColor(0, 0, 0); // Black
    doc.setLineWidth(0.5); // Thin border
    doc.line(margin, barY, margin, barY + barHeight);
  }
}

/**
 * Main PDF generation function
 * @param {Object} theme - Theme object with rendering rules
 * @param {Object} formData - Form data with sections array
 */
export async function generatePDF(theme, formData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Load custom fonts
  try {
    const interRegular = await loadFontAsBase64('/static/fonts/Inter-Regular.ttf');
    const interMedium = await loadFontAsBase64('/static/fonts/Inter-Medium.ttf');
    const jetbrainsMono = await loadFontAsBase64('/static/fonts/JetBrainsMono-Regular.ttf');

    doc.addFileToVFS('Inter-Regular.ttf', interRegular);
    doc.addFileToVFS('Inter-Medium.ttf', interMedium);
    doc.addFileToVFS('JetBrainsMono-Regular.ttf', jetbrainsMono);

    doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
    doc.addFont('Inter-Medium.ttf', 'Inter', 'bold');
    doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono', 'normal');
    doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono', 'bold');
  } catch (error) {
    console.error('Failed to load fonts, falling back to Helvetica:', error);
  }

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = theme.margin;
  const fontFamily = themeFonts[theme.name] || 'Inter';
  let y = margin;

  // APPLY PAGE BACKGROUND (for terminal theme)
  const bg = theme.colors.bg;
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // LOAD PNG IMAGES (for creative themes)
  let headerBarImage = null;
  let sectionBarImage = null;
  if (theme.images) {
    headerBarImage = await loadImageAsBase64(theme.images.headerBar);
    sectionBarImage = await loadImageAsBase64(theme.images.sectionBar);
  }

  // Helper: Add new page with background
  function addNewPage() {
    doc.addPage();
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    y = margin;
  }

  // Helper: Check if we need a new page
  function checkPageOverflow(requiredSpace) {
    if (y + requiredSpace > pageHeight - margin) {
      addNewPage();
      return true;
    }
    return false;
  }

  // === RENDER SECTIONS IN ORDER ===
  formData.sections.forEach(section => {
    if (section.type === 'header') {
      // === HEADER SECTION ===
      doc.setFontSize(theme.fonts.h1);
      doc.setFont(fontFamily, 'bold');

      // Ghost markdown
      doc.setTextColor(...bg);
      doc.text('# ', margin, y);

      let nameX = margin;

      // Terminal prefix: "$ whoami > "
      if (theme.prefixes.h1) {
        const prefixColor = theme.colors.prefixGreen || theme.colors.heading;
        doc.setFontSize(10); // Smaller for prefix
        doc.setTextColor(...prefixColor);
        doc.text(theme.prefixes.h1, nameX, y);
        const prefixWidth = doc.getTextWidth(theme.prefixes.h1);
        nameX += prefixWidth;
        doc.setFontSize(theme.fonts.h1); // Back to h1 size
      }

      // Name (centered and uppercase for Classic theme)
      doc.setTextColor(...theme.colors.name);
      if (theme.name === 'Classic Minimalist') {
        const nameText = section.content.name.toUpperCase();
        const nameWidth = doc.getTextWidth(nameText);
        const centerX = (pageWidth - nameWidth) / 2;
        doc.text(nameText, centerX, y);
      } else {
        doc.text(section.content.name, nameX, y);
      }

      y += pt(theme, theme.fonts.h1);
      y += px(theme, theme.spacing.h1MarginBottom);

      // Contact info
      if (section.content.contact) {
        doc.setFontSize(theme.fonts.subHeader);
        doc.setFont(fontFamily, 'normal');

        // Ghost markdown
        doc.setTextColor(...bg);
        doc.text('**Contact:** ', margin, y);

        let contactX = margin;

        // Terminal prefix: "# "
        if (theme.prefixes.subHeader) {
          const prefixColor = theme.colors.prefixGreen || theme.colors.heading;
          doc.setTextColor(...prefixColor);
          doc.text(theme.prefixes.subHeader, contactX, y);
          const prefixWidth = doc.getTextWidth(theme.prefixes.subHeader);
          contactX += prefixWidth;
        }

        // Contact text
        doc.setTextColor(...theme.colors.role);
        doc.text(section.content.contact, contactX, y);

        y += pt(theme, theme.fonts.subHeader);

        // Creative theme header bar PNG (placed after contact)
        if (headerBarImage && theme.images) {
          const barWidth = pageWidth - 2 * margin;
          const barHeight = theme.images.headerBarHeight;
          doc.addImage(headerBarImage, 'PNG', margin, y, barWidth, barHeight);
          y += barHeight + 2; // Add spacing after bar
        }

        y += px(theme, theme.spacing.subHeaderMarginBottom);
      }

      // Classic theme: Add horizontal line separator after header
      if (theme.name === 'Classic Minimalist') {
        doc.setDrawColor(0, 0, 0); // Pure black for visibility
        doc.setLineWidth(1.5); // Thicker line
        doc.line(margin, y, pageWidth - margin, y);
        y += 4; // Spacing after line
      }

      // Compact theme: Add thin black horizontal line after header
      if (theme.name === 'Compact Executive') {
        doc.setDrawColor(0, 0, 0); // Pure black
        doc.setLineWidth(0.5); // Match section border thickness
        doc.line(margin, y, pageWidth - margin, y);
        y += 6; // Padding before summary
      }

    } else if (section.type === 'summary') {
      // === SUMMARY SECTION ===
      checkPageOverflow(30);

      doc.setFontSize(theme.fonts.body);
      doc.setFont(fontFamily, 'normal');
      doc.setTextColor(...theme.colors.text);
      const maxWidth = pageWidth - 2 * margin;
      const summaryLines = doc.splitTextToSize(section.content.text, maxWidth);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * lineHeight(theme, theme.fonts.body, theme.lineHeights.body);
      y += px(theme, theme.spacing.h2MarginTop);

    } else if (section.type === 'section') {
      // === GENERIC SECTION (Skills, etc.) ===
      checkPageOverflow(30);

      y += px(theme, theme.spacing.h2MarginTop);

      // Creative theme section bar PNG
      if (sectionBarImage && theme.images) {
        const barX = margin + theme.images.sectionBarOffset;
        const barWidth = theme.images.sectionBarWidth;
        const barHeight = theme.images.sectionBarHeight;
        const fontSize = pt(theme, theme.fonts.h2);
        const capHeight = fontSize * 0.7;
        const capCenter = y - (capHeight / 2);
        const barY = capCenter - (barHeight / 2);
        doc.addImage(sectionBarImage, 'PNG', barX, barY, barWidth, barHeight);
      }

      doc.setFontSize(theme.fonts.h2);
      doc.setFont(fontFamily, 'bold');

      // Ghost markdown
      doc.setTextColor(...bg);
      doc.text('## ', margin, y);

      let sectionX = margin;

      // Terminal prefix: "[>] "
      if (theme.prefixes.h2) {
        const prefixColor = theme.colors.prefixGreen || theme.colors.heading;
        doc.setTextColor(...prefixColor);
        doc.text(theme.prefixes.h2, sectionX, y);
        const prefixWidth = doc.getTextWidth(theme.prefixes.h2);
        sectionX += prefixWidth;
      }

      // Section title (with grey bar for Compact theme)
      const sectionText = section.title.toUpperCase();
      drawCompactSectionBox(doc, sectionText, sectionX, y, theme, fontFamily, pageWidth, margin);

      // Apply theme-specific styling
      const textX = theme.name === 'Compact Executive' ? sectionX + 2 : sectionX;
      const textColor = theme.name === 'Compact Executive' ? [37, 99, 235] : theme.colors.heading;

      doc.setTextColor(...textColor);
      doc.text(sectionText, textX, y);

      y += pt(theme, theme.fonts.h2);
      y += px(theme, theme.spacing.h2MarginBottom);

      // Render bullets
      section.content.bullets.forEach(bullet => {
        checkPageOverflow(15);

        const maxWidth = pageWidth - 2 * margin - 10;

        // Ghost markdown bullet
        doc.setTextColor(...bg);
        doc.text('- ', margin, y);

        // Theme-specific bullet character
        const bulletChar = theme.prefixes.bullet;
        const bulletColor = theme.colors.bulletColor || theme.colors.prefixGreen || theme.colors.text;

        // Draw bullet as shape for creative themes
        doc.setTextColor(...bulletColor);
        doc.setFillColor(...bulletColor);

        if (theme.name === 'Creative Designer') {
          // Draw 4-pointed curvy diamond (like ✦ character)
          const cx = margin + 6;
          const cy = y - 1;
          const size = 0.9;

          doc.setFillColor(...bulletColor);

          // Create 4 curved petals using triangles
          const topPoints = [
            [cx, cy - size],
            [cx - size*0.3, cy - size*0.3],
            [cx, cy],
            [cx + size*0.3, cy - size*0.3],
          ];

          const rightPoints = [
            [cx + size, cy],
            [cx + size*0.3, cy - size*0.3],
            [cx, cy],
            [cx + size*0.3, cy + size*0.3],
          ];

          const bottomPoints = [
            [cx, cy + size],
            [cx + size*0.3, cy + size*0.3],
            [cx, cy],
            [cx - size*0.3, cy + size*0.3],
          ];

          const leftPoints = [
            [cx - size, cy],
            [cx - size*0.3, cy + size*0.3],
            [cx, cy],
            [cx - size*0.3, cy - size*0.3],
          ];

          // Draw each petal as two triangles
          [topPoints, rightPoints, bottomPoints, leftPoints].forEach(petal => {
            doc.triangle(petal[0][0], petal[0][1], petal[1][0], petal[1][1], petal[2][0], petal[2][1], 'F');
            doc.triangle(petal[0][0], petal[0][1], petal[3][0], petal[3][1], petal[2][0], petal[2][1], 'F');
          });

        } else if (theme.name === 'Creative Designer 2') {
          // Draw filled triangle pointing right
          const x1 = margin + 5;
          const y1 = y - 1.5;
          const x2 = margin + 5;
          const y2 = y - 0.5;
          const x3 = margin + 6.5;
          const y3 = y - 1;
          doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
        } else {
          // Use text bullet character for other themes
          doc.setTextColor(...bulletColor);
          doc.text(bulletChar + ' ', margin + 5, y);
        }

        // Bullet text (plain text rendering - no markdown parsing for form data)
        doc.setFont(fontFamily, 'normal');
        doc.setTextColor(...theme.colors.text);
        const bulletLines = doc.splitTextToSize(bullet, maxWidth);
        doc.text(bulletLines, margin + 10, y);
        y += bulletLines.length * lineHeight(theme, theme.fonts.li, theme.lineHeights.li);

        y += px(theme, theme.spacing.liMarginBottom);
      });

    } else if (section.type === 'experience') {
      // === EXPERIENCE SECTION (Jobs with details) ===
      checkPageOverflow(30);

      y += px(theme, theme.spacing.h2MarginTop);

      // Creative section bar
      if (sectionBarImage && theme.images) {
        const barX = margin + theme.images.sectionBarOffset;
        const barWidth = theme.images.sectionBarWidth;
        const barHeight = theme.images.sectionBarHeight;
        const fontSize = pt(theme, theme.fonts.h2);
        const capHeight = fontSize * 0.7;
        const capCenter = y - (capHeight / 2);
        const barY = capCenter - (barHeight / 2);
        doc.addImage(sectionBarImage, 'PNG', barX, barY, barWidth, barHeight);
      }

      // Ghost tag
      doc.setTextColor(...bg);
      doc.text('## ', margin, y);

      doc.setFontSize(theme.fonts.h2);
      doc.setFont(fontFamily, 'bold');

      let sectionX = margin;

      if (theme.prefixes.h2) {
        const prefixColor = theme.colors.prefixGreen || theme.colors.heading;
        doc.setTextColor(...prefixColor);
        doc.text(theme.prefixes.h2, sectionX, y);
        sectionX += doc.getTextWidth(theme.prefixes.h2);
      }

      const sectionTitle = section.title.toUpperCase();
      drawCompactSectionBox(doc, sectionTitle, sectionX, y, theme, fontFamily, pageWidth, margin);

      const textX = theme.name === 'Compact Executive' ? sectionX + 2 : sectionX;
      const textColor = theme.name === 'Compact Executive' ? [37, 99, 235] : theme.colors.heading;

      doc.setTextColor(...textColor);
      doc.text(sectionTitle, textX, y);

      y += pt(theme, theme.fonts.h2);
      y += px(theme, theme.spacing.h2MarginBottom);

      // Render job blocks (company with multiple roles)
      section.content.jobs.forEach(job => {
        checkPageOverflow(40);

        // Render company name once
        if (job.company) {
          y += px(theme, theme.spacing.h3MarginTop);

          doc.setFontSize(theme.fonts.h3);
          doc.setFont(fontFamily, 'bold');

          doc.setTextColor(...bg);
          doc.text('### ', margin, y);

          let companyX = margin;

          // Terminal prefix: "|-- "
          if (theme.prefixes.h3) {
            const prefixColor = theme.colors.prefixGray || theme.colors.role;
            doc.setTextColor(...prefixColor);
            doc.text(theme.prefixes.h3, companyX, y);
            companyX += doc.getTextWidth(theme.prefixes.h3);
          }

          doc.setTextColor(...theme.colors.text);
          doc.text(job.company, companyX, y);

          y += pt(theme, theme.fonts.h3);
          y += px(theme, theme.spacing.jobHeaderMarginBottom);
        }

        // Render each role within this company
        job.roles.forEach((role, roleIndex) => {
          checkPageOverflow(30);

          // Role title and period on same line
          if (role.title || role.period) {
            doc.setFontSize(theme.fonts.subHeader);
            doc.setFont(fontFamily, 'normal');

            let metaX = margin;

            // Terminal prefix: "// "
            if (theme.prefixes.jobMeta) {
              const prefixColor = theme.colors.prefixGray || theme.colors.role;
              doc.setTextColor(...prefixColor);
              doc.text(theme.prefixes.jobMeta, metaX, y);
              metaX += doc.getTextWidth(theme.prefixes.jobMeta);
            }

            // Role title (left-aligned)
            if (role.title) {
              doc.setTextColor(...theme.colors.role);
              doc.text(role.title, metaX, y);
            }

            // Period (right-aligned on SAME LINE)
            if (role.period) {
              doc.setTextColor(...theme.colors.role);
              doc.text(role.period, pageWidth - margin, y, { align: 'right' });
            }

            y += pt(theme, theme.fonts.subHeader);
            y += px(theme, theme.spacing.jobHeaderMarginBottom);
          }

          // Render role bullets
          role.bullets.forEach(bullet => {
          checkPageOverflow(15);

          const maxWidth = pageWidth - 2 * margin - 10;

          // Ghost markdown bullet
          doc.setTextColor(...bg);
          doc.text('- ', margin, y);

          // Theme-specific bullet
          const bulletChar = theme.prefixes.bullet;
          const bulletColor = theme.colors.bulletColor || theme.colors.prefixGreen || theme.colors.text;

          doc.setTextColor(...bulletColor);
          doc.setFillColor(...bulletColor);

          if (theme.name === 'Creative Designer') {
            // Draw diamond
            const cx = margin + 6;
            const cy = y - 1;
            const size = 0.9;

            doc.setFillColor(...bulletColor);

            const topPoints = [
              [cx, cy - size],
              [cx - size*0.3, cy - size*0.3],
              [cx, cy],
              [cx + size*0.3, cy - size*0.3],
            ];

            const rightPoints = [
              [cx + size, cy],
              [cx + size*0.3, cy - size*0.3],
              [cx, cy],
              [cx + size*0.3, cy + size*0.3],
            ];

            const bottomPoints = [
              [cx, cy + size],
              [cx + size*0.3, cy + size*0.3],
              [cx, cy],
              [cx - size*0.3, cy + size*0.3],
            ];

            const leftPoints = [
              [cx - size, cy],
              [cx - size*0.3, cy + size*0.3],
              [cx, cy],
              [cx - size*0.3, cy - size*0.3],
            ];

            [topPoints, rightPoints, bottomPoints, leftPoints].forEach(petal => {
              doc.triangle(petal[0][0], petal[0][1], petal[1][0], petal[1][1], petal[2][0], petal[2][1], 'F');
              doc.triangle(petal[0][0], petal[0][1], petal[3][0], petal[3][1], petal[2][0], petal[2][1], 'F');
            });

          } else if (theme.name === 'Creative Designer 2') {
            // Draw triangle
            const x1 = margin + 5;
            const y1 = y - 1.5;
            const x2 = margin + 5;
            const y2 = y - 0.5;
            const x3 = margin + 6.5;
            const y3 = y - 1;
            doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
          } else {
            doc.setTextColor(...bulletColor);
            doc.text(bulletChar + ' ', margin + 5, y);
          }

          // Bullet text (plain text rendering - no markdown parsing for form data)
          doc.setFont(fontFamily, 'normal');
          doc.setTextColor(...theme.colors.text);
          const bulletLines = doc.splitTextToSize(bullet, maxWidth);
          doc.text(bulletLines, margin + 10, y);
          y += bulletLines.length * lineHeight(theme, theme.fonts.li, theme.lineHeights.li);

          y += px(theme, theme.spacing.liMarginBottom);
          }); // End role.bullets.forEach

          y += px(theme, theme.spacing.ulMarginBottom);
        }); // End job.roles.forEach

        y += px(theme, theme.spacing.sectionMarginBottom) / 2;
      }); // End section.content.jobs.forEach
    }
  });

  // Save PDF
  doc.save("resume.pdf");
}
