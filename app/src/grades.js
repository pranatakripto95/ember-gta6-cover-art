// Colour grades: each one is a Vice-coast sunset or neon look the cover is
// painted with — sky, wash, sun glow and the lettering gradient it uses.

/** Every grade the editor offers, in the order the buttons show them. */
export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    sky: ['#ff9a3d', '#ff2e88', '#2b1055'],
    wash: 'rgba(255, 46, 136, 0.20)',
    sun: '#ffd76a',
    title: ['#fff3b0', '#ffb347', '#ff2e88'],
    subtitle: '#ffd76a',
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    sky: ['#120a3a', '#7b2ff7', '#ff2e88'],
    wash: 'rgba(0, 229, 192, 0.16)',
    sun: '#00e5c0',
    title: ['#c8fff4', '#00e5c0', '#ff2e88'],
    subtitle: '#ff7ad9',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    sky: ['#ffe29a', '#ff7a18', '#7a2e0e'],
    wash: 'rgba(255, 122, 24, 0.18)',
    sun: '#fff3b0',
    title: ['#ffffff', '#ffd76a', '#ff7a18'],
    subtitle: '#fff3b0',
  },
  {
    id: 'palm',
    name: 'Palm Pink',
    sky: ['#ff6fb5', '#c86bff', '#1b3a6b'],
    wash: 'rgba(200, 107, 255, 0.20)',
    sun: '#ffd76a',
    title: ['#ffe9f6', '#ff6fb5', '#c86bff'],
    subtitle: '#ffd76a',
  },
  {
    id: 'midnight',
    name: 'Midnight Teal',
    sky: ['#0e2a4a', '#123f6b', '#00e5c0'],
    wash: 'rgba(0, 229, 192, 0.14)',
    sun: '#e8fff9',
    title: ['#ffffff', '#9ff5e2', '#00b39a'],
    subtitle: '#9ff5e2',
  },
];

/** Finds a grade by id, falling back to the first one. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}
