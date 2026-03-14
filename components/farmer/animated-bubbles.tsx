"use client";

import { useEffect, useRef } from "react";

interface Bubble {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  dx: number;
  dy: number;
  dAlpha: number;
}

// Logo-derived palette (agro-green, agro-green-dark, agro-orange, agro-cream)
const BUBBLE_COLORS = [
  "rgba(58, 130, 80",   // agro-green  ~oklch(0.55 0.15 145)
  "rgba(40, 104, 60",   // agro-green-dark
  "rgba(210, 130, 40",  // agro-orange ~oklch(0.7 0.18 60)
  "rgba(180, 210, 90",  // warm yellow-green accent
  "rgba(255, 255, 240", // agro-cream tint
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function createBubble(width: number, height: number): Bubble {
  const radius = randomBetween(20, 90);
  const colorBase = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
  const alpha = randomBetween(0.04, 0.12);
  return {
    x: randomBetween(radius, width - radius),
    y: randomBetween(radius, height - radius),
    radius,
    color: colorBase,
    alpha,
    dx: randomBetween(-0.25, 0.25),
    dy: randomBetween(-0.3, -0.05), // mostly drifting upward
    dAlpha: randomBetween(-0.0002, 0.0002),
  };
}

export function AnimatedBubbles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const BUBBLE_COUNT = 28;
    let bubbles: Bubble[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      bubbles = Array.from({ length: BUBBLE_COUNT }, () =>
        createBubble(canvas.width, canvas.height)
      );
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const b of bubbles) {
        // Drift
        b.x += b.dx;
        b.y += b.dy;
        b.alpha += b.dAlpha;

        // Clamp alpha
        if (b.alpha < 0.03) { b.alpha = 0.03; b.dAlpha *= -1; }
        if (b.alpha > 0.14) { b.alpha = 0.14; b.dAlpha *= -1; }

        // Wrap around edges
        if (b.x + b.radius < 0) b.x = canvas.width + b.radius;
        if (b.x - b.radius > canvas.width) b.x = -b.radius;
        if (b.y + b.radius < 0) b.y = canvas.height + b.radius;
        if (b.y - b.radius > canvas.height) b.y = -b.radius;

        // Draw bubble
        const gradient = ctx.createRadialGradient(
          b.x - b.radius * 0.3,
          b.y - b.radius * 0.3,
          b.radius * 0.1,
          b.x,
          b.y,
          b.radius
        );
        gradient.addColorStop(0, `${b.color}, ${b.alpha * 1.6})`);
        gradient.addColorStop(0.7, `${b.color}, ${b.alpha})`);
        gradient.addColorStop(1, `${b.color}, 0)`);

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Subtle rim highlight
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${b.color}, ${b.alpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 1 }}
    />
  );
}
