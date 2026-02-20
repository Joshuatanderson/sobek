"use client";

import { useEffect, useRef, useState } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], input, textarea, select, label, [data-clickable]";

// Cursor arrow shape — tip at (0,0), classic pointer silhouette
const ARROW_PATH = "M 1 1 L 1 16.5 L 5 13 L 8.5 19.5 L 11 18.5 L 7.5 12 L 13 11.5 Z";

type CursorState = "default" | "hover" | "active";

export function CustomCursor() {
  const arrowRef = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<CursorState>("default");
  const isHovering = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      if (arrowRef.current) {
        arrowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
      if (!visible) setVisible(true);

      const target = e.target as HTMLElement;
      isHovering.current = !!target.closest(INTERACTIVE_SELECTOR);
      if (state !== "active") {
        setState(isHovering.current ? "hover" : "default");
      }
    };

    const onDown = () => setState("active");
    const onUp = () => setState(isHovering.current ? "hover" : "default");
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    document.documentElement.style.cursor = "none";

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.documentElement.style.cursor = "";
    };
  }, [visible, state]);

  const styles = {
    default: { w: 18, h: 22, fill: "#cddfc5", stroke: "rgba(0,0,0,0.4)", filter: "none" },
    hover:   { w: 20, h: 24, fill: "#cddfc5", stroke: "rgba(0,0,0,0.3)", filter: "drop-shadow(0 0 6px rgba(205, 223, 197, 0.5))" },
    active:  { w: 16, h: 20, fill: "#e2eeda", stroke: "rgba(0,0,0,0.3)", filter: "drop-shadow(0 0 10px rgba(205, 223, 197, 0.6))" },
  }[state];

  return (
    <svg
      ref={arrowRef}
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      viewBox="0 0 14 21"
      fill="none"
      style={{
        opacity: visible ? 1 : 0,
        width: styles.w,
        height: styles.h,
        marginLeft: -styles.w * (1 / 14),
        marginTop: -styles.h * (1 / 21),
        filter: styles.filter,
        transition: "width 0.15s, height 0.15s, margin 0.15s, filter 0.15s, opacity 0.15s",
      }}
    >
      <path
        d={ARROW_PATH}
        fill={styles.fill}
        stroke={styles.stroke}
        strokeWidth="1"
        strokeLinejoin="round"
        style={{ transition: "fill 0.15s" }}
      />
    </svg>
  );
}
