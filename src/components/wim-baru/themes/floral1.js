/**
 * Theme config: Floral Elegance 1
 * Sage-green floral wedding invitation theme.
 */
const floral1Theme = {
  name: 'floral1',
  rootClass: 'wim-template-floral1',
  cssFile: '@/app/wim/floral1.css',
  bg: '#fdfbfb',

  ornaments: {
    cover: {
      top: null,
      bottom: 'floral-bottom-cover',
      clouds: ['cloud-1', 'cloud-2', 'cloud-3'],
    },
    hero: {
      bottom: 'floral-bottom-hero',
      clouds: ['cloud-1', 'cloud-2', 'cloud-3'],
    },
    profiles: {
      top: 'floral-top-profiles',
      bottom: 'floral-bottom-profiles',
      clouds: ['cloud-1', 'cloud-2'],
    },
    quote: {
      decorations: ['floral-corner floral-pattern-1 floral-middle-right', 'floral-corner floral-pattern-1 floral-bottom-left-large'],
    },
    events: {
      top: 'floral-top-profiles',
      bottom: 'floral-bottom-profiles',
      clouds: ['cloud-1'],
      cardDecorations: ['card-floral card-floral-tl', 'card-floral card-floral-mr', 'card-floral card-floral-bl'],
    },
    guestbook: {
      clouds: ['cloud-1', 'cloud-2', 'cloud-3'],
    },
  },

  cover: {
    style: 'monogram', // monogram | frame | photo
  },

  profiles: {
    avatarStyle: 'circle', // circle | frame
    ampersand: 'text',     // text | divider
  },

  events: {
    cardStyle: 'pill', // pill | card
  },

  countdown: {
    style: 'default', // default | dark
  },
};

export default floral1Theme;
