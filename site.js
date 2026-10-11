/*
 * COMEDY.EXE — content + shell behaviour.
 * Renders everything in site-data.js into the pages, and owns the Win95
 * touches that aren't window management (that's desktop.js): pixel icons,
 * message boxes, the boot screen, display settings.
 */
(function () {
  'use strict';

  var SITE = window.SITE || { clips: [], shorts: [], shows: [], socials: {}, tags: {} };
  var DISPLAY_KEY = 'comedy-display';
  var BOOT_KEY = 'comedy-boot';
  var root = document.documentElement;
  root.classList.add('js');

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function readStore(store, key) {
    try {
      return store.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeStore(store, key, value) {
    try {
      store.setItem(key, value);
    } catch (e) {}
  }

  function beep(freq, dur) {
    if (window.ComedyDesktop && window.ComedyDesktop.beep) window.ComedyDesktop.beep(freq, dur);
  }

  /* ---------- derived data ---------- */

  function isNumberedSet(clip) {
    return typeof clip.set === 'number';
  }

  var setCount = SITE.clips.reduce(function (max, clip) {
    return isNumberedSet(clip) && clip.set > max ? clip.set : max;
  }, 0);

  function clipLabel(clip) {
    return isNumberedSet(clip) ? 'Set #' + clip.set : String(clip.set);
  }

  function clipHeading(clip) {
    if (clip.title === clipLabel(clip)) return clip.title;
    return clip.title + ' (' + (isNumberedSet(clip) ? '#' : '') + clip.set + ')';
  }

  function clipVenue(clip) {
    return clip.venue || (SITE.rooms && SITE.rooms[clip.room]) || '';
  }

  function findClipById(id) {
    for (var i = 0; i < SITE.clips.length; i++) {
      if (SITE.clips[i].id === id) return SITE.clips[i];
    }
    return null;
  }

  function findClip(set) {
    var want = String(set).toLowerCase();
    for (var i = 0; i < SITE.clips.length; i++) {
      if (String(SITE.clips[i].set).toLowerCase() === want) return SITE.clips[i];
    }
    return null;
  }

  function latestClip() {
    return findClip(setCount) || SITE.clips[0] || null;
  }

  function lengthSeconds(clip) {
    if (!clip.length) return 0;
    return clip.length.split(':').reduce(function (total, part) {
      return total * 60 + Number(part);
    }, 0);
  }

  /* ---------- pixel icons ---------- */

  var PALETTE = {
    k: '#000000', w: '#ffffff', g: '#808080', s: '#c0c0c0', n: '#000080', b: '#0000ff',
    c: '#00ffff', t: '#008080', r: '#ff0000', m: '#800000', y: '#ffff00', o: '#808000',
    l: '#00ff00', d: '#008000'
  };

  // 16×16, one character per pixel, '.' is transparent.
  var ICONS = {
    mic: [
      '......kkkk......', '.....kssswk.....', '....kswswswk....', '....ksgsgsgk....',
      '....kswswswk....', '....ksgsgsgk....', '.....kssssk.....', '......kkkk......',
      '......kggk......', '......kggk......', '......kggk......', '......kggk......',
      '......kggk......', '....kkkggkkk....', '...kssssssssk...', '...kkkkkkkkkk...'
    ],
    doc: [
      '..kkkkkkkkk.....', '..kwwwwwwwkk....', '..kwwwwwwwkwk...', '..kwwwwwwwkkkk..',
      '..kwwwwwwwwwwk..', '..kwnnnnnnnwwk..', '..kwwwwwwwwwwk..', '..kwnnnnnnnnwk..',
      '..kwwwwwwwwwwk..', '..kwnnnnnnwwwk..', '..kwwwwwwwwwwk..', '..kwnnnnnnnnwk..',
      '..kwwwwwwwwwwk..', '..kwwwwwwwwwwk..', '..kkkkkkkkkkkk..', '................'
    ],
    film: [
      '................', 'kkkkkkkkkkkkkkkk', 'kwkkwkkwkkwkkwkk', 'kkkkkkkkkkkkkkkk',
      'knnnnnnnnnnnnnnk', 'knnnnnnwnnnnnnnk', 'knnnnnnwwnnnnnnk', 'knnnnnnwwwnnnnnk',
      'knnnnnnwwwwnnnnk', 'knnnnnnwwwnnnnnk', 'knnnnnnwwnnnnnnk', 'knnnnnnwnnnnnnnk',
      'kkkkkkkkkkkkkkkk', 'kwkkwkkwkkwkkwkk', 'kkkkkkkkkkkkkkkk', '................'
    ],
    phone: [
      '....kkkkkkkk....', '...kkkkggkkkk...', '...kcccccccck...', '...kcccccccck...',
      '...kccrccccck...', '...kccrrcccck...', '...kccrrrccck...', '...kccrrrrcck...',
      '...kccrrrccck...', '...kccrrcccck...', '...kccrccccck...', '...kcccccccck...',
      '...kcccccccck...', '...kkkkkkkkkk...', '...kkkkwwkkkk...', '....kkkkkkkk....'
    ],
    calendar: [
      '................', '.kkkkkkkkkkkkkk.', '.krrrrrrrrrrrrk.', '.krrrrrrrrrrrrk.',
      '.kkkkkkkkkkkkkk.', '.kwwwwwwwwwwwwk.', '.kwkkwkkwkkwkwk.', '.kwwwwwwwwwwwwk.',
      '.kwkkwrrwkkwkwk.', '.kwwwwwwwwwwwwk.', '.kwkkwkkwkkwwwk.', '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwwwwk.', '.kkkkkkkkkkkkkk.', '..gggggggggggggg', '................'
    ],
    mail: [
      '................', '................', '................', 'kkkkkkkkkkkkkkkk',
      'kwkwwwwwwwwwwkwk', 'kwwkwwwwwwwwkwwk', 'kwwwkwwwwwwkwwwk', 'kwwwwkwwwwkwwwwk',
      'kwwwwwkkkkwwwwwk', 'kwwwkwwwwwwkwwwk', 'kwwkwwwwwwwwkwwk', 'kwkwwwwwwwwwwkwk',
      'kkkkkkkkkkkkkkkk', '................', '................', '................'
    ],
    folder: [
      '................', '................', '.kkkkk..........', 'kyyyyyk.........',
      'kyyyyyykkkkkkkk.', 'kyyyyyyyyyyyyok.', 'kyyyyyyyyyyyyok.', 'kyyyyyyyyyyyyok.',
      'kyyyyyyyyyyyyok.', 'kyyyyyyyyyyyyok.', 'kyyyyyyyyyyyyok.', 'kyyyyyyyyyyyyok.',
      'kyoooooooooooook', 'kkkkkkkkkkkkkkk.', '................', '................'
    ],
    computer: [
      '..kkkkkkkkkkkk..', '..kssssssssssk..', '..ksnnnnnnnnsk..', '..ksnlnnnnnnsk..',
      '..ksnllnnnnnsk..', '..ksnlnnnnnnsk..', '..ksnnnnnnnnsk..', '..kssssssssssk..',
      '..kkkkkkkkkkkk..', '.....kssssk.....', '..kkkkkkkkkkkk..', '.kssssssssssssk.',
      '.kswswswswswssk.', '.kssssssssssssk.', '.kkkkkkkkkkkkkk.', '................'
    ],
    play: [
      '................', '................', '................', '..rrrrrrrrrrrr..',
      '.rrrrrrrrrrrrrr.', '.rrrrrwrrrrrrrr.', '.rrrrrwwrrrrrrr.', '.rrrrrwwwrrrrrr.',
      '.rrrrrwwwwrrrrr.', '.rrrrrwwwrrrrrr.', '.rrrrrwwrrrrrrr.', '.rrrrrwrrrrrrrr.',
      '.rrrrrrrrrrrrrr.', '..rrrrrrrrrrrr..', '................', '................'
    ],
    camera: [
      '................', '................', '....kkkk........', '.kkkkkkkkkkkkkk.',
      '.ksssssssssyysk.', '.kssskkkkkksssk.', '.ksskcccccckssk.', '.ksskcwwccckssk.',
      '.ksskcwcccckssk.', '.ksskcccccckssk.', '.kssskkkkkksssk.', '.kssssssssssssk.',
      '.kkkkkkkkkkkkkk.', '................', '................', '................'
    ],
    terminal: [
      '................', 'kkkkkkkkkkkkkkkk', 'knnnnnnnnnnnsssk', 'kkkkkkkkkkkkkkkk',
      'kkkkkkkkkkkkkkkk', 'kklkkkkkkkkkkkkk', 'kkklkkkkkkkkkkkk', 'kkkklkkkkkkkkkkk',
      'kkklkkkkkkkkkkkk', 'kklkkkllllkkkkkk', 'kkkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkkk',
      'kkkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkkk', '................', '................'
    ],
    saber: [
      '..............ll', '.............lll', '............lll.', '...........lll..',
      '..........lll...', '.........lll....', '........lll.....', '.......lll......',
      '......lll.......', '.....lll........', '....kkk.........', '...kgsk.........',
      '..kgsk..........', '.kgsk...........', 'kgsk............', 'kkk.............'
    ],
    duck: [
      '................', '................', '................', '.....kkkk.......',
      '....kddddk......', '...kddwkddk.....', '.yyykddddk......', '....kddddkkkkk..',
      '...kwwwwooooook.', '..koooooooooook.', '..kooooossssook.', '...koooooooook..',
      '....kkkkkkkkk...', '......y..y......', '.....yy.yy......', '................'
    ],
    cards: [
      '................', '..kkkkkkkk......', '..kwwwwwwk......', '..kwrwwwwkkkkk..',
      '..kwwwwwwkwwwk..', '..kwwrrwwkwkwk..', '..kwrrrrwkwwwk..', '..kwwrrwwkwkwk..',
      '..kwwwwwwkkkwk..', '..kwwwwrwkkkwk..', '..kkkkkkkkwkwk..', '......kwwwwwwk..',
      '......kkkkkkkk..', '................', '................', '................'
    ],
    speaker: [
      '................', '................', '................', '................',
      '......kk........', '.....ksk..k.....', '.kkkkssk...k....', '.kssgssk.k..k...',
      '.kssgssk.k..k...', '.kkkkssk...k....', '.....ksk..k.....', '......kk........',
      '................', '................', '................', '................'
    ],
    info: [
      '................', '.....kkkkkk.....', '...kkwwwwwwkk...', '..kwwwwbbwwwwk..',
      '.kwwwwwbbwwwwwk.', '.kwwwwwwwwwwwwk.', 'kwwwwwbbbwwwwwwk', 'kwwwwwwbbwwwwwwk',
      'kwwwwwwbbwwwwwwk', 'kwwwwwwbbwwwwwwk', '.kwwwwwbbwwwwwk.', '.kwwwwbbbbwwwwk.',
      '..kwwwwwwwwwwk..', '...kkwwwwwwkk...', '.....kkkkkk.....', '................'
    ],
    warn: [
      '................', '.......kk.......', '......kyyk......', '......kyyk......',
      '.....kyyyyk.....', '.....kykkyk.....', '....kyykkyyk....', '....kyykkyyk....',
      '...kyyykkyyyk...', '...kyyykkyyyk...', '..kyyyyyyyyyyk..', '..kyyyykkyyyyk..',
      '.kyyyyykkyyyyyk.', '.kyyyyyyyyyyyyk.', '.kkkkkkkkkkkkkk.', '................'
    ],
    error: [
      '................', '.....kkkkkk.....', '...kkrrrrrrkk...', '..krrrrrrrrrrk..',
      '.krrwwrrrrwwrrk.', '.krrrwwrrwwrrrk.', 'krrrrrwwwwrrrrrk', 'krrrrrrwwrrrrrrk',
      'krrrrrrwwrrrrrrk', 'krrrrrwwwwrrrrrk', '.krrrwwrrwwrrrk.', '.krrwwrrrrwwrrk.',
      '..krrrrrrrrrrk..', '...kkrrrrrrkk...', '.....kkkkkk.....', '................'
    ]
  };

  var iconCache = {};

  function iconUrl(name) {
    if (iconCache[name]) return iconCache[name];
    var rows = ICONS[name];
    if (!rows) return '';
    var canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return '';
    rows.forEach(function (row, y) {
      for (var x = 0; x < 16; x++) {
        var color = PALETTE[row.charAt(x)];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });
    iconCache[name] = canvas.toDataURL();
    return iconCache[name];
  }

  function iconImg(name, large) {
    var url = iconUrl(name);
    if (!url) return null;
    var img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.width = large ? 32 : 16;
    img.height = large ? 32 : 16;
    img.className = 'px-icon' + (large ? ' px-icon--lg' : '');
    img.setAttribute('aria-hidden', 'true');
    return img;
  }

  /** Swap emoji placeholders for pixel icons; put one in each window's title bar. */
  function hydrateIcons(ctx) {
    $$('[data-icon]', ctx).forEach(function (el) {
      if (el.dataset.iconDone) return;
      var isWindow = el.classList.contains('window') || el.classList.contains('float-window');
      var img = iconImg(el.getAttribute('data-icon'), el.classList.contains('nav-icon'));
      if (!img) return;
      el.dataset.iconDone = '1';
      if (isWindow) {
        var bar = $('.title-bar', el);
        if (bar) bar.insertBefore(img, bar.firstChild);
      } else {
        el.textContent = '';
        el.appendChild(img);
      }
    });
  }

  /* ---------- message boxes ---------- */

  function activate(win) {
    $$('.is-active').forEach(function (el) {
      if (el !== win) el.classList.remove('is-active');
    });
    if (win) win.classList.add('is-active');
  }

  /**
   * Win95 message box.
   * opts: { title, html, icon: 'info'|'warn'|'error'|<icon name>, buttons: [{ label, primary, action }] }
   */
  function msgbox(opts) {
    var previousFocus = document.activeElement;
    var previousActive = $('.is-active');
    var buttons = opts.buttons || [{ label: 'OK', primary: true }];
    var overlay = document.createElement('div');
    overlay.className = 'msgbox-overlay';
    overlay.innerHTML =
      '<div class="msgbox" role="alertdialog" aria-modal="true" aria-labelledby="msgbox-title">' +
      '<div class="title-bar"><span id="msgbox-title">' + esc(opts.title || SITE.brand) + '</span>' +
      '<div class="title-bar-controls"><button type="button" class="win-close" data-dismiss aria-label="Close">Close</button></div></div>' +
      '<div class="msgbox-body"><div class="msgbox-text">' + (opts.html || '') + '</div></div>' +
      '<div class="msgbox-buttons"></div></div>';

    var box = $('.msgbox', overlay);
    var icon = iconImg(opts.icon || 'info', true);
    if (icon) $('.msgbox-body', overlay).insertBefore(icon, $('.msgbox-text', overlay));

    function close() {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      activate(previousActive);
      if (previousFocus && previousFocus.focus) previousFocus.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      var focusable = $$('button', box);
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    var primaryBtn = null;
    buttons.forEach(function (def) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn' + (def.primary ? ' btn-primary' : '');
      btn.textContent = def.label;
      btn.addEventListener('click', function () {
        close();
        if (def.action) def.action();
      });
      $('.msgbox-buttons', overlay).appendChild(btn);
      if (def.primary || !primaryBtn) primaryBtn = btn;
    });

    $('[data-dismiss]', overlay).addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(overlay);
    activate(box);
    if (primaryBtn) primaryBtn.focus();
    if (opts.icon === 'error' || opts.icon === 'warn') beep(220, 0.18);
    return { close: close };
  }

  function aboutDialog() {
    msgbox({
      title: 'About ' + SITE.brand,
      icon: 'mic',
      html:
        '<p><strong>' + esc(SITE.name) + ' Comedy 91</strong><br>Build ' + setCount + '</p>' +
        '<p>“' + esc(SITE.tagline) + '”</p>' +
        '<p>Sets in memory: ' + setCount + '<br>Clips on disk: ' + SITE.clips.length +
        '<br>This product is licensed to:<br>the front row.</p>'
    });
  }

  /* ---------- boot + shutdown ---------- */

  // Splash backdrop: a teal brush swipe with a purple scribble over it, paper-cup style.
  var JAZZ_SVG =
    '<svg class="boot-jazz" viewBox="0 0 800 500" preserveAspectRatio="{fit}" aria-hidden="true">' +
    '<defs><filter id="jazz-brush" x="-5%" y="-20%" width="110%" height="140%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.09" numOctaves="2" seed="7"/>' +
    '<feDisplacementMap in="SourceGraphic" scale="16"/></filter></defs>' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#jazz-brush)">' +
    '<path class="jazz-teal" stroke-width="78" d="M-60 395 C 110 300, 250 470, 410 380 S 690 300, 870 372"/>' +
    '<path class="jazz-teal" stroke-width="7" opacity="0.75" d="M-40 338 C 120 250, 250 415, 410 326 S 690 248, 860 318"/>' +
    '<path class="jazz-teal" stroke-width="4" opacity="0.6" d="M-20 452 C 130 362, 260 525, 420 438 S 700 360, 860 428"/>' +
    '<path class="jazz-purple" stroke-width="13" d="M70 420 L205 318 L178 398 L330 300 L300 384 L462 290 L432 372 L600 276 L572 356 L748 262"/>' +
    '<path class="jazz-purple" stroke-width="5" opacity="0.8" d="M112 440 L232 352 L214 414 L352 330 L330 398 L486 318"/>' +
    '</g></svg>';

  function endBootHold() {
    root.classList.remove('booting');
  }

  function boot(force) {
    var isHome = !!$('.desktop-canvas--home');
    if (!force && (!isHome || readStore(sessionStorage, BOOT_KEY) || window.location.hash || reducedMotion())) {
      endBootHold();
      return;
    }
    writeStore(sessionStorage, BOOT_KEY, '1');

    var lines = [
      'HACKMODS BIOS v' + (setCount / 100).toFixed(2) + '   (C) 1991 Morris Microsystems',
      '',
      'CPU: Dad-Life 486DX2-66 ................ OK',
      'Memory test: ' + setCount + ' sets ................. OK',
      'Detecting primary mic .................. SM58',
      'Detecting crowd ........................ 6 people, 1 heckler',
      'Mounting NIAGARA: ...................... OK',
      '',
      'Starting ' + SITE.brand + ' ...'
    ];

    var screen = document.createElement('div');
    screen.className = 'boot-screen';
    screen.setAttribute('role', 'status');
    screen.setAttribute('aria-label', 'Starting ' + SITE.brand);
    screen.innerHTML = '<pre></pre><span class="boot-skip">Press any key to skip</span>';
    var pre = $('pre', screen);
    var timers = [];
    var done = false;

    function finish() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      document.removeEventListener('keydown', finish, true);
      endBootHold();
      screen.classList.add('is-leaving');
      setTimeout(function () {
        screen.remove();
      }, 260);
    }

    function splash() {
      if (done) return;
      var el = document.createElement('div');
      el.className = 'boot-splash';
      el.innerHTML =
        JAZZ_SVG.replace('{fit}', window.innerWidth / window.innerHeight < 1.6 ? 'xMidYMax meet' : 'xMidYMid slice') +
        '<div class="boot-splash-name">' + esc(SITE.name) + ' <b>Comedy</b>91</div>' +
        '<div class="boot-splash-sub">' + esc(SITE.tagline) + '</div>' +
        '<div class="boot-splash-bar"></div>';
      var icon = iconImg('mic', true);
      if (icon) el.insertBefore(icon, el.firstChild.nextSibling);
      screen.appendChild(el);
      timers.push(setTimeout(finish, 1900));
    }

    lines.forEach(function (line, i) {
      timers.push(
        setTimeout(function () {
          pre.textContent += line + '\n';
        }, 130 * i)
      );
    });
    timers.push(setTimeout(splash, 130 * lines.length + 350));

    screen.addEventListener('click', finish);
    document.addEventListener('keydown', finish, true);
    document.body.appendChild(screen);
  }

  function safeScreen() {
    var el = document.createElement('div');
    el.className = 'safe-screen';
    el.setAttribute('role', 'button');
    el.tabIndex = 0;
    el.innerHTML =
      '<span>It’s now safe to turn off<br>your comedian.</span>' +
      '<small>Click anywhere to turn him back on.</small>';
    function wake() {
      document.removeEventListener('keydown', wake, true);
      el.remove();
      boot(true);
    }
    el.addEventListener('click', wake);
    document.addEventListener('keydown', wake, true);
    document.body.appendChild(el);
    el.focus();
  }

  function shutdownDialog() {
    msgbox({
      title: 'Shut Down ' + SITE.brand,
      icon: 'computer',
      html: '<p>Are you sure you want to stop the show?</p><p>Unsaved punchlines will be lost.</p>',
      buttons: [
        { label: 'Shut down', primary: true, action: safeScreen },
        { label: 'Restart', action: function () { boot(true); } },
        { label: 'Cancel' }
      ]
    });
  }

  /* ---------- display settings ---------- */

  function loadDisplay() {
    try {
      return JSON.parse(readStore(localStorage, DISPLAY_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function applyDisplay(settings) {
    document.body.setAttribute('data-wallpaper', settings.wallpaper || 'teal');
    document.body.classList.toggle('crt', !!settings.crt);
  }

  function wireDisplayProperties() {
    var panel = $('#widget-display');
    if (!panel) return;
    var settings = loadDisplay();
    var preview = $('.display-preview-screen', panel);

    function sync() {
      applyDisplay(settings);
      if (preview) preview.setAttribute('data-wallpaper', settings.wallpaper || 'teal');
      writeStore(localStorage, DISPLAY_KEY, JSON.stringify(settings));
    }

    $$('input[name="wallpaper"]', panel).forEach(function (input) {
      input.checked = input.value === (settings.wallpaper || 'teal');
      input.addEventListener('change', function () {
        settings.wallpaper = input.value;
        sync();
      });
    });
    var crt = $('#display-crt', panel);
    if (crt) {
      crt.checked = !!settings.crt;
      crt.addEventListener('change', function () {
        settings.crt = crt.checked;
        sync();
      });
    }
    if (preview) preview.setAttribute('data-wallpaper', settings.wallpaper || 'teal');
  }

  /* ---------- shared page pieces ---------- */

  function bindData() {
    $$('[data-bind]').forEach(function (el) {
      var key = el.getAttribute('data-bind');
      if (key === 'sets') el.textContent = String(setCount);
      else if (key === 'sets-padded') el.textContent = padCount(setCount);
      else if (key === 'tagline') el.textContent = SITE.tagline;
      else if (key === 'clips') el.textContent = String(SITE.clips.length);
      else if (key === 'vr-sets') {
        el.textContent = String(SITE.clips.filter(function (clip) { return clip.room === 'vr'; }).length);
      } else if (key === 'episodes' && SITE.podcast) el.textContent = String(SITE.podcast.episodes.length);
    });
  }

  function padCount(n) {
    var str = String(n);
    while (str.length < 6) str = '0' + str;
    return str;
  }

  function buildMarquee() {
    var track = $('.marquee-text');
    if (!track) return;
    var items = track.hasAttribute('data-marquee-site') && SITE.marquee
      ? SITE.marquee
      : track.textContent.split('⚡');
    items = items
      .map(function (item) {
        return item.replace('{sets}', setCount).trim();
      })
      .filter(Boolean);
    if (!items.length) return;
    var run = items
      .map(function (item) {
        return '<span>' + esc(item) + '</span><span class="marquee-sep">◆</span>';
      })
      .join('');
    // Enough copies to overflow any viewport, in two identical halves so -50% loops cleanly.
    var half = run + run + run;
    track.innerHTML = half + half;
    track.classList.add('is-looped');
    track.style.animationDuration = Math.max(20, Math.round(track.scrollWidth / 2 / 55)) + 's';
  }

  function embedUrl(id, autoplay) {
    return 'https://www.youtube.com/embed/' + id + '?rel=0' + (autoplay ? '&autoplay=1' : '');
  }

  function playVideo(frame, video) {
    frame.innerHTML = '';
    var iframe = document.createElement('iframe');
    iframe.src = embedUrl(video.id, true);
    iframe.title = video.title;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    frame.appendChild(iframe);
  }

  /** Poster + play button; the YouTube iframe only loads when asked for. */
  function mountVideo(frame, video, autoplay) {
    if (!frame || !video) return;
    if (autoplay) {
      playVideo(frame, video);
      return;
    }
    frame.innerHTML = '';
    var poster = document.createElement('button');
    poster.type = 'button';
    poster.className = 'video-poster';
    poster.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + video.id + '/hqdefault.jpg)';
    poster.setAttribute('aria-label', 'Play: ' + video.title);
    poster.innerHTML = '<span class="video-poster-play">Play</span>';
    poster.addEventListener('click', function () {
      playVideo(frame, video);
    });
    frame.appendChild(poster);
  }

  function clipMeta(clip) {
    var parts = [clipLabel(clip)];
    if (clipVenue(clip)) parts.push(clipVenue(clip));
    return parts.join(' · ');
  }

  /** Fill a [data-player] block: slots are title / frame / meta / length / notes. */
  function fillPlayer(player, clip, opts) {
    opts = opts || {};
    function slot(name) {
      return $('[data-slot="' + name + '"]', player);
    }
    var title = slot('title');
    if (title) title.textContent = (opts.prefix || '') + clipHeading(clip);
    var meta = slot('meta');
    if (meta) meta.textContent = clipMeta(clip);
    var length = slot('length');
    if (length) {
      length.textContent = clip.length ? 'Length ' + clip.length : '';
      length.hidden = !clip.length;
    }
    var notes = slot('notes');
    if (notes) {
      notes.textContent = clip.notes || '';
      notes.hidden = !clip.notes;
    }
    var link = slot('youtube');
    if (link) link.href = 'https://www.youtube.com/watch?v=' + clip.id;
    mountVideo(slot('frame'), { id: clip.id, title: clipHeading(clip) }, opts.autoplay);
  }

  /* ---------- home ---------- */

  function renderHomePlayers() {
    var latest = $('[data-player="latest"]');
    if (latest && latestClip()) fillPlayer(latest, latestClip(), { prefix: 'Latest: ' });
    var featured = $('[data-player="featured"]');
    var featuredClip = findClipById(SITE.featured);
    if (featured && featuredClip) fillPlayer(featured, featuredClip, { prefix: 'Featured: ' });
    var vr = $('[data-player="vr"]');
    var vrClip = findClipById(SITE.featuredVr);
    if (vr && vrClip) fillPlayer(vr, vrClip);
    renderVrList(vr, vrClip);
  }

  /** Every VR-numbered video, playable in the VR window. */
  function renderVrList(player, current) {
    var list = $('#vr-list');
    if (!list || !player) return;
    var sets = SITE.clips.filter(function (clip) {
      return clip.room === 'vr';
    });
    if (!sets.length) return;
    list.innerHTML = '';
    sets.forEach(function (clip) {
      var li = document.createElement('li');
      li.setAttribute('role', 'presentation');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shorts-row';
      btn.setAttribute('role', 'option');
      btn.title = clipHeading(clip);
      btn.innerHTML =
        '<span class="col-set">' + esc(clip.set) + '</span><span class="col-name">' + esc(clip.title) + '</span>';
      function mark(on) {
        btn.classList.toggle('is-selected', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      }
      mark(clip === current);
      btn.addEventListener('click', function () {
        $$('.shorts-row', list).forEach(function (row) {
          row.classList.remove('is-selected');
          row.setAttribute('aria-selected', 'false');
        });
        mark(true);
        fillPlayer(player, clip, { autoplay: true });
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
    wireListKeys(list);
  }

  function renderPodcast() {
    var list = $('#podcast-list');
    var pod = SITE.podcast;
    if (!list || !pod || !pod.episodes.length) return;
    list.innerHTML = pod.episodes
      .slice(0, 6)
      .map(function (ep) {
        return (
          '<li><a class="pod-row" href="https://www.youtube.com/watch?v=' + esc(ep.id) + '">' +
          '<span class="col-name">' + esc(ep.title) + '</span>' +
          '<span class="col-len">' + esc(ep.length || '') + '</span></a></li>'
        );
      })
      .join('');
    $$('.pod-row', list).forEach(function (row) {
      var icon = iconImg('speaker');
      if (icon) row.insertBefore(icon, row.firstChild);
    });
    var status = $('#podcast-status');
    if (status) status.textContent = pod.episodes.length + ' episode(s) on tape';
  }

  /** "For bookers" lines only appear once site-data.js has something to say. */
  function renderBookingFacts() {
    $$('[data-booking-fact]').forEach(function (row) {
      var value = (SITE.booking || {})[row.getAttribute('data-booking-fact')];
      var slot = $('span', row);
      if (!value || !slot) return;
      slot.textContent = value;
      row.hidden = false;
    });
  }

  function renderShorts() {
    var list = $('#shorts-list');
    var frame = $('#short-frame');
    var title = $('#short-title');
    if (!list || !frame || !SITE.shorts.length) return;
    list.innerHTML = '';
    var selected = null;

    function select(short, btn, autoplay) {
      if (title) title.textContent = short.title;
      mountVideo(frame, short, autoplay);
      if (selected) {
        selected.classList.remove('is-selected');
        selected.setAttribute('aria-selected', 'false');
      }
      btn.classList.add('is-selected');
      btn.setAttribute('aria-selected', 'true');
      selected = btn;
    }

    SITE.shorts.forEach(function (short, i) {
      var li = document.createElement('li');
      li.setAttribute('role', 'presentation');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shorts-row';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', 'false');
      btn.innerHTML = '<span class="col-name">' + esc(short.title) + '</span>';
      var icon = iconImg('phone');
      if (icon) btn.insertBefore(icon, btn.firstChild);
      btn.addEventListener('click', function () {
        select(short, btn, true);
      });
      li.appendChild(btn);
      list.appendChild(li);
      if (i === 0) select(short, btn, false);
    });
    wireListKeys(list);
    var status = $('#shorts-status');
    if (status) status.textContent = SITE.shorts.length + ' object(s)';
  }

  /** Up/Down/Home/End move through a listbox of buttons. */
  function wireListKeys(list) {
    list.addEventListener('keydown', function (e) {
      var rows = $$('[role="option"]', list);
      var at = rows.indexOf(document.activeElement);
      if (at === -1) return;
      var next = at;
      if (e.key === 'ArrowDown') next = Math.min(rows.length - 1, at + 1);
      else if (e.key === 'ArrowUp') next = Math.max(0, at - 1);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = rows.length - 1;
      else return;
      e.preventDefault();
      rows[next].focus();
    });
  }

  function animateCounters() {
    var counters = $$('[data-count-up]');
    var bars = $$('.resource-fill');
    if (!counters.length && !bars.length) return;

    function run(el) {
      if (el.classList.contains('resource-fill')) {
        el.classList.add('is-loaded');
        return;
      }
      if (reducedMotion()) return;
      var from = Math.max(0, setCount - 45);
      var start = null;
      function frame(now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / 1400);
        el.textContent = padCount(Math.round(from + (setCount - from) * t * (2 - t)));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      counters.concat(bars).forEach(run);
      return;
    }
    var seen = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          seen.unobserve(entry.target);
          run(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    counters.concat(bars).forEach(function (el) {
      seen.observe(el);
    });
  }

  /* ---------- shows ---------- */

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  /** Today's calendar date where the shows happen, as a UTC-midnight Date. */
  function todayInShowTz() {
    var ymd;
    try {
      ymd = new Intl.DateTimeFormat('en-CA', {
        timeZone: SITE.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch (e) {
      ymd = '';
    }
    return parseDate(ymd) || parseDate(new Date().toISOString().slice(0, 10));
  }

  function parseDate(ymd) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || '');
    return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null;
  }

  function upcomingShows() {
    var today = todayInShowTz();
    var out = [];
    (SITE.shows || []).forEach(function (show) {
      var when;
      if (show.date) {
        when = parseDate(show.date);
      } else if (typeof show.weekday === 'number') {
        var ahead = (show.weekday - today.getUTCDay() + 7) % 7;
        when = new Date(today.getTime() + ahead * 86400000);
      }
      if (!when || when < today) return;
      out.push({ show: show, when: when, isToday: when.getTime() === today.getTime() });
    });
    return out.sort(function (a, b) {
      return a.when - b.when;
    });
  }

  function showDateText(entry) {
    var d = entry.when;
    return DAYS[d.getUTCDay()] + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }

  function renderShows() {
    var upcoming = upcomingShows();

    var ticker = $('#next-show');
    if (ticker && upcoming.length) {
      var next = upcoming[0];
      ticker.textContent =
        (next.isToday ? 'Tonight' : 'Next show: ' + showDateText(next)) +
        (next.show.time ? ', ' + next.show.time : '') +
        ' — ' + next.show.title + (next.show.city ? ', ' + next.show.city.replace(/,.*$/, '') : '');
      ticker.hidden = false;
    }

    var list = $('#show-list');
    if (!list) return;
    if (!upcoming.length) {
      list.innerHTML =
        '<li class="show-row"><div class="show-body"><strong>No dates on the books right now.</strong>' +
        '<p>New rooms get announced on <a href="' + esc(SITE.socials.instagram) + '">Instagram</a> first.</p></div></li>';
      return;
    }
    list.innerHTML = upcoming
      .map(function (entry) {
        var show = entry.show;
        var d = entry.when;
        var where = [show.venue, show.city, show.time].filter(Boolean).map(esc).join(' · ');
        var badge = entry.isToday ? 'TONIGHT' : show.date ? '' : 'WEEKLY';
        return (
          '<li class="show-row">' +
          '<div class="show-date" aria-hidden="true"><span class="show-date-month">' + MONTHS[d.getUTCMonth()] +
          '</span><span class="show-date-day">' + d.getUTCDate() + '</span><span class="show-date-dow">' +
          DAYS[d.getUTCDay()] + '</span></div>' +
          '<div class="show-body"><strong>' + esc(show.title) +
          (badge ? '<span class="show-badge">' + badge + '</span>' : '') + '</strong>' +
          '<p><span class="sr-only">' + showDateText(entry) + ' — </span>' + where + '</p>' +
          (show.note ? '<p class="muted">' + esc(show.note) + '</p>' : '') +
          (show.tickets || show.link || show.map
            ? '<p class="transport">' +
              (show.tickets ? '<a class="btn btn-primary" href="' + esc(show.tickets) + '">Tickets</a>' : '') +
              (show.link
                ? '<a class="btn" href="' + esc(show.link) + '" target="_blank" rel="noopener">' +
                  esc(show.linkLabel || 'Show info') + '</a>'
                : '') +
              (show.map
                ? '<a class="btn" href="' + esc(show.map) + '" target="_blank" rel="noopener">Map</a>'
                : '') +
              '</p>'
            : '') +
          '</div></li>'
        );
      })
      .join('');

    var status = $('#show-status');
    if (status) status.textContent = upcoming.length + ' date(s) on the calendar';

    var events = upcoming
      .filter(function (entry) {
        return entry.show.date;
      })
      .map(function (entry) {
        return {
          '@type': 'ComedyEvent',
          name: SITE.name + ' — ' + entry.show.title,
          startDate: entry.show.date,
          performer: { '@type': 'Person', name: SITE.name },
          location: { '@type': 'Place', name: entry.show.venue, address: entry.show.city },
          url: entry.show.tickets || window.location.href
        };
      });
    if (events.length) addJsonLd({ '@context': 'https://schema.org', '@graph': events });
  }

  function addJsonLd(data) {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /* ---------- clip library ---------- */

  function renderClipLibrary() {
    var list = $('#clip-list');
    var player = $('[data-player="library"]');
    if (!list || !player) return;

    var state = { query: '', tag: '', room: '', sort: '', dir: 1, current: null };
    var params = new URLSearchParams(window.location.search);
    var roomSelect = $('#clip-room');
    var search = $('#clip-search');
    var tagBar = $('#clip-tags');
    var head = $('#clip-head');
    var status = $('#clip-status');
    var statusNow = $('#clip-status-now');
    var visible = [];

    $$('[data-js-only]').forEach(function (el) {
      el.hidden = false;
    });

    function matches(clip) {
      if (state.tag && (clip.tags || []).indexOf(state.tag) === -1) return false;
      if (state.room && clip.room !== state.room) return false;
      if (!state.query) return true;
      var hay = [clip.title, clipLabel(clip), clipVenue(clip), clip.notes].join(' ').toLowerCase();
      return state.query.split(/\s+/).every(function (word) {
        return hay.indexOf(word) !== -1;
      });
    }

    function sorted(clips) {
      if (!state.sort) return clips;
      var key = {
        name: function (c) { return c.title.toLowerCase(); },
        set: function (c) { return isNumberedSet(c) ? c.set : -1; },
        len: lengthSeconds
      }[state.sort];
      return clips.slice().sort(function (a, b) {
        var ka = key(a);
        var kb = key(b);
        return (ka < kb ? -1 : ka > kb ? 1 : 0) * state.dir;
      });
    }

    function select(clip, opts) {
      opts = opts || {};
      state.current = clip;
      fillPlayer(player, clip, { autoplay: opts.autoplay });
      $$('.clip-row', list).forEach(function (row) {
        var on = row.getAttribute('data-id') === clip.id;
        row.classList.toggle('is-selected', on);
        row.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (statusNow) statusNow.textContent = clipLabel(clip) + (clip.length ? ' · ' + clip.length : '');
      if (opts.updateUrl && window.history.replaceState) {
        window.history.replaceState(null, '', '?v=' + encodeURIComponent(clip.id));
      }
      updateStepButtons();
    }

    function updateStepButtons() {
      var at = visible.indexOf(state.current);
      var prev = $('#clip-prev');
      var next = $('#clip-next');
      if (prev) prev.disabled = at <= 0;
      if (next) next.disabled = at === -1 || at >= visible.length - 1;
    }

    function step(delta) {
      var at = visible.indexOf(state.current);
      var target = visible[at + delta];
      if (target) select(target, { autoplay: true, updateUrl: true });
    }

    function render() {
      visible = sorted(SITE.clips.filter(matches));
      list.innerHTML = '';
      if (!visible.length) {
        list.innerHTML = '<li class="clip-empty">No sets match. Even the search bombed.</li>';
      }
      visible.forEach(function (clip) {
        var li = document.createElement('li');
        li.setAttribute('role', 'presentation');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'clip-row';
        btn.setAttribute('role', 'option');
        btn.setAttribute('data-id', clip.id);
        var on = clip === state.current;
        btn.classList.toggle('is-selected', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.innerHTML =
          '<span class="col-name">' + esc(clip.title) + '</span>' +
          '<span class="col-set">' + esc(isNumberedSet(clip) ? '#' + clip.set : clip.set) + '</span>' +
          '<span class="col-len">' + esc(clip.length || '—') + '</span>';
        var icon = iconImg('film');
        if (icon) btn.insertBefore(icon, btn.firstChild);
        btn.title = clipHeading(clip);
        btn.addEventListener('click', function () {
          select(clip, { autoplay: true, updateUrl: true });
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
      if (status) {
        var total = SITE.clips.length;
        status.textContent =
          visible.length === total
            ? total + ' object(s)'
            : visible.length + ' of ' + total + ' object(s)' +
              [state.tag && SITE.tags[state.tag], state.room && SITE.rooms[state.room]]
                .filter(Boolean)
                .map(function (name) { return ' — ' + name; })
                .join('');
      }
      if (head) {
        $$('button', head).forEach(function (btn) {
          var active = btn.getAttribute('data-sort') === state.sort;
          if (active) btn.setAttribute('aria-sort', state.dir === 1 ? 'ascending' : 'descending');
          else btn.removeAttribute('aria-sort');
        });
      }
      updateStepButtons();
    }

    // Deep links: clips.html?tag=clean, ?room=vr, ?v=<video id>, ?set=121
    if (SITE.tags[params.get('tag')]) state.tag = params.get('tag');
    if (SITE.rooms[params.get('room')]) state.room = params.get('room');

    if (roomSelect) {
      Object.keys(SITE.rooms).forEach(function (key) {
        var option = document.createElement('option');
        option.value = key;
        option.textContent = SITE.rooms[key];
        roomSelect.appendChild(option);
      });
      roomSelect.value = state.room;
      roomSelect.addEventListener('change', function () {
        state.room = roomSelect.value;
        render();
      });
    }

    if (tagBar) {
      var tagDefs = [['', 'All']].concat(
        Object.keys(SITE.tags).map(function (key) {
          return [key, SITE.tags[key]];
        })
      );
      tagDefs.forEach(function (def) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn';
        btn.textContent = def[1];
        btn.setAttribute('aria-pressed', def[0] === state.tag ? 'true' : 'false');
        btn.addEventListener('click', function () {
          state.tag = def[0];
          $$('button', tagBar).forEach(function (other) {
            other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
          });
          render();
        });
        tagBar.appendChild(btn);
      });
    }

    if (search) {
      search.addEventListener('input', function () {
        state.query = search.value.trim().toLowerCase();
        render();
      });
    }

    if (head) {
      head.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-sort]');
        if (!btn) return;
        var key = btn.getAttribute('data-sort');
        if (state.sort === key) state.dir = -state.dir;
        else {
          state.sort = key;
          state.dir = key === 'name' ? 1 : -1;
        }
        render();
      });
    }

    var prev = $('#clip-prev');
    var next = $('#clip-next');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    wireListKeys(list);

    var wanted = params.get('v') || params.get('set');
    render();
    var first =
      (params.get('v') && findClipById(params.get('v'))) ||
      (params.get('set') && findClip(params.get('set'))) ||
      (state.tag || state.room ? visible[0] : latestClip());
    if (first) {
      select(first);
      var row = $('.clip-row.is-selected', list);
      if (row && wanted) list.scrollTop = row.offsetTop - list.offsetTop;
    }

    addJsonLd({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: SITE.name + ' Comedy — Set Archive',
      itemListElement: SITE.clips.map(function (clip, i) {
        return {
          '@type': 'ListItem',
          position: i + 1,
          name: clipHeading(clip),
          url: 'https://www.youtube.com/watch?v=' + clip.id
        };
      })
    });
  }

  /* ---------- booking + press ---------- */

  function wireBookingForms() {
    $$('form[data-booking]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        if (!window.fetch || !window.FormData) return; // plain POST still works
        e.preventDefault();
        var submit = $('button[type="submit"]', form);
        var label = submit.textContent;
        submit.disabled = true;
        submit.textContent = 'SENDING…';

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.reset();
            msgbox({
              title: 'Mail',
              icon: 'mail',
              html: '<p><strong>Transmission sent.</strong></p><p>Ryan will get back to you — usually faster than he gets to a punchline.</p>'
            });
          })
          .catch(function () {
            msgbox({
              title: 'Mail',
              icon: 'error',
              html:
                '<p><strong>The message didn’t go through.</strong></p><p>Your text is still in the form. Try again, or DM ' +
                '<a href="' + esc(SITE.socials.instagram) + '">@ryanmorriscomedy</a> on Instagram.</p>'
            });
          })
          .then(function () {
            submit.disabled = false;
            submit.textContent = label;
          });
      });
    });
  }

  function wireCopyButtons() {
    $$('.bio-block').forEach(function (block) {
      var head = $('.bio-block-head', block);
      var text = $('p', block);
      if (!head || !text || !navigator.clipboard) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(text.textContent.trim()).then(function () {
          btn.textContent = 'Copied';
          setTimeout(function () {
            btn.textContent = 'Copy';
          }, 1500);
        });
      });
      head.appendChild(btn);
    });
  }

  /* ---------- window focus ---------- */

  function wireActiveWindow() {
    function onInteract(e) {
      var win = e.target.closest && e.target.closest('.window, .float-window, .msgbox');
      if (win) activate(win);
    }
    document.addEventListener('pointerdown', onInteract, true);
    document.addEventListener('focusin', onInteract, true);
    var hashTarget = window.location.hash && document.getElementById(window.location.hash.slice(1));
    activate(hashTarget && hashTarget.classList.contains('window') ? hashTarget : $('.window'));
    window.addEventListener('hashchange', function () {
      var el = document.getElementById(window.location.hash.slice(1));
      if (el && el.classList.contains('window')) activate(el);
    });
  }

  /* ---------- init ---------- */

  window.Win95 = {
    hydrateIcons: hydrateIcons,
    activate: activate,
    msgbox: msgbox,
    about: aboutDialog,
    shutdown: shutdownDialog,
    boot: boot
  };

  // Runs before desktop.js measures and wires the windows.
  applyDisplay(loadDisplay());
  bindData();
  hydrateIcons(document);
  buildMarquee();
  renderHomePlayers();
  renderShorts();
  renderPodcast();
  renderBookingFacts();
  renderShows();
  renderClipLibrary();
  wireBookingForms();
  wireCopyButtons();
  wireActiveWindow();
  animateCounters();
  boot(false);

  // desktop.js has injected the Start menu and widgets by now.
  document.addEventListener('DOMContentLoaded', function () {
    hydrateIcons(document);
    wireDisplayProperties();
  });
})();
