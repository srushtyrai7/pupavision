import { ClassificationResult } from './types';

/**
 * Simulates pupa classification based on image seed.
 * In production, this would call a TFLite / MobileNetV2 model.
 */
export function simulateClassification(seed: string): ClassificationResult {
  let s = 0;
  const src = typeof seed === 'string' ? seed : 'x';
  for (let i = 0; i < Math.min(src.length, 300); i++) s += src.charCodeAt(i);

  const rand = (mn: number, mx: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return mn + (s / 0x7fffffff) * (mx - mn);
  };

  const fp = rand(0.35, 0.92);
  const mp = 1 - fp;
  const isFemale = fp > 0.5;
  const conf = Math.max(fp, mp);

  return {
    label: isFemale ? 'Female' : 'Male',
    female: fp,
    male: mp,
    conf,
    flagged: conf < 0.7,
    features: {
      'Aspect Ratio': rand(0.45, 0.95),
      'Mid-segment Width': isFemale ? rand(0.6, 0.92) : rand(0.3, 0.62),
      'Surface Texture': rand(0.4, 0.9),
      'Segment Count': rand(0.5, 0.85),
      'HOG Gradient Mag': rand(0.3, 0.8),
      'Abdomen Curvature': isFemale ? rand(0.55, 0.9) : rand(0.25, 0.6),
    },
    morph: {
      estLength: rand(2.8, 3.9).toFixed(2) + ' cm',
      estWeight: isFemale
        ? rand(1.8, 2.4).toFixed(2) + ' g'
        : rand(1.5, 1.9).toFixed(2) + ' g',
      breed: rand(0, 1) > 0.5 ? 'CSR2 (probable)' : 'Pure Mysore (probable)',
      devStage: rand(0, 1) > 0.6 ? 'Late pupa' : 'Mid pupa',
    },
  };
}

/**
 * Processing step labels for the pipeline animation
 */
export const PROCESSING_STEPS = [
  'Preprocessing image... CLAHE applied',
  'Extracting HOG features (9 orientations)...',
  'Running MobileNetV2 forward pass...',
  'Applying softmax to logits...',
  'Computing Grad-CAM (Conv_1 layer)...',
  'Classification complete ✓',
] as const;

/**
 * Draws a simulated Grad-CAM heatmap on a canvas
 */
export function drawHeatmap(
  canvas: HTMLCanvasElement,
  result: ClassificationResult,
  imgEl: HTMLImageElement
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || 300;
  canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || 220;
  const W = canvas.width;
  const H = canvas.height;

  const cx = result.label === 'Female' ? W * 0.5 : W * 0.55;
  const cy = result.label === 'Female' ? H * 0.52 : H * 0.6;

  ctx.clearRect(0, 0, W, H);

  // Primary attention region
  const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.28);
  g1.addColorStop(0, 'rgba(255,60,20,0.75)');
  g1.addColorStop(0.4, 'rgba(255,140,0,0.55)');
  g1.addColorStop(0.7, 'rgba(255,220,0,0.3)');
  g1.addColorStop(1, 'rgba(0,80,255,0.0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  // Secondary attention region
  const cx2 = cx - W * 0.15;
  const cy2 = cy + H * 0.1;
  const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, W * 0.18);
  g2.addColorStop(0, 'rgba(255,80,0,0.5)');
  g2.addColorStop(0.5, 'rgba(0,160,255,0.25)');
  g2.addColorStop(1, 'rgba(0,80,255,0.0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);
}
