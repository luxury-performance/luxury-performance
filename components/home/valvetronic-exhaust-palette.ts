export const EXHAUST_ROUTE_COLORS = [
  { number: '01', key: 'entry', color: '#58ace0', label: 'Upright entry' },
  { number: '02A', key: 'outer-reverse-elbow', color: '#66bdad', label: 'Outer U · reverse elbow' },
  { number: '02B', key: 'outer-curve-continuation', color: '#d58bb0', label: 'Outer U · curve continuation' },
  { number: '02C', key: 'outer-curve-start', color: '#8175df', label: 'Outer U · curve start' },
  { number: '02D', key: 'outer-top-elbow', color: '#efb537', label: 'Outer U · top elbow' },
  { number: '03', key: 'top-run', color: '#50bd91', label: 'Top straight' },
  { number: '04', key: 'upper-turn', color: '#b798e7', label: 'Upper inner turn' },
  { number: '05', key: 'first-return', color: '#dbc56f', label: 'First back straight' },
  { number: '06A', key: 'near-first-elbow', color: '#bd9ade', label: 'Near U · first elbow' },
  { number: '06B', key: 'near-straight', color: '#54c5cb', label: 'Near U · straight' },
  { number: '06C', key: 'near-second-elbow', color: '#94c66a', label: 'Near U · second elbow' },
  { number: '07', key: 'middle-run', color: '#e78371', label: 'Middle straight' },
  { number: '08', key: 'lower-turn', color: '#858fe4', label: 'Lower inner turn' },
  { number: '09–10', key: 'back-diagonal-transition', color: '#a6cf6e', label: 'Back-to-diagonal transition' },
  { number: '11', key: 'diagonal', color: '#70b7bd', label: 'Diagonal straight' },
  { number: '12', key: 'rear-bend', color: '#c7a4cc', label: 'Rear elbow' },
  { number: '13', key: 'rear-end', color: '#6e9fda', label: 'Rear straight end' },
  { number: '14', key: 'c-lead', color: '#ed7b56', label: 'C return · entry elbow' },
  { number: '15A', key: 'c-away-first', color: '#e4c650', label: 'C return · away first elbow' },
  { number: '15B', key: 'c-away-second', color: '#70b9d5', label: 'C return · away second elbow' },
  { number: '16', key: 'c-back', color: '#b579d6', label: 'C return · inner connection elbow' },
] as const;

export const EXHAUST_MAIN_PART_COUNT = 17;

// Numbering and legend both follow the pipe from 01 toward 03.
export const EXHAUST_ROUTE_LEGEND = EXHAUST_ROUTE_COLORS;

export const EXHAUST_RETURN_PART_COUNT = EXHAUST_ROUTE_COLORS.length - EXHAUST_MAIN_PART_COUNT;
