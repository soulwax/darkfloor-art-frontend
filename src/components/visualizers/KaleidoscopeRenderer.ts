interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
}

export class KaleidoscopeRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private segments = 12;
  private particles: Particle[] = [];
  private time = 0;
  private hueOffset = 0;
  private centerX = 0;
  private centerY = 0;
  private maxRadius = 0;
  private pixelRatio = 1;
  private qualityScale = 1;
  // Pre-calculated constants for performance
  private readonly TWO_PI = Math.PI * 2;
  private readonly INV_255 = 1 / 255;
  private readonly INV_360 = 1 / 360;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // Performance optimization: Cap device pixel ratio and scale based on screen size
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenArea = canvas.width * canvas.height;
    // Scale quality down for very large screens (zoomed out)
    // Use bit shift for multiplication: 1920 * 1080 = (1920 << 10) + (1920 << 3) - 1920
    const threshold = 2073600; // 1920 * 1080 pre-calculated
    if (screenArea > threshold) {
      this.qualityScale = Math.min(0.7, threshold / screenArea);
    } else {
      this.qualityScale = 1;
    }
    this.pixelRatio = (devicePixelRatio < 2 ? devicePixelRatio : 2) * this.qualityScale;

    // Create offscreen canvas for one segment
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    // Use bit shift for division by 2
    this.centerX = canvas.width * 0.5;
    this.centerY = canvas.height * 0.5;
    
    // Shorter radius for closer pivot - use smaller dimension with multiplier for efficiency
    // This brings the pivot closer to screen and reduces rendering load
    const minDimension = Math.min(canvas.width, canvas.height);
    this.maxRadius = minDimension * 0.8;

    this.initializeParticles();
  }

  private initializeParticles(): void {
    // Scale particle count based on quality/performance
    const baseParticleCount = 100;
    const particleCount = (baseParticleCount * this.qualityScale) | 0;
    const segmentAngle = this.TWO_PI / this.segments;

    for (let i = 0; i < particleCount; i++) {
      // Place particles only in first segment, they'll be mirrored
      const angle = Math.random() * segmentAngle;
      const radius = Math.random() * this.maxRadius * 0.5;

      this.particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 5 + Math.random() * 15,
        hue: Math.random() * 360,
        life: 1,
      });
    }
  }

  render(dataArray: Uint8Array, bufferLength: number): void {
    const { ctx, canvas } = this;
    this.time += 1;
    
    // Calculate audio metrics first - optimized reduce
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] ?? 0;
    }
    const audioIntensity = (sum / bufferLength) * this.INV_255;
    const bassIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0, 0.15);
    
    // Make hue rotation more reactive to bass - fast modulo for 360
    this.hueOffset = (this.hueOffset + 0.5 + bassIntensity * 2) % 360;
    if (this.hueOffset < 0) this.hueOffset += 360;

    // Calculate audio metrics (already calculated above, reuse)
    const midIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.3, 0.6);
    const trebleIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.7, 1.0);

    // Clear main canvas with slight fade for trails (darker for more vibrant trails)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // More kaleidoscopic: Increase base and max segments for more complex patterns
    const targetSegments = (12 + bassIntensity * 20) | 0;
    // Use bitwise AND for modulo check (faster for powers of 2, but 5 is not power of 2)
    // However, we can optimize the abs check
    const diff = this.segments - targetSegments;
    if ((diff !== 0) && ((this.time % 5) === 0)) {
      this.segments = targetSegments;
    }

    // Clear offscreen canvas
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // Draw one segment on offscreen canvas
    this.drawSegment(audioIntensity, bassIntensity, midIntensity, trebleIntensity);

    // Mirror the segment across all kaleidoscope segments
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const segmentAngle = this.TWO_PI / this.segments;

    for (let i = 0; i < this.segments; i++) {
      ctx.save();

      // Rotate to segment position
      ctx.rotate(segmentAngle * i);

      // Mirror every other segment - use bitwise for even/odd check
      if (i & 1) {
        ctx.scale(1, -1);
      }

      // Draw the offscreen canvas
      ctx.drawImage(
        this.offscreenCanvas,
        -this.centerX,
        -this.centerY
      );

      ctx.restore();
    }

    ctx.restore();

    // Update particles
    this.updateParticles(audioIntensity, bassIntensity);
  }

  private getFrequencyBandIntensity(
    dataArray: Uint8Array,
    bufferLength: number,
    startRatio: number,
    endRatio: number
  ): number {
    const startIndex = (bufferLength * startRatio) | 0;
    const endIndex = (bufferLength * endRatio) | 0;
    const count = endIndex - startIndex;
    if (count <= 0) return 0;
    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += dataArray[i] ?? 0;
    }
    return (sum / count) * this.INV_255;
  }

  private drawSegment(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    const ctx = this.offscreenCtx;
    const segmentAngle = this.TWO_PI / this.segments;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Clip to one segment (a triangle from center) - optimize cos(0) = 1, sin(0) = 0
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.maxRadius, 0);
    const cosSA = Math.cos(segmentAngle);
    const sinSA = Math.sin(segmentAngle);
    ctx.lineTo(cosSA * this.maxRadius, sinSA * this.maxRadius);
    ctx.closePath();
    ctx.clip();

    // Fill background with subtle gradient to avoid black voids - dimmed
    const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.maxRadius);
    bgGradient.addColorStop(0, `hsla(${this.hueOffset}, 35%, 12%, 0.2)`);
    bgGradient.addColorStop(1, `hsla(${(this.hueOffset + 60) % 360}, 35%, 8%, 0.05)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(-this.centerX, -this.centerY, this.canvas.width, this.canvas.height);

    // Draw colorful rays within the segment
    this.drawRays(ctx, audioIntensity, bassIntensity, midIntensity, segmentAngle);

    // Draw particles
    this.drawParticles(ctx, audioIntensity, trebleIntensity);

    // Draw geometric patterns
    this.drawGeometricPatterns(ctx, audioIntensity, bassIntensity, midIntensity, trebleIntensity);

    // More kaleidoscopic: Add additional layer of patterns for depth
    this.drawKaleidoscopicLayers(ctx, audioIntensity, bassIntensity, midIntensity, trebleIntensity, segmentAngle);

    ctx.restore();
  }

  private drawRays(
    ctx: CanvasRenderingContext2D,
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    segmentAngle: number
  ): void {
    // Scale ray count based on quality for performance
    const baseRayCount = 20;
    const rayCount = (baseRayCount * this.qualityScale) | 0;

    for (let i = 0; i < rayCount; i++) {
      // Make ray angles more reactive to audio - cache sin calculations
      const baseAngle = segmentAngle * i / rayCount;
      const sinTime1 = Math.sin(this.time * 0.05 + i + bassIntensity * 2);
      const angle = baseAngle + sinTime1 * 0.1 * bassIntensity;
      // Shorter rays since pivot is closer - more efficient
      const sinTime2 = Math.sin(this.time * 0.03 + i + bassIntensity * 3);
      const length = this.maxRadius * (0.7 + sinTime2 * 0.1 + bassIntensity * 0.2);
      const width = (2 + bassIntensity * 10) * (1 + sinTime1 * 0.4);

      // Cache cos/sin for angle
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const endX = cosAngle * length;
      const endY = sinAngle * length;

      // Create colorful gradient
      const gradient = ctx.createLinearGradient(0, 0, endX, endY);
      // Fast modulo for hue calculations
      let hue1 = this.hueOffset + i * 45 + this.time * 0.5;
      hue1 = hue1 % 360;
      if (hue1 < 0) hue1 += 360;
      let hue2 = hue1 + 60;
      if (hue2 >= 360) hue2 -= 360;
      let hue3 = hue1 + 120;
      if (hue3 >= 360) hue3 -= 360;

      gradient.addColorStop(0, `hsla(${hue1}, 100%, ${50 + audioIntensity * 30}%, ${0.3 + bassIntensity * 0.2})`);
      gradient.addColorStop(0.5, `hsla(${hue2}, 100%, ${60 + midIntensity * 30}%, ${0.35 + audioIntensity * 0.15})`);
      gradient.addColorStop(1, `hsla(${hue3}, 100%, 70%, 0)`);

      ctx.save();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 12 + bassIntensity * 20;
      ctx.shadowColor = `hsla(${hue1}, 45%, 28%, ${0.3 + audioIntensity * 0.1})`;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    this.particles.forEach((particle) => {
      if (particle.life <= 0) return;

      // Make particle size more reactive to treble
      const size = particle.size * (0.4 + audioIntensity * 0.6 + trebleIntensity * 0.7);
      const alpha = particle.life * (0.25 + audioIntensity * 0.2);

      // Draw particle with glow - dimmed further
      ctx.save();
      ctx.translate(particle.x, particle.y);

      const hue = (particle.hue + this.hueOffset) % 360;
      ctx.fillStyle = `hsla(${hue}, 100%, ${60 + trebleIntensity * 30}%, ${alpha * 0.5})`;
      ctx.shadowBlur = 15 + trebleIntensity * 25;
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.5})`;

      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      // Draw inner bright core
      ctx.fillStyle = `hsla(${(hue + 30) % 360}, 100%, 90%, ${alpha * 0.4})`;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private drawGeometricPatterns(
    ctx: CanvasRenderingContext2D,
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    // More kaleidoscopic: More circles for complex patterns
    const circles = (6 * this.qualityScale) | 0;

    for (let i = 0; i < circles; i++) {
      // Make circles more reactive to audio
      const radius = (i + 1) * 30 * (0.7 + audioIntensity * 0.6);
      const pulse = Math.sin(this.time * 0.08 + i + midIntensity * 2) * (10 + midIntensity * 15);
      const currentRadius = radius + pulse + midIntensity * 30;

      // Fast modulo for hue
      let hue = this.hueOffset + i * 60 + this.time;
      hue = hue % 360;
      if (hue < 0) hue += 360;

      ctx.save();
      ctx.strokeStyle = `hsla(${hue}, 100%, ${50 + trebleIntensity * 30}%, ${0.15 + audioIntensity * 0.15})`;
      ctx.lineWidth = 2 + midIntensity * 4;
      ctx.shadowBlur = 10 + trebleIntensity * 20;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${0.25 + audioIntensity * 0.25})`;

      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw rotating polygons - more reactive rotation
    const sides = 6;
    const polygonRadius = 100 * (0.6 + audioIntensity * 0.7);
    const rotation = this.time * 0.02 + bassIntensity * 0.5;

    ctx.save();
    ctx.rotate(rotation);

    const hue = (this.hueOffset + this.time * 2) % 360;
    ctx.strokeStyle = `hsla(${hue}, 100%, ${60 + midIntensity * 30}%, ${0.25 + audioIntensity * 0.2})`;
    ctx.fillStyle = `hsla(${hue}, 100%, ${50 + audioIntensity * 30}%, ${0.075 + trebleIntensity * 0.1})`;
    ctx.lineWidth = 3 + trebleIntensity * 5;
    ctx.shadowBlur = 15 + audioIntensity * 30;
    ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${0.3 + audioIntensity * 0.2})`;

    // Pre-calculate angle increment
    const angleStep = this.TWO_PI / sides;
    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = angleStep * i;
      const x = Math.cos(angle) * polygonRadius;
      const y = Math.sin(angle) * polygonRadius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawKaleidoscopicLayers(
    ctx: CanvasRenderingContext2D,
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number,
    segmentAngle: number
  ): void {
    // More kaleidoscopic: Add additional nested patterns for depth
    const layerCount = (3 * this.qualityScale) | 0;
    
    for (let layer = 0; layer < layerCount; layer++) {
      const layerScale = 0.3 + layer * 0.2;
      const layerRotation = this.time * (0.01 + layer * 0.005) + bassIntensity * 0.3;
      const layerRadius = this.maxRadius * layerScale;
      
      ctx.save();
      ctx.rotate(layerRotation);
      
      // Draw nested star patterns
      const starPoints = 8 + layer * 2;
      const starRadius = layerRadius * 0.6;
      const innerRadius = starRadius * 0.4;
      
      // Fast modulo for hue
      let hue = this.hueOffset + layer * 40 + this.time * 0.5;
      hue = hue % 360;
      if (hue < 0) hue += 360;
      ctx.strokeStyle = `hsla(${hue}, 45%, ${25 + midIntensity * 12}%, ${0.15 + audioIntensity * 0.1})`;
      ctx.lineWidth = 1.5 + trebleIntensity * 2;
      ctx.shadowBlur = 5 + audioIntensity * 10;
      ctx.shadowColor = `hsla(${hue}, 45%, 28%, ${0.2 + audioIntensity * 0.15})`;
      
      // Pre-calculate angle step and use bitwise for even/odd check
      const angleStep = Math.PI / starPoints;
      ctx.beginPath();
      for (let i = 0; i <= starPoints * 2; i++) {
        const angle = angleStep * i;
        // Use bitwise AND for even check (faster than modulo)
        const radius = (i & 1) === 0 ? starRadius : innerRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    }
  }

  private updateParticles(audioIntensity: number, bassIntensity: number): void {
    const segmentAngle = this.TWO_PI / this.segments;

    this.particles.forEach((particle) => {
      // Update position - more reactive to audio
      const speedMultiplier = 1 + audioIntensity * 1.5 + bassIntensity * 0.8;
      particle.x += particle.vx * speedMultiplier;
      particle.y += particle.vy * speedMultiplier;

      // Add rotation - more reactive to bass - optimize sqrt with x*x + y*y
      const angle = Math.atan2(particle.y, particle.x);
      const x2 = particle.x * particle.x;
      const y2 = particle.y * particle.y;
      const radius = Math.sqrt(x2 + y2);
      const rotationSpeed = 0.01 * (1 + audioIntensity * 2 + bassIntensity * 1.5);
      const newAngle = angle + rotationSpeed;
      const cosNA = Math.cos(newAngle);
      const sinNA = Math.sin(newAngle);
      particle.x = cosNA * radius;
      particle.y = sinNA * radius;

      // Decay life
      particle.life -= 0.005;

      // Keep within segment bounds - use TWO_PI constant
      let particleAngle = Math.atan2(particle.y, particle.x);
      if (particleAngle < 0) particleAngle += this.TWO_PI;

      if (particleAngle > segmentAngle) {
        particleAngle = segmentAngle - (particleAngle - segmentAngle);
        particle.x = Math.cos(particleAngle) * radius;
        particle.y = Math.sin(particleAngle) * radius;
        particle.vx *= -0.8;
        particle.vy *= -0.8;
      }

      // Respawn dead particles - cache random and trig calculations
      if (particle.life <= 0 || radius > this.maxRadius * 0.6) {
        const newAngle = Math.random() * segmentAngle;
        const newRadius = Math.random() * 50;
        const cosNA = Math.cos(newAngle);
        const sinNA = Math.sin(newAngle);
        particle.x = cosNA * newRadius;
        particle.y = sinNA * newRadius;
        const rand1 = Math.random() - 0.5;
        particle.vx = rand1 * 2;
        particle.vy = (Math.random() - 0.5) * 2;
        particle.life = 1;
        particle.hue = Math.random() * 360;
        particle.size = 5 + Math.random() * 15 + bassIntensity * 10;
      }
    });
  }

  resize(width: number, height: number): void {
    // Performance optimization: Scale quality based on screen size
    const screenArea = width * height;
    const threshold = 2073600; // 1920 * 1080 pre-calculated
    if (screenArea > threshold) {
      this.qualityScale = threshold / screenArea < 0.7 ? threshold / screenArea : 0.7;
    } else {
      this.qualityScale = 1;
    }
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.pixelRatio = Math.min(devicePixelRatio, 2) * this.qualityScale;

    this.canvas.width = width;
    this.canvas.height = height;
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    // Use multiplication by 0.5 instead of division
    this.centerX = width * 0.5;
    this.centerY = height * 0.5;
    
    // Shorter radius for closer pivot - use smaller dimension with multiplier for efficiency
    // This brings the pivot closer to screen and reduces rendering load
    const minDimension = Math.min(width, height);
    this.maxRadius = minDimension * 0.8;
    
    this.particles = [];
    this.initializeParticles();
  }
}
