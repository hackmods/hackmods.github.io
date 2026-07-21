(function () {
  'use strict';

  var NOTEPAD_KEY = 'comedy-notepad';
  var LAYOUT_KEY = 'comedy-desktop-layout-v2';
  var LAYOUT_KEY_LEGACY = 'comedy-desktop-layout';
  var NOTEPAD_SEED =
    'SET NOTES\n---------\n- Crowd work opener\n- Buffalo Fan Bill callback\n- Kill the puppet bit if room is quiet\n\nDocument the craft. Ship the next set.';
  var zTop = 10050;
  var masterVolume = 0.35;
  var audioCtx = null;
  var saberOsc = null;
  var saberGain = null;
  var duckHuntRaf = null;
  var duckHuntState = null;
  var solitaireState = null;
  var layoutCache = null;
  var layoutSaveTimer = null;
  var pageWindowsWired = false;
  var GRIP_DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  var isNarrow = function () {
    return window.matchMedia('(max-width: 640px)').matches;
  };
  var isCompact = function () {
    return window.matchMedia('(max-width: 900px)').matches;
  };
  var prefersReducedMotion = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  function taskbarHeight() {
    var tb = document.querySelector('.taskbar');
    return (tb && tb.offsetHeight) || 48;
  }

  function loadLayout() {
    if (layoutCache) return layoutCache;
    try {
      localStorage.removeItem(LAYOUT_KEY_LEGACY);
    } catch (e) {}
    try {
      var raw = localStorage.getItem(LAYOUT_KEY);
      layoutCache = raw ? JSON.parse(raw) : {};
    } catch (e) {
      layoutCache = {};
    }
    if (!layoutCache || typeof layoutCache !== 'object') layoutCache = {};
    return layoutCache;
  }

  function saveLayoutSoon() {
    if (layoutSaveTimer) clearTimeout(layoutSaveTimer);
    layoutSaveTimer = setTimeout(saveLayoutNow, 120);
  }

  function saveLayoutNow() {
    layoutSaveTimer = null;
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(loadLayout()));
    } catch (e) {}
  }

  function getWinRecord(id) {
    var layout = loadLayout();
    if (!layout[id]) layout[id] = {};
    return layout[id];
  }

  function captureWinGeometry(el, opts) {
    opts = opts || {};
    var id = el.id;
    if (!id) return;
    var rec = getWinRecord(id);
    if (el.classList.contains('is-maximized')) {
      rec.maximized = true;
      return;
    }
    var rect = el.getBoundingClientRect();
    var isFloat = el.classList.contains('float-window');
    var left;
    var top;
    if (isFloat) {
      left = rect.left;
      top = rect.top;
    } else {
      var canvas = getHomeCanvas();
      var cr = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
      left = rect.left - cr.left;
      top = rect.top - cr.top;
    }
    var maxs = maxSizeFor(el);
    var w = Math.round(Math.min(Math.max(rect.width, minSizeFor(el).w), maxs.w));
    rec.left = Math.round(left);
    rec.top = Math.round(top);
    if (opts.sizes) {
      rec.width = w;
      rec.height = Math.round(Math.min(Math.max(rect.height, minSizeFor(el).h), maxs.h));
      rec.userSized = true;
    } else {
      if (rec.width == null || rec.width > maxs.w) {
        rec.width = w || defaultWidthForWindow(el);
      }
      if (!rec.userSized) delete rec.height;
    }
    rec.maximized = false;
    rec.z = parseInt(el.style.zIndex, 10) || undefined;
    if (el.classList.contains('window') && !isFloat) {
      rec.hidden = !!el.hidden;
    }
  }

  function getCanvasOffset() {
    var canvas = getHomeCanvas();
    if (!canvas) return { left: 0, top: 0 };
    var r = canvas.getBoundingClientRect();
    return { left: r.left, top: r.top };
  }

  function getHomeCanvas() {
    return document.querySelector('.desktop-canvas--home');
  }

  function isFreeFloatActive() {
    return document.body.classList.contains('desktop-freefloat') && !isNarrow();
  }

  function defaultWidthForWindow(el) {
    if (el.id === 'window-shorts') return 640;
    if (el.classList.contains('window-wide')) return 620;
    if (el.classList.contains('window-hero')) return 420;
    if (el.classList.contains('window-narrow')) return 300;
    if (el.classList.contains('window-media')) return 520;
    if (el.id === 'widget-solitaire') return 560;
    if (el.classList.contains('float-window')) return 340;
    return 400;
  }

  function minSizeFor(el) {
    if (el.id === 'widget-solitaire') return { w: 320, h: 280 };
    if (el.classList.contains('window-media') || el.id === 'window-shorts' || el.id === 'window-latest' || el.id === 'window-set') {
      return { w: 280, h: 200 };
    }
    if (el.classList.contains('float-window')) return { w: 220, h: 140 };
    return { w: 240, h: 120 };
  }

  function maxSizeFor(el) {
    var canvas = getHomeCanvas();
    var canvasCap = canvas ? Math.max(320, canvas.clientWidth - 16) : window.innerWidth - 32;
    var vwCap = window.innerWidth - 24;
    var stageCap = Math.min(canvasCap, vwCap);
    var typeMax = 720;
    if (el.id === 'window-shorts') typeMax = 680;
    else if (el.classList.contains('window-wide')) typeMax = 720;
    else if (el.classList.contains('window-hero')) typeMax = 520;
    else if (el.classList.contains('window-narrow')) typeMax = 380;
    else if (el.classList.contains('window-media')) typeMax = 640;
    else if (el.id === 'widget-solitaire') typeMax = 640;
    else if (el.classList.contains('float-window')) typeMax = 480;
    var tb = taskbarHeight();
    return {
      w: Math.min(typeMax, stageCap),
      h: Math.min(window.innerHeight - tb - 24, 900)
    };
  }

  function sanitizeWinRecord(el, rec) {
    if (!rec) return rec;
    var maxs = maxSizeFor(el);
    var defW = defaultWidthForWindow(el);
    if (rec.width != null && rec.width > maxs.w) {
      rec.width = defW;
      delete rec.height;
      rec.userSized = false;
    }
    if (rec.width != null && rec.width < minSizeFor(el).w) {
      rec.width = defW;
    }
    if (!rec.userSized) {
      delete rec.height;
    }
    if (rec.restore) {
      if (rec.restore.width > maxs.w) rec.restore.width = defW;
      if (!rec.userSized) delete rec.restore.height;
    }
    return rec;
  }

  function clampRect(left, top, width, height, isFloat, el) {
    var tb = taskbarHeight();
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var minVis = 48;
    var mins = el ? minSizeFor(el) : { w: 240, h: 120 };
    var maxs = el ? maxSizeFor(el) : { w: vw - 16, h: vh - tb - 16 };
    width = Math.min(Math.max(width, mins.w), maxs.w);
    height = Math.min(Math.max(height, mins.h), maxs.h);

    if (isFloat) {
      left = Math.min(Math.max(left, 8 - width + minVis), vw - minVis);
      top = Math.min(Math.max(top, 8), vh - tb - minVis);
    } else {
      var canvas = getHomeCanvas();
      var cw = canvas ? canvas.clientWidth : vw;
      var ch = Math.max(canvas ? canvas.clientHeight : vh, vh - tb);
      left = Math.min(Math.max(left, 8 - width + minVis), Math.max(0, cw - minVis));
      top = Math.min(Math.max(top, 0), Math.max(0, ch - minVis));
    }
    return { left: left, top: top, width: width, height: height };
  }

  function applyGeometry(el, geo, isFloat) {
    var mins = minSizeFor(el);
    var width = geo.width != null ? geo.width : defaultWidthForWindow(el);
    var height = geo.height != null ? geo.height : mins.h;
    var c = clampRect(geo.left, geo.top, width, height, isFloat, el);
    el.style.left = c.left + 'px';
    el.style.top = c.top + 'px';
    el.style.width = c.width + 'px';
    if (geo.height != null && geo.height > 0) {
      el.style.height = c.height + 'px';
    } else {
      el.style.height = 'auto';
    }
  }

  function setInteractLock(on) {
    document.body.classList.toggle('is-win-interact', !!on);
  }

  function focusWindow(el) {
    zTop += 1;
    el.style.zIndex = String(zTop);
    var rec = getWinRecord(el.id);
    rec.z = zTop;
    saveLayoutSoon();
  }

  function ensureGrips(el) {
    if (el.querySelector('.win-grip')) return;
    GRIP_DIRS.forEach(function (dir) {
      var g = document.createElement('div');
      g.className = 'win-grip win-grip-' + dir;
      g.setAttribute('data-resize', dir);
      g.setAttribute('aria-hidden', 'true');
      el.appendChild(g);
    });
  }

  function ensureTitleControls(el) {
    var bar = el.querySelector('.title-bar');
    if (!bar) return;
    var controls = bar.querySelector('.title-bar-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'title-bar-controls';
      bar.appendChild(controls);
    }
    if (!controls.querySelector('[data-max]')) {
      var maxBtn = document.createElement('button');
      maxBtn.type = 'button';
      maxBtn.className = 'win-max';
      maxBtn.setAttribute('data-max', '');
      maxBtn.setAttribute('aria-label', 'Maximize');
      maxBtn.innerHTML = '&#9633;';
      controls.insertBefore(maxBtn, controls.firstChild);
    }
    if (!controls.querySelector('[data-close]')) {
      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'win-close';
      closeBtn.setAttribute('data-close', '');
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.innerHTML = '&times;';
      controls.appendChild(closeBtn);
    }
    var decorative = bar.querySelector('span:last-child');
    if (decorative && decorative.textContent === '[X]') decorative.remove();
  }

  function updateMaxButton(el) {
    var btn = el.querySelector('[data-max]');
    if (!btn) return;
    var maxed = el.classList.contains('is-maximized');
    btn.innerHTML = maxed ? '&#9634;' : '&#9633;';
    btn.setAttribute('aria-label', maxed ? 'Restore' : 'Maximize');
  }

  function maximizeWindow(el) {
    if (isNarrow() && el.classList.contains('float-window')) return;
    if (isNarrow() && !el.classList.contains('float-window')) return;
    var rec = getWinRecord(el.id);
    if (!el.classList.contains('is-maximized')) {
      captureWinGeometry(el);
      rec.restore = {
        left: rec.left,
        top: rec.top,
        width: rec.width || defaultWidthForWindow(el),
        height: rec.userSized ? rec.height : null
      };
      el.classList.add('is-maximized');
      rec.maximized = true;
    } else {
      el.classList.remove('is-maximized');
      rec.maximized = false;
      var isFloat = el.classList.contains('float-window');
      var geo = rec.restore || rec;
      if (geo.left != null) {
        applyGeometry(
          el,
          {
            left: geo.left,
            top: geo.top,
            width: geo.width || defaultWidthForWindow(el),
            height: rec.userSized ? geo.height : null
          },
          isFloat
        );
      }
    }
    updateMaxButton(el);
    focusWindow(el);
    saveLayoutSoon();
  }

  function hidePageWindow(el) {
    el.hidden = true;
    var rec = getWinRecord(el.id);
    rec.hidden = true;
    saveLayoutSoon();
  }

  function showPageWindow(el) {
    el.hidden = false;
    var rec = getWinRecord(el.id);
    rec.hidden = false;
    focusWindow(el);
    saveLayoutSoon();
  }

  function wireWindowChrome(el, opts) {
    opts = opts || {};
    var isFloat = !!opts.isFloat || el.classList.contains('float-window');
    var isPage = !!opts.isPage || (el.classList.contains('window') && !isFloat);
    if (el.dataset.chromeWired) return;
    el.dataset.chromeWired = '1';

    ensureTitleControls(el);
    ensureGrips(el);

    el.addEventListener('mousedown', function () {
      focusWindow(el);
    });
    el.addEventListener(
      'touchstart',
      function () {
        focusWindow(el);
      },
      { passive: true }
    );

    var closeBtn = el.querySelector('[data-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (isFloat) closeWidget(el);
        else hidePageWindow(el);
      });
    }

    var maxBtn = el.querySelector('[data-max]');
    if (maxBtn) {
      maxBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        maximizeWindow(el);
      });
    }

    var bar = el.querySelector('.title-bar');
    if (!bar) return;

    var drag = null;
    var resize = null;

    bar.addEventListener('dblclick', function (e) {
      if (e.target.closest('[data-close], [data-max], .title-bar-controls')) return;
      if (isNarrow() && isPage) return;
      if (isNarrow() && isFloat) return;
      maximizeWindow(el);
    });

    bar.addEventListener('pointerdown', function (e) {
      if (e.target.closest('[data-close], [data-max], .title-bar-controls, .win-grip')) return;
      if (isNarrow()) return;
      if (isPage && !isFreeFloatActive()) return;
      if (el.classList.contains('is-maximized')) return;
      e.preventDefault();
      drag = {
        sx: e.clientX,
        sy: e.clientY,
        ol: parseFloat(el.style.left) || el.getBoundingClientRect().left - (isFloat ? 0 : getCanvasOffset().left - window.scrollX),
        ot: parseFloat(el.style.top) || el.getBoundingClientRect().top - (isFloat ? 0 : getCanvasOffset().top - window.scrollY)
      };
      if (isFloat) {
        var fr = el.getBoundingClientRect();
        drag.ol = fr.left;
        drag.ot = fr.top;
      } else {
        var pr = el.getBoundingClientRect();
        var off = getHomeCanvas().getBoundingClientRect();
        drag.ol = pr.left - off.left;
        drag.ot = pr.top - off.top;
      }
      focusWindow(el);
      el.classList.add('is-dragging');
      setInteractLock(true);
      bar.setPointerCapture(e.pointerId);
    });

    bar.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var nl = drag.ol + (e.clientX - drag.sx);
      var nt = drag.ot + (e.clientY - drag.sy);
      var rect = el.getBoundingClientRect();
      var c = clampRect(nl, nt, rect.width, rect.height, isFloat, el);
      el.style.left = c.left + 'px';
      el.style.top = c.top + 'px';
    });

    function endDrag() {
      if (!drag) return;
      drag = null;
      el.classList.remove('is-dragging');
      setInteractLock(false);
      captureWinGeometry(el);
      saveLayoutSoon();
    }

    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);

    el.querySelectorAll('[data-resize]').forEach(function (grip) {
      grip.addEventListener('pointerdown', function (e) {
        if (isNarrow()) return;
        if (isPage && !isFreeFloatActive()) return;
        if (el.classList.contains('is-maximized')) return;
        e.preventDefault();
        e.stopPropagation();
        var dir = grip.getAttribute('data-resize');
        var rect = el.getBoundingClientRect();
        var off = isFloat ? { left: 0, top: 0 } : getHomeCanvas().getBoundingClientRect();
        resize = {
          dir: dir,
          sx: e.clientX,
          sy: e.clientY,
          left: isFloat ? rect.left : rect.left - off.left,
          top: isFloat ? rect.top : rect.top - off.top,
          width: rect.width,
          height: rect.height
        };
        focusWindow(el);
        el.classList.add('is-resizing');
        setInteractLock(true);
        grip.setPointerCapture(e.pointerId);
      });

      grip.addEventListener('pointermove', function (e) {
        if (!resize) return;
        var dx = e.clientX - resize.sx;
        var dy = e.clientY - resize.sy;
        var left = resize.left;
        var top = resize.top;
        var width = resize.width;
        var height = resize.height;
        var dir = resize.dir;
        var mins = minSizeFor(el);

        if (dir.indexOf('e') !== -1) width = resize.width + dx;
        if (dir.indexOf('s') !== -1) height = resize.height + dy;
        if (dir.indexOf('w') !== -1) {
          width = resize.width - dx;
          left = resize.left + dx;
          if (width < mins.w) {
            left = resize.left + resize.width - mins.w;
            width = mins.w;
          }
        }
        if (dir.indexOf('n') !== -1) {
          height = resize.height - dy;
          top = resize.top + dy;
          if (height < mins.h) {
            top = resize.top + resize.height - mins.h;
            height = mins.h;
          }
        }

        width = Math.max(width, mins.w);
        height = Math.max(height, mins.h);
        var c = clampRect(left, top, width, height, isFloat, el);
        el.style.left = c.left + 'px';
        el.style.top = c.top + 'px';
        el.style.width = c.width + 'px';
        el.style.height = c.height + 'px';
      });

      function endResize() {
        if (!resize) return;
        resize = null;
        el.classList.remove('is-resizing');
        setInteractLock(false);
        captureWinGeometry(el, { sizes: true });
        saveLayoutSoon();
      }

      grip.addEventListener('pointerup', endResize);
      grip.addEventListener('pointercancel', endResize);
    });
  }

  function cascadeDefaults(windows) {
    var reduced = prefersReducedMotion();
    windows.forEach(function (el, i) {
      var w = defaultWidthForWindow(el);
      var left = reduced ? 16 + (i % 2) * (w * 0.15) : 24 + (i % 5) * 28;
      var top = reduced ? 16 + Math.floor(i / 2) * 24 : 20 + i * 26;
      applyGeometry(el, { left: left, top: top, width: w, height: null }, false);
      el.style.height = 'auto';
      el.dataset.placed = '1';
    });
  }

  function applyStoredOrDefault(el, isFloat, index) {
    var rec = sanitizeWinRecord(el, getWinRecord(el.id));
    if (rec.z) {
      zTop = Math.max(zTop, rec.z);
      el.style.zIndex = String(rec.z);
    }
    if (!isFloat && rec.hidden) {
      el.hidden = true;
    }
    if (rec.maximized && rec.restore) {
      applyGeometry(el, {
        left: rec.restore.left,
        top: rec.restore.top,
        width: rec.restore.width || defaultWidthForWindow(el),
        height: rec.userSized ? rec.restore.height : null
      }, isFloat);
      el.classList.add('is-maximized');
      updateMaxButton(el);
      el.dataset.placed = '1';
      return;
    }
    if (rec.left != null && rec.top != null) {
      applyGeometry(
        el,
        {
          left: rec.left,
          top: rec.top,
          width: rec.width || defaultWidthForWindow(el),
          height: rec.userSized && rec.height ? rec.height : null
        },
        isFloat
      );
      el.dataset.placed = '1';
      return;
    }
    if (isFloat) {
      var offset = (index || 0) * 18;
      var maxLeft = el.id === 'widget-solitaire' ? window.innerWidth - 580 : window.innerWidth - 320;
      applyGeometry(
        el,
        {
          left: Math.min(40 + offset, Math.max(8, maxLeft)),
          top: Math.min(60 + offset, window.innerHeight - 280),
          width: defaultWidthForWindow(el),
          height: null
        },
        true
      );
      el.style.height = 'auto';
      el.dataset.placed = '1';
      return;
    }
    // Page window with no stored position — place with cascade-style defaults
    var i = index || 0;
    var w = defaultWidthForWindow(el);
    applyGeometry(
      el,
      {
        left: 24 + (i % 5) * 28,
        top: 20 + i * 26,
        width: w,
        height: null
      },
      false
    );
    el.style.height = 'auto';
    el.dataset.placed = '1';
  }

  function syncFreeFloatMode() {
    var canvas = getHomeCanvas();
    if (!canvas) {
      document.body.classList.remove('desktop-freefloat');
      return;
    }
    var enable = !isNarrow();
    document.body.classList.toggle('desktop-freefloat', enable);
    var windows = Array.prototype.slice.call(canvas.querySelectorAll('.window[id]'));
    if (!enable) {
      windows.forEach(function (el) {
        el.classList.remove('is-maximized', 'is-dragging', 'is-resizing');
        el.style.left = '';
        el.style.top = '';
        el.style.width = '';
        el.style.height = '';
        el.style.zIndex = '';
        el.hidden = false;
      });
      return;
    }

    windows.forEach(function (el) {
      wireWindowChrome(el, { isPage: true });
    });

    var needsCascade = windows.every(function (el) {
      var rec = getWinRecord(el.id);
      return rec.left == null;
    });

    if (needsCascade) {
      cascadeDefaults(windows);
      windows.forEach(function (el) {
        captureWinGeometry(el);
      });
      saveLayoutSoon();
    } else {
      windows.forEach(function (el, i) {
        applyStoredOrDefault(el, false, i);
      });
    }

    // Grow canvas so absolute windows aren't clipped oddly
    var maxBottom = 0;
    windows.forEach(function (el) {
      if (el.hidden || el.classList.contains('is-maximized')) return;
      var top = parseFloat(el.style.top) || 0;
      var h = el.offsetHeight || 200;
      maxBottom = Math.max(maxBottom, top + h + 40);
    });
    if (maxBottom > 400) canvas.style.minHeight = maxBottom + 'px';
  }

  function clampAllWindowsIntoView() {
    if (isNarrow()) return;
    document.querySelectorAll('.float-window:not([hidden])').forEach(function (el) {
      if (el.classList.contains('is-maximized')) return;
      var left = parseFloat(el.style.left);
      var top = parseFloat(el.style.top);
      if (isNaN(left) || isNaN(top)) {
        var rect = el.getBoundingClientRect();
        left = rect.left;
        top = rect.top;
      }
      var width = parseFloat(el.style.width) || el.offsetWidth;
      var height = el.style.height === 'auto' || !el.style.height ? el.offsetHeight : parseFloat(el.style.height);
      var c = clampRect(left, top, width, height, true, el);
      el.style.left = c.left + 'px';
      el.style.top = c.top + 'px';
      el.style.width = c.width + 'px';
    });
    if (!isFreeFloatActive()) return;
    var canvas = getHomeCanvas();
    if (!canvas) return;
    canvas.querySelectorAll('.window[id]').forEach(function (el) {
      if (el.hidden || el.classList.contains('is-maximized')) return;
      var left = parseFloat(el.style.left) || 0;
      var top = parseFloat(el.style.top) || 0;
      var width = parseFloat(el.style.width) || defaultWidthForWindow(el);
      var height = el.offsetHeight || 200;
      var c = clampRect(left, top, width, height, false, el);
      el.style.left = c.left + 'px';
      el.style.top = c.top + 'px';
      el.style.width = c.width + 'px';
      if (!getWinRecord(el.id).userSized) el.style.height = 'auto';
    });
  }

  function resetDesktop() {
    try {
      localStorage.removeItem(LAYOUT_KEY);
    } catch (e) {}
    layoutCache = {};
    document.querySelectorAll('.float-window').forEach(function (el) {
      el.classList.remove('is-maximized', 'is-dragging', 'is-resizing');
      el.hidden = true;
      el.style.left = '';
      el.style.top = '';
      el.style.width = '';
      el.style.height = '';
      el.style.zIndex = '';
      delete el.dataset.placed;
      updateMaxButton(el);
    });
    var canvas = getHomeCanvas();
    if (canvas) {
      canvas.querySelectorAll('.window[id]').forEach(function (el) {
        el.hidden = false;
        el.classList.remove('is-maximized', 'is-dragging', 'is-resizing');
        el.style.left = '';
        el.style.top = '';
        el.style.width = '';
        el.style.height = '';
        el.style.zIndex = '';
        delete el.dataset.placed;
        updateMaxButton(el);
      });
    }
    syncFreeFloatMode();
    playBeep(660, 0.08, 'square');
  }

  function revealHashTarget() {
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (!hash) return;
    var el = document.getElementById(hash);
    if (!el) return;
    if (el.classList.contains('window')) {
      if (isFreeFloatActive()) showPageWindow(el);
      else {
        el.hidden = false;
        el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      }
    }
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
      '<div class="start-section-label">Apps</div>' +
      '<div class="start-flyout-wrap">' +
      '<button type="button" class="start-item start-flyout-trigger" aria-expanded="false" aria-haspopup="true">Accessories ▸</button>' +
      '<div class="start-flyout" hidden role="menu">' +
      '<button type="button" class="start-item" data-open="notepad">NOTEPAD.EXE</button>' +
      '<button type="button" class="start-item" data-open="clock">CLOCK.EXE</button>' +
      '<button type="button" class="start-item" data-open="calc">CALC.EXE</button>' +
      '<button type="button" class="start-item" data-open="volume">SNDVOL.EXE</button>' +
      '</div></div>' +
      '<div class="start-flyout-wrap">' +
      '<button type="button" class="start-item start-flyout-trigger" aria-expanded="false" aria-haspopup="true">Games ▸</button>' +
      '<div class="start-flyout" hidden role="menu">' +
      '<button type="button" class="start-item" data-open="solitaire">SOLITAIRE.EXE</button>' +
      '<button type="button" class="start-item" data-open="duckhunt">DUCKHUNT.WDGT</button>' +
      '<button type="button" class="start-item" data-open="saber">LIGHTSABER.WDGT</button>' +
      '</div></div>' +
      '<button type="button" class="start-item" data-open="hackmods">HACKMODS.EXE</button>' +
      '<div class="start-section-label">Documents</div>' +
      '<a class="start-item" role="menuitem" href="about.html">Press kit / bio</a>' +
      '<button type="button" class="start-item" data-reset-desktop>Reset Desktop</button>' +
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
      ) +
      floatShell(
        'widget-solitaire',
        'SOLITAIRE.EXE',
        '<div class="solitaire" id="solitaire-root">' +
          '<div class="sol-toolbar">' +
          '<button type="button" class="btn" id="sol-deal">Deal</button>' +
          '<button type="button" class="btn" id="sol-undo">Undo</button>' +
          '<button type="button" class="btn" id="sol-draw-mode" title="Toggle draw mode">Draw 3</button>' +
          '<span class="sol-stat" id="sol-score">Score: 0</span>' +
          '<span class="sol-stat" id="sol-moves">Moves: 0</span>' +
          '<span class="sol-stat" id="sol-time">Time: 0:00</span></div>' +
          '<div class="sol-board" id="sol-board" aria-label="Klondike Solitaire">' +
          '<div class="sol-row sol-top">' +
          '<div class="sol-stock-waste">' +
          '<button type="button" class="sol-pile sol-stock" id="sol-stock" aria-label="Stock"></button>' +
          '<div class="sol-pile sol-waste" id="sol-waste" aria-label="Waste"></div></div>' +
          '<div class="sol-foundations" id="sol-foundations"></div></div>' +
          '<div class="sol-tableau" id="sol-tableau"></div></div>' +
          '<p class="muted sol-msg" id="sol-msg">Klondike — drag cards to move, or click to select. Double-click sends to foundation.</p>' +
          '</div>'
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
      '<div class="title-bar-controls">' +
      '<button type="button" class="win-max" data-max aria-label="Maximize">&#9633;</button>' +
      '<button type="button" class="win-close" data-close aria-label="Close">&times;</button>' +
      '</div></div><div class="content">' +
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
    btn.innerHTML =
      '<span class="start-ico" aria-hidden="true">🏁</span><span class="start-label">Start</span>';
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
    var suppressDocClose = false;

    function closeAllFlyouts() {
      menu.querySelectorAll('.start-flyout').forEach(function (fly) {
        fly.hidden = true;
      });
      menu.querySelectorAll('.start-flyout-trigger').forEach(function (trig) {
        trig.setAttribute('aria-expanded', 'false');
      });
    }

    function closeMenu() {
      menu.hidden = true;
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      closeAllFlyouts();
    }
    function openMenu() {
      closeTaskbarMore();
      menu.hidden = false;
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      adjustBodyPadding();
    }
    function toggleMenu() {
      if (menu.hidden) openMenu();
      else closeMenu();
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      suppressDocClose = true;
      toggleMenu();
      setTimeout(function () {
        suppressDocClose = false;
      }, 50);
    });

    document.addEventListener('click', function (e) {
      if (suppressDocClose) return;
      if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('[data-reset-desktop]')) {
        e.preventDefault();
        resetDesktop();
        closeMenu();
        return;
      }
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
        var wrap = flyTrig.closest('.start-flyout-wrap');
        var fly = wrap ? wrap.querySelector('.start-flyout') : null;
        if (!fly) return;
        var open = fly.hidden;
        closeAllFlyouts();
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
    duckhunt: 'widget-duckhunt',
    solitaire: 'widget-solitaire'
  };

  function openWidget(name) {
    var id = widgetMap[name];
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    el.hidden = false;
    wireWindowChrome(el, { isFloat: true });
    if (!isNarrow() && !el.dataset.placed) {
      var idx = Object.keys(widgetMap).indexOf(name);
      applyStoredOrDefault(el, true, idx);
    } else if (!isNarrow()) {
      applyStoredOrDefault(el, true, Object.keys(widgetMap).indexOf(name));
    }
    focusWindow(el);
    var rec = getWinRecord(id);
    rec.hidden = false;
    saveLayoutSoon();
    if (name === 'saber') initSaber(true);
    if (name === 'duckhunt') initDuckHunt(true);
    if (name === 'solitaire') initSolitaire(false);
    if (name === 'clock') drawClockFace();
  }

  function closeWidget(el) {
    el.hidden = true;
    el.classList.remove('is-maximized');
    updateMaxButton(el);
    var rec = getWinRecord(el.id);
    rec.hidden = true;
    rec.maximized = false;
    saveLayoutSoon();
    if (el.id === 'widget-saber') {
      stopSaberHum();
    }
    if (el.id === 'widget-duckhunt') {
      stopDuckHunt();
    }
    if (el.id === 'widget-solitaire') {
      stopSolitaireTimer();
    }
  }

  function wireFloatWindows() {
    document.querySelectorAll('.float-window').forEach(function (win) {
      wireWindowChrome(win, { isFloat: true });
    });
  }

  function wirePageWindows() {
    if (pageWindowsWired) {
      syncFreeFloatMode();
      return;
    }
    pageWindowsWired = true;
    syncFreeFloatMode();
    window.addEventListener('hashchange', revealHashTarget);
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#window-"]');
      if (!link) return;
      var id = (link.getAttribute('href') || '').slice(1);
      var el = document.getElementById(id);
      if (el && el.classList.contains('window') && isFreeFloatActive()) {
        showPageWindow(el);
      }
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

  /* ---- SOLITAIRE.EXE (Klondike) ---- */

  var SOL_SUITS = ['S', 'H', 'D', 'C'];
  var SOL_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  var SOL_SYMBOLS = { S: '♠', H: '♥', D: '♦', C: '♣' };
  var SOL_RED = { H: true, D: true, S: false, C: false };
  var SOL_DRAW_KEY = 'comedy-solitaire-draw';

  function solRankLabel(r) {
    if (r === 1) return 'A';
    if (r === 11) return 'J';
    if (r === 12) return 'Q';
    if (r === 13) return 'K';
    return String(r);
  }

  function solCloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function solNewDeck() {
    var deck = [];
    var i;
    var j;
    for (i = 0; i < SOL_SUITS.length; i++) {
      for (j = 0; j < SOL_RANKS.length; j++) {
        deck.push({
          suit: SOL_SUITS[i],
          rank: SOL_RANKS[j],
          faceUp: false,
          id: SOL_SUITS[i] + SOL_RANKS[j]
        });
      }
    }
    for (i = deck.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      var t = deck[i];
      deck[i] = deck[j];
      deck[j] = t;
    }
    return deck;
  }

  function solIsRed(card) {
    return !!SOL_RED[card.suit];
  }

  function solCanStackTableau(moving, onto) {
    if (!onto) return moving.rank === 13;
    return solIsRed(moving) !== solIsRed(onto) && moving.rank === onto.rank - 1;
  }

  function solCanStackFoundation(moving, onto) {
    if (!onto) return moving.rank === 1;
    return moving.suit === onto.suit && moving.rank === onto.rank + 1;
  }

  function stopSolitaireTimer() {
    if (solitaireState && solitaireState.timerId) {
      clearInterval(solitaireState.timerId);
      solitaireState.timerId = null;
    }
  }

  function startSolitaireTimer() {
    if (!solitaireState || solitaireState.won || solitaireState.timerId) return;
    solitaireState.started = true;
    solitaireState.timerId = setInterval(function () {
      if (!solitaireState || solitaireState.won) return;
      var win = document.getElementById('widget-solitaire');
      if (!win || win.hidden) return;
      solitaireState.elapsed += 1;
      solUpdateHud();
    }, 1000);
  }

  function solFormatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function solUpdateHud() {
    if (!solitaireState) return;
    var scoreEl = document.getElementById('sol-score');
    var movesEl = document.getElementById('sol-moves');
    var timeEl = document.getElementById('sol-time');
    var modeBtn = document.getElementById('sol-draw-mode');
    if (scoreEl) scoreEl.textContent = 'Score: ' + solitaireState.score;
    if (movesEl) movesEl.textContent = 'Moves: ' + solitaireState.moves;
    if (timeEl) timeEl.textContent = 'Time: ' + solFormatTime(solitaireState.elapsed);
    if (modeBtn) modeBtn.textContent = 'Draw ' + solitaireState.drawCount;
  }

  function solSetMsg(text) {
    var msg = document.getElementById('sol-msg');
    if (msg) msg.textContent = text;
  }

  function solPushUndo() {
    if (!solitaireState) return;
    solitaireState.undo.push({
      stock: solCloneState(solitaireState.stock),
      waste: solCloneState(solitaireState.waste),
      foundations: solCloneState(solitaireState.foundations),
      tableau: solCloneState(solitaireState.tableau),
      score: solitaireState.score,
      moves: solitaireState.moves
    });
    if (solitaireState.undo.length > 40) solitaireState.undo.shift();
  }

  function solCardHtml(card, opts) {
    opts = opts || {};
    var classes = 'sol-card';
    if (!card.faceUp) classes += ' is-back';
    else classes += solIsRed(card) ? ' is-red' : ' is-black';
    if (opts.selected) classes += ' is-selected';
    if (opts.offset) classes += ' is-stacked';
    var style = opts.offset ? ' style="top:' + opts.offset + 'px"' : '';
    var label = card.faceUp
      ? solRankLabel(card.rank) + SOL_SYMBOLS[card.suit]
      : '';
    var aria = card.faceUp
      ? solRankLabel(card.rank) + ' of ' + card.suit
      : 'Face down';
    return (
      '<div class="' +
      classes +
      '" data-card="' +
      card.id +
      '" role="button" tabindex="0" aria-label="' +
      aria +
      '"' +
      style +
      '>' +
      (card.faceUp
        ? '<span class="sol-corner sol-tl">' +
          solRankLabel(card.rank) +
          '<br>' +
          SOL_SYMBOLS[card.suit] +
          '</span>' +
          '<span class="sol-pip">' +
          SOL_SYMBOLS[card.suit] +
          '</span>' +
          '<span class="sol-corner sol-br">' +
          solRankLabel(card.rank) +
          '<br>' +
          SOL_SYMBOLS[card.suit] +
          '</span>'
        : '<span class="sol-back-pattern" aria-hidden="true"></span>') +
      '<span class="sol-sr-only">' +
      label +
      '</span></div>'
    );
  }

  function solFindCard(cardId) {
    var i;
    var j;
    var pile;
    for (i = 0; i < solitaireState.waste.length; i++) {
      if (solitaireState.waste[i].id === cardId) {
        return { zone: 'waste', pile: 0, index: i, card: solitaireState.waste[i] };
      }
    }
    for (i = 0; i < 4; i++) {
      pile = solitaireState.foundations[i];
      for (j = 0; j < pile.length; j++) {
        if (pile[j].id === cardId) {
          return { zone: 'foundation', pile: i, index: j, card: pile[j] };
        }
      }
    }
    for (i = 0; i < 7; i++) {
      pile = solitaireState.tableau[i];
      for (j = 0; j < pile.length; j++) {
        if (pile[j].id === cardId) {
          return { zone: 'tableau', pile: i, index: j, card: pile[j] };
        }
      }
    }
    return null;
  }

  function solGetRunFromTableau(col, index) {
    var pile = solitaireState.tableau[col];
    if (!pile[index] || !pile[index].faceUp) return null;
    var run = pile.slice(index);
    var k;
    for (k = 0; k < run.length - 1; k++) {
      if (!solCanStackTableau(run[k + 1], run[k])) return null;
    }
    return run;
  }

  function solRender() {
    if (!solitaireState) return;
    var stockEl = document.getElementById('sol-stock');
    var wasteEl = document.getElementById('sol-waste');
    var foundationsEl = document.getElementById('sol-foundations');
    var tableauEl = document.getElementById('sol-tableau');
    var sel = solitaireState.selection;
    var i;
    var j;
    var pile;
    var html;
    var card;
    var isSel;
    var overlap = isNarrow() ? 18 : 22;

    if (stockEl) {
      stockEl.innerHTML = solitaireState.stock.length
        ? '<div class="sol-card is-back sol-stock-card"><span class="sol-back-pattern"></span></div>'
        : '<div class="sol-slot-empty sol-recycle" title="Recycle waste">↻</div>';
      stockEl.classList.toggle('is-empty', !solitaireState.stock.length);
    }

    if (wasteEl) {
      html = '';
      var wasteStart = Math.max(0, solitaireState.waste.length - solitaireState.drawCount);
      var wasteVisible = solitaireState.waste.slice(wasteStart);
      for (i = 0; i < wasteVisible.length; i++) {
        card = wasteVisible[i];
        isSel =
          sel &&
          sel.zone === 'waste' &&
          sel.cards.length === 1 &&
          sel.cards[0].id === card.id;
        html += solCardHtml(card, {
          selected: isSel,
          offset: i * (isNarrow() ? 14 : 18)
        });
      }
      if (!wasteVisible.length) html = '<div class="sol-slot-empty"></div>';
      wasteEl.innerHTML = html;
    }

    if (foundationsEl) {
      html = '';
      for (i = 0; i < 4; i++) {
        pile = solitaireState.foundations[i];
        html += '<div class="sol-pile sol-foundation" data-foundation="' + i + '" aria-label="Foundation ' + (i + 1) + '">';
        if (pile.length) {
          card = pile[pile.length - 1];
          isSel =
            sel &&
            sel.zone === 'foundation' &&
            sel.pile === i &&
            sel.cards[0].id === card.id;
          html += solCardHtml(card, { selected: isSel });
        } else {
          html +=
            '<div class="sol-slot-empty">' +
            SOL_SYMBOLS[SOL_SUITS[i]] +
            '</div>';
        }
        html += '</div>';
      }
      foundationsEl.innerHTML = html;
    }

    if (tableauEl) {
      html = '';
      for (i = 0; i < 7; i++) {
        pile = solitaireState.tableau[i];
        html += '<div class="sol-pile sol-column" data-tableau="' + i + '" aria-label="Tableau ' + (i + 1) + '">';
        if (!pile.length) {
          html += '<div class="sol-slot-empty sol-king-slot">K</div>';
        } else {
          for (j = 0; j < pile.length; j++) {
            card = pile[j];
            isSel =
              sel &&
              sel.zone === 'tableau' &&
              sel.pile === i &&
              j >= sel.index;
            html += solCardHtml(card, {
              selected: isSel,
              offset: j * overlap
            });
          }
        }
        html += '</div>';
      }
      tableauEl.innerHTML = html;
    }

    solUpdateHud();
  }

  function solCheckWin() {
    var i;
    for (i = 0; i < 4; i++) {
      if (solitaireState.foundations[i].length !== 13) return false;
    }
    return true;
  }

  function solCelebrate() {
    solitaireState.won = true;
    stopSolitaireTimer();
    solitaireState.score += 200;
    solSetMsg('You win! Deal again for another round — document the craft.');
    playBeep(523, 0.08, 'square');
    setTimeout(function () {
      playBeep(659, 0.08, 'square');
    }, 100);
    setTimeout(function () {
      playBeep(784, 0.12, 'square');
    }, 200);
    solUpdateHud();
  }

  function solFlipTop(col) {
    var pile = solitaireState.tableau[col];
    if (pile.length && !pile[pile.length - 1].faceUp) {
      pile[pile.length - 1].faceUp = true;
      solitaireState.score += 5;
    }
  }

  function solClearSelection() {
    solitaireState.selection = null;
  }

  function solTryMoveToFoundation(loc) {
    if (!loc || !loc.card.faceUp) return false;
    if (loc.zone === 'tableau') {
      var pile = solitaireState.tableau[loc.pile];
      if (loc.index !== pile.length - 1) return false;
    }
    if (loc.zone === 'waste' && loc.index !== solitaireState.waste.length - 1) return false;
    if (loc.zone === 'foundation') return false;

    var f;
    var onto;
    for (f = 0; f < 4; f++) {
      onto = solitaireState.foundations[f].length
        ? solitaireState.foundations[f][solitaireState.foundations[f].length - 1]
        : null;
      if (solCanStackFoundation(loc.card, onto)) {
        solPushUndo();
        startSolitaireTimer();
        var card;
        if (loc.zone === 'waste') card = solitaireState.waste.pop();
        else {
          card = solitaireState.tableau[loc.pile].pop();
          solFlipTop(loc.pile);
        }
        solitaireState.foundations[f].push(card);
        solitaireState.moves += 1;
        solitaireState.score += 10;
        solClearSelection();
        if (solCheckWin()) solCelebrate();
        else solSetMsg('To foundation.');
        solRender();
        playBeep(440, 0.04, 'triangle');
        return true;
      }
    }
    return false;
  }

  function solMoveSelectionTo(destZone, destPile) {
    var sel = solitaireState.selection;
    if (!sel) return false;
    var moving = sel.cards[0];
    var onto = null;
    var destArr = null;

    if (destZone === 'foundation') {
      if (sel.cards.length !== 1) return false;
      destArr = solitaireState.foundations[destPile];
      onto = destArr.length ? destArr[destArr.length - 1] : null;
      if (!solCanStackFoundation(moving, onto)) return false;
    } else if (destZone === 'tableau') {
      destArr = solitaireState.tableau[destPile];
      onto = destArr.length ? destArr[destArr.length - 1] : null;
      if (!solCanStackTableau(moving, onto)) return false;
      if (sel.zone === 'tableau' && sel.pile === destPile) {
        solClearSelection();
        solRender();
        return true;
      }
    } else {
      return false;
    }

    solPushUndo();
    startSolitaireTimer();

    var moved;
    if (sel.zone === 'waste') {
      moved = [solitaireState.waste.pop()];
    } else if (sel.zone === 'foundation') {
      moved = [solitaireState.foundations[sel.pile].pop()];
      solitaireState.score = Math.max(0, solitaireState.score - 15);
    } else {
      moved = solitaireState.tableau[sel.pile].splice(sel.index);
      solFlipTop(sel.pile);
    }

    if (destZone === 'foundation') {
      destArr.push(moved[0]);
      solitaireState.score += 10;
    } else {
      Array.prototype.push.apply(destArr, moved);
      if (sel.zone === 'waste' || sel.zone === 'foundation') solitaireState.score += 5;
    }

    solitaireState.moves += 1;
    solClearSelection();
    if (solCheckWin()) solCelebrate();
    else solSetMsg('Moved.');
    solRender();
    playBeep(330, 0.035, 'triangle');
    return true;
  }

  function solSelectFrom(loc) {
    if (!loc || !loc.card.faceUp) {
      solClearSelection();
      solRender();
      return;
    }
    if (loc.zone === 'waste' && loc.index !== solitaireState.waste.length - 1) {
      solClearSelection();
      solRender();
      return;
    }
    if (loc.zone === 'foundation' && loc.index !== solitaireState.foundations[loc.pile].length - 1) {
      solClearSelection();
      solRender();
      return;
    }

    var cards;
    if (loc.zone === 'tableau') {
      cards = solGetRunFromTableau(loc.pile, loc.index);
      if (!cards) {
        solClearSelection();
        solRender();
        return;
      }
    } else {
      cards = [loc.card];
    }

    solitaireState.selection = {
      zone: loc.zone,
      pile: loc.pile,
      index: loc.index,
      cards: cards
    };
    solSetMsg('Selected — click a pile to move.');
    solRender();
  }

  function solOnStockClick() {
    if (solitaireState.won) return;
    startSolitaireTimer();
    solPushUndo();
    solClearSelection();

    if (solitaireState.stock.length) {
      var n = Math.min(solitaireState.drawCount, solitaireState.stock.length);
      var i;
      for (i = 0; i < n; i++) {
        var c = solitaireState.stock.pop();
        c.faceUp = true;
        solitaireState.waste.push(c);
      }
      solitaireState.moves += 1;
      if (solitaireState.drawCount === 3) solitaireState.score = Math.max(0, solitaireState.score - 1);
      solSetMsg('Drew ' + n + '.');
      playBeep(280, 0.03, 'square');
    } else if (solitaireState.waste.length) {
      while (solitaireState.waste.length) {
        var back = solitaireState.waste.pop();
        back.faceUp = false;
        solitaireState.stock.push(back);
      }
      solitaireState.moves += 1;
      solitaireState.score = Math.max(0, solitaireState.score - 100);
      solSetMsg('Recycled stock.');
      playBeep(180, 0.05, 'square');
    }
    solRender();
  }

  function solDeal(freshDraw) {
    stopSolitaireTimer();
    var drawCount = 3;
    try {
      var saved = localStorage.getItem(SOL_DRAW_KEY);
      if (saved === '1' || saved === '3') drawCount = parseInt(saved, 10);
    } catch (e) {}
    if (freshDraw === 1 || freshDraw === 3) drawCount = freshDraw;

    var deck = solNewDeck();
    var tableau = [[], [], [], [], [], [], []];
    var i;
    var j;
    for (i = 0; i < 7; i++) {
      for (j = 0; j <= i; j++) {
        var card = deck.pop();
        card.faceUp = j === i;
        tableau[i].push(card);
      }
    }

    solitaireState = {
      stock: deck,
      waste: [],
      foundations: [[], [], [], []],
      tableau: tableau,
      drawCount: drawCount,
      score: 0,
      moves: 0,
      elapsed: 0,
      started: false,
      won: false,
      selection: null,
      undo: [],
      timerId: null
    };
    solSetMsg(
      'Klondike — drag cards to move, or click to select. Double-click sends to foundation.'
    );
    solRender();
  }

  function solUndo() {
    if (!solitaireState || !solitaireState.undo.length || solitaireState.won) {
      solSetMsg('Nothing to undo.');
      return;
    }
    var prev = solitaireState.undo.pop();
    solitaireState.stock = prev.stock;
    solitaireState.waste = prev.waste;
    solitaireState.foundations = prev.foundations;
    solitaireState.tableau = prev.tableau;
    solitaireState.score = prev.score;
    solitaireState.moves = prev.moves;
    solClearSelection();
    solSetMsg('Undone.');
    solRender();
    playBeep(200, 0.04, 'triangle');
  }

  function solToggleDrawMode() {
    if (!solitaireState) return;
    var next = solitaireState.drawCount === 3 ? 1 : 3;
    try {
      localStorage.setItem(SOL_DRAW_KEY, String(next));
    } catch (e) {}
    solDeal(next);
    solSetMsg('New deal — draw ' + next + '.');
  }

  var solDrag = null;
  var SOL_DRAG_THRESHOLD = 6;

  function solClearDropTargets() {
    document.querySelectorAll('.sol-pile.is-drop-target').forEach(function (el) {
      el.classList.remove('is-drop-target');
    });
  }

  function solRemoveGhost() {
    var ghost = document.getElementById('sol-drag-ghost');
    if (ghost) ghost.remove();
    document.querySelectorAll('.sol-card.is-drag-source').forEach(function (el) {
      el.classList.remove('is-drag-source');
    });
    solClearDropTargets();
  }

  function solBuildGhost(cards, clientX, clientY) {
    solRemoveGhost();
    var ghost = document.createElement('div');
    ghost.id = 'sol-drag-ghost';
    ghost.className = 'sol-drag-ghost';
    var overlap = isNarrow() ? 18 : 22;
    var html = '';
    var i;
    for (i = 0; i < cards.length; i++) {
      html += solCardHtml(cards[i], { offset: i * overlap });
    }
    ghost.innerHTML = html;
    document.body.appendChild(ghost);
    solPositionGhost(ghost, clientX, clientY);
    return ghost;
  }

  function solPositionGhost(ghost, clientX, clientY) {
    if (!ghost) return;
    ghost.style.left = clientX - 20 + 'px';
    ghost.style.top = clientY - 10 + 'px';
  }

  function solHitPile(clientX, clientY) {
    var el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    var foundation = el.closest('[data-foundation]');
    if (foundation) {
      return {
        zone: 'foundation',
        pile: parseInt(foundation.getAttribute('data-foundation'), 10)
      };
    }
    var tableau = el.closest('[data-tableau]');
    if (tableau) {
      return {
        zone: 'tableau',
        pile: parseInt(tableau.getAttribute('data-tableau'), 10)
      };
    }
    return null;
  }

  function solUpdateDropHighlight(clientX, clientY) {
    solClearDropTargets();
    var hit = solHitPile(clientX, clientY);
    if (!hit || !solitaireState || !solitaireState.selection) return;
    var sel = solitaireState.selection;
    var moving = sel.cards[0];
    var destArr;
    var onto;
    if (hit.zone === 'foundation') {
      if (sel.cards.length !== 1) return;
      destArr = solitaireState.foundations[hit.pile];
      onto = destArr.length ? destArr[destArr.length - 1] : null;
      if (!solCanStackFoundation(moving, onto)) return;
    } else {
      destArr = solitaireState.tableau[hit.pile];
      onto = destArr.length ? destArr[destArr.length - 1] : null;
      if (!solCanStackTableau(moving, onto)) return;
    }
    var selEl =
      hit.zone === 'foundation'
        ? document.querySelector('[data-foundation="' + hit.pile + '"]')
        : document.querySelector('[data-tableau="' + hit.pile + '"]');
    if (selEl) selEl.classList.add('is-drop-target');
  }

  function solEndDrag(clientX, clientY, didDrag) {
    if (!solDrag) return;
    var ghost = document.getElementById('sol-drag-ghost');
    solRemoveGhost();
    var active = solDrag;
    solDrag = null;
    setInteractLock(false);

    if (!didDrag || !solitaireState || solitaireState.won) {
      if (ghost) ghost.remove();
      return;
    }

    var hit = solHitPile(clientX, clientY);
    if (hit && solitaireState.selection) {
      if (solMoveSelectionTo(hit.zone, hit.pile)) return;
    }
    solClearSelection();
    solRender();
    solSetMsg('Invalid drop.');
  }

  function solWireCardDrag(root) {
    root.addEventListener('pointerdown', function (e) {
      if (!solitaireState || solitaireState.won) return;
      if (e.button != null && e.button !== 0) return;
      var cardEl = e.target.closest('[data-card]');
      if (!cardEl || !root.contains(cardEl)) return;
      if (e.target.closest('#sol-stock')) return;

      var loc = solFindCard(cardEl.getAttribute('data-card'));
      if (!loc || !loc.card.faceUp) return;
      if (loc.zone === 'waste' && loc.index !== solitaireState.waste.length - 1) return;
      if (loc.zone === 'foundation' && loc.index !== solitaireState.foundations[loc.pile].length - 1) {
        return;
      }

      var cards;
      if (loc.zone === 'tableau') {
        cards = solGetRunFromTableau(loc.pile, loc.index);
        if (!cards) return;
      } else {
        cards = [loc.card];
      }

      solitaireState.selection = {
        zone: loc.zone,
        pile: loc.pile,
        index: loc.index,
        cards: cards
      };

      solDrag = {
        pointerId: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        didDrag: false,
        cardIds: cards.map(function (c) {
          return c.id;
        }),
        target: cardEl
      };
      try {
        cardEl.setPointerCapture(e.pointerId);
      } catch (err) {}
    });

    root.addEventListener('pointermove', function (e) {
      if (!solDrag || e.pointerId !== solDrag.pointerId) return;
      var dx = e.clientX - solDrag.sx;
      var dy = e.clientY - solDrag.sy;
      if (!solDrag.didDrag) {
        if (Math.hypot(dx, dy) < SOL_DRAG_THRESHOLD) return;
        solDrag.didDrag = true;
        setInteractLock(true);
        solDrag.cardIds.forEach(function (id) {
          var el = root.querySelector('[data-card="' + id + '"]');
          if (el) el.classList.add('is-drag-source');
        });
        solBuildGhost(solitaireState.selection.cards, e.clientX, e.clientY);
        solSetMsg('Dragging…');
      }
      solPositionGhost(document.getElementById('sol-drag-ghost'), e.clientX, e.clientY);
      solUpdateDropHighlight(e.clientX, e.clientY);
    });

    root.addEventListener('pointerup', function (e) {
      if (!solDrag || e.pointerId !== solDrag.pointerId) return;
      var didDrag = solDrag.didDrag;
      solEndDrag(e.clientX, e.clientY, didDrag);
      if (didDrag) {
        root.dataset.skipClick = '1';
        setTimeout(function () {
          delete root.dataset.skipClick;
        }, 0);
      }
    });

    root.addEventListener('pointercancel', function (e) {
      if (!solDrag || e.pointerId !== solDrag.pointerId) return;
      solEndDrag(e.clientX, e.clientY, false);
      solClearSelection();
      solRender();
    });
  }

  function initSolitaire(redeal) {
    var root = document.getElementById('solitaire-root');
    if (!root) return;

    if (redeal || !solitaireState) {
      solDeal();
    } else {
      solRender();
      if (solitaireState.started && !solitaireState.won && !solitaireState.timerId) {
        startSolitaireTimer();
      }
    }

    if (root.dataset.wired) return;
    root.dataset.wired = '1';

    document.getElementById('sol-deal').addEventListener('click', function () {
      solDeal(solitaireState ? solitaireState.drawCount : undefined);
      playBeep(360, 0.05, 'square');
    });
    document.getElementById('sol-undo').addEventListener('click', solUndo);
    document.getElementById('sol-draw-mode').addEventListener('click', solToggleDrawMode);

    document.getElementById('sol-stock').addEventListener('click', function (e) {
      e.preventDefault();
      solOnStockClick();
    });

    solWireCardDrag(root);

    root.addEventListener('click', function (e) {
      if (root.dataset.skipClick) return;
      if (!solitaireState || solitaireState.won) return;
      var cardEl = e.target.closest('[data-card]');
      var foundation = e.target.closest('[data-foundation]');
      var tableau = e.target.closest('[data-tableau]');
      var waste = e.target.closest('#sol-waste');

      if (cardEl) {
        var loc = solFindCard(cardEl.getAttribute('data-card'));
        if (!loc) return;

        if (solitaireState.selection) {
          if (
            solitaireState.selection.cards.some(function (c) {
              return c.id === loc.card.id;
            })
          ) {
            if (solTryMoveToFoundation(loc)) return;
            solClearSelection();
            solRender();
            return;
          }
          if (loc.zone === 'foundation') {
            if (solMoveSelectionTo('foundation', loc.pile)) return;
          }
          if (loc.zone === 'tableau') {
            if (solMoveSelectionTo('tableau', loc.pile)) return;
          }
        }
        solSelectFrom(loc);
        return;
      }

      if (solitaireState.selection) {
        if (foundation) {
          solMoveSelectionTo('foundation', parseInt(foundation.getAttribute('data-foundation'), 10));
          return;
        }
        if (tableau) {
          solMoveSelectionTo('tableau', parseInt(tableau.getAttribute('data-tableau'), 10));
          return;
        }
      }

      if (!cardEl && !foundation && !tableau && !waste) {
        solClearSelection();
        solRender();
      }
    });

    root.addEventListener('dblclick', function (e) {
      if (!solitaireState || solitaireState.won) return;
      var cardEl = e.target.closest('[data-card]');
      if (!cardEl) return;
      e.preventDefault();
      var loc = solFindCard(cardEl.getAttribute('data-card'));
      if (loc) solTryMoveToFoundation(loc);
    });

    root.addEventListener('keydown', function (e) {
      if (!solitaireState || solitaireState.won) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var cardEl = e.target.closest('[data-card]');
      if (!cardEl) return;
      e.preventDefault();
      var loc = solFindCard(cardEl.getAttribute('data-card'));
      if (!loc) return;
      if (solitaireState.selection) {
        if (loc.zone === 'tableau' && solMoveSelectionTo('tableau', loc.pile)) return;
        if (loc.zone === 'foundation' && solMoveSelectionTo('foundation', loc.pile)) return;
      }
      solSelectFrom(loc);
    });
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

  function closeTaskbarMore() {
    var fly = document.getElementById('taskbar-more-flyout');
    var btn = document.getElementById('taskbar-more-btn');
    if (fly) fly.hidden = true;
    if (btn) {
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function isTaskbarPrimaryApp(el) {
    if (el.classList.contains('is-current')) return true;
    var href = (el.getAttribute('href') || '').toLowerCase();
    var file = href.split('#')[0];
    if (file.indexOf('clips.html') !== -1) return true;
    if (file.indexOf('about.html') !== -1) return true;
    if (file.indexOf('shows.html') !== -1 && href.indexOf('#') === -1) return true;
    return false;
  }

  function decorateAppLabel(el) {
    if (el.querySelector('.app-label')) return;
    var text = (el.textContent || '').trim();
    if (!text) return;
    var parts = text.split(/\s+/);
    var ico = parts[0];
    var label = parts.slice(1).join(' ');
    if (!label) {
      el.innerHTML = '<span class="app-label">' + text + '</span>';
      return;
    }
    el.innerHTML =
      '<span class="app-ico" aria-hidden="true">' +
      ico +
      '</span><span class="app-label">' +
      label +
      '</span>';
  }

  function wireTaskbarOverflow() {
    var apps = document.querySelector('.taskbar-apps');
    var taskbar = document.querySelector('.taskbar');
    if (!apps || !taskbar || apps.dataset.overflowWired) return;
    apps.dataset.overflowWired = '1';

    var links = Array.prototype.slice.call(apps.querySelectorAll('a.active-app'));
    links.forEach(decorateAppLabel);

    var wrap = document.createElement('div');
    wrap.className = 'taskbar-overflow';
    wrap.innerHTML =
      '<button type="button" class="active-app taskbar-more-btn" id="taskbar-more-btn" aria-haspopup="true" aria-expanded="false" title="More pages">' +
      '<span class="app-ico" aria-hidden="true">☰</span><span class="app-label">Apps</span></button>';

    // Portal flyout to body so it can never stretch the fixed taskbar flex row
    var flyout = document.createElement('div');
    flyout.className = 'taskbar-more-flyout';
    flyout.id = 'taskbar-more-flyout';
    flyout.hidden = true;
    flyout.setAttribute('role', 'menu');
    flyout.setAttribute('aria-label', 'Site pages');
    document.body.appendChild(flyout);

    var moreBtn = wrap.querySelector('#taskbar-more-btn');
    var desktopSlot = document.createElement('div');
    desktopSlot.className = 'taskbar-secondary';

    var primary = [];
    var secondary = [];
    links.forEach(function (el) {
      if (isTaskbarPrimaryApp(el)) primary.push(el);
      else secondary.push(el);
    });

    secondary.forEach(function (el) {
      el.classList.add('active-app--secondary');
    });

    apps.innerHTML = '';
    primary.forEach(function (el) {
      apps.appendChild(el);
    });
    apps.appendChild(desktopSlot);
    apps.appendChild(wrap);

    var suppressDocClose = false;

    function taskbarOverflows() {
      if (taskbar.scrollWidth > taskbar.clientWidth + 2) return true;
      var tray = taskbar.querySelector('.system-tray');
      if (!tray) return false;
      var trayLeft = tray.getBoundingClientRect().left;
      var nodes = taskbar.querySelectorAll('.start-btn, .taskbar-apps .active-app, .taskbar-overflow');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.hidden || el.offsetParent === null) continue;
        var right = el.getBoundingClientRect().right;
        if (right > trayLeft - 2) return true;
      }
      return false;
    }

    function applyPlacement(compact, mobile) {
      taskbar.classList.toggle('is-compact', compact);
      taskbar.classList.toggle('is-mobile-nav', mobile);

      if (!compact) {
        closeTaskbarMore();
        primary.forEach(function (el) {
          if (el.parentNode !== apps) apps.insertBefore(el, desktopSlot);
        });
        secondary.forEach(function (el) {
          if (el.parentNode !== desktopSlot) desktopSlot.appendChild(el);
        });
        desktopSlot.hidden = false;
        wrap.classList.remove('is-active');
        moreBtn.querySelector('.app-label').textContent = 'More';
      } else if (mobile) {
        // Phone: keep bar minimal — Start + Apps + clock
        primary.concat(secondary).forEach(function (el) {
          if (el.parentNode !== flyout) flyout.appendChild(el);
        });
        desktopSlot.hidden = true;
        wrap.classList.add('is-active');
        moreBtn.querySelector('.app-label').textContent = 'Apps';
      } else {
        // Tablet: keep primary destinations, overflow the rest
        primary.forEach(function (el) {
          if (el.parentNode !== apps) apps.insertBefore(el, desktopSlot);
        });
        secondary.forEach(function (el) {
          if (el.parentNode !== flyout) flyout.appendChild(el);
        });
        desktopSlot.hidden = true;
        wrap.classList.add('is-active');
        moreBtn.querySelector('.app-label').textContent = 'More';
      }
    }

    function syncOverflowMode() {
      var compact = isCompact();
      var mobile = isNarrow();

      // Measure in a single row first so we know whether to stack
      taskbar.classList.remove('is-stacked');
      applyPlacement(compact, mobile);

      // Classic Win95: if buttons would clip, grow to a 2-row icon stack
      if (taskbarOverflows()) {
        taskbar.classList.add('is-stacked');
      }

      // Still clipping after a 2-row stack? Collapse to Apps menu
      if (!mobile && taskbarOverflows()) {
        taskbar.classList.remove('is-stacked');
        applyPlacement(true, true);
        if (taskbarOverflows()) taskbar.classList.add('is-stacked');
      }

      adjustBodyPadding();
    }

    moreBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      suppressDocClose = true;
      var open = flyout.hidden;
      var startMenu = document.getElementById('start-menu');
      var startBtn = document.getElementById('start-btn');
      if (startMenu) startMenu.hidden = true;
      if (startBtn) {
        startBtn.classList.remove('is-open');
        startBtn.setAttribute('aria-expanded', 'false');
      }
      if (open) {
        flyout.hidden = false;
        moreBtn.classList.add('is-open');
        moreBtn.setAttribute('aria-expanded', 'true');
      } else {
        closeTaskbarMore();
      }
      setTimeout(function () {
        suppressDocClose = false;
      }, 50);
    });

    flyout.addEventListener('click', function (e) {
      if (e.target.closest('a.active-app')) closeTaskbarMore();
    });

    document.addEventListener('click', function (e) {
      if (suppressDocClose) return;
      if (!flyout.hidden && !flyout.contains(e.target) && !wrap.contains(e.target)) {
        closeTaskbarMore();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeTaskbarMore();
    });

    syncOverflowMode();
    window.addEventListener('resize', syncOverflowMode);
  }

  function adjustBodyPadding() {
    var tb = document.querySelector('.taskbar');
    if (!tb) return;
    // Prefer the pinned chrome height; clamp so a leaked in-flow menu can't
    // blow out --taskbar-h and shove overlays off-screen.
    // Allow up to ~3 classic taskbar rows when is-stacked on tiny screens.
    var h = Math.round(tb.getBoundingClientRect().height) || 48;
    var stacked = tb.classList.contains('is-stacked');
    var maxH = stacked ? 140 : 56;
    if (h > maxH) h = stacked ? 120 : 52;
    document.body.style.paddingBottom = Math.max(100, h + 24) + 'px';
    document.documentElement.style.setProperty('--taskbar-h', h + 'px');
    var menu = document.getElementById('start-menu');
    if (menu) menu.style.bottom = h + 'px';
    document.querySelectorAll('.float-window').forEach(function (w) {
      if (isNarrow()) w.style.bottom = h + 'px';
    });
  }

  function onViewportChange() {
    adjustBodyPadding();
    syncFreeFloatMode();
    clampAllWindowsIntoView();
  }

  function init() {
    injectMarkup();
    wireStartButton();
    wireTaskbarOverflow();
    wireFloatWindows();
    wirePageWindows();
    wireNotepad();
    wireCalc();
    wireVolume();
    wireOpenHackmodsButtons();
    tickClocks();
    setInterval(tickClocks, 1000);
    onViewportChange();
    revealHashTarget();
    window.addEventListener('resize', onViewportChange);

    window.ComedyDesktop = {
      openWidget: openWidget,
      resetDesktop: resetDesktop,
      closeMenu: function () {
        var menu = document.getElementById('start-menu');
        var btn = document.getElementById('start-btn');
        if (menu) menu.hidden = true;
        if (btn) {
          btn.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        }
        closeTaskbarMore();
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
