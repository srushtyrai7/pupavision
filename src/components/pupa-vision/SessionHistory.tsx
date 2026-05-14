'use client';

import { HistoryEntry } from '@/lib/pupa-vision/types';

interface SessionHistoryProps {
  history: HistoryEntry[];
}

export function SessionHistory({ history }: SessionHistoryProps) {
  return (
    <div
      className="rounded-[10px] border overflow-hidden md:col-span-2"
      style={{
        background: '#0E1A18',
        borderColor: 'rgba(0,200,150,0.18)',
      }}
    >
      {/* Panel Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2.5"
        style={{ borderColor: 'rgba(0,200,150,0.08)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
          style={{ background: '#3D1209' }}
        >
          🕒
        </div>
        <div>
          <div className="text-sm font-bold">Session History</div>
          <div className="font-mono text-[11px] text-[#3D6B60]">
            All classifications this session
          </div>
        </div>
      </div>

      <div className="p-5">
        {history.length === 0 ? (
          <div className="text-[13px] text-[#3D6B60] font-mono">
            No classifications yet.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {history.map((entry, i) => {
              const cls = entry.result.flagged
                ? 'unsure'
                : entry.result.label.toLowerCase();
              const lbl = entry.result.flagged
                ? `⚠ ${(entry.result.conf * 100).toFixed(0)}%`
                : `${entry.result.label === 'Female' ? '♀' : '♂'} ${(entry.result.conf * 100).toFixed(0)}%`;

              const badgeColors: Record<string, { bg: string; color: string }> =
                {
                  female: {
                    bg: 'rgba(0,200,150,0.85)',
                    color: '#001A12',
                  },
                  male: {
                    bg: 'rgba(245,166,35,0.85)',
                    color: '#1A0E00',
                  },
                  unsure: {
                    bg: 'rgba(255,91,74,0.85)',
                    color: '#1A0300',
                  },
                };
              const bc = badgeColors[cls] || badgeColors.unsure;

              return (
                <div
                  key={i}
                  className="relative rounded-md overflow-hidden aspect-square cursor-pointer border-2 border-transparent transition-all hover:border-[#00C896]"
                >
                  <img
                    src={entry.src}
                    alt=""
                    className="w-full h-full object-cover block"
                  />
                  <div
                    className="absolute bottom-1 left-1 right-1 text-center font-mono text-[10px] font-bold px-1 py-[2px] rounded-[3px]"
                    style={{ background: bc.bg, color: bc.color }}
                  >
                    {lbl}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
