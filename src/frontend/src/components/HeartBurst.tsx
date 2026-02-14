import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface HeartBurstProps {
  x: number;
  y: number;
  onComplete: () => void;
}

export default function HeartBurst({ x, y, onComplete }: HeartBurstProps) {
  const [hearts] = useState(() => {
    // Generate 8-12 hearts with random properties
    const count = 8 + Math.floor(Math.random() * 5);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5,
      distance: 60 + Math.random() * 40,
      size: 16 + Math.random() * 16,
      delay: Math.random() * 100,
      duration: 600 + Math.random() * 200,
    }));
  });

  useEffect(() => {
    // Clean up after the longest animation completes
    const maxDuration = Math.max(...hearts.map(h => h.duration + h.delay));
    const timer = setTimeout(() => {
      onComplete();
    }, maxDuration);

    return () => clearTimeout(timer);
  }, [hearts, onComplete]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        left: 0,
        top: 0,
      }}
    >
      {hearts.map((heart) => {
        const endX = x + Math.cos(heart.angle) * heart.distance;
        const endY = y + Math.sin(heart.angle) * heart.distance;

        return (
          <div
            key={heart.id}
            className="absolute heart-burst-particle"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${heart.size}px`,
              height: `${heart.size}px`,
              animationDelay: `${heart.delay}ms`,
              animationDuration: `${heart.duration}ms`,
              '--end-x': `${endX - x}px`,
              '--end-y': `${endY - y}px`,
            } as React.CSSProperties}
          >
            <Heart
              className="w-full h-full text-rose-500 fill-rose-500"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(244, 63, 94, 0.3))',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
