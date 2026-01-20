/**
 * Modern Professional Theme
 * Complete theme configuration ported from Node.js version
 * Clean, contemporary design with blue accents
 */

export default {
  name: 'Modern Professional',

  // Layout
  margin: 15,

  // Spacing (in pixels, converted by px() helper)
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

  // Typography (font sizes in points)
  fonts: {
    h1: 18,
    subHeader: 7.5,
    h2: 10,
    h3: 9,
    li: 8.5,
    body: 9,
  },

  // Line heights (multipliers)
  lineHeights: {
    li: 1.5,
    body: 1.4,
  },

  // Colors (RGB arrays)
  colors: {
    bg: [255, 255, 255],      // White page
    name: [31, 41, 55],        // Dark gray
    role: [100, 116, 139],     // Slate gray
    heading: [37, 99, 235],    // Blue
    text: [71, 85, 105],       // Medium gray
  },

  // Special characters and prefixes (none for modern theme)
  prefixes: {
    h1: '',
    subHeader: '',
    h2: '',
    h3: '',
    jobMeta: '',
    bullet: '•',  // Standard bullet
  },

  // No images for modern theme
  images: null,
};
