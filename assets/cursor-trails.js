/**
 * cursor-trails.js
 * Smooth, elegant, high-performance canvas particle trail effect
 * Tuned to match the portfolio palette (#1E3A5F navy, #3B6991 muted blue, #E8B7A8 warm peach)
 */
(function () {
  // Respect user preference for reduced motion or touch-only devices
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Only run if pointer/mouse is supported
  const isTouchDevice = 'ontouchstart' in window && !window.matchMedia('(pointer: fine)').matches;
  if (isTouchDevice) {
    return;
  }

  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-trail-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  canvas.style.opacity = '1';
  canvas.setAttribute('aria-hidden', 'true');

  function appendCanvas() {
    if (document.body && !document.getElementById('cursor-trail-canvas')) {
      document.body.appendChild(canvas);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', appendCanvas);
  } else {
    appendCanvas();
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Mouse tracking
  let mouse = { x: -100, y: -100, prevX: -100, prevY: -100, speed: 0, active: false };
  let isHoveringInteractive = false;

  // Particle color palette matching the website design
  const colors = [
    { r: 30, g: 58, b: 95 },    // #1E3A5F deep navy
    { r: 59, g: 105, b: 145 },  // #3B6991 accent muted blue
    { r: 99, g: 140, b: 180 },  // #638CB4 soft light blue
    { r: 232, g: 183, b: 168 }, // #E8B7A8 warm peach accent
    { r: 168, g: 181, b: 162 }  // #A8B5A2 subtle sage
  ];

  const particles = [];
  const MAX_PARTICLES = 65;

  class Particle {
    constructor(x, y, vx, vy, color, size, maxLife) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.initialSize = size;
      this.life = 0;
      this.maxLife = maxLife;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.94; // slight drag
      this.vy *= 0.94;
      this.life++;
    }

    draw(ctx) {
      const progress = this.life / this.maxLife;
      const alpha = Math.max(0, (1 - progress) * 0.7);
      const currentRadius = Math.max(0.2, this.initialSize * (1 - progress * 0.75));

      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
      ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.5})`;
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    }
  }

  // Smooth ribbon trailing ring
  const trailPoints = [];
  const TRAIL_LENGTH = 14;

  let lastSpawnTime = 0;

  function onMouseMove(e) {
    const x = e.clientX;
    const y = e.clientY;

    if (!mouse.active) {
      mouse.prevX = x;
      mouse.prevY = y;
      mouse.active = true;
    }

    const dx = x - mouse.x;
    const dy = y - mouse.y;
    mouse.speed = Math.sqrt(dx * dx + dy * dy);

    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = x;
    mouse.y = y;

    // Add to ribbon trail
    trailPoints.unshift({ x, y });
    if (trailPoints.length > TRAIL_LENGTH) {
      trailPoints.pop();
    }

    // Spawn dust particles on movement
    const now = performance.now();
    const spawnCount = Math.min(Math.floor(mouse.speed / 4) + 1, 4);

    if (now - lastSpawnTime > 12 && particles.length < MAX_PARTICLES) {
      lastSpawnTime = now;

      for (let i = 0; i < spawnCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spreadSpeed = (Math.random() * 0.9 + 0.3) * (isHoveringInteractive ? 1.4 : 1.0);
        const vx = Math.cos(angle) * spreadSpeed + (dx * -0.06);
        const vy = Math.sin(angle) * spreadSpeed + (dy * -0.06);
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = (Math.random() * 2.8 + 1.8) * (isHoveringInteractive ? 1.3 : 1.0);
        const maxLife = Math.floor(Math.random() * 18 + 22);

        // Slight jitter near mouse position
        const px = x + (Math.random() - 0.5) * 8;
        const py = y + (Math.random() - 0.5) * 8;

        particles.push(new Particle(px, py, vx, vy, color, size, maxLife));
      }
    }
  }

  function onMouseLeave() {
    mouse.active = false;
    trailPoints.length = 0;
  }

  // Detect interactive element hover to subtly enhance trail
  function checkInteractive(e) {
    const target = e.target;
    if (!target) return;
    const isInteractive = !!target.closest('a, button, input, textarea, select, [role="button"], .cert-card, .group');
    isHoveringInteractive = isInteractive;
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('mouseover', checkInteractive, { passive: true });
  document.addEventListener('mouseleave', onMouseLeave);

  // Animation Loop
  let animId = null;

  function render() {
    ctx.clearRect(0, 0, width, height);

    // 1. Draw smooth ribbon trail
    if (trailPoints.length > 2) {
      for (let i = 0; i < trailPoints.length - 1; i++) {
        const pt = trailPoints[i];
        const nextPt = trailPoints[i + 1];
        const ratio = 1 - (i / trailPoints.length);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(nextPt.x, nextPt.y);
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(0.5, ratio * 3.5);
        ctx.strokeStyle = `rgba(59, 105, 145, ${ratio * 0.35})`;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Draw outer cursor follow ring
    if (mouse.active && trailPoints.length > 0) {
      const head = trailPoints[0];
      const ringRadius = isHoveringInteractive ? 14 : 9;
      ctx.save();
      ctx.beginPath();
      ctx.arc(head.x, head.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isHoveringInteractive ? 'rgba(232, 183, 168, 0.7)' : 'rgba(30, 58, 95, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
      } else {
        p.draw(ctx);
      }
    }

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);
})();
