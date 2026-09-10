'use client';

import { useEffect, useRef } from 'react';

export type ShaderAnimationProps = {
  className?: string;
  paused?: boolean;
  reducedMotion?: boolean;
};

// Shader Lines by Ali Imam, supplied by the studio from 21st.dev.
// The original mosaic/ring shader is retained; lifecycle and rendering use
// the project's installed Three.js instead of injecting the legacy r89 CDN.
const fragmentShader = `
  precision highp float;
  uniform vec2 resolution;
  uniform vec2 pointer;
  uniform float interaction;
  uniform float time;

  float random(in float x) {
    return fract(sin(x) * 1e4);
  }

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy)
      / min(resolution.x, resolution.y);
    vec2 lightUv = uv;

    vec2 fMosaicScal = vec2(4.0, 2.0);
    vec2 vScreenSize = vec2(256.0, 256.0);
    uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x)
      / (vScreenSize.x / fMosaicScal.x);
    uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y)
      / (vScreenSize.y / fMosaicScal.y);

    float t = time * 0.06 + random(uv.x) * 0.4;
    float lineWidth = 0.0008;
    vec3 color = vec3(0.0);
    for (int j = 0; j < 3; j++) {
      for (int i = 0; i < 5; i++) {
        float distanceToRing = abs(fract(t - 0.01 * float(j)
          + float(i) * 0.01) - length(uv));
        color[j] += lineWidth * float(i * i)
          / max(distanceToRing, 0.00001);
      }
    }
    // Touch illuminates existing lines. It never translates the composition.
    vec2 lightDistance = lightUv - pointer;
    float glow = exp(-dot(lightDistance, lightDistance) * 1.8);
    color *= 1.0 + glow * interaction * 0.24;
    gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
  }
`;

export function ShaderAnimation({
  className = '',
  paused = false,
  reducedMotion = false,
}: ShaderAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef({ paused, reducedMotion });
  const syncRef = useRef<(() => void) | null>(null);
  settingsRef.current = { paused, reducedMotion };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let cleanup = () => {};

    async function initialize() {
      const THREE = await import('three');
      if (disposed || !container) return;
      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      });
      const camera = new THREE.Camera();
      camera.position.z = 1;
      const scene = new THREE.Scene();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const uniforms = {
        time: { value: 1 },
        resolution: { value: new THREE.Vector2() },
        pointer: { value: new THREE.Vector2() },
        interaction: { value: 0 },
      };
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: 'void main() { gl_Position = vec4(position, 1.0); }',
        fragmentShader,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      scene.add(mesh);
      const canvas = renderer.domElement;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      container.appendChild(canvas);

      const media = matchMedia('(prefers-reduced-motion: reduce)');
      const target = new THREE.Vector2();
      const saveData = !!(
        navigator as Navigator & {
          connection?: { saveData?: boolean };
        }
      ).connection?.saveData;
      let impulse = 0;
      let frame = 0;
      let previousDraw = 0;
      let width = 0;
      let height = 0;
      let left = 0;
      let top = 0;
      let contextLost = false;
      const reduced = () =>
        saveData || media.matches || settingsRef.current.reducedMotion;
      const visible = () => !document.hidden && !settingsRef.current.paused;
      const stop = () => {
        cancelAnimationFrame(frame);
        frame = 0;
        container.dataset.running = 'false';
      };
      const render = () => {
        renderer.render(scene, camera);
        container.dataset.graphics = 'webgl';
      };
      const animate = (timestamp: number) => {
        frame = 0;
        if (disposed || contextLost || !visible() || reduced()) return;
        const elapsed = timestamp - previousDraw;
        if (elapsed >= (width < 761 ? 1000 / 24 : 1000 / 30)) {
          const delta = Math.min(elapsed / 1000, 0.1);
          previousDraw = timestamp;
          // The supplied 0.05-per-frame increment at 60Hz equals 3 per second.
          uniforms.time.value += delta * 3;
          uniforms.pointer.value.lerp(target, 1 - Math.exp(-delta * 4));
          uniforms.interaction.value +=
            (impulse - uniforms.interaction.value) *
            (1 - Math.exp(-delta * 12));
          impulse *= Math.exp(-delta * 4);
          render();
        }
        frame = requestAnimationFrame(animate);
      };
      const sync = () => {
        stop();
        if (disposed || contextLost || !visible() || !width || !height) return;
        if (reduced()) {
          impulse = 0;
          uniforms.interaction.value = 0;
        }
        render();
        if (!reduced()) {
          previousDraw = performance.now();
          frame = requestAnimationFrame(animate);
          container.dataset.running = 'true';
        }
      };
      const resize = () => {
        const rect = container.getBoundingClientRect();
        width = Math.round(rect.width);
        height = Math.round(rect.height);
        left = rect.left;
        top = rect.top;
        if (!width || !height) {
          stop();
          return;
        }
        // The mosaic does not benefit from expensive high-DPI rendering.
        renderer.setPixelRatio(
          Math.min(
            devicePixelRatio,
            width < 761 ? 1 : 1.25,
            Math.sqrt(1_100_000 / (width * height)),
          ),
        );
        renderer.setSize(width, height, false);
        renderer.getDrawingBufferSize(uniforms.resolution.value);
        sync();
      };
      const move = (event: PointerEvent) => {
        if (reduced() || !visible()) return;
        if (event.type === 'pointermove' && event.pointerType !== 'mouse')
          return;
        const shortest = Math.min(width, height);
        if (!shortest) return;
        target.set(
          ((event.clientX - left) * 2 - width) / shortest,
          (height - (event.clientY - top) * 2) / shortest,
        );
        impulse = event.type === 'pointerdown' ? 1 : Math.max(impulse, 0.35);
      };
      const release = () => {
        impulse *= 0.55;
      };
      const reset = () => {
        impulse = 0;
      };
      const lost = (event: Event) => {
        event.preventDefault();
        contextLost = true;
        stop();
        canvas.style.opacity = '0';
        container.dataset.graphics = 'fallback';
      };
      const restored = () => {
        contextLost = false;
        canvas.style.opacity = '1';
        resize();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerdown', move, { passive: true });
      window.addEventListener('pointerup', release, { passive: true });
      window.addEventListener('pointercancel', reset, { passive: true });
      window.addEventListener('blur', reset);
      document.addEventListener('visibilitychange', sync);
      media.addEventListener('change', sync);
      canvas.addEventListener('webglcontextlost', lost);
      canvas.addEventListener('webglcontextrestored', restored);
      syncRef.current = sync;
      cleanup = () => {
        stop();
        observer.disconnect();
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerdown', move);
        window.removeEventListener('pointerup', release);
        window.removeEventListener('pointercancel', reset);
        window.removeEventListener('blur', reset);
        document.removeEventListener('visibilitychange', sync);
        media.removeEventListener('change', sync);
        canvas.removeEventListener('webglcontextlost', lost);
        canvas.removeEventListener('webglcontextrestored', restored);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      };
      resize();
    }
    void initialize().catch(() => {
      cleanup();
      syncRef.current = null;
      if (!disposed) container.dataset.graphics = 'fallback';
    });
    return () => {
      disposed = true;
      syncRef.current = null;
      cleanup();
    };
  }, []);

  useEffect(() => {
    syncRef.current?.();
  }, [paused, reducedMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-graphics="fallback"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
