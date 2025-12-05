// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO-REACTIVE MULTI-PATTERN VISUALIZATION ENGINE
// A mathematical and artistic odyssey through fractal dimensions, wave harmonics,
// particle physics, and geometric beauty - all synchronized to audio frequencies
// ═══════════════════════════════════════════════════════════════════════════════

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
  maxLife: number;
  angle: number;
  angularVelocity: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  age: number;
  maxAge: number;
  popping: boolean;
  popProgress: number;
}

type Pattern =
  | 'fractal'
  | 'rays'
  | 'tunnel'
  | 'bubbles'
  | 'voronoi'
  | 'waves'
  | 'swarm'
  | 'mandala'
  | 'dna'
  | 'plasma';

export class FlowFieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private bubbles: Bubble[] = [];
  private time = 0;
  private width = 0;
  private height = 0;
  private centerX = 0;
  private centerY = 0;
  private hueBase = 0;

  // Pattern system
  private currentPattern: Pattern = 'rays';
  private nextPattern: Pattern = 'fractal';
  private patternTimer = 0;
  private patternDuration = 600; // Frames before transition (10 seconds at 60fps)
  private transitionProgress = 0;
  private transitionSpeed = 0.02;
  private isTransitioning = false;
  private patternSequence: Pattern[] = [
    'rays', 'fractal', 'tunnel', 'bubbles', 'voronoi',
    'waves', 'swarm', 'mandala', 'dna', 'plasma'
  ];
  private patternIndex = 0;

  // Fractal parameters
  private fractalZoom = 1;
  private fractalOffsetX = -0.5;
  private fractalOffsetY = 0;
  private juliaC = { re: -0.7, im: 0.27 };

  // Voronoi seeds
  private voronoiSeeds: { x: number; y: number; hue: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    this.initializeParticles();
    this.initializeBubbles();
    this.initializeVoronoiSeeds();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  private initializeParticles(): void {
    const count = Math.min(1200, Math.floor((this.width * this.height) / 800));
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * Math.min(this.width, this.height) * 0.5;
    const maxLife = 150 + Math.random() * 250;

    return {
      x: this.centerX + Math.cos(angle) * radius,
      y: this.centerY + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 0.8 + Math.random() * 2.5,
      hue: Math.random() * 60,
      life: maxLife,
      maxLife,
      angle: Math.random() * Math.PI * 2,
      angularVelocity: (Math.random() - 0.5) * 0.1,
      trail: [],
    };
  }

  private initializeBubbles(): void {
    this.bubbles = [];
    const count = 30 + Math.floor(Math.random() * 20);

    for (let i = 0; i < count; i++) {
      this.bubbles.push(this.createBubble());
    }
  }

  private createBubble(): Bubble {
    return {
      x: Math.random() * this.width,
      y: this.height + Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(0.5 + Math.random() * 1.5),
      radius: 10 + Math.random() * 40,
      hue: Math.random() * 360,
      age: 0,
      maxAge: 300 + Math.random() * 300,
      popping: false,
      popProgress: 0,
    };
  }

  private initializeVoronoiSeeds(): void {
    const count = 15 + Math.floor(Math.random() * 10);
    this.voronoiSeeds = [];

    for (let i = 0; i < count; i++) {
      this.voronoiSeeds.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        hue: Math.random() * 360,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN TRANSITION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  private updatePatternTransition(audioIntensity: number): void {
    // Faster transitions with high audio intensity
    const dynamicDuration = Math.max(300, this.patternDuration - audioIntensity * 200);

    this.patternTimer++;

    if (this.isTransitioning) {
      this.transitionProgress += this.transitionSpeed * (1 + audioIntensity * 0.5);

      if (this.transitionProgress >= 1) {
        this.transitionProgress = 0;
        this.isTransitioning = false;
        this.currentPattern = this.nextPattern;
        this.patternTimer = 0;
      }
    } else if (this.patternTimer > dynamicDuration) {
      // Start transition to next pattern
      this.isTransitioning = true;
      this.transitionProgress = 0;
      this.patternIndex = (this.patternIndex + 1) % this.patternSequence.length;
      this.nextPattern = this.patternSequence[this.patternIndex] ?? 'rays';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 1: FRACTAL EXPLORER (Mandelbrot/Julia Sets)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderFractal(audioIntensity: number, bassIntensity: number, midIntensity: number): void {
    const ctx = this.ctx;
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    // Animate Julia set parameters with audio
    this.juliaC.re = -0.7 + Math.sin(this.time * 0.001) * 0.2 + bassIntensity * 0.1;
    this.juliaC.im = 0.27 + Math.cos(this.time * 0.0015) * 0.2 + midIntensity * 0.1;

    // Zoom in/out with audio
    this.fractalZoom += (0.02 + audioIntensity * 0.05) * (1 + Math.sin(this.time * 0.002) * 0.5);

    const maxIter = 50 + Math.floor(audioIntensity * 50);
    const zoom = Math.pow(1.5, this.fractalZoom);

    for (let py = 0; py < this.height; py += 2) {
      for (let px = 0; px < this.width; px += 2) {
        // Map pixel to complex plane
        const x0 = ((px - this.centerX) / (this.width * 0.25)) / zoom + this.fractalOffsetX;
        const y0 = ((py - this.centerY) / (this.height * 0.25)) / zoom + this.fractalOffsetY;

        let x = x0;
        let y = y0;
        let iter = 0;

        // Julia set iteration
        while (x * x + y * y <= 4 && iter < maxIter) {
          const xtemp = x * x - y * y + this.juliaC.re;
          y = 2 * x * y + this.juliaC.im;
          x = xtemp;
          iter++;
        }

        // Color based on iteration count
        const hue = (this.hueBase + (iter / maxIter) * 360 + bassIntensity * 60) % 360;
        const saturation = 70 + audioIntensity * 30;
        const lightness = iter < maxIter ? (iter / maxIter) * 60 : 0;

        const rgb = this.hslToRgb(hue / 360, saturation / 100, lightness / 100);

        // Draw 2x2 blocks for performance
        for (let dy = 0; dy < 2 && py + dy < this.height; dy++) {
          for (let dx = 0; dx < 2 && px + dx < this.width; dx++) {
            const i = ((py + dy) * this.width + (px + dx)) * 4;
            data[i] = rgb[0] ?? 0;
            data[i + 1] = rgb[1] ?? 0;
            data[i + 2] = rgb[2] ?? 0;
            data[i + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 2: RAY BURST (Kaleidoscopic chromatic rays)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderRays(audioIntensity: number, bassIntensity: number, trebleIntensity: number): void {
    const ctx = this.ctx;
    const rayCount = 24 + Math.floor(bassIntensity * 24);
    const angleStep = (Math.PI * 2) / rayCount;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < rayCount; i++) {
      const angle = angleStep * i + this.time * 0.005;
      const rayLength = Math.min(this.width, this.height) * (0.6 + audioIntensity * 0.4);
      const rayWidth = 2 + trebleIntensity * 8;

      const endX = this.centerX + Math.cos(angle) * rayLength;
      const endY = this.centerY + Math.sin(angle) * rayLength;

      // Chromatic aberration effect
      for (let offset = -2; offset <= 2; offset++) {
        const hue = (this.hueBase + i * (360 / rayCount) + offset * 10) % 360;
        const alpha = (0.15 + audioIntensity * 0.15) * (1 - Math.abs(offset) * 0.3);

        const gradient = ctx.createLinearGradient(
          this.centerX, this.centerY,
          endX + offset * 3, endY + offset * 3
        );

        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${hue}, 90%, 60%, ${alpha * 0.6})`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = rayWidth;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(endX + offset * 3, endY + offset * 3);
        ctx.stroke();
      }
    }

    // Central glow
    const glowGradient = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, 100 + bassIntensity * 100
    );
    glowGradient.addColorStop(0, `hsla(${this.hueBase}, 100%, 80%, ${0.4 + audioIntensity * 0.3})`);
    glowGradient.addColorStop(0.5, `hsla(${this.hueBase}, 90%, 60%, ${0.2 + audioIntensity * 0.2})`);
    glowGradient.addColorStop(1, `hsla(${this.hueBase}, 80%, 40%, 0)`);

    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 3: TUNNEL (3D perspective warp)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderTunnel(audioIntensity: number, bassIntensity: number, midIntensity: number): void {
    const ctx = this.ctx;
    const rings = 30;
    const segments = 48;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let r = 0; r < rings; r++) {
      const depth = r / rings;
      const z = depth + this.time * 0.003 + bassIntensity * 0.1;
      const zMod = z % 1;
      const scale = 1 / (zMod + 0.1);
      const radius = scale * 50;

      if (radius > Math.max(this.width, this.height) * 2) continue;

      const alpha = (1 - zMod) * (0.2 + audioIntensity * 0.3);
      const rotation = z * Math.PI * 2 + midIntensity * Math.PI;

      ctx.beginPath();

      for (let s = 0; s <= segments; s++) {
        const angle = (s / segments) * Math.PI * 2 + rotation;
        const x = this.centerX + Math.cos(angle) * radius;
        const y = this.centerY + Math.sin(angle) * radius;

        if (s === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      const hue = (this.hueBase + depth * 360 + bassIntensity * 60) % 360;
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
      ctx.lineWidth = 1 + audioIntensity * 3;
      ctx.stroke();

      // Fill with gradient for depth
      if (r % 3 === 0) {
        const gradient = ctx.createRadialGradient(
          this.centerX, this.centerY, radius * 0.7,
          this.centerX, this.centerY, radius
        );
        gradient.addColorStop(0, `hsla(${hue}, 70%, 50%, 0)`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, ${alpha * 0.3})`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 4: BUBBLE POP (Effervescent physics simulation)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderBubbles(audioIntensity: number, bassIntensity: number, trebleIntensity: number): void {
    const ctx = this.ctx;

    // Create new bubbles on bass hits
    if (bassIntensity > 0.5 && Math.random() > 0.8) {
      this.bubbles.push(this.createBubble());
    }

    // Update and draw bubbles
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      if (!bubble) continue;

      if (bubble.popping) {
        // Pop animation
        bubble.popProgress += 0.1 + trebleIntensity * 0.1;

        if (bubble.popProgress >= 1) {
          this.bubbles.splice(i, 1);
          continue;
        }

        // Draw pop shards
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const shardCount = 12;
        for (let s = 0; s < shardCount; s++) {
          const angle = (s / shardCount) * Math.PI * 2;
          const dist = bubble.radius * bubble.popProgress * 2;
          const x = bubble.x + Math.cos(angle) * dist;
          const y = bubble.y + Math.sin(angle) * dist;

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 5);
          gradient.addColorStop(0, `hsla(${bubble.hue}, 90%, 70%, ${1 - bubble.popProgress})`);
          gradient.addColorStop(1, `hsla(${bubble.hue}, 80%, 60%, 0)`);

          ctx.fillStyle = gradient;
          ctx.fillRect(x - 5, y - 5, 10, 10);
        }

        ctx.restore();
      } else {
        // Normal bubble physics
        bubble.age++;
        bubble.vy -= 0.01; // Buoyancy
        bubble.vx += (Math.random() - 0.5) * 0.1; // Brownian motion
        bubble.vx *= 0.99; // Drag
        bubble.vy *= 0.99;

        bubble.x += bubble.vx + Math.sin(this.time * 0.02 + bubble.y * 0.01) * 0.5;
        bubble.y += bubble.vy;

        // Pop conditions
        if (bubble.age > bubble.maxAge || bubble.y < -bubble.radius * 2 ||
            bubble.x < -bubble.radius || bubble.x > this.width + bubble.radius ||
            (trebleIntensity > 0.7 && Math.random() > 0.95)) {
          bubble.popping = true;
          continue;
        }

        // Draw bubble with iridescence
        ctx.save();

        // Outer glow
        const glowGradient = ctx.createRadialGradient(
          bubble.x, bubble.y - bubble.radius * 0.3, 0,
          bubble.x, bubble.y, bubble.radius * 1.5
        );
        glowGradient.addColorStop(0, `hsla(${bubble.hue}, 100%, 80%, ${0.3 + audioIntensity * 0.2})`);
        glowGradient.addColorStop(0.6, `hsla(${(bubble.hue + 60) % 360}, 90%, 70%, ${0.15 + audioIntensity * 0.1})`);
        glowGradient.addColorStop(1, `hsla(${(bubble.hue + 120) % 360}, 80%, 60%, 0)`);

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Bubble body with gradient
        const bubbleGradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          bubble.radius * 0.2,
          bubble.x, bubble.y, bubble.radius
        );
        bubbleGradient.addColorStop(0, `hsla(${bubble.hue}, 90%, 85%, 0.4)`);
        bubbleGradient.addColorStop(0.5, `hsla(${(bubble.hue + 30) % 360}, 85%, 75%, 0.25)`);
        bubbleGradient.addColorStop(0.9, `hsla(${(bubble.hue + 60) % 360}, 80%, 65%, 0.35)`);
        bubbleGradient.addColorStop(1, `hsla(${(bubble.hue + 90) % 360}, 75%, 55%, 0.5)`);

        ctx.fillStyle = bubbleGradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        const highlightGradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.4,
          bubble.y - bubble.radius * 0.4,
          0,
          bubble.x - bubble.radius * 0.4,
          bubble.y - bubble.radius * 0.4,
          bubble.radius * 0.6
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(bubble.x - bubble.radius * 0.4, bubble.y - bubble.radius * 0.4, bubble.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 5: VORONOI CELLS (Organic cellular structures)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderVoronoi(audioIntensity: number, bassIntensity: number, midIntensity: number): void {
    const ctx = this.ctx;
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    // Animate seeds
    for (let i = 0; i < this.voronoiSeeds.length; i++) {
      const seed = this.voronoiSeeds[i];
      if (!seed) continue;

      const angle = this.time * 0.001 + i;
      const radius = 50 + Math.sin(this.time * 0.002 + i) * 30;

      seed.x = this.centerX + Math.cos(angle) * radius * (1 + bassIntensity);
      seed.y = this.centerY + Math.sin(angle * 1.3) * radius * (1 + bassIntensity);
      seed.hue = (seed.hue + 0.5 + midIntensity) % 360;
    }

    // Render Voronoi diagram
    for (let y = 0; y < this.height; y += 2) {
      for (let x = 0; x < this.width; x += 2) {
        let minDist = Infinity;
        let closestSeed: typeof this.voronoiSeeds[0] | null = null;

        // Find closest seed
        for (const seed of this.voronoiSeeds) {
          const dx = x - seed.x;
          const dy = y - seed.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist) {
            minDist = dist;
            closestSeed = seed;
          }
        }

        if (closestSeed) {
          // Color based on distance and audio
          const distNorm = Math.min(1, minDist / 200);
          const lightness = 30 + distNorm * 40 + audioIntensity * 20;
          const saturation = 70 + audioIntensity * 30;

          const rgb = this.hslToRgb(closestSeed.hue / 360, saturation / 100, lightness / 100);

          // Draw 2x2 blocks
          for (let dy = 0; dy < 2 && y + dy < this.height; dy++) {
            for (let dx = 0; dx < 2 && x + dx < this.width; dx++) {
              const idx = ((y + dy) * this.width + (x + dx)) * 4;
              data[idx] = rgb[0] ?? 0;
              data[idx + 1] = rgb[1] ?? 0;
              data[idx + 2] = rgb[2] ?? 0;
              data[idx + 3] = 255;
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw seed points with glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const seed of this.voronoiSeeds) {
      const gradient = ctx.createRadialGradient(seed.x, seed.y, 0, seed.x, seed.y, 20 + bassIntensity * 30);
      gradient.addColorStop(0, `hsla(${seed.hue}, 100%, 80%, 0.6)`);
      gradient.addColorStop(0.5, `hsla(${seed.hue}, 90%, 70%, 0.3)`);
      gradient.addColorStop(1, `hsla(${seed.hue}, 80%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(seed.x - 30, seed.y - 30, 60, 60);
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 6: WAVE INTERFERENCE (Harmonic oscillations)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderWaves(audioIntensity: number, bassIntensity: number, trebleIntensity: number): void {
    const ctx = this.ctx;
    const waveCount = 5;
    const amplitude = 50 + audioIntensity * 100;
    const frequency = 0.02 + trebleIntensity * 0.03;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Concentric waves
    for (let w = 0; w < waveCount; w++) {
      const phase = this.time * 0.02 + w * Math.PI / waveCount;
      const baseRadius = 50 + w * 60;

      ctx.beginPath();

      for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
        const wave = Math.sin(angle * 8 + phase) * amplitude * bassIntensity;
        const r = baseRadius + wave;
        const x = this.centerX + Math.cos(angle) * r;
        const y = this.centerY + Math.sin(angle) * r;

        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      const hue = (this.hueBase + w * 72) % 360;
      const alpha = 0.3 + audioIntensity * 0.3;

      ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${alpha})`;
      ctx.lineWidth = 2 + audioIntensity * 4;
      ctx.stroke();

      // Fill with gradient
      const gradient = ctx.createRadialGradient(
        this.centerX, this.centerY, baseRadius * 0.8,
        this.centerX, this.centerY, baseRadius + amplitude
      );
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 85%, 65%, ${alpha * 0.2})`);
      gradient.addColorStop(1, `hsla(${hue}, 70%, 50%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Ripple grid
    const gridSize = 40;
    ctx.globalAlpha = 0.2 + audioIntensity * 0.2;

    for (let y = 0; y < this.height; y += gridSize) {
      for (let x = 0; x < this.width; x += gridSize) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const wave = Math.sin(dist * frequency - this.time * 0.05) * 10 * trebleIntensity;

        const hue = (this.hueBase + dist * 0.5) % 360;
        const size = 2 + wave;

        ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.6)`;
        ctx.fillRect(x + wave, y + wave, size, size);
      }
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 7: PARTICLE SWARM (Flocking behavior)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderSwarm(audioIntensity: number, bassIntensity: number, trebleIntensity: number): void {
    const ctx = this.ctx;

    // Update particles with flocking behavior
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle) continue;

      // Flocking forces
      let alignX = 0, alignY = 0;
      let cohereX = 0, cohereY = 0;
      let separateX = 0, separateY = 0;
      let neighbors = 0;

      const perceptionRadius = 50 + audioIntensity * 50;

      for (let j = 0; j < this.particles.length; j++) {
        if (i === j) continue;
        const other = this.particles[j];
        if (!other) continue;

        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < perceptionRadius && dist > 0) {
          // Alignment
          alignX += other.vx;
          alignY += other.vy;

          // Cohesion
          cohereX += other.x;
          cohereY += other.y;

          // Separation
          if (dist < 30) {
            separateX -= dx / dist;
            separateY -= dy / dist;
          }

          neighbors++;
        }
      }

      if (neighbors > 0) {
        alignX /= neighbors;
        alignY /= neighbors;
        cohereX = (cohereX / neighbors - particle.x) * 0.01;
        cohereY = (cohereY / neighbors - particle.y) * 0.01;
        separateX *= 0.05;
        separateY *= 0.05;
      }

      // Attraction to center with audio
      const dx = this.centerX - particle.x;
      const dy = this.centerY - particle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const centerForce = 0.001 * (1 + bassIntensity * 2);

      // Apply forces
      particle.vx += alignX * 0.02 + cohereX + separateX + (dx / dist) * centerForce;
      particle.vy += alignY * 0.02 + cohereY + separateY + (dy / dist) * centerForce;

      // Velocity limits
      const maxSpeed = 2 + trebleIntensity * 3;
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      if (speed > maxSpeed) {
        particle.vx = (particle.vx / speed) * maxSpeed;
        particle.vy = (particle.vy / speed) * maxSpeed;
      }

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around
      if (particle.x < 0) particle.x = this.width;
      if (particle.x > this.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.height;
      if (particle.y > this.height) particle.y = 0;

      // Trail
      particle.trail.push({ x: particle.x, y: particle.y, alpha: 1 });
      if (particle.trail.length > 20) particle.trail.shift();

      // Draw trail
      if (particle.trail.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();

        const firstPoint = particle.trail[0];
        if (firstPoint) {
          ctx.moveTo(firstPoint.x, firstPoint.y);

          for (let t = 1; t < particle.trail.length; t++) {
            const point = particle.trail[t];
            if (point) ctx.lineTo(point.x, point.y);
          }

          const hue = (this.hueBase + particle.hue) % 360;
          const gradient = ctx.createLinearGradient(
            firstPoint.x, firstPoint.y,
            particle.x, particle.y
          );
          gradient.addColorStop(0, `hsla(${hue}, 90%, 60%, 0)`);
          gradient.addColorStop(1, `hsla(${hue}, 95%, 70%, ${0.4 + audioIntensity * 0.3})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = particle.size;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        ctx.restore();
      }

      // Draw particle
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const hue = (this.hueBase + particle.hue) % 360;
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 3
      );
      gradient.addColorStop(0, `hsla(${hue}, 100%, 80%, ${0.6 + audioIntensity * 0.4})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 95%, 70%, ${0.3 + audioIntensity * 0.2})`);
      gradient.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        particle.x - particle.size * 3,
        particle.y - particle.size * 3,
        particle.size * 6,
        particle.size * 6
      );

      ctx.restore();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 8: MANDALA (Sacred geometry)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderMandala(audioIntensity: number, bassIntensity: number, midIntensity: number): void {
    const ctx = this.ctx;
    const layers = 8;
    const symmetry = 12;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(this.centerX, this.centerY);

    for (let layer = 0; layer < layers; layer++) {
      const radius = 50 + layer * 60 + bassIntensity * 40;
      const petals = 6 + layer * 2;
      const rotation = this.time * 0.001 * (layer % 2 === 0 ? 1 : -1) + midIntensity * Math.PI;

      for (let sym = 0; sym < symmetry; sym++) {
        ctx.save();
        ctx.rotate((sym / symmetry) * Math.PI * 2);

        for (let p = 0; p < petals; p++) {
          const angle = (p / petals) * Math.PI * 2 + rotation;
          const petalRadius = radius * 0.3;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          const hue = (this.hueBase + layer * 45 + sym * 30) % 360;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, petalRadius);
          gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, ${0.4 + audioIntensity * 0.3})`);
          gradient.addColorStop(0.7, `hsla(${hue}, 85%, 65%, ${0.2 + audioIntensity * 0.15})`);
          gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(x, y, petalRadius, petalRadius * 0.5, angle, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 9: DNA HELIX (Double helix with particles)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderDNA(audioIntensity: number, bassIntensity: number, trebleIntensity: number): void {
    const ctx = this.ctx;
    const helixCount = 2;
    const segments = 100;
    const amplitude = 150 + bassIntensity * 100;
    const wavelength = this.height / 3;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let h = 0; h < helixCount; h++) {
      const phase = h * Math.PI + this.time * 0.02;

      ctx.beginPath();

      for (let i = 0; i <= segments; i++) {
        const t = (i / segments);
        const y = t * this.height;
        const angle = (y / wavelength) * Math.PI * 2 + phase;
        const x = this.centerX + Math.sin(angle) * amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        // Draw connecting rungs
        if (h === 0 && i % 5 === 0) {
          const angle2 = angle + Math.PI;
          const x2 = this.centerX + Math.sin(angle2) * amplitude;

          const hue = (this.hueBase + (i / segments) * 360) % 360;
          ctx.save();
          ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.3 + audioIntensity * 0.3})`;
          ctx.lineWidth = 2 + trebleIntensity * 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.stroke();

          // Draw nodes
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
          gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.7)`);
          gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(x - 8, y - 8, 16, 16);

          const gradient2 = ctx.createRadialGradient(x2, y, 0, x2, y, 8);
          gradient2.addColorStop(0, `hsla(${(hue + 180) % 360}, 90%, 70%, 0.7)`);
          gradient2.addColorStop(1, `hsla(${(hue + 180) % 360}, 80%, 60%, 0)`);
          ctx.fillStyle = gradient2;
          ctx.fillRect(x2 - 8, y - 8, 16, 16);

          ctx.restore();
        }
      }

      const hue = (this.hueBase + h * 180) % 360;
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.4 + audioIntensity * 0.3})`;
      ctx.lineWidth = 3 + audioIntensity * 4;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN 10: PLASMA (Smooth color waves)
  // ═══════════════════════════════════════════════════════════════════════════

  private renderPlasma(audioIntensity: number, bassIntensity: number, midIntensity: number): void {
    const ctx = this.ctx;
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    const time = this.time * 0.05;
    const scale = 0.01 + audioIntensity * 0.005;

    for (let y = 0; y < this.height; y += 2) {
      for (let x = 0; x < this.width; x += 2) {
        // Plasma calculation with multiple sin waves
        const v1 = Math.sin(x * scale + time);
        const v2 = Math.sin((y * scale + time) / 2);
        const v3 = Math.sin((x * scale + y * scale + time) / 2);
        const v4 = Math.sin(Math.sqrt((x - this.centerX) ** 2 + (y - this.centerY) ** 2) * scale + time);

        const plasma = (v1 + v2 + v3 + v4) / 4;

        // Map to colors
        const hue = (this.hueBase + plasma * 180 + bassIntensity * 60) % 360;
        const saturation = 70 + midIntensity * 30;
        const lightness = 40 + plasma * 30 + audioIntensity * 20;

        const rgb = this.hslToRgb(hue / 360, saturation / 100, lightness / 100);

        // Draw 2x2 blocks
        for (let dy = 0; dy < 2 && y + dy < this.height; dy++) {
          for (let dx = 0; dx < 2 && x + dx < this.width; dx++) {
            const idx = ((y + dy) * this.width + (x + dx)) * 4;
            data[idx] = rgb[0] ?? 0;
            data[idx + 1] = rgb[1] ?? 0;
            data[idx + 2] = rgb[2] ?? 0;
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER METHOD
  // ═══════════════════════════════════════════════════════════════════════════

  render(dataArray: Uint8Array, bufferLength: number): void {
    const ctx = this.ctx;

    // Calculate audio metrics
    const avgFrequency = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
    const audioIntensity = Math.min(1, avgFrequency / 128); // More reactive
    const bassIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0, 0.15);
    const midIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.15, 0.5);
    const trebleIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.5, 1.0);

    // Update globals
    this.time += 1;
    this.hueBase = (this.hueBase + 0.3 + bassIntensity * 1.5) % 360;

    // Update pattern transitions
    this.updatePatternTransition(audioIntensity);

    // Clear with fade
    const fadeAmount = this.currentPattern === 'swarm' ? 0.15 : 0.08;
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmount + audioIntensity * 0.05})`;
    ctx.fillRect(0, 0, this.width, this.height);

    // Render current pattern
    if (this.isTransitioning) {
      // Blend between two patterns during transition
      ctx.save();
      ctx.globalAlpha = 1 - this.transitionProgress;
      this.renderPattern(this.currentPattern, audioIntensity, bassIntensity, midIntensity, trebleIntensity);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = this.transitionProgress;
      this.renderPattern(this.nextPattern, audioIntensity, bassIntensity, midIntensity, trebleIntensity);
      ctx.restore();
    } else {
      this.renderPattern(this.currentPattern, audioIntensity, bassIntensity, midIntensity, trebleIntensity);
    }
  }

  private renderPattern(
    pattern: Pattern,
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    switch (pattern) {
      case 'fractal':
        this.renderFractal(audioIntensity, bassIntensity, midIntensity);
        break;
      case 'rays':
        this.renderRays(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case 'tunnel':
        this.renderTunnel(audioIntensity, bassIntensity, midIntensity);
        break;
      case 'bubbles':
        this.renderBubbles(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case 'voronoi':
        this.renderVoronoi(audioIntensity, bassIntensity, midIntensity);
        break;
      case 'waves':
        this.renderWaves(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case 'swarm':
        this.renderSwarm(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case 'mandala':
        this.renderMandala(audioIntensity, bassIntensity, midIntensity);
        break;
      case 'dna':
        this.renderDNA(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case 'plasma':
        this.renderPlasma(audioIntensity, bassIntensity, midIntensity);
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private getFrequencyBandIntensity(
    dataArray: Uint8Array,
    bufferLength: number,
    startRatio: number,
    endRatio: number
  ): number {
    const startIndex = Math.floor(bufferLength * startRatio);
    const endIndex = Math.floor(bufferLength * endRatio);
    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += dataArray[i] ?? 0;
    }
    return Math.min(1, sum / (endIndex - startIndex) / 128); // More reactive
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.canvas.width = width;
    this.canvas.height = height;

    this.initializeParticles();
    this.initializeBubbles();
    this.initializeVoronoiSeeds();
  }
}
