/**
 * Compact Executive Theme
 * Dense layout with grey section boxes and blue accents
 */

export default {
  name: 'Compact Executive',

  margin: 12,

  spacing: {
    headerBottomMargin: 10,
    h1MarginBottom: 3,
    subHeaderMarginBottom: 10,
    h2MarginTop: 10,
    h2MarginBottom: 5,
    h3MarginTop: 6,
    jobHeaderMarginBottom: 3,
    ulMarginTop: 3,
    ulMarginBottom: 8,
    liMarginBottom: 2,
  },

  fonts: {
    h1: 14,
    subHeader: 7,
    h2: 9,
    h3: 8.5,
    li: 8,
    body: 8,
  },

  lineHeights: {
    li: 1.3,
    body: 1.3,
  },

  colors: {
    bg: [255, 255, 255],
    name: [0, 0, 0],
    role: [100, 100, 100],
    heading: [0, 0, 0],
    text: [0, 0, 0],
    bulletColor: [37, 99, 235], // Blue bullets (same as section titles)
  },

  prefixes: {
    h1: '',
    subHeader: '',
    h2: '',
    h3: '',
    jobMeta: '',
    bullet: '>',  // Arrow bullet (monospace style)
  },

  images: null,
};
