// Colour grades: each one is a Vice-coast sunset or neon look the cover is
// painted with — sky, wash, sun glow, the lettering gradient it uses, the
// colour of the sun rays and the horizon glow. Seven grades in all.

/** Every grade the editor offers, in the order the buttons show them. */
export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    sky: ['#ff9a3d', '#ff2e88', '#2b1055'],
    wash: 'rgba(255, 46, 136, 0.20)',
    sun: '#ffd76a',
    rays: 'rgba(255, 215, 106, 0.16)',
    horizon: 'rgba(255, 154, 61, 0.35)',
    title: ['#fff3b0', '#ffb347', '#ff2e88'],
    subtitle: '#ffd76a',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    sky: ['#120a3a', '#7b2ff7', '#ff2e88'],
    wash: 'rgba(0, 229, 192, 0.16)',
    sun: '#00e5c0',
    rays: 'rgba(0, 229, 192, 0.14)',
    horizon: 'rgba(123, 47, 247, 0.40)',
    title: ['#c8fff4', '#00e5c0', '#ff2e88'],
    subtitle: '#ff7ad9',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    sky: ['#ffe29a', '#ff7a18', '#7a2e0e'],
    wash: 'rgba(255, 122, 24, 0.18)',
    sun: '#fff3b0',
    rays: 'rgba(255, 243, 176, 0.18)',
    horizon: 'rgba(255, 226, 154, 0.40)',
    title: ['#ffffff', '#ffd76a', '#ff7a18'],
    subtitle: '#fff3b0',
  },
  {
    id: 'palm',
    name: 'Palm Pink',
    sky: ['#ff6fb5', '#c86bff', '#1b3a6b'],
    wash: 'rgba(200, 107, 255, 0.20)',
    sun: '#ffd76a',
    rays: 'rgba(255, 111, 181, 0.15)',
    horizon: 'rgba(255, 111, 181, 0.35)',
    title: ['#ffe9f6', '#ff6fb5', '#c86bff'],
    subtitle: '#ffd76a',
  },
  {
    id: 'midnight',
    name: 'Midnight Teal',
    sky: ['#0e2a4a', '#123f6b', '#00e5c0'],
    wash: 'rgba(0, 229, 192, 0.14)',
    sun: '#e8fff9',
    rays: 'rgba(232, 255, 249, 0.10)',
    horizon: 'rgba(0, 229, 192, 0.30)',
    title: ['#ffffff', '#9ff5e2', '#00b39a'],
    subtitle: '#9ff5e2',
  },
  {
    id: 'candy',
    name: 'Candy Rush',
    sky: ['#ff5ea8', '#b537f2', '#12083a'],
    wash: 'rgba(255, 94, 168, 0.18)',
    sun: '#7df9ff',
    rays: 'rgba(125, 249, 255, 0.15)',
    horizon: 'rgba(255, 94, 168, 0.38)',
    title: ['#ffffff', '#7df9ff', '#ff5ea8'],
    subtitle: '#7df9ff',
  },
  {
    id: 'dusk',
    name: 'Ember Dusk',
    sky: ['#ff7847', '#8e2a5e', '#160a2e'],
    wash: 'rgba(255, 120, 71, 0.16)',
    sun: '#ffb347',
    rays: 'rgba(255, 179, 71, 0.15)',
    horizon: 'rgba(255, 120, 71, 0.35)',
    title: ['#ffe9c9', '#ff9a3d', '#ff2e88'],
    subtitle: '#ffb347',
  },
];

/** Finds a grade by id, falling back to the first one. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}
