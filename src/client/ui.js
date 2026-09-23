/**
 * DOM rendering and input handling.
 */
(function () {
  var GLYPHS = { 1: '🐛', 2: '🐀', 3: '🕷️', 4: '👹', 5: '⚔️', 9: '🐉' };

  var state;
  var fatalIndex = null;
  var timer = null;
  var memoMode = false;

  var el = {
    board: document.getElementById('board'),
    level: document.getElementById('hud-level'),
    hp: document.getElementById('hud-hp'),
    hpBar: document.getElementById('hud-hp-bar'),
    xp: document.getElementById('hud-xp'),
    time: document.getElementById('hud-time'),
    restart: document.getElementById('restart'),
    log: document.getElementById('log'),
    memoToggle: document.getElementById('memo-toggle'),
    result: document.getElementById('result'),
    resultTitle: document.getElementById('result-title'),
    resultText: document.getElementById('result-text'),
    resultScore: document.getElementById('result-score'),
    resultLevel: document.getElementById('result-level'),
    resultTime: document.getElementById('result-time'),
    retry: document.getElementById('retry'),
    closeResult: document.getElementById('close-result'),
    bestiary: document.getElementById('bestiary')
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
    } else if (cell.memo !== null) {
      classes.push('memo');
      text = String(cell.memo);
      label = '未探索（メモ ' + cell.memo + '）';
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

  function enemyLabel(level) {
    return Game.enemyName(state.config, level) + '（Lv' + level + '）';
  }

  function messages(events) {
    var lines = [];
    events.forEach(function (e) {
      if (e.type === 'combat') {
        if (!e.won) lines.push(enemyLabel(e.level) + 'にやられた…');
        else if (e.damage > 0) lines.push(enemyLabel(e.level) + 'を倒した！ ' + e.damage + ' ダメージを受けた');
        else lines.push(enemyLabel(e.level) + 'を倒した！');
      } else if (e.type === 'levelup') {
        lines.push('レベルアップ！ Lv' + e.level + '（最大HP ' + Game.maxHp(state.config, e.level) + '）');
      } else if (e.type === 'potion') {
        lines.push('回復薬を見つけた！ HP +' + e.heal);
      }
    });
    return lines;
  }

  function showResult() {
    var cleared = state.status === 'cleared';
    el.resultTitle.textContent = cleared ? 'クリア！' : 'ゲームオーバー';
    el.resultTitle.className = 'result-title ' + (cleared ? 'clear' : 'gameover');
    el.resultText.textContent = cleared
      ? state.config.boss.name + 'を倒し、洞窟に光が戻った。'
      : 'ランタンの灯が消えた…';
    el.resultScore.textContent = Game.score(state);
    el.resultLevel.textContent = 'Lv' + state.player.level;
    el.resultTime.textContent = Game.elapsedSeconds(state, state.endedAt) + '秒';
    el.result.hidden = false;
    el.retry.focus();
  }

  function onEvents(events) {
    events.forEach(function (e) {
      if (e.type === 'combat' && !e.won) fatalIndex = e.index;
    });
    var lines = messages(events);
    if (lines.length) el.log.textContent = lines.join(' / ');
    if (state.status !== 'playing') {
      stopTimer();
      setTimeout(showResult, 700);
    }
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

  function cycleMemo(index) {
    Game.cycleMemo(state, index);
    render();
  }

  function setMemoMode(on) {
    memoMode = on;
    el.memoToggle.setAttribute('aria-pressed', String(on));
    el.memoToggle.textContent = 'メモ：' + (on ? 'ON' : 'OFF');
  }

  function newGame() {
    stopTimer();
    state = Game.create();
    fatalIndex = null;
    el.result.hidden = true;
    el.log.textContent = '好きなマスを開いて探索を始めよう。';
    setMemoMode(false);
    buildBoard();
    render();
  }

  function renderBestiary() {
    var config = Game.CONFIG;
    var levels = config.enemies.map(function (e) { return e.level; }).concat(config.boss.level);
    levels.forEach(function (level) {
      var li = document.createElement('li');
      li.textContent = GLYPHS[level] + ' Lv' + level + ' ' + Game.enemyName(config, level);
      el.bestiary.appendChild(li);
    });
  }

  el.board.addEventListener('click', function (e) {
    var button = e.target.closest('.cell');
    if (!button) return;
    var index = Number(button.dataset.index);
    if (memoMode) cycleMemo(index);
    else reveal(index);
  });
  el.board.addEventListener('contextmenu', function (e) {
    var button = e.target.closest('.cell');
    if (!button) return;
    e.preventDefault();
    cycleMemo(Number(button.dataset.index));
  });
  el.memoToggle.addEventListener('click', function () { setMemoMode(!memoMode); });
  el.restart.addEventListener('click', newGame);
  el.retry.addEventListener('click', newGame);
  el.closeResult.addEventListener('click', function () { el.result.hidden = true; });

  renderBestiary();
  newGame();
})();
