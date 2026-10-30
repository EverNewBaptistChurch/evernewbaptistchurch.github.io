/* 화면 양옆 여백을 걸어 다니며 마우스를 따라오는 양 캐릭터입니다. 수정할 필요 없습니다.
   - 마우스 높이를 따라 총총 걷고, 마우스가 반대편으로 가면 화면 밖으로 나갔다가 반대쪽에서 들어옵니다.
   - 멈추면 씩 웃고, 가끔 눈을 깜빡이고, 오래 가만히 있으면 졸고, 클릭하면 하트를 띄웁니다.
   - 휴대폰·태블릿처럼 마우스가 없거나, 화면이 좁아 여백이 부족하면 나타나지 않습니다. */
(function () {
  var CONTENT_WIDTH = 680; // style.css 의 .wrap 최대 너비
  var MIN_SCREEN = 900;    // 이보다 좁은 화면에서는 숨김
  var W = 72, H = 90;      // 양 크기(px)
  var SPEED = 0.14, OUT_SPEED = 0.36, IN_SPEED = 0.24; // 걷는 속도(px/ms)
  var SLEEP_AFTER = 7000;  // 이만큼(ms) 가만히 있으면 졸기 시작

  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var css = [
    '.sheep-buddy { position: fixed; left: 0; top: 0; width: ' + W + 'px; z-index: 5; pointer-events: none; will-change: transform; }',
    '.sheep-buddy svg { display: block; width: 100%; height: auto; overflow: visible; pointer-events: auto; cursor: pointer; }',
    '.sheep-buddy .face, .sheep-buddy .zzz { display: none; }',
    '.sheep-buddy [data-face="normal"] .f-normal, .sheep-buddy [data-face="walk"] .f-walk, .sheep-buddy [data-face="smile"] .f-smile,',
    '.sheep-buddy [data-face="blink"] .f-blink, .sheep-buddy [data-face="sleep"] .f-sleep, .sheep-buddy [data-face="love"] .f-love,',
    '.sheep-buddy [data-face="sleep"] .zzz { display: inline; }',
    '.sheep-buddy .leg, .sheep-buddy .arm, .sheep-buddy .lean, .sheep-buddy .head, .sheep-buddy .lift, .sheep-buddy .cheek { transform-box: fill-box; }',
    '.sheep-buddy .leg { transform-origin: 50% 0; }',
    '.sheep-buddy .arm-l { transform-origin: 100% 20%; } .sheep-buddy .arm-r { transform-origin: 0 20%; }',
    '.sheep-buddy .lean { transform-origin: 50% 100%; }',
    '.sheep-buddy .head { transform-origin: 50% 90%; transition: transform .3s; }',
    '.sheep-buddy .cheek { transform-origin: center; }',
    '.sheep-buddy .lift { transform-origin: 50% 100%; animation: sheep-breathe 2.6s ease-in-out infinite; }',
    '.sheep-buddy .walking .lift { animation: sheep-hop .16s ease-in-out infinite alternate; }',
    '.sheep-buddy .walking .leg-l { animation: sheep-step .32s linear infinite; }',
    '.sheep-buddy .walking .leg-r { animation: sheep-step .32s linear infinite; animation-delay: -.16s; }',
    '.sheep-buddy .walking .arm-l { animation: sheep-swing .32s linear infinite; animation-delay: -.16s; }',
    '.sheep-buddy .walking .arm-r { animation: sheep-swing .32s linear infinite; }',
    '.sheep-buddy.right [data-face="smile"] .head { transform: rotate(-7deg); }',
    '.sheep-buddy.left [data-face="smile"] .head { transform: rotate(7deg); }',
    '.sheep-buddy [data-face="smile"] .cheek, .sheep-buddy [data-face="love"] .cheek { transform: scale(1.35); }',
    '.sheep-buddy [data-face="sleep"] .head { transform: rotate(8deg) translateY(2px); }',
    '.sheep-buddy .zzz text { animation: sheep-zz 2.4s ease-in-out infinite; }',
    '.sheep-buddy .zzz text + text { animation-delay: .8s; }',
    '.sheep-buddy .jump .lean { animation: sheep-jump .5s ease-out; }',
    '.sheep-buddy__heart { position: absolute; left: ' + (W / 2 - 8) + 'px; top: -10px; font-size: 20px; line-height: 1; color: #f0708a; animation: sheep-heart 1s ease-out forwards; }',
    '@keyframes sheep-breathe { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.02); } }',
    '@keyframes sheep-hop { from { transform: translateY(0); } to { transform: translateY(-4px); } }',
    '@keyframes sheep-step { 0%, 100% { transform: rotate(22deg); } 50% { transform: rotate(-22deg); } }',
    '@keyframes sheep-swing { 0%, 100% { transform: rotate(25deg); } 50% { transform: rotate(-25deg); } }',
    '@keyframes sheep-zz { 0% { opacity: 0; transform: translate(0, 0); } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(8px, -14px); } }',
    '@keyframes sheep-jump { 0% { transform: translateY(0) scaleY(.9); } 35% { transform: translateY(-22px) scaleY(1.05); } 70% { transform: translateY(0) scaleY(.92); } 100% { transform: none; } }',
    '@keyframes sheep-heart { from { opacity: 1; transform: translateY(0) scale(.6); } to { opacity: 0; transform: translateY(-46px) scale(1.2); } }',
    '@media (prefers-reduced-motion: reduce) { .sheep-buddy *, .sheep-buddy__heart { animation: none !important; transition: none !important; } }'
  ].join('\n');

  var eyes = '<g class="eyes"><circle cx="52" cy="60" r="3" fill="#2b2118"/><circle cx="68" cy="60" r="3" fill="#2b2118"/>' +
             '<circle cx="53" cy="59" r="1" fill="#fff"/><circle cx="69" cy="59" r="1" fill="#fff"/></g>';
  var svg =
    '<svg viewBox="0 0 120 150" data-face="normal" aria-hidden="true" focusable="false">' +
    '<defs>' +
      '<g id="sheep-buddy-body"><circle cx="60" cy="98" r="20"/><circle cx="60" cy="110" r="18"/><circle cx="45" cy="100" r="11"/>' +
        '<circle cx="75" cy="100" r="11"/><circle cx="49" cy="116" r="10"/><circle cx="71" cy="116" r="10"/></g>' +
      '<g id="sheep-buddy-head"><circle cx="60" cy="24" r="12"/><circle cx="45" cy="28" r="11"/><circle cx="75" cy="28" r="11"/>' +
        '<circle cx="35" cy="42" r="11"/><circle cx="85" cy="42" r="11"/><circle cx="60" cy="52" r="32"/></g>' +
    '</defs>' +
    '<g class="lean"><g class="lift">' +
      '<g class="leg leg-l"><rect x="47" y="116" width="10" height="22" rx="5" fill="#5a463a"/><ellipse cx="51" cy="139" rx="7" ry="4" fill="#3d2f26"/></g>' +
      '<g class="leg leg-r"><rect x="63" y="116" width="10" height="22" rx="5" fill="#5a463a"/><ellipse cx="69" cy="139" rx="7" ry="4" fill="#3d2f26"/></g>' +
      '<use href="#sheep-buddy-body" fill="#fff" stroke="#3d2f26" stroke-width="5"/><use href="#sheep-buddy-body" fill="#fff"/>' +
      '<g class="arm arm-l"><ellipse cx="34" cy="102" rx="6.5" ry="9" fill="#fff" stroke="#3d2f26" stroke-width="2.5"/></g>' +
      '<g class="arm arm-r"><ellipse cx="86" cy="102" rx="6.5" ry="9" fill="#fff" stroke="#3d2f26" stroke-width="2.5"/></g>' +
      '<path d="M44 82 Q60 90 76 82" stroke="#8dc63f" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="60" cy="90" r="5" fill="#f5c542" stroke="#3d2f26" stroke-width="2"/>' +
      '<g class="head">' +
        '<ellipse cx="22" cy="58" rx="11" ry="6" transform="rotate(-15 22 58)" fill="#fde3cf" stroke="#3d2f26" stroke-width="2.5"/>' +
        '<ellipse cx="98" cy="58" rx="11" ry="6" transform="rotate(15 98 58)" fill="#fde3cf" stroke="#3d2f26" stroke-width="2.5"/>' +
        '<use href="#sheep-buddy-head" fill="#fff" stroke="#3d2f26" stroke-width="5"/><use href="#sheep-buddy-head" fill="#fff"/>' +
        '<g class="look">' +
          '<ellipse cx="60" cy="62" rx="22" ry="19" fill="#fde9d6" stroke="#3d2f26" stroke-width="2.5"/>' +
          '<circle class="cheek" cx="45" cy="69" r="4" fill="#f59a8a" opacity=".65"/><circle class="cheek" cx="75" cy="69" r="4" fill="#f59a8a" opacity=".65"/>' +
          '<g class="face f-normal">' + eyes + '<path d="M56 69 Q58 72 60 69 Q62 72 64 69" stroke="#3d2f26" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>' +
          '<g class="face f-walk">' + eyes + '<path d="M47 54 L55 55 M73 54 L65 55" stroke="#3d2f26" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="60" cy="70" rx="2.6" ry="2.2" fill="#7a3b2e"/></g>' +
          '<g class="face f-smile"><path d="M48 61 Q52 55.5 56 61 M64 61 Q68 55.5 72 61" stroke="#2b2118" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
            '<path d="M53 67 Q60 77 67 67 Z" fill="#7a3b2e" stroke="#3d2f26" stroke-width="1.5" stroke-linejoin="round"/><path d="M56.5 71.5 Q60 74.5 63.5 71.5" fill="#f08d86"/></g>' +
          '<g class="face f-blink"><path d="M49 60.5 L55 60.5 M65 60.5 L71 60.5" stroke="#2b2118" stroke-width="2.2" stroke-linecap="round"/>' +
            '<path d="M56 69 Q58 72 60 69 Q62 72 64 69" stroke="#3d2f26" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>' +
          '<g class="face f-sleep"><path d="M48 59 Q52 63 56 59 M64 59 Q68 63 72 59" stroke="#2b2118" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="60" cy="70" r="1.8" fill="#7a3b2e"/></g>' +
          '<g class="face f-love"><path d="M52 63 l-4 -4 a2.3 2.3 0 0 1 4 -2.5 a2.3 2.3 0 0 1 4 2.5 z M68 63 l-4 -4 a2.3 2.3 0 0 1 4 -2.5 a2.3 2.3 0 0 1 4 2.5 z" fill="#e8506e"/>' +
            '<path d="M53 67 Q60 77 67 67 Z" fill="#7a3b2e" stroke="#3d2f26" stroke-width="1.5" stroke-linejoin="round"/></g>' +
        '</g>' +
      '</g>' +
    '</g></g>' +
    '<g class="zzz" fill="#36601a" font-weight="700" font-family="sans-serif"><text x="92" y="22" font-size="13">z</text><text x="100" y="12" font-size="10">z</text></g>' +
    '</svg>';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.className = 'sheep-buddy right';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = svg;
  document.body.appendChild(root);

  var sheep = root.querySelector('svg');
  var look = sheep.querySelector('.look');
  var eyeGroups = sheep.querySelectorAll('.eyes');
  var header = document.querySelector('.site-header');

  var side = 'right', phase = 'in';
  var mouse = { x: -1, y: -1 };
  var x = 0, y = 0, targetY = 0;
  var lastFrame = 0, lastMove = 0, arrivedAt = 0, loveUntil = 0, nextBlink = 0;
  var enabled = false, running = false;

  function vw() { return document.documentElement.clientWidth; }
  function vh() { return document.documentElement.clientHeight; }
  function gutter() { return (vw() - CONTENT_WIDTH) / 2; }
  function home(s) { return s === 'left' ? gutter() / 2 - W / 2 : vw() - gutter() / 2 - W / 2; }
  function offstage(s) { return s === 'left' ? -W - 10 : vw() + 10; }
  function clampY(v) {
    var top = (header ? header.getBoundingClientRect().bottom : 0) + 8;
    return Math.max(top, Math.min(vh() - H - 12, v));
  }
  function approach(from, to, step) { return from + Math.sign(to - from) * Math.min(Math.abs(to - from), step); }

  function setSide(s) {
    side = s;
    root.classList.toggle('left', s === 'left');
    root.classList.toggle('right', s === 'right');
  }

  function wantedSide() {
    if (mouse.x < 0) return side;
    if (side === 'right' && mouse.x < vw() * 0.35) return 'left';
    if (side === 'left' && mouse.x > vw() * 0.65) return 'right';
    return side;
  }

  function pickFace(now, moving) {
    if (moving) return 'walk';
    var still = now - arrivedAt;
    if (now < loveUntil) return 'love';
    if (now - lastMove > SLEEP_AFTER && still > SLEEP_AFTER) return 'sleep';
    if (still > 350 && still < 2300) return 'smile';
    if (!nextBlink || now > nextBlink + 160) nextBlink = now + 2200 + Math.random() * 2500;
    return now > nextBlink ? 'blink' : 'normal';
  }

  function tick(now) {
    if (!enabled) { running = false; return; }
    var dt = Math.min(now - (lastFrame || now), 50);
    lastFrame = now;
    var moving = false;

    if (reduceMotion.matches) {
      // 동작 줄이기: 오른쪽에 가만히 서서 표정만 바꿈
      setSide('right'); phase = 'stay';
      x = home('right'); y = clampY(vh() * 0.55);
      arrivedAt = lastMove;
    } else {
      if (phase === 'stay' && wantedSide() !== side) phase = 'out';
      if (phase === 'out') {
        x = approach(x, offstage(side), OUT_SPEED * dt);
        if (x === offstage(side)) { setSide(side === 'right' ? 'left' : 'right'); x = offstage(side); y = targetY; phase = 'in'; }
        moving = true;
      } else if (phase === 'in') {
        x = approach(x, home(side), IN_SPEED * dt);
        y = approach(y, targetY, SPEED * dt);
        if (x === home(side)) phase = 'stay';
        moving = true;
      } else {
        x = home(side);
        if (Math.abs(targetY - y) > 3 && now >= loveUntil) { y = approach(y, targetY, SPEED * dt); moving = true; }
      }
    }

    sheep.classList.toggle('walking', moving);
    if (moving) arrivedAt = now;
    var face = pickFace(now, moving);
    if (sheep.getAttribute('data-face') !== face) sheep.setAttribute('data-face', face);

    // 얼굴은 늘 본문 쪽을 보고, 눈동자는 마우스를 따라감
    look.setAttribute('transform', 'translate(' + (side === 'right' ? -3.5 : 3.5) + ' 0)');
    var ex = 0, ey = 0;
    if (mouse.x >= 0) {
      var ax = mouse.x - (x + W / 2), ay = mouse.y - (y + H * 0.4), d = Math.hypot(ax, ay) || 1;
      ex = ax / d * 1.6; ey = ay / d * 1.6;
    }
    for (var i = 0; i < eyeGroups.length; i++) eyeGroups[i].setAttribute('transform', 'translate(' + ex.toFixed(2) + ' ' + ey.toFixed(2) + ')');

    root.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    requestAnimationFrame(tick);
  }

  function update() {
    var should = finePointer.matches && vw() >= MIN_SCREEN;
    root.hidden = !should;
    if (should && !enabled) {
      // 처음 나타날 때는 오른쪽 화면 밖에서 걸어 들어옴
      setSide('right'); phase = 'in';
      x = offstage('right'); y = targetY = clampY(vh() * 0.55);
      lastMove = arrivedAt = performance.now();
    }
    enabled = should;
    if (enabled && !running) { running = true; lastFrame = 0; requestAnimationFrame(tick); }
  }

  document.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
    targetY = clampY(e.clientY - H / 2);
    lastMove = performance.now();
  });
  window.addEventListener('scroll', function () { lastMove = performance.now(); }, { passive: true });

  sheep.addEventListener('click', function () {
    loveUntil = performance.now() + 1400;
    sheep.classList.remove('jump'); void sheep.getBoundingClientRect(); sheep.classList.add('jump');
    var heart = document.createElement('span');
    heart.className = 'sheep-buddy__heart';
    heart.textContent = '♥';
    root.appendChild(heart);
    setTimeout(function () { heart.remove(); }, 1000);
  });

  window.addEventListener('resize', update);
  if (finePointer.addEventListener) finePointer.addEventListener('change', update);
  update();
})();
