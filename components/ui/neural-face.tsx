'use client';

import { useEffect, useRef } from 'react';
import type { BufferGeometry, Material } from 'three';

type NeuralFaceProps = {
  paused: boolean;
  reducedMotion?: boolean;
};

type FaceSurface = {
  positions: number[];
  indices: number[];
};

// These are the original canonical face vertex indices, preserved in the local
// geometry. Sampling these paths keeps eyelids and the lip line legible even
// while the acquisition band is elsewhere on the face.
const anatomicalPaths = [
  [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
  [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466, 263],
  [46, 53, 52, 65, 55],
  [276, 283, 282, 295, 285],
  [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
  [168, 6, 197, 195, 5, 4, 1],
  [129, 98, 97, 2, 326, 327, 358],
];

const pointVertex = `
  attribute float aFeature;
  attribute float aSeed;
  uniform float pixelRatio;
  uniform float pointScale;
  varying float vY;
  varying float vFeature;
  varying float vSeed;
  varying float vLight;
  void main() {
    vec3 faceNormal = normalize(normalMatrix * normal);
    vY = position.y;
    vFeature = aFeature;
    vSeed = aSeed;
    vLight = 0.28 + 0.72 * abs(dot(faceNormal, normalize(vec3(-0.45, 0.5, 1.0))));
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = (1.70 + aSeed * 0.95 + aFeature * 0.30) * pixelRatio * pointScale;
  }
`;

const pointFragment = `
  precision highp float;
  uniform float scanY;
  uniform float impulse;
  varying float vY;
  varying float vFeature;
  varying float vSeed;
  varying float vLight;
  void main() {
    float radius = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (radius > 1.0) discard;
    float dotShape = 1.0 - smoothstep(0.25, 1.0, radius);
    float distanceToScan = vY - scanY;
    float scan = exp(-pow(distanceToScan / (0.12 + impulse * 0.025), 2.0));
    float afterglow = step(0.0, distanceToScan) * exp(-distanceToScan * 2.2);
    vec3 ice = vec3(0.62, 0.83, 0.94);
    vec3 champagne = vec3(0.91, 0.72, 0.49);
    vec3 color = mix(ice, champagne, afterglow * 0.84 * (1.0 - scan));
    float baseline = 0.43 + vFeature * 0.22 + vSeed * 0.15;
    float brightness = baseline * vLight + scan * 0.88 + afterglow * 0.40 + impulse * 0.10;
    gl_FragColor = vec4(color, dotShape * min(brightness, 1.0));
    #include <colorspace_fragment>
  }
`;

const lineVertex = `
  attribute float aStrength;
  varying float vY;
  varying float vStrength;
  void main() {
    vY = position.y;
    vStrength = aStrength;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lineFragment = `
  precision highp float;
  uniform float scanY;
  uniform float impulse;
  varying float vY;
  varying float vStrength;
  void main() {
    float distanceToScan = vY - scanY;
    float scan = exp(-pow(distanceToScan / 0.12, 2.0));
    float afterglow = step(0.0, distanceToScan) * exp(-distanceToScan * 3.0);
    vec3 color = mix(vec3(0.48, 0.71, 0.82), vec3(0.83, 0.64, 0.44), afterglow * 0.55);
    float alpha = (0.10 + scan * 0.54 + afterglow * 0.13 + impulse * 0.035) * vStrength;
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

function readSurface(value: unknown): FaceSurface {
  const data = value as Partial<FaceSurface> | null;
  if (!data || !Array.isArray(data.positions) || !Array.isArray(data.indices)
    || data.positions.length < 468 * 3 || data.positions.length % 3 !== 0
    || data.indices.length < 3 || data.indices.length % 3 !== 0
    || !data.positions.every(Number.isFinite)
    || !data.indices.every((index) => Number.isInteger(index) && index >= 0 && index < data.positions!.length / 3)) {
    throw new Error('Invalid canonical face surface');
  }
  return { positions: data.positions, indices: data.indices };
}

export function NeuralFace({ paused, reducedMotion = false }: NeuralFaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef({ paused, reducedMotion });
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const container: HTMLDivElement = host;
    if (typeof IntersectionObserver === 'undefined') return;
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = matchMedia('(max-width: 767px)');
    const connection = (navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }).connection;
    const abortController = new AbortController();
    let disposed = false;
    let initializing = false;
    let initialized = false;
    let failed = false;
    let nearViewport = false;
    let inView = false;
    let syncGraphics: (() => void) | null = null;
    let destroyGraphics: (() => void) | null = null;
    const staticMode = () => Boolean(connection?.saveData || settingsRef.current.reducedMotion || motionQuery.matches);
    const visible = () => inView && !document.hidden && !settingsRef.current.paused && !staticMode();

    async function initialize() {
      if (initializing || initialized || failed || disposed || staticMode()) return;
      initializing = true;
      try {
        const [THREE, surface] = await Promise.all([
          import('three'),
          fetch('/media/neural-face.json', { signal: abortController.signal }).then(async (response) => {
            if (!response.ok) throw new Error('Face surface unavailable');
            return readSurface(await response.json());
          }),
        ]);
        if (disposed || staticMode()) return;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          stencil: false,
          powerPreference: 'low-power',
          preserveDrawingBuffer: false,
        });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none;visibility:hidden;';
        container.appendChild(canvas);
        const scene = new THREE.Scene();
        const face = new THREE.Group();
        scene.add(face);
        const camera = new THREE.OrthographicCamera(-3, 3, 2.3, -2.3, 0.1, 20);
        camera.position.set(0, 0, 9);
        const geometries = new Set<BufferGeometry>();
        const materials = new Set<Material>();
        const cleanups: Array<() => void> = [];
        let frame = 0;
        let lastDraw = 0;
        let width = 0;
        let height = 0;
        let contextLost = false;
        let elapsedTime = 1.15;
        let scanTime = 1.15;
        let impulse = 0;
        let scrollTarget = 0;
        let scrollPosition = 0;
        const stop = () => {
          cancelAnimationFrame(frame);
          frame = 0;
          lastDraw = 0;
          container.dataset.running = 'false';
        };
        destroyGraphics = () => {
          stop();
          syncGraphics = null;
          cleanups.forEach((cleanup) => cleanup());
          geometries.forEach((geometry) => geometry.dispose());
          materials.forEach((material) => material.dispose());
          scene.clear();
          renderer.dispose();
          renderer.forceContextLoss();
          canvas.remove();
        };
        const failGraphics = () => {
          failed = true;
          initialized = false;
          destroyGraphics?.();
          destroyGraphics = null;
          container.dataset.graphics = 'fallback';
          container.dataset.running = 'false';
        };

        const surfaceGeometry = new THREE.BufferGeometry();
        surfaceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(surface.positions, 3));
        surfaceGeometry.setIndex(surface.indices);
        surfaceGeometry.computeVertexNormals();
        geometries.add(surfaceGeometry);
        const positions = surfaceGeometry.getAttribute('position');
        const normals = surfaceGeometry.getAttribute('normal');
        const occlusionMaterial = new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: 2,
          polygonOffsetUnits: 2,
        });
        materials.add(occlusionMaterial);
        face.add(new THREE.Mesh(surfaceGeometry, occlusionMaterial));

        // Fixed random seed and area-weighted barycentric samples make a stable
        // surface instead of a point cloud that drifts or clumps at vertices.
        let seed = 89237;
        const random = () => {
          seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        const ab = new THREE.Vector3();
        const ac = new THREE.Vector3();
        const areas: number[] = [];
        let totalArea = 0;
        for (let triangle = 0; triangle < surface.indices.length; triangle += 3) {
          a.fromBufferAttribute(positions, surface.indices[triangle]);
          b.fromBufferAttribute(positions, surface.indices[triangle + 1]);
          c.fromBufferAttribute(positions, surface.indices[triangle + 2]);
          totalArea += ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() * 0.5;
          areas.push(totalArea);
        }
        if (!totalArea) throw new Error('Empty face surface');
        const pointCount = 5000;
        const pointPositions = new Float32Array(pointCount * 3);
        const pointNormals = new Float32Array(pointCount * 3);
        const pointFeatures = new Float32Array(pointCount);
        const pointSeeds = new Float32Array(pointCount);
        function writePoint(index: number, vertices: number[], weights: number[], feature: number) {
          const offset = index * 3;
          for (let axis = 0; axis < 3; axis++) {
            let coordinate = 0;
            let normal = 0;
            for (let vertex = 0; vertex < vertices.length; vertex++) {
              coordinate += positions.array[vertices[vertex] * 3 + axis] * weights[vertex];
              normal += normals.array[vertices[vertex] * 3 + axis] * weights[vertex];
            }
            pointPositions[offset + axis] = coordinate + normal * 0.002;
            pointNormals[offset + axis] = normal;
          }
          pointFeatures[index] = feature;
          pointSeeds[index] = random();
        }
        const anatomicalEdges: Array<{ from: number; to: number; strength: number; end: number }> = [];
        let totalLength = 0;
        anatomicalPaths.forEach((path, pathIndex) => {
          for (let index = 0; index < path.length - 1; index++) {
            const from = path[index];
            const to = path[index + 1];
            a.fromBufferAttribute(positions, from);
            b.fromBufferAttribute(positions, to);
            // Emphasize eyes/lips over the long outside contour.
            totalLength += a.distanceTo(b) * (pathIndex === 0 ? 0.45 : 1.4);
            anatomicalEdges.push({ from, to, strength: pathIndex === 0 ? 0.5 : 0.85, end: totalLength });
          }
        });
        // Interleave anatomical samples so the smaller mobile draw range still
        // includes eyes and lips when the viewport crosses a breakpoint.
        for (let index = 0; index < pointCount; index++) {
          if (index % 7 === 0) {
            const target = random() * totalLength;
            const edge = anatomicalEdges.find((candidate) => candidate.end >= target)!;
            const along = random();
            writePoint(index, [edge.from, edge.to], [1 - along, along], edge.strength);
          } else {
            const target = random() * totalArea;
            let low = 0;
            let high = areas.length - 1;
            while (low < high) {
              const middle = (low + high) >>> 1;
              if (areas[middle] < target) low = middle + 1;
              else high = middle;
            }
            const triangle = low * 3;
            const root = Math.sqrt(random());
            const second = random();
            writePoint(index, surface.indices.slice(triangle, triangle + 3), [1 - root, root * (1 - second), root * second], 0);
          }
        }

        const common = { scanY: { value: 2.35 - scanTime / 8 * 4.7 }, impulse: { value: 0 } };
        const pointUniforms = { ...common, pixelRatio: { value: 1 }, pointScale: { value: 1 } };
        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
        pointsGeometry.setAttribute('normal', new THREE.BufferAttribute(pointNormals, 3));
        pointsGeometry.setAttribute('aFeature', new THREE.BufferAttribute(pointFeatures, 1));
        pointsGeometry.setAttribute('aSeed', new THREE.BufferAttribute(pointSeeds, 1));
        geometries.add(pointsGeometry);
        const pointsMaterial = new THREE.ShaderMaterial({
          uniforms: pointUniforms,
          vertexShader: pointVertex,
          fragmentShader: pointFragment,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        materials.add(pointsMaterial);
        face.add(new THREE.Points(pointsGeometry, pointsMaterial));

        const edges = new Map<string, { from: number; to: number; strength: number }>();
        const edgeKey = (from: number, to: number) => from < to ? `${from}:${to}` : `${to}:${from}`;
        for (let index = 0; index < surface.indices.length; index += 3) {
          for (let side = 0; side < 3; side++) {
            const from = surface.indices[index + side];
            const to = surface.indices[index + (side + 1) % 3];
            const key = edgeKey(from, to);
            const hash = Math.imul(Math.min(from, to) + 1, 73856093) ^ Math.imul(Math.max(from, to) + 1, 19349663);
            if ((hash >>> 0) % 100 < 29 && !edges.has(key)) edges.set(key, { from, to, strength: 0.36 });
          }
        }
        anatomicalEdges.forEach((edge) => edges.set(edgeKey(edge.from, edge.to), edge));
        const linePositions: number[] = [];
        const lineStrengths: number[] = [];
        edges.forEach(({ from, to, strength }) => {
          for (const vertex of [from, to]) {
            for (let axis = 0; axis < 3; axis++) {
              linePositions.push(positions.array[vertex * 3 + axis] + normals.array[vertex * 3 + axis] * 0.003);
            }
            lineStrengths.push(strength);
          }
        });
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute('aStrength', new THREE.Float32BufferAttribute(lineStrengths, 1));
        geometries.add(lineGeometry);
        const lineMaterial = new THREE.ShaderMaterial({
          uniforms: common,
          vertexShader: lineVertex,
          fragmentShader: lineFragment,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        materials.add(lineMaterial);
        face.add(new THREE.LineSegments(lineGeometry, lineMaterial));

        // A real horizontal cross-section of the surface: it bends through the
        // nose in depth, and ends at the face rather than extending into a HUD.
        const scanPositions = new Float32Array(surface.indices.length * 2 + 36);
        const scanGeometry = new THREE.BufferGeometry();
        const scanAttribute = new THREE.BufferAttribute(scanPositions, 3);
        scanAttribute.setUsage(THREE.DynamicDrawUsage);
        scanGeometry.setAttribute('position', scanAttribute);
        scanGeometry.setDrawRange(0, 0);
        geometries.add(scanGeometry);
        const scanMaterial = new THREE.LineBasicMaterial({
          color: 0xb9e4f6,
          transparent: true,
          opacity: 0.58,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        materials.add(scanMaterial);
        const scanLine = new THREE.LineSegments(scanGeometry, scanMaterial);
        scanLine.frustumCulled = false;
        face.add(scanLine);
        const updateScanLine = (y: number) => {
          let cursor = 0;
          let left = Infinity;
          let right = -Infinity;
          let leftZ = 0;
          let rightZ = 0;
          for (let triangle = 0; triangle < surface.indices.length; triangle += 3) {
            const start = cursor;
            for (let side = 0; side < 3; side++) {
              const from = surface.indices[triangle + side] * 3;
              const to = surface.indices[triangle + (side + 1) % 3] * 3;
              const fromY = surface.positions[from + 1];
              const toY = surface.positions[to + 1];
              if ((fromY <= y && toY > y) || (toY <= y && fromY > y)) {
                const along = (y - fromY) / (toY - fromY);
                const x = surface.positions[from] + (surface.positions[to] - surface.positions[from]) * along;
                const z = surface.positions[from + 2] + (surface.positions[to + 2] - surface.positions[from + 2]) * along + 0.009;
                scanPositions[cursor++] = x;
                scanPositions[cursor++] = y;
                scanPositions[cursor++] = z;
                if (x < left) { left = x; leftZ = z; }
                if (x > right) { right = x; rightZ = z; }
              }
            }
            if (cursor - start !== 6) cursor = start;
          }
          if (Number.isFinite(left)) {
            for (const [x, z, direction] of [[left - 0.07, leftZ, 1], [right + 0.07, rightZ, -1]]) {
              scanPositions.set([
                x, y - 0.055, z, x, y + 0.055, z,
                x, y - 0.055, z, x + direction * 0.045, y - 0.055, z,
                x, y + 0.055, z, x + direction * 0.045, y + 0.055, z,
              ], cursor);
              cursor += 18;
            }
          }
          scanMaterial.opacity = (0.58 + impulse * 0.15) * Math.max(0, Math.min(1, (2 - Math.abs(y)) / 0.25));
          scanGeometry.setDrawRange(0, cursor / 3);
          scanAttribute.needsUpdate = true;
        };

        const updateFace = () => {
          common.scanY.value = 2.35 - (scanTime % 8) / 8 * 4.7;
          common.impulse.value = impulse;
          face.rotation.y = -0.24 - Math.sin(elapsedTime * 0.19 + 0.45) * 0.10 + scrollPosition * 0.035;
          face.rotation.x = 0.018 + scrollPosition * 0.025;
          updateScanLine(common.scanY.value);
        };
        const render = () => {
          if (disposed || failed || contextLost || !width || !height || staticMode()) return;
          try {
            updateFace();
            renderer.render(scene, camera);
            canvas.style.visibility = 'visible';
            container.dataset.graphics = 'webgl';
          } catch {
            failGraphics();
          }
        };
        const animate = (timestamp: number) => {
          frame = 0;
          if (disposed || failed || contextLost || !visible()) return;
          const elapsed = timestamp - lastDraw;
          if (elapsed >= 1000 / (mobileQuery.matches ? 24 : 30)) {
            const delta = lastDraw ? Math.min(elapsed / 1000, 0.12) : 0;
            lastDraw = timestamp;
            elapsedTime += delta;
            scanTime += delta;
            impulse *= Math.exp(-delta * 2.4);
            scrollPosition += (scrollTarget - scrollPosition) * (1 - Math.exp(-delta * 3));
            render();
          }
          if (!failed) frame = requestAnimationFrame(animate);
        };
        syncGraphics = () => {
          stop();
          if (staticMode()) {
            canvas.style.visibility = 'hidden';
            container.dataset.graphics = 'fallback';
            return;
          }
          if (disposed || failed || contextLost || !inView || document.hidden) return;
          render();
          if (!failed && visible()) {
            container.dataset.running = 'true';
            frame = requestAnimationFrame(animate);
          }
        };
        const resize = () => {
          if (disposed || failed || contextLost) return;
          try {
            const bounds = container.getBoundingClientRect();
            width = bounds.width;
            height = bounds.height;
            if (!width || !height) { stop(); return; }
            const dpr = Math.min(devicePixelRatio || 1, 1.25, Math.sqrt(550000 / (width * height)));
            renderer.setPixelRatio(dpr);
            renderer.setSize(width, height, false);
            const drawCount = mobileQuery.matches ? 3200 : 5000;
            pointsGeometry.setDrawRange(0, drawCount);
            container.dataset.particles = String(drawCount);
            pointUniforms.pixelRatio.value = dpr;
            pointUniforms.pointScale.value = mobileQuery.matches ? 0.95 : 1;
            const halfHeight = 2.5;
            const halfWidth = Math.max(2.05, halfHeight * width / height);
            camera.left = -halfWidth;
            camera.right = halfWidth;
            camera.top = halfWidth * height / width;
            camera.bottom = -camera.top;
            camera.updateProjectionMatrix();
            syncGraphics?.();
          } catch {
            failGraphics();
          }
        };
        const section = container.closest('section') ?? container.parentElement;
        const onPointerMove = () => {
          if (visible()) impulse = Math.min(0.7, impulse + 0.12);
        };
        const onPointerDown = () => { if (visible()) impulse = 1; };
        const onScroll = () => {
          if (!inView || !section) return;
          const bounds = section.getBoundingClientRect();
          scrollTarget = Math.max(-1, Math.min(1, (innerHeight / 2 - bounds.top - bounds.height / 2) / (innerHeight + bounds.height) * 2));
        };
        const onContextLost = (event: Event) => {
          event.preventDefault();
          contextLost = true;
          stop();
          canvas.style.visibility = 'hidden';
          container.dataset.graphics = 'fallback';
        };
        const onContextRestored = () => {
          contextLost = false;
          resize();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        cleanups.push(() => resizeObserver.disconnect());
        section?.addEventListener('pointermove', onPointerMove, { passive: true });
        section?.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        canvas.addEventListener('webglcontextlost', onContextLost);
        canvas.addEventListener('webglcontextrestored', onContextRestored);
        cleanups.push(() => {
          section?.removeEventListener('pointermove', onPointerMove);
          section?.removeEventListener('pointerdown', onPointerDown);
          window.removeEventListener('scroll', onScroll);
          canvas.removeEventListener('webglcontextlost', onContextLost);
          canvas.removeEventListener('webglcontextrestored', onContextRestored);
        });
        initialized = true;
        onScroll();
        resize();
      } catch {
        destroyGraphics?.();
        destroyGraphics = null;
        failed = true;
        container.dataset.graphics = 'fallback';
        container.dataset.running = 'false';
      } finally {
        initializing = false;
      }
    }

    const sync = () => {
      if (disposed) return;
      if (nearViewport && !document.hidden && !staticMode()) void initialize();
      syncGraphics?.();
    };
    syncRef.current = sync;
    const nearbyObserver = new IntersectionObserver(([entry]) => {
      nearViewport = entry.isIntersecting;
      sync();
    }, { rootMargin: '250px 0px', threshold: 0 });
    const visibleObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: 0.02 });
    nearbyObserver.observe(container);
    visibleObserver.observe(container);
    document.addEventListener('visibilitychange', sync);
    motionQuery.addEventListener('change', sync);
    connection?.addEventListener('change', sync);
    return () => {
      disposed = true;
      abortController.abort();
      nearbyObserver.disconnect();
      visibleObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      motionQuery.removeEventListener('change', sync);
      connection?.removeEventListener('change', sync);
      destroyGraphics?.();
      syncRef.current = null;
    };
  }, []);

  useEffect(() => {
    settingsRef.current = { paused, reducedMotion };
    syncRef.current?.();
  }, [paused, reducedMotion]);

  return <div ref={containerRef} className="neural-face" data-graphics="fallback" data-running="false" aria-hidden="true" />;
}
