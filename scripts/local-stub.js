// Local preview only: emulates google.script.run.
// Server functions are looked up in LocalServer and called asynchronously.
(function () {
  var STORAGE_KEY = 'lantern-crawl-ranking';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  // Same contract as src/server/Code.js, backed by localStorage.
  var LocalServer = {
    submitScore: function (input) {
      var entry = normalizeEntry(input, Date.now());
      var entries = load().concat([entry]);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch (e) {
        // Storage unavailable: the entry is ranked but not kept.
      }
      return rankEntries(entries, entry);
    },
    getRanking: function () {
      return rankEntries(load(), null).top;
    }
  };

  function runner(success, failure) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (fn) { return runner(fn, failure); };
        if (name === 'withFailureHandler') return function (fn) { return runner(success, fn); };
        return function () {
          var args = arguments;
          setTimeout(function () {
            try {
              if (typeof LocalServer[name] !== 'function') throw new Error('LocalServer.' + name + ' is not defined');
              var result = LocalServer[name].apply(null, args);
              if (success) success(result);
            } catch (e) {
              if (failure) failure(e); else console.error(e);
            }
          }, 150);
        };
      }
    });
  }

  window.LocalServer = LocalServer;
  window.google = { script: { run: runner(null, null) } };
})();
