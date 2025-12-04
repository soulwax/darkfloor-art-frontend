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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    // Performance optimization: Cap device pixel ratio and scale based on screen size
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenArea = canvas.width * canvas.height;
    // Scale quality down for very large screens (zoomed out)
    if (screenArea > 1920 * 1080) {
      this.qualityScale = Math.min(0.7, 1920 * 1080 / screenArea);
    } else {
      this.qualityScale = 1;
    }
    this.pixelRatio = Math.min(devicePixelRatio, 2) * this.qualityScale;

    // Create offscreen canvas for one segment
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.centerX = canvas.width / 2;
    this.centerY = canvas.height / 2;
    
    // Shorter radius for closer pivot - use smaller dimension with multiplier for efficiency
    // This brings the pivot closer to screen and reduces rendering load
    const minDimension = Math.min(canvas.width, canvas.height);
    this.maxRadius = minDimension * 0.8;

    this.initializeParticles();
  }

  private initializeParticles(): void {
    // Scale particle count based on quality/performance
    const baseParticleCount = 100;
    const particleCount = Math.floor(baseParticleCount * this.qualityScale);
    const segmentAngle = (Math.PI * 2) / this.segments;

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
    
    // Calculate audio metrics first
    const avgFrequency = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
    const audioIntensity = avgFrequency / 255;
    const bassIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0, 0.15);
    
    // Make hue rotation more reactive to bass
    this.hueOffset = (this.hueOffset + 0.5 + bassIntensity * 2) % 360;

    // Calculate audio metrics (already calculated above, reuse)
    const midIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.3, 0.6);
    const trebleIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.7, 1.0);

    // Performance: Adjust fade rate based on quality
    const fadeRate = 0.05 * (1 + (1 - this.qualityScale) * 0.5);
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeRate})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // More kaleidoscopic: Increase base and max segments for more complex patterns
    const targetSegments = Math.floor(12 + bassIntensity * 20);
    if (Math.abs(this.segments - targetSegments) > 0 && this.time % 5 === 0) {
      this.segments = targetSegments;
    }

    // Clear offscreen canvas
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // Draw one segment on offscreen canvas
    this.drawSegment(audioIntensity, bassIntensity, midIntensity, trebleIntensity);

    // Mirror the segment across all kaleidoscope segments
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const segmentAngle = (Math.PI * 2) / this.segments;

    for (let i = 0; i < this.segments; i++) {
      ctx.save();

      // Rotate to segment position
      ctx.rotate(segmentAngle * i);

      // Mirror every other segment for true kaleidoscope effect
      if (i % 2 === 1) {
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
    const startIndex = Math.floor(bufferLength * startRatio);
    const endIndex = Math.floor(bufferLength * endRatio);
    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += dataArray[i] ?? 0;
    }
    return sum / (endIndex - startIndex) / 255;
  }

  private drawSegment(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    const ctx = this.offscreenCtx;
    const segmentAngle = (Math.PI * 2) / this.segments;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Clip to one segment (a triangle from center)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(0) * this.maxRadius, Math.sin(0) * this.maxRadius);
    ctx.lineTo(Math.cos(segmentAngle) * this.maxRadius, Math.sin(segmentAngle) * this.maxRadius);
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
    const rayCount = Math.floor(baseRayCount * this.qualityScale);

    for (let i = 0; i < rayCount; i++) {
      // Make ray angles more reactive to audio
      const baseAngle = (segmentAngle * i) / rayCount;
      const angle = baseAngle + Math.sin(this.time * 0.05 + i + bassIntensity * 2) * 0.1 * bassIntensity;
      // Shorter rays since pivot is closer - more efficient
      const length = this.maxRadius * (0.7 + Math.sin(this.time * 0.03 + i + bassIntensity * 3) * 0.1 + bassIntensity * 0.2);
      const width = (2 + bassIntensity * 10) * (1 + Math.sin(this.time * 0.05 + i + bassIntensity * 2) * 0.4);

      const endX = Math.cos(angle) * length;
      const endY = Math.sin(angle) * length;

      // Create colorful gradient
      const gradient = ctx.createLinearGradient(0, 0, endX, endY);
      const hue1 = (this.hueOffset + i * 45 + this.time * 0.5) % 360;
      const hue2 = (hue1 + 60) % 360;
      const hue3 = (hue1 + 120) % 360;

      // Dimmed colors - further reduced
      gradient.addColorStop(0, `hsla(${hue1}, 45%, ${25 + audioIntensity * 15}%, ${0.25 + bassIntensity * 0.2})`);
      gradient.addColorStop(0.7, `hsla(${hue2}, 45%, ${30 + midIntensity * 15}%, ${0.3 + audioIntensity * 0.15})`);
      gradient.addColorStop(0.95, `hsla(${hue3}, 45%, 32%, ${0.2 + audioIntensity * 0.15})`);
      gradient.addColorStop(1, `hsla(${hue3}, 45%, 32%, 0.05)`);

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
      ctx.fillStyle = `hsla(${hue}, 45%, ${28 + trebleIntensity * 15}%, ${alpha * 0.5})`;
      ctx.shadowBlur = 8 + trebleIntensity * 12;
      ctx.shadowColor = `hsla(${hue}, 45%, 32%, ${alpha * 0.4})`;

      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      // Draw inner bright core - dimmed
      ctx.fillStyle = `hsla(${(hue + 30) % 360}, 45%, 38%, ${alpha * 0.35})`;
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
    const circles = Math.floor(6 * this.qualityScale);

    for (let i = 0; i < circles; i++) {
      // Make circles more reactive to audio
      const radius = (i + 1) * 30 * (0.7 + audioIntensity * 0.6);
      const pulse = Math.sin(this.time * 0.08 + i + midIntensity * 2) * (10 + midIntensity * 15);
      const currentRadius = radius + pulse + midIntensity * 30;

      const hue = (this.hueOffset + i * 60 + this.time) % 360;

      ctx.save();
      ctx.strokeStyle = `hsla(${hue}, 45%, ${25 + trebleIntensity * 15}%, ${0.15 + audioIntensity * 0.15})`;
      ctx.lineWidth = 2 + midIntensity * 5;
      ctx.shadowBlur = 6 + trebleIntensity * 10;
      ctx.shadowColor = `hsla(${hue}, 45%, 28%, ${0.2 + audioIntensity * 0.2})`;

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
    ctx.strokeStyle = `hsla(${hue}, 45%, ${28 + midIntensity * 15}%, ${0.2 + audioIntensity * 0.2})`;
    ctx.fillStyle = `hsla(${hue}, 45%, ${25 + audioIntensity * 15}%, ${0.08 + trebleIntensity * 0.12})`;
    ctx.lineWidth = 3 + trebleIntensity * 6;
    ctx.shadowBlur = 8 + audioIntensity * 15;
    ctx.shadowColor = `hsla(${hue}, 45%, 30%, ${0.25 + audioIntensity * 0.2})`;

    ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (Math.PI * 2 * i) / sides;
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
    const layerCount = Math.floor(3 * this.qualityScale);
    
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
      
      const hue = (this.hueOffset + layer * 40 + this.time * 0.5) % 360;
      ctx.strokeStyle = `hsla(${hue}, 45%, ${25 + midIntensity * 12}%, ${0.15 + audioIntensity * 0.1})`;
      ctx.lineWidth = 1.5 + trebleIntensity * 2;
      ctx.shadowBlur = 5 + audioIntensity * 10;
      ctx.shadowColor = `hsla(${hue}, 45%, 28%, ${0.2 + audioIntensity * 0.15})`;
      
      ctx.beginPath();
      for (let i = 0; i <= starPoints * 2; i++) {
        const angle = (Math.PI * i) / starPoints;
        const radius = i % 2 === 0 ? starRadius : innerRadius;
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
    const segmentAngle = (Math.PI * 2) / this.segments;

    this.particles.forEach((particle) => {
      // Update position - more reactive to audio
      const speedMultiplier = 1 + audioIntensity * 1.5 + bassIntensity * 0.8;
      particle.x += particle.vx * speedMultiplier;
      particle.y += particle.vy * speedMultiplier;

      // Add rotation - more reactive to bass
      const angle = Math.atan2(particle.y, particle.x);
      const radius = Math.sqrt(particle.x ** 2 + particle.y ** 2);
      const rotationSpeed = 0.01 * (1 + audioIntensity * 2 + bassIntensity * 1.5);
      const newAngle = angle + rotationSpeed;
      particle.x = Math.cos(newAngle) * radius;
      particle.y = Math.sin(newAngle) * radius;

      // Decay life
      particle.life -= 0.005;

      // Keep within segment bounds
      let particleAngle = Math.atan2(particle.y, particle.x);
      if (particleAngle < 0) particleAngle += Math.PI * 2;

      if (particleAngle > segmentAngle) {
        particleAngle = segmentAngle - (particleAngle - segmentAngle);
        particle.x = Math.cos(particleAngle) * radius;
        particle.y = Math.sin(particleAngle) * radius;
        particle.vx *= -0.8;
        particle.vy *= -0.8;
      }

      // Respawn dead particles
      if (particle.life <= 0 || radius > this.maxRadius * 0.6) {
        const newAngle = Math.random() * segmentAngle;
        const newRadius = Math.random() * 50;
        particle.x = Math.cos(newAngle) * newRadius;
        particle.y = Math.sin(newAngle) * newRadius;
        particle.vx = (Math.random() - 0.5) * 2;
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
    if (screenArea > 1920 * 1080) {
      this.qualityScale = Math.min(0.7, 1920 * 1080 / screenArea);
    } else {
      this.qualityScale = 1;
    }
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.pixelRatio = Math.min(devicePixelRatio, 2) * this.qualityScale;

    this.canvas.width = width;
    this.canvas.height = height;
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    
    // Shorter radius for closer pivot - use smaller dimension with multiplier for efficiency
    // This brings the pivot closer to screen and reduces rendering load
    const minDimension = Math.min(width, height);
    this.maxRadius = minDimension * 0.8;
    
    this.particles = [];
    this.initializeParticles();
  }
}
