// File: src/components/visualizers/SpectralWavesRenderer.ts

export class SpectralWavesRenderer {
  private timeOffset = 0;
  private wavePhases: number[] = [0, 0, 0, 0, 0, 0];

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement, barCount = 64): void {
    // Vibrant gradient background with audio-reactive colors
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;
    const hueShift = avgAmplitude * 40;
    
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, `hsla(${260 + hueShift}, 75%, 25%, 0.92)`);
    bgGradient.addColorStop(0.5, `hsla(${280 + hueShift}, 80%, 20%, 0.94)`);
    bgGradient.addColorStop(1, `hsla(${240 + hueShift}, 70%, 18%, 0.92)`);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.timeOffset += 0.02;

    const dataStep = Math.floor(data.length / barCount);

    // Average amplitude already calculated above for background

    // Draw multiple wave layers
    const waves = [
      {
        color: 'rgba(138, 43, 226, 0.9)',
        width: 4,
        amplitude: 1.0,
        frequency: 4,
        offset: 0,
        shadowColor: 'rgba(138, 43, 226, 0.8)',
        shadowBlur: 25
      },
      {
        color: 'rgba(147, 112, 219, 0.7)',
        width: 3.5,
        amplitude: 0.75,
        frequency: 5,
        offset: 20,
        shadowColor: 'rgba(147, 112, 219, 0.6)',
        shadowBlur: 20
      },
      {
        color: 'rgba(75, 0, 130, 0.6)',
        width: 3,
        amplitude: 0.6,
        frequency: 3.5,
        offset: -15,
        shadowColor: 'rgba(75, 0, 130, 0.5)',
        shadowBlur: 18
      },
      {
        color: 'rgba(106, 21, 197, 0.5)',
        width: 2.5,
        amplitude: 0.5,
        frequency: 6,
        offset: 35,
        shadowColor: 'rgba(106, 21, 197, 0.4)',
        shadowBlur: 15
      },
      {
        color: 'rgba(186, 85, 211, 0.4)',
        width: 2,
        amplitude: 0.4,
        frequency: 4.5,
        offset: -25,
        shadowColor: 'rgba(186, 85, 211, 0.3)',
        shadowBlur: 12
      },
      {
        color: 'rgba(221, 160, 221, 0.3)',
        width: 1.5,
        amplitude: 0.3,
        frequency: 5.5,
        offset: 45,
        shadowColor: 'rgba(221, 160, 221, 0.2)',
        shadowBlur: 10
      },
    ];

    waves.forEach((wave, waveIndex) => {
      // Update wave phase
      this.wavePhases[waveIndex] = (this.wavePhases[waveIndex] ?? 0) + 0.015 * (1 + waveIndex * 0.1);

      ctx.lineWidth = wave.width + avgAmplitude * 2;
      ctx.strokeStyle = wave.color;
      ctx.shadowBlur = wave.shadowBlur + avgAmplitude * 15;
      ctx.shadowColor = wave.shadowColor;

      ctx.beginPath();

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const normalizedValue = value / 255;

        // Complex wave calculation with multiple sine components
        const baseAmplitude = normalizedValue * (canvas.height / 3) * wave.amplitude;
        const x = (i / barCount) * canvas.width;

        // Main wave with frequency modulation
        const mainWave = Math.sin((i / barCount) * Math.PI * wave.frequency + this.timeOffset + this.wavePhases[waveIndex]);

        // Secondary modulation for complexity
        const modulation = Math.sin((i / barCount) * Math.PI * 2 + this.timeOffset * 0.5) * 0.3;

        // Combine waves
        const combinedWave = mainWave * (1 + modulation);

        const y = canvas.height / 2 +
                  combinedWave * baseAmplitude +
                  wave.offset +
                  Math.sin((i / barCount) * Math.PI * 8 + this.timeOffset * 2) * normalizedValue * 8;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    // Add glow particles at wave peaks
    for (let i = 0; i < barCount; i += 5) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const normalizedValue = value / 255;

      if (normalizedValue > 0.6) {
        const x = (i / barCount) * canvas.width;
        const mainWave = Math.sin((i / barCount) * Math.PI * 4 + this.timeOffset + (this.wavePhases[0] ?? 0));
        const baseAmplitude = normalizedValue * (canvas.height / 3);
        const y = canvas.height / 2 + mainWave * baseAmplitude;

        const hue = 260 + normalizedValue * 40;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${normalizedValue})`;
        ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${normalizedValue * 0.9})`;
        ctx.beginPath();
        ctx.arc(x, y, 2 + normalizedValue * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;

    // Draw center line with subtle glow
    ctx.strokeStyle = `rgba(100, 80, 150, ${0.2 + avgAmplitude * 0.3})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Add horizontal scan lines for retro effect
    ctx.strokeStyle = 'rgba(138, 43, 226, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
}
