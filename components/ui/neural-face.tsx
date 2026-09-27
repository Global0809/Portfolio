'use client';

import { useEffect, useRef } from 'react';
import type { BufferGeometry, Material } from 'three';

type NeuralFaceProps = {
  paused: boolean;
  reducedMotion?: boolean;
};

type FaceSurface = {
  positions: number[];
  normals?: number[];
  indices: number[];
};

const surfaceVertex = `
  varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
  void main() {
    vPosition = position; vNormal = normalize(normalMatrix * normal);
    vec4 p = modelViewMatrix * vec4(position, 1.0); vView = -p.xyz;
    gl_Position = projectionMatrix * p;
  }
`;
const surfaceFragment = `
  precision highp float;
  uniform float scanY; uniform float impulse;
  varying vec3 vPosition; varying vec3 vNormal; varying vec3 vView;
  void main() {
    float fade = smoothstep(-2.1, -1.25, vPosition.y);
    if (fade < 0.015) discard;
    vec3 n = normalize(vNormal);
    float key = pow(max(dot(n, normalize(vec3(-0.65, 0.4, 0.9))), 0.0), 1.5);
    float rim = pow(1.0 - max(dot(n, normalize(vView)), 0.0), 3.0);
    float fill = max(dot(n, normalize(vec3(0.7, 0.15, 0.3))), 0.0);
    float band = exp(-pow((vPosition.y - scanY) / 0.065, 2.0));
    float wake = step(scanY, vPosition.y) * exp(-(vPosition.y - scanY) * 3.8);
    vec3 color = vec3(0.0018, 0.0025, 0.006) + key * vec3(0.016, 0.024, 0.038);
    color += fill * vec3(0.014, 0.006, 0.023) + rim * vec3(0.018, 0.033, 0.052);
    color += band * vec3(0.1, 0.24, 0.34) * (0.3 + key * 0.7);
    color += wake * vec3(0.018, 0.012, 0.027) + impulse * key * vec3(0.008, 0.014, 0.025);
    gl_FragColor = vec4(color * 0.58, fade);
    #include <colorspace_fragment>
  }
`;
const pointVertex = `
  attribute float aSeed;
  uniform float pixelRatio; uniform float pointScale; uniform float scanY;
  varying float vY; varying float vSeed; varying float vLight; varying float vRim;
  void main() {
    vec3 n = normalize(normalMatrix * normal);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    vY = position.y; vSeed = aSeed;
    vLight = max(dot(n, normalize(vec3(-0.65, 0.4, 0.9))), 0.0);
    vRim = pow(1.0 - max(dot(n, normalize(-p.xyz)), 0.0), 2.0);
    float band = exp(-pow((position.y - scanY) / 0.12, 2.0));
    gl_Position = projectionMatrix * p;
    gl_PointSize = (1.1 + aSeed * 0.95 + band * 0.55) * pixelRatio * pointScale;
  }
`;
const pointFragment = `
  precision highp float;
  uniform float scanY; uniform float impulse;
  varying float vY; varying float vSeed; varying float vLight; varying float vRim;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    float band = exp(-pow((vY - scanY) / 0.14, 2.0));
    float wake = step(scanY, vY) * exp(-(vY - scanY) * 2.4);
    float dots = 1.0 - smoothstep(0.12, 1.0, r);
    float fade = smoothstep(-1.95, -1.45, vY);
    if (fade < 0.02) discard;
    float light = 0.035 + pow(vLight, 1.5) * 0.36 + vRim * 0.07;
    light += band * (0.55 + vLight * 0.45) + wake * 0.16 + impulse * vLight * 0.12;
    vec3 color = mix(vec3(0.38, 0.64, 0.85), vec3(0.85, 0.76, 0.98), wake * 0.55);
    color = mix(color, vec3(0.83, 0.95, 1.0), band);
    gl_FragColor = vec4(color, dots * light * fade * (0.62 + vSeed * 0.38));
    #include <colorspace_fragment>
  }
`;

function readSurface(value: unknown): FaceSurface {
  const data = value as Partial<FaceSurface> | null;
  if (!data || !Array.isArray(data.positions) || !Array.isArray(data.indices)
    || data.positions.length < 9 || data.positions.length % 3 !== 0
    || data.indices.length < 3 || data.indices.length % 3 !== 0
    || !data.positions.every(Number.isFinite)
    || !data.indices.every((index) => Number.isInteger(index) && index >= 0 && index < data.positions!.length / 3)) {
    throw new Error('Invalid head surface');
  }
  const normals = Array.isArray(data.normals) && data.normals.length === data.positions.length && data.normals.every(Number.isFinite) ? data.normals : undefined;
  return { positions: data.positions, indices: data.indices, normals };
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
          fetch('/media/neural-head.json', { signal: abortController.signal }).then(async (response) => {
            if (!response.ok) throw new Error('Face surface unavailable');
            return readSurface(await response.json());
          }),
        ]);
        if (disposed || staticMode()) return;

        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
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
        let elapsedTime = 2.5;
        let scanTime = 2.5;
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
        if (surface.normals) surfaceGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(surface.normals, 3));
        else surfaceGeometry.computeVertexNormals();
        geometries.add(surfaceGeometry);
        const positions = surfaceGeometry.getAttribute('position');
        const normals = surfaceGeometry.getAttribute('normal');
        const common = { scanY: { value: 0.7 }, impulse: { value: 0 } };
        const surfaceMaterial = new THREE.ShaderMaterial({
          vertexShader: surfaceVertex, fragmentShader: surfaceFragment, uniforms: common,
          transparent: true, depthWrite: true, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
        });
        materials.add(surfaceMaterial);
        const sculptedSurface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        sculptedSurface.renderOrder = 0;
        face.add(sculptedSurface);

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
          const centerY = (a.y + b.y + c.y) / 3;
          const normalZ = (normals.getZ(surface.indices[triangle]) + normals.getZ(surface.indices[triangle + 1]) + normals.getZ(surface.indices[triangle + 2])) / 3;
          const weight = centerY < -2.45 ? 0 : normalZ > -0.25 ? 1 : 0.12;
          totalArea += ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() * 0.5 * weight;
          areas.push(totalArea);
        }
        if (!totalArea) throw new Error('Empty face surface');
        const pointCount = 26000;
        const pointPositions = new Float32Array(pointCount * 3);
        const pointNormals = new Float32Array(pointCount * 3);
        const pointSeeds = new Float32Array(pointCount);
        function writePoint(index: number, vertices: number[], weights: number[]) {
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
          pointSeeds[index] = random();
        }
        for (let index = 0; index < pointCount; index++) {
          if (index && index % 4096 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
            if (disposed || failed) return;
          }
          const target = random() * totalArea;
          let low = 0, high = areas.length - 1;
          while (low < high) {
            const middle = (low + high) >>> 1;
            if (areas[middle] < target) low = middle + 1; else high = middle;
          }
          const triangle = low * 3;
          const root = Math.sqrt(random()), second = random();
          writePoint(index, surface.indices.slice(triangle, triangle + 3), [1 - root, root * (1 - second), root * second]);
        }

        const pointUniforms = { ...common, pixelRatio: { value: 1 }, pointScale: { value: 1 } };
        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
        pointsGeometry.setAttribute('normal', new THREE.BufferAttribute(pointNormals, 3));
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
        const cloud = new THREE.Points(pointsGeometry, pointsMaterial);
        cloud.renderOrder = 1;
        face.add(cloud);

        const updateFace = () => {
          common.scanY.value = 2.25 - (scanTime % 9) / 9 * 4.65;
          common.impulse.value = impulse;
          face.rotation.y = -0.56 + Math.sin(elapsedTime * 0.12) * 0.065 + scrollPosition * 0.035;
          face.rotation.x = 0.018 + scrollPosition * 0.025;
          face.rotation.z = -0.025;
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
            const drawCount = mobileQuery.matches ? 16000 : 26000;
            pointsGeometry.setDrawRange(0, drawCount);
            container.dataset.particles = String(drawCount);
            pointUniforms.pixelRatio.value = dpr;
            pointUniforms.pointScale.value = mobileQuery.matches ? 0.95 : 1;
            const halfHeight = 2.6;
            const halfWidth = Math.max(1.9, halfHeight * width / height);
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
