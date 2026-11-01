/** Public pure domain API; consumers do not import private shape helpers. */
export { cells, canPlace } from './geometry';
export { landing, canTraverse } from './landing';
export { createGame, setPaused, dispatchGame, advanceGame, projectGame } from './engine';
