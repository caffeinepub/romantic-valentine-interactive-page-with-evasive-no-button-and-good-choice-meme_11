import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import HeartBurst from '@/components/HeartBurst';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export default function ValentinePage() {
  const [answered, setAnswered] = useState(false);
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });
  const [heartBurstPosition, setHeartBurstPosition] = useState<{ x: number; y: number } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Helper function to check if two rectangles overlap with a gap
  const rectsOverlap = useCallback((rect1: DOMRect, rect2: DOMRect, gap: number = 15): boolean => {
    return !(
      rect1.right + gap < rect2.left ||
      rect1.left - gap > rect2.right ||
      rect1.bottom + gap < rect2.top ||
      rect1.top - gap > rect2.bottom
    );
  }, []);

  // Helper function to get the "No" button's rect at a given transform position
  const getNoButtonRectAtPosition = useCallback((x: number, y: number): DOMRect | null => {
    if (!noButtonRef.current || !containerRef.current) return null;

    const container = containerRef.current.getBoundingClientRect();
    const button = noButtonRef.current;
    
    // Get the button's natural dimensions (not affected by transform)
    const buttonWidth = button.offsetWidth;
    const buttonHeight = button.offsetHeight;

    // Calculate the button's base position (center of container + offset)
    const baseX = container.left + container.width / 2 + 120;
    const baseY = container.top + container.height / 2 - 28;

    // Calculate the button's position with the given transform
    const left = baseX + x - buttonWidth / 2;
    const top = baseY + y - buttonHeight / 2;

    return new DOMRect(left, top, buttonWidth, buttonHeight);
  }, []);

  const moveNoButton = useCallback(() => {
    if (!containerRef.current || !noButtonRef.current || !yesButtonRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const button = noButtonRef.current;
    const yesButton = yesButtonRef.current.getBoundingClientRect();

    // Get button's natural dimensions
    const buttonWidth = button.offsetWidth;
    const buttonHeight = button.offsetHeight;

    // Calculate the button's base position
    const baseX = container.left + container.width / 2 + 120;
    const baseY = container.top + container.height / 2 - 28;

    // Calculate safe bounds for translation (with padding)
    const padding = 20;
    const minX = container.left + padding - baseX + buttonWidth / 2;
    const maxX = container.right - padding - baseX - buttonWidth / 2;
    const minY = container.top + padding - baseY + buttonHeight / 2;
    const maxY = container.bottom - padding - baseY - buttonHeight / 2;

    // Try to find a non-overlapping position (max 30 attempts)
    let newX = 0;
    let newY = 0;
    let attempts = 0;
    const maxAttempts = 30;
    const minDistance = 80; // Minimum distance to move

    while (attempts < maxAttempts) {
      // Generate random position within safe bounds
      const rangeX = Math.max(0, maxX - minX);
      const rangeY = Math.max(0, maxY - minY);
      newX = minX + Math.random() * rangeX;
      newY = minY + Math.random() * rangeY;

      // Ensure the new position is different from current (move at least minDistance)
      const distance = Math.sqrt(
        Math.pow(newX - noButtonPosition.x, 2) + Math.pow(newY - noButtonPosition.y, 2)
      );
      
      if (distance < minDistance) {
        // If too close, move in a random direction by at least minDistance
        const angle = Math.random() * Math.PI * 2;
        const moveDistance = minDistance + Math.random() * 100;
        newX = noButtonPosition.x + Math.cos(angle) * moveDistance;
        newY = noButtonPosition.y + Math.sin(angle) * moveDistance;
        
        // Clamp to safe bounds
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
      }

      // Check if this position would overlap with the "Yes" button
      const noButtonRect = getNoButtonRectAtPosition(newX, newY);
      if (noButtonRect && !rectsOverlap(noButtonRect, yesButton, 20)) {
        // Found a non-overlapping position
        break;
      }

      attempts++;
    }

    // If we couldn't find a non-overlapping position after max attempts,
    // use a deterministic fallback position (opposite side of Yes button)
    if (attempts >= maxAttempts) {
      const yesCenterX = yesButton.left + yesButton.width / 2;
      const yesCenterY = yesButton.top + yesButton.height / 2;
      
      // Move to opposite side of container from Yes button
      const containerCenterX = container.left + container.width / 2;
      const containerCenterY = container.top + container.height / 2;
      
      const directionX = containerCenterX - yesCenterX;
      const directionY = containerCenterY - yesCenterY;
      const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
      
      if (magnitude > 0) {
        const normalizedX = directionX / magnitude;
        const normalizedY = directionY / magnitude;
        
        newX = normalizedX * 180;
        newY = normalizedY * 180;
        
        // Clamp to safe bounds
        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
      }
    }

    setNoButtonPosition({ x: newX, y: newY });
  }, [getNoButtonRectAtPosition, rectsOverlap, noButtonPosition]);

  // Clamp button position when container resizes
  const clampButtonPosition = useCallback(() => {
    if (!containerRef.current || !noButtonRef.current || !yesButtonRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const button = noButtonRef.current;
    const yesButton = yesButtonRef.current.getBoundingClientRect();

    // Get button's natural dimensions
    const buttonWidth = button.offsetWidth;
    const buttonHeight = button.offsetHeight;

    // Calculate the button's base position
    const baseX = container.left + container.width / 2 + 120;
    const baseY = container.top + container.height / 2 - 28;

    // Calculate safe bounds
    const padding = 20;
    const minX = container.left + padding - baseX + buttonWidth / 2;
    const maxX = container.right - padding - baseX - buttonWidth / 2;
    const minY = container.top + padding - baseY + buttonHeight / 2;
    const maxY = container.bottom - padding - baseY - buttonHeight / 2;

    // Clamp current position to safe bounds
    setNoButtonPosition((prev) => {
      let clampedX = Math.max(minX, Math.min(maxX, prev.x));
      let clampedY = Math.max(minY, Math.min(maxY, prev.y));

      // Check if clamped position overlaps with Yes button
      const noButtonRect = getNoButtonRectAtPosition(clampedX, clampedY);
      if (noButtonRect && rectsOverlap(noButtonRect, yesButton, 20)) {
        // If overlapping after clamp, move away from Yes button
        const yesCenterX = yesButton.left + yesButton.width / 2;
        const yesCenterY = yesButton.top + yesButton.height / 2;
        const noCenterX = noButtonRect.left + noButtonRect.width / 2;
        const noCenterY = noButtonRect.top + noButtonRect.height / 2;
        
        const directionX = noCenterX - yesCenterX;
        const directionY = noCenterY - yesCenterY;
        const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (magnitude > 0) {
          const normalizedX = directionX / magnitude;
          const normalizedY = directionY / magnitude;
          
          // Move away by a safe distance
          const moveDistance = 180;
          clampedX = prev.x + normalizedX * moveDistance;
          clampedY = prev.y + normalizedY * moveDistance;
          
          // Re-clamp to safe bounds
          clampedX = Math.max(minX, Math.min(maxX, clampedX));
          clampedY = Math.max(minY, Math.min(maxY, clampedY));
        }
      }

      return { x: clampedX, y: clampedY };
    });
  }, [getNoButtonRectAtPosition, rectsOverlap]);

  // Handle viewport resize and orientation change
  useEffect(() => {
    if (!isInitialized) return;

    const handleResize = () => {
      clampButtonPosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Also use ResizeObserver for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [clampButtonPosition, isInitialized]);

  // Initialize No button position on mount to avoid initial overlap
  useLayoutEffect(() => {
    if (!containerRef.current || !noButtonRef.current || !yesButtonRef.current) return;

    // Use requestAnimationFrame to ensure layout is complete
    const frameId = requestAnimationFrame(() => {
      if (!containerRef.current || !noButtonRef.current || !yesButtonRef.current) return;

      const container = containerRef.current.getBoundingClientRect();
      const yesButton = yesButtonRef.current.getBoundingClientRect();
      const button = noButtonRef.current;

      const buttonWidth = button.offsetWidth;
      const buttonHeight = button.offsetHeight;

      const baseX = container.left + container.width / 2 + 120;
      const baseY = container.top + container.height / 2 - 28;

      const padding = 20;
      const minX = container.left + padding - baseX + buttonWidth / 2;
      const maxX = container.right - padding - baseX - buttonWidth / 2;
      const minY = container.top + padding - baseY + buttonHeight / 2;
      const maxY = container.bottom - padding - baseY - buttonHeight / 2;

      // Check if initial position (0, 0) overlaps
      const initialRect = getNoButtonRectAtPosition(0, 0);
      if (initialRect && rectsOverlap(initialRect, yesButton, 20)) {
        // Move to a safe initial position
        // Try positions to the right, left, top, and bottom
        const positions = [
          { x: 250, y: 0 },   // Far right
          { x: -250, y: 0 },  // Far left
          { x: 0, y: 150 },   // Below
          { x: 0, y: -150 },  // Above
        ];

        for (const pos of positions) {
          const clampedX = Math.max(minX, Math.min(maxX, pos.x));
          const clampedY = Math.max(minY, Math.min(maxY, pos.y));
          const testRect = getNoButtonRectAtPosition(clampedX, clampedY);
          
          if (testRect && !rectsOverlap(testRect, yesButton, 20)) {
            setNoButtonPosition({ x: clampedX, y: clampedY });
            setIsInitialized(true);
            return;
          }
        }

        // Fallback: use the first clamped position
        const clampedX = Math.max(minX, Math.min(maxX, 250));
        const clampedY = Math.max(minY, Math.min(maxY, 0));
        setNoButtonPosition({ x: clampedX, y: clampedY });
      }
      
      setIsInitialized(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, [getNoButtonRectAtPosition, rectsOverlap]);

  const handleYesPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Trigger heart burst animation instantly on pointer down
    if (!prefersReducedMotion) {
      setHeartBurstPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleYesClick = () => {
    // For reduced motion, add a subtle scale effect to the button
    if (prefersReducedMotion && yesButtonRef.current) {
      yesButtonRef.current.classList.add('yes-button-reduced-motion');
      setTimeout(() => {
        yesButtonRef.current?.classList.remove('yes-button-reduced-motion');
      }, 300);
    }
    
    // Transition to success view after a brief delay
    setTimeout(() => {
      setAnswered(true);
    }, prefersReducedMotion ? 100 : 600);
  };

  if (answered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-white p-4">
        <div className="text-center space-y-8 animate-in fade-in duration-700">
          <div className="space-y-4">
            <Heart className="w-20 h-20 mx-auto text-rose-500 fill-rose-500 animate-pulse" />
            <h1 className="text-4xl md:text-6xl font-bold text-rose-600">
              Good choice ❤️
            </h1>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <img
              src="/assets/generated/valentine-good-choice-meme.dim_1200x1200.png"
              alt="Good choice meme"
              className="w-full h-auto rounded-3xl shadow-2xl border-4 border-rose-200"
            />
          </div>
        </div>

        <footer className="fixed bottom-4 left-0 right-0 text-center text-sm text-rose-400">
          <p>
            © {new Date().getFullYear()} · Built with <Heart className="inline w-4 h-4 fill-rose-400" /> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'valentine-app'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose-600 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-white p-4 relative overflow-hidden"
    >
      {/* Decorative hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Heart className="absolute top-10 left-10 w-8 h-8 text-rose-200 fill-rose-200 opacity-40" />
        <Heart className="absolute top-20 right-20 w-12 h-12 text-pink-200 fill-pink-200 opacity-30" />
        <Heart className="absolute bottom-32 left-20 w-10 h-10 text-rose-200 fill-rose-200 opacity-35" />
        <Heart className="absolute bottom-20 right-32 w-6 h-6 text-pink-200 fill-pink-200 opacity-40" />
      </div>

      {/* Heart burst animation overlay */}
      {heartBurstPosition && (
        <HeartBurst
          x={heartBurstPosition.x}
          y={heartBurstPosition.y}
          onComplete={() => setHeartBurstPosition(null)}
        />
      )}

      <div className="text-center space-y-12 z-10 max-w-2xl mx-auto">
        {/* Main question */}
        <div className="space-y-6">
          <Heart className="w-24 h-24 mx-auto text-rose-500 fill-rose-500 animate-pulse" />
          <h1 className="text-5xl md:text-7xl font-bold text-rose-600 leading-tight">
            Will you be my Valentine?
          </h1>
        </div>

        {/* Buttons container */}
        <div className="relative min-h-[200px] flex items-center justify-center">
          {/* Yes button - static position */}
          <Button
            ref={yesButtonRef}
            onPointerDown={handleYesPointerDown}
            onClick={handleYesClick}
            size="lg"
            className="bg-rose-500 hover:bg-rose-600 text-white text-2xl px-16 py-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 font-bold"
          >
            Yes! 💕
          </Button>

          {/* No button - moves on hover/touch */}
          <Button
            ref={noButtonRef}
            onMouseEnter={moveNoButton}
            onTouchStart={(e) => {
              e.preventDefault();
              moveNoButton();
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              moveNoButton();
            }}
            onClick={(e) => {
              e.preventDefault();
              moveNoButton();
            }}
            size="lg"
            variant="outline"
            className="absolute bg-white hover:bg-white text-rose-400 border-2 border-rose-300 text-2xl px-16 py-8 rounded-full shadow-lg font-bold transition-all duration-200 cursor-pointer touch-none"
            style={{
              transform: `translate(${noButtonPosition.x}px, ${noButtonPosition.y}px)`,
              left: '50%',
              top: '50%',
              marginLeft: '120px',
              marginTop: '-28px',
            }}
          >
            No
          </Button>
        </div>

        <p className="text-rose-400 text-lg italic">
          Choose wisely... 💖
        </p>
      </div>

      <footer className="fixed bottom-4 left-0 right-0 text-center text-sm text-rose-400">
        <p>
          © {new Date().getFullYear()} · Built with <Heart className="inline w-4 h-4 fill-rose-400" /> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== 'undefined' ? window.location.hostname : 'valentine-app'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-rose-600 transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
