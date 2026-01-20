/**
 * Terminal/Hacker Theme
 * Dark background with green terminal prefixes
 */

export default {
  name: 'Terminal/Hacker',

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
  },

  fonts: {
    h1: 16,
    subHeader: 7,
    h2: 9,
    h3: 8.5,
    li: 8.5,
    body: 9,
  },

  lineHeights: {
    li: 1.5,
    body: 1.4,
  },

  colors: {
    bg: [13, 17, 23],           // Dark terminal background
    name: [88, 166, 255],        // Blue
    role: [139, 148, 158],       // Gray
    heading: [126, 231, 135],    // Green
    text: [201, 209, 217],       // Light gray
    prefixGreen: [126, 231, 135], // Green for prefixes
    prefixGray: [139, 148, 158],  // Gray for prefixes
  },

  prefixes: {
    h1: '$ whoami > ',           // Terminal command
    subHeader: '# ',              // Comment
    h2: '[>] ',                   // Section marker
    h3: '|-- ',                   // Tree structure
    jobMeta: '// ',               // Comment
    bullet: '> ',                 // Terminal prompt
  },

  images: null,
};
