'use client';

import { PROCESSING_STEPS } from '@/lib/pupa-vision/classify';

interface HeroSectionProps {
  pipelineStep: number;
}

export function HeroSection({ pipelineStep }: HeroSectionProps) {
  const steps = [
    { num: 1, label: 'Image Input', tag: 'Camera / Upload' },
    { num: 2, label: 'Preprocessing', tag: 'CLAHE · Crop' },
    { num: 3, label: 'HOG Feature Extraction', tag: '9×8×8 cells' },
    { num: 4, label: 'MobileNetV2 Inference', tag: 'TFLite' },
    { num: 5, label: 'Grad-CAM Heatmap', tag: 'Conv_1' },
    { num: 6, label: 'Result + Flag', tag: '≥70% threshold' },
  ];

  return (
    <section className="relative z-10 max-w-[1100px] mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
      <div>
        <h1 className="text-[clamp(30px,4vw,46px)] font-bold leading-[1.1] tracking-tight">
          Automated{' '}
          <span className="text-[#00C896]">Silkworm Pupa</span> Sex
          Identification
        </h1>
        <p className="mt-4 text-[#7ABFB0] text-[15px] leading-relaxed">
          Use your live camera or upload a photo of a Bombyx mori pupa.
          PupaVision analyses shape, segment ratio, and texture features to
          predict Male or Female — with a confidence score and Grad-CAM
          attention overlay.
        </p>
        <div className="flex gap-6 mt-7 flex-wrap">
          <div>
            <div className="font-mono text-[26px] font-bold text-[#00C896]">
              95%+
            </div>
            <div className="text-[11px] text-[#3D6B60] uppercase tracking-wider mt-0.5">
              Target Accuracy
            </div>
          </div>
          <div>
            <div className="font-mono text-[26px] font-bold text-[#00C896]">
              &lt;2s
            </div>
            <div className="text-[11px] text-[#3D6B60] uppercase tracking-wider mt-0.5">
              Inference Time
            </div>
          </div>
          <div>
            <div className="font-mono text-[26px] font-bold text-[#00C896]">
              CSR2 + PM
            </div>
            <div className="text-[11px] text-[#3D6B60] uppercase tracking-wider mt-0.5">
              Breed Support
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div
        className="rounded-[10px] p-5 border"
        style={{
          background: '#0E1A18',
          borderColor: 'rgba(0,200,150,0.18)',
        }}
      >
        <div className="font-mono text-[11px] text-[#3D6B60] tracking-wider uppercase mb-3.5">
          Classification Pipeline
        </div>
        <div className="flex flex-col gap-2">
          {steps.map((step) => {
            const isActive = pipelineStep >= step.num;
            return (
              <div
                key={step.num}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border"
                style={{
                  background: isActive ? '#152420' : '#152420',
                  borderColor: isActive
                    ? 'rgba(0,200,150,0.18)'
                    : 'rgba(0,200,150,0.08)',
                }}
              >
                <span
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center font-mono text-[11px] flex-shrink-0 border"
                  style={{
                    background: isActive ? '#00C896' : '#003D2E',
                    borderColor: '#00C896',
                    color: isActive ? '#09100F' : '#00C896',
                  }}
                >
                  {step.num}
                </span>
                <span
                  className={`flex-1 text-[13px] ${
                    isActive ? 'text-[#E8F5F2]' : 'text-[#7ABFB0]'
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded border"
                  style={{
                    background: '#09100F',
                    borderColor: isActive
                      ? '#00C896'
                      : 'rgba(0,200,150,0.08)',
                    color: isActive ? '#00C896' : '#3D6B60',
                  }}
                >
                  {step.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
