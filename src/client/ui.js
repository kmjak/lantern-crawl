/**
 * DOM rendering and input handling.
 */
(function () {
  var GLYPHS = { 1: '🐛', 2: '🐀', 3: '🕷️', 4: '👹', 5: '⚔️', 9: '🐉' };

  var state;
  var fatalIndex = null;
  var timer = null;

  var el = {
    board: document.getElementById('board'),
    level: document.getElementById('hud-level'),
    hp: document.getElementById('hud-hp'),
    hpBar: document.getElementById('hud-hp-bar'),
    xp: document.getElementById('hud-xp'),
    time: document.getElementById('hud-time'),
    restart: document.getElementById('restart')
  };

  function numberClass(n) {
    if (n <= 3) return 'n-low';
    if (n <= 7) return 'n-mid';
    if (n <= 12) return 'n-high';
    return 'n-max';
  }

  function xpText(player) {
    var levelXp = state.config.player.levelXp;
    if (player.level >= levelXp.length - 1) return player.xp + ' (MAX)';
    return player.xp + '/' + levelXp[player.level + 1];
  }

  function renderCell(button, cell, index) {
    var classes = ['cell'];
    var text = '';
    var label;
    var showEnemy = cell.kind === 'enemy' && (
      (cell.revealed && !cell.done) || (state.status === 'gameover' && !cell.done) ||
      (cell.done && cell.level === state.config.boss.level)
    );
    if (showEnemy) {
      classes.push('revealed', 'enemy');
      if (index === fatalIndex) classes.push('fatal');
      text = GLYPHS[cell.level] || cell.level;
      label = Game.enemyName(state.config, cell.level) + ' Lv' + cell.level;
    } else if (cell.revealed) {
      classes.push('revealed');
      if (cell.kind === 'enemy') classes.push('slain');
      if (cell.number > 0) {
        classes.push(numberClass(cell.number));
        text = String(cell.number);
      }
      label = cell.number > 0 ? String(cell.number) : '空き';
    } else {
      label = '未探索';
    }
    button.className = classes.join(' ');
    button.textContent = text;
    button.setAttribute('aria-label', label);
  }

  function render() {
    var player = state.player;
    el.level.textContent = player.level;
    el.hp.textContent = player.hp + '/' + player.maxHp;
    el.hpBar.style.width = (100 * player.hp / player.maxHp) + '%';
    el.hpBar.classList.toggle('low', player.hp <= player.maxHp / 3);
    el.xp.textContent = xpText(player);
    el.time.textContent = Game.elapsedSeconds(state, Date.now());
    state.cells.forEach(function (cell, i) {
      renderCell(el.board.children[i], cell, i);
    });
  }

  function onEvents(events) {
    events.forEach(function (e) {
      if (e.type === 'combat' && !e.won) fatalIndex = e.index;
    });
    if (state.status !== 'playing') stopTimer();
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(function () {
      el.time.textContent = Game.elapsedSeconds(state, Date.now());
    }, 1000);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function reveal(index) {
    var wasPlaced = state.placed;
    var events = Game.reveal(state, index, Date.now());
    if (!events.length) return;
    if (!wasPlaced) startTimer();
    onEvents(events);
    render();
  }

  function buildBoard() {
    el.board.innerHTML = '';
    el.board.style.gridTemplateColumns = 'repeat(' + state.cols + ', 1fr)';
    state.cells.forEach(function (_, i) {
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.index = i;
      el.board.appendChild(button);
    });
  }

  function newGame() {
    stopTimer();
    state = Game.create();
    fatalIndex = null;
    buildBoard();
    render();
  }

  el.board.addEventListener('click', function (e) {
    var button = e.target.closest('.cell');
    if (button) reveal(Number(button.dataset.index));
  });
  el.restart.addEventListener('click', newGame);

  newGame();
})();
