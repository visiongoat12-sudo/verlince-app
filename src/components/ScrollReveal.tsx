import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerIndex?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  distance?: number;
  durationMs?: number;
  delayMs?: number;
  className?: string;
  threshold?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  staggerIndex = 0,
  direction = 'up',
  distance = 24,
  durationMs = 600,
  delayMs,
  className = '',
  threshold = 0.1,
  style,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  const effectiveDelay = delayMs !== undefined ? delayMs : staggerIndex * 100;

  useEffect(() => {
    const el = domRef.current;
    if (!el) return;

    let unmounted = false;

    const checkVisibility = () => {
      if (unmounted || !domRef.current) return;
      const rect = domRef.current.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh + 40 && rect.bottom > -40) {
        setIsVisible(true);
      }
    };

    // If already in viewport on mount, animate in smoothly
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh && rect.bottom > 0) {
      const raf = requestAnimationFrame(() => {
        if (!unmounted) setIsVisible(true);
      });
      return () => {
        unmounted = true;
        cancelAnimationFrame(raf);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(el);

    // Capture scroll listener as backup for scrollable container elements
    window.addEventListener('scroll', checkVisibility, { capture: true, passive: true });

    return () => {
      unmounted = true;
      observer.disconnect();
      window.removeEventListener('scroll', checkVisibility, { capture: true });
    };
  }, [threshold]);

  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0) scale(0.98)`;
      case 'down':
        return `translate3d(0, -${distance}px, 0) scale(0.98)`;
      case 'left':
        return `translate3d(${distance}px, 0, 0)`;
      case 'right':
        return `translate3d(-${distance}px, 0, 0)`;
      case 'scale':
        return 'scale(0.94)';
      default:
        return `translate3d(0, ${distance}px, 0) scale(0.98)`;
    }
  };

  return (
    <div
      ref={domRef}
      className={`transform-gpu will-change-transform ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : getInitialTransform(),
        filter: isVisible ? 'blur(0px)' : 'blur(6px)',
        transition: `opacity ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${effectiveDelay}ms, transform ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${effectiveDelay}ms, filter ${durationMs}ms cubic-bezier(0.16, 1, 0.3, 1) ${effectiveDelay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};
