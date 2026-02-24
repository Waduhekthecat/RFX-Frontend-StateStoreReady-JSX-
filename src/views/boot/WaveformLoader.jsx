import React from "react";

export function WaveformLoader({ progress01 = 0, height = 44 }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      const cssW = parent ? parent.clientWidth : 600;
      const cssH = height;

      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);

      // draw in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const rand = (seed) => {
      const x = Math.sin(seed * 999.123) * 10000;
      return x - Math.floor(x);
    };

    const draw = (t) => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : 600;
      const h = height;

      ctx.clearRect(0, 0, w, h);

      // outer frame
      roundRect(ctx, 0.5, 0.5, w - 1, h - 1, 999);
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // subtle “scan glow” around playhead
      const playX = Math.max(8, Math.min(w - 8, progress01 * w));
      const glow = ctx.createRadialGradient(playX, h / 2, 2, playX, h / 2, 28);
      glow.addColorStop(0, "rgba(255,255,255,0.18)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(playX - 40, 0, 80, h);

      // clip inside rounded rect
      ctx.save();
      roundRect(ctx, 1, 1, w - 2, h - 2, 999);
      ctx.clip();

      const time = t / 1000;
      const mid = h / 2;

      // intensity grows subtly as progress increases
      const ampBase = 0.22 + 0.35 * progress01;

      const layers = [
        { a: 1.0, f: 1.9, s: 0.0, o: 0.18, lw: 1.25 },
        { a: 0.7, f: 3.2, s: 1.7, o: 0.12, lw: 1.15 },
        { a: 0.45, f: 6.0, s: 4.2, o: 0.08, lw: 1.0 },
      ];

      for (let li = 0; li < layers.length; li++) {
        const L = layers[li];
        ctx.beginPath();

        for (let x = 0; x <= w; x += 1) {
          const nx = x / w;

          const s1 = Math.sin(nx * Math.PI * 2 * L.f + time * (1.2 + L.f * 0.2) + L.s);
          const s2 = 0.35 * Math.sin(nx * Math.PI * 2 * (L.f * 2.1) + time * (0.9 + L.f * 0.25));
          const drift = 0.15 * Math.sin(time * 1.1 + nx * 10.0);
          const noise = (rand(nx * 1000 + time * 10 + li * 77) - 0.5) * 0.22;

          const y = mid + (s1 + s2 + drift + noise) * (h * ampBase * L.a);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(255,255,255,${L.o})`;
        ctx.lineWidth = L.lw;
        ctx.stroke();
      }

      // playhead line
      ctx.beginPath();
      ctx.moveTo(playX, 6);
      ctx.lineTo(playX, h - 6);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // tiny baseline
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [progress01, height]);

  return <canvas ref={ref} />;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}