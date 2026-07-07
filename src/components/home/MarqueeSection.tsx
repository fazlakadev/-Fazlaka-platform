"use client";

interface MarqueeItem {
  text: string;
  icon: string;
}

export default function MarqueeSection({ items }: { items: MarqueeItem[] }) {
  if (!items.length) return null;

  // نكرّر القائمة مرّتين لإنشاء حركة لا نهائية ناعمة
  const doubled = [...items, ...items];

  return (
    <section className="relative py-10 bg-[#030712] border-y border-white/5 overflow-hidden">
      {/* mask لتلاشي الأطراف */}
      <div className="relative overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {doubled.map((item, i) => (
            <div key={i} className="flex items-center gap-3 mx-8 shrink-0">
              <span className="text-2xl text-cyan-400/80">{item.icon}</span>
              <span className="text-2xl lg:text-3xl font-bold text-white/80 hover:text-white transition-colors">
                {item.text}
              </span>
              <span className="text-cyan-500/40 text-2xl ms-6">✦</span>
            </div>
          ))}
        </div>

        {/* تلاشي الجانبين */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#030712] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#030712] to-transparent z-10" />
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
