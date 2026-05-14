'use client';

const cards = [
  {
    icon: '🧬',
    title: 'Breed Support',
    text: 'Trained on CSR2 and Pure Mysore (Karnataka). Female pupae are 0.05–0.15g heavier with a broader mid-segment.',
  },
  {
    icon: '👁️',
    title: 'Grad-CAM Explainability',
    text: 'Heatmap overlay shows which region the model attended to — enabling worker trust and error diagnosis.',
  },
  {
    icon: '⚡',
    title: 'Low Confidence Flag',
    text: 'Any prediction below 70% confidence is flagged for manual review — preventing wrong-sex pairings downstream.',
  },
];

export function InfoCards() {
  return (
    <div className="relative z-10 max-w-[1100px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      {cards.map((card) => (
        <div
          key={card.title}
          className="p-3.5 rounded-[10px] border"
          style={{
            background: '#0E1A18',
            borderColor: 'rgba(0,200,150,0.08)',
          }}
        >
          <div className="text-[22px] mb-2">{card.icon}</div>
          <div className="text-[13px] font-bold mb-1">{card.title}</div>
          <div className="text-[12px] text-[#3D6B60] leading-relaxed">
            {card.text}
          </div>
        </div>
      ))}
    </div>
  );
}
