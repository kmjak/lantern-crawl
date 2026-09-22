/**
 * Pure game logic (no DOM). Loaded as a <script> in the browser (exposes `Game`)
 * and via require() in Node tests.
 */
(function (root) {
  var Game = {};

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
  } else {
    root.Game = Game;
  }
})(this);
