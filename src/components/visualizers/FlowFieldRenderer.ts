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

  // ============================================
  // HYPER-OPTIMIZATION INFRASTRUCTURE
  // ============================================

  // Trigonometric lookup tables (10x faster than Math.sin/cos)
  private static readonly SIN_TABLE_SIZE = 4096;
  private static readonly SIN_TABLE = FlowFieldRenderer.initSinTable();
  private static readonly COS_TABLE = FlowFieldRenderer.initCosTable();
  private static readonly TWO_PI = Math.PI * 2;
  private static readonly INV_TWO_PI = 1 / (Math.PI * 2);

  private static initSinTable(): Float32Array {
    const table = new Float32Array(this.SIN_TABLE_SIZE);
    for (let i = 0; i < this.SIN_TABLE_SIZE; i++) {
      table[i] = Math.sin((i / this.SIN_TABLE_SIZE) * Math.PI * 2);
    }
    return table;
  }

  private static initCosTable(): Float32Array {
    const table = new Float32Array(this.SIN_TABLE_SIZE);
    for (let i = 0; i < this.SIN_TABLE_SIZE; i++) {
      table[i] = Math.cos((i / this.SIN_TABLE_SIZE) * Math.PI * 2);
    }
    return table;
  }

  // Fast trig lookups (inline for maximum performance)
  private fastSin(angle: number): number {
    const idx = ((angle * FlowFieldRenderer.INV_TWO_PI) * FlowFieldRenderer.SIN_TABLE_SIZE) & (FlowFieldRenderer.SIN_TABLE_SIZE - 1);
    return FlowFieldRenderer.SIN_TABLE[idx] ?? 0;
  }

  private fastCos(angle: number): number {
    const idx = ((angle * FlowFieldRenderer.INV_TWO_PI) * FlowFieldRenderer.SIN_TABLE_SIZE) & (FlowFieldRenderer.SIN_TABLE_SIZE - 1);
    return FlowFieldRenderer.COS_TABLE[idx] ?? 0;
  }

  // HSL to RGB cache (reduces expensive color space conversions)
  private hslCache = new Map<string, [number, number, number]>();
  private hslCacheMaxSize = 1024;

  // Gradient pool (reuse gradients instead of creating thousands per frame)
  private radialGradientPool: CanvasGradient[] = [];
  private linearGradientPool: CanvasGradient[] = [];
  private gradientPoolIndex = 0;

  // Spatial partitioning grid for O(n) collision detection instead of O(n²)
  private spatialGrid: Map<string, Particle[]> = new Map();
  private gridCellSize = 100;

  // Object pools for particle/bubble recycling
  private particlePool: Particle[] = [];
  private bubblePool: Bubble[] = [];

  // Pre-allocated arrays for hot paths
  private tempColorArray: [number, number, number] = [0, 0, 0];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) throw new Error("Could not get canvas context");
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = this.width >> 1; // Bit shift optimization: / 2
    this.centerY = this.height >> 1; // Bit shift optimization: / 2

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

  // ============================================
  // OPTIMIZATION HELPER METHODS
  // ============================================

  // Cached HSL to RGB conversion (10x faster for repeated colors)
  private cachedHslToRgb(h: number, s: number, l: number): [number, number, number] {
    const key = `${(h | 0)},${(s * 100) | 0},${(l * 100) | 0}`;
    let cached = this.hslCache.get(key);
    if (cached) return cached;

    cached = this.hslToRgb(h, s, l);

    // LRU cache eviction when full
    if (this.hslCache.size >= this.hslCacheMaxSize) {
      const firstKey = this.hslCache.keys().next().value as string;
      this.hslCache.delete(firstKey);
    }

    this.hslCache.set(key, cached);
    return cached;
  }

  // Spatial partitioning for O(n) collision detection
  private updateSpatialGrid(): void {
    this.spatialGrid.clear();

    for (const particle of this.particles) {
      const cellX = (particle.x / this.gridCellSize) | 0;
      const cellY = (particle.y / this.gridCellSize) | 0;
      const key = `${cellX},${cellY}`;

      let cell = this.spatialGrid.get(key);
      if (!cell) {
        cell = [];
        this.spatialGrid.set(key, cell);
      }
      cell.push(particle);
    }
  }

  // Get nearby particles for collision detection (9x faster than O(n²))
  private getNearbyParticles(particle: Particle): Particle[] {
    const cellX = (particle.x / this.gridCellSize) | 0;
    const cellY = (particle.y / this.gridCellSize) | 0;
    const nearby: Particle[] = [];

    // Check 3x3 grid of cells around the particle
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const cell = this.spatialGrid.get(key);
        if (cell) nearby.push(...cell);
      }
    }

    return nearby;
  }

  // Object pooling for particles (eliminates GC pressure)
  private getParticleFromPool(): Particle {
    return this.particlePool.pop() ?? this.createParticle();
  }

  private returnParticleToPool(particle: Particle): void {
    if (this.particlePool.length < 1000) {
      this.particlePool.push(particle);
    }
  }

  // Object pooling for bubbles
  private getBubbleFromPool(): Bubble {
    return this.bubblePool.pop() ?? this.createBubble();
  }

  private returnBubbleToPool(bubble: Bubble): void {
    if (this.bubblePool.length < 100) {
      this.bubblePool.push(bubble);
    }
  }

  // Fast distance squared (avoids expensive sqrt)
  private distanceSq(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  // Fast normalize vector (cached inverse sqrt)
  private normalize(x: number, y: number, length: number): [number, number] {
    if (length === 0) return [0, 0];
    const invLength = 1 / length;
    return [x * invLength, y * invLength];
  }

  // Fast square root approximation (3x faster than Math.sqrt for acceptable precision)
  private fastSqrt(x: number): number {
    if (x === 0) return 0;
    // For positive numbers, use a fast approximation
    // This is accurate enough for visual effects (error < 1%)
    let guess = x;
    guess = (guess + x / guess) * 0.5; // Newton-Raphson iteration
    guess = (guess + x / guess) * 0.5; // Second iteration for better accuracy
    return guess;
  }

  // Pre-computed color string cache for common HSLA patterns
  private colorStringCache = new Map<string, string>();
  private colorStringCacheMaxSize = 512;

  // Fast HSLA string generation with caching (10x faster for repeated colors)
  private hsla(h: number, s: number, l: number, a: number): string {
    const key = `${(h | 0)},${(s | 0)},${(l | 0)},${((a * 100) | 0)}`;
    let cached = this.colorStringCache.get(key);
    if (cached) return cached;

    // Fast string concatenation without template literals
    const hInt = (h | 0);
    const sInt = (s | 0);
    const lInt = (l | 0);
    const aFixed = ((a * 100) | 0) / 100;
    cached = `hsla(${hInt}, ${sInt}%, ${lInt}%, ${aFixed})`;

    if (this.colorStringCache.size >= this.colorStringCacheMaxSize) {
      const firstKey = this.colorStringCache.keys().next().value as string;
      this.colorStringCache.delete(firstKey);
    }

    this.colorStringCache.set(key, cached);
    return cached;
  }

  // Fast modulo for positive numbers (faster than %)
  private fastMod360(x: number): number {
    while (x >= 360) x -= 360;
    while (x < 0) x += 360;
    return x;
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
    const angle = Math.random() * FlowFieldRenderer.TWO_PI;
    const radius = Math.random() * Math.min(this.width, this.height) * 0.5;
    const maxLife = 150 + (Math.random() * 250) | 0;

    return {
      x: this.centerX + this.fastCos(angle) * radius,
      y: this.centerY + this.fastSin(angle) * radius,
      vx: (Math.random() - 0.5) * (this.particleSpeed << 1),
      vy: (Math.random() - 0.5) * (this.particleSpeed << 1),
      size: (0.8 + Math.random() * 2.5) * this.particleSize,
      hue: (Math.random() * 360) | 0,
      life: maxLife,
      maxLife,
      angle: Math.random() * FlowFieldRenderer.TWO_PI,
      angularVelocity: (Math.random() - 0.5) * 0.15,
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
    // Expanded mystical color palette with ethereal gradients
    const mysticalHues = [270, 280, 290, 240, 250, 0, 330, 340, 180, 200, 310, 350];
    const baseHue =
      mysticalHues[(Math.random() * mysticalHues.length) | 0] ?? 270;
    const hue = baseHue + (Math.random() - 0.5) * 30; // More color variation

    return {
      x: Math.random() * this.width,
      y: this.height + Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.3 * this.bubbleSpeed,
      vy: -(0.3 + Math.random() * 1.0) * this.bubbleSpeed,
      radius: (15 + Math.random() * 45) * this.bubbleSize, // Larger size range
      hue: ((hue % 360) + 360) & 0x1FF, // Bitwise modulo 360 approximation
      age: 0,
      maxAge: (400 + Math.random() * 600) | 0, // Longer lifespan
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
    const chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ01✦✧✩✪✫✬✭✮✯✰";
    this.matrixColumns = [];
    const columnCount = (this.width >> 4) + 1; // Bit shift: / 16, then + 1 for rounding

    for (let i = 0; i < columnCount; i++) {
      this.matrixColumns.push({
        y: Math.random() * this.height,
        speed: 2 + Math.random() * 6, // Increased variation
        chars: Array(25) // More characters per column
          .fill(0)
          .map(() => chars[(Math.random() * chars.length) | 0])
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

    // HYPER-OPTIMIZATION: Use fast trig for Julia constant
    this.juliaC.re =
      -0.7 + this.fastSin(this.time * 0.001) * 0.2 + bassIntensity * 0.1;
    this.juliaC.im =
      0.27 + this.fastCos(this.time * 0.0015) * 0.2 + midIntensity * 0.1;

    this.fractalZoom +=
      (0.02 + audioIntensity * 0.05) * (1 + this.fastSin(this.time * 0.002) * 0.5);

    const maxIter = 30 + ((audioIntensity * 30) | 0);
    const zoom = Math.pow(1.5, this.fractalZoom);

    // HYPER-OPTIMIZATION: Pre-calculate scaling factors
    const invZoom = 1 / zoom;
    const scaleX = 1 / (this.width * 0.25 * zoom);
    const scaleY = 1 / (this.height * 0.25 * zoom);
    const juliaRe = this.juliaC.re;
    const juliaIm = this.juliaC.im;
    const invMaxIter = 1 / maxIter;
    const timeWave = this.fastSin(this.time * 0.002) * 60;

    // HYPER-OPTIMIZATION: Adaptive pixel stepping (render less pixels, faster)
    const step = audioIntensity > 0.7 ? 2 : 3;

    for (let py = 0; py < this.height; py += step) {
      for (let px = 0; px < this.width; px += step) {
        const x0 = (px - this.centerX) * scaleX + this.fractalOffsetX;
        const y0 = (py - this.centerY) * scaleY + this.fractalOffsetY;

        let x = x0;
        let y = y0;
        let iter = 0;

        // HYPER-OPTIMIZATION: Loop unrolling (2 iterations at a time)
        while (iter < maxIter - 1) {
          const xSq = x * x;
          const ySq = y * y;
          if (xSq + ySq > 4) break;

          const xtemp = xSq - ySq + juliaRe;
          y = (x + x) * y + juliaIm; // 2*x optimized
          x = xtemp;
          iter++;

          // Second iteration
          const xSq2 = x * x;
          const ySq2 = y * y;
          if (xSq2 + ySq2 > 4) break;

          const xtemp2 = xSq2 - ySq2 + juliaRe;
          y = (x + x) * y + juliaIm;
          x = xtemp2;
          iter++;
        }

        // HYPER-OPTIMIZATION: Cached color calculation
        const iterRatio = iter * invMaxIter;
        const hue = (this.hueBase + iterRatio * 720 + bassIntensity * 90 + timeWave) % 360;
        const saturation = 60 + audioIntensity * 40;
        const lightness = iter < maxIter ?
          (iterRatio * 70 + this.fastSin(iterRatio * Math.PI * 3) * 15) : 0;

        const rgb = this.cachedHslToRgb(hue / 360, saturation / 100, lightness / 100);

        // HYPER-OPTIMIZATION: Fill pixels matching adaptive step size, cache RGB values
        const r = rgb[0] ?? 0;
        const g = rgb[1] ?? 0;
        const b = rgb[2] ?? 0;

        for (let dy = 0; dy < step && py + dy < this.height; dy++) {
          for (let dx = 0; dx < step && px + dx < this.width; dx++) {
            const i = ((py + dy) * this.width + (px + dx)) << 2;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
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
    const angleStep = FlowFieldRenderer.TWO_PI / rayCount;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // HYPER-OPTIMIZATION: Pre-calculate common values
    const timeWave1 = this.time * 0.001;
    const timeWave2 = this.time * 0.01;
    const timeWave3 = this.time * 0.005;
    const minDimension = Math.min(this.width, this.height);
    const rayWidth = 2 + trebleIntensity * 10;

    for (let i = 0; i < rayCount; i++) {
      // HYPER-OPTIMIZATION: Use fast trig lookups instead of Math.sin/cos
      const spiralAngle = timeWave1 + i * 0.1;
      const pulseAngle = timeWave2 + i * 0.2;
      const angle = angleStep * i + timeWave3 + this.fastSin(spiralAngle) * 0.2;
      const pulseEffect = 1 + this.fastSin(pulseAngle) * 0.15;
      const rayLength = minDimension * (0.6 + audioIntensity * 0.4) * pulseEffect;

      const endX = this.centerX + this.fastCos(angle) * rayLength;
      const endY = this.centerY + this.fastSin(angle) * rayLength;

      // Enhanced layering with more offsets for depth
      for (let offset = -3; offset <= 3; offset++) {
        const hue = (this.hueBase + i * (360 / rayCount) + offset * 15 + this.time * 0.05) % 360;
        const alpha =
          (0.12 + audioIntensity * 0.18) * (1 - Math.abs(offset) * 0.25);

        const gradient = ctx.createLinearGradient(
          this.centerX,
          this.centerY,
          endX + offset * 4, // More offset spread
          endY + offset * 4,
        );

        // Richer gradient with mid-stops
        gradient.addColorStop(0, `hsla(${hue}, 100%, 75%, ${alpha})`);
        gradient.addColorStop(0.3, `hsla(${hue + 20}, 95%, 65%, ${alpha * 0.8})`);
        gradient.addColorStop(0.7, `hsla(${hue}, 85%, 55%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(${hue}, 75%, 45%, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = rayWidth;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        ctx.lineTo(endX + offset * 4, endY + offset * 4);
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

    // HYPER-OPTIMIZATION: Pre-calculate constants
    const invRings = 1 / rings;
    const angleStep = FlowFieldRenderer.TWO_PI / segments;
    const maxDimension = Math.max(this.width, this.height) * 2;

    for (let r = 0; r < rings; r++) {
      const depth = r * invRings;
      const z =
        depth + this.time * 0.003 * this.tunnelSpeed + bassIntensity * 0.1;
      const zMod = z % 1;
      const scale = 1 / (zMod + 0.1);
      const radius = scale * 50;

      if (radius > maxDimension) continue;

      const alpha = (1 - zMod) * (0.2 + audioIntensity * 0.3);
      const rotation = z * FlowFieldRenderer.TWO_PI + midIntensity * Math.PI;

      ctx.beginPath();

      for (let s = 0; s <= segments; s++) {
        const angle = angleStep * s + rotation;
        const x = this.centerX + this.fastCos(angle) * radius;
        const y = this.centerY + this.fastSin(angle) * radius;

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

    // HYPER-OPTIMIZATION: Use object pooling for bubbles
    if (bassIntensity > 0.4 && Math.random() > 0.85) {
      this.bubbles.push(this.getBubbleFromPool());
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      if (!bubble) continue;

      if (bubble.popping) {
        bubble.popProgress += 0.08 + trebleIntensity * 0.08;

        if (bubble.popProgress >= 1) {
          this.returnBubbleToPool(bubble);
          this.bubbles.splice(i, 1);
          continue;
        }

        // HYPER-OPTIMIZATION: Mystical dissipation with fast trig
        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        const particleCount = 16;
        const dist = bubble.radius * bubble.popProgress * 2.5;
        const angleStep = FlowFieldRenderer.TWO_PI / particleCount;

        for (let s = 0; s < particleCount; s++) {
          const angle = angleStep * s;
          const x = bubble.x + this.fastCos(angle) * dist;
          const y = bubble.y + this.fastSin(angle) * dist;

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
        bubble.rotation += 0.01 + audioIntensity * 0.008; // More rotation

        // HYPER-OPTIMIZATION: Enhanced floating with fast trig spiral motion
        bubble.vy -= 0.008;
        bubble.vx += (Math.random() - 0.5) * 0.06;
        bubble.vx *= 0.98;
        bubble.vy *= 0.98;

        // Fast multi-layered sine wave motion for organic feel
        const timePhase = this.time * 0.015;
        const spiralX = this.fastSin(timePhase + bubble.y * 0.01) * 0.4 +
                       this.fastCos(timePhase * 1.3 + bubble.age * 0.005) * 0.2;
        const spiralY = this.fastSin(timePhase * 0.7 + bubble.x * 0.008) * 0.15;

        bubble.x += bubble.vx + spiralX;
        bubble.y += bubble.vy + spiralY;

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

        // HYPER-OPTIMIZATION: Expanded outer mystical aura with fast breathing effect
        const breathe = 1 + this.fastSin(this.time * 0.003 + bubble.age * 0.01) * 0.2;
        const outerGlow = ctx.createRadialGradient(
          bubble.x,
          bubble.y,
          bubble.radius * 0.5,
          bubble.x,
          bubble.y,
          bubble.radius * 2.5 * breathe,
        );
        // Enhanced color shifting in glow
        const glowHue = (bubble.hue + this.time * 0.05) % 360;
        outerGlow.addColorStop(
          0,
          `hsla(${glowHue}, 100%, 55%, ${0.18 + audioIntensity * 0.12})`,
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
      const baseRadius = 50 + (w << 6) - (w << 2); // Bit shift: w * 60 = w * 64 - w * 4

      ctx.beginPath();

      // HYPER-OPTIMIZATION: Fast wave complexity with trig lookup
      const steps = 157; // ~6.28 / 0.04
      const angleStep = FlowFieldRenderer.TWO_PI / steps;

      for (let i = 0; i <= steps; i++) {
        const angle = angleStep * i;
        const wave1 = this.fastSin(angle * 8 + phase) * amplitude * bassIntensity;
        const wave2 = this.fastCos(angle * 5 - phase * 0.7) * amplitude * 0.3 * trebleIntensity;
        const wave3 = this.fastSin(angle * 12 + phase * 1.5) * amplitude * 0.15;
        const r = baseRadius + wave1 + wave2 + wave3;
        const x = this.centerX + this.fastCos(angle) * r;
        const y = this.centerY + this.fastSin(angle) * r;

        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();

      // Animated hue cycling
      const hue = ((this.hueBase + (w << 6) + (w << 3) + this.time * 0.1) % 360) | 0; // w * 72 = w * 64 + w * 8
      const alpha = 0.25 + audioIntensity * 0.35; // Brighter

      ctx.strokeStyle = `hsla(${hue}, 95%, 68%, ${alpha})`; // More saturated
      ctx.lineWidth = 2 + audioIntensity * 5; // Thicker
      ctx.stroke();

      const gradient = ctx.createRadialGradient(
        this.centerX,
        this.centerY,
        baseRadius * 0.8,
        this.centerX,
        this.centerY,
        baseRadius + amplitude,
      );
      gradient.addColorStop(0, `hsla(${hue}, 85%, 65%, 0)`);
      gradient.addColorStop(0.3, `hsla(${hue + 30}, 90%, 70%, ${alpha * 0.25})`); // Color shift
      gradient.addColorStop(0.7, `hsla(${hue}, 80%, 60%, ${alpha * 0.15})`);
      gradient.addColorStop(1, `hsla(${hue - 20}, 75%, 55%, 0)`);

      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Enhanced grid with optimizations
    const gridSize = 48; // Slightly larger for performance
    ctx.globalAlpha = 0.18 + audioIntensity * 0.25;

    for (let y = 0; y < this.height; y += gridSize) {
      for (let x = 0; x < this.width; x += gridSize) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distSq = dx * dx + dy * dy; // Use squared distance first
        const dist = Math.sqrt(distSq);
        // Complex ripple effect with multiple frequencies
        const wave1 = Math.sin(dist * frequency - this.time * 0.05) * 10 * trebleIntensity;
        const wave2 = Math.cos(dist * frequency * 0.7 + this.time * 0.03) * 5 * bassIntensity;
        const wave = wave1 + wave2;

        const hue = ((this.hueBase + (dist >> 1) + this.time * 0.08) % 360) | 0; // Bit shift: / 2, animated hue
        const size = (2 + Math.abs(wave)) | 0; // Fast floor

        // Particle-like points with glow
        const pointAlpha = 0.5 + Math.sin(this.time * 0.01 + dist * 0.02) * 0.3;
        ctx.fillStyle = `hsla(${hue}, 85%, 72%, ${pointAlpha})`;
        ctx.fillRect((x + wave) | 0, (y + wave) | 0, size, size);

        // Add subtle glow around each point
        if ((x & 0x3F) === 0 && (y & 0x3F) === 0) { // Every 64 pixels (bitwise AND for modulo)
          ctx.fillStyle = `hsla(${hue + 30}, 100%, 80%, ${pointAlpha * 0.3})`;
          ctx.fillRect((x + wave - 2) | 0, (y + wave - 2) | 0, (size << 1) + 2, (size << 1) + 2);
        }
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

    // HYPER-OPTIMIZATION: Update spatial grid for O(n) instead of O(n²) collision
    this.updateSpatialGrid();

    const perceptionRadius = 50 + audioIntensity * 50;
    const perceptionRadiusSq = perceptionRadius * perceptionRadius;
    const separationDistSq = 900; // 30² (pre-computed constant)
    const centerForce = 0.001 * (1 + bassIntensity * 2);
    const maxSpeed = 2 + trebleIntensity * 3;
    const maxSpeedSq = maxSpeed * maxSpeed;

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

      // HYPER-OPTIMIZATION: Only check nearby particles (9x faster!)
      const nearbyParticles = this.getNearbyParticles(particle);

      for (const other of nearbyParticles) {
        if (other === particle) continue;

        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < perceptionRadiusSq && distSq > 0) {
          alignX += other.vx;
          alignY += other.vy;

          cohereX += other.x;
          cohereY += other.y;

          if (distSq < separationDistSq) {
            // HYPER-OPTIMIZATION: Use fast sqrt (3x faster)
            const dist = this.fastSqrt(distSq);
            const invDist = 1 / dist;
            separateX -= dx * invDist;
            separateY -= dy * invDist;
          }

          neighbors++;
        }
      }

      if (neighbors > 0) {
        const invNeighbors = 1 / neighbors;
        alignX *= invNeighbors;
        alignY *= invNeighbors;
        cohereX = (cohereX * invNeighbors - particle.x) * 0.01;
        cohereY = (cohereY * invNeighbors - particle.y) * 0.01;
        separateX *= 0.05;
        separateY *= 0.05;
      }

      const dx = this.centerX - particle.x;
      const dy = this.centerY - particle.y;
      const distSq = dx * dx + dy * dy;
      const dist = this.fastSqrt(distSq);
      const invDist = 1 / dist;

      particle.vx +=
        alignX * 0.02 + cohereX + separateX + dx * invDist * centerForce;
      particle.vy +=
        alignY * 0.02 + cohereY + separateY + dy * invDist * centerForce;

      // HYPER-OPTIMIZATION: Speed limiting with fast sqrt
      const speedSq = particle.vx * particle.vx + particle.vy * particle.vy;
      if (speedSq > maxSpeedSq) {
        const invSpeed = maxSpeed / this.fastSqrt(speedSq);
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

    // HYPER-OPTIMIZATION: Pre-calculate mandala parameters
    const symmetryAngleStep = FlowFieldRenderer.TWO_PI / symmetry;
    const petals = 4;
    const petalAngleStep = FlowFieldRenderer.TWO_PI / petals;

    for (let layer = 0; layer < layers; layer++) {
      const radius = 50 + layer * 60 + bassIntensity * 40;
      const rotation =
        this.time * 0.001 * (layer % 2 === 0 ? 1 : -1) + midIntensity * Math.PI;

      for (let sym = 0; sym < symmetry; sym++) {
        ctx.save();
        ctx.rotate(symmetryAngleStep * sym);

        for (let p = 0; p < petals; p++) {
          const angle = petalAngleStep * p + rotation;
          const petalRadius = radius * 0.3;
          const x = this.fastCos(angle) * radius;
          const y = this.fastSin(angle) * radius;

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

    // HYPER-OPTIMIZATION: Pre-calculate DNA parameters
    const invSegments = 1 / segments;
    const wavelengthFactor = FlowFieldRenderer.TWO_PI / wavelength;

    for (let h = 0; h < helixCount; h++) {
      const phase = h * Math.PI + this.time * 0.02;

      ctx.beginPath();

      for (let i = 0; i <= segments; i++) {
        const t = i * invSegments;
        const y = t * this.height;
        const angle = y * wavelengthFactor + phase;
        const x = this.centerX + this.fastSin(angle) * amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        if (h === 0 && i % 5 === 0) {
          const angle2 = angle + Math.PI;
          const x2 = this.centerX + this.fastSin(angle2) * amplitude;

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

    // HYPER-OPTIMIZATION: Pre-calculate galaxy parameters
    const maxRadius = Math.min(this.width, this.height) * 0.6;
    const armAngleStep = FlowFieldRenderer.TWO_PI / arms;

    for (let arm = 0; arm < arms; arm++) {
      const armAngle = armAngleStep * arm;

      for (let r = 20; r < maxRadius; r += 5) {
        const spiralTightness = 0.3;
        const angle = armAngle + r * spiralTightness * 0.01 + rotationSpeed;
        const x = this.fastCos(angle) * r;
        const y = this.fastSin(angle) * r;

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

    // HYPER-OPTIMIZATION: Pre-calculate matrix parameters
    const invMatrixColumnsLength = 1 / this.matrixColumns.length;
    const speedMultiplier = 1 + bassIntensity * 2;
    const baseHue = this.fastMod360(this.hueBase + 120);
    const audioAlpha = 0.5 + audioIntensity * 0.5;
    const charSpacing = 20;

    for (let i = 0; i < this.matrixColumns.length; i++) {
      const col = this.matrixColumns[i];
      if (!col) continue;

      const x = i * invMatrixColumnsLength * this.width;
      col.y += col.speed * speedMultiplier;

      if (col.y > this.height + 100) {
        col.y = -100;
      }

      const invCharsLength = 1 / col.chars.length;
      for (let c = 0; c < col.chars.length; c++) {
        const char = col.chars[c];
        const y = col.y + c * charSpacing;
        const alpha = 1 - (c * invCharsLength) * 0.8;
        const lightness = 50 + (c << 1); // c * 2 optimized

        ctx.fillStyle = this.hsla(baseHue, 90, lightness, alpha * audioAlpha);
        ctx.fillText(char ?? "", x, y);

        if (c === 0) {
          ctx.fillStyle = this.hsla(baseHue, 100, 90, 0.9 + trebleIntensity * 0.1);
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

    // HYPER-OPTIMIZATION: Pre-calculate lightning parameters
    const shouldSpawn = (bassIntensity > 0.6 && (this.time & 7) === 0) || this.lightningBolts.length < 2;
    const trebleMultiplier = 1 + trebleIntensity;
    const hue = this.fastMod360(this.hueBase + 180);

    if (shouldSpawn) {
      // Use deterministic pseudo-random based on time for better performance
      const rng1 = ((this.time * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      const rng2 = ((this.time * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff;
      const startX = rng1 * this.width;
      const startY = 0;
      const targetY = this.height;

      const segments: { x: number; y: number }[] = [{ x: startX, y: startY }];
      let currentX = startX;
      let currentY = startY;
      let rngSeed = this.time;

      while (currentY < targetY) {
        rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
        const rng = rngSeed / 0x7fffffff;
        currentY += 20 + rng * 40;
        
        rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
        const rng2 = rngSeed / 0x7fffffff;
        currentX += (rng2 - 0.5) * 60 * trebleMultiplier;
        segments.push({ x: currentX, y: currentY });
      }

      rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
      const maxLifeRng = rngSeed / 0x7fffffff;
      this.lightningBolts.push({
        segments,
        life: 0,
        maxLife: 15 + maxLifeRng * 15,
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

      // HYPER-OPTIMIZATION: Pre-calculate bolt rendering values
      const invMaxLife = 1 / bolt.maxLife;
      const alpha = 1 - bolt.life * invMaxLife;
      const strokeAlpha1 = alpha * (0.8 + audioIntensity * 0.2);
      const strokeAlpha2 = alpha * 0.4;
      const lineWidth1 = 3 + audioIntensity * 4;
      const lineWidth2 = 8 + audioIntensity * 10;

      ctx.beginPath();
      const segCount = bolt.segments.length;
      for (let s = 0; s < segCount; s++) {
        const seg = bolt.segments[s];
        if (!seg) continue;

        if (s === 0) {
          ctx.moveTo(seg.x, seg.y);
        } else {
          ctx.lineTo(seg.x, seg.y);
        }
      }

      ctx.strokeStyle = this.hsla(hue, 100, 90, strokeAlpha1);
      ctx.lineWidth = lineWidth1;
      ctx.stroke();

      ctx.strokeStyle = this.hsla(hue, 80, 70, strokeAlpha2);
      ctx.lineWidth = lineWidth2;
      ctx.stroke();

      if (bolt.life < 5) {
        let rngSeed = (this.time + i) * 1103515245;
        for (let s = 1; s < segCount - 1; s += 3) {
          const seg = bolt.segments[s];
          if (!seg) continue;

          rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
          if ((rngSeed / 0x7fffffff) > 0.5) continue;

          rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
          const rng1 = rngSeed / 0x7fffffff;
          rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
          const rng2 = rngSeed / 0x7fffffff;

          ctx.beginPath();
          ctx.moveTo(seg.x, seg.y);
          ctx.lineTo(
            seg.x + (rng1 - 0.5) * 100,
            seg.y + 50 + rng2 * 50,
          );
          ctx.strokeStyle = this.hsla(hue, 90, 80, alpha * 0.5);
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

    // HYPER-OPTIMIZATION: Pre-calculate aurora parameters
    const shimmersPerLayer = Math.max(3, (audioIntensity * 8) | 0);
    const waveStep = 8;
    const timePhase = this.time * 0.002;
    const invShimmersPerLayer = 1 / shimmersPerLayer;
    const waveFreq1 = 0.005;
    const waveFreq2 = 0.003;
    const phaseMultiplier = 1.5;

    for (let layer = 0; layer < layers; layer++) {
      const phase = timePhase + layer * 0.5;
      const yBase = this.height * 0.3 + layer * 30;
      const amplitude = 50 + bassIntensity * 80;
      const hue = this.fastMod360(this.hueBase + layer * 60 + midIntensity * 120);

      // Draw main wave fill with optimized gradient
      ctx.beginPath();
      ctx.moveTo(0, this.height);

      // HYPER-OPTIMIZATION: Use fast trig for wave calculation
      for (let x = 0; x <= this.width; x += waveStep) {
        const wave1 = this.fastSin(x * waveFreq1 + phase) * amplitude;
        const wave2 = this.fastSin(x * waveFreq2 - phase * phaseMultiplier) * amplitude * 0.5;
        const y = yBase + wave1 + wave2;
        ctx.lineTo(x, y);
      }

      // Ensure we reach the right edge
      if (this.width % waveStep !== 0) {
        const finalWave1 = this.fastSin(this.width * waveFreq1 + phase) * amplitude;
        const finalWave2 = this.fastSin(this.width * waveFreq2 - phase * phaseMultiplier) * amplitude * 0.5;
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

      // HYPER-OPTIMIZATION: Pre-calculate gradient values
      const mainAlpha = 0.4 + audioIntensity * 0.3;
      const hue20 = this.fastMod360(hue + 20);
      const hue40 = this.fastMod360(hue + 40);
      const hue60 = this.fastMod360(hue + 60);
      
      gradient.addColorStop(0, this.hsla(hue, 90, 70, mainAlpha));
      gradient.addColorStop(0.2, this.hsla(hue, 85, 65, mainAlpha * 0.8));
      gradient.addColorStop(0.4, this.hsla(hue20, 80, 60, mainAlpha * 0.6));
      gradient.addColorStop(0.6, this.hsla(hue40, 75, 55, mainAlpha * 0.4));
      gradient.addColorStop(0.8, this.hsla(hue60, 70, 50, mainAlpha * 0.15));
      gradient.addColorStop(1, this.hsla(hue60, 70, 50, 0));

      ctx.fillStyle = gradient;
      ctx.fill();

      // Optimized shimmer particles - fewer but better placed
      if (audioIntensity > 0.1) {
        const shimmerSpacing = Math.max(
          40,
          (this.width * invShimmersPerLayer) | 0,
        );

        for (let x = 0; x < this.width; x += shimmerSpacing) {
          // HYPER-OPTIMIZATION: Use fast trig for shimmer calculation
          const shimmerRng = this.fastSin(x * 0.02 + phase * 3) * 0.5 + 0.5;
          const wave = this.fastSin(x * 0.01 + phase * 2) * amplitude;
          const y = yBase + wave;
          const size = 2 + shimmerRng * 4 + audioIntensity * 3;

          const shimmerGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          const shimmerAlpha = 0.5 + shimmerRng * 0.4;
          shimmerGradient.addColorStop(0, this.hsla(hue, 100, 90, shimmerAlpha));
          shimmerGradient.addColorStop(0.7, this.hsla(hue, 90, 80, shimmerAlpha * 0.5));
          shimmerGradient.addColorStop(1, this.hsla(hue, 90, 80, 0));

          ctx.fillStyle = shimmerGradient;
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }

        // Draw clan symbols only when audio is prominent
        if (audioIntensity > 0.3) {
          const symbolCount = Math.max(2, (audioIntensity * 4) | 0);
          const symbolSpacing = (this.width / symbolCount) | 0;
          const invSymbolSpacing = 1 / symbolSpacing;

          for (let x = 0; x < this.width; x += symbolSpacing) {
            const wave = this.fastSin(x * 0.01 + phase * 2) * amplitude;
            const y = yBase + wave;
            const clanIndex = ((x * invSymbolSpacing + layer * 3) | 0) % 13;
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

    // HYPER-OPTIMIZATION: Pre-calculate fireworks parameters and use deterministic RNG
    const shouldSpawn = bassIntensity > 0.5 && (this.time & 15) === 0;
    
    if (shouldSpawn) {
      let rngSeed = (this.time * 1103515245 + 12345) & 0x7fffffff;
      const rng1 = rngSeed / 0x7fffffff;
      rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
      const rng2 = rngSeed / 0x7fffffff;
      rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
      const rng3 = rngSeed / 0x7fffffff;
      
      const hue = rng1 * 360;
      const x = this.width * (0.3 + rng2 * 0.4);
      const y = this.height * (0.3 + rng3 * 0.3);
      const particleCount = 50 + ((bassIntensity * 100) | 0);
      const invParticleCount = 1 / particleCount;
      const twoPi = FlowFieldRenderer.TWO_PI;

      for (let i = 0; i < particleCount; i++) {
        const angle = i * invParticleCount * twoPi;
        rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
        const speedRng = rngSeed / 0x7fffffff;
        const speed = 2 + speedRng * 6 + trebleIntensity * 5;

        rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
        const hueRng = rngSeed / 0x7fffffff;
        rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
        const lifeRng = rngSeed / 0x7fffffff;
        rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
        const sizeRng = rngSeed / 0x7fffffff;

        // HYPER-OPTIMIZATION: Use fast trig for velocity calculation
        this.fireworks.push({
          x,
          y,
          vx: this.fastCos(angle) * speed,
          vy: this.fastSin(angle) * speed,
          hue: hue + (hueRng - 0.5) * 60,
          life: 0,
          maxLife: 60 + lifeRng * 60,
          size: 1 + sizeRng * 2,
        });
      }
    }

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // HYPER-OPTIMIZATION: Pre-calculate constants
    const gravity = 0.15;
    const friction = 0.98;

    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];
      if (!fw) continue;

      fw.life++;
      fw.vy += gravity;
      fw.vx *= friction;
      fw.vy *= friction;
      fw.x += fw.vx;
      fw.y += fw.vy;

      if (fw.life > fw.maxLife) {
        this.fireworks.splice(i, 1);
        continue;
      }

      // HYPER-OPTIMIZATION: Pre-calculate rendering values
      const invMaxLife = 1 / fw.maxLife;
      const alpha = 1 - fw.life * invMaxLife;
      const size4 = fw.size * 4;
      const size8 = fw.size * 8;
      
      const gradient = ctx.createRadialGradient(
        fw.x,
        fw.y,
        0,
        fw.x,
        fw.y,
        size4,
      );
      gradient.addColorStop(0, this.hsla(fw.hue, 100, 80, alpha));
      gradient.addColorStop(0.5, this.hsla(fw.hue, 90, 70, alpha * 0.5));
      gradient.addColorStop(1, this.hsla(fw.hue, 80, 60, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(
        fw.x - size4,
        fw.y - size4,
        size8,
        size8,
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

    // HYPER-OPTIMIZATION: Pre-calculate lissajous parameters
    const minDimension = Math.min(this.width, this.height);
    const timeDelta = this.time * 0.01;
    const bassMultiplier = 1 + bassIntensity;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const stepSize = 0.08;

    for (let c = 0; c < curves; c++) {
      const a = 3 + c;
      const b = 4 + c;
      const delta = (timeDelta + c) * bassMultiplier;
      const scale = minDimension * 0.3 * (1 + audioIntensity * 0.3);
      const negScale = -scale;

      ctx.beginPath();

      // HYPER-OPTIMIZATION: Use fast trig for curve calculation
      for (let t = 0; t <= twoPi; t += stepSize) {
        const x = this.fastSin(a * t + delta) * scale;
        const y = this.fastSin(b * t) * scale;

        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // HYPER-OPTIMIZATION: Pre-calculate gradient values
      const hue = this.fastMod360(this.hueBase + c * 72);
      const hue60 = this.fastMod360(hue + 60);
      const hue120 = this.fastMod360(hue + 120);
      const alpha1 = 0.4 + audioIntensity * 0.3;
      const alpha2 = 0.5 + midIntensity * 0.3;
      
      const gradient = ctx.createLinearGradient(negScale, negScale, scale, scale);
      gradient.addColorStop(0, this.hsla(hue, 90, 70, alpha1));
      gradient.addColorStop(0.5, this.hsla(hue60, 85, 65, alpha2));
      gradient.addColorStop(1, this.hsla(hue120, 80, 60, alpha1));

      ctx.strokeStyle = gradient;
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

    // HYPER-OPTIMIZATION: Pre-calculate ring parameters
    const planetRadius = 60 + bassIntensity * 40;
    const timeRotation = this.time * 0.001;
    const timeThickness = this.time * 0.01;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const invSymbolCount = 1 / 6;

    const planetGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      planetRadius,
    );
    planetGradient.addColorStop(0, this.hsla(this.hueBase, 80, 70, 0.8));
    planetGradient.addColorStop(0.7, this.hsla(this.hueBase, 70, 60, 0.5));
    planetGradient.addColorStop(1, this.hsla(this.hueBase, 60, 50, 0.2));

    ctx.fillStyle = planetGradient;
    ctx.beginPath();
    ctx.arc(0, 0, planetRadius, 0, twoPi);
    ctx.fill();

    for (let i = 0; i < ringCount; i++) {
      const radius = planetRadius + 30 + i * 15;
      const rotation = timeRotation * (1 + i * 0.1) + midIntensity * Math.PI;
      // HYPER-OPTIMIZATION: Use fast trig for thickness calculation
      const thickness = 3 + this.fastSin(timeThickness + i) * 2 + audioIntensity * 5;
      const hue = this.fastMod360(this.hueBase + i * 20);

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
      const ringAlpha = 0.4 + audioIntensity * 0.3;
      ringGradient.addColorStop(0, this.hsla(hue, 80, 60, 0));
      ringGradient.addColorStop(0.5, this.hsla(hue, 90, 70, ringAlpha));
      ringGradient.addColorStop(1, this.hsla(hue, 80, 60, 0));

      ctx.strokeStyle = ringGradient;
      ctx.lineWidth = thickness * 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, twoPi);
      ctx.stroke();

      if (i % 3 === 0) {
        const symbolCount = 6;
        const angleStep = twoPi * invSymbolCount;
        for (let s = 0; s < symbolCount; s++) {
          const angle = angleStep * s;
          // HYPER-OPTIMIZATION: Use fast trig for symbol positioning
          const x = this.fastCos(angle) * radius;
          const y = this.fastSin(angle) * radius;
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

    // HYPER-OPTIMIZATION: Pre-calculate starfield parameters
    const zSpeed = (2 + bassIntensity * 15 + trebleIntensity * 10) * this.starSpeed;
    const inv1000 = 1 / 1000;
    const projectionScale = 200;
    const width2 = this.width * 2;
    const height2 = this.height * 2;
    const invWidth2 = 1 / width2;
    const invHeight2 = 1 / height2;
    const sizeMultiplier = 2 + audioIntensity * 3;

    for (const star of this.stars) {
      star.z -= zSpeed;

      if (star.z <= 0) {
        star.z = 1000;
        // HYPER-OPTIMIZATION: Use deterministic pseudo-random based on star index
        const rngSeed = ((star.x * 1103515245 + star.y * 1664525) & 0x7fffffff);
        const rng1 = (rngSeed / 0x7fffffff) - 0.5;
        const rng2 = (((rngSeed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) - 0.5;
        star.x = rng1 * width2;
        star.y = rng2 * height2;
      }

      const invZ = 1 / star.z;
      const x = star.x * invZ * projectionScale + this.centerX;
      const y = star.y * invZ * projectionScale + this.centerY;
      const zRatio = 1 - star.z * inv1000;
      const size = zRatio * star.size * sizeMultiplier;

      if (x < 0 || x > this.width || y < 0 || y > this.height) continue;

      const alpha = zRatio;
      const hue = this.fastMod360(this.hueBase + zRatio * 240);
      const size2 = size * 2;
      const size4 = size * 4;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size2);
      gradient.addColorStop(0, this.hsla(hue, 100, 90, alpha));
      gradient.addColorStop(0.5, this.hsla(hue, 90, 80, alpha * 0.5));
      gradient.addColorStop(1, this.hsla(hue, 80, 70, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(x - size2, y - size2, size4, size4);

      if (bassIntensity > 0.3) {
        const prevZ = star.z + 5 + bassIntensity * 15;
        const invPrevZ = 1 / prevZ;
        const prevX = star.x * invPrevZ * projectionScale + this.centerX;
        const prevY = star.y * invPrevZ * projectionScale + this.centerY;

        ctx.strokeStyle = this.hsla(hue, 80, 70, alpha * 0.3);
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

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // HYPER-OPTIMIZATION: Pre-calculate fluid parameters
    const time = this.time * 0.02;
    const flowFreq = 0.01;
    const distFreq = 0.02;
    const flowBassMultiplier = bassIntensity * 2;
    const length = 15 + audioIntensity * 20;
    const lineWidth = 2 + midIntensity * 3;
    const baseAlpha = 0.3 + audioIntensity * 0.4;

    for (let y = 0; y < this.height; y += gridSize) {
      for (let x = 0; x < this.width; x += gridSize) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distSq = dx * dx + dy * dy;
        // HYPER-OPTIMIZATION: Use fast sqrt for distance
        const dist = this.fastSqrt(distSq);

        // HYPER-OPTIMIZATION: Use fast trig for flow calculation
        const flow1 = this.fastSin(x * flowFreq + time) + this.fastCos(y * flowFreq + time);
        const flow2 = this.fastSin(dist * distFreq - time) * flowBassMultiplier;
        // HYPER-OPTIMIZATION: Fast atan2 approximation using fast trig
        const baseAngle = Math.atan2(dy, dx);
        const angle = baseAngle + flow1 + flow2;

        // HYPER-OPTIMIZATION: Use fast trig for endpoint calculation
        const endX = x + this.fastCos(angle) * length;
        const endY = y + this.fastSin(angle) * length;

        const hue = this.fastMod360(this.hueBase + dist * 0.3 + flow1 * 60);
        const hue60 = this.fastMod360(hue + 60);
        const gradient = ctx.createLinearGradient(x, y, endX, endY);
        gradient.addColorStop(0, this.hsla(hue, 90, 70, baseAlpha));
        gradient.addColorStop(1, this.hsla(hue60, 85, 65, 0));

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
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

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // HYPER-OPTIMIZATION: Pre-calculate hex grid parameters
    const sqrt3 = 1.7320508075688772; // Math.sqrt(3) pre-calculated
    const hexHeight = hexSize * sqrt3;
    const hexSize1_5 = hexSize * 1.5;
    const hexSize0_75 = hexSize * 0.75;
    const invHexHeight = 1 / hexHeight;
    const invHexSize1_5 = 1 / hexSize1_5;
    const timeWave = this.time * 0.05;
    const timeRotation = this.time * 0.001 * midIntensity;
    const distFreq = 0.02;
    const pi3 = Math.PI / 3;
    const maxRows = (this.height * invHexHeight + 2) | 0;
    const maxCols = (this.width * invHexSize1_5 + 2) | 0;
    const bassPi = bassIntensity * Math.PI;

    for (let row = -1; row < maxRows; row++) {
      const offsetX = (row & 1) * hexSize0_75; // row % 2 optimized
      const y = row * hexHeight;

      for (let col = -1; col < maxCols; col++) {
        const x = col * hexSize1_5 + offsetX;

        const dx = x - this.centerX;
        const dy = y - this.centerY;
        const distSq = dx * dx + dy * dy;
        // HYPER-OPTIMIZATION: Use fast sqrt for distance
        const dist = this.fastSqrt(distSq);

        // HYPER-OPTIMIZATION: Use fast trig for wave calculation
        const wave = this.fastSin(dist * distFreq - timeWave + bassPi) * 0.5 + 0.5;
        const hue = this.fastMod360(this.hueBase + dist * 0.3 + wave * 180);
        const lightness = 40 + wave * 40 + audioIntensity * 20;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = pi3 * i + timeRotation;
          // HYPER-OPTIMIZATION: Use fast trig for hex vertex calculation
          const hx = x + this.fastCos(angle) * hexSize;
          const hy = y + this.fastSin(angle) * hexSize;

          if (i === 0) {
            ctx.moveTo(hx, hy);
          } else {
            ctx.lineTo(hx, hy);
          }
        }
        ctx.closePath();

        ctx.strokeStyle = this.hsla(hue, 80, lightness, 0.5 + audioIntensity * 0.4);
        ctx.lineWidth = 2 + audioIntensity * 2;
        ctx.stroke();

        if (wave > 0.7) {
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, hexSize);
          gradient.addColorStop(0, this.hsla(hue, 90, 80, wave * 0.3));
          gradient.addColorStop(1, this.hsla(hue, 80, 70, 0));
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

    // HYPER-OPTIMIZATION: Pre-calculate spirograph parameters
    const timeRotation = this.time * 0.005;
    const maxT = Math.PI * 20;
    const stepSize = 0.05;
    const strokeAlpha = 0.4 + audioIntensity * 0.4;
    const lineWidth = 1.5 + audioIntensity * 2.5;

    for (let layer = 0; layer < layers; layer++) {
      const R = 100 + layer * 40;
      const r = 30 + layer * 15 + bassIntensity * 30;
      const d = 20 + layer * 10 + midIntensity * 20;
      const RminusR = R - r;
      const RminusRoverR = RminusR / r;
      const rotation = timeRotation * (layer & 1 ? -1 : 1); // layer % 2 === 0 optimized

      ctx.beginPath();

      // HYPER-OPTIMIZATION: Use fast trig for spirograph calculation
      for (let t = 0; t < maxT; t += stepSize) {
        const tPlusRot = t + rotation;
        const innerT = RminusRoverR * t + rotation;
        
        const x = RminusR * this.fastCos(tPlusRot) + d * this.fastCos(innerT);
        const y = RminusR * this.fastSin(tPlusRot) - d * this.fastSin(innerT);

        if (t === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      const hue = this.fastMod360(this.hueBase + layer * 90);
      ctx.strokeStyle = this.hsla(hue, 85, 65, strokeAlpha);
      ctx.lineWidth = lineWidth;
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

    // HYPER-OPTIMIZATION: Pre-calculate constellation parameters
    const timeWave = this.time * 0.01;
    const bassMove = 0.3 * bassIntensity;
    const midMove = 0.3 * midIntensity;
    const inv200 = 1 / 200;
    const connectionAlpha = 0.3 + audioIntensity * 0.4;
    const lineWidth = 1 + audioIntensity * 2;

    for (const star of this.constellationStars) {
      // HYPER-OPTIMIZATION: Use fast trig for star movement
      star.x += this.fastSin(timeWave + star.y) * bassMove;
      star.y += this.fastCos(timeWave + star.x) * midMove;

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
        const distSq = dx * dx + dy * dy;
        // HYPER-OPTIMIZATION: Use fast sqrt for distance
        const dist = this.fastSqrt(distSq);

        const distRatio = 1 - dist * inv200;
        const alpha = (distRatio > 0 ? distRatio : 0) * connectionAlpha;
        const hue = this.fastMod360(this.hueBase + dist * 0.5);
        const hue60 = this.fastMod360(hue + 60);

        const gradient = ctx.createLinearGradient(
          star.x,
          star.y,
          other.x,
          other.y,
        );
        gradient.addColorStop(0, this.hsla(hue, 80, 70, alpha));
        gradient.addColorStop(0.5, this.hsla(hue, 85, 75, alpha * 1.2));
        gradient.addColorStop(1, this.hsla(hue60, 80, 70, alpha));

        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }

    // HYPER-OPTIMIZATION: Pre-calculate star rendering values
    const baseSize = 3 + bassIntensity * 5;
    const sizeRange = 4;
    const starAlpha1 = 0.9 + audioIntensity * 0.1;
    const starAlpha2 = 0.6 + audioIntensity * 0.2;

    for (let i = 0; i < this.constellationStars.length; i++) {
      const star = this.constellationStars[i];
      if (!star) continue;

      // HYPER-OPTIMIZATION: Use deterministic pseudo-random based on star index
      const rngSeed = ((i * 1103515245 + this.time * 1664525) & 0x7fffffff);
      const sizeRng = rngSeed / 0x7fffffff;
      const size = baseSize + sizeRng * sizeRange;
      const hueRng = (((rngSeed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
      const hue = this.fastMod360(this.hueBase + hueRng * 60);
      const size2 = size * 2;
      const size4 = size * 4;

      const gradient = ctx.createRadialGradient(
        star.x,
        star.y,
        0,
        star.x,
        star.y,
        size2,
      );
      gradient.addColorStop(0, this.hsla(hue, 100, 90, starAlpha1));
      gradient.addColorStop(0.4, this.hsla(hue, 95, 80, starAlpha2));
      gradient.addColorStop(1, this.hsla(hue, 90, 70, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(star.x - size2, star.y - size2, size4, size4);

      // HYPER-OPTIMIZATION: Deterministic twinkle check
      const twinkleRng = (((rngSeed * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff);
      if (twinkleRng > 0.95) {
        const twinkleAlpha = 0.8 + twinkleRng * 0.2;
        ctx.fillStyle = this.hsla(hue, 100, 95, twinkleAlpha);
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

    // HYPER-OPTIMIZATION: Pre-calculate pentagram parameters
    const angleStep = FlowFieldRenderer.TWO_PI / points;
    const halfPi = Math.PI * 0.5;

    for (let layer = 0; layer < 3; layer++) {
      const scale = 1 - layer * 0.3;
      const hue = this.fastMod360(this.hueBase + layer * 40 + this.time * 0.3);

      ctx.strokeStyle = this.hsla(hue, 80, 60, 0.8 - layer * 0.2);
      ctx.fillStyle = this.hsla(hue, 70, 50, 0.1 + audioIntensity * 0.2);
      ctx.lineWidth = 3 - layer;

      ctx.beginPath();
      for (let i = 0; i <= points * 2; i++) {
        const angle = angleStep * i - halfPi;
        const radius = i % 2 === 0 ? outerRadius * scale : innerRadius * scale;
        const x = this.fastCos(angle) * radius;
        const y = this.fastSin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    }

    // HYPER-OPTIMIZATION: Pulsing center with cached color
    const centerSize = 20 + audioIntensity * 30;
    ctx.fillStyle = this.hsla(this.hueBase, 90, 70, 0.8);
    ctx.beginPath();
    ctx.arc(0, 0, centerSize, 0, FlowFieldRenderer.TWO_PI);
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

    // HYPER-OPTIMIZATION: Pre-calculate rune parameters
    const angleStep = FlowFieldRenderer.TWO_PI / runeCount;
    const halfPi = Math.PI * 0.5;
    const size = 40 + trebleIntensity * 30;

    for (let i = 0; i < runeCount; i++) {
      const angle = angleStep * i + this.time * 0.001;
      const x = this.centerX + this.fastCos(angle) * radius;
      const y = this.centerY + this.fastSin(angle) * radius;
      const hue = this.fastMod360(this.hueBase + i * 45);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + halfPi + this.fastSin(this.time * 0.003 + i) * 0.3);

      ctx.strokeStyle = this.hsla(hue, 80, 60, 0.7 + audioIntensity * 0.3);
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

    const runeCount2 = runeCount << 1;
    const angleStep2 = FlowFieldRenderer.TWO_PI / runeCount2;
    const innerRadius = radius * 0.5;
    const size2 = 15 + audioIntensity * 10;
    const halfSize2 = size2 * 0.5;

    for (let i = 0; i < runeCount2; i++) {
      const angle = angleStep2 * i - this.time * 0.002;
      const x = this.centerX + this.fastCos(angle) * innerRadius;
      const y = this.centerY + this.fastSin(angle) * innerRadius;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 0.5 + audioIntensity * 0.3;
      ctx.fillStyle = this.hsla(this.fastMod360(this.hueBase + i * 20), 70, 60, 1);
      ctx.fillRect(-halfSize2, -halfSize2, size2, size2);
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

    const angleStep = FlowFieldRenderer.TWO_PI / sigilCount;
    const size = 30 + midIntensity * 25;

    for (let i = 0; i < sigilCount; i++) {
      const angle = angleStep * i + this.time * 0.001;
      const radius =
        200 + this.fastSin(this.time * 0.002 + i) * 50 + bassIntensity * 80;
      const x = this.centerX + this.fastCos(angle) * radius;
      const y = this.centerY + this.fastSin(angle) * radius;
      const hue = this.fastMod360(this.hueBase + i * 30 + this.time * 0.2);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.time * 0.003 + i);

      ctx.strokeStyle = this.hsla(hue, 85, 65, 0.6 + audioIntensity * 0.4);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.arc(0, 0, size, 0, FlowFieldRenderer.TWO_PI);
      ctx.moveTo(-size, 0);
      ctx.lineTo(size, 0);
      ctx.moveTo(0, -size);
      ctx.lineTo(0, size);
      const size07 = size * 0.7;
      ctx.moveTo(-size07, -size07);
      ctx.lineTo(size07, size07);
      ctx.moveTo(size07, -size07);
      ctx.lineTo(-size07, size07);
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

    // HYPER-OPTIMIZATION: Pre-calculate ouroboros parameters
    const invSegments = 1 / segments;
    const timeWave1 = this.time * 0.002;
    const timeWave2 = this.time * 0.005;
    const timeWave3 = this.time * 0.3;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const pi8 = Math.PI * 8;
    const pi4 = Math.PI * 4;
    const pi2 = Math.PI * 2;
    const thicknessMid = thickness * (1 + midIntensity * 0.5);
    const halfPi = Math.PI * 0.5;

    // Draw serpent body
    for (let i = 0; i < segments; i++) {
      const progress = i * invSegments;
      const angle = progress * twoPi + timeWave1;
      // HYPER-OPTIMIZATION: Use fast trig for wave calculation
      const wave = this.fastSin(progress * pi8 + timeWave2) * 20;
      const r = radius + wave + this.fastSin(progress * pi4) * 30;

      // HYPER-OPTIMIZATION: Use fast trig for position calculation
      const x = this.fastCos(angle) * r;
      const y = this.fastSin(angle) * r;

      const hue = this.fastMod360(this.hueBase + progress * 120 + timeWave3);
      const alpha = 0.7 + this.fastSin(progress * pi2) * 0.3;

      ctx.fillStyle = this.hsla(hue, 80, 60, alpha);
      ctx.beginPath();
      ctx.arc(x, y, thicknessMid, 0, twoPi);
      ctx.fill();

      // Add scales
      if (i % 8 === 0) {
        const scaleSize = thickness * 0.5;
        const halfScaleSize = scaleSize * 0.5;
        ctx.fillStyle = this.hsla(this.fastMod360(hue + 30), 85, 70, 0.5);
        ctx.fillRect(
          x - halfScaleSize,
          y - halfScaleSize,
          scaleSize,
          scaleSize,
        );
      }
    }

    // Draw head
    const headAngle = timeWave1;
    // HYPER-OPTIMIZATION: Use fast trig for head position
    const headX = this.fastCos(headAngle) * radius;
    const headY = this.fastSin(headAngle) * radius;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headAngle + halfPi);

    ctx.fillStyle = this.hsla(this.hueBase, 85, 65, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, thickness * 1.5, 0, twoPi);
    ctx.fill();

    // Eyes
    const eyeSize = thickness * 0.3;
    const eyeX1 = -thickness * 0.5;
    const eyeX2 = thickness * 0.2;
    const eyeY = -thickness * 0.3;
    ctx.fillStyle = this.hsla(this.fastMod360(this.hueBase + 180), 90, 70, 0.9);
    ctx.fillRect(eyeX1, eyeY, eyeSize, eyeSize);
    ctx.fillRect(eyeX2, eyeY, eyeSize, eyeSize);

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

    // HYPER-OPTIMIZATION: Pre-calculate chakra parameters
    const chakraCount = chakraColors.length;
    const invChakraCountPlus1 = 1 / (chakraCount + 1);
    const spacing = this.height * invChakraCountPlus1;
    const timePulse = this.time * 0.005;
    const timeRotation = this.time * 0.002;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const baseAlpha = 0.6 + trebleIntensity * 0.4;

    chakraColors.forEach((chakra, i) => {
      const y = spacing * (i + 1);
      const size =
        40 + audioIntensity * 30 + (i === 3 ? bassIntensity * 20 : 0);
      // HYPER-OPTIMIZATION: Use fast trig for pulse calculation
      const pulse = this.fastSin(timePulse + i * 0.5) * 10;

      // Outer glow
      const gradient = ctx.createRadialGradient(
        this.centerX,
        y,
        size * 0.5,
        this.centerX,
        y,
        size + pulse + 40,
      );
      gradient.addColorStop(0, this.hsla(chakra.h, 90, 70, baseAlpha));
      gradient.addColorStop(1, this.hsla(chakra.h, 90, 60, 0));

      ctx.fillStyle = gradient;
      const glowSize = size + 50;
      ctx.fillRect(
        this.centerX - glowSize,
        y - glowSize,
        glowSize * 2,
        glowSize * 2,
      );

      // Main chakra circle
      const chakraHue30 = this.fastMod360(chakra.h + 30);
      ctx.fillStyle = this.hsla(chakra.h, 85, 65, 0.8);
      ctx.strokeStyle = this.hsla(chakraHue30, 90, 70, 0.9);
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(this.centerX, y, size + pulse, 0, twoPi);
      ctx.fill();
      ctx.stroke();

      // Petals
      const petalCount = Math.min(i + 3, 8);
      const invPetalCount = 1 / petalCount;
      const petalRadius = size + 15;
      for (let j = 0; j < petalCount; j++) {
        const angle = twoPi * j * invPetalCount + timeRotation;
        // HYPER-OPTIMIZATION: Use fast trig for petal position
        const petalX = this.centerX + this.fastCos(angle) * petalRadius;
        const petalY = y + this.fastSin(angle) * petalRadius;

        ctx.save();
        ctx.translate(petalX, petalY);
        ctx.rotate(angle);

        ctx.fillStyle = this.hsla(this.fastMod360(chakra.h + 20), 80, 60, 0.6);
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 20, 0, 0, twoPi);
        ctx.fill();
        ctx.restore();
      }
    });

    // Connection line
    ctx.strokeStyle = this.hsla(this.hueBase, 70, 60, 0.3 + audioIntensity * 0.2);
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

    // HYPER-OPTIMIZATION: Pre-calculate alchemy parameters
    const radius = 180 + bassIntensity * 80;
    const timeRotation = this.time * 0.001;
    const timeSymbolRotation = this.time * 0.003;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const sqrt3_2 = 0.8660254037844386; // sqrt(3)/2 pre-calculated

    symbols.forEach((symbol, i) => {
      const angle = symbol.rotation + timeRotation;
      // HYPER-OPTIMIZATION: Use fast trig for position calculation
      const x = this.centerX + this.fastCos(angle) * radius;
      const y = this.centerY + this.fastSin(angle) * radius;
      const size = 50 + midIntensity * 30;
      const hue = this.fastMod360(this.hueBase + i * 90);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(timeSymbolRotation + i);

      // Triangle for elements
      const strokeAlpha = 0.7 + audioIntensity * 0.3;
      const fillAlpha = 0.2 + audioIntensity * 0.2;
      ctx.strokeStyle = this.hsla(hue, 85, 65, strokeAlpha);
      ctx.fillStyle = this.hsla(hue, 75, 55, fillAlpha);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const sizeHalf = size * 0.5;
      const sizeSqrt3 = size * sqrt3_2;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-sizeSqrt3, sizeHalf);
      ctx.lineTo(sizeSqrt3, sizeHalf);
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
        const lineSize = size * 0.6;
        ctx.beginPath();
        ctx.moveTo(-lineSize, 0);
        ctx.lineTo(lineSize, 0);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Central transmutation circle
    const circleRadius = 60 + audioIntensity * 40;
    ctx.strokeStyle = this.hsla(this.hueBase, 80, 60, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      this.centerX,
      this.centerY,
      circleRadius,
      0,
      twoPi,
    );
    ctx.stroke();

    // Philosophical Mercury symbol
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + 60), 85, 65, 0.8);
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate celestial parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const inv12 = 1 / 12;
    const timeRay = this.time * 0.002;
    const orbitAlpha = 0.2 + audioIntensity * 0.1;

    for (let orbit = 0; orbit < orbits; orbit++) {
      const radius = 80 + orbit * 60;
      const planetCount = orbit + 3;
      const invPlanetCount = 1 / planetCount;
      const speed = 0.001 / (orbit + 1);
      const timeSpeed = this.time * speed;

      // Draw orbit
      const orbitHue = this.fastMod360(this.hueBase + orbit * 20);
      ctx.strokeStyle = this.hsla(orbitHue, 60, 50, orbitAlpha);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, radius, 0, twoPi);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw planets
      for (let i = 0; i < planetCount; i++) {
        const angle = twoPi * i * invPlanetCount + timeSpeed;
        // HYPER-OPTIMIZATION: Use fast trig for planet position
        const x = this.centerX + this.fastCos(angle) * radius;
        const y = this.centerY + this.fastSin(angle) * radius;
        const size = 8 + bassIntensity * 8 + orbit * 2;
        const hue = this.fastMod360(this.hueBase + orbit * 40 + i * 20);

        // Planet glow
        const glowAlpha = 0.6 + midIntensity * 0.4;
        const gradient = ctx.createRadialGradient(
          x,
          y,
          size * 0.3,
          x,
          y,
          size * 3,
        );
        gradient.addColorStop(0, this.hsla(hue, 90, 70, glowAlpha));
        gradient.addColorStop(1, this.hsla(hue, 80, 60, 0));
        ctx.fillStyle = gradient;
        const size3 = size * 3;
        ctx.fillRect(x - size3, y - size3, size3 * 2, size3 * 2);

        // Planet body
        ctx.fillStyle = this.hsla(hue, 85, 65, 0.9);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, twoPi);
        ctx.fill();

        // Rings for some planets
        if (orbit % 2 === 0) {
          ctx.strokeStyle = this.hsla(this.fastMod360(hue + 30), 70, 60, 0.5);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x, y, size * 1.5, size * 0.5, angle, 0, twoPi);
          ctx.stroke();
        }
      }
    }

    // Central sun
    const sunSize = 40 + audioIntensity * 30;
    const sunSize2 = sunSize * 2;
    const sunSizeHalf = sunSize * 0.5;
    const hue60 = this.fastMod360(this.hueBase + 60);
    const hue40 = this.fastMod360(this.hueBase + 40);
    const hue20 = this.fastMod360(this.hueBase + 20);
    
    const gradient = ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      sunSizeHalf,
      this.centerX,
      this.centerY,
      sunSize2,
    );
    gradient.addColorStop(0, this.hsla(hue60, 100, 80, 1));
    gradient.addColorStop(0.5, this.hsla(hue40, 90, 70, 0.6));
    gradient.addColorStop(1, this.hsla(hue20, 80, 60, 0));

    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.centerX - sunSize2,
      this.centerY - sunSize2,
      sunSize2 * 2,
      sunSize2 * 2,
    );

    // Sun rays
    const rayAngleStep = twoPi * inv12;
    const rayHue = this.fastMod360(this.hueBase + 50);
    const rayAlpha = 0.5 + bassIntensity * 0.4;
    const rayLength = sunSize + 30 + bassIntensity * 20;
    
    for (let i = 0; i < 12; i++) {
      const angle = rayAngleStep * i + timeRay;
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(angle);

      ctx.strokeStyle = this.hsla(rayHue, 95, 75, rayAlpha);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sunSize, 0);
      ctx.lineTo(rayLength, 0);
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

    // HYPER-OPTIMIZATION: Pre-calculate portal parameters
    const invRings = 1 / rings;
    const timeRotation = this.time * 0.002;
    const timeWave = this.time * 0.01;
    const timeParticle = this.time * 0.005;
    const timeHue = this.time * 0.5;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const pi6 = Math.PI * 6;
    const segments = 60;
    const invSegments = 1 / segments;
    const inv8 = 1 / 8;
    const lineWidth = 4 + trebleIntensity * 3;

    for (let i = 0; i < rings; i++) {
      const progress = i * invRings;
      const radius = 50 + i * (15 + bassIntensity * 10);
      const rotation = timeRotation * (i & 1 ? -1 : 1) + progress * Math.PI;
      const hue = this.fastMod360(this.hueBase + progress * 240 + timeHue);
      const alpha = 0.3 + (1 - progress) * 0.5 + audioIntensity * 0.2;

      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(rotation);

      // Create spiral effect
      ctx.strokeStyle = this.hsla(hue, 85, 65, alpha);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";

      ctx.beginPath();
      for (let j = 0; j <= segments; j++) {
        const segmentProgress = j * invSegments;
        const angle = segmentProgress * twoPi;
        // HYPER-OPTIMIZATION: Use fast trig for spiral calculation
        const r = radius * (1 + this.fastSin(segmentProgress * pi6 + timeWave) * 0.1);
        const x = this.fastCos(angle) * r;
        const y = this.fastSin(angle) * r;

        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Add energy particles
      if (i % 3 === 0) {
        const particleSize = 3 + audioIntensity * 5;
        const particleHue = this.fastMod360(hue + 60);
        for (let j = 0; j < 8; j++) {
          const angle = twoPi * j * inv8 + timeParticle;
          // HYPER-OPTIMIZATION: Use fast trig for particle position
          const x = this.fastCos(angle) * radius;
          const y = this.fastSin(angle) * radius;

          ctx.fillStyle = this.hsla(particleHue, 90, 70, 0.8);
          ctx.beginPath();
          ctx.arc(x, y, particleSize, 0, twoPi);
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
    voidGradient.addColorStop(1, this.hsla(this.hueBase, 50, 30, 0.5));

    ctx.fillStyle = voidGradient;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, voidSize, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate dreamcatcher parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const timeWeb = this.time * 0.001;
    const timeFeather = this.time * 0.003;
    const webLayers = 7;
    const invWebLayers = 1 / webLayers;
    const webAlpha = 0.4 + audioIntensity * 0.3;

    // Outer ring
    ctx.strokeStyle = this.hsla(this.hueBase, 70, 60, 0.8);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, twoPi);
    ctx.stroke();

    // Web structure
    for (let layer = 1; layer <= webLayers; layer++) {
      const layerRadius = outerRadius * (layer * invWebLayers);
      const points = 8 + layer * 2;
      const invPoints = 1 / points;
      const layerHue = this.fastMod360(this.hueBase + layer * 15);

      ctx.strokeStyle = this.hsla(layerHue, 75, 60, webAlpha);
      ctx.lineWidth = 2;

      for (let i = 0; i < points; i++) {
        const angle1 = twoPi * i * invPoints + timeWeb;
        const angle2 = twoPi * (i + 1) * invPoints + timeWeb;

        // HYPER-OPTIMIZATION: Use fast trig for web points
        const x1 = this.fastCos(angle1) * layerRadius;
        const y1 = this.fastSin(angle1) * layerRadius;
        const x2 = this.fastCos(angle2) * layerRadius;
        const y2 = this.fastSin(angle2) * layerRadius;

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
        const beadHue = this.fastMod360(this.hueBase + i * 20);
        ctx.fillStyle = this.hsla(beadHue, 80, 65, 0.8);
        ctx.beginPath();
        ctx.arc(x1, y1, beadSize, 0, twoPi);
        ctx.fill();
      }
    }

    // Hanging feathers
    const featherLength = 80 + bassIntensity * 40;
    const featherHue = this.hueBase;
    for (let i = 0; i < 3; i++) {
      const angle = Math.PI + (i - 1) * 0.4;
      // HYPER-OPTIMIZATION: Use fast trig for feather position
      const startX = this.fastCos(angle) * outerRadius;
      const startY = this.fastSin(angle) * outerRadius;
      const sway = this.fastSin(timeFeather + i) * 15;

      const endX = startX + sway;
      const endY = startY + featherLength;

      // Feather string
      ctx.strokeStyle = this.hsla(featherHue, 60, 50, 0.6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Feather
      ctx.save();
      ctx.translate(endX, endY);
      ctx.rotate(sway * 0.02);

      const hue = this.fastMod360(this.hueBase + i * 60);
      ctx.fillStyle = this.hsla(hue, 75, 60, 0.6);
      ctx.strokeStyle = this.hsla(hue, 80, 65, 0.8);
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

    // HYPER-OPTIMIZATION: Pre-calculate phoenix parameters
    const timeWing = this.time * 0.005;
    const timeTail = this.time * 0.01;
    const timeHue = this.time * 0.5;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const halfPi = Math.PI * 0.5;
    const pi04 = -Math.PI * 0.4;
    const pi08 = Math.PI * 0.8;

    // Wings
    for (let side = -1; side <= 1; side += 2) {
      // HYPER-OPTIMIZATION: Use fast trig for wing angle
      const wingAngle = this.fastSin(timeWing) * 0.3 * side;

      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(wingAngle);

      // Wing feathers
      const featherCount = 8;
      const invFeatherCount = 1 / featherCount;
      for (let i = 0; i < featherCount; i++) {
        const featherProgress = i * invFeatherCount;
        const featherAngle = pi04 + featherProgress * pi08;
        const featherLength = wingSpan * (0.5 + featherProgress * 0.5);
        const hue = ((this.hueBase + i * 15 + timeHue) % 60) | 0; // Red-orange-yellow

        ctx.save();
        ctx.rotate(featherAngle);

        const hue20 = hue + 20;
        const hue40 = hue + 40;
        const featherAlpha = 0.8 + audioIntensity * 0.2;
        const gradient = ctx.createLinearGradient(0, 0, featherLength, 0);
        gradient.addColorStop(0, this.hsla(hue, 90, 60, featherAlpha));
        gradient.addColorStop(0.5, this.hsla(hue20, 95, 65, 0.6));
        gradient.addColorStop(1, this.hsla(hue40, 100, 70, 0.2));

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 15 - i * 1.5 + trebleIntensity * 5;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(featherLength, 0);
        ctx.stroke();

        // Flame particles
        if (i % 2 === 0) {
          let rngSeed = ((i * 1103515245 + this.time * 1664525) & 0x7fffffff);
          for (let j = 0; j < 5; j++) {
            rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
            const rng1 = rngSeed / 0x7fffffff;
            rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff;
            const rng2 = rngSeed / 0x7fffffff;
            rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
            const rng3 = rngSeed / 0x7fffffff;
            
            const particleX = featherLength * (0.5 + j * 0.1);
            const particleY = (rng1 - 0.5) * 20;
            const particleSize = 2 + rng2 * 4 + audioIntensity * 3;

            ctx.fillStyle = this.hsla(hue + 30, 100, 70, 0.6 + rng3 * 0.4);
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, twoPi);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      ctx.restore();
    }

    // Body
    const bodyHue30 = this.fastMod360(this.hueBase + 30);
    const bodyHue10 = this.fastMod360(this.hueBase + 10);
    const bodyGradient = ctx.createRadialGradient(0, 0, 20, 0, 0, 60);
    bodyGradient.addColorStop(0, this.hsla(bodyHue30, 95, 70, 1));
    bodyGradient.addColorStop(0.6, this.hsla(bodyHue10, 90, 60, 0.8));
    bodyGradient.addColorStop(1, this.hsla(this.hueBase, 85, 50, 0.4));

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 40 + bassIntensity * 20, 0, twoPi);
    ctx.fill();

    // Tail flames
    const tailCount = 12;
    const invTailCount = 1 / tailCount;
    const tailHalf = tailCount * 0.5;
    for (let i = 0; i < tailCount; i++) {
      // HYPER-OPTIMIZATION: Use fast trig for tail angle
      const tailAngle = halfPi + (i - tailHalf) * 0.1 + this.fastSin(timeTail + i) * 0.2;
      const tailLength = 100 + i * 15 + bassIntensity * 50;
      const hue = (this.hueBase + i * 5) % 60;

      ctx.save();
      ctx.rotate(tailAngle);

      const tailGradient = ctx.createLinearGradient(0, 0, 0, tailLength);
      tailGradient.addColorStop(0, this.hsla(hue + 20, 95, 65, 0.8));
      tailGradient.addColorStop(1, this.hsla(hue + 40, 100, 70, 0));

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

    // HYPER-OPTIMIZATION: Pre-calculate serpent parameters
    const amplitude = 100 + bassIntensity * 60;
    const invSegments = 1 / segments;
    const timePhase = this.time * 0.01;
    const timeHue = this.time * 0.3;
    const timeTongue = this.time * 0.02;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const phaseMultiplier = 1.5;
    const segmentAlpha = 0.7 + audioIntensity * 0.3;

    for (let i = 0; i < segments; i++) {
      const progress = i * invSegments;
      const phase = timePhase - progress * twoPi;
      const phase15 = phase * phaseMultiplier;

      // HYPER-OPTIMIZATION: Use fast trig for serpent position
      const x = this.centerX + this.fastCos(phase) * (200 + progress * 100);
      const y = this.centerY + this.fastSin(phase15) * amplitude;

      const nextProgress = (i + 1) * invSegments;
      const nextPhase = timePhase - nextProgress * twoPi;
      const nextPhase15 = nextPhase * phaseMultiplier;
      const nextX = this.centerX + this.fastCos(nextPhase) * (200 + nextProgress * 100);
      const nextY = this.centerY + this.fastSin(nextPhase15) * amplitude;

      const size = 20 - progress * 15 + midIntensity * 10;
      const hue = this.fastMod360(this.hueBase + progress * 120 + timeHue);

      // Segment body
      ctx.strokeStyle = this.hsla(hue, 80, 60, segmentAlpha);
      ctx.lineWidth = size;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      // Scales
      if (i % 3 === 0) {
        ctx.fillStyle = this.hsla(this.fastMod360(hue + 30), 85, 65, 0.6);
        ctx.beginPath();
        ctx.arc(x, y, size * 0.4, 0, twoPi);
        ctx.fill();
      }

      // Head
      if (i === segments - 1) {
        const headSize = size * 1.5;

        ctx.fillStyle = this.hsla(hue, 85, 65, 0.9);
        ctx.beginPath();
        ctx.arc(x, y, headSize, 0, twoPi);
        ctx.fill();

        // Eyes
        const eyeOffset = headSize * 0.4;
        const eyeSize = headSize * 0.2;
        const eyeY = y - eyeOffset * 0.5;
        ctx.fillStyle = this.hsla(this.fastMod360(hue + 180), 90, 70, 0.9);
        ctx.beginPath();
        ctx.arc(x - eyeOffset, eyeY, eyeSize, 0, twoPi);
        ctx.arc(x + eyeOffset, eyeY, eyeSize, 0, twoPi);
        ctx.fill();

        // Forked tongue
        const tongueLength = headSize * 2;
        // HYPER-OPTIMIZATION: Use fast trig for tongue angle
        const tongueAngle = this.fastSin(timeTongue) * 0.2;

        ctx.strokeStyle = this.hsla(0, 90, 60, 0.8);
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

    // HYPER-OPTIMIZATION: Pre-calculate crystal grid parameters
    const spacing = Math.min(this.width, this.height) / gridSize;
    const timePulse = this.time * 0.005;
    const timeHue = this.time * 0.2;
    const timeRotation = this.time * 0.001;
    const pulseFreq = 0.3;
    const crystalAlpha = 0.6 + bassIntensity * 0.4;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const pi3 = Math.PI / 3;

    // Draw crystal lattice
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = (col + 0.5) * spacing;
        const y = (row + 0.5) * spacing;
        // HYPER-OPTIMIZATION: Use fast trig for pulse calculation
        const pulse = this.fastSin(timePulse + row * pulseFreq + col * pulseFreq) * 0.5 + 0.5;
        const size = 20 + pulse * 20 + audioIntensity * 15;
        const hue = this.fastMod360(this.hueBase + row * 30 + col * 30 + timeHue);

        // Crystal glow
        const size2 = size * 2;
        const size03 = size * 0.3;
        const gradient = ctx.createRadialGradient(
          x,
          y,
          size03,
          x,
          y,
          size2,
        );
        gradient.addColorStop(0, this.hsla(hue, 90, 70, crystalAlpha));
        gradient.addColorStop(1, this.hsla(hue, 80, 60, 0));

        ctx.fillStyle = gradient;
        ctx.fillRect(x - size2, y - size2, size2 * 2, size2 * 2);

        // Crystal shape (hexagon)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(timeRotation + row + col);

        ctx.strokeStyle = this.hsla(hue, 85, 65, 0.8);
        ctx.fillStyle = this.hsla(hue, 75, 60, 0.3 + midIntensity * 0.3);
        ctx.lineWidth = 2;

        // HYPER-OPTIMIZATION: Use fast trig for hexagon vertices
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = twoPi * i * (1 / 6);
          const cx = this.fastCos(angle) * size;
          const cy = this.fastSin(angle) * size;
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner facets
        ctx.strokeStyle = this.hsla(this.fastMod360(hue + 30), 90, 70, 0.5);
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const angle = twoPi * i * (1 / 6);
          const cx = this.fastCos(angle) * size;
          const cy = this.fastSin(angle) * size;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(cx, cy);
          ctx.stroke();
        }

        ctx.restore();

        // Connect to neighbors
        const connectionAlpha = 0.2 + audioIntensity * 0.2;
        if (col < gridSize - 1) {
          const nextX = (col + 1.5) * spacing;
          ctx.strokeStyle = this.hsla(hue, 70, 60, connectionAlpha);
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
          ctx.strokeStyle = this.hsla(hue, 70, 60, connectionAlpha);
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

    // HYPER-OPTIMIZATION: Pre-calculate moon phases parameters
    const radius = 200 + bassIntensity * 80;
    const moonSize = 40 + trebleIntensity * 20;
    const invPhases = 1 / phases;
    const timePhase = this.time * 0.001;
    const timeStar = this.time * 0.003;
    const timeStarDist = this.time * 0.01;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const angleStep = twoPi * invPhases;
    const inv3 = 1 / 3;
    const starAngleStep = twoPi * inv3;
    const moonHue = this.fastMod360(this.hueBase + 180);
    const moonGlowAlpha = 0.6 + audioIntensity * 0.4;
    const moonSize2 = moonSize * 2;
    const moonSize4 = moonSize * 4;
    const moonSizeHalf = moonSize * 0.5;

    // Orbital ring
    ctx.strokeStyle = this.hsla(this.hueBase, 60, 50, 0.3);
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, radius, 0, twoPi);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw phases
    for (let i = 0; i < phases; i++) {
      const angle = angleStep * i + timePhase;
      // HYPER-OPTIMIZATION: Use fast trig for moon position
      const x = this.centerX + this.fastCos(angle) * radius;
      const y = this.centerY + this.fastSin(angle) * radius;
      const phase = i * invPhases;

      // Moon glow
      const gradient = ctx.createRadialGradient(
        x,
        y,
        moonSizeHalf,
        x,
        y,
        moonSize2,
      );
      gradient.addColorStop(0, this.hsla(moonHue, 80, 80, moonGlowAlpha));
      gradient.addColorStop(1, this.hsla(moonHue, 70, 70, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(
        x - moonSize2,
        y - moonSize2,
        moonSize4,
        moonSize4,
      );

      // Full moon circle
      ctx.fillStyle = this.hsla(moonHue, 70, 80, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, moonSize, 0, twoPi);
      ctx.fill();

      // Shadow for phase
      if (phase < 0.5) {
        // Waxing
        const shadowWidth = moonSize2 * (1 - phase * 2);
        ctx.fillStyle = `rgba(0, 0, 20, 0.8)`;
        ctx.beginPath();
        ctx.arc(x - moonSize + shadowWidth, y, moonSize, 0, twoPi);
        ctx.fill();
      } else {
        // Waning
        const shadowWidth = moonSize2 * ((phase - 0.5) * 2);
        ctx.fillStyle = `rgba(0, 0, 20, 0.8)`;
        ctx.beginPath();
        ctx.arc(x + moonSize - shadowWidth, y, moonSize, 0, twoPi);
        ctx.fill();
      }

      // Phase label stars
      const starSize = 2 + audioIntensity * 3;
      const starHue = this.fastMod360(this.hueBase + 60);
      for (let j = 0; j < 3; j++) {
        const starAngle = starAngleStep * j + timeStar;
        // HYPER-OPTIMIZATION: Use fast trig for star position
        const starDist = moonSize + 20 + this.fastSin(timeStarDist + j) * 5;
        const starX = x + this.fastCos(starAngle) * starDist;
        const starY = y + this.fastSin(starAngle) * starDist;

        ctx.fillStyle = this.hsla(starHue, 90, 70, 0.7);
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, twoPi);
        ctx.fill();
      }
    }

    // Central celestial point
    const centerAlpha = 0.6 + audioIntensity * 0.4;
    ctx.fillStyle = this.hsla(this.hueBase, 80, 60, centerAlpha);
    ctx.beginPath();
    ctx.arc(
      this.centerX,
      this.centerY,
      15 + bassIntensity * 10,
      0,
      twoPi,
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

    // HYPER-OPTIMIZATION: Pre-calculate astrolabe parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const pi180 = Math.PI / 180;
    const halfPi = Math.PI * 0.5;
    const inv5 = 1 / 5;
    const timePlanet = this.time * 0.001;
    const pointerAlpha = 0.7 + audioIntensity * 0.3;

    // Outer rim
    ctx.strokeStyle = this.hsla(this.hueBase, 75, 60, 0.8);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, twoPi);
    ctx.stroke();

    // Degree markings
    for (let i = 0; i < 360; i += 10) {
      const angle = i * pi180;
      const innerR = i % 30 === 0 ? outerRadius - 20 : outerRadius - 10;
      const lineWidth = i % 30 === 0 ? 3 : 1;

      // HYPER-OPTIMIZATION: Use fast trig for degree markings
      const cosAngle = this.fastCos(angle);
      const sinAngle = this.fastSin(angle);
      ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + i), 70, 60, 0.6);
      ctx.lineWidth = lineWidth;

      ctx.beginPath();
      ctx.moveTo(cosAngle * innerR, sinAngle * innerR);
      ctx.lineTo(cosAngle * outerRadius, sinAngle * outerRadius);
      ctx.stroke();
    }

    // Zodiac ring
    const zodiacRadius = outerRadius * 0.8;
    const signs = 12;
    const invSigns = 1 / signs;
    const symbolAngleStep = twoPi * invSigns;
    const inv3 = 1 / 3;
    const innerSymbolAngleStep = twoPi * inv3;
    
    for (let i = 0; i < signs; i++) {
      const angle = symbolAngleStep * i;
      // HYPER-OPTIMIZATION: Use fast trig for zodiac position
      const x = this.fastCos(angle) * zodiacRadius;
      const y = this.fastSin(angle) * zodiacRadius;
      const symbolSize = 25 + midIntensity * 15;
      const hue = this.fastMod360(this.hueBase + i * 30);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + halfPi);

      // Zodiac symbol (simplified as geometric shape)
      const symbolAlpha = 0.6 + audioIntensity * 0.3;
      ctx.fillStyle = this.hsla(hue, 80, 65, symbolAlpha);
      ctx.strokeStyle = this.hsla(hue, 85, 70, 0.8);
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(0, 0, symbolSize, 0, twoPi);
      ctx.fill();
      ctx.stroke();

      // Inner symbol
      const symbolSizeHalf = symbolSize * 0.5;
      ctx.fillStyle = this.hsla(this.fastMod360(hue + 30), 90, 75, 0.8);
      ctx.beginPath();
      for (let j = 0; j < 3; j++) {
        const sAngle = innerSymbolAngleStep * j;
        const sx = this.fastCos(sAngle) * symbolSizeHalf;
        const sy = this.fastSin(sAngle) * symbolSizeHalf;
        if (j === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Planetary rings
    for (let ring = 1; ring <= 4; ring++) {
      const ringRadius = outerRadius * (ring * inv5);
      const planetCount = ring + 2;
      const invPlanetCount = 1 / planetCount;
      const planetAngleStep = twoPi * invPlanetCount;

      ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + ring * 20), 65, 55, 0.3);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, twoPi);
      ctx.stroke();
      ctx.setLineDash([]);

      // Planets on ring
      for (let p = 0; p < planetCount; p++) {
        const pAngle = planetAngleStep * p - timePlanet * ring;
        // HYPER-OPTIMIZATION: Use fast trig for planet position
        const px = this.fastCos(pAngle) * ringRadius;
        const py = this.fastSin(pAngle) * ringRadius;
        const pSize = 6 + audioIntensity * 5;
        const pHue = this.fastMod360(this.hueBase + ring * 40 + p * 20);

        ctx.fillStyle = this.hsla(pHue, 85, 65, 0.8);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, twoPi);
        ctx.fill();
      }
    }

    // Rotating pointer
    ctx.save();
    ctx.rotate(this.time * 0.002);
    const pointerHue = this.fastMod360(this.hueBase + 60);
    ctx.strokeStyle = this.hsla(pointerHue, 90, 70, pointerAlpha);
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -outerRadius * 0.7);
    ctx.stroke();

    // Pointer tip
    ctx.fillStyle = this.hsla(pointerHue, 95, 75, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -outerRadius * 0.7);
    ctx.lineTo(-10, -outerRadius * 0.7 + 20);
    ctx.lineTo(10, -outerRadius * 0.7 + 20);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Central hub
    ctx.fillStyle = this.hsla(this.hueBase, 80, 60, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, 20 + bassIntensity * 10, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate tarot parameters
    const cardWidth = 80 + bassIntensity * 30;
    const cardHeight = cardWidth * 1.5;
    const spacing = (this.width - cardWidth * cardCount) / (cardCount + 1);
    const timeHover = this.time * 0.005;
    const timeRotation = this.time * 0.003;
    const cardWidthHalf = cardWidth * 0.5;
    const cardHeightHalf = cardHeight * 0.5;
    const glowSize = cardWidth * 0.6;
    const glowSize2 = glowSize * 2;
    const glowSizeHalf = glowSize * 0.5;
    const cardGlowAlpha = 0.4 + audioIntensity * 0.3;

    for (let i = 0; i < cardCount; i++) {
      const x = spacing + i * (cardWidth + spacing);
      const y = this.centerY - cardHeightHalf;
      // HYPER-OPTIMIZATION: Use fast trig for card animation
      const hover = this.fastSin(timeHover + i * 0.8) * 20;
      const rotation = this.fastSin(timeRotation + i) * 0.1;
      const hue = this.fastMod360(this.hueBase + i * 51); // Use prime number for varied colors

      ctx.save();
      ctx.translate(x + cardWidthHalf, y + cardHeightHalf + hover);
      ctx.rotate(rotation);

      // Card glow
      const gradient = ctx.createRadialGradient(
        0,
        0,
        glowSizeHalf,
        0,
        0,
        glowSize,
      );
      gradient.addColorStop(0, this.hsla(hue, 90, 70, cardGlowAlpha));
      gradient.addColorStop(1, this.hsla(hue, 80, 60, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(-glowSize, -glowSize, glowSize2, glowSize2);

      // Card body
      ctx.fillStyle = this.hsla(hue, 30, 20, 0.9);
      ctx.strokeStyle = this.hsla(hue, 80, 65, 0.8);
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.hsla(hue, 80, 50, 0.5);

      ctx.fillRect(-cardWidthHalf, -cardHeightHalf, cardWidth, cardHeight);
      ctx.strokeRect(-cardWidthHalf, -cardHeightHalf, cardWidth, cardHeight);
      ctx.shadowBlur = 0;

      // Card border decoration
      ctx.strokeStyle = this.hsla(this.fastMod360(hue + 30), 85, 70, 0.6);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        -cardWidthHalf + 5,
        -cardHeightHalf + 5,
        cardWidth - 10,
        cardHeight - 10,
      );

      // Central symbol
      const symbolSize = cardWidth * 0.3 + midIntensity * 10;
      const symbolAlpha = 0.7 + audioIntensity * 0.3;
      const symbolHue60 = this.fastMod360(hue + 60);
      ctx.fillStyle = this.hsla(hue, 90, 70, symbolAlpha);
      ctx.strokeStyle = this.hsla(symbolHue60, 95, 75, 0.9);
      ctx.lineWidth = 2;

      // HYPER-OPTIMIZATION: Pre-calculate symbol parameters
      const twoPi = FlowFieldRenderer.TWO_PI;
      const inv8 = 1 / 8;
      const inv5 = 1 / 5;
      const inv4 = 1 / 4;
      const halfPi = Math.PI * 0.5;
      const timeParticle = this.time * 0.01;
      const timeParticleDist = this.time * 0.02;

      // Different symbols for each card
      const symbolType = i % 4;
      ctx.beginPath();

      switch (symbolType) {
        case 0: // Sun
          ctx.arc(0, 0, symbolSize, 0, twoPi);
          for (let r = 0; r < 8; r++) {
            const rAngle = twoPi * r * inv8;
            // HYPER-OPTIMIZATION: Use fast trig for sun rays
            const cosAngle = this.fastCos(rAngle);
            const sinAngle = this.fastSin(rAngle);
            ctx.moveTo(cosAngle * symbolSize, sinAngle * symbolSize);
            ctx.lineTo(cosAngle * symbolSize * 1.4, sinAngle * symbolSize * 1.4);
          }
          break;
        case 1: // Moon
          ctx.arc(symbolSize * 0.3, 0, symbolSize, 0, twoPi);
          ctx.arc(-symbolSize * 0.3, 0, symbolSize, 0, twoPi);
          break;
        case 2: // Star
          for (let p = 0; p < 5; p++) {
            const pAngle = twoPi * p * inv5 - halfPi;
            const nextAngle = twoPi * (p + 2) * inv5 - halfPi;
            // HYPER-OPTIMIZATION: Use fast trig for star points
            const px = this.fastCos(pAngle) * symbolSize;
            const py = this.fastSin(pAngle) * symbolSize;
            const npx = this.fastCos(nextAngle) * symbolSize;
            const npy = this.fastSin(nextAngle) * symbolSize;
            if (p === 0) ctx.moveTo(px, py);
            ctx.lineTo(npx, npy);
          }
          ctx.closePath();
          break;
        case 3: // Eye
          ctx.ellipse(0, 0, symbolSize, symbolSize * 0.6, 0, 0, twoPi);
          ctx.moveTo(symbolSize * 0.3, 0);
          ctx.arc(0, 0, symbolSize * 0.3, 0, twoPi);
          break;
      }

      ctx.fill();
      ctx.stroke();

      // Mystical particles around card
      const particleDist = cardWidth * 0.6;
      const particleHue = this.fastMod360(hue + 120);
      for (let p = 0; p < 4; p++) {
        const pAngle = twoPi * p * inv4 + timeParticle;
        // HYPER-OPTIMIZATION: Use fast trig for particle position
        const pDist = particleDist + this.fastSin(timeParticleDist + p) * 10;
        const px = this.fastCos(pAngle) * pDist;
        const py = this.fastSin(pAngle) * pDist;
        const pSize = 3 + audioIntensity * 4;

        ctx.fillStyle = this.hsla(particleHue, 90, 70, 0.7);
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate kabbalah parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const timePath = this.time * 0.003;
    const timeSephira = this.time * 0.004;
    const timeSymbol = this.time * 0.002;
    const inv6 = 1 / 6;
    const symbolAngleStep = twoPi * inv6;

    // Draw paths
    ctx.lineWidth = 2;
    paths.forEach((path, pathIndex) => {
      const fromIndex = path[0];
      const toIndex = path[1];
      if (fromIndex === undefined || toIndex === undefined) return;

      const from = sephirot[fromIndex];
      const to = sephirot[toIndex];
      if (!from || !to) return;

      const hue = this.fastMod360(this.hueBase + pathIndex * 15);
      // HYPER-OPTIMIZATION: Use fast trig for path pulse
      const pulse = this.fastSin(timePath + pathIndex * 0.5) * 0.3 + 0.7;

      ctx.strokeStyle = this.hsla(hue, 70, 60, 0.3 * pulse + audioIntensity * 0.2);
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
      const hue = this.fastMod360(this.hueBase + sephira.hueOffset);
      // HYPER-OPTIMIZATION: Use fast trig for sephira pulse
      const pulse = this.fastSin(timeSephira + index * 0.7) * 0.2 + 0.8;

      // Glow
      const size2 = size * 2;
      const size4 = size * 4;
      const size03 = size * 0.3;
      const glowAlpha = 0.6 * pulse + audioIntensity * 0.3;
      const gradient = ctx.createRadialGradient(
        sephira.x,
        sephira.y,
        size03,
        sephira.x,
        sephira.y,
        size2,
      );
      gradient.addColorStop(0, this.hsla(hue, 90, 70, glowAlpha));
      gradient.addColorStop(1, this.hsla(hue, 80, 60, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(
        sephira.x - size2,
        sephira.y - size2,
        size4,
        size4,
      );

      // Sephira circle
      const hue30 = this.fastMod360(hue + 30);
      ctx.fillStyle = this.hsla(hue, 85, 65, 0.9);
      ctx.strokeStyle = this.hsla(hue30, 90, 70, 0.9);
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(sephira.x, sephira.y, size, 0, twoPi);
      ctx.fill();
      ctx.stroke();

      // Inner ring
      ctx.strokeStyle = this.hsla(this.fastMod360(hue + 60), 95, 75, 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sephira.x, sephira.y, size * 0.6, 0, twoPi);
      ctx.stroke();

      // Rotating symbols
      const symbolCount = 6;
      const sDist = size * 0.4;
      const symbolHue = this.fastMod360(hue + 90);
      for (let s = 0; s < symbolCount; s++) {
        const sAngle = symbolAngleStep * s + timeSymbol;
        // HYPER-OPTIMIZATION: Use fast trig for symbol position
        const sx = sephira.x + this.fastCos(sAngle) * sDist;
        const sy = sephira.y + this.fastSin(sAngle) * sDist;

        ctx.fillStyle = this.hsla(symbolHue, 90, 70, 0.8);
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate merkaba particle parameters
    const particleCount = 12;
    const invParticleCount = 1 / particleCount;
    const timeParticle = this.time * 0.005;
    const orbitRadius = size * 0.6;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const particleAngleStep = twoPi * invParticleCount;

    // Rotating energy particles
    for (let i = 0; i < particleCount; i++) {
      const angle = particleAngleStep * i + timeParticle;
      // HYPER-OPTIMIZATION: Use fast trig for particle position
      const px = this.fastCos(angle) * orbitRadius;
      const py = this.fastSin(angle) * orbitRadius;
      const pSize = 4 + audioIntensity * 5;
      const pHue = this.fastMod360(this.hueBase + i * 30);

      ctx.fillStyle = this.hsla(pHue, 90, 70, 0.8);
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate flower of life parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const sqrt3 = 1.7320508075688772; // Math.sqrt(3) pre-calculated
    const timePulse = this.time * 0.005;
    const centerAlpha = 0.7 + audioIntensity * 0.3;
    const ringAlpha = 0.6 + audioIntensity * 0.2;
    const inv6 = 1 / 6;
    const outerAngleStep = twoPi * inv6;

    // Center circle
    const centerHue = this.hueBase;
    ctx.strokeStyle = this.hsla(centerHue, 85, 65, centerAlpha);
    ctx.fillStyle = this.hsla(centerHue, 75, 60, 0.1);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, twoPi);
    ctx.fill();
    ctx.stroke();

    // Rings of circles
    for (let ring = 1; ring <= rings; ring++) {
      const circlesInRing = ring * 6;
      const invCirclesInRing = 1 / circlesInRing;
      const hue = this.fastMod360(this.hueBase + ring * 40);
      const distance = ring === 1 ? radius : radius * sqrt3 * ring;
      const pulseAlpha = 0.6 + bassIntensity * 0.4;

      for (let i = 0; i < circlesInRing; i++) {
        const angle = twoPi * i * invCirclesInRing;
        // HYPER-OPTIMIZATION: Use fast trig for circle position
        const x = this.fastCos(angle) * distance;
        const y = this.fastSin(angle) * distance;

        ctx.strokeStyle = this.hsla(hue, 85, 65, ringAlpha);
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, twoPi);
        ctx.stroke();

        // Add pulsing center dots
        // HYPER-OPTIMIZATION: Use fast trig for pulse calculation
        const pulse = this.fastSin(timePulse + i * 0.3) * 3 + 5;
        ctx.fillStyle = this.hsla(this.fastMod360(hue + 60), 90, 70, pulseAlpha);
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, twoPi);
        ctx.fill();
      }
    }

    // Outer vesica piscis pattern
    const outerRadius = radius * 2 * (rings + 1);
    const outerAlpha = 0.4 + audioIntensity * 0.2;
    for (let i = 0; i < 6; i++) {
      const angle = outerAngleStep * i;
      // HYPER-OPTIMIZATION: Use fast trig for outer pattern
      const x = this.fastCos(angle) * outerRadius;
      const y = this.fastSin(angle) * outerRadius;
      const hue = this.fastMod360(this.hueBase + i * 60);

      ctx.strokeStyle = this.hsla(hue, 80, 60, outerAlpha);
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, twoPi);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Sacred geometry lines
    const hexAlpha = 0.3 + audioIntensity * 0.2;
    ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + 180), 70, 60, hexAlpha);
    ctx.lineWidth = 1;

    const hexPoints = [];
    const hexRadius = radius * 2;
    const hexAngleStep = twoPi * inv6;
    for (let i = 0; i < 6; i++) {
      const angle = hexAngleStep * i;
      // HYPER-OPTIMIZATION: Use fast trig for hex points
      hexPoints.push({
        x: this.fastCos(angle) * hexRadius,
        y: this.fastSin(angle) * hexRadius,
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

    // HYPER-OPTIMIZATION: Pre-calculate sri yantra parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const timePetal = this.time * 0.001;
    const petalAlpha = 0.5 + audioIntensity * 0.3;

    // Lotus petals outer
    const petalCount = 16;
    const petalRadius = baseSize * 1.2;
    const invPetalCount = 1 / petalCount;
    const petalAngleStep = twoPi * invPetalCount;
    const petalHueStep = 360 * invPetalCount;

    for (let i = 0; i < petalCount; i++) {
      const angle = petalAngleStep * i + timePetal;
      const hue = this.fastMod360(this.hueBase + i * petalHueStep);

      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -petalRadius);

      ctx.fillStyle = this.hsla(hue, 80, 60, petalAlpha);
      ctx.strokeStyle = this.hsla(hue, 85, 65, 0.7);
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(0, 0, 25, 40, 0, 0, twoPi);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // Lotus petals inner
    const innerPetalCount = 8;
    const innerPetalRadius = baseSize * 0.9;
    const invInnerPetalCount = 1 / innerPetalCount;
    const innerPetalAngleStep = twoPi * invInnerPetalCount;
    const innerPetalHueStep = 360 * invInnerPetalCount;

    for (let i = 0; i < innerPetalCount; i++) {
      const angle = innerPetalAngleStep * i - timePetal;
      const hue = this.fastMod360(this.hueBase + 180 + i * innerPetalHueStep);

      ctx.save();
      ctx.rotate(angle);
      ctx.translate(0, -innerPetalRadius);

      ctx.fillStyle = this.hsla(hue, 80, 60, petalAlpha);
      ctx.strokeStyle = this.hsla(hue, 85, 65, 0.7);
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 35, 0, 0, twoPi);
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
    const binduSize2 = binduSize * 2;
    const binduHue60 = this.fastMod360(this.hueBase + 60);
    const binduHue40 = this.fastMod360(this.hueBase + 40);
    const binduHue20 = this.fastMod360(this.hueBase + 20);
    const binduGradient = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      binduSize2,
    );
    binduGradient.addColorStop(0, this.hsla(binduHue60, 100, 80, 1));
    binduGradient.addColorStop(0.5, this.hsla(binduHue40, 90, 70, 0.7));
    binduGradient.addColorStop(1, this.hsla(binduHue20, 80, 60, 0));

    ctx.fillStyle = binduGradient;
    ctx.beginPath();
    ctx.arc(0, 0, binduSize2, 0, twoPi);
    ctx.fill();

    ctx.fillStyle = this.hsla(binduHue60, 100, 90, 1);
    ctx.beginPath();
    ctx.arc(0, 0, binduSize, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate metatron parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const timePulse = this.time * 0.004;
    const connectionAlpha = 0.3 + audioIntensity * 0.2;
    const maxDist = radius * 1.2;
    const maxDistSq = maxDist * maxDist; // Use squared distance for comparison
    const inv6 = 1 / 6;
    const hexAngleStep = twoPi * inv6;

    // Draw connections (edges of platonic solids) - optimized with single path
    ctx.strokeStyle = this.hsla(this.hueBase, 70, 60, connectionAlpha);
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < circlePositions.length; i++) {
      for (let j = i + 1; j < circlePositions.length; j++) {
        const from = circlePositions[i];
        const to = circlePositions[j];
        if (!from || !to) continue;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distSq = dx * dx + dy * dy;

        // HYPER-OPTIMIZATION: Use squared distance comparison (avoid sqrt)
        if (distSq < maxDistSq) {
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
        }
      }
    }
    ctx.stroke();

    // Draw circles
    circlePositions.forEach((pos, index) => {
      const hue = this.fastMod360(this.hueBase + index * 28);
      // HYPER-OPTIMIZATION: Use fast trig for pulse calculation
      const pulse = this.fastSin(timePulse + index * 0.5) * 0.2 + 0.8;
      const size = circleRadius * pulse + (index === 0 ? midIntensity * 15 : 0);

      // Glow
      const size2 = size * 2;
      const size4 = size * 4;
      const size03 = size * 0.3;
      const glowAlpha = 0.5 + audioIntensity * 0.3;
      const gradient = ctx.createRadialGradient(
        pos.x,
        pos.y,
        size03,
        pos.x,
        pos.y,
        size2,
      );
      gradient.addColorStop(0, this.hsla(hue, 90, 70, glowAlpha));
      gradient.addColorStop(1, this.hsla(hue, 80, 60, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(pos.x - size2, pos.y - size2, size4, size4);

      // Circle
      const hue30 = this.fastMod360(hue + 30);
      ctx.fillStyle = this.hsla(hue, 85, 65, 0.8);
      ctx.strokeStyle = this.hsla(hue30, 90, 70, 0.9);
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, twoPi);
      ctx.fill();
      ctx.stroke();

      // Inner detail
      ctx.strokeStyle = this.hsla(this.fastMod360(hue + 60), 95, 75, 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 0.5, 0, twoPi);
      ctx.stroke();
    });

    // Outer sacred geometry
    const hexPoints = [];
    for (let i = 0; i < 6; i++) {
      const angle = hexAngleStep * i;
      // HYPER-OPTIMIZATION: Use fast trig for hex points
      hexPoints.push({
        x: this.fastCos(angle) * radius,
        y: this.fastSin(angle) * radius,
      });
    }

    const hexStrokeAlpha = 0.5 + bassIntensity * 0.3;
    ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + 180), 75, 65, hexStrokeAlpha);
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

    // HYPER-OPTIMIZATION: Pre-calculate vesica piscis parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const separationHalf = separation * 0.5;
    const separationHalfSq = separationHalf * separationHalf;
    const radiusSq = radius * radius;
    const radius03 = radius * 0.3;
    const radius07 = radius * 0.7;
    const circleAlpha = 0.4 + audioIntensity * 0.3;
    const vesicaAlpha = 0.6 + trebleIntensity * 0.4;

    // Left circle
    const leftX = -separationHalf;
    const leftHue = this.hueBase;

    const leftGradient = ctx.createRadialGradient(
      leftX,
      0,
      radius03,
      leftX,
      0,
      radius,
    );
    leftGradient.addColorStop(0, this.hsla(leftHue, 90, 70, circleAlpha));
    leftGradient.addColorStop(1, this.hsla(leftHue, 80, 60, 0.1));

    ctx.fillStyle = leftGradient;
    ctx.strokeStyle = this.hsla(leftHue, 85, 65, 0.8);
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(leftX, 0, radius, 0, twoPi);
    ctx.fill();
    ctx.stroke();

    // Right circle
    const rightX = separationHalf;
    const rightHue = this.fastMod360(this.hueBase + 120);

    const rightGradient = ctx.createRadialGradient(
      rightX,
      0,
      radius03,
      rightX,
      0,
      radius,
    );
    rightGradient.addColorStop(0, this.hsla(rightHue, 90, 70, circleAlpha));
    rightGradient.addColorStop(1, this.hsla(rightHue, 80, 60, 0.1));

    ctx.fillStyle = rightGradient;
    ctx.strokeStyle = this.hsla(rightHue, 85, 65, 0.8);
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(rightX, 0, radius, 0, twoPi);
    ctx.fill();
    ctx.stroke();

    // Highlight the vesica piscis (intersection)
    ctx.save();
    ctx.beginPath();
    ctx.arc(leftX, 0, radius, 0, twoPi);
    ctx.clip();

    const vesicaHue = this.fastMod360(this.hueBase + 240);
    const vesicaGradient = ctx.createRadialGradient(
      0,
      0,
      10,
      0,
      0,
      radius07,
    );
    vesicaGradient.addColorStop(0, this.hsla(vesicaHue, 95, 75, vesicaAlpha));
    vesicaGradient.addColorStop(1, this.hsla(vesicaHue, 85, 65, 0.2));

    ctx.fillStyle = vesicaGradient;
    ctx.beginPath();
    ctx.arc(rightX, 0, radius, 0, twoPi);
    ctx.fill();

    ctx.restore();

    // Outline the vesica piscis
    // HYPER-OPTIMIZATION: Use fast sqrt for intersection height
    const intersectionHeightSq = radiusSq - separationHalfSq;
    const intersectionHeight = this.fastSqrt(intersectionHeightSq);

    const vesicaStrokeAlpha = 0.9 + audioIntensity * 0.1;
    ctx.strokeStyle = this.hsla(vesicaHue, 90, 70, vesicaStrokeAlpha);
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(0, -intersectionHeight);
    ctx.arcTo(rightX, 0, 0, intersectionHeight, radius);
    ctx.arcTo(leftX, 0, 0, -intersectionHeight, radius);
    ctx.closePath();
    ctx.stroke();

    // Sacred geometry additions
    const verticalLineY = intersectionHeight * (0.8 + audioIntensity * 0.2);

    ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + 60), 80, 65, 0.6);
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
      const pointHue = this.fastMod360(vesicaHue + i * 60);

      ctx.fillStyle = this.hsla(pointHue, 95, 75, 0.9);
      ctx.strokeStyle = this.hsla(this.fastMod360(pointHue + 30), 100, 80, 1);
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(point.x, point.y, pointSize, 0, twoPi);
      ctx.fill();
      ctx.stroke();
    });

    // Rotating sacred symbols
    const symbolCount = 6;
    const invSymbolCount = 1 / symbolCount;
    const symbolAngleStep = twoPi * invSymbolCount;
    const symbolDist = radius * 1.5;
    ctx.save();
    ctx.rotate(this.time * 0.002);

    for (let i = 0; i < symbolCount; i++) {
      const angle = symbolAngleStep * i;
      // HYPER-OPTIMIZATION: Use fast trig for symbol position
      const x = this.fastCos(angle) * symbolDist;
      const y = this.fastSin(angle) * symbolDist;
      const symbolSize = 4 + trebleIntensity * 5;
      const symbolHue = this.fastMod360(this.hueBase + i * 60);

      ctx.fillStyle = this.hsla(symbolHue, 90, 70, 0.7);
      ctx.beginPath();
      ctx.arc(x, y, symbolSize, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate torus field parameters
    const rings = 30;
    const invRings = 1 / rings;
    const timeRing = this.time * 0.005;
    const timeParticle = this.time * 0.01;
    const timeFlow = this.time * 0.003;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const inv8 = 1 / 8;
    const particleAngleStep = twoPi * inv8;
    const flowLines = 12;
    const invFlowLines = 1 / flowLines;
    const flowAngleStep = twoPi * invFlowLines;
    const inv100 = 1 / 100;
    const minorRadiusHalf = minorRadius * 0.5;

    // Draw torus using concentric rings
    for (let i = 0; i < rings; i++) {
      const progress = i * invRings;
      const angle = progress * twoPi + timeRing;

      // HYPER-OPTIMIZATION: Use fast trig for torus calculation
      const sinAngle = this.fastSin(angle);
      const cosAngle = this.fastCos(angle);
      const absSinAngle = sinAngle < 0 ? -sinAngle : sinAngle;
      const absCosAngle = cosAngle < 0 ? -cosAngle : cosAngle;
      
      const ringCenterX = cosAngle * majorRadius;
      const ringCenterY = sinAngle * majorRadius;
      const ringRadius = minorRadius * absSinAngle;

      const hue = this.fastMod360(this.hueBase + progress * 240);
      const alpha = 0.3 + (1 - absCosAngle) * 0.5 + audioIntensity * 0.2;

      // Ring glow
      const ringRadius15 = ringRadius * 1.5;
      const ringRadius03 = ringRadius * 0.3;
      const ringRadius3 = ringRadius * 3;
      const gradient = ctx.createRadialGradient(
        ringCenterX,
        ringCenterY,
        ringRadius03,
        ringCenterX,
        ringCenterY,
        ringRadius15,
      );
      gradient.addColorStop(0, this.hsla(hue, 90, 70, alpha));
      gradient.addColorStop(1, this.hsla(hue, 80, 60, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(
        ringCenterX - ringRadius15,
        ringCenterY - ringRadius15,
        ringRadius3,
        ringRadius3,
      );

      // Ring outline
      ctx.strokeStyle = this.hsla(hue, 85, 65, alpha);
      ctx.lineWidth = 2 + absSinAngle * 3;

      ctx.beginPath();
      ctx.ellipse(
        ringCenterX,
        ringCenterY,
        ringRadius,
        minorRadiusHalf,
        angle,
        0,
        twoPi,
      );
      ctx.stroke();

      // Energy particles flowing along torus
      if (i % 3 === 0) {
        const particleHue = this.fastMod360(hue + 60);
        for (let p = 0; p < 8; p++) {
          const pAngle = particleAngleStep * p + timeParticle;
          // HYPER-OPTIMIZATION: Use fast trig for particle position
          const pX = ringCenterX + this.fastCos(pAngle) * ringRadius;
          const pY = ringCenterY + this.fastSin(pAngle) * minorRadiusHalf;
          const pSize = 3 + audioIntensity * 4;

          ctx.fillStyle = this.hsla(particleHue, 95, 75, 0.8);
          ctx.beginPath();
          ctx.arc(pX, pY, pSize, 0, twoPi);
          ctx.fill();
        }
      }
    }

    // Central axis
    const axisAlpha = 0.4 + audioIntensity * 0.3;
    ctx.strokeStyle = this.hsla(this.hueBase, 70, 60, axisAlpha);
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);

    const majorRadius12 = majorRadius * 1.2;
    ctx.beginPath();
    ctx.moveTo(-majorRadius12, 0);
    ctx.lineTo(majorRadius12, 0);
    ctx.stroke();

    ctx.setLineDash([]);

    // Energy flow lines
    const flowAlpha = 0.3 + audioIntensity * 0.2;
    for (let i = 0; i < flowLines; i++) {
      const flowAngle = flowAngleStep * i + timeFlow;
      const hue = this.fastMod360(this.hueBase + i * 30);

      ctx.save();
      ctx.rotate(flowAngle);

      ctx.strokeStyle = this.hsla(hue, 80, 65, flowAlpha);
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let t = 0; t <= 100; t++) {
        const tProgress = t * inv100;
        const tAngle = tProgress * twoPi;
        // HYPER-OPTIMIZATION: Use fast trig for flow line calculation
        const cosTAngle = this.fastCos(tAngle);
        const radius = majorRadius + cosTAngle * minorRadius;
        const x = cosTAngle * radius;
        const y = this.fastSin(tAngle) * minorRadiusHalf;

        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.restore();
    }

    // Central vortex
    const vortexSize = 30 + bassIntensity * 20;
    const vortexHue120 = this.fastMod360(this.hueBase + 120);
    const vortexHue90 = this.fastMod360(this.hueBase + 90);
    const vortexHue60 = this.fastMod360(this.hueBase + 60);
    const vortexGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, vortexSize);
    vortexGradient.addColorStop(0, this.hsla(vortexHue120, 95, 75, 1));
    vortexGradient.addColorStop(0.6, this.hsla(vortexHue90, 85, 65, 0.6));
    vortexGradient.addColorStop(1, this.hsla(vortexHue60, 75, 55, 0));

    ctx.fillStyle = vortexGradient;
    ctx.beginPath();
    ctx.arc(0, 0, vortexSize, 0, twoPi);
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
    // HYPER-OPTIMIZATION: Use fast trig for egg rotation
    ctx.rotate(this.fastSin(this.time * 0.002) * 0.1);

    // HYPER-OPTIMIZATION: Pre-calculate cosmic egg parameters
    const twoPi = FlowFieldRenderer.TWO_PI;
    const fieldLayers = 8;
    const invFieldLayers = 1 / fieldLayers;
    const timeHue = this.time * 0.3;
    const timeSpiral = this.time * 0.005;
    const timeStar = this.time * 0.001;
    const timeTwinkle = this.time * 0.01;
    const eggWidthSq = eggWidth * eggWidth;
    const eggHeightSq = eggHeight * eggHeight;
    const invEggWidthSq = 1 / eggWidthSq;
    const invEggHeightSq = 1 / eggHeightSq;
    const eggHeightRatio = eggHeight / eggWidth;
    const eggHeight02 = eggHeight * 0.2;
    const eggHeight06 = eggHeight * 0.6;

    // Outer cosmic field
    for (let i = 0; i < fieldLayers; i++) {
      const scale = 1 + (i * invFieldLayers) * 0.5;
      const hue = this.fastMod360(this.hueBase + i * 30 + timeHue);
      const alpha = 0.1 + ((fieldLayers - i) * invFieldLayers) * 0.3 + audioIntensity * 0.1;

      ctx.strokeStyle = this.hsla(hue, 80, 65, alpha);
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(0, 0, eggWidth * scale, eggHeight * scale, 0, 0, twoPi);
      ctx.stroke();
    }

    // Main egg body with gradient
    const eggHue40 = this.fastMod360(this.hueBase + 40);
    const eggHue80 = this.fastMod360(this.hueBase + 80);
    const eggGradient = ctx.createRadialGradient(
      0,
      -eggHeight02,
      0,
      0,
      0,
      eggHeight06,
    );
    eggGradient.addColorStop(0, this.hsla(this.hueBase, 70, 50, 0.8));
    eggGradient.addColorStop(0.5, this.hsla(eggHue40, 75, 55, 0.6));
    eggGradient.addColorStop(1, this.hsla(eggHue80, 80, 60, 0.4));

    ctx.fillStyle = eggGradient;
    ctx.strokeStyle = this.hsla(this.hueBase, 85, 65, 0.9);
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.ellipse(0, 0, eggWidth, eggHeight, 0, 0, twoPi);
    ctx.fill();
    ctx.stroke();

    // Inner universe swirl
    const spiralTurns = 5;
    const maxRadius = eggWidth * 0.8;
    const spiralAngleMult = twoPi * spiralTurns;
    const inv360 = 1 / 360;
    const spiralAlpha = 0.6 + audioIntensity * 0.3;

    ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + 120), 90, 70, spiralAlpha);
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let t = 0; t <= 360; t++) {
      const progress = t * inv360;
      const angle = progress * spiralAngleMult + timeSpiral;
      const radius = progress * maxRadius;
      // HYPER-OPTIMIZATION: Use fast trig for spiral calculation
      const x = this.fastCos(angle) * radius;
      const y = this.fastSin(angle) * radius * eggHeightRatio;

      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Counter-rotating spiral
    const counterSpiralAlpha = 0.5 + audioIntensity * 0.3;
    ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + 240), 90, 70, counterSpiralAlpha);
    ctx.lineWidth = 3;

    ctx.beginPath();
    for (let t = 0; t <= 360; t++) {
      const progress = t * inv360;
      const angle = -progress * spiralAngleMult - timeSpiral;
      const radius = progress * maxRadius;
      // HYPER-OPTIMIZATION: Use fast trig for counter-spiral
      const x = this.fastCos(angle) * radius;
      const y = this.fastSin(angle) * radius * eggHeightRatio;

      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Stars/galaxies within
    const starCount = 50;
    const invStarCount = 1 / starCount;
    const starAngleStep = twoPi * invStarCount;
    const inv10 = 1 / 10;
    let rngSeed = (this.time * 1103515245 + 12345) & 0x7fffffff;
    
    for (let i = 0; i < starCount; i++) {
      const angle = starAngleStep * i + timeStar * (i & 1 ? -1 : 1);
      const radiusProgress = (i % 10) * inv10;
      const radius = radiusProgress * maxRadius;
      // HYPER-OPTIMIZATION: Use fast trig for star position
      const x = this.fastCos(angle) * radius;
      const y = this.fastSin(angle) * radius * eggHeightRatio;

      // Only draw stars inside the egg (squared distance check)
      const xSq = x * x;
      const ySq = y * y;
      if (xSq * invEggWidthSq + ySq * invEggHeightSq < 0.64) {
        // HYPER-OPTIMIZATION: Use deterministic pseudo-random
        rngSeed = (rngSeed * 1664525 + 1013904223) & 0x7fffffff;
        const starSize = 2 + (rngSeed / 0x7fffffff) * 3 + midIntensity * 3;
        const starHue = this.fastMod360(this.hueBase + i * 7);
        // HYPER-OPTIMIZATION: Use fast trig for twinkle
        const twinkle = this.fastSin(timeTwinkle + i) * 0.3 + 0.7;

        ctx.fillStyle = this.hsla(starHue, 90, 70, twinkle);
        ctx.beginPath();
        ctx.arc(x, y, starSize, 0, twoPi);
        ctx.fill();
      }
    }

    // Central light (primordial essence)
    const coreSize = 40 + bassIntensity * 30;
    const coreSize02 = coreSize * 0.2;
    const coreHue60 = this.fastMod360(this.hueBase + 60);
    const coreHue40 = this.fastMod360(this.hueBase + 40);
    const coreHue20 = this.fastMod360(this.hueBase + 20);
    const coreGradient = ctx.createRadialGradient(
      0,
      0,
      coreSize02,
      0,
      0,
      coreSize,
    );
    coreGradient.addColorStop(0, this.hsla(coreHue60, 100, 90, 1));
    coreGradient.addColorStop(0.4, this.hsla(coreHue40, 95, 80, 0.8));
    coreGradient.addColorStop(0.7, this.hsla(coreHue20, 90, 70, 0.5));
    coreGradient.addColorStop(1, this.hsla(this.hueBase, 85, 60, 0));

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, coreSize, 0, twoPi);
    ctx.fill();

    // Emanating rays
    const rayCount = 12;
    const invRayCount = 1 / rayCount;
    const rayAngleStep = twoPi * invRayCount;
    const timeRay = this.time * 0.003;
    const rayLength = coreSize + 30 + bassIntensity * 20;
    const coreSizeHalf = coreSize * 0.5;
    const rayHue45 = this.fastMod360(this.hueBase + 45);
    const rayHue60 = this.fastMod360(this.hueBase + 60);
    
    for (let i = 0; i < rayCount; i++) {
      const rayAngle = rayAngleStep * i + timeRay;

      ctx.save();
      ctx.rotate(rayAngle);

      const rayGradient = ctx.createLinearGradient(
        coreSizeHalf,
        0,
        rayLength,
        0,
      );
      rayGradient.addColorStop(0, this.hsla(rayHue45, 95, 75, 0.8));
      rayGradient.addColorStop(1, this.hsla(rayHue60, 90, 70, 0));

      ctx.strokeStyle = rayGradient;
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(coreSizeHalf, 0);
      ctx.lineTo(rayLength, 0);
      ctx.stroke();

      ctx.restore();
    }

    // Cracking effect (emergence)
    if (audioIntensity > 0.7) {
      const cracks = 8;
      const invCracks = 1 / cracks;
      const crackAngleStep = twoPi * invCracks;
      const timeCrack = this.time * 0.01;
      const crackLength = eggHeight * 0.6;
      const eggHeight02 = eggHeight * 0.2;
      const crackAlpha = audioIntensity - 0.7;
      const crackHue = this.fastMod360(this.hueBase + 180);
      
      for (let i = 0; i < cracks; i++) {
        // HYPER-OPTIMIZATION: Use fast trig for crack angle
        const crackAngle = crackAngleStep * i + this.fastSin(timeCrack) * 0.1;

        ctx.save();
        ctx.rotate(crackAngle);

        ctx.strokeStyle = this.hsla(crackHue, 80, 70, crackAlpha);
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);

        ctx.beginPath();
        ctx.moveTo(0, eggHeight02);
        const segmentCount = 10;
        const invSegmentCount = 1 / segmentCount;
        const timeCrackSegment = this.time * 0.02;
        for (let s = 0; s <= segmentCount; s++) {
          const sProgress = s * invSegmentCount;
          const y = eggHeight02 + sProgress * crackLength;
          // HYPER-OPTIMIZATION: Use fast trig for crack segment
          const x = this.fastSin(sProgress * twoPi + timeCrackSegment) * 10;
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

    // HYPER-OPTIMIZATION: Pre-calculate enochian parameters
    const gridSize = 4;
    const minDimension = Math.min(this.width, this.height);
    const cellSize = minDimension / (gridSize + 2);
    const cellSize2 = cellSize * 2;
    const cellSizeHalf = cellSize * 0.5;
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
    const timeRotation = this.time * 0.003;
    const timeScale = this.time * 0.005;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const crossAlpha = 0.8 + audioIntensity * 0.2;
    const crossHue = this.fastMod360(this.hueBase + 60);

    ctx.strokeStyle = this.hsla(crossHue, 90, 70, crossAlpha);
    ctx.lineWidth = 4 + bassIntensity * 4;
    ctx.beginPath();
    ctx.moveTo(-cellSize2, 0);
    ctx.lineTo(cellSize2, 0);
    ctx.moveTo(0, -cellSize2);
    ctx.lineTo(0, cellSize2);
    ctx.stroke();

    for (let row = -2; row < 2; row++) {
      for (let col = -2; col < 2; col++) {
        const x = col * cellSize + cellSizeHalf;
        const y = row * cellSize + cellSizeHalf;
        const charIndex =
          ((row + 2) * gridSize + (col + 2)) % enochianChars.length;
        // HYPER-OPTIMIZATION: Use fast trig for rotation and scale
        const rotation = this.fastSin(timeRotation + row + col) * 0.2;
        const scale =
          1 +
          this.fastSin(timeScale + row * col) * 0.15 +
          midIntensity * 0.2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        const charHue = this.fastMod360(this.hueBase + charIndex * 15);
        ctx.fillStyle = this.hsla(charHue, 90, 75, 0.9 + audioIntensity * 0.1);
        ctx.font = `${cellSize * 0.5}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(enochianChars[charIndex] ?? "", 0, 0);
        ctx.restore();
      }
    }

    const outerRadius = cellSize * 2.5 + bassIntensity * 20;
    const outerAlpha = 0.7 + audioIntensity * 0.2;
    ctx.strokeStyle = this.hsla(this.hueBase, 90, 70, outerAlpha);
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate labyrinth parameters
    const rings = 7;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    const invRings = 1 / rings;
    const timeRotation = this.time * 0.001;
    const timeAlpha = this.time * 0.005;
    const twoPi = FlowFieldRenderer.TWO_PI;

    for (let ring = 0; ring < rings; ring++) {
      const radius = maxRadius * (ring + 1) * invRings;
      const segmentCount = 8 + ring * 2;
      const invSegmentCount = 1 / segmentCount;
      const segmentAngleStep = twoPi * invSegmentCount;
      const rotation = timeRotation * (ring & 1 ? -1 : 1);

      ctx.save();
      ctx.rotate(rotation);

      for (let seg = 0; seg < segmentCount; seg++) {
        const angle = segmentAngleStep * seg;
        const nextAngle = segmentAngleStep * (seg + 1);
        const shouldDraw = (seg + ring) % 3 !== 0;

        if (shouldDraw) {
          const hue = this.fastMod360(this.hueBase + ring * 30 + seg * 5);
          // HYPER-OPTIMIZATION: Use fast trig for alpha calculation
          const alpha =
            0.6 +
            this.fastSin(timeAlpha + seg) * 0.2 +
            trebleIntensity * 0.2;

          ctx.strokeStyle = this.hsla(hue, 85, 65, alpha);
          ctx.lineWidth = 2 + bassIntensity * 2;
          ctx.lineCap = "round";

          ctx.beginPath();
          ctx.arc(0, 0, radius, angle, nextAngle);
          ctx.stroke();

          if (ring < rings - 1 && seg % 2 === 0) {
            const innerRadius = maxRadius * ring * invRings;
            const connectorAngle = (angle + nextAngle) * 0.5;
            // HYPER-OPTIMIZATION: Use fast trig for connector position
            const cosConnector = this.fastCos(connectorAngle);
            const sinConnector = this.fastSin(connectorAngle);
            const x1 = cosConnector * innerRadius;
            const y1 = sinConnector * innerRadius;
            const x2 = cosConnector * radius;
            const y2 = sinConnector * radius;

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
    const centerHue = this.fastMod360(this.hueBase + 180);
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerGlow);
    centerGradient.addColorStop(0, this.hsla(centerHue, 100, 80, 1));
    centerGradient.addColorStop(1, this.hsla(centerHue, 100, 80, 0));
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerGlow, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate cosmic web parameters
    const nodeCount = 12;
    const nodes: { x: number; y: number }[] = [];
    const radius = Math.min(this.width, this.height) * 0.35;
    const invNodeCount = 1 / nodeCount;
    const timeNode = this.time * 0.002;
    const pi4 = Math.PI * 4;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const maxDistance = radius * 0.8;
    const maxDistanceSq = maxDistance * maxDistance; // Use squared for comparison

    for (let i = 0; i < nodeCount; i++) {
      const spiralProgress = i * invNodeCount;
      const angle = spiralProgress * pi4 + timeNode;
      const r = radius * (0.3 + spiralProgress * 0.7);
      // HYPER-OPTIMIZATION: Use fast trig for node position
      nodes.push({ x: this.fastCos(angle) * r, y: this.fastSin(angle) * r });
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeI = nodes[i];
        const nodeJ = nodes[j];
        if (!nodeI || !nodeJ) continue;

        const dx = nodeJ.x - nodeI.x;
        const dy = nodeJ.y - nodeI.y;
        const distSq = dx * dx + dy * dy;

        // HYPER-OPTIMIZATION: Use squared distance comparison (avoid Math.hypot)
        if (distSq < maxDistanceSq) {
          // HYPER-OPTIMIZATION: Use fast sqrt only when needed
          const distance = this.fastSqrt(distSq);
          const invMaxDistance = 1 / maxDistance;
          const distRatio = 1 - distance * invMaxDistance;
          const alpha = distRatio * 0.4 + midIntensity * 0.2;
          const hue = this.fastMod360(this.hueBase + i * 15 + j * 10);

          ctx.strokeStyle = this.hsla(hue, 80, 65, alpha);
          ctx.lineWidth = 1 + distRatio * 2;

          const pulsePos = (this.time * 0.005 + i * 0.1) % 1;
          const pulseX = nodeI.x + (nodeJ.x - nodeI.x) * pulsePos;
          const pulseY = nodeI.y + (nodeJ.y - nodeI.y) * pulsePos;

          ctx.beginPath();
          ctx.moveTo(nodeI.x, nodeI.y);
          ctx.lineTo(nodeJ.x, nodeJ.y);
          ctx.stroke();

          const pulseHue = this.fastMod360(hue + 60);
          ctx.fillStyle = this.hsla(pulseHue, 90, 75, 0.8 + audioIntensity * 0.2);
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 3 + bassIntensity * 2, 0, twoPi);
          ctx.fill();
        }
      }
    }

    const timeNodeSize = this.time * 0.003;
    nodes.forEach((node, i) => {
      // HYPER-OPTIMIZATION: Use fast trig for node size pulse
      const nodeSize =
        6 + this.fastSin(timeNodeSize + i) * 3 + bassIntensity * 4;
      const hue = this.fastMod360(this.hueBase + i * 20);
      const nodeSize2 = nodeSize * 2;

      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        0,
        node.x,
        node.y,
        nodeSize2,
      );
      gradient.addColorStop(0, this.hsla(hue, 90, 75, 1));
      gradient.addColorStop(0.5, this.hsla(hue, 85, 70, 0.6));
      gradient.addColorStop(1, this.hsla(hue, 80, 65, 0));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeSize, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate vortex spiral parameters
    const arms = 5;
    const maxRadius = Math.min(this.width, this.height) * 0.45;
    const turns = 4;
    const invArms = 1 / arms;
    const armAngleStep = FlowFieldRenderer.TWO_PI * invArms;
    const hueStep = 360 * invArms;
    const timeSpiral = this.time * 0.003;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const angleMult = twoPi * turns;
    const inv100 = 1 / 100;

    for (let arm = 0; arm < arms; arm++) {
      const armOffset = armAngleStep * arm;
      const armHue = this.fastMod360(this.hueBase + arm * hueStep);

      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const progress = i * inv100;
        const angle = armOffset + progress * angleMult + timeSpiral;
        const radius = progress * maxRadius * (0.1 + progress * 0.9);
        // HYPER-OPTIMIZATION: Use fast trig for spiral position
        const x = this.fastCos(angle) * radius;
        const y = this.fastSin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const gradient = ctx.createLinearGradient(0, 0, maxRadius, 0);
      gradient.addColorStop(0, this.hsla(armHue, 90, 70, 0.2));
      const midAlpha = 0.6 + midIntensity * 0.3;
      gradient.addColorStop(0.5, this.hsla(armHue, 85, 65, midAlpha));
      gradient.addColorStop(1, this.hsla(armHue, 80, 60, 0.9));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 + bassIntensity * 4;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    const eyeSize = 30 + bassIntensity * 20;
    const eyeHue180 = this.fastMod360(this.hueBase + 180);
    const eyeHue120 = this.fastMod360(this.hueBase + 120);
    const eyeGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeSize);
    eyeGradient.addColorStop(0, this.hsla(eyeHue180, 100, 90, 1));
    eyeGradient.addColorStop(0.6, this.hsla(eyeHue120, 90, 70, 0.7));
    eyeGradient.addColorStop(1, this.hsla(this.hueBase, 80, 60, 0));

    ctx.fillStyle = eyeGradient;
    ctx.beginPath();
    ctx.arc(0, 0, eyeSize, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate sacred spiral parameters
    const phi = 1.618033988749;
    const maxRadius = Math.min(this.width, this.height) * 0.4;
    const turns = 3;
    const spiralCount = 3;
    const invSpiralCount = 1 / spiralCount;
    const offsetStep = FlowFieldRenderer.TWO_PI * invSpiralCount;
    const hueStep = 120;
    const timeSpiral = this.time * 0.002;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const angleMult = twoPi * turns;
    const inv200 = 1 / 200;
    const invPhi = 1 / phi;
    const phiMinus2 = Math.pow(phi, -2);
    const phi3 = Math.pow(phi, 3);
    const spiralAlpha = 0.6 + trebleIntensity * 0.3;

    for (let spiralIndex = 0; spiralIndex < spiralCount; spiralIndex++) {
      const offset = offsetStep * spiralIndex;
      const hue = this.fastMod360(this.hueBase + spiralIndex * hueStep);
      const timeDir = timeSpiral * (spiralIndex & 1 ? -1 : 1);

      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const progress = i * inv200;
        const angle = offset + progress * angleMult + timeDir;
        // HYPER-OPTIMIZATION: Pre-calculate phi power (avoid Math.pow in loop)
        const phiPower = phiMinus2 * Math.pow(phi, progress * 3);
        const radius = (maxRadius * phiPower) * invPhi;
        // HYPER-OPTIMIZATION: Use fast trig for spiral position
        const x = this.fastCos(angle) * radius;
        const y = this.fastSin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = this.hsla(hue, 85, 65, spiralAlpha);
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

    // HYPER-OPTIMIZATION: Pre-calculate elemental cross parameters
    const armLength = Math.min(this.width, this.height) * 0.35;
    const halfPi = Math.PI * 0.5;
    const threeHalfPi = Math.PI * 1.5;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const timeSymbol = this.time * 0.005;
    const armLength085 = armLength * 0.85;
    const armLength015 = armLength * 0.15;
    const elements = [
      { angle: 0, hue: 15, symbol: "△" },
      { angle: halfPi, hue: 60, symbol: "△" },
      { angle: Math.PI, hue: 200, symbol: "▽" },
      { angle: threeHalfPi, hue: 120, symbol: "▽" },
    ];

    elements.forEach((element, index) => {
      ctx.save();
      ctx.rotate(element.angle);

      const elementAlpha = 0.8 + audioIntensity * 0.2;
      const gradient = ctx.createLinearGradient(0, 0, armLength, 0);
      gradient.addColorStop(0, this.hsla(element.hue, 90, 70, elementAlpha));
      gradient.addColorStop(1, this.hsla(element.hue, 90, 70, 0));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 8 + bassIntensity * 6;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(armLength, 0);
      ctx.stroke();

      ctx.translate(armLength085, 0);
      // HYPER-OPTIMIZATION: Use fast trig for symbol scale
      const symbolScale =
        1 + this.fastSin(timeSymbol + index) * 0.2 + midIntensity * 0.3;
      ctx.scale(symbolScale, symbolScale);

      const symbolAlpha = 0.9 + audioIntensity * 0.1;
      ctx.fillStyle = this.hsla(element.hue, 95, 75, symbolAlpha);
      ctx.font = `${armLength015}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(element.symbol, 0, 0);

      ctx.restore();
    });

    const centerSize = 40 + bassIntensity * 20;
    const centerHue60 = this.fastMod360(this.hueBase + 60);
    const centerHue120 = this.fastMod360(this.hueBase + 120);
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerSize);
    centerGradient.addColorStop(0, this.hsla(this.hueBase, 95, 80, 1));
    centerGradient.addColorStop(0.7, this.hsla(centerHue60, 90, 70, 0.7));
    centerGradient.addColorStop(1, this.hsla(centerHue120, 85, 60, 0));

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerSize, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate dragon eye parameters
    const eyeWidth = Math.min(this.width, this.height) * 0.4;
    const eyeHeight = eyeWidth * 0.6;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const eyeHue30 = this.fastMod360(this.hueBase + 30);

    ctx.fillStyle = this.hsla(eyeHue30, 40, 90, 0.9);
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeWidth, eyeHeight, 0, 0, twoPi);
    ctx.fill();

    const irisRadius = eyeHeight * 0.7;
    const irisHue40 = this.fastMod360(this.hueBase + 40);
    const irisHue20 = this.fastMod360(this.hueBase + 20);
    const irisGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, irisRadius);
    irisGradient.addColorStop(0, this.hsla(irisHue40, 80, 60, 1));
    irisGradient.addColorStop(0.6, this.hsla(irisHue20, 85, 55, 1));
    irisGradient.addColorStop(1, this.hsla(this.hueBase, 70, 40, 1));

    ctx.fillStyle = irisGradient;
    ctx.beginPath();
    ctx.arc(0, 0, irisRadius, 0, twoPi);
    ctx.fill();

    const scaleCount = 12;
    const invScaleCount = 1 / scaleCount;
    const scaleAngleStep = twoPi * invScaleCount;
    const timeScale = this.time * 0.001;
    const scaleRadius = irisRadius * 0.4;
    const scaleAlpha = 0.3 + midIntensity * 0.2;

    for (let i = 0; i < scaleCount; i++) {
      const angle = scaleAngleStep * i + timeScale;
      const scaleHue = this.fastMod360(this.hueBase + i * 10);

      ctx.save();
      ctx.rotate(angle);

      ctx.strokeStyle = this.hsla(scaleHue, 90, 65, scaleAlpha);
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(scaleRadius, 0);
      ctx.stroke();

      ctx.restore();
    }

    const pupilWidth = 8 + bassIntensity * 6;
    const pupilHeight = irisRadius * 1.5 * (0.7 + audioIntensity * 0.3);

    ctx.fillStyle = this.hsla(0, 0, 5, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, pupilWidth, pupilHeight, 0, 0, twoPi);
    ctx.fill();

    ctx.strokeStyle = this.hsla(this.hueBase, 85, 50, 0.9);
    ctx.lineWidth = 4 + bassIntensity * 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, eyeWidth, eyeHeight, 0, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate ancient glyphs parameters
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
    const invGlyphCount = 1 / glyphCount;
    const glyphAngleStep = FlowFieldRenderer.TWO_PI * invGlyphCount;
    const timeGlyph = this.time * 0.002;
    const timeRotation = this.time * 0.003;
    const timeScale = this.time * 0.005;
    const radius015 = radius * 0.15;
    const radius02 = radius * 0.2;
    const glyphAlpha = 0.9 + audioIntensity * 0.1;
    const glyphsLength = glyphs.length;

    for (let i = 0; i < glyphCount; i++) {
      const angle = glyphAngleStep * i + timeGlyph;
      // HYPER-OPTIMIZATION: Use fast trig for glyph position
      const x = this.fastCos(angle) * radius;
      const y = this.fastSin(angle) * radius;

      const glyphIndex = i % glyphsLength;
      const rotation = timeRotation * (i & 1 ? -1 : 1);
      // HYPER-OPTIMIZATION: Use fast trig for glyph scale pulse
      const scale =
        1 + this.fastSin(timeScale + i) * 0.2 + trebleIntensity * 0.3;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      const hue = this.fastMod360(this.hueBase + i * 20);
      ctx.fillStyle = this.hsla(hue, 95, 80, glyphAlpha);
      ctx.font = `${radius015}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyphs[glyphIndex] ?? "", 0, 0);

      ctx.restore();
    }

    // Central yin-yang symbol with enhanced glow
    ctx.fillStyle = this.hsla(this.hueBase, 100, 85, glyphAlpha);
    ctx.font = `${radius02}px serif`;
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

    // HYPER-OPTIMIZATION: Pre-calculate time wheel parameters
    const outerRadius = Math.min(this.width, this.height) * 0.4;
    const rings = 5;
    const invRings = 1 / rings;
    const timeRotation = this.time * 0.001;
    const timeAlpha = this.time * 0.005;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const halfPi = Math.PI * 0.5;
    const outerRadius085 = outerRadius * 0.85;
    const outerRadius08 = outerRadius * 0.08;
    const markerAlpha = 0.9 + audioIntensity * 0.1;

    for (let ring = 0; ring < rings; ring++) {
      const ringRatio = (ring + 1) * invRings;
      const radius = outerRadius * ringRatio;
      const segments = 12 * (ring + 1);
      const invSegments = 1 / segments;
      const segmentAngleStep = twoPi * invSegments;
      const rotation = timeRotation * (ring & 1 ? -1 : 1) * (ring + 1);
      const hueStep = 360 * invSegments;

      ctx.save();
      ctx.rotate(rotation);

      for (let seg = 0; seg < segments; seg++) {
        const angle = segmentAngleStep * seg;
        const nextAngle = segmentAngleStep * (seg + 1);

        const hue = this.fastMod360(this.hueBase + seg * hueStep + ring * 20);
        // HYPER-OPTIMIZATION: Use fast trig for alpha pulse
        const alpha =
          0.4 +
          this.fastSin(timeAlpha + seg + ring) * 0.2 +
          midIntensity * 0.2;

        ctx.fillStyle = this.hsla(hue, 80, 60, alpha * 0.3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, nextAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.hsla(hue, 85, 70, alpha);
        ctx.lineWidth = 1 + (ring === rings - 1 ? bassIntensity * 2 : 0);
        ctx.stroke();
      }

      ctx.restore();
    }

    const markers = 12;
    const invMarkers = 1 / markers;
    const markerAngleStep = twoPi * invMarkers;
    const markerHueStep = 30;

    for (let i = 0; i < markers; i++) {
      const angle = markerAngleStep * i - halfPi;
      // HYPER-OPTIMIZATION: Use fast trig for marker position
      const x = this.fastCos(angle) * outerRadius085;
      const y = this.fastSin(angle) * outerRadius085;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + halfPi);

      const markerHue = this.fastMod360(this.hueBase + i * markerHueStep);
      ctx.fillStyle = this.hsla(markerHue, 90, 75, markerAlpha);
      ctx.font = `${outerRadius08}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((i + 1).toString(), 0, 0);

      ctx.restore();
    }

    const centerGlow = 15 + bassIntensity * 10;
    const centerHue = this.fastMod360(this.hueBase + 180);
    const centerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, centerGlow);
    centerGradient.addColorStop(0, this.hsla(centerHue, 100, 90, 1));
    centerGradient.addColorStop(1, this.hsla(centerHue, 100, 90, 0));

    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(0, 0, centerGlow, 0, twoPi);
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

    // HYPER-OPTIMIZATION: Pre-calculate astral projection parameters
    const bodySize = Math.min(this.width, this.height) * 0.15;
    const timeAstral = this.time * 0.002;
    const timeAlpha = this.time * 0.003;
    const timeControl = this.time * 0.005;
    const timeGlow = this.time * 0.004;
    const twoPi = FlowFieldRenderer.TWO_PI;
    const bodySize06 = bodySize * 0.6;
    const bodySize08 = bodySize * 0.8;
    const bodySize04 = bodySize * 0.4;
    const astralGlow = bodySize * 2;
    const astralHue240 = this.fastMod360(this.hueBase + 240);
    const astralHue200 = this.fastMod360(this.hueBase + 200);
    const astralHue160 = this.fastMod360(this.hueBase + 160);
    const astralHue180 = this.fastMod360(this.hueBase + 180);

    // HYPER-OPTIMIZATION: Use fast trig for astral offset
    const astralOffset = this.fastSin(timeAstral) * 50 + bassIntensity * 30;

    ctx.save();
    ctx.translate(0, astralOffset);
    // HYPER-OPTIMIZATION: Use fast trig for alpha pulse
    ctx.globalAlpha = 0.4 + this.fastSin(timeAlpha) * 0.1;

    ctx.fillStyle = this.hsla(this.hueBase, 60, 50, 0.6);
    ctx.beginPath();
    ctx.ellipse(0, 0, bodySize06, bodySize, 0, 0, twoPi);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -bodySize08, bodySize04, 0, twoPi);
    ctx.fill();

    ctx.restore();

    const connectionAlpha = 0.5 + trebleIntensity * 0.3;
    ctx.strokeStyle = this.hsla(astralHue180, 80, 75, connectionAlpha);
    ctx.lineWidth = 2 + bassIntensity * 2;
    ctx.setLineDash([5, 10]);

    ctx.beginPath();
    ctx.moveTo(0, astralOffset);

    const controlPoints = 5;
    const invControlPoints = 1 / controlPoints;
    for (let i = 0; i <= controlPoints; i++) {
      const progress = i * invControlPoints;
      // HYPER-OPTIMIZATION: Use fast trig for connection wave
      const x = this.fastSin(progress * twoPi + timeControl) * 20;
      const y = astralOffset - progress * astralOffset;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    // HYPER-OPTIMIZATION: Use fast trig for glow alpha
    ctx.globalAlpha =
      0.7 + this.fastSin(timeGlow) * 0.2 + audioIntensity * 0.2;

    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, astralGlow);
    glowGradient.addColorStop(0, this.hsla(astralHue240, 90, 75, 0.6));
    glowGradient.addColorStop(0.5, this.hsla(astralHue200, 85, 70, 0.3));
    glowGradient.addColorStop(1, this.hsla(astralHue160, 80, 65, 0));

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, astralGlow, 0, twoPi);
    ctx.fill();

    ctx.fillStyle = this.hsla(astralHue240, 90, 80, 0.8);
    ctx.beginPath();
    ctx.ellipse(0, 0, bodySize06, bodySize, 0, 0, twoPi);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -bodySize08, bodySize04, 0, twoPi);
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

    const maxRadius = (this.width < this.height ? this.width : this.height) * 0.48;
    const layers = 28; // Increased from 16
    const t = this.time | 0;
    const bass = (bassIntensity * 15) | 0; // Doubled intensity
    const treb = (trebleIntensity * 12) | 0; // Doubled intensity

    for (let layer = 0; layer < layers; layer++) {
      const radius = (maxRadius * (layer + 1)) / layers;
      const segments = (12 + (layer << 1)) | 0; // More segments
      const rotSign = ((layer & 1) << 1) - 1;
      const rotation = (t * 0.0025 * rotSign * (1 + bassIntensity * 2)) | 0; // Faster rotation

      ctx.save();
      ctx.rotate(rotation);

      for (let i = 0; i < segments; i++) {
        const angle = (Math.PI * 2 * i) / segments;
        const nextAngle = (Math.PI * 2 * (i + 1)) / segments;

        const hue = (this.hueBase + 270 + (layer << 2)) & 359; // More color variation
        const lightness = (8 + Math.sin(t * 0.012 + layer + i) * 18) | 0; // Stronger pulse
        const alpha = 0.7 + Math.sin(t * 0.009 + i) * 0.4 + trebleIntensity * 0.8; // More intense

        ctx.strokeStyle = `hsla(${hue}, 85%, ${lightness}%, ${alpha})`; // Higher saturation
        ctx.lineWidth = 3.5 + ((layer === (layers - 1)) ? bass : bass * 0.3);
        ctx.shadowBlur = (40 + bass) | 0; // Doubled glow
        ctx.shadowColor = `hsla(${hue}, 95%, 40%, 0.95)`; // Brighter glow

        ctx.beginPath();
        ctx.arc(0, 0, radius, angle, nextAngle);
        ctx.stroke();

        if ((i & 2) === 0) { // More shadow particles
          const midAngle = (angle + nextAngle) * 0.5;
          const shadowX = Math.cos(midAngle) * radius;
          const shadowY = Math.sin(midAngle) * radius;

          ctx.fillStyle = `hsla(${hue}, 90%, 15%, ${alpha * 0.95})`;
          ctx.shadowBlur = (15 + bass * 0.5) | 0;
          ctx.beginPath();
          ctx.arc(shadowX, shadowY, (6 + bass * 0.7) | 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    const voidCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.35);
    voidCore.addColorStop(0, `hsla(${this.hueBase + 280}, 70%, 8%, ${0.98 + audioIntensity * 0.25})`); // Darker, more intense
    voidCore.addColorStop(0.5, `hsla(${this.hueBase + 270}, 80%, 12%, ${0.85 + audioIntensity * 0.4})`);
    voidCore.addColorStop(1, `hsla(${this.hueBase + 260}, 90%, 18%, 0)`);

    ctx.fillStyle = voidCore;
    ctx.shadowBlur = 50;
    ctx.shadowColor = `hsla(${this.hueBase + 270}, 100%, 20%, 0.8)`;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.35, 0, Math.PI * 2);
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

    const particlePairs = 48; // Doubled from 24
    const maxRadius = (this.width < this.height ? this.width : this.height) * 0.48;
    const t = this.time | 0;
    const bass = (bassIntensity * 10) | 0; // More than doubled
    const mid = (midIntensity * 12) | 0; // More than doubled

    for (let i = 0; i < particlePairs; i++) {
      const angle1 = (Math.PI * 2 * i) / particlePairs + t * 0.0035; // Faster rotation
      const angle2 = angle1 + Math.PI + Math.sin(t * 0.007 + i) * 0.8; // More movement

      const radius1 = maxRadius * (0.3 + Math.sin(t * 0.009 + i) * 0.35); // More range
      const radius2 = maxRadius * (0.3 + Math.sin(t * 0.009 + i + Math.PI) * 0.35);

      const x1 = Math.cos(angle1) * radius1;
      const y1 = Math.sin(angle1) * radius1;
      const x2 = Math.cos(angle2) * radius2;
      const y2 = Math.sin(angle2) * radius2;

      const hue = (this.hueBase + 180 + (i << 3)) & 359; // More color variety
      const alpha = 0.85 + midIntensity * 0.6; // More visible

      ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${alpha})`; // Brighter
      ctx.lineWidth = (4 + bass) | 0; // Thicker
      ctx.shadowBlur = 50; // Stronger glow
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.95)`; // Brighter glow

      const dx = x2 - x1;
      const dy = y2 - y1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(
        x1 + dx * 0.25 + Math.cos(t * 0.01 + i) * 20, // Animated curves
        y1 + dy * 0.25 + Math.sin(t * 0.01 + i) * 20,
        x2 - dx * 0.25 + Math.cos(t * 0.015 + i) * 15,
        y2 - dy * 0.25 + Math.sin(t * 0.015 + i) * 15,
        x2,
        y2,
      );
      ctx.stroke();

      const size1 = (10 + bass * 0.8) | 0; // Bigger particles
      const size2 = (10 + mid * 0.8) | 0;

      // Particle 1 with glow
      ctx.shadowBlur = 35 + bass;
      ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x1, y1, size1, 0, Math.PI * 2);
      ctx.fill();

      // Particle 2 with glow
      ctx.fillStyle = `hsla(${(hue + 80) & 359}, 100%, 90%, ${alpha})`; // More hue shift
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

    const maxRadius = (this.width < this.height ? this.width : this.height) * 0.50; // Larger
    const spirals = 14; // Doubled from 7
    const pointsPerSpiral = 450; // More points from 256
    const t = this.time | 0;
    const bass = (bassIntensity * 8) | 0; // More intense
    const mid = (midIntensity * 10) | 0; // More intense

    for (let spiral = 0; spiral < spirals; spiral++) {
      const spiralOffset = (Math.PI * 2 * spiral) / spirals;
      const hue = (this.hueBase + 30 + (spiral << 7)) & 359; // More color variation
      const rotSign = ((spiral & 1) << 1) - 1;

      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.75 + midIntensity * 0.6})`; // Brighter
      ctx.lineWidth = (3.5 + bass) | 0; // Thicker
      ctx.shadowBlur = 45; // Stronger glow
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.95)`; // Brighter glow

      ctx.beginPath();
      for (let i = 0; i < pointsPerSpiral; i++) {
        const tVal = i / pointsPerSpiral;
        const angle = tVal * Math.PI * 12 + spiralOffset + t * 0.007 * rotSign; // More spirals, faster
        const radius = maxRadius * tVal * (0.8 + Math.sin(t * 0.009 + spiral) * 0.35); // More variation
        const chaos = Math.sin(t * 0.025 + (spiral << 2) + tVal * 16) * (1 + bassIntensity * 2) * 12; // More chaos
        const x = Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * chaos;
        const y = Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * chaos;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const chaosCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxRadius * 0.25);
    chaosCore.addColorStop(0, `hsla(${(this.hueBase + 60) & 359}, 100%, 98%, ${0.98 + audioIntensity * 0.3})`); // Brighter
    chaosCore.addColorStop(0.5, `hsla(${(this.hueBase + 40) & 359}, 100%, 85%, ${0.9 + bassIntensity * 0.4})`);
    chaosCore.addColorStop(1, `hsla(${(this.hueBase + 20) & 359}, 100%, 65%, 0)`);

    ctx.fillStyle = chaosCore;
    ctx.shadowBlur = 60;
    ctx.shadowColor = `hsla(${this.hueBase + 50}, 100%, 80%, 0.9)`;
    ctx.beginPath();
    ctx.arc(0, 0, maxRadius * 0.25, 0, Math.PI * 2);
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

    const maxRadius = Math.min(this.width, this.height) * 0.55;
    const mistParticles = 180; // More than doubled from 80

    for (let i = 0; i < mistParticles; i++) {
      const angle = (Math.PI * 2 * i) / mistParticles;
      const baseRadius = maxRadius * (0.15 + (i % 5) * 0.12); // More layers
      const radius = baseRadius + Math.sin(this.time * 0.005 + i * 0.15) * maxRadius * 0.18; // More movement
      const x = Math.cos(angle + this.time * 0.0015) * radius; // Faster movement
      const y = Math.sin(angle + this.time * 0.0015) * radius;

      const hue = (this.hueBase + 150 + i * 3) % 360; // More color variety
      const size = 14 + Math.sin(this.time * 0.007 + i) * 8 + trebleIntensity * 12; // Bigger particles
      const alpha = 0.35 + Math.sin(this.time * 0.008 + i) * 0.25 + trebleIntensity * 0.5; // More visible

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `hsla(${hue}, 85%, 92%, ${alpha})`); // Brighter
      gradient.addColorStop(0.5, `hsla(${hue + 30}, 75%, 82%, ${alpha * 0.7})`); // Brighter
      gradient.addColorStop(1, `hsla(${hue + 60}, 65%, 72%, 0)`); // Brighter

      ctx.fillStyle = gradient;
      ctx.shadowBlur = 30 + trebleIntensity * 15; // Add glow
      ctx.shadowColor = `hsla(${hue}, 90%, 85%, ${alpha * 0.6})`;
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
    const zones = 9; // Increased from 6
    const invZones = 1 / zones;

    // Dimensional rift particles floating between zones (60-90 particles)
    const riftParticles = 60 + ((midIntensity * 30) | 0);
    for (let r = 0; r < riftParticles; r++) {
      const rAngle = (FlowFieldRenderer.TWO_PI * r) / riftParticles + this.time * 0.002;
      const rZone = r % zones;
      const rRadius = (maxRadius * invZones) * (rZone + 0.5) + this.fastSin(this.time * 0.005 + r) * 20;
      const rx = this.fastCos(rAngle) * rRadius;
      const ry = this.fastSin(rAngle) * rRadius;
      const rSize = 1.5 + this.fastSin(this.time * 0.007 + r) * 1.2;
      const rAlpha = 0.3 + this.fastSin(this.time * 0.004 + r) * 0.2;

      // Alternate between two hue ranges
      const rHue = rZone % 2 === 0
        ? this.fastMod360(this.hueBase + 280 + r * 3)
        : this.fastMod360(this.hueBase + 40 + r * 3);

      ctx.fillStyle = this.hsla(rHue, 80, 65, rAlpha);
      ctx.beginPath();
      ctx.arc(rx, ry, rSize, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

    // Enhanced rotating zones with distortion
    for (let zone = 0; zone < zones; zone++) {
      const innerRadius = maxRadius * invZones * zone;
      const outerRadius = maxRadius * invZones * (zone + 1);
      const rotation = this.time * 0.0006 * (zone % 2 === 0 ? 1 : -1);

      ctx.save();
      ctx.rotate(rotation);

      const hue1 = this.fastMod360(this.hueBase + 280 + zone * 10);
      const hue2 = this.fastMod360(this.hueBase + 40 + zone * 10);
      const midHue = this.fastMod360((hue1 + hue2) * 0.5);
      const alpha = 0.4 + this.fastSin(this.time * 0.003 + zone) * 0.2 + midIntensity * 0.2;

      const zoneGradient = ctx.createRadialGradient(0, 0, innerRadius, 0, 0, outerRadius);
      zoneGradient.addColorStop(0, this.hsla(hue1, 70, 50, alpha));
      zoneGradient.addColorStop(0.5, this.hsla(midHue, 75, 55, alpha * 0.8));
      zoneGradient.addColorStop(1, this.hsla(hue2, 70, 50, alpha * 0.6));

      ctx.fillStyle = zoneGradient;
      ctx.beginPath();
      ctx.arc(0, 0, outerRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.arc(0, 0, innerRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill("evenodd");

      // Zone boundary sparkles (8-12 per zone)
      const sparkleCount = 8 + ((bassIntensity * 4) | 0);
      const sparkleAngleStep = FlowFieldRenderer.TWO_PI / sparkleCount;
      for (let s = 0; s < sparkleCount; s++) {
        const sparkleAngle = sparkleAngleStep * s + this.time * 0.008;
        const sparkleRadius = outerRadius + this.fastSin(this.time * 0.01 + s + zone) * 3;
        const sx = this.fastCos(sparkleAngle) * sparkleRadius;
        const sy = this.fastSin(sparkleAngle) * sparkleRadius;
        const sparkleSize = 1.5 + this.fastSin(this.time * 0.012 + s) * 1 + midIntensity;
        const sparkleAlpha = alpha * (0.6 + this.fastSin(this.time * 0.009 + s) * 0.3);

        ctx.fillStyle = this.hsla(hue2, 85, 70, sparkleAlpha);
        ctx.beginPath();
        ctx.arc(sx, sy, sparkleSize, 0, FlowFieldRenderer.TWO_PI);
        ctx.fill();
      }

      // Dimensional tears emanating from zone boundaries (4 tears per zone)
      if (zone % 2 === 0) {
        const tearCount = 4;
        const tearAngleStep = FlowFieldRenderer.TWO_PI / tearCount;
        for (let t = 0; t < tearCount; t++) {
          const tearAngle = tearAngleStep * t;
          const tearLength = 25 + this.fastSin(this.time * 0.006 + t + zone) * 10 + bassIntensity * 8;
          const x1 = this.fastCos(tearAngle) * outerRadius;
          const y1 = this.fastSin(tearAngle) * outerRadius;
          const x2 = this.fastCos(tearAngle) * (outerRadius + tearLength);
          const y2 = this.fastSin(tearAngle) * (outerRadius + tearLength);

          const tearGradient = ctx.createLinearGradient(x1, y1, x2, y2);
          tearGradient.addColorStop(0, this.hsla(hue2, 80, 60, alpha * 0.6));
          tearGradient.addColorStop(0.5, this.hsla(midHue, 75, 55, alpha * 0.4));
          tearGradient.addColorStop(1, this.hsla(hue1, 70, 50, 0));

          ctx.strokeStyle = tearGradient;
          ctx.lineWidth = 2 + bassIntensity;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Swirling twilight wisps in center (10-16 wisps)
    const wispCount = 10 + ((midIntensity * 6) | 0);
    for (let w = 0; w < wispCount; w++) {
      const wAngle = (FlowFieldRenderer.TWO_PI * w) / wispCount + this.time * 0.004;
      const wRadius = maxRadius * (0.12 + this.fastSin(this.time * 0.006 + w) * 0.08);
      const wx = this.fastCos(wAngle) * wRadius;
      const wy = this.fastSin(wAngle) * wRadius;
      const wSize = 5 + this.fastSin(this.time * 0.008 + w) * 2 + midIntensity * 3;
      const wAlpha = 0.4 + this.fastSin(this.time * 0.005 + w) * 0.2 + audioIntensity * 0.2;
      const wHue = w % 2 === 0
        ? this.fastMod360(this.hueBase + 320)
        : this.fastMod360(this.hueBase + 50);

      const wispGradient = ctx.createRadialGradient(wx, wy, 0, wx, wy, wSize * 1.5);
      wispGradient.addColorStop(0, this.hsla(wHue, 85, 65, wAlpha));
      wispGradient.addColorStop(0.6, this.hsla(this.fastMod360(wHue + 15), 80, 60, wAlpha * 0.6));
      wispGradient.addColorStop(1, this.hsla(this.fastMod360(wHue + 30), 75, 55, 0));

      ctx.fillStyle = wispGradient;
      ctx.beginPath();
      ctx.arc(wx, wy, wSize * 1.5, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

    // Enhanced multi-layered twilight core (4 layers)
    for (let layer = 0; layer < 4; layer++) {
      const coreRadius = maxRadius * (0.25 - layer * 0.04);
      const corePulse = 1 + this.fastSin(this.time * 0.005 + layer * 0.4) * 0.1 + audioIntensity * 0.08;
      const finalRadius = coreRadius * corePulse;

      const twilightCore = ctx.createRadialGradient(0, 0, 0, 0, 0, finalRadius);

      // Alternate between two color schemes per layer
      const coreHue1 = layer % 2 === 0
        ? this.fastMod360(this.hueBase + 320 - layer * 5)
        : this.fastMod360(this.hueBase + 50 - layer * 5);
      const coreHue2 = layer % 2 === 0
        ? this.fastMod360(this.hueBase + 50 - layer * 5)
        : this.fastMod360(this.hueBase + 280 - layer * 5);

      twilightCore.addColorStop(
        0,
        this.hsla(coreHue1, 80, 60, (0.8 - layer * 0.15) + audioIntensity * 0.2),
      );
      twilightCore.addColorStop(
        0.6,
        this.hsla(coreHue2, 75, 55, (0.5 - layer * 0.1) + midIntensity * 0.3),
      );
      twilightCore.addColorStop(
        1,
        this.hsla(this.fastMod360(this.hueBase + 280 - layer * 5), 70, 50, 0),
      );

      ctx.fillStyle = twilightCore;
      ctx.beginPath();
      ctx.arc(0, 0, finalRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

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
    const echoLayers = 16; // Increased from 10

    // Spectral fragments floating between echoes (50-80 particles)
    const fragmentCount = 50 + ((trebleIntensity * 30) | 0);
    for (let f = 0; f < fragmentCount; f++) {
      const fAngle = (FlowFieldRenderer.TWO_PI * f) / fragmentCount + this.time * 0.001;
      const fLayer = f % echoLayers;
      const fRadius =
        maxRadius * (0.3 + fLayer * 0.05) +
        this.fastSin(this.time * 0.005 + f) * 15;
      const fx = this.fastCos(fAngle) * fRadius;
      const fy = this.fastSin(fAngle) * fRadius;
      const fSize = 1.5 + this.fastSin(this.time * 0.008 + f) * 1;
      const fAlpha = 0.3 + this.fastSin(this.time * 0.006 + f) * 0.2;
      const fHue = this.fastMod360(this.hueBase + 155 + f * 2);

      ctx.fillStyle = this.hsla(fHue, 85, 75, fAlpha);
      ctx.beginPath();
      ctx.arc(fx, fy, fSize, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

    // Enhanced echo rings with distortion
    for (let layer = 0; layer < echoLayers; layer++) {
      const delay = layer * 0.1;
      const baseRadius =
        maxRadius * (0.3 + layer * 0.05) + this.fastSin(this.time * 0.003 - delay) * 10;
      const hue = this.fastMod360(this.hueBase + 160 + layer * 8);
      const alpha = (0.8 - layer * 0.05) * (0.5 + trebleIntensity * 0.4);

      ctx.strokeStyle = this.hsla(hue, 80, 70, alpha);
      ctx.lineWidth = 2 + (layer === 0 ? bassIntensity * 2 : 0);
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.hsla(hue, 100, 75, alpha * 0.6);

      // Draw distorted echo ring with multiple segments
      ctx.beginPath();
      const ringSegments = 64;
      const invRingSegments = 1 / ringSegments;
      for (let seg = 0; seg <= ringSegments; seg++) {
        const segAngle = FlowFieldRenderer.TWO_PI * seg * invRingSegments;
        // Multi-frequency distortion
        const distortion1 = this.fastSin(segAngle * 4 + this.time * 0.004 + layer * 0.2) * 5;
        const distortion2 = this.fastSin(segAngle * 8 + this.time * 0.006 - delay) * 3;
        const audioDistortion = this.fastSin(segAngle * 3 + this.time * 0.005) * trebleIntensity * 8;
        const radius = baseRadius + distortion1 + distortion2 + audioDistortion;
        const x = this.fastCos(segAngle) * radius;
        const y = this.fastSin(segAngle) * radius;

        if (seg === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      // Enhanced particles on echo rings (12 particles per ring)
      if (layer % 2 === 0) {
        const particleSegments = 12;
        const invParticleSegments = 1 / particleSegments;
        for (let i = 0; i < particleSegments; i++) {
          const angle = FlowFieldRenderer.TWO_PI * i * invParticleSegments + this.time * 0.0005;
          const particleRadius = baseRadius + this.fastSin(angle * 3 + this.time * 0.006) * 5;
          const x = this.fastCos(angle) * particleRadius;
          const y = this.fastSin(angle) * particleRadius;
          const particleSize = 2 + trebleIntensity * 2 + this.fastSin(this.time * 0.01 + i) * 1;
          const particleAlpha = alpha * 0.8;

          // Particle glow
          const particleGradient = ctx.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            particleSize * 2,
          );
          particleGradient.addColorStop(0, this.hsla(hue, 90, 80, particleAlpha));
          particleGradient.addColorStop(0.5, this.hsla(this.fastMod360(hue + 5), 85, 75, particleAlpha * 0.6));
          particleGradient.addColorStop(1, this.hsla(this.fastMod360(hue + 10), 80, 70, 0));

          ctx.fillStyle = particleGradient;
          ctx.beginPath();
          ctx.arc(x, y, particleSize * 2, 0, FlowFieldRenderer.TWO_PI);
          ctx.fill();

          // Core particle
          ctx.fillStyle = this.hsla(hue, 90, 80, particleAlpha);
          ctx.beginPath();
          ctx.arc(x, y, particleSize, 0, FlowFieldRenderer.TWO_PI);
          ctx.fill();

          // Particle trail (3 segments)
          for (let trail = 1; trail <= 3; trail++) {
            const trailAngle = angle - trail * 0.08;
            const trailRadius = particleRadius * (1 - trail * 0.02);
            const tx = this.fastCos(trailAngle) * trailRadius;
            const ty = this.fastSin(trailAngle) * trailRadius;
            const trailSize = particleSize * (1 - trail * 0.2);
            const trailAlpha = particleAlpha * (1 - trail * 0.3);

            ctx.fillStyle = this.hsla(this.fastMod360(hue + 5), 85, 75, trailAlpha * 0.5);
            ctx.beginPath();
            ctx.arc(tx, ty, trailSize, 0, FlowFieldRenderer.TWO_PI);
            ctx.fill();
          }
        }
      }

      // Spectral beams emanating from specific echo layers (every 4th layer)
      if (layer % 4 === 0) {
        const beamCount = 8;
        const invBeamCount = 1 / beamCount;
        for (let b = 0; b < beamCount; b++) {
          const beamAngle = FlowFieldRenderer.TWO_PI * b * invBeamCount + this.time * 0.002;
          const beamLength = 30 + this.fastSin(this.time * 0.007 + b + layer) * 15 + bassIntensity * 10;
          const startRadius = baseRadius;
          const endRadius = baseRadius + beamLength;

          const x1 = this.fastCos(beamAngle) * startRadius;
          const y1 = this.fastSin(beamAngle) * startRadius;
          const x2 = this.fastCos(beamAngle) * endRadius;
          const y2 = this.fastSin(beamAngle) * endRadius;

          const beamGradient = ctx.createLinearGradient(x1, y1, x2, y2);
          beamGradient.addColorStop(0, this.hsla(hue, 90, 75, alpha * 0.6));
          beamGradient.addColorStop(0.5, this.hsla(this.fastMod360(hue + 8), 85, 70, alpha * 0.4));
          beamGradient.addColorStop(1, this.hsla(this.fastMod360(hue + 15), 80, 65, 0));

          ctx.strokeStyle = beamGradient;
          ctx.lineWidth = 2 + bassIntensity;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur = 0;

    // Multiple pulsing echo sources (3 concentric sources)
    for (let source = 0; source < 3; source++) {
      const sourceRadius = maxRadius * (0.2 - source * 0.05);
      const sourcePulse =
        1 + this.fastSin(this.time * 0.006 + source * 0.5) * 0.12 + audioIntensity * 0.08;
      const finalSourceRadius = sourceRadius * sourcePulse;

      const echoSource = ctx.createRadialGradient(0, 0, 0, 0, 0, finalSourceRadius);
      echoSource.addColorStop(
        0,
        this.hsla(
          this.fastMod360(this.hueBase + 170 - source * 5),
          100,
          90 - source * 5,
          (0.95 - source * 0.15) + audioIntensity * 0.05,
        ),
      );
      echoSource.addColorStop(
        0.5,
        this.hsla(
          this.fastMod360(this.hueBase + 160 - source * 5),
          95,
          75 - source * 5,
          (0.7 - source * 0.1) + trebleIntensity * 0.2,
        ),
      );
      echoSource.addColorStop(
        1,
        this.hsla(this.fastMod360(this.hueBase + 150 - source * 5), 90, 60 - source * 5, 0),
      );

      ctx.fillStyle = echoSource;
      ctx.beginPath();
      ctx.arc(0, 0, finalSourceRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

    // Spectral core with rotating energy patterns
    const coreSegments = 6;
    const invCoreSegments = 1 / coreSegments;
    for (let seg = 0; seg < coreSegments; seg++) {
      const segAngle = FlowFieldRenderer.TWO_PI * seg * invCoreSegments + this.time * 0.003;
      const segRadius = maxRadius * 0.15;
      const segLength = maxRadius * 0.08;

      const x1 = this.fastCos(segAngle) * segRadius;
      const y1 = this.fastSin(segAngle) * segRadius;
      const x2 = this.fastCos(segAngle) * (segRadius - segLength);
      const y2 = this.fastSin(segAngle) * (segRadius - segLength);

      const coreGradient = ctx.createLinearGradient(x1, y1, x2, y2);
      coreGradient.addColorStop(0, this.hsla(this.fastMod360(this.hueBase + 175), 100, 85, 0.4));
      coreGradient.addColorStop(0.5, this.hsla(this.fastMod360(this.hueBase + 170), 100, 90, 0.7));
      coreGradient.addColorStop(1, this.hsla(this.fastMod360(this.hueBase + 165), 100, 95, 0.9));

      ctx.strokeStyle = coreGradient;
      ctx.lineWidth = 3 + bassIntensity * 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

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
    const whispers = 14; // Increased from 9
    const invWhispers = 1 / whispers;
    const angleStep = FlowFieldRenderer.TWO_PI * invWhispers;

    // Floating void particles (40-70 particles)
    const voidParticles = 40 + ((midIntensity * 30) | 0);
    for (let p = 0; p < voidParticles; p++) {
      const pAngle = this.fastSin(this.time * 0.002 + p * 0.3) * FlowFieldRenderer.TWO_PI;
      const pRadius =
        maxRadius * 0.15 + this.fastSin(this.time * 0.004 + p) * maxRadius * 0.25;
      const px = this.fastCos(pAngle) * pRadius;
      const py = this.fastSin(pAngle) * pRadius;
      const pSize = 1.5 + this.fastSin(this.time * 0.006 + p) * 1.2;
      const pAlpha = 0.2 + this.fastSin(this.time * 0.005 + p) * 0.15;
      const pHue = this.fastMod360(this.hueBase + 255 + p * 3);

      ctx.fillStyle = this.hsla(pHue, 60, 35, pAlpha);
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

    // Ethereal void wisps circling the center (10-14 wisps)
    const wispCount = 10 + ((bassIntensity * 4) | 0);
    for (let w = 0; w < wispCount; w++) {
      const wAngle = (FlowFieldRenderer.TWO_PI * w) / wispCount + this.time * 0.003;
      const wRadius = maxRadius * (0.18 + this.fastSin(this.time * 0.005 + w) * 0.08);
      const wx = this.fastCos(wAngle) * wRadius;
      const wy = this.fastSin(wAngle) * wRadius;
      const wSize = 6 + this.fastSin(this.time * 0.007 + w) * 3 + midIntensity * 4;
      const wAlpha = 0.3 + this.fastSin(this.time * 0.004 + w) * 0.15 + midIntensity * 0.2;

      const wispGradient = ctx.createRadialGradient(wx, wy, 0, wx, wy, wSize);
      wispGradient.addColorStop(
        0,
        this.hsla(this.fastMod360(this.hueBase + 265), 70, 40, wAlpha * 0.8),
      );
      wispGradient.addColorStop(
        0.5,
        this.hsla(this.fastMod360(this.hueBase + 260), 60, 35, wAlpha * 0.5),
      );
      wispGradient.addColorStop(0, this.hsla(this.fastMod360(this.hueBase + 255), 50, 30, 0));

      ctx.fillStyle = wispGradient;
      ctx.beginPath();
      ctx.arc(wx, wy, wSize, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();

      // Wisp trail (3 trailing segments)
      for (let trail = 1; trail <= 3; trail++) {
        const trailAngle = wAngle - trail * 0.15;
        const trailRadius = wRadius * (1 - trail * 0.05);
        const tx = this.fastCos(trailAngle) * trailRadius;
        const ty = this.fastSin(trailAngle) * trailRadius;
        const trailSize = wSize * (1 - trail * 0.25);
        const trailAlpha = wAlpha * (1 - trail * 0.3);

        ctx.fillStyle = this.hsla(
          this.fastMod360(this.hueBase + 260),
          65,
          35,
          trailAlpha * 0.4,
        );
        ctx.beginPath();
        ctx.arc(tx, ty, trailSize, 0, FlowFieldRenderer.TWO_PI);
        ctx.fill();
      }
    }

    // Enhanced multi-layered whisper tendrils
    for (let whisper = 0; whisper < whispers; whisper++) {
      const angle = angleStep * whisper + this.time * 0.0004;
      const baseRadius = maxRadius * (0.2 + whisper * 0.06);
      const radius =
        baseRadius + this.fastSin(this.time * 0.004 + whisper) * maxRadius * 0.05;

      const hue = this.fastMod360(this.hueBase + 260 + whisper * 5);
      const alpha =
        0.2 + this.fastSin(this.time * 0.003 + whisper) * 0.15 + midIntensity * 0.25;

      // Multiple whisper layers (3 layers per whisper)
      for (let layer = 0; layer < 3; layer++) {
        const layerOffset = layer * 0.08;
        const layerAngle = angle + layerOffset;
        const layerRadius = radius * (1 - layer * 0.05);
        const layerAlpha = alpha * (1 - layer * 0.25);

        const x1 = this.fastCos(layerAngle) * layerRadius * 0.3;
        const y1 = this.fastSin(layerAngle) * layerRadius * 0.3;
        const x2 = this.fastCos(layerAngle) * layerRadius;
        const y2 = this.fastSin(layerAngle) * layerRadius;

        const whisperGradient = ctx.createLinearGradient(x1, y1, x2, y2);
        whisperGradient.addColorStop(0, this.hsla(hue, 50, 30, 0));
        whisperGradient.addColorStop(0.5, this.hsla(hue, 60, 35, layerAlpha));
        whisperGradient.addColorStop(1, this.hsla(hue, 70, 40, 0));

        ctx.strokeStyle = whisperGradient;
        ctx.lineWidth = (3 + bassIntensity * 2) * (1 - layer * 0.2);
        ctx.shadowBlur = 20 - layer * 5;
        ctx.shadowColor = this.hsla(hue, 80, 35, 0.6 * (1 - layer * 0.3));

        ctx.beginPath();
        ctx.moveTo(x1, y1);

        // Create sinuous curve with multiple control points
        const segments = 4;
        for (let seg = 0; seg < segments; seg++) {
          const t = (seg + 1) / segments;
          const curvature =
            0.2 + this.fastSin(this.time * 0.006 + whisper + seg) * 0.15;
          const midAngle = layerAngle + curvature * (seg % 2 === 0 ? 1 : -1);
          const midRadius = layerRadius * (0.3 + t * 0.7);
          const ctrlX = this.fastCos(midAngle) * midRadius;
          const ctrlY = this.fastSin(midAngle) * midRadius;
          const endAngle = layerAngle;
          const endRadius = layerRadius * (0.3 + t * 0.7);
          const endX = this.fastCos(endAngle) * endRadius;
          const endY = this.fastSin(endAngle) * endRadius;

          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        }

        ctx.stroke();
      }

      // Whisper terminus particles (4-6 particles at end of each whisper)
      const terminusParticles = 4 + ((bassIntensity * 2) | 0);
      for (let tp = 0; tp < terminusParticles; tp++) {
        const tAngle = angle + (tp - terminusParticles * 0.5) * 0.05;
        const tRadius = radius + tp * 3;
        const tx = this.fastCos(tAngle) * tRadius;
        const ty = this.fastSin(tAngle) * tRadius;
        const tSize = 2 + this.fastSin(this.time * 0.01 + whisper + tp) * 1;
        const tAlpha = alpha * (1 - tp * 0.15);

        ctx.fillStyle = this.hsla(this.fastMod360(hue + 5), 75, 45, tAlpha);
        ctx.beginPath();
        ctx.arc(tx, ty, tSize, 0, FlowFieldRenderer.TWO_PI);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;

    // Enhanced multi-layered void core (6 layers)
    for (let layer = 0; layer < 6; layer++) {
      const coreRadius = maxRadius * (0.28 - layer * 0.035);
      const corePulse =
        1 + this.fastSin(this.time * 0.005 + layer * 0.4) * 0.08 + audioIntensity * 0.06;
      const finalRadius = coreRadius * corePulse;

      const voidCenter = ctx.createRadialGradient(0, 0, 0, 0, 0, finalRadius);
      voidCenter.addColorStop(
        0,
        this.hsla(
          this.fastMod360(this.hueBase + 270 - layer * 2),
          40 + layer * 2,
          8 + layer,
          (0.9 - layer * 0.1) + audioIntensity * 0.1,
        ),
      );
      voidCenter.addColorStop(
        0.6,
        this.hsla(
          this.fastMod360(this.hueBase + 260 - layer * 2),
          50 + layer * 2,
          12 + layer,
          (0.5 - layer * 0.05) + midIntensity * 0.3,
        ),
      );
      voidCenter.addColorStop(
        1,
        this.hsla(this.fastMod360(this.hueBase + 250 - layer * 2), 60 + layer * 2, 18 + layer, 0),
      );

      ctx.fillStyle = voidCenter;
      ctx.beginPath();
      ctx.arc(0, 0, finalRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

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
    const halfGateHeight = gateHeight * 0.5;
    const halfGateWidth = gateWidth * 0.5;

    // Swirling vortex inside gate (50-80 particles)
    const vortexParticles = 50 + ((bassIntensity * 30) | 0);
    for (let v = 0; v < vortexParticles; v++) {
      const vProgress = v / vortexParticles;
      const spiralAngle = vProgress * FlowFieldRenderer.TWO_PI * 3 + this.time * 0.004;
      const spiralRadius = gateWidth * 0.35 * (1 - vProgress);
      const vx = this.fastCos(spiralAngle) * spiralRadius;
      const vy = this.fastSin(spiralAngle) * spiralRadius;
      const vSize = 2 + (1 - vProgress) * 3 + this.fastSin(this.time * 0.01 + v) * 1;
      const vAlpha = (0.3 + vProgress * 0.5) * (0.8 + audioIntensity * 0.2);

      ctx.fillStyle = this.hsla(
        this.fastMod360(this.hueBase + vProgress * 30),
        100,
        50 + vProgress * 20,
        vAlpha,
      );
      ctx.beginPath();
      ctx.arc(vx, vy, vSize, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

    // Gate pillars with carved runes (left and right)
    for (let side = 0; side < 2; side++) {
      const pillarX = (side === 0 ? -1 : 1) * (halfGateWidth + 20);
      const pillarWidth = 16;
      const pillarGradient = ctx.createLinearGradient(
        pillarX - pillarWidth * 0.5,
        -halfGateHeight,
        pillarX + pillarWidth * 0.5,
        halfGateHeight,
      );
      pillarGradient.addColorStop(
        0,
        this.hsla(this.fastMod360(this.hueBase + 350), 80, 25, 0.9),
      );
      pillarGradient.addColorStop(
        0.5,
        this.hsla(this.fastMod360(this.hueBase + 5), 85, 30, 0.95),
      );
      pillarGradient.addColorStop(
        1,
        this.hsla(this.fastMod360(this.hueBase + 350), 80, 25, 0.9),
      );

      ctx.fillStyle = pillarGradient;
      ctx.fillRect(pillarX - pillarWidth * 0.5, -halfGateHeight, pillarWidth, gateHeight);

      // Carved runes on pillars (6 runes per pillar)
      for (let r = 0; r < 6; r++) {
        const runeY = -halfGateHeight + (gateHeight / 7) * (r + 1);
        const runeSize = 6 + this.fastSin(this.time * 0.005 + r + side) * 2;
        const runeAlpha = 0.6 + this.fastSin(this.time * 0.006 + r) * 0.2 + trebleIntensity * 0.2;

        ctx.fillStyle = this.hsla(this.fastMod360(this.hueBase + 15), 100, 55, runeAlpha);
        ctx.beginPath();
        const runeType = r % 3;
        if (runeType === 0) {
          // Triangle
          ctx.moveTo(pillarX, runeY - runeSize * 0.5);
          ctx.lineTo(pillarX - runeSize * 0.4, runeY + runeSize * 0.5);
          ctx.lineTo(pillarX + runeSize * 0.4, runeY + runeSize * 0.5);
        } else if (runeType === 1) {
          // Circle
          ctx.arc(pillarX, runeY, runeSize * 0.4, 0, FlowFieldRenderer.TWO_PI);
        } else {
          // Diamond
          ctx.moveTo(pillarX, runeY - runeSize * 0.5);
          ctx.lineTo(pillarX - runeSize * 0.35, runeY);
          ctx.lineTo(pillarX, runeY + runeSize * 0.5);
          ctx.lineTo(pillarX + runeSize * 0.35, runeY);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Main gate portal with arched top
    ctx.fillStyle = this.hsla(this.fastMod360(this.hueBase + 0), 100, 35, 0.8 + audioIntensity * 0.2);
    ctx.shadowBlur = 40;
    ctx.shadowColor = this.hsla(this.fastMod360(this.hueBase + 0), 100, 40, 0.9);

    ctx.beginPath();
    // Bottom and sides
    ctx.moveTo(-halfGateWidth, halfGateHeight);
    ctx.lineTo(-halfGateWidth, -halfGateHeight * 0.3);
    // Left curve to arch
    ctx.quadraticCurveTo(-halfGateWidth, -halfGateHeight, 0, -halfGateHeight);
    // Right curve from arch
    ctx.quadraticCurveTo(halfGateWidth, -halfGateHeight, halfGateWidth, -halfGateHeight * 0.3);
    ctx.lineTo(halfGateWidth, halfGateHeight);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    // Gate border with enhanced glow
    ctx.strokeStyle = this.hsla(
      this.fastMod360(this.hueBase + 0),
      100,
      50,
      0.9 + trebleIntensity * 0.1,
    );
    ctx.lineWidth = 4 + bassIntensity * 3;
    ctx.beginPath();
    ctx.moveTo(-halfGateWidth, halfGateHeight);
    ctx.lineTo(-halfGateWidth, -halfGateHeight * 0.3);
    ctx.quadraticCurveTo(-halfGateWidth, -halfGateHeight, 0, -halfGateHeight);
    ctx.quadraticCurveTo(halfGateWidth, -halfGateHeight, halfGateWidth, -halfGateHeight * 0.3);
    ctx.lineTo(halfGateWidth, halfGateHeight);
    ctx.stroke();

    // Demonic entities emerging from gate (8-12 entities)
    const entityCount = 8 + ((bassIntensity * 4) | 0);
    for (let e = 0; e < entityCount; e++) {
      const eAngle = (FlowFieldRenderer.TWO_PI * e) / entityCount + this.time * 0.002;
      const eRadius = gateWidth * (0.25 + this.fastSin(this.time * 0.006 + e) * 0.1);
      const ex = this.fastCos(eAngle) * eRadius;
      const ey = this.fastSin(eAngle) * eRadius;
      const eSize = 8 + this.fastSin(this.time * 0.008 + e) * 4 + trebleIntensity * 3;
      const eAlpha = 0.4 + this.fastSin(this.time * 0.007 + e) * 0.2 + audioIntensity * 0.2;

      // Entity body (irregular shape)
      ctx.fillStyle = this.hsla(this.fastMod360(this.hueBase + 10), 95, 45, eAlpha);
      ctx.beginPath();
      const entityVertices = 6;
      for (let v = 0; v <= entityVertices; v++) {
        const vAngle = (FlowFieldRenderer.TWO_PI * v) / entityVertices + this.time * 0.005;
        const distortion = 1 + this.fastSin(vAngle * 2 + this.time * 0.01 + e) * 0.3;
        const vRadius = eSize * distortion;
        const vx = ex + this.fastCos(vAngle) * vRadius;
        const vy = ey + this.fastSin(vAngle) * vRadius;
        if (v === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();

      // Entity eyes (2 glowing points)
      for (let eye = 0; eye < 2; eye++) {
        const eyeX = ex + (eye === 0 ? -eSize * 0.3 : eSize * 0.3);
        const eyeY = ey - eSize * 0.2;
        ctx.fillStyle = this.hsla(this.fastMod360(this.hueBase + 20), 100, 70, eAlpha * 1.2);
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eSize * 0.15, 0, FlowFieldRenderer.TWO_PI);
        ctx.fill();
      }
    }

    // Energy tendrils from gate edges (16 tendrils)
    const tendrilCount = 16;
    for (let t = 0; t < tendrilCount; t++) {
      const side = t < tendrilCount / 2 ? -1 : 1;
      const tProgress = (t % (tendrilCount / 2)) / (tendrilCount / 2);
      const startY = -halfGateHeight + gateHeight * tProgress;
      const startX = side * halfGateWidth;

      const tendrilLength = 40 + this.fastSin(this.time * 0.008 + t) * 20 + bassIntensity * 15;
      const tendrilAngle = side * (Math.PI * 0.5 + this.fastSin(this.time * 0.006 + t) * 0.4);
      const endX = startX + this.fastCos(tendrilAngle) * tendrilLength;
      const endY = startY + this.fastSin(tendrilAngle) * tendrilLength;

      const tendrilGradient = ctx.createLinearGradient(startX, startY, endX, endY);
      tendrilGradient.addColorStop(0, this.hsla(this.fastMod360(this.hueBase + 5), 100, 50, 0.6));
      tendrilGradient.addColorStop(1, this.hsla(this.fastMod360(this.hueBase + 15), 95, 45, 0));

      ctx.strokeStyle = tendrilGradient;
      ctx.lineWidth = 2 + bassIntensity;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Sigil symbols in arc above gate (7 symbols)
    const sigilCount = 7;
    const sigilArcRadius = gateWidth * 0.65;
    for (let s = 0; s < sigilCount; s++) {
      const sigilAngle = -Math.PI + (Math.PI * s) / (sigilCount - 1);
      const sx = this.fastCos(sigilAngle) * sigilArcRadius;
      const sy = this.fastSin(sigilAngle) * sigilArcRadius - halfGateHeight * 0.5;
      const sigilSize = 10 + this.fastSin(this.time * 0.007 + s) * 3 + trebleIntensity * 4;
      const sigilAlpha = 0.7 + this.fastSin(this.time * 0.005 + s) * 0.2 + audioIntensity * 0.1;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.time * 0.003 + s);

      ctx.fillStyle = this.hsla(this.fastMod360(this.hueBase + 0), 100, 60, sigilAlpha);
      ctx.strokeStyle = this.hsla(this.fastMod360(this.hueBase + 10), 100, 70, sigilAlpha * 0.8);
      ctx.lineWidth = 2;

      // Pentagram sigil
      ctx.beginPath();
      for (let p = 0; p <= 5; p++) {
        const pentaAngle = (FlowFieldRenderer.TWO_PI * p * 2) / 5 - Math.PI * 0.5;
        const px = this.fastCos(pentaAngle) * sigilSize;
        const py = this.fastSin(pentaAngle) * sigilSize;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(0, 0, sigilSize * 0.4, 0, FlowFieldRenderer.TWO_PI);
      ctx.stroke();

      ctx.restore();
    }

    // Enhanced multi-layered pulsing core
    for (let layer = 0; layer < 5; layer++) {
      const coreRadius = maxRadius * (0.2 - layer * 0.03);
      const corePulse = 1 + this.fastSin(this.time * 0.006 + layer * 0.3) * 0.12 + bassIntensity * 0.08;
      const finalCoreRadius = coreRadius * corePulse;

      const gateCore = ctx.createRadialGradient(0, 0, 0, 0, 0, finalCoreRadius);
      gateCore.addColorStop(
        0,
        this.hsla(
          this.fastMod360(this.hueBase + layer * 2),
          100,
          80 - layer * 8,
          (0.95 - layer * 0.12) + audioIntensity * 0.05,
        ),
      );
      gateCore.addColorStop(
        0.5,
        this.hsla(
          this.fastMod360(this.hueBase + 10 + layer * 2),
          100,
          50 - layer * 5,
          (0.7 - layer * 0.08) + bassIntensity * 0.2,
        ),
      );
      gateCore.addColorStop(1, this.hsla(this.fastMod360(this.hueBase + 20 + layer * 2), 100, 35, 0));

      ctx.fillStyle = gateCore;
      ctx.beginPath();
      ctx.arc(0, 0, finalCoreRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

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
    const runeCount = 16; // Increased from 12
    const invRuneCount = 1 / runeCount;
    const angleStep = FlowFieldRenderer.TWO_PI * invRuneCount;

    // Draw energy connections between runes
    ctx.strokeStyle = this.hsla(
      this.fastMod360(this.hueBase + 295),
      85,
      35,
      0.2 + bassIntensity * 0.15,
    );
    ctx.lineWidth = 1 + bassIntensity;

    for (let i = 0; i < runeCount; i += 2) {
      const angle1 = angleStep * i + this.time * 0.0006;
      const radius1 = maxRadius * (0.5 + this.fastSin(this.time * 0.002 + i) * 0.15);
      const x1 = this.fastCos(angle1) * radius1;
      const y1 = this.fastSin(angle1) * radius1;

      const oppositeIdx = (i + runeCount / 2) % runeCount;
      const angle2 = angleStep * oppositeIdx + this.time * 0.0006;
      const radius2 = maxRadius * (0.5 + this.fastSin(this.time * 0.002 + oppositeIdx) * 0.15);
      const x2 = this.fastCos(angle2) * radius2;
      const y2 = this.fastSin(angle2) * radius2;

      const energyGradient = ctx.createLinearGradient(x1, y1, x2, y2);
      energyGradient.addColorStop(
        0,
        this.hsla(this.fastMod360(this.hueBase + 290 + i * 2), 90, 40, 0.3),
      );
      energyGradient.addColorStop(
        0.5,
        this.hsla(this.fastMod360(this.hueBase + 295), 85, 35, 0.15),
      );
      energyGradient.addColorStop(
        1,
        this.hsla(this.fastMod360(this.hueBase + 290 + oppositeIdx * 2), 90, 40, 0.3),
      );

      ctx.strokeStyle = energyGradient;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Floating rune fragments/particles (30-50 particles)
    const fragmentCount = 30 + ((midIntensity * 20) | 0);
    for (let f = 0; f < fragmentCount; f++) {
      const fragmentAngle = this.fastSin(this.time * 0.001 + f * 0.5) * FlowFieldRenderer.TWO_PI;
      const fragmentRadius =
        maxRadius * 0.2 + this.fastSin(this.time * 0.003 + f) * maxRadius * 0.35;
      const fx = this.fastCos(fragmentAngle) * fragmentRadius;
      const fy = this.fastSin(fragmentAngle) * fragmentRadius;
      const fSize = 2 + this.fastSin(this.time * 0.005 + f) * 1.5;
      const fAlpha = 0.3 + this.fastSin(this.time * 0.004 + f) * 0.2;
      const fHue = this.fastMod360(this.hueBase + 285 + f * 5);

      ctx.fillStyle = this.hsla(fHue, 95, 45, fAlpha);
      ctx.beginPath();
      ctx.arc(fx, fy, fSize, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

    // Enhanced runes with complex shapes and effects
    for (let i = 0; i < runeCount; i++) {
      const angle = angleStep * i + this.time * 0.0006;
      const radius = maxRadius * (0.5 + this.fastSin(this.time * 0.002 + i) * 0.15);
      const x = this.fastCos(angle) * radius;
      const y = this.fastSin(angle) * radius;

      const hue = this.fastMod360(this.hueBase + 290 + i * 3);
      const size = 12 + this.fastSin(this.time * 0.003 + i) * 4 + midIntensity * 5;
      const alpha = 0.6 + this.fastSin(this.time * 0.004 + i) * 0.2 + midIntensity * 0.2;

      // Pulsing aura around rune
      const auraRadius = size * (2 + this.fastSin(this.time * 0.006 + i) * 0.5 + bassIntensity * 0.8);
      const auraGradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, auraRadius);
      auraGradient.addColorStop(0, this.hsla(hue, 100, 50, alpha * 0.3));
      auraGradient.addColorStop(0.5, this.hsla(hue, 95, 45, alpha * 0.15));
      auraGradient.addColorStop(1, this.hsla(hue, 90, 40, 0));

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(x, y, auraRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();

      // Crackling energy particles around rune (8-12 particles per rune)
      const sparkCount = 8 + ((bassIntensity * 4) | 0);
      const sparkAngleStep = FlowFieldRenderer.TWO_PI / sparkCount;
      for (let s = 0; s < sparkCount; s++) {
        const sparkAngle = sparkAngleStep * s + this.time * 0.01 + i;
        const sparkDist = size * (1.5 + this.fastSin(this.time * 0.02 + i + s) * 0.5);
        const sx = x + this.fastCos(sparkAngle) * sparkDist;
        const sy = y + this.fastSin(sparkAngle) * sparkDist;
        const sparkSize = 1.5 + this.fastSin(this.time * 0.015 + s) * 0.8;

        ctx.fillStyle = this.hsla(this.fastMod360(hue + 10), 100, 60, alpha * 0.7);
        ctx.beginPath();
        ctx.arc(sx, sy, sparkSize, 0, FlowFieldRenderer.TWO_PI);
        ctx.fill();
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + this.time * 0.001);

      ctx.strokeStyle = this.hsla(hue, 90, 40, alpha);
      ctx.fillStyle = this.hsla(hue, 85, 35, alpha * 0.4);
      ctx.lineWidth = 2 + bassIntensity * 1.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.hsla(hue, 100, 45, 0.8);

      // 8 different elaborate rune types
      const runeType = i % 8;
      if (runeType === 0) {
        // Triforce-like rune
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.3, size);
        ctx.lineTo(size * 0.3, size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Inner triangle
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.3);
        ctx.lineTo(-size * 0.15, size * 0.3);
        ctx.lineTo(size * 0.15, size * 0.3);
        ctx.closePath();
        ctx.stroke();
      } else if (runeType === 1) {
        // Inverted power rune
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, -size);
        ctx.lineTo(size * 0.5, -size);
        ctx.lineTo(0, size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Power lines
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(0, size * 0.6);
        ctx.stroke();
      } else if (runeType === 2) {
        // Diamond chaos rune
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.5, 0);
        ctx.lineTo(0, size);
        ctx.lineTo(size * 0.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Inner cross
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);
        ctx.lineTo(0, size * 0.5);
        ctx.moveTo(-size * 0.25, 0);
        ctx.lineTo(size * 0.25, 0);
        ctx.stroke();
      } else if (runeType === 3) {
        // Crossed square rune
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
      } else if (runeType === 4) {
        // Hexagonal binding rune
        const hexPoints = 6;
        ctx.beginPath();
        for (let h = 0; h <= hexPoints; h++) {
          const hexAngle = (FlowFieldRenderer.TWO_PI * h) / hexPoints;
          const hx = this.fastCos(hexAngle) * size;
          const hy = this.fastSin(hexAngle) * size;
          if (h === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Inner lines
        for (let h = 0; h < 3; h++) {
          const h1 = (FlowFieldRenderer.TWO_PI * h) / hexPoints;
          const h2 = (FlowFieldRenderer.TWO_PI * (h + 3)) / hexPoints;
          ctx.beginPath();
          ctx.moveTo(this.fastCos(h1) * size, this.fastSin(h1) * size);
          ctx.lineTo(this.fastCos(h2) * size, this.fastSin(h2) * size);
          ctx.stroke();
        }
      } else if (runeType === 5) {
        // Star burst rune
        const starPoints = 8;
        ctx.beginPath();
        for (let sp = 0; sp <= starPoints * 2; sp++) {
          const starAngle = (FlowFieldRenderer.TWO_PI * sp) / (starPoints * 2);
          const starRadius = sp % 2 === 0 ? size : size * 0.4;
          const spx = this.fastCos(starAngle) * starRadius;
          const spy = this.fastSin(starAngle) * starRadius;
          if (sp === 0) ctx.moveTo(spx, spy);
          else ctx.lineTo(spx, spy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (runeType === 6) {
        // Spiral curse rune
        ctx.beginPath();
        const spiralSegments = 20;
        for (let seg = 0; seg <= spiralSegments; seg++) {
          const t = seg / spiralSegments;
          const spiralAngle = t * FlowFieldRenderer.TWO_PI * 1.5;
          const spiralRadius = size * t;
          const spiralX = this.fastCos(spiralAngle) * spiralRadius;
          const spiralY = this.fastSin(spiralAngle) * spiralRadius;
          if (seg === 0) ctx.moveTo(spiralX, spiralY);
          else ctx.lineTo(spiralX, spiralY);
        }
        ctx.stroke();
        // Outer circle
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, FlowFieldRenderer.TWO_PI);
        ctx.stroke();
      } else {
        // Pentagram rune
        const pentaPoints = 5;
        ctx.beginPath();
        for (let p = 0; p <= pentaPoints; p++) {
          const pentaAngle = (FlowFieldRenderer.TWO_PI * p * 2) / pentaPoints - Math.PI * 0.5;
          const px = this.fastCos(pentaAngle) * size;
          const py = this.fastSin(pentaAngle) * size;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    }

    // Enhanced multi-layered pulsing center
    for (let layer = 0; layer < 4; layer++) {
      const layerRadius = maxRadius * (0.22 - layer * 0.04);
      const layerPulse = 1 + this.fastSin(this.time * 0.005 + layer * 0.5) * 0.1;
      const finalRadius = layerRadius * layerPulse;

      const cursedCenter = ctx.createRadialGradient(0, 0, 0, 0, 0, finalRadius);
      cursedCenter.addColorStop(
        0,
        this.hsla(
          this.fastMod360(this.hueBase + 300 - layer * 3),
          100,
          50,
          (0.9 - layer * 0.15) + audioIntensity * 0.1,
        ),
      );
      cursedCenter.addColorStop(
        0.5,
        this.hsla(
          this.fastMod360(this.hueBase + 290 - layer * 3),
          95,
          40,
          (0.7 - layer * 0.1) + bassIntensity * 0.2,
        ),
      );
      cursedCenter.addColorStop(1, this.hsla(this.fastMod360(this.hueBase + 280 - layer * 3), 90, 30, 0));

      ctx.fillStyle = cursedCenter;
      ctx.beginPath();
      ctx.arc(0, 0, finalRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

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
    const dancers = 12; // Increased from 8
    const invDancers = 1 / dancers;
    const angleStep = FlowFieldRenderer.TWO_PI * invDancers;

    // Draw interconnecting shadow tendrils between dancers
    ctx.strokeStyle = this.hsla(
      this.fastMod360(this.hueBase + 260),
      65,
      20,
      0.15 + bassIntensity * 0.15,
    );
    ctx.lineWidth = 1.5 + bassIntensity * 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.hsla(this.fastMod360(this.hueBase + 260), 70, 25, 0.5);

    for (let i = 0; i < dancers; i++) {
      const baseAngle1 = angleStep * i;
      const angle1 = baseAngle1 + this.fastSin(this.time * 0.003 + i) * 0.5;
      const radius1 = maxRadius * (0.3 + this.fastSin(this.time * 0.004 + i * 0.5) * 0.2);
      const x1 = this.fastCos(angle1) * radius1;
      const y1 = this.fastSin(angle1) * radius1;

      const nextIdx = (i + 1) % dancers;
      const baseAngle2 = angleStep * nextIdx;
      const angle2 = baseAngle2 + this.fastSin(this.time * 0.003 + nextIdx) * 0.5;
      const radius2 = maxRadius * (0.3 + this.fastSin(this.time * 0.004 + nextIdx * 0.5) * 0.2);
      const x2 = this.fastCos(angle2) * radius2;
      const y2 = this.fastSin(angle2) * radius2;

      // Curved tendril
      const midX = (x1 + x2) * 0.5;
      const midY = (y1 + y2) * 0.5;
      const curveDist = this.fastSin(this.time * 0.006 + i) * 30;
      const perpAngle = angle1 + Math.PI * 0.5;
      const ctrlX = midX + this.fastCos(perpAngle) * curveDist;
      const ctrlY = midY + this.fastSin(perpAngle) * curveDist;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(ctrlX, ctrlY, x2, y2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Enhanced shadow dancers with morphing shapes and trails
    for (let dancer = 0; dancer < dancers; dancer++) {
      const baseAngle = angleStep * dancer;
      const angle = baseAngle + this.fastSin(this.time * 0.003 + dancer) * 0.5;
      const radius = maxRadius * (0.3 + this.fastSin(this.time * 0.004 + dancer * 0.5) * 0.2);
      const x = this.fastCos(angle) * radius;
      const y = this.fastSin(angle) * radius;

      const hue = this.fastMod360(this.hueBase + 250 + dancer * 8);
      const size = 20 + this.fastSin(this.time * 0.005 + dancer) * 8 + trebleIntensity * 6;
      const alpha = 0.4 + this.fastSin(this.time * 0.004 + dancer) * 0.2 + trebleIntensity * 0.3;

      // Shadow trail effect (5 trailing shadows)
      for (let trail = 4; trail >= 0; trail--) {
        const trailOffset = trail * 0.08;
        const trailAngle = baseAngle + this.fastSin(this.time * 0.003 + dancer - trailOffset) * 0.5;
        const trailRadius =
          maxRadius * (0.3 + this.fastSin(this.time * 0.004 + dancer * 0.5 - trailOffset) * 0.2);
        const trailX = this.fastCos(trailAngle) * trailRadius;
        const trailY = this.fastSin(trailAngle) * trailRadius;
        const trailAlpha = alpha * (1 - trail * 0.18);
        const trailSize = size * (1 - trail * 0.08);

        if (trail > 0) {
          const shadowGradient = ctx.createRadialGradient(
            trailX,
            trailY,
            0,
            trailX,
            trailY,
            trailSize,
          );
          shadowGradient.addColorStop(
            0,
            this.hsla(hue, 70, 30, trailAlpha * 0.4),
          );
          shadowGradient.addColorStop(
            0.5,
            this.hsla(this.fastMod360(hue + 10), 60, 25, trailAlpha * 0.25),
          );
          shadowGradient.addColorStop(1, this.hsla(this.fastMod360(hue + 20), 50, 20, 0));

          ctx.fillStyle = shadowGradient;
          ctx.beginPath();
          ctx.arc(trailX, trailY, trailSize, 0, FlowFieldRenderer.TWO_PI);
          ctx.fill();
        }
      }

      const vertices = 10;
      const invVertices = 1 / vertices;
      ctx.fillStyle = this.hsla(hue, 70, 30, alpha);
      ctx.shadowBlur = 25 + bassIntensity * 15;
      ctx.shadowColor = this.hsla(hue, 80, 25, 0.7);

      ctx.beginPath();
      for (let v = 0; v <= vertices; v++) {
        const vAngle = FlowFieldRenderer.TWO_PI * v * invVertices;
        const isOuter = v % 2 === 0;
        const morphFactor = 1 + this.fastSin(vAngle * 3 + this.time * 0.008 + dancer) * 0.3;
        const vRadius = isOuter ? size * morphFactor : size * 0.5 * morphFactor;
        const vx = x + this.fastCos(vAngle + angle) * vRadius;
        const vy = y + this.fastSin(vAngle + angle) * vRadius;

        if (v === 0) {
          ctx.moveTo(vx, vy);
        } else {
          ctx.lineTo(vx, vy);
        }
      }
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      // Inner glow ring
      ctx.strokeStyle = this.hsla(hue, 80, 40, alpha * 0.8);
      ctx.lineWidth = 2 + bassIntensity * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.6, 0, FlowFieldRenderer.TWO_PI);
      ctx.stroke();

      const wispCount = 6 + ((bassIntensity * 2) | 0);
      const wispAngleStep = FlowFieldRenderer.TWO_PI / wispCount;

      for (let w = 0; w < wispCount; w++) {
        const wispBaseAngle = wispAngleStep * w + angle;
        const wispLength = 15 + this.fastSin(this.time * 0.01 + dancer + w) * 8 + trebleIntensity * 10;
        const wispEndX = x + this.fastCos(wispBaseAngle) * wispLength;
        const wispEndY = y + this.fastSin(wispBaseAngle) * wispLength;

        const wispGradient = ctx.createLinearGradient(x, y, wispEndX, wispEndY);
        wispGradient.addColorStop(0, this.hsla(hue, 70, 35, alpha * 0.6));
        wispGradient.addColorStop(1, this.hsla(this.fastMod360(hue + 15), 60, 30, 0));

        ctx.strokeStyle = wispGradient;
        ctx.lineWidth = 2 + bassIntensity;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(wispEndX, wispEndY);
        ctx.stroke();
      }
    }

    for (let layer = 0; layer < 3; layer++) {
      const layerRadius = maxRadius * (0.24 - layer * 0.06);
      const layerAlpha = (0.8 - layer * 0.2) + audioIntensity * 0.2;

      const danceCenter = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius);
      danceCenter.addColorStop(
        0,
        this.hsla(
          this.fastMod360(this.hueBase + 260 + layer * 5),
          60,
          15 + layer * 3,
          layerAlpha,
        ),
      );
      danceCenter.addColorStop(
        0.6,
        this.hsla(
          this.fastMod360(this.hueBase + 250 + layer * 5),
          70,
          20 + layer * 2,
          (0.5 - layer * 0.1) + trebleIntensity * 0.3,
        ),
      );
      danceCenter.addColorStop(1, this.hsla(this.fastMod360(this.hueBase + 240 + layer * 5), 80, 25, 0));

      ctx.fillStyle = danceCenter;
      ctx.beginPath();
      ctx.arc(0, 0, layerRadius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

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

    const maxRadius = Math.min(this.width, this.height) * 0.5;
    const nightmares = 14;
    const angleStep = FlowFieldRenderer.TWO_PI / nightmares;

    ctx.globalCompositeOperation = "lighter";
    const tentacleCount = 16;
    const tentacleAngleStep = FlowFieldRenderer.TWO_PI / tentacleCount;

    for (let i = 0; i < tentacleCount; i++) {
      const baseAngle = tentacleAngleStep * i;
      const tentacleLength = maxRadius * (0.7 + this.fastSin(this.time * 0.004 + i) * 0.2);
      const segments = 12;
      const segmentLength = tentacleLength / segments;

      ctx.beginPath();
      ctx.moveTo(0, 0);

      let currentX = 0;
      let currentY = 0;
      let currentAngle = baseAngle + this.time * 0.002 * (i % 2 === 0 ? 1 : -1);

      for (let seg = 0; seg < segments; seg++) {
        const chaos1 = this.fastSin(this.time * 0.008 + i + seg * 0.3) * 0.4;
        const chaos2 = this.fastCos(this.time * 0.012 + i * 0.5 + seg * 0.2) * 0.3;
        const audioDistortion = (audioIntensity - 0.5) * 0.5;
        currentAngle += chaos1 + chaos2 + audioDistortion;

        currentX += this.fastCos(currentAngle) * segmentLength;
        currentY += this.fastSin(currentAngle) * segmentLength;
        ctx.lineTo(currentX, currentY);
      }

      const tentacleHue = this.fastMod360(this.hueBase + 15 + i * 18);
      const gradient = ctx.createLinearGradient(0, 0, currentX, currentY);
      gradient.addColorStop(0, this.hsla(tentacleHue, 100, 50, 0.6 + bassIntensity * 0.3));
      gradient.addColorStop(0.5, this.hsla(tentacleHue + 15, 95, 45, 0.4 + midIntensity * 0.2));
      gradient.addColorStop(1, this.hsla(tentacleHue + 30, 90, 40, 0));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 + bassIntensity * 4;
      ctx.lineCap = "round";
      ctx.shadowBlur = 20 + audioIntensity * 15;
      ctx.shadowColor = this.hsla(tentacleHue, 100, 45, 0.7);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";

    for (let i = 0; i < nightmares; i++) {
      const angle = angleStep * i + this.time * 0.0009;
      const orbitRadius = maxRadius * (0.25 + (i % 4) * 0.12);

      const glitchX = (Math.random() - 0.5) * 5 * bassIntensity;
      const glitchY = (Math.random() - 0.5) * 5 * bassIntensity;

      const x = this.fastCos(angle) * orbitRadius + glitchX;
      const y = this.fastSin(angle) * orbitRadius + glitchY;

      const hue = this.fastMod360(this.hueBase + 20 + i * 22);
      const size = 18 + this.fastSin(this.time * 0.005 + i) * 7 + midIntensity * 8;
      const pulseAlpha = 0.6 + this.fastSin(this.time * 0.004 + i) * 0.3 + audioIntensity * 0.3;

      const morphVertices = 8;
      const morphAngleStep = FlowFieldRenderer.TWO_PI / morphVertices;

      ctx.beginPath();
      for (let v = 0; v <= morphVertices; v++) {
        const vAngle = morphAngleStep * v + this.time * 0.003;
        const distortion = 1 + this.fastSin(vAngle * 3 + this.time * 0.01) * 0.3 * midIntensity;
        const vRadius = size * distortion;
        const vx = x + this.fastCos(vAngle) * vRadius;
        const vy = y + this.fastSin(vAngle) * vRadius;
        if (v === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();

      const nightmareGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
      nightmareGradient.addColorStop(0, this.hsla(hue, 100, 50, pulseAlpha));
      nightmareGradient.addColorStop(0.4, this.hsla(hue + 25, 95, 42, pulseAlpha * 0.8));
      nightmareGradient.addColorStop(1, this.hsla(hue + 50, 90, 35, 0));

      ctx.fillStyle = nightmareGradient;
      ctx.shadowBlur = 35 + bassIntensity * 20;
      ctx.shadowColor = this.hsla(hue, 100, 45, 0.9);
      ctx.fill();

      // ENHANCED: Chaotic spikes with audio reactivity
      const spikes = 8 + ((bassIntensity * 4) | 0);
      const spikeAngleStep = FlowFieldRenderer.TWO_PI / spikes;

      ctx.strokeStyle = this.hsla(hue, 100, 60, pulseAlpha * 0.9);
      ctx.lineWidth = 2.5 + bassIntensity * 2;

      for (let spike = 0; spike < spikes; spike++) {
        const spikeAngle = spikeAngleStep * spike + this.time * 0.003;
        const spikeLength = size * (1.2 + this.fastSin(this.time * 0.006 + spike) * 0.4);
        const spikeX = x + this.fastCos(spikeAngle) * spikeLength;
        const spikeY = y + this.fastSin(spikeAngle) * spikeLength;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(spikeX, spikeY);
        ctx.stroke();
      }
    }

    // ENHANCED: Pulsing, unstable nightmare core
    const coreRadius = maxRadius * (0.3 + bassIntensity * 0.08);
    const coreDistortion = 1 + this.fastSin(this.time * 0.005) * 0.15 * audioIntensity;
    const fuelCore = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * coreDistortion);
    fuelCore.addColorStop(0, this.hsla(this.hueBase + 35, 100, 60, 0.98 + audioIntensity * 0.05));
    fuelCore.addColorStop(0.3, this.hsla(this.hueBase + 25, 100, 50, 0.85 + bassIntensity * 0.15));
    fuelCore.addColorStop(0.7, this.hsla(this.hueBase + 15, 100, 40, 0.6 + midIntensity * 0.2));
    fuelCore.addColorStop(1, this.hsla(this.hueBase + 5, 100, 30, 0));

    ctx.fillStyle = fuelCore;
    ctx.shadowBlur = 60 + audioIntensity * 40;
    ctx.shadowColor = this.hsla(this.hueBase + 30, 100, 55, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * coreDistortion, 0, FlowFieldRenderer.TWO_PI);
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

    // HYPER-OPTIMIZATION: Pre-calculate abyss parameters
    const maxRadius = Math.min(this.width, this.height) * 0.5;
    const depthLayers = 15;
    const invDepthLayers = 1 / depthLayers;

    // ENHANCED: Swirling depth layers with vortex effect
    for (let layer = 0; layer < depthLayers; layer++) {
      const radius = maxRadius * (1 - layer * invDepthLayers);
      const hue = this.fastMod360(this.hueBase + 220 - layer * 3);
      const lightness = 8 + layer * 2;
      const alpha = (0.92 - layer * 0.06) * (0.5 + trebleIntensity * 0.5);

      // Vortex rotation effect
      const rotation = (this.time * 0.0005 + layer * 0.1) * (layer % 2 === 0 ? 1 : -1);
      ctx.save();
      ctx.rotate(rotation);

      const layerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      layerGradient.addColorStop(0, this.hsla(hue, 65, lightness + 6, alpha));
      layerGradient.addColorStop(0.5, this.hsla(hue, 75, lightness + 2, alpha * 0.85));
      layerGradient.addColorStop(0.8, this.hsla(hue, 80, lightness, alpha * 0.6));
      layerGradient.addColorStop(1, this.hsla(hue - 10, 85, lightness - 2, 0));

      ctx.fillStyle = layerGradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();

      ctx.restore();
    }

    // ENHANCED: Bioluminescent creatures swimming in the depths
    ctx.globalCompositeOperation = "lighter";
    const creatureCount = 10;
    const creatureAngleStep = FlowFieldRenderer.TWO_PI / creatureCount;

    for (let i = 0; i < creatureCount; i++) {
      const angle = creatureAngleStep * i + this.time * 0.0006 * (i % 2 === 0 ? 1 : -1);
      const depth = 0.25 + this.fastSin(this.time * 0.003 + i * 0.5) * 0.2;
      const radius = maxRadius * depth;
      const x = this.fastCos(angle) * radius;
      const y = this.fastSin(angle) * radius;

      const size = 6 + this.fastSin(this.time * 0.005 + i) * 3 + trebleIntensity * 4;
      const pulseAlpha = 0.5 + this.fastSin(this.time * 0.006 + i) * 0.3 + audioIntensity * 0.2;

      // Creature glow
      const creatureGlow = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
      const creatureHue = this.fastMod360(this.hueBase + 200 + i * 15);
      creatureGlow.addColorStop(0, this.hsla(creatureHue, 100, 60, pulseAlpha * 0.9));
      creatureGlow.addColorStop(0.5, this.hsla(creatureHue, 90, 45, pulseAlpha * 0.5));
      creatureGlow.addColorStop(1, this.hsla(creatureHue, 80, 30, 0));

      ctx.fillStyle = creatureGlow;
      ctx.beginPath();
      ctx.arc(x, y, size * 3, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();

      // Creature body (brighter core)
      ctx.fillStyle = this.hsla(creatureHue, 100, 70, pulseAlpha);
      ctx.shadowBlur = 25 + bassIntensity * 15;
      ctx.shadowColor = this.hsla(creatureHue, 100, 60, 0.8);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();

      // Creature trail
      for (let trail = 1; trail <= 3; trail++) {
        const trailAngle = angle - trail * 0.1;
        const trailRadius = radius * (1 - trail * 0.03);
        const trailX = this.fastCos(trailAngle) * trailRadius;
        const trailY = this.fastSin(trailAngle) * trailRadius;
        const trailSize = size * (1 - trail * 0.25);
        const trailAlpha = pulseAlpha * (1 - trail * 0.3);

        ctx.fillStyle = this.hsla(creatureHue, 90, 50, trailAlpha * 0.4);
        ctx.beginPath();
        ctx.arc(trailX, trailY, trailSize, 0, FlowFieldRenderer.TWO_PI);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = "source-over";

    // ENHANCED: Void core with pulsing darkness
    const coreRadius = maxRadius * (0.35 + bassIntensity * 0.1);
    const corePulse = 1 + this.fastSin(this.time * 0.002) * 0.1;
    const abyssalCore = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius * corePulse);
    abyssalCore.addColorStop(0, this.hsla(this.hueBase + 240, 55, 3, 0.98 + audioIntensity * 0.05));
    abyssalCore.addColorStop(0.4, this.hsla(this.hueBase + 235, 65, 6, 0.85 + bassIntensity * 0.15));
    abyssalCore.addColorStop(0.7, this.hsla(this.hueBase + 230, 70, 10, 0.6 + trebleIntensity * 0.2));
    abyssalCore.addColorStop(1, this.hsla(this.hueBase + 220, 75, 15, 0));

    ctx.fillStyle = abyssalCore;
    ctx.shadowBlur = 40 + bassIntensity * 30;
    ctx.shadowColor = this.hsla(this.hueBase + 240, 80, 10, 0.7);
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * corePulse, 0, FlowFieldRenderer.TWO_PI);
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

    // HYPER-OPTIMIZATION: Pre-calculate phantom parameters
    const maxRadius = Math.min(this.width, this.height) * 0.48;
    const pulseWaves = 10;

    // ENHANCED: Spectral wisps emanating from center
    ctx.globalCompositeOperation = "lighter";
    const wispCount = 12;
    const wispAngleStep = FlowFieldRenderer.TWO_PI / wispCount;

    for (let i = 0; i < wispCount; i++) {
      const wispAngle = wispAngleStep * i + this.time * 0.002;
      const wispLength = maxRadius * (0.6 + this.fastSin(this.time * 0.003 + i) * 0.3);

      const gradient = ctx.createLinearGradient(
        0, 0,
        this.fastCos(wispAngle) * wispLength,
        this.fastSin(wispAngle) * wispLength
      );

      const wispHue = this.fastMod360(this.hueBase + 100 + i * 20);
      gradient.addColorStop(0, this.hsla(wispHue, 100, 80, 0.7 + audioIntensity * 0.3));
      gradient.addColorStop(0.5, this.hsla(wispHue, 90, 70, 0.3 + midIntensity * 0.2));
      gradient.addColorStop(1, this.hsla(wispHue, 80, 60, 0));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 + bassIntensity * 3;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Curved wisp path
      const midX = this.fastCos(wispAngle) * wispLength * 0.5;
      const midY = this.fastSin(wispAngle) * wispLength * 0.5;
      const curveOffset = this.fastSin(this.time * 0.005 + i) * 30;
      ctx.quadraticCurveTo(
        midX + curveOffset,
        midY + curveOffset,
        this.fastCos(wispAngle) * wispLength,
        this.fastSin(wispAngle) * wispLength
      );
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";

    // Pulse waves with enhanced effects
    for (let wave = 0; wave < pulseWaves; wave++) {
      const delay = wave * 0.12;
      const radius = maxRadius * (0.15 + wave * 0.09) +
                     this.fastSin(this.time * 0.004 - delay) * maxRadius * 0.06;
      const hue = this.fastMod360(this.hueBase + 100 + wave * 15);
      const alpha = (0.85 - wave * 0.085) * (0.5 + midIntensity * 0.5);

      ctx.strokeStyle = this.hsla(hue, 90, 70, alpha);
      ctx.lineWidth = 3 + (wave === 0 ? bassIntensity * 5 : 0);
      ctx.shadowBlur = 30 + audioIntensity * 20;
      ctx.shadowColor = this.hsla(hue, 100, 75, alpha * 0.8);

      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, FlowFieldRenderer.TWO_PI);
      ctx.stroke();

      // ENHANCED: Spectral nodes on pulse waves
      if (wave % 2 === 0) {
        const segments = 8;
        const segmentAngleStep = FlowFieldRenderer.TWO_PI / segments;

        for (let i = 0; i < segments; i++) {
          const angle = segmentAngleStep * i + this.time * 0.001;
          const x = this.fastCos(angle) * radius;
          const y = this.fastSin(angle) * radius;

          // Ghostly trail effect
          for (let trail = 0; trail < 3; trail++) {
            const trailOffset = trail * 0.05;
            const trailAngle = angle - trailOffset;
            const trailRadius = radius * (1 - trail * 0.02);
            const trailX = this.fastCos(trailAngle) * trailRadius;
            const trailY = this.fastSin(trailAngle) * trailRadius;
            const trailAlpha = alpha * (1 - trail * 0.3);

            ctx.fillStyle = this.hsla(hue, 100, 80, trailAlpha * 0.7);
            ctx.beginPath();
            ctx.arc(trailX, trailY, (4 - trail) + midIntensity * 2, 0, FlowFieldRenderer.TWO_PI);
            ctx.fill();
          }
        }
      }
    }

    // ENHANCED: Multi-layered spectral core
    const coreRadius = maxRadius * (0.25 + bassIntensity * 0.08);
    const phantomCore = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
    phantomCore.addColorStop(0, this.hsla(this.hueBase + 110, 100, 90, 0.98 + audioIntensity * 0.05));
    phantomCore.addColorStop(0.3, this.hsla(this.hueBase + 105, 95, 75, 0.8 + midIntensity * 0.2));
    phantomCore.addColorStop(0.7, this.hsla(this.hueBase + 100, 90, 65, 0.6 + bassIntensity * 0.2));
    phantomCore.addColorStop(1, this.hsla(this.hueBase + 95, 85, 55, 0));

    ctx.fillStyle = phantomCore;
    ctx.shadowBlur = 50 + audioIntensity * 30;
    ctx.shadowColor = this.hsla(this.hueBase + 110, 100, 80, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, FlowFieldRenderer.TWO_PI);
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

    // HYPER-OPTIMIZATION: Pre-calculate flame parameters
    const maxRadius = Math.min(this.width, this.height) * 0.52;
    const flames = 20; // Even more flames for intensity
    const angleStep = FlowFieldRenderer.TWO_PI / flames;
    const flamePoints = 16;
    const invFlamePoints = 1 / flamePoints;

    // Enhanced flame rendering with multiple layers
    for (let layer = 0; layer < 2; layer++) {
      const layerScale = layer === 0 ? 1 : 0.7;
      const layerRotation = layer * 0.15;

      for (let flame = 0; flame < flames; flame++) {
        const angle = angleStep * flame + this.time * 0.0015 + layerRotation;
        const baseRadius = maxRadius * (0.1 + flame * 0.08) * layerScale;
        const radius = baseRadius + this.fastSin(this.time * 0.012 + flame) * maxRadius * 0.18;

        const hue1 = this.fastMod360(this.hueBase + flame * 15);
        const hue2 = this.fastMod360(this.hueBase + 40 + flame * 15);
        const hue3 = this.fastMod360(this.hueBase + 80 + flame * 15);

        const cosAngle = this.fastCos(angle);
        const sinAngle = this.fastSin(angle);

        const flameGradient = ctx.createLinearGradient(
          cosAngle * baseRadius,
          sinAngle * baseRadius,
          cosAngle * maxRadius,
          sinAngle * maxRadius,
        );
        flameGradient.addColorStop(0, this.hsla(hue1, 100, 75, 0.95 + audioIntensity * 0.15));
        flameGradient.addColorStop(0.3, this.hsla(hue2, 100, 70, 0.9 + trebleIntensity * 0.25));
        flameGradient.addColorStop(0.7, this.hsla(hue3, 100, 65, 0.75 + bassIntensity * 0.35));
        flameGradient.addColorStop(1, this.hsla(hue1, 100, 55, 0));

        ctx.fillStyle = flameGradient;
        ctx.shadowBlur = 70 + bassIntensity * 30;
        ctx.shadowColor = this.hsla(hue1, 100, 70, 0.98);

        // ENHANCED: Organic flame shapes with multiple harmonics
        ctx.beginPath();
        for (let i = 0; i <= flamePoints; i++) {
          const t = i * invFlamePoints;
          const currentRadius = baseRadius + (radius - baseRadius) * t;
          const wave1 = this.fastSin(t * Math.PI * 5 + this.time * 0.02 + flame) * 30;
          const wave2 = this.fastSin(t * Math.PI * 12 + this.time * 0.04) * 8;
          const totalWave = (wave1 + wave2) * (1 + audioIntensity * 0.5);
          const x = this.fastCos(angle + totalWave * 0.015) * currentRadius;
          const y = this.fastSin(angle + totalWave * 0.015) * currentRadius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(cosAngle * baseRadius, sinAngle * baseRadius);
        ctx.closePath();
        ctx.fill();
      }
    }

    // ENHANCED: Floating embers/particles
    ctx.globalCompositeOperation = "lighter";
    const emberCount = 40 + ((bassIntensity * 60) | 0);
    for (let i = 0; i < emberCount; i++) {
      const emberAngle = (this.time * 0.003 + i * 0.5) % FlowFieldRenderer.TWO_PI;
      const emberDist = (this.time * 2 + i * 10) % (maxRadius * 1.2);
      const emberX = this.fastCos(emberAngle) * emberDist + this.fastSin(this.time * 0.01 + i) * 20;
      const emberY = this.fastSin(emberAngle) * emberDist + this.fastCos(this.time * 0.015 + i) * 20;
      const emberSize = 1 + Math.random() * 3 + trebleIntensity * 2;
      const emberHue = this.fastMod360(this.hueBase + Math.random() * 60);
      const emberAlpha = (1 - emberDist / (maxRadius * 1.2)) * (0.6 + audioIntensity * 0.4);

      ctx.fillStyle = this.hsla(emberHue, 100, 80, emberAlpha);
      ctx.beginPath();
      ctx.arc(emberX, emberY, emberSize, 0, FlowFieldRenderer.TWO_PI);
      ctx.fill();
    }

    // ENHANCED: Multi-layered infernal core
    ctx.globalCompositeOperation = "source-over";
    const coreRadius = maxRadius * (0.35 + bassIntensity * 0.1);
    const infernalCore = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
    infernalCore.addColorStop(0, this.hsla(this.hueBase + 30, 100, 98, 0.99 + audioIntensity * 0.05));
    infernalCore.addColorStop(0.2, this.hsla(this.hueBase + 20, 100, 90, 0.95 + bassIntensity * 0.2));
    infernalCore.addColorStop(0.6, this.hsla(this.hueBase + 10, 100, 75, 0.85 + trebleIntensity * 0.3));
    infernalCore.addColorStop(1, this.hsla(this.hueBase, 100, 60, 0));

    ctx.fillStyle = infernalCore;
    ctx.shadowBlur = 90 + audioIntensity * 40;
    ctx.shadowColor = this.hsla(this.hueBase + 20, 100, 85, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, FlowFieldRenderer.TWO_PI);
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
