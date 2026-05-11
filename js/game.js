/**
 * Game Engine — "Run To Forever" (v2 — Polished)
 * A side-scrolling runner where Dev & Kanmani jump over life's obstacles together.
 * Features: parallax, particles, coyote-time, variable jump, forgiving hitboxes.
 */
const GameEngine = (() => {
  let canvas, ctx, fw, fctx;
  const W = 800, H = 400;
  let running = false, gameOver = false, won = false;
  let score = 0, frameCount = 0, speed = 3.5;
  let groundY;

  // Player state
  let player = {
    y: 0, vy: 0, jumping: false, grounded: true,
    h: 60, w: 20,
    squash: 1, stretch: 1,        // squash-stretch for juicy feel
    coyoteTimer: 0,               // frames since leaving ground
    jumpBufferTimer: 0,           // buffered jump input
    wasGrounded: true
  };

  let obstacles = [];
  let mrVasuTimer = 0, mrVasu = null;
  let vasuMilestonesHit = new Set();
  let shakeTimer = 0, shakeIntensity = 0;
  let faceImgHim = null, faceImgHer = null;
  let confettiParts = [];
  let endPageImg = null;

  // Sprint / chase state (Mr Vasu event)
  let sprintHeld = false;
  let chaseFramesLeft = 0;
  let baseSpeed = 3.5;

  // In-game beeps only (never loads assets/audio — site music is toggle-only in app.js)
  let audioCtx = null;
  let lastScoreAt = 0;

  let winCelebrateRaf = null;
  let winCelebrateStartedAt = 0;
  let fireworksBurstInterval = null;
  const WIN_CELEBRATE_MS = 8800;
  let bgScrollPhase = 0;

  // ── Tuned Physics ──
  const GRAVITY = 0.42;
  const JUMP_FORCE = -9.8;
  const MAX_FALL = 10;
  const COYOTE_FRAMES = 6;      // can jump 6 frames after leaving edge
  const JUMP_BUFFER = 8;      // buffered jump for 8 frames
  const JUMP_CUT_MULT = 0.4;   // release early = shorter jump
  const MIN_GAP = 280;    // minimum pixels between obstacles
  const GAP_RAND = 180;    // extra random gap
  let spawnTimer = 0;
  let jumpHeld = false;

  // ── Environment layers ──
  let mountains = [], hills = [], grassTufts = [], trees = [];
  let fireflies = [], dustParts = [], trailParts = [];
  let stars = [];
  let shootingStarTimer = 0, shootingStar = null;

  const TYPES = [
    { name: 'CMA', color: '#8B6914', w: 40, h: 48 },
    { name: 'JOB', color: '#4A6741', w: 38, h: 44 },
    { name: 'GET FIT', color: '#7B4B94', w: 44, h: 40 },
    { name: 'MOVE OUT', color: '#A0522D', w: 46, h: 50 },
    { name: 'BIKE', color: '#5B7C99', w: 52, h: 38 },
    { name: 'OUR HOME', color: '#C17817', w: 48, h: 52 },
    { name: 'GET RICH', color: '#2E8B57', w: 42, h: 44 },
  ];

  /* ══════════════════════════════════════════════
     INIT
     ══════════════════════════════════════════════ */
  function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;
    groundY = H - 60;

    // Faces
    faceImgHim = new Image(); faceImgHim.src = 'assets/images/faces/dev.jpg';
    faceImgHer = new Image(); faceImgHer.src = 'assets/images/faces/kanmani.jpg';

    // End page image (shown on win at 25)
    endPageImg = new Image();
    endPageImg.src = 'assets/images/end_page/end.jpg';

    audioCtx = null;

    // Generate static environment
    generateEnvironment();

    // Buttons
    document.getElementById('btn-game-start').addEventListener('click', startGame);
    document.getElementById('btn-game-retry').addEventListener('click', startGame);
    document.getElementById('btn-game-replay').addEventListener('click', startGame);
    document.getElementById('btn-game-back-profiles').addEventListener('click', () => {
      running = false;
      resetWinFlow();
      document.getElementById('game-win-overlay').classList.add('hidden');
      App.navigateTo('profiles');
    });
    document.getElementById('btn-win-yes').addEventListener('click', showWinFinale);
    document.getElementById('btn-win-no').addEventListener('click', showWinDeclined);
    document.getElementById('btn-win-declined-replay').addEventListener('click', startGame);
    document.getElementById('btn-win-declined-back').addEventListener('click', () => { running = false; resetWinFlow(); document.getElementById('game-win-overlay').classList.add('hidden'); App.navigateTo('profiles'); });
    document.getElementById('game-back').addEventListener('click', () => { running = false; resetWinFlow(); document.getElementById('game-win-overlay').classList.add('hidden'); App.navigateTo('profiles'); });

    // Controls — keydown
    document.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowRight') {
        sprintHeld = true;
        unlockAudio();
      }
      if (e.code === 'Space' && running && !gameOver && !won) {
        e.preventDefault();
        jumpHeld = true;
        player.jumpBufferTimer = JUMP_BUFFER;
        unlockAudio();
      }
    });
    // Controls — keyup (variable jump height)
    document.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowRight') {
        sprintHeld = false;
      }
      if (e.code === 'Space') {
        jumpHeld = false;
        if (player.vy < 0) player.vy *= JUMP_CUT_MULT;  // cut jump short
      }
    });
    // Touch / click
    canvas.addEventListener('click', () => {
      if (running && !gameOver && !won) { player.jumpBufferTimer = JUMP_BUFFER; jumpHeld = true; unlockAudio(); setTimeout(() => jumpHeld = false, 150); }
    });
    canvas.addEventListener('touchstart', (e) => {
      if (!(running && !gameOver && !won)) return;
      e.preventDefault();
      unlockAudio();
      // During Mr Vasu chase: holding the screen = sprint to escape.
      if (mrVasu) {
        sprintHeld = true;
        return;
      }
      player.jumpBufferTimer = JUMP_BUFFER;
      jumpHeld = true;
    }, { passive: false });
    canvas.addEventListener('touchend', () => {
      if (mrVasu) {
        sprintHeld = false;
      } else {
        jumpHeld = false;
        if (player.vy < 0) player.vy *= JUMP_CUT_MULT;
      }
    });

    drawIdle();
  }

  function generateEnvironment() {
    // Stars
    stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H * 0.45, size: 0.5 + Math.random() * 2, twinkleSpeed: 0.02 + Math.random() * 0.03, phase: Math.random() * Math.PI * 2 });
    }
    // Mountains (far background)
    mountains = [];
    let mx = -50;
    while (mx < W + 200) {
      const mw = 120 + Math.random() * 160;
      mountains.push({ x: mx, w: mw, h: 60 + Math.random() * 80 });
      mx += mw * 0.6;
    }
    // Hills (mid background)
    hills = [];
    let hx = -30;
    while (hx < W + 150) {
      const hw = 80 + Math.random() * 100;
      hills.push({ x: hx, w: hw, h: 30 + Math.random() * 40 });
      hx += hw * 0.7;
    }
    // Trees
    trees = [];
    for (let i = 0; i < 8; i++) {
      trees.push({ x: Math.random() * W, h: 30 + Math.random() * 50, w: 15 + Math.random() * 10, sway: Math.random() * Math.PI * 2 });
    }
    // Grass tufts
    grassTufts = [];
    for (let i = 0; i < 40; i++) {
      grassTufts.push({ x: Math.random() * W, blades: 3 + Math.floor(Math.random() * 4), h: 4 + Math.random() * 8, phase: Math.random() * Math.PI * 2 });
    }
    // Fireflies
    fireflies = [];
    for (let i = 0; i < 15; i++) {
      fireflies.push({ x: Math.random() * W, y: groundY - 30 - Math.random() * 120, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.3, phase: Math.random() * Math.PI * 2, size: 1.5 + Math.random() * 2 });
    }
  }

  /* ══════════════════════════════════════════════
     GAME CONTROL
     ══════════════════════════════════════════════ */
  function startGame() {
    score = 0; frameCount = 0; baseSpeed = 3.5; speed = baseSpeed;
    player.y = groundY - player.h;
    player.vy = 0; player.jumping = false; player.grounded = true;
    player.squash = 1; player.stretch = 1;
    player.coyoteTimer = 0; player.jumpBufferTimer = 0; player.wasGrounded = true;
    obstacles = []; mrVasu = null; mrVasuTimer = 0;
    vasuMilestonesHit = new Set();
    spawnTimer = 0; shakeTimer = 0; shakeIntensity = 0;
    gameOver = false; won = false; running = true;
    confettiParts = []; dustParts = []; trailParts = [];
    jumpHeld = false;
    sprintHeld = false;
    chaseFramesLeft = 0;
    lastScoreAt = 0;
    bgScrollPhase = 0;

    hideChaseUI();
    resetWinFlow();

    document.getElementById('game-start-overlay').classList.add('hidden');
    document.getElementById('game-over-overlay').classList.add('hidden');
    document.getElementById('game-win-overlay').classList.add('hidden');
    updateScoreUI();
    loop();
  }

  function tryJump() {
    if (player.grounded || player.coyoteTimer < COYOTE_FRAMES) {
      player.vy = JUMP_FORCE;
      player.jumping = true;
      player.grounded = false;
      player.coyoteTimer = COYOTE_FRAMES + 1;
      player.squash = 0.7; player.stretch = 1.3;
      playSfx('jump');
      // Jump dust
      for (let i = 0; i < 6; i++) {
        dustParts.push({ x: 145 + (Math.random() - 0.5) * 20, y: groundY, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2, life: 1, size: 2 + Math.random() * 3 });
      }
    }
  }

  /* ── Main Loop ── */
  function loop() {
    if (!running) return;
    frameCount++;
    update();
    draw();
    if (!gameOver && !won) requestAnimationFrame(loop);
  }

  /* ══════════════════════════════════════════════
     UPDATE (Physics & Logic)
     ══════════════════════════════════════════════ */
  function update() {
    // ── Player Physics ──
    player.vy += GRAVITY;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;
    player.y += player.vy;

    // Ground check
    if (player.y >= groundY - player.h) {
      if (!player.wasGrounded && player.vy > 3) {
        // Landing impact — dust burst
        player.squash = 1.3; player.stretch = 0.7;
        for (let i = 0; i < 5; i++) {
          dustParts.push({ x: 145 + (Math.random() - 0.5) * 30, y: groundY, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 1.5, life: 1, size: 2 + Math.random() * 2 });
        }
      }
      player.y = groundY - player.h;
      player.vy = 0;
      player.jumping = false;
      player.grounded = true;
      player.coyoteTimer = 0;
      player.wasGrounded = true;
    } else {
      player.wasGrounded = false;
      player.coyoteTimer++;
    }

    // Squash-stretch recovery
    player.squash += (1 - player.squash) * 0.15;
    player.stretch += (1 - player.stretch) * 0.15;

    // Jump buffer — try to jump if buffered
    if (player.jumpBufferTimer > 0) {
      player.jumpBufferTimer--;
      tryJump();
      if (player.jumping) player.jumpBufferTimer = 0;
    }

    // ── Speed (gentle ramp) ──
    baseSpeed = 3.5 + Math.min(score * 0.08, 2.5);
    speed = baseSpeed;
    if (chaseFramesLeft > 0) {
      // Sprinting makes you move forward faster (escape), but Mr Vasu still chases for 5 sec.
      if (sprintHeld) speed = baseSpeed + 2.6;
    }

    // ── Spawn / Move Obstacles ──
    // Obstacles disappear during Mr Vasu chase.
    if (!mrVasu) {
      spawnTimer += speed;
      const gap = MIN_GAP + Math.random() * GAP_RAND;
      if (spawnTimer >= gap) {
        spawnTimer = 0;
        spawnObstacle();
      }
      obstacles.forEach(o => o.x -= speed);
    } else {
      obstacles = [];
    }

    // ── Score ──
    if (!mrVasu) {
      obstacles.forEach(o => {
        if (!o.scored && o.x + o.w < 130) {
          o.scored = true;
          score++;
          updateScoreUI();
          playSfx('tick');
          maybeTriggerMrVasu();
          // Score sparkle
          for (let i = 0; i < 4; i++) {
            confettiParts.push({ x: 145 + (Math.random() - 0.5) * 10, y: player.y - 15, vy: -1.5 - Math.random(), vx: (Math.random() - 0.5) * 2, o: 1, char: ['♥', '✦', '★', '♥'][i] });
          }
          if (score >= 25) { triggerWin(); return; }
        }
      });
    }

    // Cleanup
    obstacles = obstacles.filter(o => o.x > -100);

    // ── Collision (forgiving — shrink hitboxes 30%) ──
    if (!mrVasu) {
      const margin = 8;
      const px1 = 130 + margin, px2 = 160 + margin;
      const py = player.y + margin, pw = 14 - margin, ph = player.h - margin * 2;
      for (const o of obstacles) {
        const ox = o.x + 4, oy = groundY - o.h + 4, ow = o.w - 8, oh = o.h - 6;
        if (rectCollide(px1, py, pw, ph, ox, oy, ow, oh) ||
          rectCollide(px2, py, pw, ph, ox, oy, ow, oh)) {
          triggerGameOver(o.name);
          return;
        }
      }
    }

    // ── Mr Vasu ──
    if (mrVasu) {
      // 5-second chase: holding sprint prevents getting caught.
      mrVasu.timer++;
      if (chaseFramesLeft > 0) chaseFramesLeft--;

      // If sprint is held, Mr Vasu should NEVER be able to touch you.
      // Only when you release sprint does he close in and catch you.
      if (sprintHeld) {
        // Keep him at a safe distance (also feels like you're sprinting away).
        mrVasu.x = Math.min(mrVasu.x, 80);
      } else {
        mrVasu.x += baseSpeed * 1.35;
        if (mrVasu.x > 118) {
          triggerGameOver('MR VASU');
          return;
        }
      }

      // Chase ends after 5 seconds; he leaves.
      if (chaseFramesLeft <= 0) {
        mrVasu = null;
        hideChaseUI();
      } else {
        updateChaseUI(chaseFramesLeft / (5 * 60));
      }
    }

    // Background scroll (after Mr Vasu / score so activation frame uses boosted speed immediately).
    const bgSpeed = mrVasu ? baseSpeed + 3.25 : speed;
    bgScrollPhase += bgSpeed * 0.52;

    // ── Shake decay ──
    if (shakeTimer > 0) { shakeTimer--; shakeIntensity *= 0.9; }

    // ── Parallax environment ──
    stars.forEach(s => {
      s.x -= bgSpeed * 0.024;
      if (s.x < -8) s.x = W + Math.random() * 60;
    });

    mountains.forEach(m => { m.x -= bgSpeed * 0.09; if (m.x < -m.w) m.x += W + m.w; });
    hills.forEach(h => { h.x -= bgSpeed * 0.26; if (h.x < -h.w) h.x += W + h.w; });
    trees.forEach(t => { t.x -= bgSpeed * 0.42; if (t.x < -30) t.x += W + 60; t.sway += 0.024; });
    grassTufts.forEach(g => { g.x -= bgSpeed * 0.82; if (g.x < -20) g.x += W + 40; g.phase += 0.055; });

    // ── Fireflies ──
    fireflies.forEach(f => {
      f.x += f.vx - bgSpeed * 0.035 + Math.sin(frameCount * 0.01 + f.phase) * 0.3;
      f.y += f.vy + Math.cos(frameCount * 0.015 + f.phase) * 0.2;
      f.phase += 0.03;
      if (f.x < -10) f.x = W + 10;
      if (f.x > W + 10) f.x = -10;
      if (f.y < groundY - 180) f.y = groundY - 30;
      if (f.y > groundY - 10) f.y = groundY - 100;
    });

    // ── Shooting stars ──
    shootingStarTimer++;
    if (shootingStarTimer > 300 + Math.random() * 400 && !shootingStar) {
      shootingStar = { x: Math.random() * W * 0.5 + W * 0.3, y: Math.random() * 40 + 10, vx: -4 - Math.random() * 3, vy: 2 + Math.random() * 2, life: 1 };
      shootingStarTimer = 0;
    }
    if (shootingStar) {
      shootingStar.x += shootingStar.vx - bgSpeed * 0.04;
      shootingStar.y += shootingStar.vy;
      shootingStar.life -= 0.025;
      if (shootingStar.life <= 0) shootingStar = null;
    }

    // ── Dust particles ──
    dustParts.forEach(d => { d.x += d.vx; d.y += d.vy; d.vy += 0.05; d.life -= 0.03; });
    dustParts = dustParts.filter(d => d.life > 0);

    // ── Trail behind players ──
    if (frameCount % 3 === 0 && !gameOver) {
      trailParts.push({ x: 145, y: player.y + player.h * 0.5, life: 1 });
    }
    trailParts.forEach(t => { t.life -= 0.04; t.x -= speed * 0.5; });
    trailParts = trailParts.filter(t => t.life > 0);

    // ── Confetti / hearts ──
    if (frameCount % 80 === 0 && !gameOver) {
      confettiParts.push({ x: 145, y: player.y - 10, vy: -1, vx: (Math.random() - 0.5) * 0.5, o: 1, char: '♥' });
    }
    confettiParts.forEach(h => { h.y += h.vy; h.x += (h.vx || 0); h.o -= 0.012; });
    confettiParts = confettiParts.filter(h => h.o > 0);
  }

  function rectCollide(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function spawnObstacle() {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    obstacles.push({ x: W + 20, w: type.w, h: type.h, name: type.name, color: type.color, scored: false });
  }

  /* ══════════════════════════════════════════════
     DRAW — Main render
     ══════════════════════════════════════════════ */
  function draw() {
    ctx.save();
    if (shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * shakeIntensity, (Math.random() - 0.5) * shakeIntensity * 0.7);
    }

    // ── Sky gradient (time-of-day feel) ──
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0B0D21');
    sky.addColorStop(0.35, '#1a1a2e');
    sky.addColorStop(0.7, '#2D1B33');
    sky.addColorStop(1, '#3D2545');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── Stars with twinkling ──
    stars.forEach(s => {
      const twinkle = Math.sin(frameCount * s.twinkleSpeed + s.phase) * 0.4 + 0.6;
      ctx.globalAlpha = twinkle * 0.6;
      ctx.fillStyle = '#FEFAE0';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ── Shooting star ──
    if (shootingStar && shootingStar.life > 0) {
      ctx.globalAlpha = shootingStar.life;
      const grad = ctx.createLinearGradient(shootingStar.x, shootingStar.y, shootingStar.x - shootingStar.vx * 8, shootingStar.y - shootingStar.vy * 8);
      grad.addColorStop(0, '#FEFAE0');
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shootingStar.x, shootingStar.y);
      ctx.lineTo(shootingStar.x - shootingStar.vx * 8, shootingStar.y - shootingStar.vy * 8);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ── Mountains (far parallax) ──
    ctx.fillStyle = 'rgba(30, 18, 40, 0.8)';
    mountains.forEach(m => {
      ctx.beginPath();
      ctx.moveTo(m.x, groundY);
      ctx.lineTo(m.x + m.w * 0.5, groundY - m.h);
      ctx.lineTo(m.x + m.w, groundY);
      ctx.closePath();
      ctx.fill();
    });

    // ── Hills (mid parallax) ──
    ctx.fillStyle = 'rgba(45, 30, 55, 0.7)';
    hills.forEach(h => {
      ctx.beginPath();
      ctx.ellipse(h.x + h.w * 0.5, groundY, h.w * 0.5, h.h, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    });

    // ── Trees (silhouettes) ──
    trees.forEach(t => {
      const sway = Math.sin(t.sway) * 2;
      ctx.fillStyle = 'rgba(25, 18, 35, 0.6)';
      // Trunk
      ctx.fillRect(t.x - 2, groundY - t.h * 0.4, 4, t.h * 0.4);
      // Canopy
      ctx.beginPath();
      ctx.ellipse(t.x + sway, groundY - t.h * 0.6, t.w * 0.5, t.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Ground ──
    const gGrad = ctx.createLinearGradient(0, groundY, 0, H);
    gGrad.addColorStop(0, '#2A1D30');
    gGrad.addColorStop(0.3, '#231828');
    gGrad.addColorStop(1, '#1A1220');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    // Ground line (soft glow)
    ctx.shadowColor = 'rgba(212,163,115,0.2)';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = 'rgba(212,163,115,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    ctx.shadowBlur = 0;

    // Ground texture dots
    ctx.fillStyle = 'rgba(212,163,115,0.05)';
    for (let i = 0; i < W; i += 16) {
      const gx = ((i - bgScrollPhase * 0.75) % W + W) % W;
      ctx.fillRect(gx, groundY + 6 + (i % 3) * 4, 6, 1.5);
    }

    // ── Grass tufts ──
    grassTufts.forEach(g => {
      ctx.strokeStyle = 'rgba(100, 130, 80, 0.25)';
      ctx.lineWidth = 1;
      for (let b = 0; b < g.blades; b++) {
        const sway = Math.sin(g.phase + b * 0.5) * 3;
        ctx.beginPath();
        ctx.moveTo(g.x + b * 3, groundY);
        ctx.quadraticCurveTo(g.x + b * 3 + sway, groundY - g.h * 0.6, g.x + b * 3 + sway * 1.5, groundY - g.h);
        ctx.stroke();
      }
    });

    // ── Trail particles ──
    trailParts.forEach(t => {
      ctx.globalAlpha = t.life * 0.15;
      ctx.fillStyle = '#D4A373';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3 * t.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ── Obstacles ──
    obstacles.forEach(o => drawObstacle(o));

    // ── Mr Vasu ──
    if (mrVasu) drawMrVasu(mrVasu);

    // ── Dust particles ──
    dustParts.forEach(d => {
      ctx.globalAlpha = d.life * 0.5;
      ctx.fillStyle = 'rgba(180, 160, 140, 0.6)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size * d.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ── Players (Dev and Kanmani) ──
    drawStickPerson(130, player.y, faceImgHim, '#D4A373', 'D');
    drawStickPerson(160, player.y, faceImgHer, '#C9ADA7', 'V');

    // ── Held-hands line ──
    if (!player.jumping) {
      ctx.strokeStyle = 'rgba(212,163,115,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(138, player.y + 28);
      ctx.lineTo(152, player.y + 28);
      ctx.stroke();
    }

    // ── Floating hearts / sparkles ──
    confettiParts.forEach(h => {
      ctx.globalAlpha = Math.max(0, h.o);
      ctx.font = '12px serif';
      ctx.fillStyle = h.char === '♥' ? '#C9ADA7' : '#FEFAE0';
      ctx.fillText(h.char || '♥', h.x + Math.sin(h.y * 0.08) * 10, h.y);
    });
    ctx.globalAlpha = 1;

    // ── Fireflies ──
    fireflies.forEach(f => {
      const glow = Math.sin(f.phase) * 0.4 + 0.6;
      ctx.globalAlpha = glow * 0.7;
      ctx.shadowColor = 'rgba(200, 220, 100, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = `rgba(210, 230, 120, ${glow})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  /* ── Stick Person with Squash-Stretch ── */
  function drawStickPerson(x, y, faceImg, color, initial, celebrate = false) {
    const headR = 10;
    const sq = player.squash, st = player.stretch;
    const headY = y + headR;
    const bodyTop = y + headR * 2;
    const bodyBot = y + player.h - 12;
    const legBot = y + player.h;

    ctx.save();
    ctx.translate(x, y + player.h);
    ctx.scale(sq, st);
    ctx.translate(-x, -(y + player.h));

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Body with slight bob
    const bob = player.grounded ? Math.sin(frameCount * 0.12) * 1.5 : 0;
    ctx.beginPath();
    ctx.moveTo(x, bodyTop + bob);
    ctx.lineTo(x, bodyBot + bob);
    ctx.stroke();

    // Legs — running gait, or idle sway during win celebration
    const legPhase = celebrate
      ? Math.sin(frameCount * 0.09) * 4
      : Math.sin(frameCount * 0.13) * 10;
    const kneeH = (bodyBot + legBot) * 0.5 + bob;
    ctx.beginPath();
    ctx.moveTo(x, bodyBot + bob);
    ctx.quadraticCurveTo(x - legPhase * 0.5, kneeH, x - legPhase, legBot);
    ctx.moveTo(x, bodyBot + bob);
    ctx.quadraticCurveTo(x + legPhase * 0.5, kneeH, x + legPhase, legBot);
    ctx.stroke();

    // Arms — swing normally, or reach toward centre when celebrating
    const armPhase = Math.sin(frameCount * 0.13 + 1) * 7;
    ctx.beginPath();
    ctx.moveTo(x, bodyTop + 8 + bob);
    if (celebrate) {
      const toward = x < W * 0.5 ? 1 : -1;
      const reach = toward * (16 + Math.sin(frameCount * 0.14) * 4);
      ctx.quadraticCurveTo(x + toward * 4, bodyTop + 18 + bob, x + reach, bodyTop + 12 + bob);
      ctx.moveTo(x, bodyTop + 8 + bob);
      ctx.quadraticCurveTo(x - toward * 3, bodyTop + 10 + bob, x - toward * 2, bodyTop + 22 + bob);
    } else {
      ctx.quadraticCurveTo(x - 6, bodyTop + 14 + armPhase + bob, x - 10, bodyTop + 10 + armPhase + bob);
      ctx.moveTo(x, bodyTop + 8 + bob);
      ctx.quadraticCurveTo(x + 6, bodyTop + 14 - armPhase + bob, x + 10, bodyTop + 10 - armPhase + bob);
    }
    ctx.stroke();

    // Head
    const headDrawY = headY + bob;
    if (faceImg && faceImg.complete && faceImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, headDrawY, headR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(faceImg, x - headR, headDrawY - headR, headR * 2, headR * 2);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x, headDrawY, headR, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, headDrawY, headR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.fillStyle = '#0B0D21';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initial, x, headDrawY);
    }

    ctx.restore();
  }

  /* ── Obstacle Drawing ── */
  function drawObstacle(o) {
    const x = o.x, by = groundY - o.h, w = o.w, h = o.h;

    // Shadow under obstacle
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, groundY + 2, w * 0.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = o.color;
    switch (o.name) {
      case 'CMA':
        for (let i = 0; i < 3; i++) {
          const bh = h / 3;
          ctx.fillStyle = ['#8B6914', '#A67C00', '#C4960A'][i];
          roundRect(x, by + i * bh, w, bh - 2, 3);
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(x + 4, by + i * bh + 3, w - 8, 2);
        }
        break;
      case 'JOB':
        ctx.fillStyle = '#4A6741'; roundRect(x, by + 10, w, h - 10, 4);
        ctx.fillStyle = '#5C8350'; ctx.fillRect(x + w * 0.3, by, w * 0.4, 12);
        ctx.fillStyle = '#D4A373'; ctx.fillRect(x + w * 0.4, by + h * 0.4, w * 0.2, 5);
        break;
      case 'GET FIT':
        ctx.fillStyle = '#7B4B94';
        ctx.fillRect(x + 10, by + h * 0.35, w - 20, 8);
        roundRect(x, by + 5, 12, h - 10, 3);
        roundRect(x + w - 12, by + 5, 12, h - 10, 3);
        break;
      case 'MOVE OUT':
        ctx.fillStyle = '#A0522D'; roundRect(x + 4, by + h * 0.45, w - 8, h * 0.55, 2);
        ctx.fillStyle = '#B8733A'; roundRect(x, by, w, h * 0.5, 2);
        ctx.strokeStyle = '#D4A373'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, by); ctx.lineTo(x + w * 0.5, by + h * 0.5);
        ctx.moveTo(x, by + h * 0.25); ctx.lineTo(x + w, by + h * 0.25);
        ctx.stroke();
        break;
      case 'BIKE':
        ctx.fillStyle = '#5B7C99';
        ctx.beginPath(); ctx.ellipse(x + 12, by + h - 10, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + w - 12, by + h - 10, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4A6A85';
        ctx.beginPath();
        ctx.moveTo(x + 12, by + h - 15); ctx.lineTo(x + w - 8, by + h - 18);
        ctx.lineTo(x + w - 5, by + 8); ctx.lineTo(x + 20, by + 5);
        ctx.closePath(); ctx.fill();
        break;
      case 'OUR HOME':
        ctx.fillStyle = '#C17817'; ctx.fillRect(x + 5, by + h * 0.4, w - 10, h * 0.6);
        ctx.fillStyle = '#E09020';
        ctx.beginPath();
        ctx.moveTo(x, by + h * 0.4); ctx.lineTo(x + w * 0.5, by); ctx.lineTo(x + w, by + h * 0.4);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8B5E10'; ctx.fillRect(x + w * 0.38, by + h * 0.6, w * 0.24, h * 0.4);
        break;
      case 'GET RICH':
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath(); ctx.ellipse(x + w * 0.5, by + h * 0.6, w * 0.38, h * 0.36, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w * 0.3, by + h * 0.3);
        ctx.quadraticCurveTo(x + w * 0.5, by - 2, x + w * 0.7, by + h * 0.3); ctx.fill();
        ctx.fillStyle = '#FEFAE0'; ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('$', x + w * 0.5, by + h * 0.6);
        break;
    }

    // Name tag with background pill
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    const tagW = ctx.measureText(o.name).width + 8;
    roundRect(x + w * 0.5 - tagW * 0.5, by - 18, tagW, 13, 4);
    ctx.fillStyle = 'rgba(254,250,224,0.9)';
    ctx.font = '8px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(o.name, x + w * 0.5, by - 9);
  }

  /* ── Mr Vasu ── */
  function drawMrVasu(v) {
    const x = v.x, y = groundY - 60;
    ctx.strokeStyle = '#E03030'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x, y + 40); ctx.stroke();
    const lp = Math.sin(frameCount * 0.2) * 10;
    ctx.beginPath();
    ctx.moveTo(x, y + 40); ctx.lineTo(x - lp, y + 55);
    ctx.moveTo(x, y + 40); ctx.lineTo(x + lp, y + 55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y + 26); ctx.lineTo(x + 14, y + 20);
    ctx.moveTo(x, y + 26); ctx.lineTo(x + 12, y + 32);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + 10, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#E03030'; ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x - 5, y + 8, 4, 3); ctx.fillRect(x + 1, y + 8, 4, 3);
    ctx.fillStyle = '#E03030'; ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('MR VASU', x, y - 4);
    if (v.timer < 40 && v.timer % 8 < 4) {
      ctx.fillStyle = 'rgba(224,48,48,0.7)'; ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.fillText('⚠️ INCOMING!', x + 40, y);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath(); ctx.fill();
  }

  function drawIdle() {
    // Static idle scene
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0B0D21'); sky.addColorStop(0.5, '#1a1a2e'); sky.addColorStop(1, '#3D2545');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // A few stars
    ctx.fillStyle = 'rgba(254,250,224,0.4)';
    for (let i = 0; i < 20; i++) {
      ctx.beginPath(); ctx.arc((i * 41) % W, (i * 29) % (H * 0.4), 1 + (i % 2), 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#2A1D30'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = 'rgba(212,163,115,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
    drawStickPerson(130, groundY - player.h, faceImgHim, '#D4A373', 'D');
    drawStickPerson(160, groundY - player.h, faceImgHer, '#C9ADA7', 'V');
  }

  /* ══════════════════════════════════════════════
     GAME STATES
     ══════════════════════════════════════════════ */
  function triggerGameOver(obstacleName) {
    gameOver = true; running = false;
    shakeTimer = 15; shakeIntensity = 5;
    hideChaseUI();
    playSfx('thud');
    // Death dust burst
    for (let i = 0; i < 12; i++) {
      dustParts.push({
        x: 145 + (Math.random() - 0.5) * 30,
        y: player.y + player.h * 0.5,
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 4,
        life: 1, size: 3 + Math.random() * 3
      });
    }
    // Render one last frame with effects
    draw();
    document.getElementById('fail-obstacle').textContent = obstacleName;
    document.getElementById('game-over-overlay').classList.remove('hidden');
  }

  function triggerWin() {
    won = true; running = false;
    hideChaseUI();

    setWinLayoutExpanded(true);
    const wo = document.getElementById('game-win-overlay');
    const q = document.getElementById('win-question-card');
    const d = document.getElementById('win-declined-card');
    const f = document.getElementById('win-finale-card');
    const endEl = document.getElementById('end-page-img');
    if (q) q.classList.add('hidden');
    if (d) d.classList.add('hidden');
    if (f) f.classList.add('hidden');
    if (endEl) endEl.classList.add('hidden');
    wo.classList.remove('hidden', 'win-phase-question', 'win-phase-declined', 'win-phase-finale');
    wo.classList.add('win-phase-celebrate');

    winCelebrateStartedAt = performance.now();
    function celebrateStep(ts) {
      const elapsed = ts - winCelebrateStartedAt;
      const t = elapsed / 1000;
      drawWinCelebration(Math.min(t, WIN_CELEBRATE_MS / 1000));
      if (elapsed >= WIN_CELEBRATE_MS) {
        winCelebrateRaf = null;
        showWinQuestion();
        return;
      }
      winCelebrateRaf = requestAnimationFrame(celebrateStep);
    }
    if (winCelebrateRaf) cancelAnimationFrame(winCelebrateRaf);
    winCelebrateRaf = requestAnimationFrame(celebrateStep);
  }

  function showWinQuestion() {
    const wo = document.getElementById('game-win-overlay');
    wo.classList.remove('win-phase-celebrate');
    wo.classList.add('win-phase-question');
    drawWinCelebration(WIN_CELEBRATE_MS / 1000);
    document.getElementById('win-question-card').classList.remove('hidden');
  }

  function showWinFinale() {
    document.getElementById('win-question-card').classList.add('hidden');
    document.getElementById('win-declined-card').classList.add('hidden');
    const wo = document.getElementById('game-win-overlay');
    wo.classList.remove('win-phase-celebrate', 'win-phase-question', 'win-phase-declined');
    wo.classList.add('win-phase-finale');
    document.getElementById('win-finale-card').classList.remove('hidden');
    document.getElementById('end-page-img').classList.remove('hidden');
  }

  function showWinDeclined() {
    document.getElementById('win-question-card').classList.add('hidden');
    const wo = document.getElementById('game-win-overlay');
    wo.classList.remove('win-phase-celebrate', 'win-phase-question', 'win-phase-finale');
    wo.classList.add('win-phase-declined');
    document.getElementById('win-declined-card').classList.remove('hidden');
  }

  function setWinLayoutExpanded(on) {
    const wrap = document.getElementById('game-canvas-wrapper');
    const page = document.getElementById('page-game');
    if (wrap) wrap.classList.toggle('win-layout-expanded', Boolean(on));
    if (page) page.classList.toggle('page-game-win-active', Boolean(on));
  }

  function resetWinFlow() {
    if (winCelebrateRaf) cancelAnimationFrame(winCelebrateRaf);
    winCelebrateRaf = null;
    if (fireworksBurstInterval) clearInterval(fireworksBurstInterval);
    fireworksBurstInterval = null;
    const wo = document.getElementById('game-win-overlay');
    if (!wo) return;
    wo.classList.remove('win-phase-celebrate', 'win-phase-question', 'win-phase-declined', 'win-phase-finale');
    const q = document.getElementById('win-question-card');
    const d = document.getElementById('win-declined-card');
    const f = document.getElementById('win-finale-card');
    const end = document.getElementById('end-page-img');
    if (q) q.classList.add('hidden');
    if (d) d.classList.add('hidden');
    if (f) f.classList.add('hidden');
    if (end) end.classList.add('hidden');
    setWinLayoutExpanded(false);
  }

  function updateScoreUI() {
    document.getElementById('score-value').textContent = score;
    document.getElementById('score-fill').style.width = (score / 25 * 100) + '%';
  }

  function maybeTriggerMrVasu() {
    // Only appear at these scores, once each.
    const milestones = [5, 10, 20];
    if (!milestones.includes(score)) return;
    if (vasuMilestonesHit.has(score)) return;
    if (mrVasu || won || gameOver) return;
    vasuMilestonesHit.add(score);
    mrVasu = { x: -40, active: true, timer: 0 };
    shakeTimer = 20; shakeIntensity = 3;
    obstacles = []; // obstacle disappears when Mr Vasu arrives
    spawnTimer = 0;
    chaseFramesLeft = 5 * 60;
    showChaseUI();
    updateChaseUI(1);
    playSfx('vasu');
  }

  function showChaseUI() {
    const ui = document.getElementById('vasu-chase-ui');
    if (ui) ui.classList.remove('hidden');
  }
  function hideChaseUI() {
    const ui = document.getElementById('vasu-chase-ui');
    if (ui) ui.classList.add('hidden');
    const fill = document.getElementById('vasu-chase-fill');
    if (fill) fill.style.width = '0%';
  }
  function updateChaseUI(ratioLeft) {
    const fill = document.getElementById('vasu-chase-fill');
    if (!fill) return;
    const pct = Math.max(0, Math.min(1, ratioLeft)) * 100;
    fill.style.width = pct.toFixed(2) + '%';
    const bar = fill.parentElement;
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  function unlockAudio() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    } catch (_) {
      audioCtx = null;
    }
  }

  function playTone({ f = 440, type = 'sine', t = 0.08, gain = 0.08, slideTo = null }) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, now);
    if (slideTo != null) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + t);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + t);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    o.stop(now + t + 0.02);
  }

  function playSfx(kind) {
    if (!audioCtx) return;
    switch (kind) {
      case 'jump':
        playTone({ f: 520, type: 'triangle', t: 0.07, gain: 0.06, slideTo: 780 });
        break;
      case 'tick':
        // Debounce to avoid ear spam
        if (frameCount - lastScoreAt < 8) return;
        lastScoreAt = frameCount;
        playTone({ f: 980, type: 'square', t: 0.04, gain: 0.03, slideTo: 1400 });
        break;
      case 'sparkle':
        playTone({ f: 660, type: 'sine', t: 0.10, gain: 0.05, slideTo: 1320 });
        setTimeout(() => playTone({ f: 880, type: 'sine', t: 0.10, gain: 0.045, slideTo: 1760 }), 60);
        break;
      case 'thud':
        playTone({ f: 140, type: 'sine', t: 0.12, gain: 0.08, slideTo: 70 });
        break;
      case 'vasu':
        playTone({ f: 220, type: 'triangle', t: 0.12, gain: 0.07, slideTo: 160 });
        break;
    }
  }

  function drawWinCelebration(timeSec) {
    // Animated sunset + mountains + characters (idle + reaching) + emoji-only kiss/sparkles.
    const t = typeof timeSec === 'number' ? timeSec : 0;
    const breathe = Math.sin(t * Math.PI * 2 * 1.6) * 2.5;
    const drift = Math.sin(t * Math.PI * 2 * 0.28) * 10;
    const skyShift = Math.sin(t * Math.PI * 2 * 0.12) * 0.06;
    const sunPulse = 36 + Math.sin(t * Math.PI * 2 * 0.5) * 4;
    const sunYDrift = Math.sin(t * Math.PI * 2 * 0.22) * 6;

    ctx.save();

    const g0 = 0.38 + skyShift * 0.05;
    const g1 = 0.74 + skyShift * 0.035;
    const sky = ctx.createLinearGradient(drift * 0.08, 0, -drift * 0.12, H);
    sky.addColorStop(0, '#141528');
    sky.addColorStop(0.28 + skyShift * 0.04, '#3d1f42');
    sky.addColorStop(g0, '#6D2E46');
    sky.addColorStop(g1, '#E09020');
    sky.addColorStop(1, '#F2E9E4');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.96;
    ctx.fillStyle = '#FEFAE0';
    ctx.beginPath();
    ctx.arc(W * 0.78 + drift * 0.15, H * 0.22 + sunYDrift, sunPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(40, 18, 48, 0.88)';
    for (let i = 0; i < 6; i++) {
      const sx = drift + i * 170 - 40 + Math.sin(t * 0.7 + i) * 3;
      const mw = 220;
      const mh = 74 + (i % 3) * 28 + breathe * 0.35;
      ctx.beginPath();
      ctx.moveTo(sx, groundY + 40);
      ctx.lineTo(sx + mw * 0.5, groundY - mh);
      ctx.lineTo(sx + mw, groundY + 40);
      ctx.closePath();
      ctx.fill();
    }

    const gGrad = ctx.createLinearGradient(0, groundY, 0, H);
    gGrad.addColorStop(0, 'rgba(20,14,28,0.95)');
    gGrad.addColorStop(1, 'rgba(10,8,14,1)');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, groundY, W, H - groundY);

    const lean = Math.sin(t * Math.PI * 2 * 1.05) * 5;
    const swayY = breathe * 0.4 + Math.cos(t * Math.PI * 2 * 0.85) * 1.8;
    const himX = 366 + lean;
    const herX = 434 - lean;
    const baseY = groundY - player.h + swayY;

    const prevSquash = player.squash;
    const prevStretch = player.stretch;
    player.squash = 1 + Math.sin(t * Math.PI * 2 * 2.2) * 0.08;
    player.stretch = 1 - Math.sin(t * Math.PI * 2 * 2.2) * 0.06;

    const prevFc = frameCount;
    frameCount = Math.floor(t * 52);
    drawStickPersonFacing(himX, baseY, faceImgHim, '#D4A373', 'D', 1, true);
    drawStickPersonFacing(herX, baseY, faceImgHer, '#C9ADA7', 'V', -1, true);
    const cheekY = baseY + 10 + Math.sin(frameCount * 0.14) * 1.5;
    drawCelebrateBlush(himX, cheekY, 1);
    drawCelebrateBlush(herX, cheekY, -1);
    frameCount = prevFc;
    player.squash = prevSquash;
    player.stretch = prevStretch;

    const pulse = Math.sin(t * Math.PI * 8) * 1.8;
    const hy = baseY + 28;
    ctx.strokeStyle = 'rgba(254,250,224,0.62)';
    ctx.lineWidth = 2 + pulse * 0.05;
    ctx.beginPath();
    ctx.moveTo(himX + 14, hy);
    ctx.quadraticCurveTo(
      (himX + herX) * 0.5,
      hy - 10 + breathe * 0.35,
      herX - 14,
      hy
    );
    ctx.stroke();

    const kissBounce = Math.sin(t * Math.PI * 2 * 3) * 3;
    const sparkWobble = Math.cos(t * Math.PI * 2 * 2.1) * 4;
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.94 + Math.sin(t * Math.PI * 4) * 0.06;
    ctx.fillText('💋', (himX + herX) * 0.5 + sparkWobble * 0.2, hy - 38 + kissBounce);
    ctx.globalAlpha = 1;
    ctx.font = '20px serif';
    ctx.fillText('✨💖✨', (himX + herX) * 0.5, hy - 60 + kissBounce * 0.5);

    ctx.restore();
  }

  function drawStickPersonFacing(x, y, faceImg, color, initial, dir, celebrate = false) {
    // dir: 1 faces right, -1 faces left
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(dir, 1);
    ctx.translate(-x, 0);
    drawStickPerson(x, y, faceImg, color, initial, celebrate);
    ctx.restore();
  }

  /** Small blush arcs when celebrating (under head, scaled space) */
  function drawCelebrateBlush(faceX, faceY, inward) {
    ctx.save();
    ctx.globalAlpha = 0.28 + Math.sin(frameCount * 0.12) * 0.12;
    ctx.fillStyle = '#E5989B';
    ctx.beginPath();
    ctx.arc(faceX + inward * 7, faceY + 2, 4, 0, Math.PI * 2);
    ctx.arc(faceX + inward * 12, faceY + 5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ══════════════════════════════════════════════
     FIREWORKS
     ══════════════════════════════════════════════ */
  function startFireworks() {
    if (fireworksBurstInterval) clearInterval(fireworksBurstInterval);
    fireworksBurstInterval = null;
    fw = document.getElementById('fireworks-canvas');
    fw.width = fw.parentElement.offsetWidth;
    fw.height = fw.parentElement.offsetHeight;
    fctx = fw.getContext('2d');
    let fwParts = [];

    function burst(cx, cy) {
      const colors = ['#D4A373', '#C9ADA7', '#A3B18A', '#FEFAE0', '#722F37', '#7B4B94', '#E09020'];
      for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 / 50) * i;
        const vel = 1.5 + Math.random() * 4;
        fwParts.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * vel,
          vy: Math.sin(angle) * vel,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1.5 + Math.random() * 2.5
        });
      }
    }

    let burstCount = 0;
    fireworksBurstInterval = setInterval(() => {
      burst(
        fw.width * 0.2 + Math.random() * fw.width * 0.6,
        fw.height * 0.1 + Math.random() * fw.height * 0.4
      );
      burstCount++;
      if (burstCount > 12) {
        clearInterval(fireworksBurstInterval);
        fireworksBurstInterval = null;
      }
    }, 350);

    function animateFW() {
      fctx.fillStyle = 'rgba(0,0,0,0.08)';
      fctx.fillRect(0, 0, fw.width, fw.height);
      fwParts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.vx *= 0.99;
        p.life -= 0.01;
        if (p.life > 0) {
          fctx.globalAlpha = p.life;
          fctx.shadowColor = p.color;
          fctx.shadowBlur = 4;
          fctx.fillStyle = p.color;
          fctx.beginPath();
          fctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          fctx.fill();
        }
      });
      fctx.globalAlpha = 1;
      fctx.shadowBlur = 0;
      fwParts = fwParts.filter(p => p.life > 0);
      if (fwParts.length > 0 || burstCount <= 12) requestAnimationFrame(animateFW);
    }
    animateFW();
  }

  return { init };
})();
