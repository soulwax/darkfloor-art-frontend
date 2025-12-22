// File: src/components/visualizers/FlowFieldRenderer.ts

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
  symbolType: number; // Occult symbol type (0-7)
  rotation: number; // Rotation angle for symbol
}

type Pattern =
  | "fractal"
  | "rays"
  | "tunnel"
  | "bubbles"
  | "waves"
  | "swarm"
  | "mandala"
  | "dna"
  | "galaxy"
  | "matrix"
  | "lightning"
  | "aurora"
  | "fireworks"
  | "lissajous"
  | "rings"
  | "starfield"
  | "fluid"
  | "hexgrid"
  | "spirograph"
  | "constellation"
  | "pentagram"
  | "runes"
  | "sigils"
  | "ouroboros"
  | "chakras"
  | "alchemy"
  | "celestial"
  | "portal"
  | "dreamcatcher"
  | "phoenix"
  | "serpent"
  | "crystalGrid"
  | "moonPhases"
  | "astrolabe"
  | "tarot"
  | "kabbalah"
  | "merkaba"
  | "flowerOfLife"
  | "sriYantra"
  | "metatron"
  | "vesicaPiscis"
  | "torusField"
  | "cosmicEgg"
  | "enochian"
  | "labyrinth"
  | "cosmicWeb"
  | "vortexSpiral"
  | "sacredSpiral"
  | "elementalCross"
  | "dragonEye"
  | "ancientGlyphs"
  | "timeWheel"
  | "astralProjection"
  | "ethericField"
  | "platonic"
  | "infinityKnot"
  | "cosmicLotus"
  | "voidMandala"
  | "stellarMap"
  | "wyrdWeb"
  | "spiritualGateway"
  | "akashicRecords"
  | "sacredGeometry"
  | "shadowRealm"
  | "quantumEntanglement"
  | "necromanticSigil"
  | "dimensionalRift"
  | "chaosVortex"
  | "etherealMist"
  | "bloodMoon"
  | "darkMatter"
  | "soulFragment"
  | "forbiddenRitual"
  | "twilightZone"
  | "spectralEcho"
  | "voidWhisper"
  | "demonicGate"
  | "cursedRunes"
  | "shadowDance"
  | "nightmareFuel"
  | "abyssalDepth"
  | "phantomPulse"
  | "infernalFlame";

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

  private currentPattern: Pattern = "rays";
  private nextPattern: Pattern = "fractal";
  private patternTimer = 0;
  private patternDuration = 10;
  private transitionProgress = 0;
  private transitionSpeed = 0.015;
  private isTransitioning = false;
  private hasLoggedInitialPattern = false;
  private allPatterns: Pattern[] = [
    "rays",
    "galaxy",
    "fractal",
    "aurora",
    "tunnel",
    "lightning",
    "bubbles",
    "fireworks",
    "starfield",
    "waves",
    "matrix",
    "swarm",
    "lissajous",
    "mandala",
    "rings",
    "dna",
    "fluid",
    "hexgrid",
    "spirograph",
    "constellation",
    "pentagram",
    "runes",
    "sigils",
    "ouroboros",
    "chakras",
    "alchemy",
    "celestial",
    "portal",
    "dreamcatcher",
    "phoenix",
    "serpent",
    "crystalGrid",
    "moonPhases",
    "astrolabe",
    "tarot",
    "kabbalah",
    "merkaba",
    "flowerOfLife",
    "sriYantra",
    "metatron",
    "vesicaPiscis",
    "torusField",
    "cosmicEgg",
    "enochian",
    "labyrinth",
    "cosmicWeb",
    "vortexSpiral",
    "sacredSpiral",
    "elementalCross",
    "dragonEye",
    "ancientGlyphs",
    "timeWheel",
    "astralProjection",
    "ethericField",
    "platonic",
    "infinityKnot",
    "cosmicLotus",
    "voidMandala",
    "stellarMap",
    "wyrdWeb",
    "spiritualGateway",
    "akashicRecords",
    "sacredGeometry",
    "shadowRealm",
    "quantumEntanglement",
    "necromanticSigil",
    "dimensionalRift",
    "chaosVortex",
    "etherealMist",
    "bloodMoon",
    "darkMatter",
    "soulFragment",
    "forbiddenRitual",
    "twilightZone",
    "spectralEcho",
    "voidWhisper",
    "demonicGate",
    "cursedRunes",
    "shadowDance",
    "nightmareFuel",
    "abyssalDepth",
    "phantomPulse",
    "infernalFlame",
  ];
  private patternSequence: Pattern[] = [];
  private patternIndex = 0;

  private fractalZoom = 1;
  private fractalOffsetX = -0.5;
  private fractalOffsetY = 0;
  private juliaC = { re: -0.7, im: 0.27 };

  // Pattern-specific configurable parameters
  private particleCount = 800;
  private particleSize = 2.0;
  private particleSpeed = 1.0;
  private bubbleCount = 40;
  private bubbleSize = 1.0;
  private bubbleSpeed = 1.0;
  private starCount = 200;
  private starSpeed = 1.0;
  private rayCount = 24;
  private waveCount = 5;
  private waveAmplitude = 1.0;
  private ringCount = 15;
  private lightningCount = 1;
  private matrixSpeed = 1.0;
  private tunnelSpeed = 1.0;
  private galaxyArmCount = 4;
  private auroraIntensity = 1.0;
  private mandalaLayers = 5;

  // Extended pattern-specific parameters
  private tarotCardSize = 1.0;
  private tarotCardCount = 8;
  private sacredSpiralCount = 3;
  private sacredSpiralTightness = 1.0;
  private pentagramSize = 1.0;
  private pentagramRotationSpeed = 1.0;
  private runeSize = 1.0;
  private runeCount = 8;
  private sigilCount = 6;
  private sigilSize = 1.0;
  private chakraSize = 1.0;
  private chakraSpacing = 1.0;
  private portalSize = 1.0;
  private portalRingCount = 5;
  private phoenixWingSpan = 1.0;
  private crystalGridSize = 1.0;
  private crystalCount = 12;
  private moonPhaseCount = 8;
  private moonPhaseSize = 1.0;
  private flowerOfLifeCircleCount = 7;
  private flowerOfLifeSize = 1.0;
  private metatronNodeCount = 13;
  private metatronSize = 1.0;
  private torusRingCount = 12;
  private torusThickness = 1.0;
  private labyrinthComplexity = 1.0;
  private labyrinthPathWidth = 1.0;
  private vortexSpiralCount = 4;
  private vortexRotationSpeed = 1.0;
  private dragonEyeSize = 1.0;
  private dragonPupilSize = 1.0;
  private ancientGlyphCount = 16;
  private ancientGlyphSize = 1.0;
  private platonicSize = 1.0;
  private platonicRotationSpeed = 1.0;
  private cosmicLotusLayerCount = 5;
  private cosmicLotusPetalCount = 8;

  private lightningBolts: {
    segments: { x: number; y: number }[];
    life: number;
    maxLife: number;
  }[] = [];

  private fireworks: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    hue: number;
    life: number;
    maxLife: number;
    size: number;
  }[] = [];

  private matrixColumns: { y: number; speed: number; chars: string }[] = [];

  private stars: { x: number; y: number; z: number; size: number }[] = [];

  private constellationStars: {
    x: number;
    y: number;
    connections: number[];
  }[] = [];

  private stellarMapStars: {
    x: number;
    y: number;
    size: number;
    hue: number;
  }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) throw new Error("Could not get canvas context");
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = this.width * 0.5; // / 2 optimized
    this.centerY = this.height * 0.5; // / 2 optimized

    this.shufflePatterns();
    this.initializeParticles();
    this.initializeBubbles();
  }

  private formatPatternName(pattern: Pattern): string {
    // Convert camelCase to Title Case with spaces
    return pattern
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private logPatternChange(
    pattern: Pattern,
    event:
      | "playing"
      | "transitioning-to"
      | "transitioned-to"
      | "manual-selection",
  ): void {
    const formattedName = this.formatPatternName(pattern);
    const emoji =
      event === "playing"
        ? "🎨"
        : event === "transitioning-to"
          ? "🔄"
          : event === "manual-selection"
            ? "🎯"
            : "✨";
    const message =
      event === "playing"
        ? `${emoji} Visual playing: ${formattedName}`
        : event === "transitioning-to"
          ? `${emoji} Transitioning to: ${formattedName}`
          : event === "manual-selection"
            ? `${emoji} Manually selected: ${formattedName}`
            : `${emoji} Now playing: ${formattedName}`;
    console.log(`[Visual] ${message}`);
  }

  private shufflePatterns(): void {
    // Fisher-Yates shuffle algorithm
    this.patternSequence = [...this.allPatterns];
    for (let i = this.patternSequence.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [this.patternSequence[i], this.patternSequence[j]] = [
        this.patternSequence[j]!,
        this.patternSequence[i]!,
      ];
    }
  }

  private initializeParticles(): void {
    const count = Math.min(
      this.particleCount,
      (this.width * this.height * 0.00125) | 0,
    );
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
      vx: (Math.random() - 0.5) * 2 * this.particleSpeed,
      vy: (Math.random() - 0.5) * 2 * this.particleSpeed,
      size: (0.8 + Math.random() * 2.5) * this.particleSize,
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
    const count = this.bubbleCount;

    for (let i = 0; i < count; i++) {
      this.bubbles.push(this.createBubble());
    }
  }

  private createBubble(): Bubble {
    // Mystical color palette: deep purples, dark blues, crimson reds
    const mysticalHues = [270, 280, 290, 240, 250, 0, 330, 340];
    const baseHue =
      mysticalHues[Math.floor(Math.random() * mysticalHues.length)] ?? 270;
    const hue = baseHue + (Math.random() - 0.5) * 20;

    return {
      x: Math.random() * this.width,
      y: this.height + Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.3 * this.bubbleSpeed,
      vy: -(0.3 + Math.random() * 1.0) * this.bubbleSpeed,
      radius: (15 + Math.random() * 35) * this.bubbleSize,
      hue: hue % 360,
      age: 0,
      maxAge: 400 + Math.random() * 400,
      popping: false,
      popProgress: 0,
      symbolType: (Math.random() * 8) | 0, // 8 different occult symbols
      rotation: Math.random() * Math.PI * 2,
    };
  }

  private initializeStars(): void {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * this.width * 2,
        y: (Math.random() - 0.5) * this.height * 2,
        z: Math.random() * 1000,
        size: Math.random() * 2,
      });
    }
  }

  private initializeMatrixColumns(): void {
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ01";
    this.matrixColumns = [];
    const columnCount = (this.width * 0.05) | 0; // / 20 optimized

    for (let i = 0; i < columnCount; i++) {
      this.matrixColumns.push({
        y: Math.random() * this.height,
        speed: 2 + Math.random() * 5,
        chars: Array(20)
          .fill(0)
          .map(() => chars[Math.floor(Math.random() * chars.length)])
          .join(""),
      });
    }
  }

  private initializeConstellationStars(): void {
    this.constellationStars = [];
    const starCount = 20 + ((Math.random() * 15) | 0);

    for (let i = 0; i < starCount; i++) {
      this.constellationStars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        connections: [],
      });
    }

    for (let i = 0; i < this.constellationStars.length; i++) {
      const star = this.constellationStars[i];
      if (!star) continue;

      const distances: { index: number; dist: number }[] = [];
      for (let j = 0; j < this.constellationStars.length; j++) {
        if (i === j) continue;
        const other = this.constellationStars[j];
        if (!other) continue;

        const dx = other.x - star.x;
        const dy = other.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        distances.push({ index: j, dist });
      }

      distances.sort((a, b) => a.dist - b.dist);
      star.connections = distances.slice(0, 3).map((d) => d.index);
    }
  }

  private updatePatternTransition(audioIntensity: number): void {
    const dynamicDuration = Math.max(
      150, // Halved from 300 to 150
      this.patternDuration - audioIntensity * 200,
    );

    this.patternTimer++;

    // Log initial pattern on first render
    if (!this.hasLoggedInitialPattern) {
      this.logPatternChange(this.currentPattern, "playing");
      this.hasLoggedInitialPattern = true;
    }

    if (this.isTransitioning) {
      const rawProgress =
        this.transitionProgress +
        this.transitionSpeed * (1 + audioIntensity * 0.3);
      this.transitionProgress = Math.min(1, rawProgress);

      if (this.transitionProgress >= 1) {
        this.transitionProgress = 0;
        this.isTransitioning = false;
        const previousPattern = this.currentPattern;
        this.currentPattern = this.nextPattern;
        this.patternTimer = 0;

        // Log when transition completes
        if (previousPattern !== this.currentPattern) {
          this.logPatternChange(this.currentPattern, "transitioned-to");
        }
      }
    } else if (this.patternTimer > dynamicDuration) {
      this.isTransitioning = true;
      this.transitionProgress = 0;
      this.patternIndex = (this.patternIndex + 1) % this.patternSequence.length;

      // Re-shuffle when we complete a full cycle
      if (this.patternIndex === 0) {
        this.shufflePatterns();
      }

      this.nextPattern = this.patternSequence[this.patternIndex] ?? "rays";

      // Log when transition starts
      this.logPatternChange(this.nextPattern, "transitioning-to");
    }
  }

  private renderFractal(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    this.juliaC.re =
      -0.7 + Math.sin(this.time * 0.001) * 0.2 + bassIntensity * 0.1;
    this.juliaC.im =
      0.27 + Math.cos(this.time * 0.0015) * 0.2 + midIntensity * 0.1;

    this.fractalZoom +=
      (0.02 + audioIntensity * 0.05) * (1 + Math.sin(this.time * 0.002) * 0.5);

    const maxIter = 30 + ((audioIntensity * 30) | 0);
    const zoom = Math.pow(1.5, this.fractalZoom);

    for (let py = 0; py < this.height; py += 3) {
      for (let px = 0; px < this.width; px += 3) {
        const x0 =
          (px - this.centerX) / (this.width * 0.25) / zoom +
          this.fractalOffsetX;
        const y0 =
          (py - this.centerY) / (this.height * 0.25) / zoom +
          this.fractalOffsetY;

        let x = x0;
        let y = y0;
        let iter = 0;

        while (iter < maxIter) {
          const xSq = x * x;
          const ySq = y * y;
          if (xSq + ySq > 4) break; // Early exit optimization
          const xtemp = xSq - ySq + this.juliaC.re;
          y = (x + x) * y + this.juliaC.im; // 2 * x optimized
          x = xtemp;
          iter++;
        }

        const hue =
          (this.hueBase + (iter / maxIter) * 360 + bassIntensity * 60) % 360;
        const saturation = 70 + audioIntensity * 30;
        const lightness = iter < maxIter ? (iter / maxIter) * 60 : 0;

        const rgb = this.hslToRgb(hue / 360, saturation / 100, lightness / 100);

        for (let dy = 0; dy < 3 && py + dy < this.height; dy++) {
          for (let dx = 0; dx < 3 && px + dx < this.width; dx++) {
            const i = ((py + dy) * this.width + (px + dx)) << 2; // * 4 optimized
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

  private renderRays(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const rayCount = this.rayCount + ((bassIntensity * this.rayCount) | 0);
    const angleStep = (Math.PI * 2) / rayCount;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < rayCount; i++) {
      const angle = angleStep * i + this.time * 0.005;
      const rayLength =
        Math.min(this.width, this.height) * (0.6 + audioIntensity * 0.4);
      const rayWidth = 2 + trebleIntensity * 8;

      const endX = this.centerX + Math.cos(angle) * rayLength;
      const endY = this.centerY + Math.sin(angle) * rayLength;

      for (let offset = -2; offset <= 2; offset++) {
        const hue = (this.hueBase + i * (360 / rayCount) + offset * 10) % 360;
        const alpha =
          (0.15 + audioIntensity * 0.15) * (1 - Math.abs(offset) * 0.3);

        const gradient = ctx.createLinearGradient(
          this.centerX,
          this.centerY,
          endX + offset * 3,
          endY + offset * 3,
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

    const glowGradient = ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      0,
      this.centerX,
      this.centerY,
      100 + bassIntensity * 100,
    );
    glowGradient.addColorStop(
      0,
      `hsla(${this.hueBase}, 100%, 80%, ${0.4 + audioIntensity * 0.3})`,
    );
    glowGradient.addColorStop(
      0.5,
      `hsla(${this.hueBase}, 90%, 60%, ${0.2 + audioIntensity * 0.2})`,
    );
    glowGradient.addColorStop(1, `hsla(${this.hueBase}, 80%, 40%, 0)`);

    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.restore();
  }

  private renderTunnel(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const rings = 30;
    const segments = 48;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let r = 0; r < rings; r++) {
      const depth = r / rings;
      const z =
        depth + this.time * 0.003 * this.tunnelSpeed + bassIntensity * 0.1;
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

      if (r % 3 === 0) {
        const gradient = ctx.createRadialGradient(
          this.centerX,
          this.centerY,
          radius * 0.7,
          this.centerX,
          this.centerY,
          radius,
        );
        gradient.addColorStop(0, `hsla(${hue}, 70%, 50%, 0)`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, ${alpha * 0.3})`);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawOccultSymbol(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    symbolType: number,
    rotation: number,
    hue: number,
    alpha: number,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${alpha})`;
    ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${alpha * 0.2})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (
      symbolType & 7 // % 8 optimized with bitwise AND
    ) {
      case 0: // Pentagram
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const r = size * 0.4;
          const x1 = Math.cos(angle) * r;
          const y1 = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x1, y1);
          else ctx.lineTo(x1, y1);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 1: // Rune (Algiz - protection)
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);
        ctx.lineTo(0, size * 0.5);
        ctx.moveTo(-size * 0.2, -size * 0.3);
        ctx.lineTo(size * 0.2, -size * 0.3);
        ctx.moveTo(-size * 0.15, size * 0.2);
        ctx.lineTo(size * 0.15, size * 0.2);
        ctx.stroke();
        break;

      case 2: // Hexagram (Star of David)
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const r = size * 0.4;
          const x1 = Math.cos(angle) * r;
          const y1 = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x1, y1);
          else ctx.lineTo(x1, y1);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + Math.PI / 6 - Math.PI / 2;
          const r = size * 0.4;
          const x1 = Math.cos(angle) * r;
          const y1 = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x1, y1);
          else ctx.lineTo(x1, y1);
        }
        ctx.closePath();
        ctx.stroke();
        break;

      case 3: // Sigil (circular with lines)
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(
            Math.cos(angle) * size * 0.35,
            Math.sin(angle) * size * 0.35,
          );
          ctx.stroke();
        }
        break;

      case 4: // Eye (all-seeing eye)
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.4, size * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${alpha})`;
        ctx.fill();
        break;

      case 5: // Ankh
        ctx.beginPath();
        ctx.arc(0, -size * 0.2, size * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.4);
        ctx.lineTo(0, size * 0.5);
        ctx.moveTo(-size * 0.25, size * 0.2);
        ctx.lineTo(size * 0.25, size * 0.2);
        ctx.stroke();
        break;

      case 6: // Triple moon
        ctx.beginPath();
        ctx.arc(-size * 0.25, 0, size * 0.15, Math.PI / 2, -Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.2, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(size * 0.25, 0, size * 0.15, Math.PI / 2, -Math.PI / 2);
        ctx.stroke();
        break;

      case 7: // Sacred geometry triangle
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.4);
        ctx.lineTo(-size * 0.35, size * 0.3);
        ctx.lineTo(size * 0.35, size * 0.3);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);
        ctx.lineTo(0, -size * 0.2);
        ctx.moveTo(-size * 0.2, size * 0.05);
        ctx.lineTo(size * 0.2, size * 0.05);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }

  private renderBubbles(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;

    // Spawn mystical orbs on bass hits
    if (bassIntensity > 0.4 && Math.random() > 0.85) {
      this.bubbles.push(this.createBubble());
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      if (!bubble) continue;

      if (bubble.popping) {
        bubble.popProgress += 0.08 + trebleIntensity * 0.08;

        if (bubble.popProgress >= 1) {
          this.bubbles.splice(i, 1);
          continue;
        }

        // Mystical dissipation effect
        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        const particleCount = 16;
        for (let s = 0; s < particleCount; s++) {
          const angle = (s / particleCount) * Math.PI * 2;
          const dist = bubble.radius * bubble.popProgress * 2.5;
          const x = bubble.x + Math.cos(angle) * dist;
          const y = bubble.y + Math.sin(angle) * dist;

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
          gradient.addColorStop(
            0,
            `hsla(${bubble.hue}, 100%, 60%, ${(1 - bubble.popProgress) * 0.8})`,
          );
          gradient.addColorStop(1, `hsla(${bubble.hue}, 80%, 40%, 0)`);

          ctx.fillStyle = gradient;
          ctx.fillRect(x - 8, y - 8, 16, 16);
        }

        ctx.restore();
      } else {
        bubble.age++;
        bubble.rotation += 0.01 + audioIntensity * 0.005;

        // Gentle floating motion
        bubble.vy -= 0.008;
        bubble.vx += (Math.random() - 0.5) * 0.05;
        bubble.vx *= 0.98;
        bubble.vy *= 0.98;

        bubble.x +=
          bubble.vx + Math.sin(this.time * 0.015 + bubble.y * 0.01) * 0.3;
        bubble.y += bubble.vy;

        if (
          bubble.age > bubble.maxAge ||
          bubble.y < -bubble.radius * 2 ||
          bubble.x < -bubble.radius ||
          bubble.x > this.width + bubble.radius ||
          (trebleIntensity > 0.75 && Math.random() > 0.97)
        ) {
          bubble.popping = true;
          continue;
        }

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        // Outer mystical glow - darker, more ethereal
        const outerGlow = ctx.createRadialGradient(
          bubble.x,
          bubble.y,
          bubble.radius * 0.5,
          bubble.x,
          bubble.y,
          bubble.radius * 2.2,
        );
        outerGlow.addColorStop(
          0,
          `hsla(${bubble.hue}, 100%, 50%, ${0.15 + audioIntensity * 0.1})`,
        );
        outerGlow.addColorStop(
          0.4,
          `hsla(${(bubble.hue + 30) % 360}, 90%, 40%, ${0.08 + audioIntensity * 0.05})`,
        );
        outerGlow.addColorStop(
          1,
          `hsla(${(bubble.hue + 60) % 360}, 80%, 30%, 0)`,
        );

        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Inner orb - dark, translucent, mystical
        const orbGradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.2,
          bubble.y - bubble.radius * 0.2,
          bubble.radius * 0.1,
          bubble.x,
          bubble.y,
          bubble.radius,
        );
        orbGradient.addColorStop(
          0,
          `hsla(${bubble.hue}, 85%, 45%, ${0.25 + audioIntensity * 0.15})`,
        );
        orbGradient.addColorStop(
          0.3,
          `hsla(${(bubble.hue + 20) % 360}, 80%, 35%, ${0.2 + audioIntensity * 0.1})`,
        );
        orbGradient.addColorStop(
          0.7,
          `hsla(${(bubble.hue + 40) % 360}, 75%, 25%, ${0.15 + audioIntensity * 0.08})`,
        );
        orbGradient.addColorStop(
          1,
          `hsla(${(bubble.hue + 60) % 360}, 70%, 20%, ${0.1 + audioIntensity * 0.05})`,
        );

        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle inner glow highlight
        const innerGlow = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          0,
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          bubble.radius * 0.5,
        );
        innerGlow.addColorStop(
          0,
          `hsla(${bubble.hue}, 100%, 60%, ${0.3 + audioIntensity * 0.2})`,
        );
        innerGlow.addColorStop(1, `hsla(${bubble.hue}, 90%, 50%, 0)`);

        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          bubble.radius * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Draw occult symbol inside the orb
        const symbolAlpha = 0.6 + audioIntensity * 0.3;
        this.drawOccultSymbol(
          ctx,
          bubble.x,
          bubble.y,
          bubble.radius * 0.7,
          bubble.symbolType,
          bubble.rotation,
          bubble.hue,
          symbolAlpha,
        );

        ctx.restore();
      }
    }
  }

  private renderWaves(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const waveCount = this.waveCount;
    const amplitude = (50 + audioIntensity * 100) * this.waveAmplitude;
    const frequency = 0.02 + trebleIntensity * 0.03;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let w = 0; w < waveCount; w++) {
      const phase = this.time * 0.02 + (w * Math.PI) / waveCount;
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

      const gradient = ctx.createRadialGradient(
        this.centerX,
        this.centerY,
        baseRadius * 0.8,
        this.centerX,
        this.centerY,
        baseRadius + amplitude,
      );
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 85%, 65%, ${alpha * 0.2})`);
      gradient.addColorStop(1, `hsla(${hue}, 70%, 50%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    const gridSize = 40;
    ctx.globalAlpha = 0.2 + audioIntensity * 0.2;

    for (let y = 0; y < this.height; y += gridSize) {
      for (let x = 0; x < this.width; x += gridSize) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const wave =
          Math.sin(dist * frequency - this.time * 0.05) * 10 * trebleIntensity;

        const hue = (this.hueBase + dist * 0.5) % 360;
        const size = 2 + wave;

        ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.6)`;
        ctx.fillRect(x + wave, y + wave, size, size);
      }
    }

    ctx.restore();
  }

  private renderSwarm(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle) continue;

      let alignX = 0,
        alignY = 0;
      let cohereX = 0,
        cohereY = 0;
      let separateX = 0,
        separateY = 0;
      let neighbors = 0;

      const perceptionRadius = 50 + audioIntensity * 50;
      const perceptionRadiusSq = perceptionRadius * perceptionRadius; // Cache squared
      const separationDistSq = 30 * 30; // 30^2 = 900

      for (let j = 0; j < this.particles.length; j++) {
        if (i === j) continue;
        const other = this.particles[j];
        if (!other) continue;

        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const distSq = dx * dx + dy * dy; // Use squared distance

        if (distSq < perceptionRadiusSq && distSq > 0) {
          alignX += other.vx;
          alignY += other.vy;

          cohereX += other.x;
          cohereY += other.y;

          if (distSq < separationDistSq) {
            const dist = Math.sqrt(distSq); // Only calculate sqrt when needed
            const invDist = 1 / dist; // Cache inverse
            separateX -= dx * invDist;
            separateY -= dy * invDist;
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

      const dx = this.centerX - particle.x;
      const dy = this.centerY - particle.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      const invDist = 1 / dist; // Cache inverse
      const centerForce = 0.001 * (1 + bassIntensity * 2);

      particle.vx +=
        alignX * 0.02 + cohereX + separateX + dx * invDist * centerForce;
      particle.vy +=
        alignY * 0.02 + cohereY + separateY + dy * invDist * centerForce;

      const maxSpeed = 2 + trebleIntensity * 3;
      const maxSpeedSq = maxSpeed * maxSpeed; // Cache squared value
      const speedSq = particle.vx * particle.vx + particle.vy * particle.vy;
      if (speedSq > maxSpeedSq) {
        const speed = Math.sqrt(speedSq); // Only calculate sqrt when needed
        const invSpeed = maxSpeed / speed; // Cache inverse
        particle.vx *= invSpeed;
        particle.vy *= invSpeed;
      }

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0) particle.x = this.width;
      if (particle.x > this.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.height;
      if (particle.y > this.height) particle.y = 0;

      particle.trail.push({ x: particle.x, y: particle.y, alpha: 1 });
      if (particle.trail.length > 20) particle.trail.shift();

      if (particle.trail.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
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
            firstPoint.x,
            firstPoint.y,
            particle.x,
            particle.y,
          );
          gradient.addColorStop(0, `hsla(${hue}, 90%, 60%, 0)`);
          gradient.addColorStop(
            1,
            `hsla(${hue}, 95%, 70%, ${0.4 + audioIntensity * 0.3})`,
          );

          ctx.strokeStyle = gradient;
          ctx.lineWidth = particle.size;
          ctx.lineCap = "round";
          ctx.stroke();
        }

        ctx.restore();
      }

      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const hue = (this.hueBase + particle.hue) % 360;
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.size * 3,
      );
      gradient.addColorStop(
        0,
        `hsla(${hue}, 100%, 80%, ${0.6 + audioIntensity * 0.4})`,
      );
      gradient.addColorStop(
        0.5,
        `hsla(${hue}, 95%, 70%, ${0.3 + audioIntensity * 0.2})`,
      );
      gradient.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        particle.x - particle.size * 3,
        particle.y - particle.size * 3,
        particle.size * 6,
        particle.size * 6,
      );

      ctx.restore();
    }
  }

  private renderMandala(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const layers = 3;
    const symmetry = 6;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(this.centerX, this.centerY);

    for (let layer = 0; layer < layers; layer++) {
      const radius = 50 + layer * 60 + bassIntensity * 40;
      const petals = 4;
      const rotation =
        this.time * 0.001 * (layer % 2 === 0 ? 1 : -1) + midIntensity * Math.PI;

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
          gradient.addColorStop(
            0,
            `hsla(${hue}, 90%, 70%, ${0.4 + audioIntensity * 0.3})`,
          );
          gradient.addColorStop(
            0.7,
            `hsla(${hue}, 85%, 65%, ${0.2 + audioIntensity * 0.15})`,
          );
          gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(
            x,
            y,
            petalRadius,
            petalRadius * 0.5,
            angle,
            0,
            Math.PI << 1,
          );
          ctx.fill();
        }

        ctx.restore();
      }

      if (layer % 2 === 0 && layer > 0) {
        const symbolRadius = 50 + layer * 60;
        const clanCount = 5;
        for (let c = 0; c < clanCount; c++) {
          const angle = (c / clanCount) * Math.PI * 2 + rotation * 0.5;
          const x = Math.cos(angle) * symbolRadius;
          const y = Math.sin(angle) * symbolRadius;
          const hue = (this.hueBase + c * 27.7) % 360;
          const alpha = 0.15 + audioIntensity * 0.15;

          this.drawClanSymbol(
            ctx,
            x,
            y,
            20 + bassIntensity * 10,
            c,
            alpha,
            hue,
          );
        }
      }
    }

    ctx.restore();
  }

  private renderDNA(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const helixCount = 2;
    const segments = 100;
    const amplitude = 150 + bassIntensity * 100;
    const wavelength = this.height / 3;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let h = 0; h < helixCount; h++) {
      const phase = h * Math.PI + this.time * 0.02;

      ctx.beginPath();

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = t * this.height;
        const angle = (y / wavelength) * Math.PI * 2 + phase;
        const x = this.centerX + Math.sin(angle) * amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

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

          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
          gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.7)`);
          gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
          ctx.fillStyle = gradient;
          ctx.fillRect(x - 8, y - 8, 16, 16);

          const gradient2 = ctx.createRadialGradient(x2, y, 0, x2, y, 8);
          gradient2.addColorStop(
            0,
            `hsla(${(hue + 180) % 360}, 90%, 70%, 0.7)`,
          );
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

  private renderGalaxy(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const arms = 4;
    const rotationSpeed = this.time * 0.001 + bassIntensity * 0.05;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(this.centerX, this.centerY);

    const coreGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      80 + bassIntensity * 60,
    );
    coreGradient.addColorStop(0, `hsla(${this.hueBase}, 100%, 90%, 0.8)`);
    coreGradient.addColorStop(0.3, `hsla(${this.hueBase}, 90%, 70%, 0.5)`);
    coreGradient.addColorStop(1, `hsla(${this.hueBase}, 80%, 50%, 0)`);
    ctx.fillStyle = coreGradient;
    ctx.fillRect(-100, -100, 200, 200);

    for (let arm = 0; arm < arms; arm++) {
      const armAngle = (arm / arms) * Math.PI * 2;

      for (let r = 20; r < Math.min(this.width, this.height) * 0.6; r += 5) {
        const spiralTightness = 0.3;
        const angle = armAngle + r * spiralTightness * 0.01 + rotationSpeed;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        if (Math.random() > 0.3) {
          const starSize = 1 + Math.random() * 3 + audioIntensity * 2;
          const hue = (this.hueBase + r / 2 + arm * 90) % 360;
          const alpha = 0.3 + Math.random() * 0.5 + midIntensity * 0.3;

          const starGradient = ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            starSize * 2,
          );
          starGradient.addColorStop(0, `hsla(${hue}, 100%, 90%, ${alpha})`);
          starGradient.addColorStop(
            0.5,
            `hsla(${hue}, 90%, 70%, ${alpha * 0.5})`,
          );
          starGradient.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);

          ctx.fillStyle = starGradient;
          ctx.fillRect(
            x - starSize * 2,
            y - starSize * 2,
            starSize * 4,
            starSize * 4,
          );
        }

        if (r % 80 === 0) {
          const clanIndex = ((r * 0.0125) | 0) % 13; // / 80 optimized
          const symbolAlpha = 0.12 + audioIntensity * 0.18;
          this.drawClanSymbol(
            ctx,
            x,
            y,
            30 + bassIntensity * 20,
            clanIndex,
            symbolAlpha,
            (this.hueBase + arm * 90) % 360,
          );
        }
      }
    }

    ctx.restore();
  }

  private renderMatrix(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;

    if (this.matrixColumns.length === 0) {
      this.initializeMatrixColumns();
    }

    ctx.save();
    ctx.font = "16px monospace";
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < this.matrixColumns.length; i++) {
      const col = this.matrixColumns[i];
      if (!col) continue;

      const x = (i / this.matrixColumns.length) * this.width;
      col.y += col.speed * (1 + bassIntensity * 2);

      if (col.y > this.height + 100) {
        col.y = -100;
      }

      for (let c = 0; c < col.chars.length; c++) {
        const char = col.chars[c];
        const y = col.y + c * 20;
        const alpha = 1 - (c / col.chars.length) * 0.8;
        const hue = (this.hueBase + 120) % 360;

        ctx.fillStyle = `hsla(${hue}, 90%, ${50 + c * 2}%, ${alpha * (0.5 + audioIntensity * 0.5)})`;
        ctx.fillText(char ?? "", x, y);

        if (c === 0) {
          ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${0.9 + trebleIntensity * 0.1})`;
          ctx.fillText(char ?? "", x, y);
        }
      }
    }

    ctx.restore();
  }

  private renderLightning(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;

    if (
      (bassIntensity > 0.6 && Math.random() > 0.85) ||
      this.lightningBolts.length < 2
    ) {
      const startX = Math.random() * this.width;
      const startY = 0;
      const targetY = this.height;

      const segments: { x: number; y: number }[] = [{ x: startX, y: startY }];
      let currentX = startX;
      let currentY = startY;

      while (currentY < targetY) {
        currentY += 20 + Math.random() * 40;
        currentX += (Math.random() - 0.5) * 60 * (1 + trebleIntensity);
        segments.push({ x: currentX, y: currentY });
      }

      this.lightningBolts.push({
        segments,
        life: 0,
        maxLife: 15 + Math.random() * 15,
      });
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.lightningBolts[i];
      if (!bolt) continue;

      bolt.life++;

      if (bolt.life > bolt.maxLife) {
        this.lightningBolts.splice(i, 1);
        continue;
      }

      const alpha = 1 - bolt.life / bolt.maxLife;
      const hue = (this.hueBase + 180) % 360;

      ctx.beginPath();
      for (let s = 0; s < bolt.segments.length; s++) {
        const seg = bolt.segments[s];
        if (!seg) continue;

        if (s === 0) {
          ctx.moveTo(seg.x, seg.y);
        } else {
          ctx.lineTo(seg.x, seg.y);
        }
      }

      ctx.strokeStyle = `hsla(${hue}, 100%, 90%, ${alpha * (0.8 + audioIntensity * 0.2)})`;
      ctx.lineWidth = 3 + audioIntensity * 4;
      ctx.stroke();

      ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${alpha * 0.4})`;
      ctx.lineWidth = 8 + audioIntensity * 10;
      ctx.stroke();

      if (bolt.life < 5) {
        for (let s = 1; s < bolt.segments.length - 1; s += 3) {
          const seg = bolt.segments[s];
          if (!seg || Math.random() > 0.5) continue;

          ctx.beginPath();
          ctx.moveTo(seg.x, seg.y);
          ctx.lineTo(
            seg.x + (Math.random() - 0.5) * 100,
            seg.y + 50 + Math.random() * 50,
          );
          ctx.strokeStyle = `hsla(${hue}, 90%, 80%, ${alpha * 0.5})`;
          ctx.lineWidth = 1 + audioIntensity * 2;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  private renderAurora(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const layers = 5;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // Pre-calculate base values to reduce per-layer calculations
    const shimmersPerLayer = Math.max(3, (audioIntensity * 8) | 0);
    const waveStep = 8; // Increased from 5 for better performance

    for (let layer = 0; layer < layers; layer++) {
      const phase = this.time * 0.002 + layer * 0.5;
      const yBase = this.height * 0.3 + layer * 30;
      const amplitude = 50 + bassIntensity * 80;
      const hue = (this.hueBase + layer * 60 + midIntensity * 120) % 360;

      // Draw main wave fill with optimized gradient
      ctx.beginPath();
      ctx.moveTo(0, this.height);

      // Optimized wave calculation with larger steps
      for (let x = 0; x <= this.width; x += waveStep) {
        const wave1 = Math.sin(x * 0.005 + phase) * amplitude;
        const wave2 = Math.sin(x * 0.003 - phase * 1.5) * amplitude * 0.5;
        const y = yBase + wave1 + wave2;
        ctx.lineTo(x, y);
      }

      // Ensure we reach the right edge
      if (this.width % waveStep !== 0) {
        const finalWave1 = Math.sin(this.width * 0.005 + phase) * amplitude;
        const finalWave2 =
          Math.sin(this.width * 0.003 - phase * 1.5) * amplitude * 0.5;
        ctx.lineTo(this.width, yBase + finalWave1 + finalWave2);
      }

      ctx.lineTo(this.width, this.height);
      ctx.closePath();

      // Enhanced gradient with more color stops for smoother transitions
      const gradient = ctx.createLinearGradient(
        0,
        yBase - amplitude,
        0,
        this.height,
      );

      // Main color
      const mainAlpha = 0.4 + audioIntensity * 0.3;
      gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, ${mainAlpha})`);

      // Secondary colors with better distribution
      gradient.addColorStop(0.2, `hsla(${hue}, 85%, 65%, ${mainAlpha * 0.8})`);
      gradient.addColorStop(
        0.4,
        `hsla(${(hue + 20) % 360}, 80%, 60%, ${mainAlpha * 0.6})`,
      );
      gradient.addColorStop(
        0.6,
        `hsla(${(hue + 40) % 360}, 75%, 55%, ${mainAlpha * 0.4})`,
      );
      gradient.addColorStop(
        0.8,
        `hsla(${(hue + 60) % 360}, 70%, 50%, ${mainAlpha * 0.15})`,
      );
      gradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 70%, 50%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();

      // Optimized shimmer particles - fewer but better placed
      if (audioIntensity > 0.1) {
        const shimmerSpacing = Math.max(
          40,
          (this.width / shimmersPerLayer) | 0,
        );

        for (let x = 0; x < this.width; x += shimmerSpacing) {
          const shimmerRng = Math.sin(x * 0.02 + phase * 3) * 0.5 + 0.5; // 0-1
          const wave = Math.sin(x * 0.01 + phase * 2) * amplitude;
          const y = yBase + wave;
          const size = 2 + shimmerRng * 4 + audioIntensity * 3;

          const shimmerGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          const shimmerAlpha = 0.5 + shimmerRng * 0.4;
          shimmerGradient.addColorStop(
            0,
            `hsla(${hue}, 100%, 90%, ${shimmerAlpha})`,
          );
          shimmerGradient.addColorStop(
            0.7,
            `hsla(${hue}, 90%, 80%, ${shimmerAlpha * 0.5})`,
          );
          shimmerGradient.addColorStop(1, `hsla(${hue}, 90%, 80%, 0)`);

          ctx.fillStyle = shimmerGradient;
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }

        // Draw clan symbols only when audio is prominent
        if (audioIntensity > 0.3) {
          const symbolSpacing =
            (this.width / Math.max(2, (audioIntensity * 4) | 0)) | 0;

          for (let x = 0; x < this.width; x += symbolSpacing) {
            const wave = Math.sin(x * 0.01 + phase * 2) * amplitude;
            const y = yBase + wave;
            const clanIndex = ((x / symbolSpacing + layer * 3) | 0) % 13;
            const symbolAlpha = 0.05 + audioIntensity * 0.12;

            this.drawClanSymbol(
              ctx,
              x,
              y,
              15 + bassIntensity * 8,
              clanIndex,
              symbolAlpha,
              hue,
            );
          }
        }
      }
    }

    ctx.restore();
  }

  private renderFireworks(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;

    if (bassIntensity > 0.5 && Math.random() > 0.9) {
      const hue = Math.random() * 360;
      const x = this.width * (0.3 + Math.random() * 0.4);
      const y = this.height * (0.3 + Math.random() * 0.3);
      const particleCount = 50 + ((bassIntensity * 100) | 0);

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 2 + Math.random() * 6 + trebleIntensity * 5;

        this.fireworks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          hue: hue + (Math.random() - 0.5) * 60,
          life: 0,
          maxLife: 60 + Math.random() * 60,
          size: 1 + Math.random() * 2,
        });
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      if (!fw) continue;

      fw.life++;
      fw.vy += 0.15;
      fw.vx *= 0.98;
      fw.vy *= 0.98;
      fw.x += fw.vx;
      fw.y += fw.vy;

      if (fw.life > fw.maxLife) {
        this.fireworks.splice(i, 1);
        continue;
      }

      const alpha = 1 - fw.life / fw.maxLife;
      const gradient = ctx.createRadialGradient(
        fw.x,
        fw.y,
        0,
        fw.x,
        fw.y,
        fw.size * 4,
      );
      gradient.addColorStop(0, `hsla(${fw.hue}, 100%, 80%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${fw.hue}, 90%, 70%, ${alpha * 0.5})`);
      gradient.addColorStop(1, `hsla(${fw.hue}, 80%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        fw.x - fw.size * 4,
        fw.y - fw.size * 4,
        fw.size * 8,
        fw.size * 8,
      );
    }

    ctx.restore();
  }

  private renderLissajous(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const curves = 2;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(this.centerX, this.centerY);

    for (let c = 0; c < curves; c++) {
      const a = 3 + c;
      const b = 4 + c;
      const delta = (this.time * 0.01 + c) * (1 + bassIntensity);
      const scale =
        Math.min(this.width, this.height) * 0.3 * (1 + audioIntensity * 0.3);

      ctx.beginPath();

      // Increased step size from 0.02 to 0.08 for better performance and less density
      for (let t = 0; t <= Math.PI * 2; t += 0.08) {
        const x = Math.sin(a * t + delta) * scale;
        const y = Math.sin(b * t) * scale;

        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      const hue = (this.hueBase + c * 72) % 360;
      const gradient = ctx.createLinearGradient(-scale, -scale, scale, scale);
      gradient.addColorStop(
        0,
        `hsla(${hue}, 90%, 70%, ${0.4 + audioIntensity * 0.3})`,
      );
      gradient.addColorStop(
        0.5,
        `hsla(${(hue + 60) % 360}, 85%, 65%, ${0.5 + midIntensity * 0.3})`,
      );
      gradient.addColorStop(
        1,
        `hsla(${(hue + 120) % 360}, 80%, 60%, ${0.4 + audioIntensity * 0.3})`,
      );

      ctx.strokeStyle = gradient;
      // Reduced line width from 2 + audioIntensity * 4 to 1.5 + audioIntensity * 2.5
      ctx.lineWidth = 1.5 + audioIntensity * 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderRings(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const ringCount = this.ringCount;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(this.centerX, this.centerY);

    const planetRadius = 60 + bassIntensity * 40;
    const planetGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      planetRadius,
    );
    planetGradient.addColorStop(0, `hsla(${this.hueBase}, 80%, 70%, 0.8)`);
    planetGradient.addColorStop(0.7, `hsla(${this.hueBase}, 70%, 60%, 0.5)`);
    planetGradient.addColorStop(1, `hsla(${this.hueBase}, 60%, 50%, 0.2)`);

    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(0, 0, planetRadius, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < ringCount; i++) {
      const radius = planetRadius + 30 + i * 15;
      const rotation =
        this.time * 0.001 * (1 + i * 0.1) + midIntensity * Math.PI;
      const thickness =
        3 + Math.sin(this.time * 0.01 + i) * 2 + audioIntensity * 5;
      const hue = (this.hueBase + i * 20) % 360;

      ctx.save();
      ctx.rotate(rotation);
      ctx.scale(1, 0.3);

      const ringGradient = ctx.createRadialGradient(
        0,
        0,
        radius - thickness,
        0,
        0,
        radius + thickness,
      );
      ringGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
      ringGradient.addColorStop(
        0.5,
        `hsla(${hue}, 90%, 70%, ${0.4 + audioIntensity * 0.3})`,
      );
      ringGradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

      ctx.strokeStyle = ringGradient;
      ctx.lineWidth = thickness * 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (i % 3 === 0) {
        const symbolCount = 6;
        for (let s = 0; s < symbolCount; s++) {
          const angle = (Math.PI * 2 * s) / symbolCount;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const clanIndex = (i + s) % 13;
          const symbolAlpha = 0.12 + audioIntensity * 0.15;
          this.drawClanSymbol(
            ctx,
            x,
            y,
            18 + bassIntensity * 10,
            clanIndex,
            symbolAlpha,
            hue,
          );
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private renderStarfield(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;

    if (this.stars.length === 0) {
      this.initializeStars();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const star of this.stars) {
      star.z -=
        (2 + bassIntensity * 15 + trebleIntensity * 10) * this.starSpeed;

      if (star.z <= 0) {
        star.z = 1000;
        star.x = (Math.random() - 0.5) * this.width * 2;
        star.y = (Math.random() - 0.5) * this.height * 2;
      }

      const x = (star.x / star.z) * 200 + this.centerX;
      const y = (star.y / star.z) * 200 + this.centerY;
      const size = (1 - star.z / 1000) * star.size * (2 + audioIntensity * 3);

      if (x < 0 || x > this.width || y < 0 || y > this.height) continue;

      const alpha = 1 - star.z / 1000;
      const hue = (this.hueBase + (1 - star.z / 1000) * 240) % 360;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 90%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 90%, 80%, ${alpha * 0.5})`);
      gradient.addColorStop(1, `hsla(${hue}, 80%, 70%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);

      if (bassIntensity > 0.3) {
        const prevZ = star.z + 5 + bassIntensity * 15;
        const prevX = (star.x / prevZ) * 200 + this.centerX;
        const prevY = (star.y / prevZ) * 200 + this.centerY;

        ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${alpha * 0.3})`;
        ctx.lineWidth = size * 0.5;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private renderFluid(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const gridSize = 30;
    const time = this.time * 0.02;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let y = 0; y < this.height; y += gridSize) {
      for (let x = 0; x < this.width; x += gridSize) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const flow1 = Math.sin(x * 0.01 + time) + Math.cos(y * 0.01 + time);
        const flow2 = Math.sin(dist * 0.02 - time) * bassIntensity * 2;
        const angle = Math.atan2(dy, dx) + flow1 + flow2;

        const length = 15 + audioIntensity * 20;
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        const hue = (this.hueBase + dist * 0.3 + flow1 * 60) % 360;
        const gradient = ctx.createLinearGradient(x, y, endX, endY);
        gradient.addColorStop(
          0,
          `hsla(${hue}, 90%, 70%, ${0.3 + audioIntensity * 0.4})`,
        );
        gradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 85%, 65%, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + midIntensity * 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private renderHexGrid(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const hexSize = 25 + bassIntensity * 15;
    const hexHeight = hexSize * Math.sqrt(3);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (let row = -1; row < this.height / hexHeight + 2; row++) {
      for (let col = -1; col < this.width / (hexSize * 1.5) + 2; col++) {
        const offsetX = (row % 2) * hexSize * 0.75;
        const x = col * hexSize * 1.5 + offsetX;
        const y = row * hexHeight;

        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const wave =
          Math.sin(dist * 0.02 - this.time * 0.05 + bassIntensity * Math.PI) *
            0.5 +
          0.5;
        const hue = (this.hueBase + dist * 0.3 + wave * 180) % 360;
        const lightness = 40 + wave * 40 + audioIntensity * 20;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + this.time * 0.001 * midIntensity;
          const hx = x + Math.cos(angle) * hexSize;
          const hy = y + Math.sin(angle) * hexSize;

          if (i === 0) {
            ctx.moveTo(hx, hy);
          } else {
            ctx.lineTo(hx, hy);
          }
        }
        ctx.closePath();

        ctx.strokeStyle = `hsla(${hue}, 80%, ${lightness}%, ${0.5 + audioIntensity * 0.4})`;
        ctx.lineWidth = 2 + audioIntensity * 2;
        ctx.stroke();

        if (wave > 0.7) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize);
          gradient.addColorStop(0, `hsla(${hue}, 90%, 80%, ${wave * 0.3})`);
          gradient.addColorStop(1, `hsla(${hue}, 80%, 70%, 0)`);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  private renderSpirograph(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const layers = 4;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(this.centerX, this.centerY);

    for (let layer = 0; layer < layers; layer++) {
      const R = 100 + layer * 40;
      const r = 30 + layer * 15 + bassIntensity * 30;
      const d = 20 + layer * 10 + midIntensity * 20;

      ctx.beginPath();

      for (let t = 0; t < Math.PI * 20; t += 0.05) {
        const rotation = this.time * 0.005 * (layer % 2 === 0 ? 1 : -1);
        const x =
          (R - r) * Math.cos(t + rotation) +
          d * Math.cos(((R - r) / r) * t + rotation);
        const y =
          (R - r) * Math.sin(t + rotation) -
          d * Math.sin(((R - r) / r) * t + rotation);

        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      const hue = (this.hueBase + layer * 90) % 360;
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.4 + audioIntensity * 0.4})`;
      ctx.lineWidth = 1.5 + audioIntensity * 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderConstellation(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;

    if (this.constellationStars.length === 0) {
      this.initializeConstellationStars();
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const star of this.constellationStars) {
      star.x += Math.sin(this.time * 0.01 + star.y) * 0.3 * bassIntensity;
      star.y += Math.cos(this.time * 0.01 + star.x) * 0.3 * midIntensity;

      if (star.x < 0) star.x = this.width;
      if (star.x > this.width) star.x = 0;
      if (star.y < 0) star.y = this.height;
      if (star.y > this.height) star.y = 0;
    }

    for (const star of this.constellationStars) {
      if (!star) continue;

      for (const connIdx of star.connections) {
        const other = this.constellationStars[connIdx];
        if (!other) continue;

        const dx = other.x - star.x;
        const dy = other.y - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const alpha =
          Math.max(0, 1 - dist / 200) * (0.3 + audioIntensity * 0.4);
        const hue = (this.hueBase + dist * 0.5) % 360;

        const gradient = ctx.createLinearGradient(
          star.x,
          star.y,
          other.x,
          other.y,
        );
        gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${hue}, 85%, 75%, ${alpha * 1.2})`);
        gradient.addColorStop(
          1,
          `hsla(${(hue + 60) % 360}, 80%, 70%, ${alpha})`,
        );

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + audioIntensity * 2;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }

    for (let i = 0; i < this.constellationStars.length; i++) {
      const star = this.constellationStars[i];
      if (!star) continue;

      const size = 3 + Math.random() * 4 + bassIntensity * 5;
      const hue = (this.hueBase + Math.random() * 60) % 360;

      const gradient = ctx.createRadialGradient(
        star.x,
        star.y,
        0,
        star.x,
        star.y,
        size * 2,
      );
      gradient.addColorStop(
        0,
        `hsla(${hue}, 100%, 90%, ${0.9 + audioIntensity * 0.1})`,
      );
      gradient.addColorStop(
        0.4,
        `hsla(${hue}, 95%, 80%, ${0.6 + audioIntensity * 0.2})`,
      );
      gradient.addColorStop(1, `hsla(${hue}, 90%, 70%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(star.x - size * 2, star.y - size * 2, size * 4, size * 4);

      if (Math.random() > 0.95) {
        ctx.fillStyle = `hsla(${hue}, 100%, 95%, ${0.8 + Math.random() * 0.2})`;
        ctx.fillRect(star.x - 1, star.y - 1, 2, 2);
      }

      if (i % 3 === 0) {
        const symbolAlpha = 0.2 + audioIntensity * 0.2;
        this.drawClanSymbol(
          ctx,
          star.x,
          star.y,
          25 + bassIntensity * 15,
          i,
          symbolAlpha,
          hue,
        );
      }
    }

    ctx.restore();
  }

  render(dataArray: Uint8Array, bufferLength: number): void {
    const ctx = this.ctx;

    // Optimized sum calculation (faster than reduce)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] ?? 0;
    }
    const avgFrequency = sum / bufferLength;
    const audioIntensity = Math.min(1, avgFrequency * 0.0078125); // 1/128 optimized
    const bassIntensity = this.getFrequencyBandIntensity(
      dataArray,
      bufferLength,
      0,
      0.15,
    );
    const midIntensity = this.getFrequencyBandIntensity(
      dataArray,
      bufferLength,
      0.15,
      0.5,
    );
    const trebleIntensity = this.getFrequencyBandIntensity(
      dataArray,
      bufferLength,
      0.5,
      1.0,
    );

    this.time += 1;
    this.hueBase = (this.hueBase + 0.3 + bassIntensity * 1.5) % 360;

    this.updatePatternTransition(audioIntensity);

    const trailPatterns = ["swarm", "fireworks", "starfield", "constellation"];
    const fadeAmount = trailPatterns.includes(this.currentPattern)
      ? 0.12
      : 0.06;
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAmount + audioIntensity * 0.04})`;
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.isTransitioning) {
      const t = this.transitionProgress;

      // Default cubic easing for pattern transitions
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      ctx.save();
      ctx.globalAlpha = 1 - eased;
      this.renderPattern(
        this.currentPattern,
        audioIntensity,
        bassIntensity,
        midIntensity,
        trebleIntensity,
      );
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = eased;
      this.renderPattern(
        this.nextPattern,
        audioIntensity,
        bassIntensity,
        midIntensity,
        trebleIntensity,
      );
      ctx.restore();
    } else {
      this.renderPattern(
        this.currentPattern,
        audioIntensity,
        bassIntensity,
        midIntensity,
        trebleIntensity,
      );
    }
  }

  private renderPattern(
    pattern: Pattern,
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number,
  ): void {
    switch (pattern) {
      case "fractal":
        this.renderFractal(audioIntensity, bassIntensity, midIntensity);
        break;
      case "rays":
        this.renderRays(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "tunnel":
        this.renderTunnel(audioIntensity, bassIntensity, midIntensity);
        break;
      case "bubbles":
        this.renderBubbles(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "waves":
        this.renderWaves(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "swarm":
        this.renderSwarm(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "mandala":
        this.renderMandala(audioIntensity, bassIntensity, midIntensity);
        break;
      case "dna":
        this.renderDNA(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "galaxy":
        this.renderGalaxy(audioIntensity, bassIntensity, midIntensity);
        break;
      case "matrix":
        this.renderMatrix(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "lightning":
        this.renderLightning(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "aurora":
        this.renderAurora(audioIntensity, bassIntensity, midIntensity);
        break;
      case "fireworks":
        this.renderFireworks(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "lissajous":
        this.renderLissajous(audioIntensity, bassIntensity, midIntensity);
        break;
      case "rings":
        this.renderRings(audioIntensity, bassIntensity, midIntensity);
        break;
      case "starfield":
        this.renderStarfield(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "fluid":
        this.renderFluid(audioIntensity, bassIntensity, midIntensity);
        break;
      case "hexgrid":
        this.renderHexGrid(audioIntensity, bassIntensity, midIntensity);
        break;
      case "spirograph":
        this.renderSpirograph(audioIntensity, bassIntensity, midIntensity);
        break;
      case "constellation":
        this.renderConstellation(audioIntensity, bassIntensity, midIntensity);
        break;
      case "pentagram":
        this.renderPentagram(audioIntensity, bassIntensity, midIntensity);
        break;
      case "runes":
        this.renderRunes(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "sigils":
        this.renderSigils(audioIntensity, bassIntensity, midIntensity);
        break;
      case "ouroboros":
        this.renderOuroboros(audioIntensity, bassIntensity, midIntensity);
        break;
      case "chakras":
        this.renderChakras(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "alchemy":
        this.renderAlchemy(audioIntensity, bassIntensity, midIntensity);
        break;
      case "celestial":
        this.renderCelestial(audioIntensity, bassIntensity, midIntensity);
        break;
      case "portal":
        this.renderPortal(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "dreamcatcher":
        this.renderDreamcatcher(audioIntensity, bassIntensity, midIntensity);
        break;
      case "phoenix":
        this.renderPhoenix(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "serpent":
        this.renderSerpent(audioIntensity, bassIntensity, midIntensity);
        break;
      case "crystalGrid":
        this.renderCrystalGrid(audioIntensity, bassIntensity, midIntensity);
        break;
      case "moonPhases":
        this.renderMoonPhases(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "astrolabe":
        this.renderAstrolabe(audioIntensity, bassIntensity, midIntensity);
        break;
      case "tarot":
        this.renderTarot(audioIntensity, bassIntensity, midIntensity);
        break;
      case "kabbalah":
        this.renderKabbalah(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "merkaba":
        this.renderMerkaba(audioIntensity, bassIntensity, midIntensity);
        break;
      case "flowerOfLife":
        this.renderFlowerOfLife(audioIntensity, bassIntensity, midIntensity);
        break;
      case "sriYantra":
        this.renderSriYantra(audioIntensity, bassIntensity, midIntensity);
        break;
      case "metatron":
        this.renderMetatron(audioIntensity, bassIntensity, midIntensity);
        break;
      case "vesicaPiscis":
        this.renderVesicaPiscis(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "torusField":
        this.renderTorusField(audioIntensity, bassIntensity, midIntensity);
        break;
      case "cosmicEgg":
        this.renderCosmicEgg(audioIntensity, bassIntensity, midIntensity);
        break;
      case "enochian":
        this.renderEnochian(audioIntensity, bassIntensity, midIntensity);
        break;
      case "labyrinth":
        this.renderLabyrinth(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "cosmicWeb":
        this.renderCosmicWeb(audioIntensity, bassIntensity, midIntensity);
        break;
      case "vortexSpiral":
        this.renderVortexSpiral(audioIntensity, bassIntensity, midIntensity);
        break;
      case "sacredSpiral":
        this.renderSacredSpiral(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "elementalCross":
        this.renderElementalCross(audioIntensity, bassIntensity, midIntensity);
        break;
      case "dragonEye":
        this.renderDragonEye(audioIntensity, bassIntensity, midIntensity);
        break;
      case "ancientGlyphs":
        this.renderAncientGlyphs(
          audioIntensity,
          bassIntensity,
          trebleIntensity,
        );
        break;
      case "timeWheel":
        this.renderTimeWheel(audioIntensity, bassIntensity, midIntensity);
        break;
      case "astralProjection":
        this.renderAstralProjection(
          audioIntensity,
          bassIntensity,
          trebleIntensity,
        );
        break;
      case "ethericField":
        this.renderEthericField(audioIntensity, bassIntensity, midIntensity);
        break;
      case "platonic":
        this.renderPlatonic(audioIntensity, bassIntensity, midIntensity);
        break;
      case "infinityKnot":
        this.renderInfinityKnot(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "cosmicLotus":
        this.renderCosmicLotus(audioIntensity, bassIntensity, midIntensity);
        break;
      case "voidMandala":
        this.renderVoidMandala(audioIntensity, bassIntensity, midIntensity);
        break;
      case "stellarMap":
        this.renderStellarMap(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "wyrdWeb":
        this.renderWyrdWeb(audioIntensity, bassIntensity, midIntensity);
        break;
      case "spiritualGateway":
        this.renderSpiritualGateway(
          audioIntensity,
          bassIntensity,
          midIntensity,
        );
        break;
      case "akashicRecords":
        this.renderAkashicRecords(
          audioIntensity,
          bassIntensity,
          trebleIntensity,
        );
        break;
      case "sacredGeometry":
        this.renderSacredGeometry(audioIntensity, bassIntensity, midIntensity);
        break;
      case "shadowRealm":
        this.renderShadowRealm(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "quantumEntanglement":
        this.renderQuantumEntanglement(
          audioIntensity,
          bassIntensity,
          midIntensity,
        );
        break;
      case "necromanticSigil":
        this.renderNecromanticSigil(audioIntensity, bassIntensity, midIntensity);
        break;
      case "dimensionalRift":
        this.renderDimensionalRift(
          audioIntensity,
          bassIntensity,
          trebleIntensity,
        );
        break;
      case "chaosVortex":
        this.renderChaosVortex(audioIntensity, bassIntensity, midIntensity);
        break;
      case "etherealMist":
        this.renderEtherealMist(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "bloodMoon":
        this.renderBloodMoon(audioIntensity, bassIntensity, midIntensity);
        break;
      case "darkMatter":
        this.renderDarkMatter(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "soulFragment":
        this.renderSoulFragment(audioIntensity, bassIntensity, midIntensity);
        break;
      case "forbiddenRitual":
        this.renderForbiddenRitual(
          audioIntensity,
          bassIntensity,
          trebleIntensity,
        );
        break;
      case "twilightZone":
        this.renderTwilightZone(audioIntensity, bassIntensity, midIntensity);
        break;
      case "spectralEcho":
        this.renderSpectralEcho(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "voidWhisper":
        this.renderVoidWhisper(audioIntensity, bassIntensity, midIntensity);
        break;
      case "demonicGate":
        this.renderDemonicGate(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "cursedRunes":
        this.renderCursedRunes(audioIntensity, bassIntensity, midIntensity);
        break;
      case "shadowDance":
        this.renderShadowDance(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "nightmareFuel":
        this.renderNightmareFuel(audioIntensity, bassIntensity, midIntensity);
        break;
      case "abyssalDepth":
        this.renderAbyssalDepth(audioIntensity, bassIntensity, trebleIntensity);
        break;
      case "phantomPulse":
        this.renderPhantomPulse(audioIntensity, bassIntensity, midIntensity);
        break;
      case "infernalFlame":
        this.renderInfernalFlame(audioIntensity, bassIntensity, trebleIntensity);
        break;
    }
  }

  private drawClanSymbol(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    clanIndex: number,
    alpha: number,
    hue: number,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
    ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha * 0.3})`;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const clan = clanIndex % 13;

    switch (clan) {
      case 0:
        ctx.beginPath();
        ctx.arc(-size * 0.3, 0, size * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(size * 0.3, 0, size * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.4);
        ctx.lineTo(0, size * 0.4);
        ctx.stroke();
        break;

      case 1:
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo((i - 1) * size * 0.3, -size * 0.5);
          ctx.lineTo((i - 1) * size * 0.3 + size * 0.1, size * 0.5);
          ctx.stroke();
        }
        break;

      case 2:
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, -size * 0.4);
        ctx.lineTo(size * 0.4, -size * 0.4);
        ctx.lineTo(size * 0.4, size * 0.4);
        ctx.lineTo(-size * 0.4, size * 0.4);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, -size * 0.4);
        ctx.lineTo(size * 0.4, size * 0.4);
        ctx.moveTo(size * 0.4, -size * 0.4);
        ctx.lineTo(-size * 0.4, size * 0.4);
        ctx.stroke();
        break;

      case 3:
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * size * 0.15, -size * 0.4);
          ctx.lineTo(i * size * 0.15, size * 0.4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-size * 0.4, i * size * 0.15);
          ctx.lineTo(size * 0.4, i * size * 0.15);
          ctx.stroke();
        }
        break;

      case 4:
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const r = size * 0.3;
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 5:
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);
        ctx.lineTo(-size * 0.4, size * 0.3);
        ctx.lineTo(size * 0.4, size * 0.3);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 6:
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, size * 0.2);
        ctx.lineTo(-size * 0.2, -size * 0.3);
        ctx.lineTo(0, size * 0.1);
        ctx.lineTo(size * 0.2, -size * 0.3);
        ctx.lineTo(size * 0.4, size * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, size * 0.2);
        ctx.lineTo(size * 0.4, size * 0.2);
        ctx.stroke();
        break;

      case 7:
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(
            Math.cos(angle) * size * 0.25,
            Math.sin(angle) * size * 0.25,
          );
          ctx.lineTo(
            Math.cos(angle) * size * 0.4,
            Math.sin(angle) * size * 0.4,
          );
          ctx.stroke();
        }
        break;

      case 8:
        ctx.beginPath();
        for (let i = 0; i <= 50; i++) {
          const angle = (i / 50) * Math.PI * 4;
          const r = (i / 50) * size * 0.4;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;

      case 9:
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, -Math.PI * 0.7, -Math.PI * 0.3, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);
        ctx.lineTo(0, size * 0.2);
        ctx.stroke();
        break;

      case 10:
        ctx.beginPath();
        for (let i = 0; i <= 30; i++) {
          const t = i / 30;
          const x = (t - 0.5) * size * 0.8;
          const y = Math.sin(t * Math.PI * 3) * size * 0.3;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          size * 0.35,
          Math.sin(Math.PI * 3) * size * 0.3,
          size * 0.08,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        break;

      case 11:
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-size * 0.1, -size * 0.1, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size * 0.1, -size * 0.1, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, size * 0.15, size * 0.15, 0, Math.PI, false);
        ctx.stroke();
        break;

      case 12:
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(
            Math.cos(angle) * size * 0.4,
            Math.sin(angle) * size * 0.4,
          );
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  private getFrequencyBandIntensity(
    dataArray: Uint8Array,
    bufferLength: number,
    startRatio: number,
    endRatio: number,
  ): number {
    const startIndex = (bufferLength * startRatio) | 0; // Math.floor optimized
    const endIndex = (bufferLength * endRatio) | 0; // Math.floor optimized
    const range = endIndex - startIndex;
    if (range <= 0) return 0;
    let sum = 0;
    for (let i = startIndex; i < endIndex; i++) {
      sum += dataArray[i] ?? 0;
    }
    return Math.min(1, (sum * 0.0078125) / range); // 1/128 optimized
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 0.16666666666666666) return p + (q - p) * 6 * t; // 1/6
        if (t < 0.5) return q;
        if (t < 0.6666666666666666)
          return p + (q - p) * (0.6666666666666666 - t) * 6; // 2/3
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = l + l - q; // 2 * l optimized
      r = hue2rgb(p, q, h + 0.3333333333333333); // 1/3
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 0.3333333333333333); // 1/3
    }

    // Use bitwise operations for faster rounding and clamping
    const r255 = (r * 255 + 0.5) | 0;
    const g255 = (g * 255 + 0.5) | 0;
    const b255 = (b * 255 + 0.5) | 0;
    return [
      r255 < 0 ? 0 : r255 > 255 ? 255 : r255,
      g255 < 0 ? 0 : g255 > 255 ? 255 : g255,
      b255 < 0 ? 0 : b255 > 255 ? 255 : b255,
    ];
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.centerX = width * 0.5; // / 2 optimized
    this.centerY = height * 0.5; // / 2 optimized
    this.canvas.width = width;
    this.canvas.height = height;

    this.initializeParticles();
    this.initializeBubbles();
    this.initializeStars();
    this.initializeMatrixColumns();
    this.initializeConstellationStars();
  }

  // ============================================
  // MYSTICAL PATTERN RENDERERS
  // ============================================

  private renderPentagram(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const points = 5;
    const outerRadius = 200 + bassIntensity * 150;
    const innerRadius = outerRadius * 0.382; // Golden ratio

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.time * 0.002 + midIntensity * 0.1);

    for (let layer = 0; layer < 3; layer++) {
      const scale = 1 - layer * 0.3;
      const hue = (this.hueBase + layer * 40 + this.time * 0.3) % 360;

      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.8 - layer * 0.2})`;
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${0.1 + audioIntensity * 0.2})`;
      ctx.lineWidth = 3 - layer;

      ctx.beginPath();
      for (let i = 0; i <= points * 2; i++) {
        const angle = (Math.PI * 2 * i) / points - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius * scale : innerRadius * scale;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }

    // Add pulsing center circle
    const centerSize = 20 + audioIntensity * 30;
    ctx.fillStyle = `hsla(${this.hueBase}, 90%, 70%, 0.8)`;
    ctx.beginPath();
    ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderRunes(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const runeCount = 8;
    const radius = 250 + bassIntensity * 100;

    for (let i = 0; i < runeCount; i++) {
      const angle = (Math.PI * 2 * i) / runeCount + this.time * 0.001;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      const size = 40 + trebleIntensity * 30;
      const hue = (this.hueBase + i * 45) % 360;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2 + Math.sin(this.time * 0.003 + i) * 0.3);

      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.7 + audioIntensity * 0.3})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      // Draw abstract rune shapes
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.moveTo(-size * 0.6, -size * 0.5);
      ctx.lineTo(size * 0.6, -size * 0.5);
      ctx.moveTo(-size * 0.4, size * 0.3);
      ctx.lineTo(size * 0.4, 0);
      ctx.stroke();

      ctx.restore();
    }

    // Add rotating circle of smaller runes
    for (let i = 0; i < runeCount * 2; i++) {
      const angle = (Math.PI * 2 * i) / (runeCount * 2) - this.time * 0.002;
      const x = this.centerX + Math.cos(angle) * (radius * 0.5);
      const y = this.centerY + Math.sin(angle) * (radius * 0.5);
      const size = 15 + audioIntensity * 10;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 0.5 + audioIntensity * 0.3;
      ctx.fillStyle = `hsl(${(this.hueBase + i * 20) % 360}, 70%, 60%)`;
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  private renderSigils(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const sigilCount = 12;

    for (let i = 0; i < sigilCount; i++) {
      const angle = (Math.PI * 2 * i) / sigilCount + this.time * 0.001;
      const radius =
        200 + Math.sin(this.time * 0.002 + i) * 50 + bassIntensity * 80;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      const size = 30 + midIntensity * 25;
      const hue = (this.hueBase + i * 30 + this.time * 0.2) % 360;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.time * 0.003 + i);

      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.6 + audioIntensity * 0.4})`;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      // Complex sigil pattern
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      ctx.moveTo(-size * 0.7, -size * 0.7);
      ctx.lineTo(size * 0.7, size * 0.7);
      ctx.moveTo(size * 0.7, -size * 0.7);
      ctx.lineTo(-size * 0.7, size * 0.7);
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderOuroboros(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const radius = 250 + bassIntensity * 100;
    const segments = 60;
    const thickness = 15 + audioIntensity * 10;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Draw serpent body
    for (let i = 0; i < segments; i++) {
      const progress = i / segments;
      const angle = progress * Math.PI * 2 + this.time * 0.002;
      const wave = Math.sin(progress * Math.PI * 8 + this.time * 0.005) * 20;
      const r = radius + wave + Math.sin(progress * Math.PI * 4) * 30;

      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      const hue = (this.hueBase + progress * 120 + this.time * 0.3) % 360;
      const alpha = 0.7 + Math.sin(progress * Math.PI * 2) * 0.3;

      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, thickness * (1 + midIntensity * 0.5), 0, Math.PI * 2);
      ctx.fill();

      // Add scales
      if (i % 8 === 0) {
        const scaleSize = thickness * 0.5;
        ctx.fillStyle = `hsla(${hue + 30}, 85%, 70%, 0.5)`;
        ctx.fillRect(
          x - scaleSize / 2,
          y - scaleSize / 2,
          scaleSize,
          scaleSize,
        );
      }
    }

    // Draw head
    const headAngle = this.time * 0.002;
    const headX = Math.cos(headAngle) * radius;
    const headY = Math.sin(headAngle) * radius;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headAngle + Math.PI / 2);

    ctx.fillStyle = `hsla(${this.hueBase}, 85%, 65%, 0.9)`;
    ctx.beginPath();
    ctx.arc(0, 0, thickness * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = `hsla(${this.hueBase + 180}, 90%, 70%, 0.9)`;
    ctx.fillRect(
      -thickness * 0.5,
      -thickness * 0.3,
      thickness * 0.3,
      thickness * 0.3,
    );
    ctx.fillRect(
      thickness * 0.2,
      -thickness * 0.3,
      thickness * 0.3,
      thickness * 0.3,
    );

    ctx.restore();
    ctx.restore();
  }

  private renderChakras(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const chakraColors = [
      { h: 0, name: "Root" }, // Red
      { h: 30, name: "Sacral" }, // Orange
      { h: 60, name: "Solar" }, // Yellow
      { h: 120, name: "Heart" }, // Green
      { h: 200, name: "Throat" }, // Blue
      { h: 270, name: "Third Eye" }, // Indigo
      { h: 300, name: "Crown" }, // Violet
    ];

    const spacing = this.height / (chakraColors.length + 1);

    chakraColors.forEach((chakra, i) => {
      const y = spacing * (i + 1);
      const size =
        40 + audioIntensity * 30 + (i === 3 ? bassIntensity * 20 : 0);
      const pulse = Math.sin(this.time * 0.005 + i * 0.5) * 10;

      // Outer glow
      const gradient = ctx.createRadialGradient(
        this.centerX,
        y,
        size * 0.5,
        this.centerX,
        y,
        size + pulse + 40,
      );
      gradient.addColorStop(
        0,
        `hsla(${chakra.h}, 90%, 70%, ${0.6 + trebleIntensity * 0.4})`,
      );
      gradient.addColorStop(1, `hsla(${chakra.h}, 90%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        this.centerX - size - 50,
        y - size - 50,
        (size + 50) * 2,
        (size + 50) * 2,
      );

      // Main chakra circle
      ctx.fillStyle = `hsla(${chakra.h}, 85%, 65%, 0.8)`;
      ctx.strokeStyle = `hsla(${chakra.h + 30}, 90%, 70%, 0.9)`;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(this.centerX, y, size + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Petals
      const petalCount = Math.min(i + 3, 8);
      for (let j = 0; j < petalCount; j++) {
        const angle = (Math.PI * 2 * j) / petalCount + this.time * 0.002;
        const petalX = this.centerX + Math.cos(angle) * (size + 15);
        const petalY = y + Math.sin(angle) * (size + 15);

        ctx.save();
        ctx.translate(petalX, petalY);
        ctx.rotate(angle);

        ctx.fillStyle = `hsla(${chakra.h + 20}, 80%, 60%, 0.6)`;
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    // Connection line
    ctx.strokeStyle = `hsla(${this.hueBase}, 70%, 60%, ${0.3 + audioIntensity * 0.2})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(this.centerX, spacing);
    ctx.lineTo(this.centerX, this.height - spacing);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private renderAlchemy(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const symbols = [
      { name: "Fire", rotation: 0 },
      { name: "Water", rotation: Math.PI },
      { name: "Air", rotation: Math.PI * 0.5 },
      { name: "Earth", rotation: Math.PI * 1.5 },
    ];

    const radius = 180 + bassIntensity * 80;

    symbols.forEach((symbol, i) => {
      const angle = symbol.rotation + this.time * 0.001;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      const size = 50 + midIntensity * 30;
      const hue = (this.hueBase + i * 90) % 360;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.time * 0.003 + i);

      // Triangle for elements
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.7 + audioIntensity * 0.3})`;
      ctx.fillStyle = `hsla(${hue}, 75%, 55%, ${0.2 + audioIntensity * 0.2})`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size * 0.866, size * 0.5);
      ctx.lineTo(size * 0.866, size * 0.5);
      ctx.closePath();

      if (i === 1 || i === 3) {
        // Inverted triangle for Water and Earth
        ctx.save();
        ctx.rotate(Math.PI);
        ctx.stroke();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.stroke();
        ctx.fill();
      }

      // Add horizontal line for Air and Earth
      if (i === 2 || i === 3) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.6, 0);
        ctx.lineTo(size * 0.6, 0);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Central transmutation circle
    ctx.strokeStyle = `hsla(${this.hueBase}, 80%, 60%, 0.6)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      this.centerX,
      this.centerY,
      60 + audioIntensity * 40,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    // Philosophical Mercury symbol
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.strokeStyle = `hsla(${this.hueBase + 60}, 85%, 65%, 0.8)`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.moveTo(0, 30);
    ctx.lineTo(0, 50);
    ctx.moveTo(-20, 50);
    ctx.lineTo(20, 50);
    ctx.moveTo(-15, -30);
    ctx.lineTo(15, -30);
    ctx.stroke();
    ctx.restore();
  }

  private renderCelestial(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const orbits = 6;

    for (let orbit = 0; orbit < orbits; orbit++) {
      const radius = 80 + orbit * 60;
      const planetCount = orbit + 3;
      const speed = 0.001 / (orbit + 1);

      // Draw orbit
      ctx.strokeStyle = `hsla(${this.hueBase + orbit * 20}, 60%, 50%, ${0.2 + audioIntensity * 0.1})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw planets
      for (let i = 0; i < planetCount; i++) {
        const angle = (Math.PI * 2 * i) / planetCount + this.time * speed;
        const x = this.centerX + Math.cos(angle) * radius;
        const y = this.centerY + Math.sin(angle) * radius;
        const size = 8 + bassIntensity * 8 + orbit * 2;
        const hue = (this.hueBase + orbit * 40 + i * 20) % 360;

        // Planet glow
        const gradient = ctx.createRadialGradient(
          x,
          y,
          size * 0.3,
          x,
          y,
          size * 3,
        );
        gradient.addColorStop(
          0,
          `hsla(${hue}, 90%, 70%, ${0.6 + midIntensity * 0.4})`,
        );
        gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size * 3, y - size * 3, size * 6, size * 6);

        // Planet body
        ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.9)`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Rings for some planets
        if (orbit % 2 === 0) {
          ctx.strokeStyle = `hsla(${hue + 30}, 70%, 60%, 0.5)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, y, size * 1.5, size * 0.5, angle, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Central sun
    const sunSize = 40 + audioIntensity * 30;
    const gradient = ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      sunSize * 0.5,
      this.centerX,
      this.centerY,
      sunSize * 2,
    );
    gradient.addColorStop(0, `hsla(${this.hueBase + 60}, 100%, 80%, 1)`);
    gradient.addColorStop(0.5, `hsla(${this.hueBase + 40}, 90%, 70%, 0.6)`);
    gradient.addColorStop(1, `hsla(${this.hueBase + 20}, 80%, 60%, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.centerX - sunSize * 2,
      this.centerY - sunSize * 2,
      sunSize * 4,
      sunSize * 4,
    );

    // Sun rays
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + this.time * 0.002;
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(angle);

      ctx.strokeStyle = `hsla(${this.hueBase + 50}, 95%, 75%, ${0.5 + bassIntensity * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sunSize, 0);
      ctx.lineTo(sunSize + 30 + bassIntensity * 20, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderPortal(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const rings = 20;

    for (let i = 0; i < rings; i++) {
      const progress = i / rings;
      const radius = 50 + i * (15 + bassIntensity * 10);
      const rotation =
        this.time * 0.002 * (i % 2 === 0 ? 1 : -1) + progress * Math.PI;
      const hue = (this.hueBase + progress * 240 + this.time * 0.5) % 360;
      const alpha = 0.3 + (1 - progress) * 0.5 + audioIntensity * 0.2;

      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(rotation);

      // Create spiral effect
      const segments = 60;
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${alpha})`;
      ctx.lineWidth = 4 + trebleIntensity * 3;
      ctx.lineCap = "round";

      ctx.beginPath();
      for (let j = 0; j <= segments; j++) {
        const segmentProgress = j / segments;
        const angle = segmentProgress * Math.PI * 2;
        const r =
          radius *
          (1 +
            Math.sin(segmentProgress * Math.PI * 6 + this.time * 0.01) * 0.1);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Add energy particles
      if (i % 3 === 0) {
        for (let j = 0; j < 8; j++) {
          const angle = (Math.PI * 2 * j) / 8 + this.time * 0.005;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const particleSize = 3 + audioIntensity * 5;

          ctx.fillStyle = `hsla(${hue + 60}, 90%, 70%, 0.8)`;
          ctx.beginPath();
          ctx.arc(x, y, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // Central void
    const voidSize = 30 + bassIntensity * 20;
    const voidGradient = ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      0,
      this.centerX,
      this.centerY,
      voidSize,
    );
    voidGradient.addColorStop(0, `rgba(0, 0, 0, 1)`);
    voidGradient.addColorStop(0.7, `rgba(0, 0, 10, 0.9)`);
    voidGradient.addColorStop(1, `hsla(${this.hueBase}, 50%, 30%, 0.5)`);

    ctx.fillStyle = voidGradient;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, voidSize, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderDreamcatcher(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const outerRadius = 200 + bassIntensity * 80;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Outer ring
    ctx.strokeStyle = `hsla(${this.hueBase}, 70%, 60%, 0.8)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Web structure
    const webLayers = 7;
    for (let layer = 1; layer <= webLayers; layer++) {
      const layerRadius = outerRadius * (layer / webLayers);
      const points = 8 + layer * 2;

      ctx.strokeStyle = `hsla(${this.hueBase + layer * 15}, 75%, 60%, ${0.4 + audioIntensity * 0.3})`;
      ctx.lineWidth = 2;

      for (let i = 0; i < points; i++) {
        const angle1 = (Math.PI * 2 * i) / points + this.time * 0.001;
        const angle2 = (Math.PI * 2 * (i + 1)) / points + this.time * 0.001;

        const x1 = Math.cos(angle1) * layerRadius;
        const y1 = Math.sin(angle1) * layerRadius;
        const x2 = Math.cos(angle2) * layerRadius;
        const y2 = Math.sin(angle2) * layerRadius;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Draw radial lines
        if (layer === 1) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }

        // Add beads
        const beadSize = 3 + midIntensity * 4;
        ctx.fillStyle = `hsla(${(this.hueBase + i * 20) % 360}, 80%, 65%, 0.8)`;
        ctx.beginPath();
        ctx.arc(x1, y1, beadSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Hanging feathers
    for (let i = 0; i < 3; i++) {
      const angle = Math.PI + (i - 1) * 0.4;
      const startX = Math.cos(angle) * outerRadius;
      const startY = Math.sin(angle) * outerRadius;
      const featherLength = 80 + bassIntensity * 40;
      const sway = Math.sin(this.time * 0.003 + i) * 15;

      const endX = startX + sway;
      const endY = startY + featherLength;

      // Feather string
      ctx.strokeStyle = `hsla(${this.hueBase}, 60%, 50%, 0.6)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Feather
      ctx.save();
      ctx.translate(endX, endY);
      ctx.rotate(sway * 0.02);

      const hue = (this.hueBase + i * 60) % 360;
      ctx.fillStyle = `hsla(${hue}, 75%, 60%, 0.6)`;
      ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.8)`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 10);
      ctx.lineTo(0, 40);
      ctx.lineTo(15, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  private renderPhoenix(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const wingSpan = 300 + bassIntensity * 100;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Wings
    for (let side = -1; side <= 1; side += 2) {
      const wingAngle = Math.sin(this.time * 0.005) * 0.3 * side;

      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(wingAngle);

      // Wing feathers
      const featherCount = 8;
      for (let i = 0; i < featherCount; i++) {
        const featherProgress = i / featherCount;
        const featherAngle = -Math.PI * 0.4 + featherProgress * Math.PI * 0.8;
        const featherLength = wingSpan * (0.5 + featherProgress * 0.5);
        const hue = ((this.hueBase + i * 15 + this.time * 0.5) % 60) + 0; // Red-orange-yellow

        ctx.save();
        ctx.rotate(featherAngle);

        const gradient = ctx.createLinearGradient(0, 0, featherLength, 0);
        gradient.addColorStop(
          0,
          `hsla(${hue}, 90%, 60%, ${0.8 + audioIntensity * 0.2})`,
        );
        gradient.addColorStop(0.5, `hsla(${hue + 20}, 95%, 65%, 0.6)`);
        gradient.addColorStop(1, `hsla(${hue + 40}, 100%, 70%, 0.2)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 15 - i * 1.5 + trebleIntensity * 5;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(featherLength, 0);
        ctx.stroke();

        // Flame particles
        if (i % 2 === 0) {
          for (let j = 0; j < 5; j++) {
            const particleX = featherLength * (0.5 + j * 0.1);
            const particleY = (Math.random() - 0.5) * 20;
            const particleSize = 2 + Math.random() * 4 + audioIntensity * 3;

            ctx.fillStyle = `hsla(${hue + 30}, 100%, 70%, ${0.6 + Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      ctx.restore();
    }

    // Body
    const bodyGradient = ctx.createRadialGradient(0, 0, 20, 0, 0, 60);
    bodyGradient.addColorStop(0, `hsla(${this.hueBase + 30}, 95%, 70%, 1)`);
    bodyGradient.addColorStop(0.6, `hsla(${this.hueBase + 10}, 90%, 60%, 0.8)`);
    bodyGradient.addColorStop(1, `hsla(${this.hueBase}, 85%, 50%, 0.4)`);

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 40 + bassIntensity * 20, 0, Math.PI * 2);
    ctx.fill();

    // Tail flames
    const tailCount = 12;
    for (let i = 0; i < tailCount; i++) {
      const tailAngle =
        Math.PI / 2 +
        (i - tailCount / 2) * 0.1 +
        Math.sin(this.time * 0.01 + i) * 0.2;
      const tailLength = 100 + i * 15 + bassIntensity * 50;
      const hue = (this.hueBase + i * 5) % 60;

      ctx.save();
      ctx.rotate(tailAngle);

      const tailGradient = ctx.createLinearGradient(0, 0, 0, tailLength);
      tailGradient.addColorStop(0, `hsla(${hue + 20}, 95%, 65%, 0.8)`);
      tailGradient.addColorStop(1, `hsla(${hue + 40}, 100%, 70%, 0)`);

      ctx.strokeStyle = tailGradient;
      ctx.lineWidth = 10 - i * 0.5;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, tailLength);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }

  private renderSerpent(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const segments = 40;
    const amplitude = 100 + bassIntensity * 60;

    for (let i = 0; i < segments; i++) {
      const progress = i / segments;
      const phase = this.time * 0.01 - progress * Math.PI * 2;

      const x = this.centerX + Math.cos(phase) * (200 + progress * 100);
      const y = this.centerY + Math.sin(phase * 1.5) * amplitude;

      const nextProgress = (i + 1) / segments;
      const nextPhase = this.time * 0.01 - nextProgress * Math.PI * 2;
      const nextX =
        this.centerX + Math.cos(nextPhase) * (200 + nextProgress * 100);
      const nextY = this.centerY + Math.sin(nextPhase * 1.5) * amplitude;

      const size = 20 - progress * 15 + midIntensity * 10;
      const hue = (this.hueBase + progress * 120 + this.time * 0.3) % 360;

      // Segment body
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.7 + audioIntensity * 0.3})`;
      ctx.lineWidth = size;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      // Scales
      if (i % 3 === 0) {
        ctx.fillStyle = `hsla(${hue + 30}, 85%, 65%, 0.6)`;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head
      if (i === segments - 1) {
        const headSize = size * 1.5;

        ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.9)`;
        ctx.beginPath();
        ctx.arc(x, y, headSize, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeOffset = headSize * 0.4;
        ctx.fillStyle = `hsla(${(hue + 180) % 360}, 90%, 70%, 0.9)`;
        ctx.beginPath();
        ctx.arc(
          x - eyeOffset,
          y - eyeOffset * 0.5,
          headSize * 0.2,
          0,
          Math.PI * 2,
        );
        ctx.arc(
          x + eyeOffset,
          y - eyeOffset * 0.5,
          headSize * 0.2,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Forked tongue
        const tongueLength = headSize * 2;
        const tongueAngle = Math.sin(this.time * 0.02) * 0.2;

        ctx.strokeStyle = `hsla(0, 90%, 60%, 0.8)`;
        ctx.lineWidth = 2;

        ctx.save();
        ctx.translate(x, y + headSize);
        ctx.rotate(tongueAngle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-5, tongueLength);
        ctx.moveTo(0, 0);
        ctx.lineTo(5, tongueLength);
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  private renderCrystalGrid(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const gridSize = 6;
    const spacing = Math.min(this.width, this.height) / gridSize;

    // Draw crystal lattice
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = (col + 0.5) * spacing;
        const y = (row + 0.5) * spacing;
        const pulse =
          Math.sin(this.time * 0.005 + row * 0.3 + col * 0.3) * 0.5 + 0.5;
        const size = 20 + pulse * 20 + audioIntensity * 15;
        const hue =
          (this.hueBase + row * 30 + col * 30 + this.time * 0.2) % 360;

        // Crystal glow
        const gradient = ctx.createRadialGradient(
          x,
          y,
          size * 0.3,
          x,
          y,
          size * 2,
        );
        gradient.addColorStop(
          0,
          `hsla(${hue}, 90%, 70%, ${0.6 + bassIntensity * 0.4})`,
        );
        gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x - size * 2, y - size * 2, size * 4, size * 4);

        // Crystal shape (hexagon)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.time * 0.001 + row + col);

        ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.8)`;
        ctx.fillStyle = `hsla(${hue}, 75%, 60%, ${0.3 + midIntensity * 0.3})`;
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          const cx = Math.cos(angle) * size;
          const cy = Math.sin(angle) * size;
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner facets
        ctx.strokeStyle = `hsla(${hue + 30}, 90%, 70%, 0.5)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 * i) / 6;
          const cx = Math.cos(angle) * size;
          const cy = Math.sin(angle) * size;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(cx, cy);
          ctx.stroke();
        }

        ctx.restore();

        // Connect to neighbors
        if (col < gridSize - 1) {
          const nextX = (col + 1.5) * spacing;
          ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${0.2 + audioIntensity * 0.2})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nextX, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (row < gridSize - 1) {
          const nextY = (row + 1.5) * spacing;
          ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${0.2 + audioIntensity * 0.2})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, nextY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  }

  private renderMoonPhases(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const phases = 8;
    const radius = 200 + bassIntensity * 80;
    const moonSize = 40 + trebleIntensity * 20;

    // Orbital ring
    ctx.strokeStyle = `hsla(${this.hueBase}, 60%, 50%, 0.3)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw phases
    for (let i = 0; i < phases; i++) {
      const angle = (Math.PI * 2 * i) / phases + this.time * 0.001;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      const phase = i / phases;

      // Moon glow
      const gradient = ctx.createRadialGradient(
        x,
        y,
        moonSize * 0.5,
        x,
        y,
        moonSize * 2,
      );
      gradient.addColorStop(
        0,
        `hsla(${this.hueBase + 180}, 80%, 80%, ${0.6 + audioIntensity * 0.4})`,
      );
      gradient.addColorStop(1, `hsla(${this.hueBase + 180}, 70%, 70%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        x - moonSize * 2,
        y - moonSize * 2,
        moonSize * 4,
        moonSize * 4,
      );

      // Full moon circle
      ctx.fillStyle = `hsla(${this.hueBase + 180}, 70%, 80%, 0.9)`;
      ctx.beginPath();
      ctx.arc(x, y, moonSize, 0, Math.PI * 2);
      ctx.fill();

      // Shadow for phase
      if (phase < 0.5) {
        // Waxing
        const shadowWidth = moonSize * 2 * (1 - phase * 2);
        ctx.fillStyle = `rgba(0, 0, 20, 0.8)`;
        ctx.beginPath();
        ctx.arc(x - moonSize + shadowWidth, y, moonSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Waning
        const shadowWidth = moonSize * 2 * ((phase - 0.5) * 2);
        ctx.fillStyle = `rgba(0, 0, 20, 0.8)`;
        ctx.beginPath();
        ctx.arc(x + moonSize - shadowWidth, y, moonSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Phase label stars
      for (let j = 0; j < 3; j++) {
        const starAngle = (Math.PI * 2 * j) / 3 + this.time * 0.003;
        const starDist = moonSize + 20 + Math.sin(this.time * 0.01 + j) * 5;
        const starX = x + Math.cos(starAngle) * starDist;
        const starY = y + Math.sin(starAngle) * starDist;
        const starSize = 2 + audioIntensity * 3;

        ctx.fillStyle = `hsla(${this.hueBase + 60}, 90%, 70%, 0.7)`;
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Central celestial point
    ctx.fillStyle = `hsla(${this.hueBase}, 80%, 60%, ${0.6 + audioIntensity * 0.4})`;
    ctx.beginPath();
    ctx.arc(
      this.centerX,
      this.centerY,
      15 + bassIntensity * 10,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  private renderAstrolabe(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const outerRadius = 280 + bassIntensity * 60;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.time * 0.0005);

    // Outer rim
    ctx.strokeStyle = `hsla(${this.hueBase}, 75%, 60%, 0.8)`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Degree markings
    for (let i = 0; i < 360; i += 10) {
      const angle = (i * Math.PI) / 180;
      const innerR = i % 30 === 0 ? outerRadius - 20 : outerRadius - 10;
      const lineWidth = i % 30 === 0 ? 3 : 1;

      ctx.strokeStyle = `hsla(${this.hueBase + i}, 70%, 60%, 0.6)`;
      ctx.lineWidth = lineWidth;

      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
      ctx.stroke();
    }

    // Zodiac ring
    const zodiacRadius = outerRadius * 0.8;
    const signs = 12;
    for (let i = 0; i < signs; i++) {
      const angle = (Math.PI * 2 * i) / signs;
      const x = Math.cos(angle) * zodiacRadius;
      const y = Math.sin(angle) * zodiacRadius;
      const symbolSize = 25 + midIntensity * 15;
      const hue = (this.hueBase + i * 30) % 360;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);

      // Zodiac symbol (simplified as geometric shape)
      ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${0.6 + audioIntensity * 0.3})`;
      ctx.strokeStyle = `hsla(${hue}, 85%, 70%, 0.8)`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(0, 0, symbolSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner symbol
      ctx.fillStyle = `hsla(${hue + 30}, 90%, 75%, 0.8)`;
      ctx.beginPath();
      for (let j = 0; j < 3; j++) {
        const sAngle = (Math.PI * 2 * j) / 3;
        const sx = Math.cos(sAngle) * symbolSize * 0.5;
        const sy = Math.sin(sAngle) * symbolSize * 0.5;
        if (j === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Planetary rings
    for (let ring = 1; ring <= 4; ring++) {
      const ringRadius = outerRadius * (ring / 5);
      const planetCount = ring + 2;

      ctx.strokeStyle = `hsla(${this.hueBase + ring * 20}, 65%, 55%, 0.3)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Planets on ring
      for (let p = 0; p < planetCount; p++) {
        const pAngle =
          (Math.PI * 2 * p) / planetCount - this.time * 0.001 * ring;
        const px = Math.cos(pAngle) * ringRadius;
        const py = Math.sin(pAngle) * ringRadius;
        const pSize = 6 + audioIntensity * 5;
        const pHue = (this.hueBase + ring * 40 + p * 20) % 360;

        ctx.fillStyle = `hsla(${pHue}, 85%, 65%, 0.8)`;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Rotating pointer
    ctx.save();
    ctx.rotate(this.time * 0.002);
    ctx.strokeStyle = `hsla(${this.hueBase + 60}, 90%, 70%, ${0.7 + audioIntensity * 0.3})`;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -outerRadius * 0.7);
    ctx.stroke();

    // Pointer tip
    ctx.fillStyle = `hsla(${this.hueBase + 60}, 95%, 75%, 0.9)`;
    ctx.beginPath();
    ctx.moveTo(0, -outerRadius * 0.7);
    ctx.lineTo(-10, -outerRadius * 0.7 + 20);
    ctx.lineTo(10, -outerRadius * 0.7 + 20);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Central hub
    ctx.fillStyle = `hsla(${this.hueBase}, 80%, 60%, 0.9)`;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + bassIntensity * 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderTarot(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const cardCount = 7;
    const cardWidth = 80 + bassIntensity * 30;
    const cardHeight = cardWidth * 1.5;
    const spacing = (this.width - cardWidth * cardCount) / (cardCount + 1);

    for (let i = 0; i < cardCount; i++) {
      const x = spacing + i * (cardWidth + spacing);
      const y = this.centerY - cardHeight / 2;
      const hover = Math.sin(this.time * 0.005 + i * 0.8) * 20;
      const rotation = Math.sin(this.time * 0.003 + i) * 0.1;
      const hue = (this.hueBase + i * 51) % 360; // Use prime number for varied colors

      ctx.save();
      ctx.translate(x + cardWidth / 2, y + cardHeight / 2 + hover);
      ctx.rotate(rotation);

      // Card glow
      const glowSize = cardWidth * 0.6;
      const gradient = ctx.createRadialGradient(
        0,
        0,
        glowSize * 0.5,
        0,
        0,
        glowSize,
      );
      gradient.addColorStop(
        0,
        `hsla(${hue}, 90%, 70%, ${0.4 + audioIntensity * 0.3})`,
      );
      gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);

      // Card body
      ctx.fillStyle = `hsla(${hue}, 30%, 20%, 0.9)`;
      ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.8)`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsla(${hue}, 80%, 50%, 0.5)`;

      ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
      ctx.strokeRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
      ctx.shadowBlur = 0;

      // Card border decoration
      ctx.strokeStyle = `hsla(${hue + 30}, 85%, 70%, 0.6)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        -cardWidth / 2 + 5,
        -cardHeight / 2 + 5,
        cardWidth - 10,
        cardHeight - 10,
      );

      // Central symbol
      const symbolSize = cardWidth * 0.3 + midIntensity * 10;
      ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${0.7 + audioIntensity * 0.3})`;
      ctx.strokeStyle = `hsla(${hue + 60}, 95%, 75%, 0.9)`;
      ctx.lineWidth = 2;

      // Different symbols for each card
      const symbolType = i % 4;
      ctx.beginPath();

      switch (symbolType) {
        case 0: // Sun
          ctx.arc(0, 0, symbolSize, 0, Math.PI * 2);
          for (let r = 0; r < 8; r++) {
            const rAngle = (Math.PI * 2 * r) / 8;
            ctx.moveTo(
              Math.cos(rAngle) * symbolSize,
              Math.sin(rAngle) * symbolSize,
            );
            ctx.lineTo(
              Math.cos(rAngle) * symbolSize * 1.4,
              Math.sin(rAngle) * symbolSize * 1.4,
            );
          }
          break;
        case 1: // Moon
          ctx.arc(symbolSize * 0.3, 0, symbolSize, 0, Math.PI * 2);
          ctx.arc(-symbolSize * 0.3, 0, symbolSize, 0, Math.PI * 2);
          break;
        case 2: // Star
          for (let p = 0; p < 5; p++) {
            const pAngle = (Math.PI * 2 * p) / 5 - Math.PI / 2;
            const nextAngle = (Math.PI * 2 * (p + 2)) / 5 - Math.PI / 2;
            const px = Math.cos(pAngle) * symbolSize;
            const py = Math.sin(pAngle) * symbolSize;
            const npx = Math.cos(nextAngle) * symbolSize;
            const npy = Math.sin(nextAngle) * symbolSize;
            if (p === 0) ctx.moveTo(px, py);
            ctx.lineTo(npx, npy);
          }
          ctx.closePath();
          break;
        case 3: // Eye
          ctx.ellipse(0, 0, symbolSize, symbolSize * 0.6, 0, 0, Math.PI * 2);
          ctx.moveTo(symbolSize * 0.3, 0);
          ctx.arc(0, 0, symbolSize * 0.3, 0, Math.PI * 2);
          break;
      }

      ctx.fill();
      ctx.stroke();

      // Mystical particles around card
      for (let p = 0; p < 4; p++) {
        const pAngle = (Math.PI * 2 * p) / 4 + this.time * 0.01;
        const pDist = cardWidth * 0.6 + Math.sin(this.time * 0.02 + p) * 10;
        const px = Math.cos(pAngle) * pDist;
        const py = Math.sin(pAngle) * pDist;
        const pSize = 3 + audioIntensity * 4;

        ctx.fillStyle = `hsla(${hue + 120}, 90%, 70%, 0.7)`;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderKabbalah(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;

    // Tree of Life sephirot positions (traditional layout)
    const sephirot = [
      { x: 0, y: -200, name: "Kether", hueOffset: 0 },
      { x: -80, y: -120, name: "Chokmah", hueOffset: 36 },
      { x: 80, y: -120, name: "Binah", hueOffset: 72 },
      { x: -80, y: -40, name: "Chesed", hueOffset: 108 },
      { x: 80, y: -40, name: "Geburah", hueOffset: 144 },
      { x: 0, y: 0, name: "Tiphareth", hueOffset: 180 },
      { x: -80, y: 80, name: "Netzach", hueOffset: 216 },
      { x: 80, y: 80, name: "Hod", hueOffset: 252 },
      { x: 0, y: 140, name: "Yesod", hueOffset: 288 },
      { x: 0, y: 220, name: "Malkuth", hueOffset: 324 },
    ];

    // Paths connecting sephirot
    const paths = [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 4],
      [3, 5],
      [4, 5],
      [3, 6],
      [4, 7],
      [5, 6],
      [5, 7],
      [6, 7],
      [6, 8],
      [7, 8],
      [8, 9],
      [5, 8],
    ];

    ctx.save();
    ctx.translate(this.centerX, this.centerY + 50);

    // Draw paths
    ctx.lineWidth = 2;
    paths.forEach((path, pathIndex) => {
      const fromIndex = path[0];
      const toIndex = path[1];
      if (fromIndex === undefined || toIndex === undefined) return;

      const from = sephirot[fromIndex];
      const to = sephirot[toIndex];
      if (!from || !to) return;

      const hue = (this.hueBase + pathIndex * 15) % 360;
      const pulse = Math.sin(this.time * 0.003 + pathIndex * 0.5) * 0.3 + 0.7;

      ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${0.3 * pulse + audioIntensity * 0.2})`;
      ctx.setLineDash([10, 10]);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw sephirot
    sephirot.forEach((sephira, index) => {
      const size =
        30 + (index === 5 ? bassIntensity * 20 : trebleIntensity * 10);
      const hue = (this.hueBase + sephira.hueOffset) % 360;
      const pulse = Math.sin(this.time * 0.004 + index * 0.7) * 0.2 + 0.8;

      // Glow
      const gradient = ctx.createRadialGradient(
        sephira.x,
        sephira.y,
        size * 0.3,
        sephira.x,
        sephira.y,
        size * 2,
      );
      gradient.addColorStop(
        0,
        `hsla(${hue}, 90%, 70%, ${0.6 * pulse + audioIntensity * 0.3})`,
      );
      gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        sephira.x - size * 2,
        sephira.y - size * 2,
        size * 4,
        size * 4,
      );

      // Sephira circle
      ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.9)`;
      ctx.strokeStyle = `hsla(${hue + 30}, 90%, 70%, 0.9)`;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(sephira.x, sephira.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner ring
      ctx.strokeStyle = `hsla(${hue + 60}, 95%, 75%, 0.7)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sephira.x, sephira.y, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating symbols
      const symbolCount = 6;
      for (let s = 0; s < symbolCount; s++) {
        const sAngle = (Math.PI * 2 * s) / symbolCount + this.time * 0.002;
        const sDist = size * 0.4;
        const sx = sephira.x + Math.cos(sAngle) * sDist;
        const sy = sephira.y + Math.sin(sAngle) * sDist;

        ctx.fillStyle = `hsla(${hue + 90}, 90%, 70%, 0.8)`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  private renderMerkaba(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const size = 150 + bassIntensity * 80;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.time * 0.001);

    // Upward tetrahedron
    ctx.save();
    ctx.rotate(this.time * 0.002);

    const upHue = this.hueBase;
    ctx.strokeStyle = `hsla(${upHue}, 85%, 65%, ${0.7 + audioIntensity * 0.3})`;
    ctx.fillStyle = `hsla(${upHue}, 75%, 60%, ${0.2 + midIntensity * 0.2})`;
    ctx.lineWidth = 3;

    // Front face
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.866, size * 0.5);
    ctx.lineTo(size * 0.866, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Back edges
    const backY = size * 0.2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(0, backY);
    ctx.moveTo(-size * 0.866, size * 0.5);
    ctx.lineTo(0, backY);
    ctx.moveTo(size * 0.866, size * 0.5);
    ctx.lineTo(0, backY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();

    // Downward tetrahedron
    ctx.save();
    ctx.rotate(-this.time * 0.002);

    const downHue = (this.hueBase + 180) % 360;
    ctx.strokeStyle = `hsla(${downHue}, 85%, 65%, ${0.7 + audioIntensity * 0.3})`;
    ctx.fillStyle = `hsla(${downHue}, 75%, 60%, ${0.2 + midIntensity * 0.2})`;
    ctx.lineWidth = 3;

    // Front face (inverted)
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(-size * 0.866, -size * 0.5);
    ctx.lineTo(size * 0.866, -size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Back edges
    const backY2 = -size * 0.2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(0, backY2);
    ctx.moveTo(-size * 0.866, -size * 0.5);
    ctx.lineTo(0, backY2);
    ctx.moveTo(size * 0.866, -size * 0.5);
    ctx.lineTo(0, backY2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();

    // Energy sphere
    const sphereGradient = ctx.createRadialGradient(
      0,
      0,
      size * 0.3,
      0,
      0,
      size * 0.7,
    );
    sphereGradient.addColorStop(
      0,
      `hsla(${this.hueBase + 120}, 90%, 70%, ${0.4 + audioIntensity * 0.3})`,
    );
    sphereGradient.addColorStop(1, `hsla(${this.hueBase + 120}, 80%, 60%, 0)`);

    ctx.fillStyle = sphereGradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Rotating energy particles
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + this.time * 0.005;
      const orbitRadius = size * 0.6;
      const px = Math.cos(angle) * orbitRadius;
      const py = Math.sin(angle) * orbitRadius;
      const pSize = 4 + audioIntensity * 5;
      const pHue = (this.hueBase + i * 30) % 360;

      ctx.fillStyle = `hsla(${pHue}, 90%, 70%, 0.8)`;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderFlowerOfLife(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const radius = 50 + midIntensity * 20;
    const rings = 2;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.time * 0.0005);

    // Center circle
    const centerHue = this.hueBase;
    ctx.strokeStyle = `hsla(${centerHue}, 85%, 65%, ${0.7 + audioIntensity * 0.3})`;
    ctx.fillStyle = `hsla(${centerHue}, 75%, 60%, 0.1)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rings of circles
    for (let ring = 1; ring <= rings; ring++) {
      const circlesInRing = ring * 6;
      const hue = (this.hueBase + ring * 40) % 360;

      for (let i = 0; i < circlesInRing; i++) {
        const angle = (Math.PI * 2 * i) / circlesInRing;
        const distance = ring === 1 ? radius : radius * Math.sqrt(3) * ring;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.6 + audioIntensity * 0.2})`;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Add pulsing center dots
        const pulse = Math.sin(this.time * 0.005 + i * 0.3) * 3 + 5;
        ctx.fillStyle = `hsla(${hue + 60}, 90%, 70%, ${0.6 + bassIntensity * 0.4})`;
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Outer vesica piscis pattern
    const outerRadius = radius * 2 * (rings + 1);
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;
      const hue = (this.hueBase + i * 60) % 360;

      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.4 + audioIntensity * 0.2})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Sacred geometry lines
    ctx.strokeStyle = `hsla(${this.hueBase + 180}, 70%, 60%, ${0.3 + audioIntensity * 0.2})`;
    ctx.lineWidth = 1;

    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      hexPoints.push({
        x: Math.cos(angle) * radius * 2,
        y: Math.sin(angle) * radius * 2,
      });
    }

    ctx.beginPath();
    hexPoints.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  private renderSriYantra(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const baseSize = 200 + bassIntensity * 60;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Outer square (Bhupura)
    const squareSize = baseSize * 1.4;
    ctx.strokeStyle = `hsla(${this.hueBase}, 75%, 60%, 0.7)`;
    ctx.lineWidth = 4;
    ctx.strokeRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);

    // Four gates
    const gateSize = 30;
    const gateOffset = squareSize / 2 - gateSize / 2;

    ctx.fillStyle = `hsla(${this.hueBase + 30}, 80%, 65%, 0.6)`;
    const gates: [number, number][] = [
      [0, -gateOffset],
      [0, gateOffset],
      [-gateOffset, 0],
      [gateOffset, 0],
    ];
    gates.forEach(([x, y]) => {
      ctx.fillRect(x - gateSize / 2, y - gateSize / 2, gateSize, gateSize);
    });

    // Lotus petals outer
    const petalCount = 16;
    const petalRadius = baseSize * 1.2;

    for (let i = 0; i < petalCount; i++) {
      const angle = (Math.PI * 2 * i) / petalCount + this.time * 0.001;
      const hue = (this.hueBase + i * (360 / petalCount)) % 360;

      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -petalRadius);

      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.5 + audioIntensity * 0.3})`;
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.7)`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(0, 0, 25, 40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // Lotus petals inner
    const innerPetalCount = 8;
    const innerPetalRadius = baseSize * 0.9;

    for (let i = 0; i < innerPetalCount; i++) {
      const angle = (Math.PI * 2 * i) / innerPetalCount - this.time * 0.001;
      const hue = (this.hueBase + 180 + i * (360 / innerPetalCount)) % 360;

      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -innerPetalRadius);

      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.5 + audioIntensity * 0.3})`;
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.7)`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // Nine interlocking triangles
    const triangles = [
      // Downward triangles (Shakti - feminine)
      { rotation: 0, inverted: true, scale: 1.0, hue: 0 },
      { rotation: Math.PI * 0.4, inverted: true, scale: 0.85, hue: 40 },
      { rotation: Math.PI * 0.8, inverted: true, scale: 0.7, hue: 80 },
      { rotation: Math.PI * 1.2, inverted: true, scale: 0.55, hue: 120 },
      { rotation: Math.PI * 1.6, inverted: true, scale: 0.4, hue: 160 },
      // Upward triangles (Shiva - masculine)
      { rotation: Math.PI * 0.2, inverted: false, scale: 0.95, hue: 200 },
      { rotation: Math.PI * 0.6, inverted: false, scale: 0.8, hue: 240 },
      { rotation: Math.PI, inverted: false, scale: 0.65, hue: 280 },
      { rotation: Math.PI * 1.4, inverted: false, scale: 0.5, hue: 320 },
    ];

    triangles.forEach((tri) => {
      ctx.save();
      ctx.rotate(tri.rotation + this.time * 0.0003 * (tri.inverted ? -1 : 1));

      const triSize = baseSize * tri.scale;
      const hue = (this.hueBase + tri.hue) % 360;

      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.6 + midIntensity * 0.3})`;
      ctx.fillStyle = `hsla(${hue}, 75%, 60%, ${0.15 + audioIntensity * 0.15})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      if (tri.inverted) {
        ctx.moveTo(0, triSize);
        ctx.lineTo(-triSize * 0.866, -triSize * 0.5);
        ctx.lineTo(triSize * 0.866, -triSize * 0.5);
      } else {
        ctx.moveTo(0, -triSize);
        ctx.lineTo(-triSize * 0.866, triSize * 0.5);
        ctx.lineTo(triSize * 0.866, triSize * 0.5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });

    // Central bindu (point)
    const binduSize = 12 + bassIntensity * 10;
    const binduGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      binduSize * 2,
    );
    binduGradient.addColorStop(0, `hsla(${this.hueBase + 60}, 100%, 80%, 1)`);
    binduGradient.addColorStop(
      0.5,
      `hsla(${this.hueBase + 40}, 90%, 70%, 0.7)`,
    );
    binduGradient.addColorStop(1, `hsla(${this.hueBase + 20}, 80%, 60%, 0)`);

    ctx.fillStyle = binduGradient;
    ctx.beginPath();
    ctx.arc(0, 0, binduSize * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsla(${this.hueBase + 60}, 100%, 90%, 1)`;
    ctx.beginPath();
    ctx.arc(0, 0, binduSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderMetatron(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const radius = 180 + bassIntensity * 60;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.time * 0.0005);

    // 13 circles of Metatron's Cube
    const circlePositions = [
      { x: 0, y: 0 }, // Center
      { x: 0, y: -radius },
      { x: radius * 0.866, y: -radius * 0.5 },
      { x: radius * 0.866, y: radius * 0.5 },
      { x: 0, y: radius },
      { x: -radius * 0.866, y: radius * 0.5 },
      { x: -radius * 0.866, y: -radius * 0.5 },
      { x: 0, y: -radius * 0.5 },
      { x: radius * 0.433, y: -radius * 0.25 },
      { x: radius * 0.433, y: radius * 0.25 },
      { x: 0, y: radius * 0.5 },
      { x: -radius * 0.433, y: radius * 0.25 },
      { x: -radius * 0.433, y: -radius * 0.25 },
    ];

    const circleRadius = radius * 0.2;

    // Draw connections (edges of platonic solids) - optimized with single path
    ctx.strokeStyle = `hsla(${this.hueBase}, 70%, 60%, ${0.3 + audioIntensity * 0.2})`;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < circlePositions.length; i++) {
      for (let j = i + 1; j < circlePositions.length; j++) {
        const from = circlePositions[i];
        const to = circlePositions[j];
        if (!from || !to) continue;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only connect circles within certain distance
        if (dist < radius * 1.2) {
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
        }
      }
    }
    ctx.stroke();

    // Draw circles
    circlePositions.forEach((pos, index) => {
      const hue = (this.hueBase + index * 28) % 360;
      const pulse = Math.sin(this.time * 0.004 + index * 0.5) * 0.2 + 0.8;
      const size = circleRadius * pulse + (index === 0 ? midIntensity * 15 : 0);

      // Glow
      const gradient = ctx.createRadialGradient(
        pos.x,
        pos.y,
        size * 0.3,
        pos.x,
        pos.y,
        size * 2,
      );
      gradient.addColorStop(
        0,
        `hsla(${hue}, 90%, 70%, ${0.5 + audioIntensity * 0.3})`,
      );
      gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(pos.x - size * 2, pos.y - size * 2, size * 4, size * 4);

      // Circle
      ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.8)`;
      ctx.strokeStyle = `hsla(${hue + 30}, 90%, 70%, 0.9)`;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner detail
      ctx.strokeStyle = `hsla(${hue + 60}, 95%, 75%, 0.7)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Outer sacred geometry
    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      hexPoints.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }

    ctx.strokeStyle = `hsla(${this.hueBase + 180}, 75%, 65%, ${0.5 + bassIntensity * 0.3})`;
    ctx.lineWidth = 3;

    // Hexagon
    ctx.beginPath();
    hexPoints.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Star hexagram
    ctx.beginPath();
    for (let i = 0; i < 6; i += 2) {
      const point = hexPoints[i];
      if (!point) continue;
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    for (let i = 1; i < 6; i += 2) {
      const point = hexPoints[i];
      if (!point) continue;
      if (i === 1) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  private renderVesicaPiscis(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    const radius = 150 + bassIntensity * 60;
    const separation = radius * 1.0; // Separation for classic vesica piscis

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Left circle
    const leftX = -separation / 2;
    const leftHue = this.hueBase;

    const leftGradient = ctx.createRadialGradient(
      leftX,
      0,
      radius * 0.3,
      leftX,
      0,
      radius,
    );
    leftGradient.addColorStop(
      0,
      `hsla(${leftHue}, 90%, 70%, ${0.4 + audioIntensity * 0.3})`,
    );
    leftGradient.addColorStop(1, `hsla(${leftHue}, 80%, 60%, 0.1)`);

    ctx.fillStyle = leftGradient;
    ctx.strokeStyle = `hsla(${leftHue}, 85%, 65%, 0.8)`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(leftX, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Right circle
    const rightX = separation / 2;
    const rightHue = (this.hueBase + 120) % 360;

    const rightGradient = ctx.createRadialGradient(
      rightX,
      0,
      radius * 0.3,
      rightX,
      0,
      radius,
    );
    rightGradient.addColorStop(
      0,
      `hsla(${rightHue}, 90%, 70%, ${0.4 + audioIntensity * 0.3})`,
    );
    rightGradient.addColorStop(1, `hsla(${rightHue}, 80%, 60%, 0.1)`);

    ctx.fillStyle = rightGradient;
    ctx.strokeStyle = `hsla(${rightHue}, 85%, 65%, 0.8)`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(rightX, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Highlight the vesica piscis (intersection)
    ctx.save();
    ctx.beginPath();
    ctx.arc(leftX, 0, radius, 0, Math.PI * 2);
    ctx.clip();

    const vesicaHue = (this.hueBase + 240) % 360;
    const vesicaGradient = ctx.createRadialGradient(
      0,
      0,
      10,
      0,
      0,
      radius * 0.7,
    );
    vesicaGradient.addColorStop(
      0,
      `hsla(${vesicaHue}, 95%, 75%, ${0.6 + trebleIntensity * 0.4})`,
    );
    vesicaGradient.addColorStop(1, `hsla(${vesicaHue}, 85%, 65%, 0.2)`);

    ctx.fillStyle = vesicaGradient;
    ctx.beginPath();
    ctx.arc(rightX, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Outline the vesica piscis
    const intersectionHeight = Math.sqrt(
      radius * radius - (separation / 2) * (separation / 2),
    );

    ctx.strokeStyle = `hsla(${vesicaHue}, 90%, 70%, ${0.9 + audioIntensity * 0.1})`;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(0, -intersectionHeight);
    ctx.arcTo(rightX, 0, 0, intersectionHeight, radius);
    ctx.arcTo(leftX, 0, 0, -intersectionHeight, radius);
    ctx.closePath();
    ctx.stroke();

    // Sacred geometry additions
    const verticalLineY = intersectionHeight * (0.8 + audioIntensity * 0.2);

    ctx.strokeStyle = `hsla(${this.hueBase + 60}, 80%, 65%, 0.6)`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Vertical line through vesica
    ctx.beginPath();
    ctx.moveTo(0, -verticalLineY);
    ctx.lineTo(0, verticalLineY);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(-separation, 0);
    ctx.lineTo(separation, 0);
    ctx.stroke();

    ctx.setLineDash([]);

    // Energy points at intersections
    const points = [
      { x: 0, y: -intersectionHeight },
      { x: 0, y: intersectionHeight },
      { x: 0, y: 0 },
    ];

    points.forEach((point, i) => {
      const pointSize = 8 + bassIntensity * 8 + (i === 2 ? 5 : 0);
      const pointHue = (vesicaHue + i * 60) % 360;

      ctx.fillStyle = `hsla(${pointHue}, 95%, 75%, 0.9)`;
      ctx.strokeStyle = `hsla(${pointHue + 30}, 100%, 80%, 1)`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Rotating sacred symbols
    const symbolCount = 6;
    ctx.save();
    ctx.rotate(this.time * 0.002);

    for (let i = 0; i < symbolCount; i++) {
      const angle = (Math.PI * 2 * i) / symbolCount;
      const dist = radius * 1.5;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const symbolSize = 4 + trebleIntensity * 5;
      const symbolHue = (this.hueBase + i * 60) % 360;

      ctx.fillStyle = `hsla(${symbolHue}, 90%, 70%, 0.7)`;
      ctx.beginPath();
      ctx.arc(x, y, symbolSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  private renderTorusField(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const majorRadius = 180 + bassIntensity * 70;
    const minorRadius = 60 + midIntensity * 30;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.time * 0.001);

    // Draw torus using concentric rings
    const rings = 30;

    for (let i = 0; i < rings; i++) {
      const progress = i / rings;
      const angle = progress * Math.PI * 2 + this.time * 0.005;

      // Calculate torus position
      const ringCenterX = Math.cos(angle) * majorRadius;
      const ringCenterY = Math.sin(angle) * majorRadius;
      const ringRadius = minorRadius * Math.abs(Math.sin(angle));

      const hue = (this.hueBase + progress * 240) % 360;
      const alpha =
        0.3 + (1 - Math.abs(Math.cos(angle))) * 0.5 + audioIntensity * 0.2;

      // Ring glow
      const gradient = ctx.createRadialGradient(
        ringCenterX,
        ringCenterY,
        ringRadius * 0.3,
        ringCenterX,
        ringCenterY,
        ringRadius * 1.5,
      );
      gradient.addColorStop(0, `hsla(${hue}, 90%, 70%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        ringCenterX - ringRadius * 1.5,
        ringCenterY - ringRadius * 1.5,
        ringRadius * 3,
        ringRadius * 3,
      );

      // Ring outline
      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${alpha})`;
      ctx.lineWidth = 2 + Math.abs(Math.sin(angle)) * 3;

      ctx.beginPath();
      ctx.ellipse(
        ringCenterX,
        ringCenterY,
        ringRadius,
        ringRadius * 0.5,
        angle,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      // Energy particles flowing along torus
      if (i % 3 === 0) {
        const particleCount = 8;
        for (let p = 0; p < particleCount; p++) {
          const pAngle = (Math.PI * 2 * p) / particleCount + this.time * 0.01;
          const pX = ringCenterX + Math.cos(pAngle) * ringRadius;
          const pY = ringCenterY + Math.sin(pAngle) * ringRadius * 0.5;
          const pSize = 3 + audioIntensity * 4;

          ctx.fillStyle = `hsla(${hue + 60}, 95%, 75%, 0.8)`;
          ctx.beginPath();
          ctx.arc(pX, pY, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Central axis
    ctx.strokeStyle = `hsla(${this.hueBase}, 70%, 60%, ${0.4 + audioIntensity * 0.3})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);

    ctx.beginPath();
    ctx.moveTo(-majorRadius * 1.2, 0);
    ctx.lineTo(majorRadius * 1.2, 0);
    ctx.stroke();

    ctx.setLineDash([]);

    // Energy flow lines
    const flowLines = 12;
    for (let i = 0; i < flowLines; i++) {
      const flowAngle = (Math.PI * 2 * i) / flowLines + this.time * 0.003;
      const hue = (this.hueBase + i * 30) % 360;

      ctx.save();
      ctx.rotate(flowAngle);

      ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${0.3 + audioIntensity * 0.2})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let t = 0; t <= 100; t++) {
        const tProgress = t / 100;
        const tAngle = tProgress * Math.PI * 2;
        const radius = majorRadius + Math.cos(tAngle) * minorRadius;
        const x = Math.cos(tAngle) * radius;
        const y = Math.sin(tAngle) * minorRadius * 0.5;

        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
    }

    // Central vortex
    const vortexSize = 30 + bassIntensity * 20;
    const vortexGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, vortexSize);
    vortexGradient.addColorStop(0, `hsla(${this.hueBase + 120}, 95%, 75%, 1)`);
    vortexGradient.addColorStop(
      0.6,
      `hsla(${this.hueBase + 90}, 85%, 65%, 0.6)`,
    );
    vortexGradient.addColorStop(1, `hsla(${this.hueBase + 60}, 75%, 55%, 0)`);

    ctx.fillStyle = vortexGradient;
    ctx.beginPath();
    ctx.arc(0, 0, vortexSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderCosmicEgg(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    const eggWidth = 220 + bassIntensity * 80;
    const eggHeight = eggWidth * 1.4;

    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(Math.sin(this.time * 0.002) * 0.1);

    // Outer cosmic field
    const fieldLayers = 8;
    for (let i = 0; i < fieldLayers; i++) {
      const scale = 1 + (i / fieldLayers) * 0.5;
      const hue = (this.hueBase + i * 30 + this.time * 0.3) % 360;
      const alpha =
        0.1 + ((fieldLayers - i) / fieldLayers) * 0.3 + audioIntensity * 0.1;

      ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(0, 0, eggWidth * scale, eggHeight * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Main egg body with gradient
    const eggGradient = ctx.createRadialGradient(
      0,
      -eggHeight * 0.2,
      0,
      0,
      0,
      eggHeight * 0.6,
    );
    eggGradient.addColorStop(0, `hsla(${this.hueBase}, 70%, 50%, 0.8)`);
    eggGradient.addColorStop(0.5, `hsla(${this.hueBase + 40}, 75%, 55%, 0.6)`);
    eggGradient.addColorStop(1, `hsla(${this.hueBase + 80}, 80%, 60%, 0.4)`);

    ctx.fillStyle = eggGradient;
    ctx.strokeStyle = `hsla(${this.hueBase}, 85%, 65%, 0.9)`;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.ellipse(0, 0, eggWidth, eggHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner universe swirl
    const spiralTurns = 5;
    const maxRadius = eggWidth * 0.8;

    ctx.strokeStyle = `hsla(${this.hueBase + 120}, 90%, 70%, ${0.6 + audioIntensity * 0.3})`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let t = 0; t <= 360; t++) {
      const progress = t / 360;
      const angle = progress * Math.PI * 2 * spiralTurns + this.time * 0.005;
      const radius = progress * maxRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * (eggHeight / eggWidth);

      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Counter-rotating spiral
    ctx.strokeStyle = `hsla(${this.hueBase + 240}, 90%, 70%, ${0.5 + audioIntensity * 0.3})`;
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let t = 0; t <= 360; t++) {
      const progress = t / 360;
      const angle = -progress * Math.PI * 2 * spiralTurns - this.time * 0.005;
      const radius = progress * maxRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * (eggHeight / eggWidth);

      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Stars/galaxies within
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      const angle =
        (Math.PI * 2 * i) / starCount +
        this.time * 0.001 * (i % 2 === 0 ? 1 : -1);
      const radiusProgress = (i % 10) / 10;
      const radius = radiusProgress * maxRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * (eggHeight / eggWidth);

      // Only draw stars inside the egg
      if (
        (x * x) / (eggWidth * eggWidth) + (y * y) / (eggHeight * eggHeight) <
        0.64
      ) {
        const starSize = 2 + Math.random() * 3 + midIntensity * 3;
        const starHue = (this.hueBase + i * 7) % 360;
        const twinkle = Math.sin(this.time * 0.01 + i) * 0.3 + 0.7;

        ctx.fillStyle = `hsla(${starHue}, 90%, 70%, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(x, y, starSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Central light (primordial essence)
    const coreSize = 40 + bassIntensity * 30;
    const coreGradient = ctx.createRadialGradient(
      0,
      0,
      coreSize * 0.2,
      0,
      0,
      coreSize,
    );
    coreGradient.addColorStop(0, `hsla(${this.hueBase + 60}, 100%, 90%, 1)`);
    coreGradient.addColorStop(0.4, `hsla(${this.hueBase + 40}, 95%, 80%, 0.8)`);
    coreGradient.addColorStop(0.7, `hsla(${this.hueBase + 20}, 90%, 70%, 0.5)`);
    coreGradient.addColorStop(1, `hsla(${this.hueBase}, 85%, 60%, 0)`);

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // Emanating rays
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const rayAngle = (Math.PI * 2 * i) / rayCount + this.time * 0.003;
      const rayLength = coreSize + 30 + bassIntensity * 20;

      ctx.save();
      ctx.rotate(rayAngle);

      const rayGradient = ctx.createLinearGradient(
        coreSize * 0.5,
        0,
        rayLength,
        0,
      );
      rayGradient.addColorStop(0, `hsla(${this.hueBase + 45}, 95%, 75%, 0.8)`);
      rayGradient.addColorStop(1, `hsla(${this.hueBase + 60}, 90%, 70%, 0)`);

      ctx.strokeStyle = rayGradient;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(coreSize * 0.5, 0);
      ctx.lineTo(rayLength, 0);
      ctx.stroke();

      ctx.restore();
    }

    // Cracking effect (emergence)
    if (audioIntensity > 0.7) {
      const cracks = 8;
      for (let i = 0; i < cracks; i++) {
        const crackAngle =
          (Math.PI * 2 * i) / cracks + Math.sin(this.time * 0.01) * 0.1;
        const crackLength = eggHeight * 0.6;

        ctx.save();
        ctx.rotate(crackAngle);

        ctx.strokeStyle = `hsla(${this.hueBase + 180}, 80%, 70%, ${audioIntensity - 0.7})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);

        ctx.beginPath();
        ctx.moveTo(0, eggHeight * 0.2);
        const segmentCount = 10;
        for (let s = 0; s <= segmentCount; s++) {
          const sProgress = s / segmentCount;
          const y = eggHeight * 0.2 + sProgress * crackLength;
          const x = Math.sin(sProgress * Math.PI * 2 + this.time * 0.02) * 10;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }
    }

    ctx.restore();
  }
  private renderEnochian(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const gridSize = 4;
    const cellSize = Math.min(this.width, this.height) / (gridSize + 2);
    const enochianChars = [
      "⊕",
      "⊗",
      "⊙",
      "☉",
      "☊",
      "☋",
      "☌",
      "☍",
      "⚹",
      "⚺",
      "⚻",
      "⚼",
    ];

    ctx.strokeStyle = `hsla(${this.hueBase + 60}, 90%, 70%, ${0.8 + audioIntensity * 0.2})`;
    ctx.lineWidth = 4 + bassIntensity * 4;
    ctx.beginPath();
    ctx.moveTo(-cellSize * 2, 0);
    ctx.lineTo(cellSize * 2, 0);
    ctx.moveTo(0, -cellSize * 2);
    ctx.lineTo(0, cellSize * 2);
    ctx.stroke();

    for (let row = -2; row < 2; row++) {
      for (let col = -2; col < 2; col++) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        const charIndex =
          ((row + 2) * gridSize + (col + 2)) % enochianChars.length;
        const rotation = Math.sin(this.time * 0.003 + row + col) * 0.2;
        const scale =
          1 +
          Math.sin(this.time * 0.005 + row * col) * 0.15 +
          midIntensity * 0.2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        ctx.fillStyle = `hsla(${this.hueBase + charIndex * 15}, 90%, 75%, ${0.9 + audioIntensity * 0.1})`;
        ctx.font = `${cellSize * 0.5}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(enochianChars[charIndex] ?? "", 0, 0);
        ctx.restore();
      }
    }

    const outerRadius = cellSize * 2.5 + bassIntensity * 20;
    ctx.strokeStyle = `hsla(${this.hueBase}, 90%, 70%, ${0.7 + audioIntensity * 0.2})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  private renderLabyrinth(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const rings = 7;
    const maxRadius = Math.min(this.width, this.height) * 0.4;

    for (let ring = 0; ring < rings; ring++) {
      const radius = (maxRadius / rings) * (ring + 1);
      const segmentCount = 8 + ring * 2;
      const rotation = this.time * 0.001 * (ring % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.rotate(rotation);

      for (let seg = 0; seg < segmentCount; seg++) {
        const angle = (Math.PI * 2 * seg) / segmentCount;
        const nextAngle = (Math.PI * 2 * (seg + 1)) / segmentCount;
        const shouldDraw = (seg + ring) % 3 !== 0;

        if (shouldDraw) {
          const hue = (this.hueBase + ring * 30 + seg * 5) % 360;
          const alpha =
            0.6 +
            Math.sin(this.time * 0.005 + seg) * 0.2 +
            trebleIntensity * 0.2;

          ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${alpha})`;
          ctx.lineWidth = 2 + bassIntensity * 2;
          ctx.lineCap = "round";

          ctx.beginPath();
          ctx.arc(0, 0, radius, angle, nextAngle);
          ctx.stroke();

          if (ring < rings - 1 && seg % 2 === 0) {
            const innerRadius = (maxRadius / rings) * ring;
            const connectorAngle = (angle + nextAngle) / 2;
            const x1 = Math.cos(connectorAngle) * innerRadius;
            const y1 = Math.sin(connectorAngle) * innerRadius;
            const x2 = Math.cos(connectorAngle) * radius;
            const y2 = Math.sin(connectorAngle) * radius;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    const centerGlow = 20 + bassIntensity * 15;
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerGlow);
    centerGradient.addColorStop(0, `hsla(${this.hueBase + 180}, 100%, 80%, 1)`);
    centerGradient.addColorStop(1, `hsla(${this.hueBase + 180}, 100%, 80%, 0)`);
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderCosmicWeb(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const nodeCount = 12;
    const nodes: { x: number; y: number }[] = [];
    const radius = Math.min(this.width, this.height) * 0.35;

    for (let i = 0; i < nodeCount; i++) {
      const spiralProgress = i / nodeCount;
      const angle = spiralProgress * Math.PI * 4 + this.time * 0.002;
      const r = radius * (0.3 + spiralProgress * 0.7);
      nodes.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.hypot(
          nodes[i]!.x - nodes[j]!.x,
          nodes[i]!.y - nodes[j]!.y,
        );
        const maxDistance = radius * 0.8;

        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * 0.4 + midIntensity * 0.2;
          const hue = (this.hueBase + i * 15 + j * 10) % 360;

          ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
          ctx.lineWidth = 1 + (1 - distance / maxDistance) * 2;

          const pulsePos = (this.time * 0.005 + i * 0.1) % 1;
          const pulseX = nodes[i]!.x + (nodes[j]!.x - nodes[i]!.x) * pulsePos;
          const pulseY = nodes[i]!.y + (nodes[j]!.y - nodes[i]!.y) * pulsePos;

          ctx.beginPath();
          ctx.moveTo(nodes[i]!.x, nodes[i]!.y);
          ctx.lineTo(nodes[j]!.x, nodes[j]!.y);
          ctx.stroke();

          ctx.fillStyle = `hsla(${hue + 60}, 90%, 75%, ${0.8 + audioIntensity * 0.2})`;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 3 + bassIntensity * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    nodes.forEach((node, i) => {
      const nodeSize =
        6 + Math.sin(this.time * 0.003 + i) * 3 + bassIntensity * 4;
      const hue = (this.hueBase + i * 20) % 360;

      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        nodeSize * 2,
      );
      gradient.addColorStop(0, `hsla(${hue}, 90%, 75%, 1)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 85%, 70%, 0.6)`);
      gradient.addColorStop(1, `hsla(${hue}, 80%, 65%, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private renderVortexSpiral(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const arms = 5;
    const maxRadius = Math.min(this.width, this.height) * 0.45;
    const turns = 4;

    for (let arm = 0; arm < arms; arm++) {
      const armOffset = (Math.PI * 2 * arm) / arms;
      const armHue = (this.hueBase + arm * (360 / arms)) % 360;

      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const progress = i / 100;
        const angle =
          armOffset + progress * Math.PI * 2 * turns + this.time * 0.003;
        const radius = progress * maxRadius * (0.1 + progress * 0.9);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const gradient = ctx.createLinearGradient(0, 0, maxRadius, 0);
      gradient.addColorStop(0, `hsla(${armHue}, 90%, 70%, 0.2)`);
      gradient.addColorStop(
        0.5,
        `hsla(${armHue}, 85%, 65%, ${0.6 + midIntensity * 0.3})`,
      );
      gradient.addColorStop(1, `hsla(${armHue}, 80%, 60%, 0.9)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 + bassIntensity * 4;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    const eyeSize = 30 + bassIntensity * 20;
    const eyeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeSize);
    eyeGradient.addColorStop(0, `hsla(${this.hueBase + 180}, 100%, 90%, 1)`);
    eyeGradient.addColorStop(0.6, `hsla(${this.hueBase + 120}, 90%, 70%, 0.7)`);
    eyeGradient.addColorStop(1, `hsla(${this.hueBase}, 80%, 60%, 0)`);

    ctx.fillStyle = eyeGradient;
    ctx.beginPath();
    ctx.arc(0, 0, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderSacredSpiral(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const phi = 1.618033988749;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    const turns = 3;

    for (let spiralIndex = 0; spiralIndex < 3; spiralIndex++) {
      const offset = (Math.PI * 2 * spiralIndex) / 3;
      const hue = (this.hueBase + spiralIndex * 120) % 360;

      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const progress = i / 200;
        const angle =
          offset +
          progress * Math.PI * 2 * turns +
          this.time * 0.002 * (spiralIndex % 2 === 0 ? 1 : -1);
        const radius = (maxRadius * Math.pow(phi, -2 + progress * 3)) / phi;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.6 + trebleIntensity * 0.3})`;
      ctx.lineWidth = 2 + bassIntensity * 3;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderElementalCross(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const armLength = Math.min(this.width, this.height) * 0.35;
    const elements = [
      { angle: 0, hue: 15, symbol: "△" },
      { angle: Math.PI / 2, hue: 60, symbol: "△" },
      { angle: Math.PI, hue: 200, symbol: "▽" },
      { angle: (Math.PI * 3) / 2, hue: 120, symbol: "▽" },
    ];

    elements.forEach((element, index) => {
      ctx.save();
      ctx.rotate(element.angle);

      const gradient = ctx.createLinearGradient(0, 0, armLength, 0);
      gradient.addColorStop(
        0,
        `hsla(${element.hue}, 90%, 70%, ${0.8 + audioIntensity * 0.2})`,
      );
      gradient.addColorStop(1, `hsla(${element.hue}, 90%, 70%, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 8 + bassIntensity * 6;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(armLength, 0);
      ctx.stroke();

      ctx.translate(armLength * 0.85, 0);
      const symbolScale =
        1 + Math.sin(this.time * 0.005 + index) * 0.2 + midIntensity * 0.3;
      ctx.scale(symbolScale, symbolScale);

      ctx.fillStyle = `hsla(${element.hue}, 95%, 75%, ${0.9 + audioIntensity * 0.1})`;
      ctx.font = `${armLength * 0.15}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(element.symbol, 0, 0);

      ctx.restore();
    });

    const centerSize = 40 + bassIntensity * 20;
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
    centerGradient.addColorStop(0, `hsla(${this.hueBase}, 95%, 80%, 1)`);
    centerGradient.addColorStop(
      0.7,
      `hsla(${this.hueBase + 60}, 90%, 70%, 0.7)`,
    );
    centerGradient.addColorStop(1, `hsla(${this.hueBase + 120}, 85%, 60%, 0)`);

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderDragonEye(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const eyeWidth = Math.min(this.width, this.height) * 0.4;
    const eyeHeight = eyeWidth * 0.6;

    ctx.fillStyle = `hsla(${this.hueBase + 30}, 40%, 90%, 0.9)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    const irisRadius = eyeHeight * 0.7;
    const irisGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, irisRadius);
    irisGradient.addColorStop(0, `hsla(${this.hueBase + 40}, 80%, 60%, 1)`);
    irisGradient.addColorStop(0.6, `hsla(${this.hueBase + 20}, 85%, 55%, 1)`);
    irisGradient.addColorStop(1, `hsla(${this.hueBase}, 70%, 40%, 1)`);

    ctx.fillStyle = irisGradient;
    ctx.beginPath();
    ctx.arc(0, 0, irisRadius, 0, Math.PI * 2);
    ctx.fill();

    const scaleCount = 12;
    for (let i = 0; i < scaleCount; i++) {
      const angle = (Math.PI * 2 * i) / scaleCount + this.time * 0.001;
      const scaleRadius = irisRadius * 0.4;

      ctx.save();
      ctx.rotate(angle);

      ctx.strokeStyle = `hsla(${this.hueBase + i * 10}, 90%, 65%, ${0.3 + midIntensity * 0.2})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(scaleRadius, 0);
      ctx.stroke();

      ctx.restore();
    }

    const pupilWidth = 8 + bassIntensity * 6;
    const pupilHeight = irisRadius * 1.5 * (0.7 + audioIntensity * 0.3);

    ctx.fillStyle = `hsla(0, 0%, 5%, 1)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, pupilWidth, pupilHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `hsla(${this.hueBase}, 85%, 50%, 0.9)`;
    ctx.lineWidth = 4 + bassIntensity * 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private renderAncientGlyphs(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const glyphs = [
      "ᚠ",
      "ᚢ",
      "ᚦ",
      "ᚨ",
      "ᚱ",
      "ᚲ",
      "ᚷ",
      "ᚹ",
      "☥",
      "☦",
      "☧",
      "☨",
      "☩",
      "☪",
      "☫",
      "☬",
    ];
    const radius = Math.min(this.width, this.height) * 0.35;
    const glyphCount = 16;

    for (let i = 0; i < glyphCount; i++) {
      const angle = (Math.PI * 2 * i) / glyphCount + this.time * 0.002;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const glyphIndex = i % glyphs.length;
      const rotation = this.time * 0.003 * (i % 2 === 0 ? 1 : -1);
      const scale =
        1 + Math.sin(this.time * 0.005 + i) * 0.2 + trebleIntensity * 0.3;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      const hue = (this.hueBase + i * 20) % 360;
      ctx.fillStyle = `hsla(${hue}, 95%, 80%, ${0.9 + audioIntensity * 0.1})`;
      ctx.font = `${radius * 0.15}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyphs[glyphIndex] ?? "", 0, 0);

      ctx.restore();
    }

    ctx.fillStyle = `hsla(${this.hueBase}, 100%, 85%, ${0.9 + audioIntensity * 0.1})`;
    ctx.font = `${radius * 0.2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☯", 0, 0);

    ctx.restore();
  }

  private renderTimeWheel(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const outerRadius = Math.min(this.width, this.height) * 0.4;
    const rings = 5;

    for (let ring = 0; ring < rings; ring++) {
      const radius = outerRadius * ((ring + 1) / rings);
      const segments = 12 * (ring + 1);
      const rotation =
        this.time * 0.001 * (ring % 2 === 0 ? 1 : -1) * (ring + 1);

      ctx.save();
      ctx.rotate(rotation);

      for (let seg = 0; seg < segments; seg++) {
        const angle = (Math.PI * 2 * seg) / segments;
        const nextAngle = (Math.PI * 2 * (seg + 1)) / segments;

        const hue = (this.hueBase + seg * (360 / segments) + ring * 20) % 360;
        const alpha =
          0.4 +
          Math.sin(this.time * 0.005 + seg + ring) * 0.2 +
          midIntensity * 0.2;

        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, nextAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `hsla(${hue}, 85%, 70%, ${alpha})`;
        ctx.lineWidth = 1 + (ring === rings - 1 ? bassIntensity * 2 : 0);
        ctx.stroke();
      }

      ctx.restore();
    }

    const markers = 12;
    for (let i = 0; i < markers; i++) {
      const angle = (Math.PI * 2 * i) / markers - Math.PI / 2;
      const x = Math.cos(angle) * outerRadius * 0.85;
      const y = Math.sin(angle) * outerRadius * 0.85;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);

      const markerHue = (this.hueBase + i * 30) % 360;
      ctx.fillStyle = `hsla(${markerHue}, 90%, 75%, ${0.9 + audioIntensity * 0.1})`;
      ctx.font = `${outerRadius * 0.08}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((i + 1).toString(), 0, 0);

      ctx.restore();
    }

    const centerGlow = 15 + bassIntensity * 10;
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerGlow);
    centerGradient.addColorStop(0, `hsla(${this.hueBase + 180}, 100%, 90%, 1)`);
    centerGradient.addColorStop(1, `hsla(${this.hueBase + 180}, 100%, 90%, 0)`);

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderAstralProjection(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const bodySize = Math.min(this.width, this.height) * 0.15;
    const astralOffset = Math.sin(this.time * 0.002) * 50 + bassIntensity * 30;

    ctx.save();
    ctx.translate(0, astralOffset);
    ctx.globalAlpha = 0.4 + Math.sin(this.time * 0.003) * 0.1;

    ctx.fillStyle = `hsla(${this.hueBase}, 60%, 50%, 0.6)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, bodySize * 0.6, bodySize, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -bodySize * 0.8, bodySize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = `hsla(${this.hueBase + 180}, 80%, 75%, ${0.5 + trebleIntensity * 0.3})`;
    ctx.lineWidth = 2 + bassIntensity * 2;
    ctx.setLineDash([5, 10]);

    ctx.beginPath();
    ctx.moveTo(0, astralOffset);

    const controlPoints = 5;
    for (let i = 0; i <= controlPoints; i++) {
      const progress = i / controlPoints;
      const x = Math.sin(progress * Math.PI * 2 + this.time * 0.005) * 20;
      const y = astralOffset - progress * astralOffset;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.globalAlpha =
      0.7 + Math.sin(this.time * 0.004) * 0.2 + audioIntensity * 0.2;

    const astralGlow = bodySize * 2;
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, astralGlow);
    glowGradient.addColorStop(0, `hsla(${this.hueBase + 240}, 90%, 75%, 0.6)`);
    glowGradient.addColorStop(
      0.5,
      `hsla(${this.hueBase + 200}, 85%, 70%, 0.3)`,
    );
    glowGradient.addColorStop(1, `hsla(${this.hueBase + 160}, 80%, 65%, 0)`);

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, astralGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsla(${this.hueBase + 240}, 90%, 80%, 0.8)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, bodySize * 0.6, bodySize, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -bodySize * 0.8, bodySize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }

  private renderEthericField(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const layers = 8;
    const maxRadius = Math.min(this.width, this.height) * 0.45;

    for (let layer = 0; layer < layers; layer++) {
      const radius = (maxRadius / layers) * (layer + 1);
      const hue = (this.hueBase + layer * 45) % 360;
      const waveCount = 8 + layer * 2;
      const waveAmplitude = 10 + bassIntensity * 8;

      ctx.beginPath();

      for (let i = 0; i <= 100; i++) {
        const progress = i / 100;
        const angle = progress * Math.PI * 2;

        const wave =
          Math.sin(angle * waveCount + this.time * 0.003 * layer) *
          waveAmplitude;
        const r = radius + wave + Math.sin(this.time * 0.002 + layer) * 5;

        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        0,
        0,
        radius * 0.8,
        0,
        0,
        radius * 1.2,
      );
      gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0)`);
      gradient.addColorStop(
        0.5,
        `hsla(${hue}, 85%, 65%, ${0.15 + midIntensity * 0.1})`,
      );
      gradient.addColorStop(1, `hsla(${hue}, 90%, 70%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${0.4 + audioIntensity * 0.2})`;
      ctx.lineWidth = 1 + (layer === layers - 1 ? bassIntensity * 2 : 0);
      ctx.stroke();
    }

    const coreSize = 25 + bassIntensity * 15;
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
    coreGradient.addColorStop(0, `hsla(${this.hueBase}, 100%, 90%, 1)`);
    coreGradient.addColorStop(0.5, `hsla(${this.hueBase + 60}, 90%, 75%, 0.8)`);
    coreGradient.addColorStop(1, `hsla(${this.hueBase + 120}, 80%, 60%, 0)`);

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderPlatonic(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const solids = [
      { sides: 3, hue: 0 },
      { sides: 4, hue: 72 },
      { sides: 3, hue: 144 },
      { sides: 5, hue: 216 },
      { sides: 3, hue: 288 },
    ];

    const arrangementRadius = Math.min(this.width, this.height) * 0.28;

    solids.forEach((solid, index) => {
      const angle = (Math.PI * 2 * index) / solids.length - Math.PI / 2;
      const x = Math.cos(angle) * arrangementRadius;
      const y = Math.sin(angle) * arrangementRadius;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.time * 0.002 * (index % 2 === 0 ? 1 : -1));

      const size =
        60 + Math.sin(this.time * 0.005 + index) * 10 + bassIntensity * 15;
      const hue = (this.hueBase + solid.hue) % 360;

      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.8 + midIntensity * 0.2})`;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${0.2 + audioIntensity * 0.1})`;
      ctx.lineWidth = 2 + bassIntensity * 2;

      ctx.beginPath();
      for (let i = 0; i <= solid.sides; i++) {
        const polyAngle = (Math.PI * 2 * i) / solid.sides;
        const px = Math.cos(polyAngle) * size;
        const py = Math.sin(polyAngle) * size;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });

    const centerSize = 20 + bassIntensity * 10;
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
    centerGradient.addColorStop(0, `hsla(${this.hueBase}, 100%, 90%, 1)`);
    centerGradient.addColorStop(1, `hsla(${this.hueBase}, 100%, 90%, 0)`);

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderInfinityKnot(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const size = Math.min(this.width, this.height) * 0.35;
    const lineWidth = 8 + bassIntensity * 6;

    const weave = (t: number, offset: number) => {
      const x = (size * Math.cos(t + offset)) / (1 + Math.sin(t + offset) ** 2);
      const y =
        (size * Math.sin(t + offset) * Math.cos(t + offset)) /
        (1 + Math.sin(t + offset) ** 2);
      return { x, y };
    };

    for (let layer = 0; layer < 3; layer++) {
      const offset = (Math.PI * 2 * layer) / 3 + this.time * 0.002;
      const hue = (this.hueBase + layer * 120) % 360;

      ctx.beginPath();
      for (let t = 0; t <= Math.PI * 2; t += 0.01) {
        const pos = weave(t, offset);
        if (t === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      }

      const gradient = ctx.createLinearGradient(-size, 0, size, 0);
      gradient.addColorStop(
        0,
        `hsla(${hue}, 90%, 70%, ${0.7 + trebleIntensity * 0.2})`,
      );
      gradient.addColorStop(
        0.5,
        `hsla(${hue + 30}, 95%, 75%, ${0.9 + audioIntensity * 0.1})`,
      );
      gradient.addColorStop(
        1,
        `hsla(${hue + 60}, 90%, 70%, ${0.7 + trebleIntensity * 0.2})`,
      );

      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderCosmicLotus(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const petalLayers = 5;
    const maxRadius = Math.min(this.width, this.height) * 0.4;

    for (let layer = petalLayers - 1; layer >= 0; layer--) {
      const petalsInLayer = 8 + layer * 2;
      const layerRadius = (maxRadius / petalLayers) * (layer + 1);
      const rotation = this.time * 0.001 * (layer % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.rotate(rotation);

      for (let petal = 0; petal < petalsInLayer; petal++) {
        const angle = (Math.PI * 2 * petal) / petalsInLayer;
        const hue =
          (this.hueBase + layer * 30 + petal * (360 / petalsInLayer)) % 360;

        ctx.save();
        ctx.rotate(angle);

        const petalWidth = layerRadius * 0.3;
        const petalLength = layerRadius * 0.6;
        const petalScale =
          1 + Math.sin(this.time * 0.005 + petal) * 0.1 + midIntensity * 0.15;

        ctx.scale(petalScale, petalScale);

        const petalGradient = ctx.createRadialGradient(
          0,
          petalLength * 0.3,
          0,
          0,
          petalLength * 0.3,
          petalWidth,
        );
        petalGradient.addColorStop(
          0,
          `hsla(${hue}, 90%, 75%, ${0.9 + audioIntensity * 0.1})`,
        );
        petalGradient.addColorStop(0.6, `hsla(${hue}, 85%, 65%, 0.8)`);
        petalGradient.addColorStop(1, `hsla(${hue}, 80%, 55%, 0.3)`);

        ctx.fillStyle = petalGradient;

        ctx.beginPath();
        ctx.ellipse(
          0,
          petalLength * 0.5,
          petalWidth * 0.4,
          petalLength * 0.5,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        ctx.strokeStyle = `hsla(${hue}, 90%, 80%, ${0.6 + bassIntensity * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();
    }

    const seedSize = maxRadius * 0.15 + bassIntensity * 10;

    const seedGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, seedSize);
    seedGradient.addColorStop(0, `hsla(${this.hueBase + 60}, 100%, 90%, 1)`);
    seedGradient.addColorStop(0.7, `hsla(${this.hueBase + 30}, 90%, 75%, 0.9)`);
    seedGradient.addColorStop(1, `hsla(${this.hueBase}, 80%, 60%, 0.7)`);

    ctx.fillStyle = seedGradient;
    ctx.beginPath();
    ctx.arc(0, 0, seedSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderVoidMandala(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const rings = 8;
    const maxRadius = Math.min(this.width, this.height) * 0.42;

    for (let ring = 0; ring < rings; ring++) {
      const radius = (maxRadius / rings) * (ring + 1);
      const segments = 6 + ring * 3;
      const rotation = this.time * 0.001 * (ring % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.rotate(rotation);

      for (let seg = 0; seg < segments; seg++) {
        const angle = (Math.PI * 2 * seg) / segments;
        const nextAngle = (Math.PI * 2 * (seg + 1)) / segments;

        const hue = (this.hueBase + 240 + ring * 10 + seg * 5) % 360;
        const lightness =
          20 + ring * 5 + Math.sin(this.time * 0.005 + seg) * 10;
        const alpha =
          0.5 +
          Math.sin(this.time * 0.003 + ring + seg) * 0.2 +
          midIntensity * 0.2;

        ctx.strokeStyle = `hsla(${hue}, 70%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = 2 + (ring === rings - 1 ? bassIntensity * 3 : 0);

        ctx.beginPath();
        ctx.arc(0, 0, radius, angle, nextAngle);
        ctx.stroke();

        if (seg % 2 === 0) {
          const midAngle = (angle + nextAngle) / 2;
          const innerRadius = ring > 0 ? (maxRadius / rings) * ring : 0;

          ctx.beginPath();
          ctx.moveTo(
            Math.cos(midAngle) * innerRadius,
            Math.sin(midAngle) * innerRadius,
          );
          ctx.lineTo(Math.cos(midAngle) * radius, Math.sin(midAngle) * radius);
          ctx.stroke();

          const symbolX = Math.cos(midAngle) * radius;
          const symbolY = Math.sin(midAngle) * radius;
          const symbolSize = 4 + bassIntensity * 3;

          ctx.fillStyle = `hsla(${hue}, 90%, 70%, ${alpha})`;
          ctx.beginPath();
          ctx.arc(symbolX, symbolY, symbolSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    const voidSize = maxRadius * 0.2;

    ctx.strokeStyle = `hsla(${this.hueBase + 280}, 90%, 60%, ${0.8 + audioIntensity * 0.2})`;
    ctx.lineWidth = 3 + bassIntensity * 4;
    ctx.setLineDash([5, 3]);

    ctx.beginPath();
    ctx.arc(0, 0, voidSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const innerVoid = ctx.createRadialGradient(0, 0, 0, 0, 0, voidSize);
    innerVoid.addColorStop(0, `hsla(${this.hueBase + 280}, 50%, 5%, 1)`);
    innerVoid.addColorStop(0.8, `hsla(${this.hueBase + 270}, 60%, 10%, 0.9)`);
    innerVoid.addColorStop(1, `hsla(${this.hueBase + 260}, 70%, 20%, 0.5)`);

    ctx.fillStyle = innerVoid;
    ctx.beginPath();
    ctx.arc(0, 0, voidSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderStellarMap(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const starCount = 50;
    const maxRadius = Math.min(this.width, this.height) * 0.45;

    // Initialize stars once instead of every frame to prevent flickering
    if (this.stellarMapStars.length !== starCount) {
      this.stellarMapStars = [];
      for (let i = 0; i < starCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * maxRadius;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const size = 2 + Math.random() * 4;
        const hue = (this.hueBase + Math.random() * 60) % 360;

        this.stellarMapStars.push({ x, y, size, hue });
      }
    }

    const stars = this.stellarMapStars;

    ctx.strokeStyle = `hsla(${this.hueBase + 180}, 70%, 65%, ${0.3 + trebleIntensity * 0.2})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);

    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const distance = Math.hypot(
          stars[i]!.x - stars[j]!.x,
          stars[i]!.y - stars[j]!.y,
        );

        if (distance < maxRadius * 0.25) {
          ctx.beginPath();
          ctx.moveTo(stars[i]!.x, stars[i]!.y);
          ctx.lineTo(stars[j]!.x, stars[j]!.y);
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);

    stars.forEach((star, index) => {
      const twinkle =
        Math.sin(this.time * 0.005 + index) * 0.3 + 0.7 + audioIntensity * 0.2;
      const dynamicSize = star.size + bassIntensity * 3;

      const glowSize = dynamicSize * 3;
      const glowGradient = ctx.createRadialGradient(
        star.x,
        star.y,
        0,
        star.x,
        star.y,
        glowSize,
      );
      glowGradient.addColorStop(
        0,
        `hsla(${star.hue}, 90%, 80%, ${twinkle * 0.8})`,
      );
      glowGradient.addColorStop(
        0.5,
        `hsla(${star.hue}, 85%, 70%, ${twinkle * 0.4})`,
      );
      glowGradient.addColorStop(1, `hsla(${star.hue}, 80%, 60%, 0)`);

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${star.hue}, 100%, 90%, ${twinkle})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, dynamicSize, 0, Math.PI * 2);
      ctx.fill();
    });

    const centerSize = 25 + bassIntensity * 15;
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
    centerGradient.addColorStop(0, `hsla(${this.hueBase + 40}, 100%, 85%, 1)`);
    centerGradient.addColorStop(
      0.5,
      `hsla(${this.hueBase + 20}, 95%, 75%, 0.9)`,
    );
    centerGradient.addColorStop(1, `hsla(${this.hueBase}, 90%, 65%, 0)`);

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderWyrdWeb(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.4;
    const norns = 3;

    for (let norn = 0; norn < norns; norn++) {
      const angle = (Math.PI * 2 * norn) / norns - Math.PI / 2;
      const hue = (this.hueBase + norn * 120) % 360;

      ctx.save();
      ctx.rotate(angle);

      const gradient = ctx.createLinearGradient(0, 0, 0, maxRadius);
      gradient.addColorStop(
        0,
        `hsla(${hue}, 80%, 60%, ${0.8 + audioIntensity * 0.2})`,
      );
      gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0.3)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4 + bassIntensity * 4;
      ctx.lineCap = "round";

      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const progress = i / 50;
        const y = progress * maxRadius;
        const waveX = Math.sin(progress * Math.PI * 4 + this.time * 0.003) * 20;

        if (i === 0) ctx.moveTo(waveX, y);
        else ctx.lineTo(waveX, y);
      }
      ctx.stroke();

      ctx.restore();
    }

    const webLayers = 6;
    for (let layer = 1; layer <= webLayers; layer++) {
      const radius = (maxRadius / webLayers) * layer;
      const segments = norns * 4;

      ctx.strokeStyle = `hsla(${this.hueBase + layer * 20}, 75%, 65%, ${0.4 + midIntensity * 0.2})`;
      ctx.lineWidth = 1 + (layer === webLayers ? bassIntensity * 2 : 0);

      ctx.beginPath();
      for (let seg = 0; seg <= segments; seg++) {
        const angle = (Math.PI * 2 * seg) / segments;
        const waveRadius =
          radius + Math.sin(angle * 3 + this.time * 0.002) * 10;
        const x = Math.cos(angle) * waveRadius;
        const y = Math.sin(angle) * waveRadius;

        if (seg === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    const wellSize = 40 + bassIntensity * 20;
    const wellGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, wellSize);
    wellGradient.addColorStop(0, `hsla(${this.hueBase}, 70%, 30%, 1)`);
    wellGradient.addColorStop(0.6, `hsla(${this.hueBase + 30}, 80%, 50%, 0.8)`);
    wellGradient.addColorStop(1, `hsla(${this.hueBase + 60}, 90%, 70%, 0.3)`);

    ctx.fillStyle = wellGradient;
    ctx.beginPath();
    ctx.arc(0, 0, wellSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderSpiritualGateway(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const gatewayHeight = Math.min(this.width, this.height) * 0.7;
    const gatewayWidth = gatewayHeight * 0.5;
    const archRadius = gatewayWidth / 2;
    const pillarHeight = gatewayHeight * 0.6;
    const pillarWidth = archRadius * 0.3;

    ctx.save();
    ctx.translate(-archRadius - pillarWidth / 2, pillarHeight / 2);

    const leftPillarGradient = ctx.createLinearGradient(
      -pillarWidth / 2,
      0,
      pillarWidth / 2,
      0,
    );
    leftPillarGradient.addColorStop(0, `hsla(${this.hueBase}, 70%, 50%, 0.3)`);
    leftPillarGradient.addColorStop(
      0.5,
      `hsla(${this.hueBase + 20}, 80%, 60%, ${0.7 + bassIntensity * 0.2})`,
    );
    leftPillarGradient.addColorStop(
      1,
      `hsla(${this.hueBase + 40}, 70%, 50%, 0.3)`,
    );

    ctx.fillStyle = leftPillarGradient;
    ctx.fillRect(
      -pillarWidth / 2,
      -pillarHeight / 2,
      pillarWidth,
      pillarHeight,
    );

    ctx.restore();

    ctx.save();
    ctx.translate(archRadius + pillarWidth / 2, pillarHeight / 2);

    ctx.fillStyle = leftPillarGradient;
    ctx.fillRect(
      -pillarWidth / 2,
      -pillarHeight / 2,
      pillarWidth,
      pillarHeight,
    );

    ctx.restore();

    ctx.save();
    ctx.translate(0, -pillarHeight / 2);

    ctx.strokeStyle = `hsla(${this.hueBase + 30}, 85%, 65%, ${0.8 + audioIntensity * 0.2})`;
    ctx.lineWidth = pillarWidth * 0.8;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.arc(0, 0, archRadius, Math.PI, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    const portalCenterY = 0;
    const portalRadius = archRadius * 0.85;

    const portalLayers = 8;
    for (let layer = 0; layer < portalLayers; layer++) {
      const layerRadius =
        (portalRadius / portalLayers) * (portalLayers - layer);
      const rotation =
        this.time * 0.002 * (layer % 2 === 0 ? 1 : -1) * (layer + 1);

      ctx.save();
      ctx.translate(0, portalCenterY);
      ctx.rotate(rotation);

      const hue = (this.hueBase + 120 + layer * 30) % 360;
      const alpha = 0.15 + (layer / portalLayers) * 0.3 + midIntensity * 0.2;

      const layerGradient = ctx.createRadialGradient(
        0,
        0,
        0,
        0,
        0,
        layerRadius,
      );
      layerGradient.addColorStop(0, `hsla(${hue}, 90%, 70%, 0)`);
      layerGradient.addColorStop(0.5, `hsla(${hue}, 85%, 65%, ${alpha})`);
      layerGradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0)`);

      ctx.fillStyle = layerGradient;
      ctx.beginPath();
      ctx.arc(0, 0, layerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    const centerLight = 30 + bassIntensity * 25;
    const centerGradient = ctx.createRadialGradient(
      0,
      portalCenterY,
      0,
      0,
      portalCenterY,
      centerLight,
    );
    centerGradient.addColorStop(
      0,
      `hsla(${this.hueBase + 180}, 100%, 95%, ${0.9 + audioIntensity * 0.1})`,
    );
    centerGradient.addColorStop(
      0.4,
      `hsla(${this.hueBase + 160}, 95%, 85%, 0.7)`,
    );
    centerGradient.addColorStop(
      0.7,
      `hsla(${this.hueBase + 140}, 90%, 75%, 0.4)`,
    );
    centerGradient.addColorStop(1, `hsla(${this.hueBase + 120}, 85%, 65%, 0)`);

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, portalCenterY, centerLight, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderAkashicRecords(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const bookWidth = Math.min(this.width, this.height) * 0.5;
    const bookHeight = bookWidth * 1.3;

    const coverGradient = ctx.createLinearGradient(
      -bookWidth / 2,
      0,
      bookWidth / 2,
      0,
    );
    coverGradient.addColorStop(0, `hsla(${this.hueBase}, 60%, 30%, 0.9)`);
    coverGradient.addColorStop(0.5, `hsla(${this.hueBase + 30}, 70%, 40%, 1)`);
    coverGradient.addColorStop(1, `hsla(${this.hueBase + 60}, 60%, 30%, 0.9)`);

    ctx.fillStyle = coverGradient;
    ctx.fillRect(-bookWidth / 2, -bookHeight / 2, bookWidth, bookHeight);

    ctx.strokeStyle = `hsla(${this.hueBase + 40}, 80%, 60%, ${0.8 + audioIntensity * 0.2})`;
    ctx.lineWidth = 4 + bassIntensity * 3;
    ctx.strokeRect(
      -bookWidth / 2 + 10,
      -bookHeight / 2 + 10,
      bookWidth - 20,
      bookHeight - 20,
    );

    const circleRadius = bookHeight * 0.05;
    ctx.strokeStyle = `hsla(${this.hueBase + 60}, 90%, 70%, ${0.6 + trebleIntensity * 0.3})`;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, 0, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const x = Math.cos(angle) * circleRadius;
      const y = Math.sin(angle) * circleRadius;

      ctx.beginPath();
      ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = `hsla(${this.hueBase + 180}, 95%, 80%, ${0.9 + audioIntensity * 0.1})`;
    ctx.font = `${bookHeight * 0.08}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("∞ AKASHA ∞", 0, -bookHeight * 0.35);

    const textLines = 8;
    const textStartY = -bookHeight * 0.15;
    const lineHeight = (bookHeight * 0.5) / textLines;

    for (let line = 0; line < textLines; line++) {
      const y = textStartY + line * lineHeight;
      const lineAlpha =
        0.4 + Math.sin(this.time * 0.003 + line) * 0.2 + trebleIntensity * 0.2;

      ctx.fillStyle = `hsla(${this.hueBase + 180}, 90%, 75%, ${lineAlpha})`;
      ctx.font = `${bookHeight * 0.04}px monospace`;

      const symbols = "⚹⚺⚻⚼☉☊☋☌☍⊕⊗⊙";
      let textLine = "";
      for (let i = 0; i < 15; i++) {
        textLine +=
          symbols[((this.time * 0.001 + line + i) % symbols.length) | 0];
      }

      ctx.fillText(textLine, 0, y);
    }

    ctx.restore();
  }

  private renderSacredGeometry(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.42;

    ctx.strokeStyle = `hsla(${this.hueBase}, 80%, 65%, ${0.7 + audioIntensity * 0.2})`;
    ctx.lineWidth = 2 + bassIntensity * 2;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `hsla(${this.hueBase + 60}, 85%, 70%, ${0.7 + midIntensity * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
      const x = Math.cos(angle) * maxRadius * 0.85;
      const y = Math.sin(angle) * maxRadius * 0.85;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const triangleRadius = maxRadius * 0.65;
    ctx.strokeStyle = `hsla(${this.hueBase + 120}, 90%, 75%, ${0.7 + bassIntensity * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const angle = (Math.PI * 2 * i) / 3 - Math.PI / 2;
      const x = Math.cos(angle) * triangleRadius;
      const y = Math.sin(angle) * triangleRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = `hsla(${this.hueBase + 180}, 90%, 75%, ${0.7 + bassIntensity * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const angle = (Math.PI * 2 * i) / 3 + Math.PI / 2;
      const x = Math.cos(angle) * triangleRadius;
      const y = Math.sin(angle) * triangleRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const seedRadius = maxRadius * 0.3;
    ctx.strokeStyle = `hsla(${this.hueBase + 240}, 85%, 70%, ${0.5 + midIntensity * 0.2})`;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(0, 0, seedRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const x = Math.cos(angle) * seedRadius;
      const y = Math.sin(angle) * seedRadius;

      ctx.beginPath();
      ctx.arc(x, y, seedRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    const coreSize = 20 + bassIntensity * 15;
    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
    coreGradient.addColorStop(0, `hsla(${this.hueBase}, 100%, 95%, 1)`);
    coreGradient.addColorStop(0.4, `hsla(${this.hueBase + 40}, 95%, 85%, 0.9)`);
    coreGradient.addColorStop(0.7, `hsla(${this.hueBase + 80}, 90%, 75%, 0.6)`);
    coreGradient.addColorStop(1, `hsla(${this.hueBase + 120}, 85%, 65%, 0)`);

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderShadowRealm(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = (this.width < this.height ? this.width : this.height) * 0.45;
    const layers = 16;
    const t = this.time | 0;
    const bass = (bassIntensity * 8) | 0;
    const treb = (trebleIntensity * 6) | 0;

    for (let layer = 0; layer < layers; layer++) {
      const radius = (maxRadius * (layer + 1)) / layers;
      const segments = (8 + (layer << 1)) | 0;
      const rotSign = ((layer & 1) << 1) - 1;
      const rotation = (t * 0.0012 * rotSign * (1 + bassIntensity)) | 0;

      ctx.save();
      ctx.rotate(rotation);

      for (let i = 0; i < segments; i++) {
        const angle = (Math.PI * 2 * i) / segments;
        const nextAngle = (Math.PI * 2 * (i + 1)) / segments;

        const hue = (this.hueBase + 270 + (layer * 3)) & 359;
        const lightness = (15 + Math.sin(t * 0.006 + layer + i) * 12) | 0;
        const alpha = 0.5 + Math.sin(t * 0.0045 + i) * 0.3 + trebleIntensity * 0.5;

        ctx.strokeStyle = `hsla(${hue}, 70%, ${lightness}%, ${alpha})`;
        ctx.lineWidth = 2.5 + ((layer === (layers - 1)) ? bass : 0);
        ctx.shadowBlur = (20 + bass) | 0;
        ctx.shadowColor = `hsla(${hue}, 90%, 30%, 0.9)`;

        ctx.beginPath();
        ctx.arc(0, 0, radius, angle, nextAngle);
        ctx.stroke();

        if ((i & 3) === 0) {
          const midAngle = (angle + nextAngle) * 0.5;
          const shadowX = Math.cos(midAngle) * radius;
          const shadowY = Math.sin(midAngle) * radius;

          ctx.fillStyle = `hsla(${hue}, 80%, 20%, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(shadowX, shadowY, (4 + bass) | 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    const voidCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.3);
    voidCore.addColorStop(0, `hsla(${this.hueBase + 280}, 50%, 5%, ${0.95 + audioIntensity * 0.15})`);
    voidCore.addColorStop(0.5, `hsla(${this.hueBase + 270}, 60%, 8%, ${0.7 + audioIntensity * 0.3})`);
    voidCore.addColorStop(1, `hsla(${this.hueBase + 260}, 70%, 12%, 0)`);

    ctx.fillStyle = voidCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderQuantumEntanglement(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const particlePairs = 24;
    const maxRadius = (this.width < this.height ? this.width : this.height) * 0.4;
    const t = this.time | 0;
    const bass = (bassIntensity * 4) | 0;
    const mid = (midIntensity * 5) | 0;

    for (let i = 0; i < particlePairs; i++) {
      const angle1 = (Math.PI * 2 * i) / particlePairs + t * 0.0015;
      const angle2 = angle1 + Math.PI + Math.sin(t * 0.003 + i) * 0.4;

      const radius1 = maxRadius * (0.3 + Math.sin(t * 0.0045 + i) * 0.25);
      const radius2 = maxRadius * (0.3 + Math.sin(t * 0.0045 + i + Math.PI) * 0.25);

      const x1 = Math.cos(angle1) * radius1;
      const y1 = Math.sin(angle1) * radius1;
      const x2 = Math.cos(angle2) * radius2;
      const y2 = Math.sin(angle2) * radius2;

      const hue = (this.hueBase + 180 + (i << 2) + (i << 1)) & 359;
      const alpha = 0.8 + midIntensity * 0.4;

      ctx.strokeStyle = `hsla(${hue}, 95%, 75%, ${alpha})`;
      ctx.lineWidth = (3 + bass) | 0;
      ctx.shadowBlur = 30;
      ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.8)`;

      const dx = x2 - x1;
      const dy = y2 - y1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(
        x1 + dx * 0.3,
        y1 + dy * 0.3,
        x2 - dx * 0.3,
        y2 - dy * 0.3,
        x2,
        y2,
      );
      ctx.stroke();

      const size1 = (6 + bass) | 0;
      const size2 = (6 + mid) | 0;

      ctx.fillStyle = `hsla(${hue}, 100%, 85%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x1, y1, size1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${(hue + 60) & 359}, 100%, 85%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x2, y2, size2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderNecromanticSigil(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = (this.width < this.height ? this.width : this.height) * 0.42;
    const sigilPoints = 17;
    const t = this.time | 0;
    const bass = (bassIntensity * 3) | 0;
    const hue1 = (this.hueBase + 320) & 359;
    const hue2 = (this.hueBase + 340) & 359;

    ctx.strokeStyle = `hsla(${hue1}, 90%, 40%, ${0.9 + audioIntensity * 0.3})`;
    ctx.lineWidth = (3 + bass) | 0;
    ctx.shadowBlur = 35;
    ctx.shadowColor = `hsla(${hue1}, 100%, 45%, 0.95)`;

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < sigilPoints; i++) {
      const angle = (Math.PI * 2 * i) / sigilPoints - Math.PI / 2;
      const radius = maxRadius * (0.7 + Math.sin(t * 0.003 + i) * 0.15);
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    }

    for (let i = 0; i < sigilPoints; i++) {
      for (let j = (i + 1) | 0; j < sigilPoints; j++) {
        if (((i + j) & 3) === 0) {
          const pointI = points[i];
          const pointJ = points[j];
          if (pointI && pointJ) {
            ctx.beginPath();
            ctx.moveTo(pointI.x, pointI.y);
            ctx.lineTo(pointJ.x, pointJ.y);
            ctx.stroke();
          }
        }
      }
    }

    ctx.strokeStyle = `hsla(${hue2}, 95%, 50%, ${0.95 + midIntensity * 0.2})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i <= sigilPoints; i++) {
      const angle = (Math.PI * 2 * i) / sigilPoints - Math.PI / 2;
      const radius = maxRadius * 0.85;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const centerSize = (20 + bass * 2) | 0;
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
    centerGradient.addColorStop(0, `hsla(${hue1}, 100%, 55%, 1)`);
    centerGradient.addColorStop(0.5, `hsla(${(hue1 + 10) & 359}, 95%, 45%, 0.9)`);
    centerGradient.addColorStop(1, `hsla(${hue2}, 85%, 35%, 0)`);

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderDimensionalRift(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = (this.width < this.height ? this.width : this.height) * 0.48;
    const riftCount = 12;
    const t = this.time | 0;
    const bass = (bassIntensity * 4) | 0;
    const treb = (trebleIntensity * 5) | 0;

    for (let rift = 0; rift < riftCount; rift++) {
      const angle = (Math.PI * 2 * rift) / riftCount + t * 0.0015;
      const distortion = Math.sin(t * 0.0075 + rift) * 0.4;
      const width = (25 + bass * 2) | 0;

      const hue1 = (this.hueBase + 200 + (rift << 4) + (rift << 2)) & 359;
      const hue2 = (hue1 + 20) & 359;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosAD = Math.cos(angle + distortion);
      const sinAD = Math.sin(angle + distortion);
      const gradient = ctx.createLinearGradient(
        cosA * maxRadius * 0.2,
        sinA * maxRadius * 0.2,
        cosAD * maxRadius,
        sinAD * maxRadius,
      );
      gradient.addColorStop(0, `hsla(${hue1}, 100%, 65%, ${0.5 + treb * 0.05})`);
      gradient.addColorStop(0.5, `hsla(${hue2}, 100%, 75%, ${0.7 + audioIntensity * 0.4})`);
      gradient.addColorStop(1, `hsla(${hue1}, 100%, 55%, ${0.3 + treb * 0.03})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = width;
      ctx.shadowBlur = 40;
      ctx.shadowColor = `hsla(${hue1}, 100%, 65%, 0.9)`;

      ctx.beginPath();
      ctx.moveTo(cosA * maxRadius * 0.2, sinA * maxRadius * 0.2);
      ctx.lineTo(cosAD * maxRadius, sinAD * maxRadius);
      ctx.stroke();
    }

    const centerRift = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.25);
    centerRift.addColorStop(0, `hsla(${(this.hueBase + 210) & 359}, 100%, 85%, ${0.95 + audioIntensity * 0.2})`);
    centerRift.addColorStop(0.7, `hsla(${(this.hueBase + 200) & 359}, 100%, 65%, ${0.6 + bassIntensity * 0.4})`);
    centerRift.addColorStop(1, `hsla(${(this.hueBase + 190) & 359}, 100%, 45%, 0)`);

    ctx.fillStyle = centerRift;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderChaosVortex(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = (this.width < this.height ? this.width : this.height) * 0.45;
    const spirals = 7;
    const pointsPerSpiral = 256;
    const t = this.time | 0;
    const bass = (bassIntensity * 3) | 0;
    const mid = (midIntensity * 4) | 0;

    for (let spiral = 0; spiral < spirals; spiral++) {
      const spiralOffset = (Math.PI * 2 * spiral) / spirals;
      const hue = (this.hueBase + 30 + (spiral << 6) + (spiral << 3)) & 359;
      const rotSign = ((spiral & 1) << 1) - 1;

      ctx.strokeStyle = `hsla(${hue}, 100%, 55%, ${0.6 + midIntensity * 0.4})`;
      ctx.lineWidth = (2.5 + bass) | 0;
      ctx.shadowBlur = 25;
      ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.8)`;

      ctx.beginPath();
      for (let i = 0; i < pointsPerSpiral; i++) {
        const tVal = i / pointsPerSpiral;
        const angle = tVal * Math.PI * 8 + spiralOffset + t * 0.003 * rotSign;
        const radius = maxRadius * tVal * (0.8 + Math.sin(t * 0.0045 + spiral) * 0.25);
        const chaos = Math.sin(t * 0.015 + (spiral << 1) + tVal * 10) * (1 + bassIntensity) * 7;
        const x = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * chaos;
        const y = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * chaos;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const chaosCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.2);
    chaosCore.addColorStop(0, `hsla(${(this.hueBase + 60) & 359}, 100%, 95%, ${0.95 + audioIntensity * 0.2})`);
    chaosCore.addColorStop(0.5, `hsla(${(this.hueBase + 40) & 359}, 100%, 75%, ${0.8 + bassIntensity * 0.3})`);
    chaosCore.addColorStop(1, `hsla(${(this.hueBase + 20) & 359}, 100%, 55%, 0)`);

    ctx.fillStyle = chaosCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderEtherealMist(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.5;
    const mistParticles = 80;

    for (let i = 0; i < mistParticles; i++) {
      const angle = (Math.PI * 2 * i) / mistParticles;
      const baseRadius = maxRadius * (0.2 + (i % 3) * 0.15);
      const radius = baseRadius + Math.sin(this.time * 0.002 + i * 0.1) * maxRadius * 0.1;
      const x = Math.cos(angle + this.time * 0.0005) * radius;
      const y = Math.sin(angle + this.time * 0.0005) * radius;

      const hue = (this.hueBase + 150 + i * 2) % 360;
      const size = 8 + Math.sin(this.time * 0.003 + i) * 4 + trebleIntensity * 5;
      const alpha = 0.2 + Math.sin(this.time * 0.004 + i) * 0.15 + trebleIntensity * 0.3;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `hsla(${hue}, 70%, 85%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${hue + 20}, 60%, 75%, ${alpha * 0.6})`);
      gradient.addColorStop(1, `hsla(${hue + 40}, 50%, 65%, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderBloodMoon(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.4;
    const moonRadius = maxRadius * (0.7 + Math.sin(this.time * 0.001) * 0.1);

    const moonGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, moonRadius);
    moonGradient.addColorStop(0, `hsla(${this.hueBase + 350}, 100%, 45%, ${0.95 + audioIntensity * 0.05})`);
    moonGradient.addColorStop(0.3, `hsla(${this.hueBase + 340}, 95%, 40%, ${0.9 + midIntensity * 0.1})`);
    moonGradient.addColorStop(0.7, `hsla(${this.hueBase + 330}, 90%, 35%, ${0.8 + bassIntensity * 0.1})`);
    moonGradient.addColorStop(1, `hsla(${this.hueBase + 320}, 85%, 30%, ${0.6 + audioIntensity * 0.2})`);

    ctx.fillStyle = moonGradient;
    ctx.shadowBlur = 40;
    ctx.shadowColor = `hsla(${this.hueBase + 350}, 100%, 40%, 0.9)`;
    ctx.beginPath();
    ctx.arc(0, 0, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    const shadowAngle = this.time * 0.0008;
    const shadowRadius = moonRadius * 0.6;
    const shadowGradient = ctx.createRadialGradient(
      Math.cos(shadowAngle) * shadowRadius * 0.3,
      Math.sin(shadowAngle) * shadowRadius * 0.3,
      0,
      Math.cos(shadowAngle) * shadowRadius * 0.3,
      Math.sin(shadowAngle) * shadowRadius * 0.3,
      shadowRadius * 1.5,
    );
    shadowGradient.addColorStop(0, `hsla(${this.hueBase + 10}, 80%, 15%, ${0.9 + bassIntensity * 0.1})`);
    shadowGradient.addColorStop(1, `hsla(${this.hueBase + 350}, 70%, 25%, 0)`);

    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(
      Math.cos(shadowAngle) * shadowRadius * 0.3,
      Math.sin(shadowAngle) * shadowRadius * 0.3,
      shadowRadius * 1.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    const rays = 12;
    ctx.strokeStyle = `hsla(${this.hueBase + 350}, 90%, 50%, ${0.4 + midIntensity * 0.3})`;
    ctx.lineWidth = 2 + bassIntensity * 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsla(${this.hueBase + 350}, 100%, 45%, 0.7)`;

    for (let i = 0; i < rays; i++) {
      const angle = (Math.PI * 2 * i) / rays + this.time * 0.0005;
      const rayLength = maxRadius * (0.8 + Math.sin(this.time * 0.003 + i) * 0.2);

      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * moonRadius,
        Math.sin(angle) * moonRadius,
      );
      ctx.lineTo(
        Math.cos(angle) * rayLength,
        Math.sin(angle) * rayLength,
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderDarkMatter(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.48;
    const matterParticles = 60;

    for (let i = 0; i < matterParticles; i++) {
      const angle = (Math.PI * 2 * i) / matterParticles + this.time * 0.0003;
      const baseRadius = maxRadius * (0.1 + (i % 5) * 0.12);
      const radius = baseRadius + Math.sin(this.time * 0.004 + i * 0.2) * maxRadius * 0.15;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const size = 3 + Math.sin(this.time * 0.005 + i) * 2 + trebleIntensity * 2;
      const alpha = 0.3 + Math.sin(this.time * 0.003 + i) * 0.2 + trebleIntensity * 0.3;

      ctx.fillStyle = `hsla(${this.hueBase + 240}, 40%, 20%, ${alpha})`;
      ctx.shadowBlur = 25 + bassIntensity * 15;
      ctx.shadowColor = `hsla(${this.hueBase + 240}, 60%, 30%, 0.8)`;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const darkCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.3);
    darkCore.addColorStop(0, `hsla(${this.hueBase + 250}, 30%, 5%, ${0.95 + audioIntensity * 0.05})`);
    darkCore.addColorStop(0.5, `hsla(${this.hueBase + 240}, 40%, 8%, ${0.7 + bassIntensity * 0.2})`);
    darkCore.addColorStop(1, `hsla(${this.hueBase + 230}, 50%, 12%, 0)`);

    ctx.fillStyle = darkCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    const gravityWaves = 8;
    ctx.strokeStyle = `hsla(${this.hueBase + 240}, 50%, 25%, ${0.2 + trebleIntensity * 0.2})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 10]);

    for (let i = 0; i < gravityWaves; i++) {
      const radius = maxRadius * (0.4 + i * 0.08) + Math.sin(this.time * 0.002 + i) * 5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  private renderSoulFragment(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.44;
    const fragments = 7;

    for (let frag = 0; frag < fragments; frag++) {
      const angle = (Math.PI * 2 * frag) / fragments + this.time * 0.0008;
      const radius = maxRadius * (0.4 + Math.sin(this.time * 0.002 + frag) * 0.15);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const hue = (this.hueBase + 120 + frag * 25) % 360;
      const size = 25 + Math.sin(this.time * 0.003 + frag) * 8 + midIntensity * 10;
      const alpha = 0.5 + Math.sin(this.time * 0.004 + frag) * 0.2 + midIntensity * 0.3;

      const fragmentGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      fragmentGradient.addColorStop(0, `hsla(${hue}, 90%, 75%, ${alpha})`);
      fragmentGradient.addColorStop(0.5, `hsla(${hue + 30}, 80%, 65%, ${alpha * 0.7})`);
      fragmentGradient.addColorStop(1, `hsla(${hue + 60}, 70%, 55%, 0)`);

      ctx.fillStyle = fragmentGradient;
      ctx.shadowBlur = 30;
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.7)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha * 0.8})`;
      ctx.lineWidth = 2 + bassIntensity * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    const soulCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.2);
    soulCore.addColorStop(0, `hsla(${this.hueBase + 140}, 100%, 90%, ${0.9 + audioIntensity * 0.1})`);
    soulCore.addColorStop(0.6, `hsla(${this.hueBase + 130}, 95%, 75%, ${0.6 + midIntensity * 0.2})`);
    soulCore.addColorStop(1, `hsla(${this.hueBase + 120}, 90%, 60%, 0)`);

    ctx.fillStyle = soulCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderForbiddenRitual(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.43;
    const ritualCircles = 5;

    for (let circle = 0; circle < ritualCircles; circle++) {
      const radius = maxRadius * (0.2 + circle * 0.2);
      const rotation = this.time * 0.0005 * (circle % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.rotate(rotation);

      const hue = (this.hueBase + 300 + circle * 15) % 360;
      ctx.strokeStyle = `hsla(${hue}, 85%, 40%, ${0.6 + audioIntensity * 0.2})`;
      ctx.lineWidth = 2 + (circle === ritualCircles - 1 ? bassIntensity * 2 : 0);
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${hue}, 100%, 45%, 0.8)`;

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      const symbols = 8 + circle * 2;
      for (let i = 0; i < symbols; i++) {
        const angle = (Math.PI * 2 * i) / symbols;
        const symbolX = Math.cos(angle) * radius;
        const symbolY = Math.sin(angle) * radius;

        ctx.fillStyle = `hsla(${hue}, 90%, 50%, ${0.7 + trebleIntensity * 0.2})`;
        ctx.beginPath();
        ctx.arc(symbolX, symbolY, 3 + bassIntensity * 2, 0, Math.PI * 2);
        ctx.fill();

        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(symbolX, symbolY);
          ctx.lineTo(symbolX + Math.cos(angle) * 8, symbolY + Math.sin(angle) * 8);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    const ritualCenter = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.15);
    ritualCenter.addColorStop(0, `hsla(${this.hueBase + 310}, 100%, 60%, ${0.95 + audioIntensity * 0.05})`);
    ritualCenter.addColorStop(0.5, `hsla(${this.hueBase + 300}, 95%, 45%, ${0.8 + bassIntensity * 0.15})`);
    ritualCenter.addColorStop(1, `hsla(${this.hueBase + 290}, 90%, 35%, 0)`);

    ctx.fillStyle = ritualCenter;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderTwilightZone(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.46;
    const zones = 6;

    for (let zone = 0; zone < zones; zone++) {
      const innerRadius = (maxRadius / zones) * zone;
      const outerRadius = (maxRadius / zones) * (zone + 1);
      const rotation = this.time * 0.0006 * (zone % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.rotate(rotation);

      const hue1 = (this.hueBase + 280 + zone * 10) % 360;
      const hue2 = (this.hueBase + 40 + zone * 10) % 360;
      const alpha = 0.4 + Math.sin(this.time * 0.003 + zone) * 0.2 + midIntensity * 0.2;

      const zoneGradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
      zoneGradient.addColorStop(0, `hsla(${hue1}, 70%, 50%, ${alpha})`);
      zoneGradient.addColorStop(0.5, `hsla(${(hue1 + hue2) / 2}, 75%, 55%, ${alpha * 0.8})`);
      zoneGradient.addColorStop(1, `hsla(${hue2}, 70%, 50%, ${alpha * 0.6})`);

      ctx.fillStyle = zoneGradient;
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
      ctx.fill("evenodd");
      ctx.restore();
    }

    const twilightCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.25);
    twilightCore.addColorStop(0, `hsla(${this.hueBase + 320}, 80%, 60%, ${0.8 + audioIntensity * 0.2})`);
    twilightCore.addColorStop(0.6, `hsla(${this.hueBase + 50}, 75%, 55%, ${0.5 + midIntensity * 0.3})`);
    twilightCore.addColorStop(1, `hsla(${this.hueBase + 280}, 70%, 50%, 0)`);

    ctx.fillStyle = twilightCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderSpectralEcho(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.45;
    const echoLayers = 10;

    for (let layer = 0; layer < echoLayers; layer++) {
      const delay = layer * 0.1;
      const radius = maxRadius * (0.3 + layer * 0.07) + Math.sin(this.time * 0.003 - delay) * 10;
      const hue = (this.hueBase + 160 + layer * 8) % 360;
      const alpha = (0.8 - layer * 0.08) * (0.5 + trebleIntensity * 0.4);

      ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${alpha})`;
      ctx.lineWidth = 2 + (layer === 0 ? bassIntensity * 2 : 0);
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsla(${hue}, 100%, 75%, ${alpha * 0.6})`;

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (layer % 3 === 0) {
        const segments = 8;
        for (let i = 0; i < segments; i++) {
          const angle = (Math.PI * 2 * i) / segments + this.time * 0.0005;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          ctx.fillStyle = `hsla(${hue}, 90%, 80%, ${alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(x, y, 2 + trebleIntensity * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const echoSource = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.2);
    echoSource.addColorStop(0, `hsla(${this.hueBase + 170}, 100%, 90%, ${0.95 + audioIntensity * 0.05})`);
    echoSource.addColorStop(0.5, `hsla(${this.hueBase + 160}, 95%, 75%, ${0.7 + trebleIntensity * 0.2})`);
    echoSource.addColorStop(1, `hsla(${this.hueBase + 150}, 90%, 60%, 0)`);

    ctx.fillStyle = echoSource;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderVoidWhisper(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.44;
    const whispers = 9;

    for (let whisper = 0; whisper < whispers; whisper++) {
      const angle = (Math.PI * 2 * whisper) / whispers + this.time * 0.0004;
      const baseRadius = maxRadius * (0.2 + whisper * 0.08);
      const radius = baseRadius + Math.sin(this.time * 0.004 + whisper) * maxRadius * 0.05;

      const hue = (this.hueBase + 260 + whisper * 5) % 360;
      const alpha = 0.2 + Math.sin(this.time * 0.003 + whisper) * 0.15 + midIntensity * 0.25;

      const whisperGradient = ctx.createLinearGradient(
        Math.cos(angle) * radius * 0.3,
        Math.sin(angle) * radius * 0.3,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
      );
      whisperGradient.addColorStop(0, `hsla(${hue}, 50%, 30%, 0)`);
      whisperGradient.addColorStop(0.5, `hsla(${hue}, 60%, 35%, ${alpha})`);
      whisperGradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0)`);

      ctx.strokeStyle = whisperGradient;
      ctx.lineWidth = 3 + bassIntensity * 2;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${hue}, 80%, 35%, 0.6)`;

      ctx.beginPath();
      ctx.moveTo(
        Math.cos(angle) * radius * 0.3,
        Math.sin(angle) * radius * 0.3,
      );
      ctx.quadraticCurveTo(
        Math.cos(angle + 0.2) * radius * 0.6,
        Math.sin(angle + 0.2) * radius * 0.6,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
      );
      ctx.stroke();
    }

    const voidCenter = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.28);
    voidCenter.addColorStop(0, `hsla(${this.hueBase + 270}, 40%, 8%, ${0.9 + audioIntensity * 0.1})`);
    voidCenter.addColorStop(0.6, `hsla(${this.hueBase + 260}, 50%, 12%, ${0.5 + midIntensity * 0.3})`);
    voidCenter.addColorStop(1, `hsla(${this.hueBase + 250}, 60%, 18%, 0)`);

    ctx.fillStyle = voidCenter;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderDemonicGate(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.42;
    const gateHeight = maxRadius * 1.2;
    const gateWidth = maxRadius * 0.8;

    const gateGradient = ctx.createLinearGradient(-gateWidth / 2, -gateHeight / 2, gateWidth / 2, gateHeight / 2);
    gateGradient.addColorStop(0, `hsla(${this.hueBase + 0}, 100%, 35%, ${0.8 + audioIntensity * 0.2})`);
    gateGradient.addColorStop(0.5, `hsla(${this.hueBase + 10}, 95%, 40%, ${0.9 + bassIntensity * 0.1})`);
    gateGradient.addColorStop(1, `hsla(${this.hueBase + 20}, 100%, 35%, ${0.8 + audioIntensity * 0.2})`);

    ctx.fillStyle = gateGradient;
    ctx.shadowBlur = 40;
    ctx.shadowColor = `hsla(${this.hueBase + 0}, 100%, 40%, 0.9)`;

    ctx.beginPath();
    ctx.moveTo(-gateWidth / 2, -gateHeight / 2);
    ctx.lineTo(gateWidth / 2, -gateHeight / 2);
    ctx.lineTo(gateWidth / 2, gateHeight / 2);
    ctx.lineTo(-gateWidth / 2, gateHeight / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `hsla(${this.hueBase + 0}, 100%, 50%, ${0.9 + trebleIntensity * 0.1})`;
    ctx.lineWidth = 4 + bassIntensity * 3;
    ctx.beginPath();
    ctx.moveTo(-gateWidth / 2, -gateHeight / 2);
    ctx.lineTo(gateWidth / 2, -gateHeight / 2);
    ctx.lineTo(gateWidth / 2, gateHeight / 2);
    ctx.lineTo(-gateWidth / 2, gateHeight / 2);
    ctx.closePath();
    ctx.stroke();

    const gateSymbols = 5;
    for (let i = 0; i < gateSymbols; i++) {
      const y = (-gateHeight / 2) + (gateHeight / (gateSymbols + 1)) * (i + 1);
      const symbolSize = 8 + bassIntensity * 4;

      ctx.fillStyle = `hsla(${this.hueBase + 0}, 100%, 60%, ${0.8 + trebleIntensity * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, y, symbolSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `hsla(${this.hueBase + 10}, 100%, 70%, ${0.9 + audioIntensity * 0.1})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-symbolSize * 0.7, y);
      ctx.lineTo(symbolSize * 0.7, y);
      ctx.moveTo(0, y - symbolSize * 0.7);
      ctx.lineTo(0, y + symbolSize * 0.7);
      ctx.stroke();
    }

    const gateCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.2);
    gateCore.addColorStop(0, `hsla(${this.hueBase + 0}, 100%, 80%, ${0.95 + audioIntensity * 0.05})`);
    gateCore.addColorStop(0.5, `hsla(${this.hueBase + 10}, 100%, 50%, ${0.7 + bassIntensity * 0.2})`);
    gateCore.addColorStop(1, `hsla(${this.hueBase + 20}, 100%, 35%, 0)`);

    ctx.fillStyle = gateCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderCursedRunes(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.43;
    const runeCount = 12;

    for (let i = 0; i < runeCount; i++) {
      const angle = (Math.PI * 2 * i) / runeCount + this.time * 0.0006;
      const radius = maxRadius * (0.5 + Math.sin(this.time * 0.002 + i) * 0.15);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const hue = (this.hueBase + 290 + i * 3) % 360;
      const size = 12 + Math.sin(this.time * 0.003 + i) * 4 + midIntensity * 5;
      const alpha = 0.6 + Math.sin(this.time * 0.004 + i) * 0.2 + midIntensity * 0.2;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + this.time * 0.001);

      ctx.strokeStyle = `hsla(${hue}, 90%, 40%, ${alpha})`;
      ctx.fillStyle = `hsla(${hue}, 85%, 35%, ${alpha * 0.4})`;
      ctx.lineWidth = 2 + bassIntensity * 1.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${hue}, 100%, 45%, 0.8)`;

      const runeType = i % 4;
      if (runeType === 0) {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.3, size);
        ctx.lineTo(size * 0.3, size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (runeType === 1) {
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, -size);
        ctx.lineTo(size * 0.5, -size);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (runeType === 2) {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.5, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, -size);
        ctx.lineTo(size * 0.4, -size);
        ctx.lineTo(size * 0.4, size);
        ctx.lineTo(-size * 0.4, size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, -size);
        ctx.lineTo(size * 0.4, size);
        ctx.moveTo(size * 0.4, -size);
        ctx.lineTo(-size * 0.4, size);
        ctx.stroke();
      }

      ctx.restore();
    }

    const cursedCenter = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.22);
    cursedCenter.addColorStop(0, `hsla(${this.hueBase + 300}, 100%, 50%, ${0.9 + audioIntensity * 0.1})`);
    cursedCenter.addColorStop(0.5, `hsla(${this.hueBase + 290}, 95%, 40%, ${0.7 + bassIntensity * 0.2})`);
    cursedCenter.addColorStop(1, `hsla(${this.hueBase + 280}, 90%, 30%, 0)`);

    ctx.fillStyle = cursedCenter;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderShadowDance(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.46;
    const dancers = 8;

    for (let dancer = 0; dancer < dancers; dancer++) {
      const baseAngle = (Math.PI * 2 * dancer) / dancers;
      const angle = baseAngle + Math.sin(this.time * 0.003 + dancer) * 0.5;
      const radius = maxRadius * (0.3 + Math.sin(this.time * 0.004 + dancer * 0.5) * 0.2);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const hue = (this.hueBase + 250 + dancer * 8) % 360;
      const size = 20 + Math.sin(this.time * 0.005 + dancer) * 8 + trebleIntensity * 6;
      const alpha = 0.4 + Math.sin(this.time * 0.004 + dancer) * 0.2 + trebleIntensity * 0.3;

      const shadowGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      shadowGradient.addColorStop(0, `hsla(${hue}, 70%, 30%, ${alpha})`);
      shadowGradient.addColorStop(0.5, `hsla(${hue + 10}, 60%, 25%, ${alpha * 0.7})`);
      shadowGradient.addColorStop(1, `hsla(${hue + 20}, 50%, 20%, 0)`);

      ctx.fillStyle = shadowGradient;
      ctx.shadowBlur = 25 + bassIntensity * 15;
      ctx.shadowColor = `hsla(${hue}, 80%, 25%, 0.7)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue}, 80%, 40%, ${alpha * 0.8})`;
      ctx.lineWidth = 2 + bassIntensity * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }

    const danceCenter = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.24);
    danceCenter.addColorStop(0, `hsla(${this.hueBase + 260}, 60%, 15%, ${0.8 + audioIntensity * 0.2})`);
    danceCenter.addColorStop(0.6, `hsla(${this.hueBase + 250}, 70%, 20%, ${0.5 + trebleIntensity * 0.3})`);
    danceCenter.addColorStop(1, `hsla(${this.hueBase + 240}, 80%, 25%, 0)`);

    ctx.fillStyle = danceCenter;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.24, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderNightmareFuel(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.45;
    const nightmares = 10;

    for (let i = 0; i < nightmares; i++) {
      const angle = (Math.PI * 2 * i) / nightmares + this.time * 0.0007;
      const radius = maxRadius * (0.2 + (i % 3) * 0.15);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const hue = (this.hueBase + 20 + i * 15) % 360;
      const size = 15 + Math.sin(this.time * 0.004 + i) * 6 + midIntensity * 5;
      const alpha = 0.5 + Math.sin(this.time * 0.003 + i) * 0.25 + midIntensity * 0.3;

      const nightmareGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      nightmareGradient.addColorStop(0, `hsla(${hue}, 100%, 45%, ${alpha})`);
      nightmareGradient.addColorStop(0.4, `hsla(${hue + 20}, 95%, 40%, ${alpha * 0.8})`);
      nightmareGradient.addColorStop(1, `hsla(${hue + 40}, 90%, 35%, 0)`);

      ctx.fillStyle = nightmareGradient;
      ctx.shadowBlur = 30;
      ctx.shadowColor = `hsla(${hue}, 100%, 40%, 0.8)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      const spikes = 6;
      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha * 0.9})`;
      ctx.lineWidth = 2 + bassIntensity * 1.5;
      ctx.beginPath();
      for (let spike = 0; spike < spikes; spike++) {
        const spikeAngle = (Math.PI * 2 * spike) / spikes + this.time * 0.002;
        const spikeX = x + Math.cos(spikeAngle) * size;
        const spikeY = y + Math.sin(spikeAngle) * size;
        if (spike === 0) ctx.moveTo(spikeX, spikeY);
        else ctx.lineTo(spikeX, spikeY);
      }
      ctx.closePath();
      ctx.stroke();
    }

    const fuelCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.26);
    fuelCore.addColorStop(0, `hsla(${this.hueBase + 30}, 100%, 55%, ${0.95 + audioIntensity * 0.05})`);
    fuelCore.addColorStop(0.5, `hsla(${this.hueBase + 20}, 100%, 45%, ${0.8 + bassIntensity * 0.15})`);
    fuelCore.addColorStop(1, `hsla(${this.hueBase + 10}, 100%, 35%, 0)`);

    ctx.fillStyle = fuelCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.26, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderAbyssalDepth(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.47;
    const depthLayers = 12;

    for (let layer = 0; layer < depthLayers; layer++) {
      const radius = (maxRadius / depthLayers) * (depthLayers - layer);
      const hue = (this.hueBase + 220 - layer * 2) % 360;
      const lightness = 10 + layer * 2;
      const alpha = (0.9 - layer * 0.07) * (0.4 + trebleIntensity * 0.4);

      const layerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      layerGradient.addColorStop(0, `hsla(${hue}, 60%, ${lightness + 5}%, ${alpha})`);
      layerGradient.addColorStop(0.7, `hsla(${hue}, 70%, ${lightness}%, ${alpha * 0.8})`);
      layerGradient.addColorStop(1, `hsla(${hue - 10}, 80%, ${lightness - 2}%, 0)`);

      ctx.fillStyle = layerGradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const abyssalCreatures = 6;
    for (let i = 0; i < abyssalCreatures; i++) {
      const angle = (Math.PI * 2 * i) / abyssalCreatures + this.time * 0.0004;
      const radius = maxRadius * (0.3 + Math.sin(this.time * 0.003 + i) * 0.1);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const size = 8 + Math.sin(this.time * 0.005 + i) * 3 + trebleIntensity * 3;
      const alpha = 0.6 + Math.sin(this.time * 0.004 + i) * 0.2 + trebleIntensity * 0.2;

      ctx.fillStyle = `hsla(${this.hueBase + 230}, 80%, 25%, ${alpha})`;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${this.hueBase + 230}, 100%, 30%, 0.7)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const abyssalCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.3);
    abyssalCore.addColorStop(0, `hsla(${this.hueBase + 240}, 50%, 5%, ${0.95 + audioIntensity * 0.05})`);
    abyssalCore.addColorStop(0.6, `hsla(${this.hueBase + 230}, 60%, 8%, ${0.7 + bassIntensity * 0.2})`);
    abyssalCore.addColorStop(1, `hsla(${this.hueBase + 220}, 70%, 12%, 0)`);

    ctx.fillStyle = abyssalCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderPhantomPulse(
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.44;
    const pulseWaves = 8;

    for (let wave = 0; wave < pulseWaves; wave++) {
      const delay = wave * 0.15;
      const radius = maxRadius * (0.2 + wave * 0.1) + Math.sin(this.time * 0.004 - delay) * maxRadius * 0.05;
      const hue = (this.hueBase + 100 + wave * 12) % 360;
      const alpha = (0.8 - wave * 0.1) * (0.4 + midIntensity * 0.4);

      ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${alpha})`;
      ctx.lineWidth = 3 + (wave === 0 ? bassIntensity * 3 : 0);
      ctx.shadowBlur = 25;
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.7})`;

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (wave % 2 === 0) {
        const segments = 6;
        for (let i = 0; i < segments; i++) {
          const angle = (Math.PI * 2 * i) / segments + this.time * 0.0008;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          ctx.fillStyle = `hsla(${hue}, 95%, 75%, ${alpha * 0.9})`;
          ctx.beginPath();
          ctx.arc(x, y, 3 + midIntensity * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const phantomCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.22);
    phantomCore.addColorStop(0, `hsla(${this.hueBase + 110}, 100%, 85%, ${0.95 + audioIntensity * 0.05})`);
    phantomCore.addColorStop(0.5, `hsla(${this.hueBase + 100}, 95%, 70%, ${0.7 + midIntensity * 0.2})`);
    phantomCore.addColorStop(1, `hsla(${this.hueBase + 90}, 90%, 55%, 0)`);

    ctx.fillStyle = phantomCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderInfernalFlame(
    audioIntensity: number,
    bassIntensity: number,
    trebleIntensity: number,
  ): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const maxRadius = Math.min(this.width, this.height) * 0.46;
    const flames = 7;

    for (let flame = 0; flame < flames; flame++) {
      const angle = (Math.PI * 2 * flame) / flames + this.time * 0.0006;
      const baseRadius = maxRadius * (0.15 + flame * 0.1);
      const radius = baseRadius + Math.sin(this.time * 0.005 + flame) * maxRadius * 0.08;

      const hue1 = (this.hueBase + 0 + flame * 8) % 360;
      const hue2 = (this.hueBase + 30 + flame * 8) % 360;
      const hue3 = (this.hueBase + 60 + flame * 8) % 360;

      const flameGradient = ctx.createLinearGradient(
        Math.cos(angle) * baseRadius,
        Math.sin(angle) * baseRadius,
        Math.cos(angle) * maxRadius,
        Math.sin(angle) * maxRadius,
      );
      flameGradient.addColorStop(0, `hsla(${hue1}, 100%, 60%, ${0.9 + audioIntensity * 0.1})`);
      flameGradient.addColorStop(0.4, `hsla(${hue2}, 100%, 55%, ${0.8 + trebleIntensity * 0.15})`);
      flameGradient.addColorStop(0.8, `hsla(${hue3}, 100%, 50%, ${0.6 + bassIntensity * 0.2})`);
      flameGradient.addColorStop(1, `hsla(${hue1}, 100%, 45%, 0)`);

      ctx.fillStyle = flameGradient;
      ctx.shadowBlur = 35;
      ctx.shadowColor = `hsla(${hue1}, 100%, 55%, 0.9)`;

      const flamePoints = 8;
      ctx.beginPath();
      for (let i = 0; i <= flamePoints; i++) {
        const t = i / flamePoints;
        const currentRadius = baseRadius + (radius - baseRadius) * t;
        const wave = Math.sin(t * Math.PI * 3 + this.time * 0.01 + flame) * 15;
        const x = Math.cos(angle + wave * 0.01) * currentRadius;
        const y = Math.sin(angle + wave * 0.01) * currentRadius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(Math.cos(angle) * baseRadius, Math.sin(angle) * baseRadius);
      ctx.closePath();
      ctx.fill();
    }

    const infernalCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.25);
    infernalCore.addColorStop(0, `hsla(${this.hueBase + 20}, 100%, 90%, ${0.98 + audioIntensity * 0.02})`);
    infernalCore.addColorStop(0.3, `hsla(${this.hueBase + 10}, 100%, 70%, ${0.9 + bassIntensity * 0.1})`);
    infernalCore.addColorStop(0.7, `hsla(${this.hueBase + 0}, 100%, 55%, ${0.7 + trebleIntensity * 0.2})`);
    infernalCore.addColorStop(1, `hsla(${this.hueBase + 350}, 100%, 45%, 0)`);

    ctx.fillStyle = infernalCore;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Public API for pattern controls
  public getCurrentPattern(): Pattern {
    return this.currentPattern;
  }

  public getNextPattern(): Pattern {
    return this.nextPattern;
  }

  public getFormattedPatternName(pattern: Pattern): string {
    return this.formatPatternName(pattern);
  }

  public getPatternDuration(): number {
    return this.patternDuration;
  }

  public setPatternDuration(value: number): void {
    this.patternDuration = Math.max(50, Math.min(1000, value));
  }

  public getTransitionSpeed(): number {
    return this.transitionSpeed;
  }

  public setTransitionSpeed(value: number): void {
    this.transitionSpeed = Math.max(0.001, Math.min(0.1, value));
  }

  public getFractalZoom(): number {
    return this.fractalZoom;
  }

  public setFractalZoom(value: number): void {
    this.fractalZoom = Math.max(0.1, Math.min(10, value));
  }

  public getFractalOffsetX(): number {
    return this.fractalOffsetX;
  }

  public setFractalOffsetX(value: number): void {
    this.fractalOffsetX = value;
  }

  public getFractalOffsetY(): number {
    return this.fractalOffsetY;
  }

  public setFractalOffsetY(value: number): void {
    this.fractalOffsetY = value;
  }

  public getJuliaC(): { re: number; im: number } {
    return { ...this.juliaC };
  }

  public setJuliaC(re: number, im: number): void {
    this.juliaC.re = re;
    this.juliaC.im = im;
  }

  public getHueBase(): number {
    return this.hueBase;
  }

  public setHueBase(value: number): void {
    this.hueBase = value % 360;
  }

  public getPatternState(): {
    currentPattern: Pattern;
    nextPattern: Pattern;
    patternDuration: number;
    transitionSpeed: number;
    transitionProgress: number;
    isTransitioning: boolean;
    fractalZoom: number;
    fractalOffsetX: number;
    fractalOffsetY: number;
    juliaC: { re: number; im: number };
    hueBase: number;
  } {
    return {
      currentPattern: this.currentPattern,
      nextPattern: this.nextPattern,
      patternDuration: this.patternDuration,
      transitionSpeed: this.transitionSpeed,
      transitionProgress: this.transitionProgress,
      isTransitioning: this.isTransitioning,
      fractalZoom: this.fractalZoom,
      fractalOffsetX: this.fractalOffsetX,
      fractalOffsetY: this.fractalOffsetY,
      juliaC: { ...this.juliaC },
      hueBase: this.hueBase,
    };
  }

  public getAllPatterns(): Pattern[] {
    return [...this.allPatterns];
  }

  public setPattern(pattern: Pattern): void {
    if (!this.allPatterns.includes(pattern)) {
      console.warn(`Pattern "${pattern}" not found in available patterns`);
      return;
    }

    // Reset transition state
    this.isTransitioning = false;
    this.transitionProgress = 0;
    this.patternTimer = 0;

    // Set the pattern immediately
    this.currentPattern = pattern;

    // Find the next pattern in sequence
    const currentIndex = this.patternSequence.indexOf(pattern);
    if (currentIndex !== -1) {
      this.patternIndex = currentIndex;
      const nextIndex = (currentIndex + 1) % this.patternSequence.length;
      this.nextPattern = this.patternSequence[nextIndex] ?? "rays";
    } else {
      // If pattern not in sequence, just set next to be the next in allPatterns
      const allIndex = this.allPatterns.indexOf(pattern);
      const nextAllIndex = (allIndex + 1) % this.allPatterns.length;
      this.nextPattern = this.allPatterns[nextAllIndex] ?? "rays";
    }

    // Log the pattern change
    this.logPatternChange(this.currentPattern, "manual-selection");
  }

  // Pattern-specific parameter getters and setters
  public getParticleCount(): number {
    return this.particleCount;
  }

  public setParticleCount(value: number): void {
    this.particleCount = Math.max(50, Math.min(2000, value));
    this.initializeParticles();
  }

  public getParticleSize(): number {
    return this.particleSize;
  }

  public setParticleSize(value: number): void {
    this.particleSize = Math.max(0.5, Math.min(5.0, value));
  }

  public getParticleSpeed(): number {
    return this.particleSpeed;
  }

  public setParticleSpeed(value: number): void {
    this.particleSpeed = Math.max(0.1, Math.min(3.0, value));
  }

  public getBubbleCount(): number {
    return this.bubbleCount;
  }

  public setBubbleCount(value: number): void {
    this.bubbleCount = Math.max(10, Math.min(100, value));
    this.initializeBubbles();
  }

  public getBubbleSize(): number {
    return this.bubbleSize;
  }

  public setBubbleSize(value: number): void {
    this.bubbleSize = Math.max(0.5, Math.min(3.0, value));
  }

  public getBubbleSpeed(): number {
    return this.bubbleSpeed;
  }

  public setBubbleSpeed(value: number): void {
    this.bubbleSpeed = Math.max(0.1, Math.min(3.0, value));
  }

  public getStarCount(): number {
    return this.starCount;
  }

  public setStarCount(value: number): void {
    this.starCount = Math.max(50, Math.min(500, value));
    this.initializeStars();
  }

  public getStarSpeed(): number {
    return this.starSpeed;
  }

  public setStarSpeed(value: number): void {
    this.starSpeed = Math.max(0.1, Math.min(3.0, value));
  }

  public getRayCount(): number {
    return this.rayCount;
  }

  public setRayCount(value: number): void {
    this.rayCount = Math.max(6, Math.min(72, value));
  }

  public getWaveCount(): number {
    return this.waveCount;
  }

  public setWaveCount(value: number): void {
    this.waveCount = Math.max(1, Math.min(15, value));
  }

  public getWaveAmplitude(): number {
    return this.waveAmplitude;
  }

  public setWaveAmplitude(value: number): void {
    this.waveAmplitude = Math.max(0.1, Math.min(3.0, value));
  }

  public getRingCount(): number {
    return this.ringCount;
  }

  public setRingCount(value: number): void {
    this.ringCount = Math.max(3, Math.min(30, value));
  }

  public getLightningCount(): number {
    return this.lightningCount;
  }

  public setLightningCount(value: number): void {
    this.lightningCount = Math.max(1, Math.min(10, value));
  }

  public getMatrixSpeed(): number {
    return this.matrixSpeed;
  }

  public setMatrixSpeed(value: number): void {
    this.matrixSpeed = Math.max(0.1, Math.min(3.0, value));
  }

  public getTunnelSpeed(): number {
    return this.tunnelSpeed;
  }

  public setTunnelSpeed(value: number): void {
    this.tunnelSpeed = Math.max(0.1, Math.min(3.0, value));
  }

  public getGalaxyArmCount(): number {
    return this.galaxyArmCount;
  }

  public setGalaxyArmCount(value: number): void {
    this.galaxyArmCount = Math.max(2, Math.min(8, value));
  }

  public getAuroraIntensity(): number {
    return this.auroraIntensity;
  }

  public setAuroraIntensity(value: number): void {
    this.auroraIntensity = Math.max(0.1, Math.min(3.0, value));
  }

  public getMandalaLayers(): number {
    return this.mandalaLayers;
  }

  public setMandalaLayers(value: number): void {
    this.mandalaLayers = Math.max(1, Math.min(12, value));
  }

  // Extended pattern-specific getters and setters
  public getTarotCardSize(): number {
    return this.tarotCardSize;
  }

  public setTarotCardSize(value: number): void {
    this.tarotCardSize = Math.max(0.5, Math.min(3.0, value));
  }

  public getTarotCardCount(): number {
    return this.tarotCardCount;
  }

  public setTarotCardCount(value: number): void {
    this.tarotCardCount = Math.max(3, Math.min(22, value));
  }

  public getSacredSpiralCount(): number {
    return this.sacredSpiralCount;
  }

  public setSacredSpiralCount(value: number): void {
    this.sacredSpiralCount = Math.max(1, Math.min(8, value));
  }

  public getSacredSpiralTightness(): number {
    return this.sacredSpiralTightness;
  }

  public setSacredSpiralTightness(value: number): void {
    this.sacredSpiralTightness = Math.max(0.1, Math.min(3.0, value));
  }

  public getPentagramSize(): number {
    return this.pentagramSize;
  }

  public setPentagramSize(value: number): void {
    this.pentagramSize = Math.max(0.5, Math.min(2.0, value));
  }

  public getPentagramRotationSpeed(): number {
    return this.pentagramRotationSpeed;
  }

  public setPentagramRotationSpeed(value: number): void {
    this.pentagramRotationSpeed = Math.max(0.1, Math.min(3.0, value));
  }

  public getRuneSize(): number {
    return this.runeSize;
  }

  public setRuneSize(value: number): void {
    this.runeSize = Math.max(0.5, Math.min(2.5, value));
  }

  public getRuneCount(): number {
    return this.runeCount;
  }

  public setRuneCount(value: number): void {
    this.runeCount = Math.max(4, Math.min(16, value));
  }

  public getSigilCount(): number {
    return this.sigilCount;
  }

  public setSigilCount(value: number): void {
    this.sigilCount = Math.max(3, Math.min(12, value));
  }

  public getSigilSize(): number {
    return this.sigilSize;
  }

  public setSigilSize(value: number): void {
    this.sigilSize = Math.max(0.5, Math.min(2.5, value));
  }

  public getChakraSize(): number {
    return this.chakraSize;
  }

  public setChakraSize(value: number): void {
    this.chakraSize = Math.max(0.5, Math.min(2.5, value));
  }

  public getChakraSpacing(): number {
    return this.chakraSpacing;
  }

  public setChakraSpacing(value: number): void {
    this.chakraSpacing = Math.max(0.5, Math.min(2.0, value));
  }

  public getPortalSize(): number {
    return this.portalSize;
  }

  public setPortalSize(value: number): void {
    this.portalSize = Math.max(0.5, Math.min(2.5, value));
  }

  public getPortalRingCount(): number {
    return this.portalRingCount;
  }

  public setPortalRingCount(value: number): void {
    this.portalRingCount = Math.max(3, Math.min(12, value));
  }

  public getPhoenixWingSpan(): number {
    return this.phoenixWingSpan;
  }

  public setPhoenixWingSpan(value: number): void {
    this.phoenixWingSpan = Math.max(0.5, Math.min(2.5, value));
  }

  public getCrystalGridSize(): number {
    return this.crystalGridSize;
  }

  public setCrystalGridSize(value: number): void {
    this.crystalGridSize = Math.max(0.5, Math.min(2.0, value));
  }

  public getCrystalCount(): number {
    return this.crystalCount;
  }

  public setCrystalCount(value: number): void {
    this.crystalCount = Math.max(6, Math.min(24, value));
  }

  public getMoonPhaseCount(): number {
    return this.moonPhaseCount;
  }

  public setMoonPhaseCount(value: number): void {
    this.moonPhaseCount = Math.max(4, Math.min(13, value));
  }

  public getMoonPhaseSize(): number {
    return this.moonPhaseSize;
  }

  public setMoonPhaseSize(value: number): void {
    this.moonPhaseSize = Math.max(0.5, Math.min(2.5, value));
  }

  public getFlowerOfLifeCircleCount(): number {
    return this.flowerOfLifeCircleCount;
  }

  public setFlowerOfLifeCircleCount(value: number): void {
    this.flowerOfLifeCircleCount = Math.max(1, Math.min(19, value));
  }

  public getFlowerOfLifeSize(): number {
    return this.flowerOfLifeSize;
  }

  public setFlowerOfLifeSize(value: number): void {
    this.flowerOfLifeSize = Math.max(0.5, Math.min(2.0, value));
  }

  public getMetatronNodeCount(): number {
    return this.metatronNodeCount;
  }

  public setMetatronNodeCount(value: number): void {
    this.metatronNodeCount = Math.max(7, Math.min(19, value));
  }

  public getMetatronSize(): number {
    return this.metatronSize;
  }

  public setMetatronSize(value: number): void {
    this.metatronSize = Math.max(0.5, Math.min(2.0, value));
  }

  public getTorusRingCount(): number {
    return this.torusRingCount;
  }

  public setTorusRingCount(value: number): void {
    this.torusRingCount = Math.max(6, Math.min(24, value));
  }

  public getTorusThickness(): number {
    return this.torusThickness;
  }

  public setTorusThickness(value: number): void {
    this.torusThickness = Math.max(0.3, Math.min(2.0, value));
  }

  public getLabyrinthComplexity(): number {
    return this.labyrinthComplexity;
  }

  public setLabyrinthComplexity(value: number): void {
    this.labyrinthComplexity = Math.max(0.5, Math.min(2.5, value));
  }

  public getLabyrinthPathWidth(): number {
    return this.labyrinthPathWidth;
  }

  public setLabyrinthPathWidth(value: number): void {
    this.labyrinthPathWidth = Math.max(0.5, Math.min(2.0, value));
  }

  public getVortexSpiralCount(): number {
    return this.vortexSpiralCount;
  }

  public setVortexSpiralCount(value: number): void {
    this.vortexSpiralCount = Math.max(2, Math.min(12, value));
  }

  public getVortexRotationSpeed(): number {
    return this.vortexRotationSpeed;
  }

  public setVortexRotationSpeed(value: number): void {
    this.vortexRotationSpeed = Math.max(0.1, Math.min(3.0, value));
  }

  public getDragonEyeSize(): number {
    return this.dragonEyeSize;
  }

  public setDragonEyeSize(value: number): void {
    this.dragonEyeSize = Math.max(0.5, Math.min(2.5, value));
  }

  public getDragonPupilSize(): number {
    return this.dragonPupilSize;
  }

  public setDragonPupilSize(value: number): void {
    this.dragonPupilSize = Math.max(0.3, Math.min(1.5, value));
  }

  public getAncientGlyphCount(): number {
    return this.ancientGlyphCount;
  }

  public setAncientGlyphCount(value: number): void {
    this.ancientGlyphCount = Math.max(8, Math.min(32, value));
  }

  public getAncientGlyphSize(): number {
    return this.ancientGlyphSize;
  }

  public setAncientGlyphSize(value: number): void {
    this.ancientGlyphSize = Math.max(0.5, Math.min(2.5, value));
  }

  public getPlatonicSize(): number {
    return this.platonicSize;
  }

  public setPlatonicSize(value: number): void {
    this.platonicSize = Math.max(0.5, Math.min(2.0, value));
  }

  public getPlatonicRotationSpeed(): number {
    return this.platonicRotationSpeed;
  }

  public setPlatonicRotationSpeed(value: number): void {
    this.platonicRotationSpeed = Math.max(0.1, Math.min(3.0, value));
  }

  public getCosmicLotusLayerCount(): number {
    return this.cosmicLotusLayerCount;
  }

  public setCosmicLotusLayerCount(value: number): void {
    this.cosmicLotusLayerCount = Math.max(2, Math.min(12, value));
  }

  public getCosmicLotusPetalCount(): number {
    return this.cosmicLotusPetalCount;
  }

  public setCosmicLotusPetalCount(value: number): void {
    this.cosmicLotusPetalCount = Math.max(4, Math.min(16, value));
  }
}
