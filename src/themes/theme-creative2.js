/**
 * Creative Designer 2 Theme
 * Teal accents with PNG gradient bars and custom triangle bullets
 */

export default {
  name: 'Creative Designer 2',

  margin: 15,

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
    sectionMarginBottom: 16,
  },

  fonts: {
    h1: 22,
    subHeader: 8,
    h2: 10,
    h3: 9,
    li: 8.5,
    body: 9,
  },

  lineHeights: {
    li: 1.5,
    body: 1.4,
  },

  colors: {
    bg: [255, 255, 255],
    name: [13, 148, 136],       // Teal
    role: [71, 85, 105],        // Slate
    heading: [13, 148, 136],    // Teal
    text: [51, 65, 85],         // Dark slate
    bulletColor: [13, 148, 136], // Teal for bullet
  },

  prefixes: {
    h1: '',
    subHeader: '',
    h2: '',
    h3: '',
    jobMeta: '',
    bullet: '▶',  // Solid right arrow bullet
  },

  images: {
    headerBar: '/static/images/pdf/creative2-header-bar.png',
    sectionBar: '/static/images/pdf/creative2-section-bar.png',
    headerBarHeight: 1,
    sectionBarWidth: 1.25, // mm
    sectionBarHeight: 3.5, // mm
    sectionBarOffset: -2.5,  // mm left of section title
  },
};
