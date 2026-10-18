/* =========================================================
   苏丹的游戏 · 介绍站 交互脚本
   模块：主题 / 导航 / 滚动 / 轮播 / 标签 / 图集灯箱 / FAQ / 计数
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. 主题切换（暗夜宫廷 / 胡卡晨光） ---------- */
  var THEME_KEY = 'sg-theme';
  var root = document.documentElement;
  var themeBtn = $('#themeToggle');

  function applyTheme(name) {
    root.setAttribute('data-theme', name);
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
  }

  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (!saved) {
      saved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'nocturne';
    }
    applyTheme(saved);
  })();

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'nocturne' ? 'day' : 'nocturne';
      applyTheme(next);
      themeBtn.setAttribute('aria-label', next === 'nocturne' ? '切换到沙金白昼主题' : '切换到孔雀夜宫主题');
      announce(next === 'nocturne' ? '已切换至青金长夜主题' : '已切换至沙金白昼主题');
    });
  }

  /* ---------- 2. 移动端导航 ---------- */
  var menuToggle = $('#menuToggle');
  var siteNav    = $('#siteNav');
  var navScrim   = $('#navScrim');

  function setMenu(open) {
    if (!siteNav || !menuToggle) return;
    siteNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    if (navScrim) {
      if (open) {
        navScrim.hidden = false;
        requestAnimationFrame(function () { navScrim.classList.add('is-on'); });
      } else {
        navScrim.classList.remove('is-on');
        setTimeout(function () { navScrim.hidden = true; }, 340);
      }
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (navScrim) navScrim.addEventListener('click', function () { setMenu(false); });
  $$('.nav-link').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 940) setMenu(false);
  });

  /* ---------- 3. 阅读进度 + 导航高亮 + 回到顶部 ---------- */
  var header  = $('#siteHeader');
  var bar     = $('#progressBar');
  var toTop   = $('#toTop');
  var sections = ['hero', 'world', 'cards', 'gallery', 'chronicle', 'faq']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navLinks = $$('.nav-link');

  var ticking = false;
  function onScroll() {
    var y   = window.pageYOffset || document.documentElement.scrollTop;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (header) header.classList.toggle('is-scrolled', y > 24);

    if (toTop) {
      var show = y > 560;
      if (show && toTop.hidden) toTop.hidden = false;
      if (!show && !toTop.hidden) { toTop.classList.remove('is-on'); setTimeout(function(){ toTop.hidden = true; }, 400); }
      else if (show) toTop.classList.add('is-on');
    }

    // 高亮当前 section
    var current = 'hero';
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].offsetTop - 140 <= y) current = sections[i].id;
    }
    navLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + current);
    });

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 4. 滚动渐显 ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- 5. 数字滚动 ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var dur = 1400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* =========================================================
     6. 苏丹卡牌数据 + 轮播
     ========================================================= */
  var SIGILS = {
    lust:   '<path d="M40 6c7 13 22 20 22 35a22 22 0 11-44 0c0-9 7-13 10-21 2 7 5 10 8 10 5 0 6-7 4-24z"/>',
    luxury: '<path d="M40 8l7 15 16 1-12 12 3 16-14-9-14 9 3-16-12-12 16-1z"/><circle cx="40" cy="39" r="6"/>',
    conquest:'<path d="M12 62l28-28M41 33l9-9 17 17-9 9z"/><circle cx="58" cy="23" r="7"/><path d="M11 70l15-4-11-11z"/>',
    slay:   '<path d="M18 12l44 56M62 12L18 68"/><circle cx="25" cy="22" r="4.5"/><circle cx="55" cy="22" r="4.5"/>'
  };

  var CARDS = [
    { name:'纵欲', en:'Lust', tier:'岩石', type:'lust', color:'#e0559b',
      task:'寻一位可共度春宵的对象。七日之后，苏丹要听到细节。', days:2 },
    { name:'纵欲', en:'Lust', tier:'青铜', type:'lust', color:'#e0559b',
      task:'连续三日，纵情于床笫之间。对象不必是人类。', days:3 },
    { name:'纵欲', en:'Lust', tier:'白银', type:'lust', color:'#f07ab5',
      task:'完成一次彻底的双人缠绵，属性不足者将体力透支。', days:3 },
    { name:'纵欲', en:'Lust', tier:'黄金', type:'lust', color:'#ff9dcd',
      task:'唯一一张黄金纵欲卡。让苏丹满意，否则你的名字将从宫中消失。', days:4 },

    { name:'奢靡', en:'Luxury', tier:'岩石', type:'luxury', color:'#e5a53f',
      task:'挥霍一笔可观的钱财，以证明你的忠诚。', days:2 },
    { name:'奢靡', en:'Luxury', tier:'青铜', type:'luxury', color:'#e5a53f',
      task:'设一场足够奢华的宴席，并亲自到场。', days:3 },
    { name:'奢靡', en:'Luxury', tier:'白银', type:'luxury', color:'#f0bc5e',
      task:'购入珍宝献上，同时打理家业不得荒废。', days:3 },
    { name:'奢靡', en:'Luxury', tier:'黄金', type:'luxury', color:'#ffd97e',
      task:'倾国之力完成一次排场。金币不够？那就用别的东西抵。', days:4 },

    { name:'征服', en:'Conquest', tier:'岩石', type:'conquest', color:'#3fb8e8',
      task:'完成一次惊险的远征，带回战利品。', days:2 },
    { name:'征服', en:'Conquest', tier:'青铜', type:'conquest', color:'#3fb8e8',
      task:'攻下袭扰边境的贼巢，战斗属性不足者慎入。', days:3 },
    { name:'征服', en:'Conquest', tier:'白银', type:'conquest', color:'#62cdf0',
      task:'在竞技场或荒漠中证明你的武艺，声望与危险一同到来。', days:3 },
    { name:'征服', en:'Conquest', tier:'黄金', type:'conquest', color:'#8ce0ff',
      task:'屠龙，或成为屠龙者。这张卡只写了一个动词。', days:4 },

    { name:'杀戮', en:'Slaughter', tier:'岩石', type:'slay', color:'#e04a3c',
      task:'献上一条人命。可以是仇人，也可以不是。', days:2 },
    { name:'杀戮', en:'Slaughter', tier:'青铜', type:'slay', color:'#e04a3c',
      task:'秘密处决一名宫廷里的人，不能走漏风声。', days:3 },
    { name:'杀戮', en:'Slaughter', tier:'白银', type:'slay', color:'#f26354',
      task:'让苏丹看到一场公开的死亡展示。', days:3 },
    { name:'杀戮', en:'Slaughter', tier:'黄金', type:'slay', color:'#ff7d63',
      task:'牌面只写了两个字：血洗。你自己选择对象。', days:4 },

    { name:'隐匿', en:'Veil', tier:'岩石', type:'conquest', color:'#8b6fd4',
      task:'躲过一次来自上层的追查——包括你自己的罪行。', days:2 },
    { name:'隐匿', en:'Veil', tier:'白银', type:'conquest', color:'#9c7ee0',
      task:'让一位不该知道你秘密的人，永远闭嘴。', days:3 },
    { name:'疯魔', en:'Frenzy', tier:'青铜', type:'slay', color:'#a04fb0',
      task:'向女术士索取更多卡牌。代价尚未写下，但账单一定会来。', days:3 },
    { name:'弑君', en:'Regicide', tier:'黄金', type:'slay', color:'#e03040',
      task:'打磨一把匕首。目标是那把属于君主的座椅。', days:5 }
  ];

  var track   = $('#carouselTrack');
  var dotsBox = $('#carouselDots');
  var prevBtn = $('#prevBtn');
  var nextBtn = $('#nextBtn');
  var carousel= $('#carousel');
  var index = 0;

  var BREAK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>';

  function cardHTML(c, i) {
    var pips = '';
    for (var d = 0; d < 4; d++) pips += '<i class="' + (d < c.days ? 'on' : '') + '"></i>';
    // 品级宝石：岩石/青铜/白银/黄金
    var gem = { '岩石': '#6b7a80', '青铜': '#a2703c', '白银': '#c3ccd0', '黄金': '#d4a83c' }[c.tier];
    return '' +
      '<li class="sultan-card" data-i="' + i + '" style="--sc:' + c.color + ';--gem:' + gem + '" tabindex="-1" aria-hidden="true">' +
        '<span class="corner tl"></span><span class="corner tr"></span>' +
        '<span class="corner bl"></span><span class="corner br"></span>' +
        '<span class="card-rule"></span>' +
        /* 顶部穆卡纳斯蜂窝檐口 */
        '<span class="sc-muq" aria-hidden="true">' +
          '<svg viewBox="0 0 200 26" preserveAspectRatio="none">' +
          '<rect width="200" height="26" fill="url(#pMuq)"/></svg></span>' +
        '<span class="sc-tier"><i class="gem"></i>' + c.tier + '</span>' +
        '<span class="sc-sigil"><svg viewBox="0 0 80 80" aria-hidden="true">' + SIGILS[c.type] + '</svg></span>' +
        '<h3 class="sc-name">' + c.name + '</h3>' +
        '<span class="sc-en">' + c.en.toUpperCase() + '</span>' +
        '<span class="sc-orn" aria-hidden="true"></span>' +
        '<p class="sc-task">' + c.task + '</p>' +
        '<span class="sc-days">' + pips + '</span>' +
        /* 折断按钮 */
        '<button class="sc-break" type="button" data-break="' + i + '" tabindex="-1" ' +
          'aria-label="折断这张' + c.name + '卡（' + c.tier + '阶）">' + BREAK_ICON +
          '<span>折 断</span></button>' +
        /* 折断后的裂痕与血沁印章 */
        '<span class="sc-crack" aria-hidden="true">' +
          '<svg viewBox="0 0 100 140" preserveAspectRatio="none">' +
          '<use href="#symCrack"/></svg></span>' +
        '<span class="sc-stamp" aria-hidden="true">已 折 断</span>' +
      '</li>';
  }

  if (track) {
    track.innerHTML = CARDS.map(cardHTML).join('');
    track.setAttribute('role', 'group');

    dotsBox.innerHTML = CARDS.map(function (c, i) {
      return '<button class="cdot' + (i === 0 ? ' is-active' : '') + '" type="button" ' +
             'role="tab" data-i="' + i + '" aria-label="第 ' + (i + 1) + ' 张：' + c.name + ' ' + c.tier + '阶"></button>';
    }).join('');

    var dots = $$('.cdot', dotsBox);
    var isNarrow = function () { return window.innerWidth <= 680; };

    // 窄屏只显示以当前索引为中心的少量圆点，避免换行堆叠
    function syncDots() {
      dots.forEach(function (d, i) {
        var near = !isNarrow() || Math.abs(i - index) <= 2;
        d.style.display = near ? '' : 'none';
      });
    }

    function visibleCount() {
      if (window.innerWidth <= 680) return 1;
      if (window.innerWidth <= 1000) return 2;
      if (window.innerWidth <= 1300) return 3;
      return 4;
    }
    function maxIndex() { return Math.max(0, CARDS.length - visibleCount()); }

    function update() {
      var vc  = visibleCount();
      var gap = parseFloat(getComputedStyle(track).columnGap || '18') || 18;
      var cardW = track.children[0] ? track.children[0].getBoundingClientRect().width : 240;
      var step = cardW + gap;
      index = Math.max(0, Math.min(index, maxIndex()));
      track.style.transform = 'translate3d(' + (-index * step) + 'px,0,0)';

      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
        d.setAttribute('aria-selected', String(i === index));
      });
      syncDots();
      // 视口外的卡不可聚焦：连同卡内的「折断」按钮一并移出 Tab 序列
      $$('.sultan-card', track).forEach(function (c, i) {
        var off = i < index || i >= index + vc;
        c.setAttribute('aria-hidden', String(off));
        var b = $('.sc-break', c);
        if (b) b.tabIndex = off ? -1 : 0;
      });
    }

    function go(i) {
      index = i;
      update();
    }

    /* ---------- 6.5 摧毁卡牌：金色 → 血色 ----------
       序列：金光爆闪 → 卡面抽搐 → 裂成两块残片坠落 → 血幕漫灌 + 飞溅 → 定格为「已折断」 */
    var veil = $('#bloodveil');
    var brokenCountEl = $('#brokenCount');
    var totalCountEl = $('#totalCount');
    var VEIL_MS = 1900;
    var veilTimer = null;
    var brokenSet = {};

    if (totalCountEl) totalCountEl.textContent = String(CARDS.length);

    function updateBrokenCount() {
      if (brokenCountEl) {
        brokenCountEl.textContent = String(Object.keys(brokenSet).length);
      }
    }

    function veilBurst() {
      if (!veil) return;
      veil.classList.remove('is-ripping');
      void veil.offsetWidth;               // 强制重排，保证可重复触发
      veil.classList.add('is-ripping');
      clearTimeout(veilTimer);
      veilTimer = setTimeout(function () {
        veil.classList.remove('is-ripping');
      }, VEIL_MS);
    }

    function spawnShards(card) {
      if (!card) return;
      var r = card.getBoundingClientRect();
      ['shard-a', 'shard-b'].forEach(function (variant) {
        var el = card.cloneNode(true);
        el.classList.add('shard', variant);
        el.classList.remove('is-snapping');
        el.style.left = r.left + 'px';
        el.style.top = r.top + 'px';
        el.style.width = r.width + 'px';
        el.style.height = r.height + 'px';
        el.style.flex = 'none';
        el.style.aspectRatio = 'auto';
        document.body.appendChild(el);
        setTimeout(function () { el.remove(); }, 1150);
      });
    }

    function spawnGore(r) {
      var n = reduceMotion ? 0 : 18;
      for (var k = 0; k < n; k++) {
        var d = document.createElement('span');
        d.className = 'gore';
        var ang = Math.random() * Math.PI * 2;
        var dist = 40 + Math.random() * 165;
        var sz = 5 + Math.random() * 16;
        d.style.setProperty('--tx', (Math.cos(ang) * dist).toFixed(1) + 'px');
        d.style.setProperty('--ty', (Math.sin(ang) * dist + Math.random() * 46).toFixed(1) + 'px');
        d.style.setProperty('--sz', sz.toFixed(1) + 'px');
        d.style.setProperty('--gd', (0.68 + Math.random() * 0.62).toFixed(2) + 's');
        d.style.left = (r.left + r.width / 2 - sz / 2) + 'px';
        d.style.top = (r.top + r.height / 2 - sz / 2) + 'px';
        document.body.appendChild(d);
        (function (node) {
          setTimeout(function () { node.remove(); }, 1550);
        })(d);
      }
    }

    function destroyCard(card) {
      var i = parseInt(card.getAttribute('data-i'), 10);
      if (isNaN(i) || brokenSet[i]) return;
      brokenSet[i] = true;
      updateBrokenCount();

      var btn = $('.sc-break', card);
      if (btn) {
        btn.disabled = true;
        var lbl = $('span', btn);
        if (lbl) lbl.textContent = '已 折 断';
      }
      announce('卡牌已折断：' + CARDS[i].name + ' ' + CARDS[i].tier + '阶');

      if (reduceMotion) {
        card.classList.add('is-broken');
        return;
      }

      var r = card.getBoundingClientRect();
      card.classList.add('is-snapping');
      veilBurst();                          // 金色爆闪起手

      setTimeout(function () {              // 金 → 血 的交接点
        card.classList.remove('is-snapping');
        spawnShards(card);                  // 先克隆完整卡面，再让原卡转为折断态
        card.classList.add('is-broken');
        spawnGore(r);
        document.body.classList.add('is-quake');
        setTimeout(function () {
          document.body.classList.remove('is-quake');
        }, 640);
      }, 380);
    }

    // 委托：卡面内的「折断」按钮
    track.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.sc-break') : null;
      if (!b) return;
      e.preventDefault();
      e.stopPropagation();
      var card = b.closest('.sultan-card');
      if (card) destroyCard(card);
    });

    prevBtn && prevBtn.addEventListener('click', function () { go(index <= 0 ? maxIndex() : index - 1); });
    nextBtn && nextBtn.addEventListener('click', function () { go(index >= maxIndex() ? 0 : index + 1); });
    dotsBox.addEventListener('click', function (e) {
      var b = e.target.closest('.cdot');
      if (b) go(parseInt(b.getAttribute('data-i'), 10));
    });

    // 键盘
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); go(index <= 0 ? maxIndex() : index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index >= maxIndex() ? 0 : index + 1); }
    });

    // 拖拽 / 触摸滑动
    var dragX = null, delta = 0;
    track.addEventListener('pointerdown', function (e) {
      // 按在「折断」按钮上时不触发轮播拖拽
      if (e.target.closest && e.target.closest('.sc-break')) return;
      dragX = e.clientX; delta = 0;
      track.classList.add('is-dragging');
      track.setPointerCapture && track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) {
      if (dragX === null) return;
      delta = e.clientX - dragX;
      track.style.transform = 'translate3d(' + (-index * (track.children[0].getBoundingClientRect().width + 18) + delta) + 'px,0,0)';
    });
    function endDrag() {
      if (dragX === null) return;
      track.classList.remove('is-dragging');
      var threshold = Math.min(120, track.getBoundingClientRect().width * 0.18);
      if (Math.abs(delta) > threshold) {
        go(delta < 0 ? Math.min(index + 1, maxIndex()) : Math.max(index - 1, 0));
      } else {
        update();
      }
      dragX = null; delta = 0;
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // 自动轮播
    if (!reduceMotion) {
      var timer = setInterval(function () {
        if (document.hidden) return;
        go(index >= maxIndex() ? 0 : index + 1);
      }, 4200);
      carousel.addEventListener('mouseenter', function () { clearInterval(timer); });
      carousel.addEventListener('mouseleave', function () {
        timer = setInterval(function () {
          if (!document.hidden) go(index >= maxIndex() ? 0 : index + 1);
        }, 4200);
      });
    }

    var rz;
    window.addEventListener('resize', function () {
      clearTimeout(rz);
      rz = setTimeout(update, 140);
    });
    // 初始定位到奢靡卡，首屏即可看到不同类型卡面
    index = Math.min(4, maxIndex());
    update();
  }

  /* =========================================================
     7. 标签切换
     ========================================================= */
  var tabs   = $$('.tab');
  var panels = $$('.tab-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var key = tab.getAttribute('data-key');
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      panels.forEach(function (p) {
        var on = p.id === 'panel-' + key;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
    });
    tab.addEventListener('keydown', function (e) {
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      var i = tabs.indexOf(tab);
      var next = tabs[(i + dir + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });

/* =========================================================
     8. 众生相：游戏原立绘 + 灯箱预览
     ========================================================= */

  /* 角色数据：img=立绘文件名, name=展示名, en=英文/副题,
     role=官方定位或视觉描述, tag=标签, desc=简介 */
  var CHARS = [
    { img:'p01.jpg', name:'苏丹', en:'THE SULTAN', role:'统治者', tag:['暴君','牌主','混沌'],
      desc:'官方Wiki 给他的定位只有两个字：「统治者」。他曾经是一位睿智、强悍、精明的统治者——但他同时也残忍、疯狂、冷漠，而这不是因为那几副牌，这本就是他的本性。玩家的评价里有一句话很精准：他是为众剑所吻的王。' },

    { img:'p02.jpg', name:'奈费勒', en:'THE SULTAN', role:'政敌', tag:['宽容','异域'],
      desc:'金线织就的长袍，金币束带，臂弯上停着一只青金羽禽——学者与王权的意象被并置在同一个人身上。' },

    { img:'p03.jpg', name:'娜依拉', en:'THE COURT', role:'帝国娇花', tag:['纵欲','贪婪'],
      desc:'紫发青年执扇垂目，持弓武士负箭而立，肩后还有一位女子。宫廷里的每个人都带着自己的算计，而苏丹正在下一盘没有人敢说自己看懂了的棋——你是最新落入棋盘的那一枚。' },

    { img:'p04.jpg', name:'拜铃耶', en:'THE VOID', role:'星海中的低语', tag:['弑神线','幻术'],
      desc:'紫雾翻涌，一个人影在星海里低头凝视；天空悬着一只巨大的眼，衣袍如星云般流动。这是密教弑神线里最常被描写的画面——在这里苏丹不再是暴君，而是被更高存在注视的对象。' },

    { img:'p05.jpg', name:'阿迪莱', en:'THE WOMAN', role:'女战士', tag:['勇敢','战士'],
      desc:'绿发高盘，斜握弯刀，肩上是繁复的孔雀羽金饰。她姿态放松，眼神却没有——在这座宫廷里放松的人往往活不长。刀是她的，也是苏丹的。' },

    { img:'p06.jpg', name:'萨达尔尼', en:'THE KISS', role:'银妃', tag:['疯狂','禁忌'],
      desc:'长发女子俯身亲吻一只红色狮形纹章，满身金环与宝石。这是《苏丹的游戏》里最直白的一张「献祭」隐喻：把欲望、爱情、忠诚一样一样摆上祭坛，直到只剩下牌面。' },

    { img:'p07.jpg', name:'伊曼', en:'THE JINN', role:'覆眼的双掌', tag:['祭司','神秘'],
      desc:'白发垂至腰际，双手覆于眼前，手背与臂上满是金饰与宝石，烟气自指缝间升起。这不是凡人——巨灵既不在苏丹的棋盘上，也不在你的。' },

    { img:'p08.jpg', name:'哈比卜', en:'THE JINN', role:'厨子', tag:['巧手' ],
      desc:'对主角妻子有隐秘的爱慕。'
    },

    { img:'p09.jpg', name:'麦娜尔', en:'THE WARRIOR', role:'制图者', tag:['征服','坚韧'],
      desc:'裹头巾与披肩，手持长矛与经卷，纹身从颈侧一路延伸到手臂。她的目光直视画外，像是在打量你——在这座宫廷里，能直视别人的人通常握有实权。' },

    { img:'p10.jpg', name:'法里斯', en:'THE OLD MAN', role:'近卫', tag:['赌狗','线索'],
      desc:'红头巾、金耳饰，络腮胡里藏着笑意，刀鞘上的金色纹样磨损了，说明它跟了很久。' },

    { img:'p11.jpg', name:'玛希尔', en:'THE ALCHEMIST', role:'发明家', tag:['炼金','谋略'],
      desc:'护目镜推上额头，皮革围裙满是口袋与工具，手中托着一枚散发幽蓝光芒的瓶子。配方可以为盟友加上属性，也可以为对手埋下陷阱——在这座宫廷里，最可怕的不是刀，是配方。' },

    { img:'p12.jpg', name:'奈布哈尼', en:'THE LADY', role:'近卫', tag:['纵欲','忠诚'],
      desc:'艳红卷发倾泻而下，肩披白色滚金边的斗篷，手按刀柄。在苏丹的宫廷里，愿意这样看你的人，通常已经把你算进了某个计划。' },

    { img:'p13.jpg', name:'巴拉特', en:'THE ARCHER', role:'异国商人', tag:['征服','自由'],
      desc:'每当别人问起故乡，他却总说自己是没有家的人。' },

    { img:'p14.jpg', name:'哲瓦德与阿鲁米娜', en:'THE PAIR', role:'少女与老者', tag:['市井','传承'],
      desc:'戴孔雀羽翎的少女与摊开双手的老者。老者掌中全是金币，少女颈上却是价值不菲的宝石。在这座宫廷的边缘，有人在教另一个新人如何活下去。' },

    { img:'p15.jpg', name:'法尔扎克', en:'THE YOUNGFATHE', role:'质子', tag:['宫廷','征服'],
      desc:'垂眼的年轻人，缀着宝石耳饰。这个游戏里最不设防的人往往最危险——他看上去像是什么都还没经历。' },

    { img:'p16.jpg', name:'阿里木', en:'THE ONE-EYED', role:'黑街头子', tag:['老者','穷人'],
      desc:'常年混迹贫民窟，喜欢戏弄主角。' },

    { img:'p17.jpg', name:'贝姬夫人', en:'LADY BECKY', role:'猫', tag:['彩蛋','商店','财富'],
      desc:'没错，就是这只白猫。官方 Wiki 里，贝姬夫人的定位标签直接写着「猫」——一只绿眼睛、尾巴卷成问号的白猫。为了帮玩家找到这位神出鬼没的角色，游戏后来干脆加了一个「我的猫在哪」的提示功能。' }
  ];
  var grid = $('#galleryGrid');
  var lightbox = $('#lightbox');
  var lbArt = $('#lbArt'), lbTitle = $('#lbTitle'), lbRole = $('#lbRole'),
      lbDesc = $('#lbDesc'), lbTags = $('#lbTags'), lbClose = $('#lbClose');
  var lastFocus = null;

  // 立绘图片路径（游戏原始美术资源）
  // 图片与 index.html 位于同一目录，故此处为空；若日后移入 portraits/ 子目录，改回 'portraits/' 即可
  var PORTRAIT_BASE = '';
  function portraitImg(c, cls) {
    // 注意：c.img 本身已带 .jpg 扩展名，不要再重复拼接
    return '<img class="' + (cls || '') + '" src="' + PORTRAIT_BASE + c.img + '" ' +
           'alt="' + c.name + '立绘" loading="lazy" decoding="async" />';
  }

  // 四角方形回纹 + 内侧细线，复刻立绘封面边框
function frameCorners(cls) {
    return '<span class="corner tl"></span><span class="corner tr"></span>' +
           '<span class="corner bl"></span><span class="corner br"></span>' +
           (cls ? '<span class="' + cls + '"></span>' : '');
  }

  if (grid) {
    grid.innerHTML = CHARS.map(function (c, i) {
      return '' +
      '<article class="gcard reveal" role="button" tabindex="0" data-i="' + i + '" aria-label="查看 ' + c.name + ' 的详细档案">' +
        frameCorners('gcard-rule') +
        '<div class="gcard-art">' + portraitImg(c, 'gcard-img') +
          '<span class="gcard-zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></span>' +
        '</div>' +
        '<div class="gcard-meta">' +
          '<h3>' + c.name + '<span>' + c.en + '</span></h3>' +
          '<p>' + c.role + '</p>' +
        '</div>' +
      '</article>';
    }).join('');

    // 图片加载完成后移除骨架占位
    $$('img', grid).forEach(function (img) {
      if (img.complete) img.parentNode.classList.add('is-loaded');
      else img.addEventListener('load', function () { img.parentNode.classList.add('is-loaded'); });
      img.addEventListener('error', function () { img.parentNode.classList.add('is-failed'); });
    });

    // 渐显（网格内的元素在插入后需单独观察）
    var gio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); gio.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    $$('.gcard', grid).forEach(function (el, i) {
      el.style.transitionDelay = ((i % 4) * 0.07) + 's';
      gio.observe(el);
    });

    var lbIndex = 0;
    function openLightbox(i, keepFocus) {
      var c = CHARS[i];
      if (!c) return;
      lbIndex = i;
      if (!keepFocus) lastFocus = document.activeElement;
      lbArt.innerHTML = portraitImg(c, 'lb-img');
      lbTitle.textContent = c.name;
      lbRole.textContent = c.en + '  ·  ' + c.role;
      lbDesc.textContent = c.desc;
      lbTags.innerHTML = c.tag.map(function (t) { return '<li>' + t + '</li>'; }).join('');
      var lbCount = document.getElementById('lbCount');
      if (lbCount) lbCount.textContent = (i + 1) + ' / ' + CHARS.length;
      if (lightbox.hidden) {
        lightbox.hidden = false;
        document.body.classList.add('is-locked');
        requestAnimationFrame(function () {
          lightbox.classList.add('is-open');
          lbClose.focus();
        });
      }
    }

    // 灯箱内上下张切换
    var lbPrev = document.getElementById('lbPrev');
    var lbNext = document.getElementById('lbNext');
    if (lbPrev && lbNext) {
      lbPrev.addEventListener('click', function () {
        openLightbox((lbIndex - 1 + CHARS.length) % CHARS.length, true);
      });
      lbNext.addEventListener('click', function () {
        openLightbox((lbIndex + 1) % CHARS.length, true);
      });
    }
    // 灯箱内方向键切换
    document.addEventListener('keydown', function (e) {
      if (!lightbox || lightbox.hidden) return;
      if (e.key === 'ArrowLeft' && lbPrev) { e.preventDefault(); lbPrev.click(); }
      if (e.key === 'ArrowRight' && lbNext) { e.preventDefault(); lbNext.click(); }
    });

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      setTimeout(function () { lightbox.hidden = true; }, 380);
      if (lastFocus) lastFocus.focus();
    }

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.gcard');
      if (b) openLightbox(parseInt(b.getAttribute('data-i'), 10));
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var b = e.target.closest('.gcard');
      if (b) { e.preventDefault(); openLightbox(parseInt(b.getAttribute('data-i'), 10)); }
    });

    lbClose.addEventListener('click', closeLightbox);
    $$('[data-close]').forEach(function (el) { el.addEventListener('click', closeLightbox); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
      // 灯箱内焦点循环
      if (e.key === 'Tab' && lightbox && !lightbox.hidden) {
        e.preventDefault();
        lbClose.focus();
      }
    });
  }

  /* =========================================================
     9. FAQ 手风琴
     ========================================================= */
  $$('.faq-item').forEach(function (item) {
    var q = $('.faq-q', item);
    q.addEventListener('click', function () {
      var open = item.classList.contains('is-open');
      // 手风琴：同时只开一个
      $$('.faq-item').forEach(function (other) {
        other.classList.remove('is-open');
        $('.faq-q', other).setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item.classList.add('is-open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- 10. 无障碍播报 ---------- */
  var live = document.createElement('div');
  live.setAttribute('aria-live', 'polite');
  live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap';
  document.body.appendChild(live);

  function announce(msg) {
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 60);
  }

  /* ---------- 11. 平滑锚点补偿固定头 ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.pageYOffset - (parseInt(getComputedStyle(root).getPropertyValue('--header-h')) + 18);
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', id);
    });
  });

})();
