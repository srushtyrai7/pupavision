'use client';

const teamMembers = [
  'Tanishka S · 4VV25CI170',
  'Vinay H · 4VV25CI184',
  'Supriya B · 4VV25CI166',
  'Srushty Rai D.R · 4VV25CI163',
  'Venugopal · 4VV25CI183',
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 max-w-[1100px] mx-auto px-6 py-6 border-t border-[rgba(0,200,150,0.08)] flex items-center justify-between flex-wrap gap-3 mt-auto">
      <div className="font-mono text-[12px] text-[#3D6B60]">
        PupaVision v3.0 · Team Pentrix · AY 2025–26
      </div>
      <div className="flex gap-2 flex-wrap">
        {teamMembers.map((member) => (
          <span
            key={member}
            className="font-mono text-[11px] px-2.5 py-1 rounded-full border border-[rgba(0,200,150,0.18)] text-[#7ABFB0]"
          >
            {member}
          </span>
        ))}
      </div>
    </footer>
  );
}
