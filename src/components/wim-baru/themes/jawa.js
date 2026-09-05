/**
 * Theme config: Jawa (Javanese Traditional)
 * Brown/gold Javanese cultural wedding invitation theme.
 */
const jawaTheme = {
  name: 'jawa',
  rootClass: 'wim-template-jawa',
  cssFile: '@/app/wim/jawa.css',
  bg: '#2c2c2c',

  ornaments: {
    cover: {
      topBorder: 'jawa-top-border',
      bottomContainer: 'jawa-bottom-container',
      gunungan: true,
      clouds: true,
      wayang: true,
    },
    hero: {
      topBorder: 'jawa-top-border',
      bottomContainer: 'jawa-bottom-container',
      gunungan: true,
      clouds: true,
      wayang: true,
    },
    profiles: {
      topBorder: 'jawa-top-border',
      bottomContainer: 'jawa-bottom-container',
      gunungan: true,
      wayang: true,
    },
    quote: {
      topBorder: 'jawa-top-border',
      bottomContainer: 'jawa-bottom-container',
      wayang: true,
    },
    events: {
      topBorder: 'jawa-top-border',
      bottomContainer: 'jawa-bottom-container',
      wayang: true,
      cardStyle: 'radial', // radial gradient cards
    },
    lovestory: {
      topBorder: 'jawa-top-border',
      bottomContainer: 'jawa-bottom-container',
      wayang: true,
    },
    gift: {
      topBorder: 'jawa-top-border',
      bottomContainer: 'jawa-bottom-container',
      wayang: true,
    },
    guestbook: {
      topBorder: 'jawa-top-border',
      bottomContainer: 'jawa-bottom-container',
      wayang: true,
    },
  },

  cover: {
    style: 'frame', // monogram | frame | photo
    fontFamily: '"Oleo Script", cursive',
  },

  profiles: {
    avatarStyle: 'frame', // circle | frame
    frameAnimation: 'pulseFrame 4s infinite ease-in-out',
    ampersand: 'divider', // text | divider (with clouds)
    fontFamily: '"Oleo Script", cursive',
  },

  events: {
    cardStyle: 'radial', // pill | card | radial
    fontFamily: '"Playfair Display", serif',
  },

  countdown: {
    style: 'dark', // default | dark
  },

  fonts: {
    heading: '"Oleo Script", cursive',
    body: '"Playfair Display", serif',
    detail: '"Inter", sans-serif',
  },
};

export default jawaTheme;
