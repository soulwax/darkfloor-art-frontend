// File: src/components/visualizers/ChemicalOrbitalsRenderer.ts

interface Electron {
  x: number;
  y: number;
  z: number;
  angle: number;
  phase: number;
  speed: number;
}

interface Orbital {
  n: number; // Principal quantum number
  l: number; // Angular momentum quantum number
  m: number; // Magnetic quantum number
  radius: number;
  phase: number;
}

export class ChemicalOrbitalsRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private time = 0;
  private centerX = 0;
  private centerY = 0;
  private maxRadius = 0;
  private pixelRatio = 1;
  private qualityScale = 1;
  
  // Current energy level (n = 1, 2, 3, ...)
  private currentEnergyLevel = 1;
  private energyLevelTimer = 0;
  private energyLevelDuration = 300; // frames per energy level
  
  // Electrons for visualization
  private electrons: Electron[] = [];
  
  // Pre-calculated constants
  private readonly TWO_PI = Math.PI * 2;
  private readonly INV_255 = 1 / 255;
  private readonly INV_360 = 1 / 360;
  
  // Hydrogen atom energy levels: E_n = -13.6 eV / n²
  private readonly MAX_ENERGY_LEVEL = 6;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // Performance optimization
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenArea = canvas.width * canvas.height;
    const threshold = 2073600; // 1920 * 1080
    if (screenArea > threshold) {
      this.qualityScale = Math.min(0.7, threshold / screenArea);
    } else {
      this.qualityScale = 1;
    }
    this.pixelRatio = (devicePixelRatio < 2 ? devicePixelRatio : 2) * this.qualityScale;
    
    this.centerX = canvas.width * 0.5;
    this.centerY = canvas.height * 0.5;
    const minDimension = Math.min(canvas.width, canvas.height);
    this.maxRadius = minDimension * 0.4;
    
    this.initializeElectrons();
  }
  
  private initializeElectrons(): void {
    this.electrons = [];
    const electronCount = Math.floor(50 * this.qualityScale);
    
    for (let i = 0; i < electronCount; i++) {
      this.electrons.push({
        x: 0,
        y: 0,
        z: 0,
        angle: Math.random() * this.TWO_PI,
        phase: Math.random() * this.TWO_PI,
        speed: 0.01 + Math.random() * 0.02,
      });
    }
  }
  
  render(dataArray: Uint8Array, bufferLength: number): void {
    const { ctx, canvas } = this;
    this.time += 1;
    this.energyLevelTimer += 1;
    
    // Calculate audio metrics
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] ?? 0;
    }
    const audioIntensity = (sum / bufferLength) * this.INV_255;
    const bassIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0, 0.15);
    const midIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.3, 0.6);
    const trebleIntensity = this.getFrequencyBandIntensity(dataArray, bufferLength, 0.7, 1.0);
    
    // Cycle through energy levels
    if (this.energyLevelTimer >= this.energyLevelDuration) {
      this.energyLevelTimer = 0;
      this.currentEnergyLevel = (this.currentEnergyLevel % this.MAX_ENERGY_LEVEL) + 1;
    }
    
    // Speed up transitions with audio
    const transitionSpeed = 1 + audioIntensity * 2;
    if (this.energyLevelTimer >= this.energyLevelDuration / transitionSpeed) {
      this.energyLevelTimer = 0;
      this.currentEnergyLevel = (this.currentEnergyLevel % this.MAX_ENERGY_LEVEL) + 1;
    }
    
    // Clear canvas with fade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw energy level label
    this.drawEnergyLevelLabel(ctx, audioIntensity);
    
    // Draw orbitals for current energy level
    this.drawOrbitals(ctx, this.currentEnergyLevel, audioIntensity, bassIntensity, midIntensity, trebleIntensity);
    
    // Draw nucleus
    this.drawNucleus(ctx, audioIntensity, bassIntensity);
    
    // Update and draw electrons
    this.updateElectrons(audioIntensity, bassIntensity);
    this.drawElectrons(ctx, this.currentEnergyLevel, audioIntensity, trebleIntensity);
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
  
  private drawEnergyLevelLabel(ctx: CanvasRenderingContext2D, audioIntensity: number): void {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + audioIntensity * 0.4})`;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const energy = -13.6 / (this.currentEnergyLevel * this.currentEnergyLevel);
    const label = `n = ${this.currentEnergyLevel} | E = ${energy.toFixed(2)} eV`;
    ctx.fillText(label, this.centerX, 20);
    ctx.restore();
  }
  
  private drawNucleus(ctx: CanvasRenderingContext2D, audioIntensity: number, bassIntensity: number): void {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    
    // Pulsing nucleus
    const nucleusRadius = 8 + bassIntensity * 12;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nucleusRadius);
    gradient.addColorStop(0, `rgba(255, 100, 100, ${0.8 + audioIntensity * 0.2})`);
    gradient.addColorStop(0.5, `rgba(255, 150, 150, ${0.4 + audioIntensity * 0.3})`);
    gradient.addColorStop(1, `rgba(255, 200, 200, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, nucleusRadius, 0, this.TWO_PI);
    ctx.fill();
    
    // Core
    ctx.fillStyle = `rgba(255, 50, 50, ${0.9 + audioIntensity * 0.1})`;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, this.TWO_PI);
    ctx.fill();
    
    ctx.restore();
  }
  
  private drawOrbitals(
    ctx: CanvasRenderingContext2D,
    n: number,
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    
    // Calculate orbital radius based on energy level
    // Bohr radius: r_n = n² * a₀, where a₀ ≈ 0.529 Å
    const baseRadius = this.maxRadius * 0.3;
    const orbitalRadius = baseRadius * n * n;
    
    // Draw orbitals based on quantum numbers
    if (n === 1) {
      // 1s orbital - spherical
      this.draw1sOrbital(ctx, orbitalRadius, audioIntensity, trebleIntensity);
    } else if (n === 2) {
      // 2s and 2p orbitals
      this.draw2sOrbital(ctx, orbitalRadius * 0.5, audioIntensity, trebleIntensity);
      this.draw2pOrbitals(ctx, orbitalRadius, audioIntensity, midIntensity, trebleIntensity);
    } else if (n === 3) {
      // 3s, 3p, and 3d orbitals
      this.draw3sOrbital(ctx, orbitalRadius * 0.33, audioIntensity, trebleIntensity);
      this.draw3pOrbitals(ctx, orbitalRadius * 0.66, audioIntensity, midIntensity, trebleIntensity);
      this.draw3dOrbitals(ctx, orbitalRadius, audioIntensity, bassIntensity, midIntensity, trebleIntensity);
    } else {
      // Higher energy levels - show multiple shells
      for (let shell = 1; shell <= n; shell++) {
        const shellRadius = (orbitalRadius * shell) / n;
        this.drawShell(ctx, shellRadius, shell, audioIntensity, trebleIntensity);
      }
    }
    
    ctx.restore();
  }
  
  private draw1sOrbital(
    ctx: CanvasRenderingContext2D,
    radius: number,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    // Spherical orbital - draw as a circle with probability cloud
    const pulse = Math.sin(this.time * 0.05) * (5 + trebleIntensity * 15);
    const currentRadius = radius + pulse;
    
    // Outer probability cloud
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
    gradient.addColorStop(0, `rgba(100, 200, 255, ${0.1 + audioIntensity * 0.2})`);
    gradient.addColorStop(0.5, `rgba(100, 200, 255, ${0.05 + trebleIntensity * 0.15})`);
    gradient.addColorStop(1, `rgba(100, 200, 255, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, this.TWO_PI);
    ctx.fill();
    
    // Orbital boundary
    ctx.strokeStyle = `rgba(100, 200, 255, ${0.4 + audioIntensity * 0.3})`;
    ctx.lineWidth = 2 + trebleIntensity * 3;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, this.TWO_PI);
    ctx.stroke();
  }
  
  private draw2sOrbital(
    ctx: CanvasRenderingContext2D,
    radius: number,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    // 2s orbital - larger sphere with node
    const pulse = Math.sin(this.time * 0.04) * (8 + trebleIntensity * 20);
    const currentRadius = radius + pulse;
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
    gradient.addColorStop(0, `rgba(150, 200, 255, ${0.08 + audioIntensity * 0.15})`);
    gradient.addColorStop(0.6, `rgba(150, 200, 255, ${0.03 + trebleIntensity * 0.1})`);
    gradient.addColorStop(1, `rgba(150, 200, 255, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, this.TWO_PI);
    ctx.fill();
    
    ctx.strokeStyle = `rgba(150, 200, 255, ${0.35 + audioIntensity * 0.25})`;
    ctx.lineWidth = 1.5 + trebleIntensity * 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, this.TWO_PI);
    ctx.stroke();
  }
  
  private draw2pOrbitals(
    ctx: CanvasRenderingContext2D,
    radius: number,
    audioIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    // 2p orbitals - dumbbell shapes along x, y, z axes
    const pulse = Math.sin(this.time * 0.06) * (10 + midIntensity * 20);
    const currentRadius = radius + pulse;
    
    // 2px (along x-axis)
    this.drawDumbbellOrbital(ctx, currentRadius, 0, audioIntensity, trebleIntensity);
    // 2py (along y-axis)
    this.drawDumbbellOrbital(ctx, currentRadius, Math.PI / 2, audioIntensity, trebleIntensity);
    // 2pz (along z-axis - shown as diagonal)
    this.drawDumbbellOrbital(ctx, currentRadius * 0.7, Math.PI / 4, audioIntensity, trebleIntensity);
  }
  
  private draw3sOrbital(
    ctx: CanvasRenderingContext2D,
    radius: number,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    // 3s orbital - even larger with more nodes
    const pulse = Math.sin(this.time * 0.03) * (12 + trebleIntensity * 25);
    const currentRadius = radius + pulse;
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
    gradient.addColorStop(0, `rgba(200, 150, 255, ${0.06 + audioIntensity * 0.12})`);
    gradient.addColorStop(0.5, `rgba(200, 150, 255, ${0.02 + trebleIntensity * 0.08})`);
    gradient.addColorStop(1, `rgba(200, 150, 255, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, this.TWO_PI);
    ctx.fill();
    
    ctx.strokeStyle = `rgba(200, 150, 255, ${0.3 + audioIntensity * 0.2})`;
    ctx.lineWidth = 1 + trebleIntensity * 2;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, this.TWO_PI);
    ctx.stroke();
  }
  
  private draw3pOrbitals(
    ctx: CanvasRenderingContext2D,
    radius: number,
    audioIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    const pulse = Math.sin(this.time * 0.05) * (15 + midIntensity * 25);
    const currentRadius = radius + pulse;
    
    // Rotate 3p orbitals slightly
    const rotation = this.time * 0.01;
    this.drawDumbbellOrbital(ctx, currentRadius, rotation, audioIntensity, trebleIntensity);
    this.drawDumbbellOrbital(ctx, currentRadius, rotation + Math.PI / 2, audioIntensity, trebleIntensity);
    this.drawDumbbellOrbital(ctx, currentRadius * 0.8, rotation + Math.PI / 4, audioIntensity, trebleIntensity);
  }
  
  private draw3dOrbitals(
    ctx: CanvasRenderingContext2D,
    radius: number,
    audioIntensity: number,
    bassIntensity: number,
    midIntensity: number,
    trebleIntensity: number
  ): void {
    // 3d orbitals - more complex shapes
    const pulse = Math.sin(this.time * 0.04) * (20 + bassIntensity * 30);
    const currentRadius = radius + pulse;
    const rotation = this.time * 0.008;
    
    // Draw cloverleaf patterns for d orbitals
    for (let i = 0; i < 5; i++) {
      const angle = (i * this.TWO_PI) / 5 + rotation;
      this.drawCloverleafOrbital(ctx, currentRadius, angle, audioIntensity, trebleIntensity);
    }
  }
  
  private drawDumbbellOrbital(
    ctx: CanvasRenderingContext2D,
    radius: number,
    angle: number,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    ctx.save();
    ctx.rotate(angle);
    
    const lobeSize = radius * 0.4;
    const lobeDistance = radius * 0.6;
    
    // Left lobe
    const gradient1 = ctx.createRadialGradient(-lobeDistance, 0, 0, -lobeDistance, 0, lobeSize);
    gradient1.addColorStop(0, `rgba(100, 255, 200, ${0.3 + audioIntensity * 0.3})`);
    gradient1.addColorStop(1, `rgba(100, 255, 200, 0)`);
    ctx.fillStyle = gradient1;
    ctx.beginPath();
    ctx.arc(-lobeDistance, 0, lobeSize, 0, this.TWO_PI);
    ctx.fill();
    
    // Right lobe
    const gradient2 = ctx.createRadialGradient(lobeDistance, 0, 0, lobeDistance, 0, lobeSize);
    gradient2.addColorStop(0, `rgba(100, 255, 200, ${0.3 + audioIntensity * 0.3})`);
    gradient2.addColorStop(1, `rgba(100, 255, 200, 0)`);
    ctx.fillStyle = gradient2;
    ctx.beginPath();
    ctx.arc(lobeDistance, 0, lobeSize, 0, this.TWO_PI);
    ctx.fill();
    
    // Connection line
    ctx.strokeStyle = `rgba(100, 255, 200, ${0.2 + audioIntensity * 0.2})`;
    ctx.lineWidth = 1 + trebleIntensity * 2;
    ctx.beginPath();
    ctx.moveTo(-lobeDistance, 0);
    ctx.lineTo(lobeDistance, 0);
    ctx.stroke();
    
    ctx.restore();
  }
  
  private drawCloverleafOrbital(
    ctx: CanvasRenderingContext2D,
    radius: number,
    angle: number,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    ctx.save();
    ctx.rotate(angle);
    
    const lobeSize = radius * 0.25;
    const lobeDistance = radius * 0.7;
    
    // Four lobes in cloverleaf pattern
    for (let i = 0; i < 4; i++) {
      const lobeAngle = (i * this.TWO_PI) / 4;
      const x = Math.cos(lobeAngle) * lobeDistance;
      const y = Math.sin(lobeAngle) * lobeDistance;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, lobeSize);
      gradient.addColorStop(0, `rgba(255, 150, 200, ${0.25 + audioIntensity * 0.25})`);
      gradient.addColorStop(1, `rgba(255, 150, 200, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, lobeSize, 0, this.TWO_PI);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  private drawShell(
    ctx: CanvasRenderingContext2D,
    radius: number,
    shell: number,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    const pulse = Math.sin(this.time * 0.02 + shell) * (5 + trebleIntensity * 15);
    const currentRadius = radius + pulse;
    
    const hue = (shell * 60 + this.time * 0.5) % 360;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
    gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, ${0.05 + audioIntensity * 0.1})`);
    gradient.addColorStop(1, `hsla(${hue}, 70%, 60%, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, this.TWO_PI);
    ctx.fill();
    
    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${0.25 + audioIntensity * 0.2})`;
    ctx.lineWidth = 1 + trebleIntensity * 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, this.TWO_PI);
    ctx.stroke();
  }
  
  private updateElectrons(audioIntensity: number, bassIntensity: number): void {
    const n = this.currentEnergyLevel;
    const baseRadius = this.maxRadius * 0.3;
    const orbitalRadius = baseRadius * n * n;
    
    this.electrons.forEach((electron) => {
      // Update angle based on energy level
      const speed = electron.speed * (1 + audioIntensity * 2 + bassIntensity);
      electron.angle += speed / (n * n); // Higher energy levels move faster
      electron.phase += speed * 0.5;
      
      // Calculate position on orbital
      const radius = orbitalRadius * (0.8 + Math.sin(electron.phase) * 0.2);
      electron.x = Math.cos(electron.angle) * radius;
      electron.y = Math.sin(electron.angle) * radius;
      electron.z = Math.sin(electron.phase) * radius * 0.3; // 3D depth
    });
  }
  
  private drawElectrons(
    ctx: CanvasRenderingContext2D,
    n: number,
    audioIntensity: number,
    trebleIntensity: number
  ): void {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    
    this.electrons.forEach((electron) => {
      // Size based on energy level
      const size = (3 + trebleIntensity * 5) / n;
      const alpha = 0.6 + audioIntensity * 0.4;
      
      // Color based on energy level
      const hue = (n * 40 + this.time * 2) % 360;
      
      // Draw electron with glow
      const gradient = ctx.createRadialGradient(
        electron.x, electron.y, 0,
        electron.x, electron.y, size * 2
      );
      gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 100%, 60%, ${alpha * 0.5})`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(electron.x, electron.y, size * 2, 0, this.TWO_PI);
      ctx.fill();
      
      // Core
      ctx.fillStyle = `hsla(${hue}, 100%, 90%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(electron.x, electron.y, size, 0, this.TWO_PI);
      ctx.fill();
    });
    
    ctx.restore();
  }
  
  resize(width: number, height: number): void {
    const screenArea = width * height;
    const threshold = 2073600;
    if (screenArea > threshold) {
      this.qualityScale = threshold / screenArea < 0.7 ? threshold / screenArea : 0.7;
    } else {
      this.qualityScale = 1;
    }
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.pixelRatio = Math.min(devicePixelRatio, 2) * this.qualityScale;
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.centerX = width * 0.5;
    this.centerY = height * 0.5;
    const minDimension = Math.min(width, height);
    this.maxRadius = minDimension * 0.4;
    
    this.electrons = [];
    this.initializeElectrons();
  }
}

