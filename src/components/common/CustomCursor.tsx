import React, { useEffect, useState } from "react";

const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (isMobile) return;
    let animationFrameId: number;

    const updateMousePosition = (e: MouseEvent) => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        if (!isVisible) setIsVisible(true);
      });
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.closest("nav")
      ) {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.target === document.body) {
        setIsVisible(false);
      }
    };

    const interactiveElements = document.querySelectorAll(
      "a, button, nav a, nav button, [role='button']"
    );

    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter as EventListener);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    window.addEventListener("mousemove", updateMousePosition);
    document.addEventListener("mouseleave", handleMouseOut);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", updateMousePosition);
      document.removeEventListener("mouseleave", handleMouseOut);
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter as EventListener);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, [isVisible, isMobile]);

  if (isMobile || !isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
        transform: "translate(-50%, -50%)",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        className="rounded-full bg-amber-600 dark:bg-amber-500 opacity-70"
        style={{
          width: isHovering ? "32px" : "12px",
          height: isHovering ? "32px" : "12px",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
};

export default CustomCursor;
