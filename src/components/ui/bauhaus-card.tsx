"use client";
import React, { useEffect, useRef } from "react";

const BAUHAUS_CARD_STYLES = `
.bauhaus-card {
  position: relative;
  z-index: 555;
  width: 100%;
  display: grid;
  place-content: center;
  place-items: center;
  text-align: center;
  box-shadow: 1px 12px 25px rgb(0,0,0/78%);
  border-radius: var(--card-radius, 20px);
  border: var(--card-border-width, 2px) solid transparent;
  --rotation: 4.2rad;
  background-image:
    linear-gradient(var(--card-bg, hsl(var(--card))), var(--card-bg, hsl(var(--card)))),
    linear-gradient(calc(var(--rotation,4.2rad)), var(--card-accent, hsl(var(--primary))) 0, var(--card-bg, hsl(var(--card))) 30%, transparent 80%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  color: hsl(var(--card-foreground));
  padding: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.bauhaus-card::before {
  position: absolute;
  content: "";
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: var(--card-radius, 20px);
  z-index: -1;
  border: 0.155rem solid transparent;
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
}
`;

function injectBauhausCardStyles() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("bauhaus-card-styles")) {
    const style = document.createElement("style");
    style.id = "bauhaus-card-styles";
    style.innerHTML = BAUHAUS_CARD_STYLES;
    document.head.appendChild(style);
  }
}

export interface BauhausCardProps {
  children: React.ReactNode;
  borderRadius?: string;
  backgroundColor?: string;
  accentColor?: string;
  borderWidth?: string;
  className?: string;
}

export const BauhausCard: React.FC<BauhausCardProps> = ({
  children,
  borderRadius = "1rem",
  backgroundColor = "hsl(var(--card))",
  accentColor = "hsl(var(--primary))",
  borderWidth = "2px",
  className = "",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectBauhausCardStyles();
    const card = cardRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const angle = Math.atan2(-x, y);
        card.style.setProperty("--rotation", angle + "rad");
      }
    };
    if (card) {
      card.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      if (card) {
        card.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  return (
    <div
      className={`bauhaus-card ${className}`}
      ref={cardRef}
      style={{
        '--card-bg': backgroundColor,
        '--card-accent': accentColor,
        '--card-radius': borderRadius,
        '--card-border-width': borderWidth,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};