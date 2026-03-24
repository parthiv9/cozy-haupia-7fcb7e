import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchWindFieldGrid, interpolateWindUV } from '../utils/windFieldApi';

const METERS_PER_DEG_LAT = 111320;

/** Visual time-scaling so flow is readable */
const ADVECT_DT = 0.28;

/** Wind ink fades via destination-out (no white/grey wash on the basemap) */
const TRAIL_ERASE_ALPHA = 0.09;
/** Overall wind graphics opacity so roads/labels stay readable */
const WIND_DRAW_ALPHA = 0.4;

function randomInBounds(south, west, north, east) {
  const lat = south + Math.random() * (north - south);
  const lng = west + Math.random() * (east - west);
  return { lat, lng };
}

function screenWindAngleRad(map, lat, lng, u, v) {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.max(0.15, Math.abs(cosLat));
  const dLat = (v * 500) / METERS_PER_DEG_LAT;
  const dLng = (u * 500) / metersPerDegLng;
  const p0 = map.latLngToContainerPoint(L.latLng(lat, lng));
  const p1 = map.latLngToContainerPoint(L.latLng(lat + dLat, lng + dLng));
  return Math.atan2(p1.y - p0.y, p1.x - p0.x);
}

/**
 * Wind flow canvas: particles + arrows. Samples Open-Meteo on a grid.
 * Overlay stays mounted (stable effect deps) so Leaflet + rAF don’t race.
 */
export default function WindFlowLayer({ active, mapOpen }) {
  const map = useMap();
  const fieldRef = useRef(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const particlesRef = useRef([]);
  const overlayRef = useRef(null);
  const ctxRef = useRef(null);
  const debounceRef = useRef(0);
  const loadGenRef = useRef(0);
  const activeRef = useRef(active);
  const mapOpenRef = useRef(mapOpen);

  activeRef.current = active;
  mapOpenRef.current = mapOpen;

  const resizeCanvas = useCallback(() => {
    const wrap = overlayRef.current;
    const canvas = wrap?.querySelector('canvas');
    if (!canvas || !map) return;

    map.invalidateSize();
    const sz = map.getSize();
    let w = sz?.x ?? 0;
    let h = sz?.y ?? 0;
    if (w < 4 || h < 4) {
      const rect = map.getContainer().getBoundingClientRect();
      w = rect.width || 400;
      h = rect.height || 300;
    }

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(2, Math.floor(w * dpr));
    canvas.height = Math.max(2, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.background = 'transparent';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
  }, [map]);

  const loadField = useCallback(async () => {
    if (!activeRef.current || !mapOpenRef.current) return;
    const gen = ++loadGenRef.current;
    const b = map.getBounds();
    try {
      const field = await fetchWindFieldGrid(b);
      if (gen !== loadGenRef.current) return;
      fieldRef.current = field;

      if (!field) {
        particlesRef.current = [];
        return;
      }

      const south = b.getSouth();
      const west = b.getWest();
      const north = b.getNorth();
      const east = b.getEast();
      map.invalidateSize();
      const sz = map.getSize();
      const rect = map.getContainer().getBoundingClientRect();
      let pw = sz?.x ?? (rect.width || 400);
      let ph = sz?.y ?? (rect.height || 300);
      const area = Math.max(1, pw) * Math.max(1, ph);
      const count = Math.min(1000, Math.max(220, Math.floor(area / 700)));
      const parts = [];
      for (let i = 0; i < count; i++) {
        const { lat, lng } = randomInBounds(south, west, north, east);
        parts.push({ lat, lng, life: Math.random() });
      }
      particlesRef.current = parts;
    } catch {
      if (gen === loadGenRef.current) {
        fieldRef.current = null;
        particlesRef.current = [];
      }
    }
  }, [map]);

  const scheduleLoadFieldRef = useRef(() => {});
  scheduleLoadFieldRef.current = () => {
    if (!activeRef.current || !mapOpenRef.current) return;
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      loadField();
    }, 420);
  };

  /* Mount overlay once per map instance — do NOT depend on loadField / active */
  useEffect(() => {
    const container = map.getContainer();
    const wrap = document.createElement('div');
    wrap.className = 'wind-flow-overlay';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText =
      'position:absolute;left:0;top:0;right:0;bottom:0;width:100%;height:100%;z-index:620;pointer-events:none;overflow:hidden;border-radius:inherit;background:transparent';
    const canvas = document.createElement('canvas');
    wrap.appendChild(canvas);
    container.appendChild(wrap);
    overlayRef.current = wrap;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const debounced = () => scheduleLoadFieldRef.current();

    const onResize = () => {
      resizeCanvas();
      debounced();
    };

    map.whenReady(() => {
      resizeCanvas();
      debounced();
    });

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(container);

    map.on('moveend', debounced);
    map.on('zoomend', debounced);
    map.on('resize', onResize);

    return () => {
      ro?.disconnect();
      map.off('moveend', debounced);
      map.off('zoomend', debounced);
      map.off('resize', onResize);
      window.clearTimeout(debounceRef.current);
      wrap.remove();
      overlayRef.current = null;
      ctxRef.current = null;
    };
  }, [map, resizeCanvas]);

  /* Active: animation loop + initial load */
  useEffect(() => {
    if (!active || !mapOpen) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      fieldRef.current = null;
      particlesRef.current = [];
      const ctx = ctxRef.current;
      if (ctx?.canvas) {
        const c = ctx.canvas;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, c.width, c.height);
      }
      return undefined;
    }

    const kick = () => {
      map.invalidateSize();
      resizeCanvas();
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => loadField(), 0);
    };
    kick();
    const t = window.setTimeout(kick, 120);

    const tick = () => {
      const ctx = ctxRef.current;
      const field = fieldRef.current;
      const parts = particlesRef.current;
      if (!ctx || !ctx.canvas) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cw = ctx.canvas.width / dpr;
      const ch = ctx.canvas.height / dpr;

      timeRef.current += 1;

      /* Fade existing wind strokes without painting any tint over the map */
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ERASE_ALPHA})`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();

      if (!field) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const { south, west, north, east } = field;

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = WIND_DRAW_ALPHA;
      ctx.lineCap = 'round';
      const minMove = 0.08;

      for (let p = 0; p < parts.length; p++) {
        const pt = parts[p];
        const { u, v } = interpolateWindUV(field, pt.lat, pt.lng);
        const mag = Math.hypot(u, v);
        const prevLat = pt.lat;
        const prevLng = pt.lng;

        const cosLat = Math.cos((pt.lat * Math.PI) / 180);
        const metersPerDegLng = METERS_PER_DEG_LAT * Math.max(0.15, Math.abs(cosLat));
        pt.lat += (v * ADVECT_DT) / METERS_PER_DEG_LAT;
        pt.lng += (u * ADVECT_DT) / metersPerDegLng;

        if (pt.lat < south || pt.lat > north || pt.lng < west || pt.lng > east || mag < minMove) {
          Object.assign(pt, randomInBounds(south, west, north, east), { life: Math.random() });
          continue;
        }

        const a0 = map.latLngToContainerPoint(L.latLng(prevLat, prevLng));
        const a1 = map.latLngToContainerPoint(L.latLng(pt.lat, pt.lng));
        if (!a0 || !a1) continue;

        const wobble = 0.85 + 0.15 * Math.sin(pt.life * 6.28 + timeRef.current * 0.02);
        ctx.strokeStyle = `rgb(37, 99, 235)`;
        ctx.lineWidth = wobble * (1 + Math.min(1.4, mag / 8));
        ctx.beginPath();
        ctx.moveTo(a0.x, a0.y);
        ctx.lineTo(a1.x, a1.y);
        ctx.stroke();
      }

      const tAnim = timeRef.current;
      for (let i = 0; i < field.rows; i += 2) {
        for (let j = 0; j < field.cols; j += 2) {
          const fy = (i + 0.5) / field.rows;
          const fx = (j + 0.5) / field.cols;
          const lat = north - fy * (north - south);
          const lng = west + fx * (east - west);
          const { u, v } = interpolateWindUV(field, lat, lng);
          const mag = Math.hypot(u, v);
          if (mag < 0.25) continue;
          const px = map.latLngToContainerPoint(L.latLng(lat, lng));
          if (!px) continue;
          const ang = screenWindAngleRad(map, lat, lng, u, v);
          const len = 10 + Math.min(22, mag * 1.4);
          const pulseW = 0.85 + 0.15 * Math.sin(tAnim * 0.06 + i * 0.7 + j * 0.5);

          ctx.save();
          ctx.translate(px.x, px.y);
          ctx.rotate(ang);
          ctx.strokeStyle = '#1d4ed8';
          ctx.fillStyle = '#3b82f6';
          ctx.lineWidth = pulseW * 1.65;
          ctx.beginPath();
          ctx.moveTo(-len * 0.35, 0);
          ctx.lineTo(len * 0.5, 0);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(len * 0.5, 0);
          ctx.lineTo(len * 0.22, -4);
          ctx.lineTo(len * 0.22, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [active, mapOpen, map, loadField, resizeCanvas]);

  return null;
}
