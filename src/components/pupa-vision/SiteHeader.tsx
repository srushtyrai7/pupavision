'use client';

export function SiteHeader() {
  return (
    <header className="relative z-10 max-w-[1100px] mx-auto px-6 py-7 border-b border-[rgba(0,200,150,0.18)] flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3.5">
        <div
          className="w-11 h-11 flex items-center justify-center text-[22px] rounded-[10px]"
          style={{ background: '#003D2E', border: '1.5px solid #00C896' }}
        >
          🔬
        </div>
        <div>
          <div className="font-mono text-xl font-bold text-[#00C896] tracking-tight">
            PupaVision
          </div>
          <div className="font-mono text-[11px] text-[#3D6B60] tracking-[1.5px] uppercase">
            Team Pentrix · AY 2025–26
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="font-mono text-[11px] px-2.5 py-1 rounded-full border"
          style={{
            borderColor: '#00C896',
            color: '#00C896',
            background: '#003D2E',
          }}
        >
          v3.0 — Live Camera
        </span>
        <span
          className="font-mono text-[11px] px-2.5 py-1 rounded-full border"
          style={{
            borderColor: '#F5A623',
            color: '#F5A623',
            background: '#3D2900',
          }}
        >
          Karnataka Sericulture
        </span>
        <span className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-[rgba(0,200,150,0.18)] text-[#7ABFB0] tracking-wide">
          MobileNetV2 Simulation
        </span>
      </div>
    </header>
  );
}
