import React, { useEffect, useState } from 'react';

interface ParallaxBackgroundProps {
  containerSelector?: string;
}

export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({
  containerSelector,
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollY = (e?: Event) => {
      let top = 0;

      if (e && e.target && (e.target as HTMLElement).scrollTop !== undefined) {
        top = (e.target as HTMLElement).scrollTop;
      } else if (containerSelector) {
        const container = document.querySelector(containerSelector) as HTMLElement | null;
        if (container) top = container.scrollTop;
      } else {
        const scrollContainers = document.querySelectorAll(
          '#marketplace-scroll-container, #profile-scroll-container, #admin-scroll-container, main'
        );
        for (let i = 0; i < scrollContainers.length; i++) {
          const el = scrollContainers[i] as HTMLElement;
          if (el && el.scrollTop > 0) {
            top = el.scrollTop;
            break;
          }
        }
        if (top === 0) {
          top = window.scrollY || document.documentElement.scrollTop;
        }
      }
      setScrollY(top);
    };

    const handleScroll = (e?: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollY(e);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    updateScrollY();

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [containerSelector]);

  return (
    <div 
      id="verilance-parallax-background"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none transform-gpu"
    >
      {/* Subtle Cyber Grid Lines with slow parallax vertical motion */}
      <div
        className="absolute inset-0 opacity-[0.035] transform-gpu will-change-transform"
        style={{
          transform: `translate3d(0, ${-scrollY * 0.05}px, 0)`,
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating Glowing Neon Spheres with multi-layer parallax */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] transform-gpu will-change-transform"
        style={{
          transform: `translate3d(0, ${scrollY * 0.1}px, 0)`,
        }}
      />
      <div
        className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-purple-600/10 blur-[140px] transform-gpu will-change-transform"
        style={{
          transform: `translate3d(0, ${-scrollY * 0.07}px, 0)`,
        }}
      />
      <div
        className="absolute top-2/3 -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px] transform-gpu will-change-transform"
        style={{
          transform: `translate3d(0, ${scrollY * 0.05}px, 0)`,
        }}
      />
    </div>
  );
};

