import React, { useEffect, useState } from 'react';

interface ScrollProgressBarProps {
  containerSelector?: string;
  className?: string;
}

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({
  containerSelector,
  className = '',
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const calculateProgress = () => {
      let progress = 0;

      if (containerSelector) {
        const container = document.querySelector(containerSelector) as HTMLElement | null;
        if (container) {
          const maxScroll = container.scrollHeight - container.clientHeight;
          progress = maxScroll > 0 ? (container.scrollTop / maxScroll) * 100 : 0;
          setScrollProgress(Math.min(100, Math.max(0, progress)));
          return;
        }
      }

      // Check active scrollable containers in the DOM (e.g. main scroll areas)
      const scrollContainers = document.querySelectorAll(
        '#marketplace-scroll-container, #profile-scroll-container, #admin-scroll-container, main, [data-scroll-container]'
      );
      for (let i = 0; i < scrollContainers.length; i++) {
        const el = scrollContainers[i] as HTMLElement;
        if (el && el.scrollHeight > el.clientHeight && el.clientHeight > 0) {
          const maxScroll = el.scrollHeight - el.clientHeight;
          if (maxScroll > 0 && el.scrollTop > 0) {
            progress = (el.scrollTop / maxScroll) * 100;
            setScrollProgress(Math.min(100, Math.max(0, progress)));
            return;
          }
        }
      }

      // Fallback to window / document element scroll
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = docHeight - windowHeight;
      progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    const handleScroll = (e?: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (e && e.target && (e.target as HTMLElement).scrollTop !== undefined) {
            const target = e.target as HTMLElement;
            if (target.scrollHeight > target.clientHeight) {
              const maxScroll = target.scrollHeight - target.clientHeight;
              const p = maxScroll > 0 ? (target.scrollTop / maxScroll) * 100 : 0;
              setScrollProgress(Math.min(100, Math.max(0, p)));
              ticking = false;
              return;
            }
          }
          calculateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Attach with capture: true so scroll events from any nested scrollable container are captured
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    calculateProgress();

    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [containerSelector]);

  return (
    <div
      id="verilance-scroll-progress-bar"
      className={`fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-transparent pointer-events-none transform-gpu will-change-transform ${className}`}
    >
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(6,182,212,0.8),0_0_20px_rgba(168,85,247,0.5)] transform-gpu will-change-transform"
        style={{
          width: `${scrollProgress}%`,
        }}
      />
    </div>
  );
};

