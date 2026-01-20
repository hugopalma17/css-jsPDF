/**
 * Creative Designer Theme
 * Purple accents with PNG gradient bars and custom diamond bullets
 */

export default {
  name: 'Creative Designer',

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
    name: [139, 92, 246],       // Purple
    role: [107, 114, 128],      // Gray
    heading: [139, 92, 246],    // Purple
    text: [55, 65, 81],         // Dark gray
    bulletColor: [139, 92, 246], // Purple for bullet
  },

  prefixes: {
    h1: '',
    subHeader: '',
    h2: '',
    h3: '',
    jobMeta: '',
    bullet: '★',  // Star bullet
  },

  images: {
    headerBar: '/static/images/pdf/creative-header-bar.png',
    sectionBar: '/static/images/pdf/creative-section-bar.png',
    headerBarHeight: 1,    // mm
    sectionBarWidth: 1.25, // mm
    sectionBarHeight: 3.5, // mm
    sectionBarOffset: -2.5,  // mm left of section title
  },
};
