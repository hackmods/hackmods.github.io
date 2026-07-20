(function () {
  'use strict';

  var NOTEPAD_KEY = 'comedy-notepad';
  var NOTEPAD_SEED =
    'SET NOTES\n---------\n- Crowd work opener\n- Buffalo Fan Bill callback\n- Kill the puppet bit if room is quiet\n\nDocument the craft. Ship the next set.';
  var zTop = 10050;
  var masterVolume = 0.35;
  var audioCtx = null;
  var saberOsc = null;
  var saberGain = null;
  var duckHuntRaf = null;
  var duckHuntState = null;
  var isNarrow = function () {
    return window.matchMedia('(max-width: 640px)').matches;
  };

  function pageBase() {
    var path = window.location.pathname || '';
    if (path.indexOf('clips.html') !== -1 || path.indexOf('shows.html') !== -1 || path.indexOf('about.html') !== -1) {
      return 'index.html';
    }
    return '';
  }

  function homeHref(hash) {
    var base = pageBase();
    return base ? base + hash : hash;
  }

  function formatTrayClock(d) {
    var h = d.getHours();
    var m = d.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    m = m < 10 ? '0' + m : m;
    return h + ':' + m + ' ' + ampm;
  }

  function ensureAudio() {
    if (!audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playBeep(freq, dur, type) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(ctx.destination);
    var now = ctx.currentTime;
    var vol = Math.max(0.001, masterVolume * 0.12);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.start(now);
    o.stop(now + dur + 0.02);
  }

  function startSaberHum(color) {
    stopSaberHum();
    var ctx = ensureAudio();
    if (!ctx) return;
    saberOsc = ctx.createOscillator();
    saberGain = ctx.createGain();
    saberOsc.type = 'sawtooth';
    saberOsc.frequency.value = color === 'red' ? 55 : color === 'blue' ? 70 : 62;
    saberGain.gain.value = masterVolume * 0.04;
    saberOsc.connect(saberGain);
    saberGain.connect(ctx.destination);
    saberOsc.start();
  }

  function stopSaberHum() {
    if (saberOsc) {
      try {
        saberOsc.stop();
      } catch (e) {}
      saberOsc.disconnect();
      saberOsc = null;
    }
    if (saberGain) {
      saberGain.disconnect();
      saberGain = null;
    }
  }

  function saberSwish() {
    var ctx = ensureAudio();
    if (!ctx) return;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.18);
    g.gain.value = masterVolume * 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  }

  function injectMarkup() {
    if (document.getElementById('start-menu')) return;

    var wrap = document.createElement('div');
    wrap.id = 'desktop-root';
    wrap.innerHTML =
      '<div id="start-menu" class="start-menu" hidden role="menu" aria-label="Start menu">' +
      '<div class="start-menu-sidebar">COMEDY.EXE</div>' +
      '<div class="start-menu-body">' +
      '<div class="start-section-label">Programs</div>' +
      '<a class="start-item" role="menuitem" href="' + homeHref('#window-nav') + '">PROGRAM_MANAGER</a>' +
      '<a class="start-item" role="menuitem" href="clips.html">clips.exe</a>' +
      '<a class="start-item" role="menuitem" href="' + homeHref('#window-shorts') + '">shorts.vlc</a>' +
      '<a class="start-item" role="menuitem" href="shows.html">shows.sys</a>' +
      '<a class="start-item" role="menuitem" href="about.html">about.txt</a>' +
      '<a class="start-item" role="menuitem" href="shows.html#window-booking">booking</a>' +
      '<div class="start-section-label">Links</div>' +
      '<div class="start-flyout-wrap">' +
      '<button type="button" class="start-item start-flyout-trigger" aria-expanded="false" aria-haspopup="true">Links ▸</button>' +
      '<div class="start-flyout" hidden role="menu">' +
      '<a class="start-item" href="https://www.instagram.com/ryanmorriscomedy/" target="_blank" rel="noopener">Instagram</a>' +
      '<a class="start-item" href="https://www.youtube.com/@RyanMorrisComedy" target="_blank" rel="noopener">YouTube</a>' +
      '<a class="start-item" href="https://www.youtube.com/@RyanMorrisComedy/shorts" target="_blank" rel="noopener">YouTube Shorts</a>' +
      '<a class="start-item" href="https://x.com/RyanMorrisComedy" target="_blank" rel="noopener">X / Twitter</a>' +
      '<a class="start-item" href="https://github.com/hackmods" target="_blank" rel="noopener">GitHub / hackmods</a>' +
      '<a class="start-item" href="https://www.linkedin.com/in/ryanjamesmorris" target="_blank" rel="noopener">LinkedIn</a>' +
      '</div></div>' +
      '<div class="start-section-label">Accessories</div>' +
      '<button type="button" class="start-item" data-open="notepad">NOTEPAD.EXE</button>' +
      '<button type="button" class="start-item" data-open="clock">CLOCK.EXE</button>' +
      '<button type="button" class="start-item" data-open="calc">CALC.EXE</button>' +
      '<button type="button" class="start-item" data-open="volume">SNDVOL.EXE</button>' +
      '<div class="start-section-label">Dashboard</div>' +
      '<button type="button" class="start-item" data-open="saber">LIGHTSABER.WDGT</button>' +
      '<button type="button" class="start-item" data-open="duckhunt">DUCKHUNT.WDGT</button>' +
      '<div class="start-section-label">Dev</div>' +
      '<button type="button" class="start-item" data-open="hackmods">HACKMODS.EXE</button>' +
      '<div class="start-section-label">Documents</div>' +
      '<a class="start-item" role="menuitem" href="about.html">Press kit / bio</a>' +
      '</div></div>' +
      floatShell(
        'widget-notepad',
        'NOTEPAD.EXE',
        '<textarea id="notepad-body" class="notepad-area" rows="10" spellcheck="true"></textarea>' +
          '<div class="btn-row" style="justify-content:flex-start;margin-top:8px;">' +
          '<button type="button" class="btn" id="notepad-save">Save</button>' +
          '<button type="button" class="btn" id="notepad-clear">Clear</button></div>' +
          '<p class="muted">Notes save in this browser (localStorage).</p>'
      ) +
      floatShell(
        'widget-clock',
        'CLOCK.EXE',
        '<div class="clock-widget">' +
          '<canvas id="clock-canvas" width="160" height="160" aria-hidden="true"></canvas>' +
          '<div class="clock-digital" id="clock-digital">--:-- --</div>' +
          '<div class="muted" id="clock-date"></div>' +
          '<div class="muted">Timezone: America/Toronto (Niagara)</div></div>'
      ) +
      floatShell(
        'widget-calc',
        'CALC.EXE',
        '<div class="calc-display" id="calc-display">0</div>' +
          '<div class="calc-grid" id="calc-grid"></div>'
      ) +
      floatShell(
        'widget-volume',
        'SNDVOL.EXE',
        '<label for="vol-slider"><strong>Master volume</strong></label>' +
          '<input type="range" id="vol-slider" min="0" max="100" value="35">' +
          '<p class="muted" id="vol-status">Volume: 35% — widget beeps &amp; saber hum</p>'
      ) +
      floatShell(
        'widget-hackmods',
        'HACKMODS.EXE',
        '<p><strong>Day job / night mic.</strong> Ryan builds systems by day and documents comedy like code by night.</p>' +
          '<p class="muted">GitHub: <a href="https://github.com/hackmods" target="_blank" rel="noopener">github.com/hackmods</a></p>' +
          '<ul class="hackmods-links">' +
          '<li><a href="https://github.com/hackmods" target="_blank" rel="noopener">GitHub profile</a></li>' +
          '<li><a href="https://www.linkedin.com/in/ryanjamesmorris" target="_blank" rel="noopener">LinkedIn</a></li>' +
          '<li><a href="Simpsons/index.html">Simpsons Infographic</a></li>' +
          '<li><a href="strongtowns-nf-radar-tracker/index.html">Strong Towns Radar Tracker</a></li>' +
          '<li><a href="TraderJokes.html">TraderJokes</a></li>' +
          '<li><a href="CloudCity/index.html">Cloud City</a></li></ul>'
      ) +
      floatShell(
        'widget-saber',
        'LIGHTSABER.WDGT',
        '<p class="muted saber-tip">May the jokes be with you. Drag inside the pad.</p>' +
          '<div class="saber-colors">' +
          '<button type="button" class="btn saber-color is-active" data-color="green">Green</button>' +
          '<button type="button" class="btn saber-color" data-color="blue">Blue</button>' +
          '<button type="button" class="btn saber-color" data-color="red">Red</button></div>' +
          '<canvas id="saber-canvas" class="saber-canvas" width="300" height="200"></canvas>'
      ) +
      floatShell(
        'widget-duckhunt',
        'DUCKHUNT.WDGT',
        '<div class="duck-hud"><span id="duck-score">Score: 0</span><span id="duck-ammo">Ammo: 3</span><span id="duck-round">Duck 1/5</span></div>' +
          '<canvas id="duck-canvas" class="duck-canvas" width="360" height="240"></canvas>' +
          '<p class="muted" id="duck-msg">Tap/click to shoot. Original geometric ducks — no ROM packs.</p>' +
          '<button type="button" class="btn" id="duck-restart">Restart</button>'
      );

    document.body.appendChild(wrap);
  }

  function floatShell(id, title, body) {
    return (
      '<div class="float-window" id="' +
      id +
      '" hidden data-widget>' +
      '<div class="title-bar">' +
      '<span>' +
      title +
      '</span>' +
      '<button type="button" class="win-close" data-close aria-label="Close">×</button>' +
      '</div><div class="content">' +
      body +
      '</div></div>'
    );
  }

  function wireStartButton() {
    var taskbar = document.querySelector('.taskbar');
    if (!taskbar) return;

    var old = taskbar.querySelector('.start-btn');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'start-btn';
    btn.id = 'start-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '🏁 Start';
    if (old) {
      old.replaceWith(btn);
    } else {
      taskbar.insertBefore(btn, taskbar.firstChild);
    }

    var tray = taskbar.querySelector('.system-tray');
    if (tray) {
      tray.innerHTML =
        '<button type="button" class="tray-btn" id="tray-volume" title="Volume" aria-label="Volume">🔊</button>' +
        '<button type="button" class="tray-btn" id="tray-github" title="Hackmods" aria-label="Hackmods">⌘</button>' +
        '<button type="button" class="tray-clock" id="clock" title="Clock">12:00 PM</button>';
    }

    var menu = document.getElementById('start-menu');
    function closeMenu() {
      menu.hidden = true;
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      var fly = menu.querySelector('.start-flyout');
      var trig = menu.querySelector('.start-flyout-trigger');
      if (fly) fly.hidden = true;
      if (trig) trig.setAttribute('aria-expanded', 'false');
    }
    function openMenu() {
      menu.hidden = false;
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function toggleMenu() {
      if (menu.hidden) openMenu();
      else closeMenu();
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && e.target !== btn) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    menu.addEventListener('click', function (e) {
      var t = e.target.closest('[data-open]');
      if (t) {
        e.preventDefault();
        openWidget(t.getAttribute('data-open'));
        closeMenu();
        return;
      }
      var flyTrig = e.target.closest('.start-flyout-trigger');
      if (flyTrig) {
        e.preventDefault();
        e.stopPropagation();
        var fly = menu.querySelector('.start-flyout');
        var open = fly.hidden;
        fly.hidden = !open;
        flyTrig.setAttribute('aria-expanded', open ? 'true' : 'false');
        return;
      }
      if (e.target.closest('a.start-item')) closeMenu();
    });

    document.getElementById('tray-volume').addEventListener('click', function () {
      openWidget('volume');
    });
    document.getElementById('tray-github').addEventListener('click', function () {
      openWidget('hackmods');
    });
    document.getElementById('clock').addEventListener('click', function () {
      openWidget('clock');
    });
  }

  var widgetMap = {
    notepad: 'widget-notepad',
    clock: 'widget-clock',
    calc: 'widget-calc',
    volume: 'widget-volume',
    hackmods: 'widget-hackmods',
    saber: 'widget-saber',
    duckhunt: 'widget-duckhunt'
  };

  function focusWidget(el) {
    zTop += 1;
    el.style.zIndex = String(zTop);
  }

  function openWidget(name) {
    var id = widgetMap[name];
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    if (!isNarrow() && !el.dataset.placed) {
      var offset = Object.keys(widgetMap).indexOf(name) * 18;
      el.style.left = Math.min(40 + offset, window.innerWidth - 320) + 'px';
      el.style.top = Math.min(60 + offset, window.innerHeight - 280) + 'px';
      el.dataset.placed = '1';
    }
    focusWidget(el);
    if (name === 'saber') initSaber(true);
    if (name === 'duckhunt') initDuckHunt(true);
    if (name === 'clock') drawClockFace();
  }

  function closeWidget(el) {
    el.hidden = true;
    if (el.id === 'widget-saber') {
      stopSaberHum();
    }
    if (el.id === 'widget-duckhunt') {
      stopDuckHunt();
    }
  }

  function wireFloatWindows() {
    document.querySelectorAll('.float-window').forEach(function (win) {
      win.addEventListener('mousedown', function () {
        focusWidget(win);
      });
      win.addEventListener('touchstart', function () {
        focusWidget(win);
      }, { passive: true });

      var closeBtn = win.querySelector('[data-close]');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          closeWidget(win);
        });
      }

      var bar = win.querySelector('.title-bar');
      if (!bar) return;
      var dragging = false;
      var sx = 0;
      var sy = 0;
      var ol = 0;
      var ot = 0;

      bar.addEventListener('pointerdown', function (e) {
        if (e.target.closest('[data-close]')) return;
        if (isNarrow()) return;
        dragging = true;
        focusWidget(win);
        sx = e.clientX;
        sy = e.clientY;
        var rect = win.getBoundingClientRect();
        ol = rect.left;
        ot = rect.top;
        bar.setPointerCapture(e.pointerId);
      });
      bar.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        win.style.left = ol + (e.clientX - sx) + 'px';
        win.style.top = ot + (e.clientY - sy) + 'px';
      });
      bar.addEventListener('pointerup', function () {
        dragging = false;
      });
    });
  }

  function wireNotepad() {
    var area = document.getElementById('notepad-body');
    if (!area) return;
    try {
      area.value = localStorage.getItem(NOTEPAD_KEY) || NOTEPAD_SEED;
    } catch (e) {
      area.value = NOTEPAD_SEED;
    }
    document.getElementById('notepad-save').addEventListener('click', function () {
      try {
        localStorage.setItem(NOTEPAD_KEY, area.value);
      } catch (err) {}
      playBeep(880, 0.08);
    });
    document.getElementById('notepad-clear').addEventListener('click', function () {
      area.value = '';
    });
  }

  function drawClockFace() {
    var canvas = document.getElementById('clock-canvas');
    var digital = document.getElementById('clock-digital');
    var dateEl = document.getElementById('clock-date');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var now = new Date();
    var w = canvas.width;
    var h = canvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var r = 70;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8));
      ctx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
      ctx.stroke();
    }
    var sec = now.getSeconds();
    var min = now.getMinutes() + sec / 60;
    var hr = (now.getHours() % 12) + min / 60;
    function hand(angle, len, width, color) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    hand((hr / 12) * Math.PI * 2 - Math.PI / 2, r * 0.5, 3, '#000');
    hand((min / 60) * Math.PI * 2 - Math.PI / 2, r * 0.72, 2, '#000080');
    hand((sec / 60) * Math.PI * 2 - Math.PI / 2, r * 0.8, 1, '#c00');
    if (digital) digital.textContent = formatTrayClock(now);
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-CA', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'America/Toronto'
      });
    }
  }

  function wireCalc() {
    var display = document.getElementById('calc-display');
    var grid = document.getElementById('calc-grid');
    if (!display || !grid || grid.dataset.ready) return;
    grid.dataset.ready = '1';
    var keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C'];
    var expr = '';
    keys.forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'calc-key';
      b.textContent = k;
      b.addEventListener('click', function () {
        if (k === 'C') {
          expr = '';
          display.textContent = '0';
          return;
        }
        if (k === '=') {
          try {
            if (!/^[\d.+\-*/\s]+$/.test(expr)) throw new Error('bad');
            var result = Function('"use strict"; return (' + expr + ')')();
            display.textContent = String(result);
            expr = String(result);
          } catch (err) {
            display.textContent = 'ERR';
            expr = '';
          }
          return;
        }
        expr += k;
        display.textContent = expr;
      });
      grid.appendChild(b);
    });
  }

  function wireVolume() {
    var slider = document.getElementById('vol-slider');
    var status = document.getElementById('vol-status');
    if (!slider) return;
    slider.addEventListener('input', function () {
      masterVolume = Number(slider.value) / 100;
      if (status) status.textContent = 'Volume: ' + slider.value + '% — widget beeps & saber hum';
      if (saberGain) saberGain.gain.value = masterVolume * 0.04;
      document.querySelectorAll('iframe').forEach(function (frame) {
        try {
          frame.style.opacity = masterVolume < 0.05 ? '0.85' : '1';
        } catch (e) {}
      });
    });
  }

  var saberColor = 'green';
  var saberInited = false;

  function initSaber(startHum) {
    var canvas = document.getElementById('saber-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var colors = { green: '#39ff14', blue: '#4fc3ff', red: '#ff3b3b' };

    function drawBlade(x, y) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var hx = canvas.width / 2;
      var hy = canvas.height - 20;
      ctx.fillStyle = '#888';
      ctx.fillRect(hx - 8, hy - 10, 16, 28);
      ctx.fillStyle = '#555';
      ctx.fillRect(hx - 10, hy + 8, 20, 10);
      if (x == null) return;
      var dx = x - hx;
      var dy = y - hy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / len;
      var uy = dy / len;
      var bladeLen = Math.min(len, 160);
      ctx.strokeStyle = colors[saberColor] || colors.green;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.shadowColor = colors[saberColor];
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + ux * bladeLen, hy + uy * bladeLen);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx + ux * bladeLen, hy + uy * bladeLen);
      ctx.stroke();
    }

    drawBlade(null, null);

    if (!saberInited) {
      saberInited = true;
      var lastSwish = 0;
      function move(e) {
        var rect = canvas.getBoundingClientRect();
        var cx = (e.clientX !== undefined ? e.clientX : e.touches[0].clientX) - rect.left;
        var cy = (e.clientY !== undefined ? e.clientY : e.touches[0].clientY) - rect.top;
        drawBlade(cx, cy);
        var now = Date.now();
        if (now - lastSwish > 120) {
          saberSwish();
          lastSwish = now;
        }
      }
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerdown', function (e) {
        canvas.setPointerCapture(e.pointerId);
        move(e);
        startSaberHum(saberColor);
      });
      document.querySelectorAll('.saber-color').forEach(function (btn) {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.saber-color').forEach(function (b) {
            b.classList.remove('is-active');
          });
          btn.classList.add('is-active');
          saberColor = btn.getAttribute('data-color');
          startSaberHum(saberColor);
          drawBlade(canvas.width / 2, 40);
        });
      });
    }
    if (startHum) startSaberHum(saberColor);
  }

  function stopDuckHunt() {
    if (duckHuntRaf) {
      cancelAnimationFrame(duckHuntRaf);
      duckHuntRaf = null;
    }
  }

  function initDuckHunt(restart) {
    var canvas = document.getElementById('duck-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var scoreEl = document.getElementById('duck-score');
    var ammoEl = document.getElementById('duck-ammo');
    var roundEl = document.getElementById('duck-round');
    var msgEl = document.getElementById('duck-msg');

    if (restart || !duckHuntState) {
      duckHuntState = {
        score: 0,
        ammo: 3,
        duckIndex: 0,
        total: 5,
        duck: null,
        flash: 0,
        over: false,
        running: true
      };
      spawnDuck();
    } else {
      duckHuntState.running = true;
    }

    function spawnDuck() {
      var dir = Math.random() > 0.5 ? 1 : -1;
      duckHuntState.duck = {
        x: dir > 0 ? -30 : canvas.width + 30,
        y: 40 + Math.random() * 120,
        vx: dir * (1.6 + Math.random() * 1.4),
        vy: (Math.random() - 0.5) * 0.8,
        wing: 0,
        alive: true
      };
      duckHuntState.ammo = 3;
      updateHud();
    }

    function updateHud() {
      if (scoreEl) scoreEl.textContent = 'Score: ' + duckHuntState.score;
      if (ammoEl) ammoEl.textContent = 'Ammo: ' + duckHuntState.ammo;
      if (roundEl) {
        roundEl.textContent = duckHuntState.over
          ? 'Done'
          : 'Duck ' + Math.min(duckHuntState.duckIndex + 1, duckHuntState.total) + '/' + duckHuntState.total;
      }
    }

    function endGame() {
      duckHuntState.over = true;
      duckHuntState.running = false;
      var line =
        duckHuntState.score >= 400
          ? 'Kill. Next open mic.'
          : duckHuntState.score >= 200
            ? 'Solid set. Credit the room.'
            : 'You bombed. Document it. Ship the next set.';
      if (msgEl) msgEl.textContent = line + ' Final score: ' + duckHuntState.score;
      updateHud();
      stopDuckHunt();
    }

    function draw() {
      if (!duckHuntState.running && !duckHuntState.over) return;
      ctx.fillStyle = '#87ceeb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3a7d44';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
      ctx.fillStyle = '#c0c0c0';
      ctx.fillRect(20, canvas.height - 70, 40, 30);

      if (duckHuntState.flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + duckHuntState.flash + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        duckHuntState.flash -= 0.1;
      }

      var d = duckHuntState.duck;
      if (d && d.alive && !duckHuntState.over) {
        d.x += d.vx;
        d.y += d.vy;
        d.wing += 0.25;
        if (d.y < 20 || d.y > canvas.height - 60) d.vy *= -1;
        if (d.x < -50 || d.x > canvas.width + 50) {
          duckHuntState.duckIndex += 1;
          if (duckHuntState.duckIndex >= duckHuntState.total) endGame();
          else spawnDuck();
        } else {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.fillStyle = '#d4a017';
          ctx.beginPath();
          ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#c45c26';
          ctx.beginPath();
          ctx.ellipse(Math.sin(d.wing) * 4, -8, 10, 5, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#222';
          ctx.beginPath();
          ctx.arc(d.vx > 0 ? 10 : -10, -2, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (duckHuntState.running) duckHuntRaf = requestAnimationFrame(draw);
    }

    stopDuckHunt();
    duckHuntState.running = true;
    draw();

    if (!canvas.dataset.wired) {
      canvas.dataset.wired = '1';
      canvas.addEventListener('pointerdown', function (e) {
        if (!duckHuntState || duckHuntState.over) return;
        var rect = canvas.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        var y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        if (duckHuntState.ammo <= 0) {
          if (msgEl) msgEl.textContent = 'Out of ammo — duck escapes.';
          return;
        }
        duckHuntState.ammo -= 1;
        duckHuntState.flash = 0.5;
        playBeep(220, 0.06, 'square');
        var d = duckHuntState.duck;
        if (d && d.alive) {
          var hit = Math.hypot(x - d.x, y - d.y) < 28;
          if (hit) {
            d.alive = false;
            duckHuntState.score += 100;
            playBeep(660, 0.1, 'triangle');
            if (msgEl) msgEl.textContent = 'Hit!';
            duckHuntState.duckIndex += 1;
            updateHud();
            if (duckHuntState.duckIndex >= duckHuntState.total) {
              endGame();
            } else {
              setTimeout(spawnDuck, 400);
            }
          } else {
            if (msgEl) msgEl.textContent = 'Miss.';
            updateHud();
            if (duckHuntState.ammo <= 0) {
              duckHuntState.duckIndex += 1;
              if (duckHuntState.duckIndex >= duckHuntState.total) endGame();
              else setTimeout(spawnDuck, 500);
            }
          }
        }
        updateHud();
      });
      var restart = document.getElementById('duck-restart');
      if (restart) {
        restart.addEventListener('click', function () {
          if (msgEl) msgEl.textContent = 'New round. Tap/click to shoot.';
          initDuckHunt(true);
        });
      }
    }
    updateHud();
  }

  function tickClocks() {
    var tray = document.getElementById('clock');
    var now = new Date();
    if (tray) tray.textContent = formatTrayClock(now);
    if (document.getElementById('widget-clock') && !document.getElementById('widget-clock').hidden) {
      drawClockFace();
    }
  }

  function wireOpenHackmodsButtons() {
    document.querySelectorAll('[data-open-widget]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openWidget(el.getAttribute('data-open-widget'));
      });
    });
  }

  function adjustBodyPadding() {
    var tb = document.querySelector('.taskbar');
    if (!tb) return;
    var h = tb.offsetHeight || 48;
    document.body.style.paddingBottom = Math.max(100, h + 24) + 'px';
    document.documentElement.style.setProperty('--taskbar-h', h + 'px');
    var menu = document.getElementById('start-menu');
    if (menu) menu.style.bottom = h + 'px';
    document.querySelectorAll('.float-window').forEach(function (w) {
      if (isNarrow()) w.style.bottom = h + 'px';
    });
  }

  function init() {
    injectMarkup();
    wireStartButton();
    wireFloatWindows();
    wireNotepad();
    wireCalc();
    wireVolume();
    wireOpenHackmodsButtons();
    tickClocks();
    setInterval(tickClocks, 1000);
    adjustBodyPadding();
    window.addEventListener('resize', adjustBodyPadding);

    window.ComedyDesktop = {
      openWidget: openWidget,
      closeMenu: function () {
        var menu = document.getElementById('start-menu');
        var btn = document.getElementById('start-btn');
        if (menu) menu.hidden = true;
        if (btn) {
          btn.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        }
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
