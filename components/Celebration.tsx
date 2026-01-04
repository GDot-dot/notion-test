import React, { useEffect, useState } from 'react';
import { Sparkles, Heart, Star } from 'lucide-react';

export const Celebration: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, size: number, type: string, color: string }[]>([]);

  useEffect(() => {
    // 產生隨機粒子
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (30 - 10) + 10,
      type: ['heart', 'star', 'sparkle'][Math.floor(Math.random() * 3)],
      color: ['#ff85b2', '#ffdeeb', '#fff5f8', '#ffd1dc'][Math.floor(Math.random() * 4)]
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {/* 粒子噴發特效 */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-celebrate-particle opacity-0"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            color: p.color,
            '--travel-x': `${(Math.random() - 0.5) * 400}px`,
            '--travel-y': `${(Math.random() - 0.5) * 400}px`,
            animationDelay: `${Math.random() * 0.5}s`
          } as React.CSSProperties}
        >
          {p.type === 'heart' && <Heart size={p.size} fill="currentColor" />}
          {p.type === 'star' && <Star size={p.size} fill="currentColor" />}
          {p.type === 'sparkle' && <Sparkles size={p.size} />}
        </div>
      ))}

      {/* 中央提示文字 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 dark:bg-kuromi-card/90 backdrop-blur-md px-10 py-6 rounded-[40px] shadow-2xl border-4 border-pink-200 dark:border-pink-900 animate-celebrate-popup text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-2xl font-black text-pink-500 dark:text-pink-300 tracking-wider">
            太棒了！任務達成 🍓
          </h2>
          <p className="text-pink-300 dark:text-gray-400 font-bold text-sm mt-1">
            你又往目標邁進了一大步囉！
          </p>
        </div>
      </div>

      <style>{`
        @keyframes celebrate-particle {
          0% {
            transform: translate(0, 0) scale(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--travel-x), var(--travel-y)) scale(1.5) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes celebrate-popup {
          0% { transform: scale(0.5) rotate(-5deg); opacity: 0; }
          20% { transform: scale(1.1) rotate(3deg); opacity: 1; }
          80% { transform: scale(1) rotate(0deg); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        .animate-celebrate-particle {
          animation: celebrate-particle 1.5s ease-out forwards;
        }
        .animate-celebrate-popup {
          animation: celebrate-popup 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};