// File: src/components/visualizers/CircularRenderer.ts

export class CircularRenderer {
  private rotationOffset = 0;
  private pulsePhase = 0;
  private peakHistory: number[] = [];

  constructor(barCount = 64) {
    this.peakHistory = new Array<number>(barCount).fill(0);
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement, barCount = 64): void {
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const hueShift = avgAmplitude * 50;
    
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
    bgGradient.addColorStop(0, `hsla(${260 + hueShift}, 90%, 25%, 1)`);
    bgGradient.addColorStop(0.5, `hsla(${280 + hueShift}, 85%, 20%, 1)`);
    bgGradient.addColorStop(1, `hsla(${240 + hueShift}, 80%, 15%, 1)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) / 3;

    const pulseMultiplier = 1 + Math.sin(this.pulsePhase) * avgAmplitude * 0.4;
    const radius = baseRadius * pulseMultiplier;

    this.pulsePhase += 0.05;
    this.rotationOffset += 0.005; // Faster rotation

    const barAngle = (Math.PI * 2) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const offCtx = offCanvas.getContext('2d')!;
    offCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    offCtx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    const segments = 12; // More segments for kaleidoscopic effect

    for (let seg = 0; seg < segments; seg++) {
      offCtx.save();
      offCtx.translate(centerX, centerY);
      offCtx.rotate((seg * Math.PI * 2) / segments);
      offCtx.scale(seg % 2 === 0 ? 1 : -1, 1); 
      offCtx.translate(-centerX, -centerY);

      for (let i = 0; i < 3; i++) {
        const glowRadius = radius * (0.9 - i * 0.15);
        offCtx.strokeStyle = `rgba(138, 43, 226, ${0.3 - i * 0.1})`;
        offCtx.lineWidth = 3;
        offCtx.shadowBlur = 40;
        offCtx.shadowColor = 'rgba(138, 43, 226, 0.8)';
        offCtx.beginPath();
        offCtx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        offCtx.stroke();
      }

      offCtx.shadowBlur = 0;

      // Draw outer ring segments
      for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const normalizedValue = value / 255;
      const barLength = normalizedValue * radius * 1.2;

      // Update peak tracking
      const currentPeak = this.peakHistory[i] ?? 0;
      if (barLength > currentPeak) {
        this.peakHistory[i] = barLength;
      } else {
        this.peakHistory[i] = Math.max(0, currentPeak - 2);
      }

      const angle = i * barAngle - Math.PI / 2 + this.rotationOffset;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barLength);
      const y2 = centerY + Math.sin(angle) * (radius + barLength);

      const hue = (i / barCount) * 360 + 200 + seg * 20; // Full spectrum with segment shift
      const saturation = 90 + normalizedValue * 10; // Higher base saturation
      const lightness = 60 + normalizedValue * 30; // Brighter

      const gradient = offCtx.createLinearGradient(x1, y1, x2, y2);
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness - 15}%, 0.8)`);
      gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, ${lightness + 15}%, 1)`);

      offCtx.strokeStyle = gradient;
      offCtx.lineWidth = Math.max(3, 10 - barCount / 20);
      offCtx.shadowBlur = 25 * normalizedValue;
      offCtx.shadowColor = `hsla(${hue}, 100%, 70%, ${0.9 + normalizedValue * 0.1})`;
      offCtx.lineCap = 'round';

      offCtx.beginPath();
      offCtx.moveTo(x1, y1);
      offCtx.lineTo(x2, y2);
      offCtx.stroke();

      if (currentPeak > 0) {
        const peakX = centerX + Math.cos(angle) * (radius + currentPeak);
        const peakY = centerY + Math.sin(angle) * (radius + currentPeak);

        offCtx.shadowBlur = 30;
        offCtx.shadowColor = `hsla(${hue}, 100%, 75%, 1)`;
        offCtx.fillStyle = `hsla(${hue + 30}, 100%, 85%, 1)`;
        offCtx.beginPath();
        offCtx.arc(peakX, peakY, 4, 0, Math.PI * 2);
        offCtx.fill();
      }
    }

      offCtx.restore();
    }

    offCtx.shadowBlur = 0;

    const innerGradient = offCtx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * 0.8
    );
    innerGradient.addColorStop(0, `rgba(138, 43, 226, ${0.5 + avgAmplitude * 0.5})`);
    innerGradient.addColorStop(0.7, `rgba(75, 0, 130, ${0.4 + avgAmplitude * 0.4})`);
    innerGradient.addColorStop(1, 'rgba(75, 0, 130, 0.2)');

    offCtx.fillStyle = innerGradient;
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    offCtx.fill();

    // Draw center glow particle - more intense
    offCtx.shadowBlur = 50 + avgAmplitude * 60;
    offCtx.shadowColor = 'rgba(200, 150, 255, 1)';
    offCtx.fillStyle = 'rgba(255, 255, 255, 1)';
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, 6 + avgAmplitude * 8, 0, Math.PI * 2);
    offCtx.fill();
    offCtx.shadowBlur = 0;

    offCtx.strokeStyle = 'rgba(147, 112, 219, 0.5)';
    offCtx.lineWidth = 2;
    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      if (value > 150) {
        const angle1 = i * barAngle - Math.PI / 2 + this.rotationOffset;
        const angle2 = ((i + 1) % barCount) * barAngle - Math.PI / 2 + this.rotationOffset;

        const arcRadius = radius + (value / 255) * radius * 0.8;

        offCtx.beginPath();
        offCtx.arc(centerX, centerY, arcRadius, angle1, angle2);
        offCtx.stroke();
      }
    }

    for (let seg = 0; seg < segments; seg++) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((seg * Math.PI * 2) / segments);
      ctx.scale(seg % 2 === 0 ? 1 : -1, 1); // Mirror alternate segments
      ctx.translate(-centerX, -centerY);
      ctx.globalCompositeOperation = 'screen'; // Use screen blend for more vibrant effect
      ctx.globalAlpha = 0.9;
      ctx.drawImage(offCanvas, 0, 0);
      ctx.restore();
    }

    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }

  public updateBarCount(barCount: number): void {
    this.peakHistory = new Array<number>(barCount).fill(0);
  }
}
