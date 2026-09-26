'use client';

import { useEffect, useRef } from 'react';
import type { BufferGeometry, Material, Vector3 } from 'three';

type ReservationOpticsProps = {
  paused?: boolean;
  reducedMotion?: boolean;
};

const metalVertex = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPosition = world.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Painted studio softboxes: real bevel normals shape the reflections, without
// transmission, environment-map downloads, or a second rendering pass.
const metalFragment = `
  precision highp float;
  uniform float time;
  uniform float warmth;
  uniform vec2 light;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vPosition);
    vec3 reflection = reflect(-view, normal);
    float sweep = time * 0.17;
    float strip = pow(max(0.0, cos(reflection.x * 4.1 + reflection.y * 1.7
      + sweep + light.x * 0.45)), 26.0);
    float broad = pow(max(0.0, dot(reflection,
      normalize(vec3(-0.65 + light.x * 0.15, 0.9 + light.y * 0.12, 0.8)))), 6.0);
    float warm = pow(max(0.0, dot(reflection,
      normalize(vec3(0.8, -0.5, 0.7)))), 14.0);
    float edge = pow(1.0 - max(0.0, dot(view, normal)), 2.3);
    vec3 ice = vec3(0.68, 0.84, 0.91);
    vec3 champagne = vec3(0.91, 0.79, 0.62);
    vec3 steel = mix(vec3(0.075, 0.10, 0.12), vec3(0.17, 0.15, 0.13), warmth);
    vec3 color = steel + ice * (broad * 0.48 + strip * 0.38)
      + champagne * warm * (0.30 + warmth * 0.36)
      + mix(ice, champagne, warmth) * edge * 0.16;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const faceFragment = `
  precision highp float;
  uniform float time;
  uniform vec2 light;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float wash = exp(-pow(vPosition.y - 1.8 + sin(time * 0.19) * 0.12, 2.0) * 1.7);
    float sheen = exp(-pow(vPosition.x + vPosition.y * 0.65 + 2.1
      + light.x * 0.12, 2.0) * 2.3);
    vec3 color = vec3(0.008, 0.013, 0.018)
      + vec3(0.010, 0.018, 0.023) * wash
      + vec3(0.012, 0.018, 0.022) * sheen;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function ReservationOptics({
  paused = false,
  reducedMotion = false,
}: ReservationOpticsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef({ paused, reducedMotion });
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const container: HTMLDivElement = host;

    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean };
    }).connection;
    if (connection?.saveData) return;

    let disposed = false;
    let initializing = false;
    let inView = false;
    let destroyGraphics: (() => void) | null = null;
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

    async function initialize() {
      if (initializing || disposed) return;
      initializing = true;
      try {
        const THREE = await import('three');
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          stencil: false,
          powerPreference: 'low-power',
          preserveDrawingBuffer: false,
        });
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        const canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none;';
        container.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-2.55, 2.55, 3, -3, 0.1, 30);
        camera.position.set(0, 0, 12);
        const sculpture = new THREE.Group();
        const pass = new THREE.Group();
        pass.rotation.set(-0.085, -0.12, -0.035);
        pass.position.y = -0.2;
        sculpture.add(pass);
        scene.add(sculpture);
        const geometries = new Set<BufferGeometry>();
        const materials = new Set<Material>();
        destroyGraphics = () => {
          geometries.forEach((geometry) => geometry.dispose());
          materials.forEach((material) => material.dispose());
          scene.clear();
          renderer.dispose();
          renderer.forceContextLoss();
          canvas.remove();
        };
        const common = {
          time: { value: 2.6 },
          light: { value: new THREE.Vector2(-0.2, 0.25) },
        };
        const metal = (warmth: number) => {
          const material = new THREE.ShaderMaterial({
            vertexShader: metalVertex,
            fragmentShader: metalFragment,
            uniforms: { ...common, warmth: { value: warmth } },
            side: THREE.DoubleSide,
          });
          materials.add(material);
          return material;
        };
        const silver = metal(0.1);
        const gold = metal(0.7);
        const face = new THREE.ShaderMaterial({
          vertexShader: metalVertex,
          fragmentShader: faceFragment,
          uniforms: common,
        });
        materials.add(face);

        function ticketShape(width: number, height: number, radius: number, notch: number) {
          const shape = new THREE.Shape();
          const x = width / 2;
          const y = height / 2;
          shape.moveTo(-x + radius, -y);
          shape.lineTo(x - radius, -y);
          shape.quadraticCurveTo(x, -y, x, -y + radius);
          shape.lineTo(x, -notch);
          if (notch) shape.absarc(x, 0, notch, -Math.PI / 2, Math.PI / 2, true);
          shape.lineTo(x, y - radius);
          shape.quadraticCurveTo(x, y, x - radius, y);
          shape.lineTo(-x + radius, y);
          shape.quadraticCurveTo(-x, y, -x, y - radius);
          shape.lineTo(-x, notch);
          if (notch) shape.absarc(-x, 0, notch, Math.PI / 2, Math.PI * 1.5, true);
          shape.lineTo(-x, -y + radius);
          shape.quadraticCurveTo(-x, -y, -x + radius, -y);
          return shape;
        }

        function extrude(shape: InstanceType<typeof THREE.Shape>, depth: number, bevel: number) {
          const geometry = new THREE.ExtrudeGeometry(shape, {
            depth,
            bevelEnabled: bevel > 0,
            bevelThickness: bevel,
            bevelSize: bevel,
            bevelSegments: 3,
            curveSegments: 12,
            steps: 1,
          });
          geometries.add(geometry);
          return geometry;
        }

        const shell = new THREE.Mesh(extrude(ticketShape(4.5, 4.1, 0.28, 0.10), 0.065, 0.025), silver);
        shell.position.z = -0.10;
        pass.add(shell);
        const smokedFace = new THREE.Mesh(extrude(ticketShape(4.43, 4.03, 0.25, 0.115), 0.007, 0.008), face);
        smokedFace.position.z = 0.025;
        pass.add(smokedFace);

        // The inner rim is a genuine beveled extrusion with an open center.
        const rimShape = ticketShape(4.5, 4.1, 0.28, 0.10);
        const inset = ticketShape(4.43, 4.03, 0.25, 0.115);
        const hole = new THREE.Path(inset.getPoints(36).reverse());
        rimShape.holes.push(hole);
        const rim = new THREE.Mesh(extrude(rimShape, 0.010, 0.009), silver);
        rim.position.z = 0.045;
        pass.add(rim);

        // Reflective ribbons curve through depth, above and beneath the pass.
        function ribbon(points: number[][], width: number, material: Material) {
          const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point as [number, number, number])));
          const vertices: number[] = [];
          const indices: number[] = [];
          const samples = 84;
          const binormal = new THREE.Vector3();
          const forward = new THREE.Vector3(0, 0, 1);
          for (let index = 0; index <= samples; index++) {
            const t = index / samples;
            const position = curve.getPoint(t);
            const tangent = curve.getTangent(t);
            binormal.crossVectors(tangent, forward).normalize();
            binormal.applyAxisAngle(tangent, Math.sin(t * Math.PI * 1.4) * 0.95);
            const taper = 0.2 + Math.pow(Math.sin(t * Math.PI), 0.55) * 0.8;
            for (const side of [-1, 1]) {
              const edge: Vector3 = position.clone().addScaledVector(binormal, width * taper * side / 2);
              vertices.push(edge.x, edge.y, edge.z);
            }
            if (index < samples) {
              const a = index * 2;
              indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
            }
          }
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
          geometry.setIndex(indices);
          geometry.computeVertexNormals();
          geometries.add(geometry);
          const mesh = new THREE.Mesh(geometry, material);
          sculpture.add(mesh);
          return mesh;
        }

        const upper = ribbon([
          [-2.46, -0.85, -0.65], [-2.38, 1.25, -0.55], [-1.05, 2.25, -0.25],
          [0.95, 2.3, -0.1], [2.34, 1.56, 0.2], [2.43, 0.55, 0.38],
        ], 0.07, silver);
        const lower = ribbon([
          [-2.42, -0.62, 0.08], [-2.28, -1.91, 0.17], [-0.75, -2.52, -0.25],
          [1.06, -2.47, -0.35], [2.3, -1.46, -0.55], [2.43, 0.5, -0.8],
        ], 0.04, gold);
        ribbon([
          [-2.4, 0.95, -0.65], [-1.75, 2.03, -0.65], [-0.2, 2.41, -0.3],
          [1.8, 2.0, -0.1], [2.4, 0.8, 0.05],
        ], 0.012, gold);

        // Machined corner details are physical cuts, not a decorative HUD.
        const etchingMaterial = new THREE.MeshBasicMaterial({ color: 0x829496, transparent: true, opacity: 0.32 });
        materials.add(etchingMaterial);
        for (let index = 0; index < 9; index++) {
          const geometry = new THREE.BoxGeometry(0.013, index % 3 === 0 ? 0.17 : 0.1, 0.005);
          geometries.add(geometry);
          const etching = new THREE.Mesh(geometry, etchingMaterial);
          etching.position.set(1.49 + index * 0.046, -1.73, 0.082);
          pass.add(etching);
        }

        const pointerTarget = new THREE.Vector2(-0.2, 0.25);
        const mobileQuery = matchMedia('(max-width: 767px)');
        let frame = 0;
        let lastDraw = 0;
        let width = 0;
        let height = 0;
        let contextLost = false;
        const section = container.closest('#reserve') ?? container.parentElement;
        const reduced = () => settingsRef.current.reducedMotion || motionQuery.matches;
        const visible = () => inView && !document.hidden && !settingsRef.current.paused;
        const stop = () => {
          cancelAnimationFrame(frame);
          frame = 0;
          lastDraw = 0;
          container.dataset.running = 'false';
        };
        const render = () => {
          if (contextLost || disposed || !width || !height) return;
          renderer.render(scene, camera);
          container.dataset.graphics = 'webgl';
        };
        const animate = (timestamp: number) => {
          frame = 0;
          if (disposed || contextLost || !visible() || reduced()) return;
          const elapsed = timestamp - lastDraw;
          if (elapsed >= 1000 / (mobileQuery.matches ? 24 : 30)) {
            const delta = lastDraw ? Math.min(elapsed / 1000, 0.08) : 0;
            lastDraw = timestamp;
            common.time.value += delta;
            common.light.value.lerp(pointerTarget, 1 - Math.exp(-delta * 4));
            upper.rotation.z = Math.sin(common.time.value * 0.19) * 0.012;
            lower.rotation.z = Math.sin(common.time.value * 0.16 + 2) * 0.012;
            render();
          }
          frame = requestAnimationFrame(animate);
        };
        const sync = () => {
          stop();
          if (!visible() || contextLost || disposed) return;
          render();
          if (!reduced()) {
            container.dataset.running = 'true';
            frame = requestAnimationFrame(animate);
          }
        };
        syncRef.current = sync;
        const resize = () => {
          const bounds = container.getBoundingClientRect();
          width = bounds.width;
          height = bounds.height;
          if (!width || !height) return;
          const dpr = Math.min(devicePixelRatio || 1, 1.25, Math.sqrt(450000 / (width * height)));
          renderer.setPixelRatio(dpr);
          renderer.setSize(width, height, false);
          const halfWidth = 2.55;
          const halfHeight = halfWidth * height / width;
          // The ticket keeps its authored screen proportions in both the
          // broad desktop frame and narrow portrait frame.
          sculpture.scale.y = 0.896 * height / width;
          camera.left = -halfWidth;
          camera.right = halfWidth;
          camera.top = halfHeight;
          camera.bottom = -halfHeight;
          camera.updateProjectionMatrix();
          sync();
        };
        const onPointerMove = (event: Event) => {
          if (reduced() || !visible() || !section) return;
          const pointer = event as PointerEvent;
          const rect = section.getBoundingClientRect();
          pointerTarget.set(
            Math.max(-1, Math.min(1, (pointer.clientX - rect.left) / rect.width * 2 - 1)),
            Math.max(-1, Math.min(1, 1 - (pointer.clientY - rect.top) / rect.height * 2)),
          );
        };
        const onPointerLeave = () => pointerTarget.set(-0.2, 0.25);
        const onContextLost = (event: Event) => {
          event.preventDefault();
          contextLost = true;
          stop();
          container.dataset.graphics = 'fallback';
          canvas.style.visibility = 'hidden';
        };
        const onContextRestored = () => {
          contextLost = false;
          canvas.style.visibility = 'visible';
          resize();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        document.addEventListener('visibilitychange', sync);
        motionQuery.addEventListener('change', sync);
        section?.addEventListener('pointermove', onPointerMove, { passive: true });
        section?.addEventListener('pointerdown', onPointerMove, { passive: true });
        section?.addEventListener('pointerleave', onPointerLeave, { passive: true });
        section?.addEventListener('pointerup', onPointerLeave, { passive: true });
        canvas.addEventListener('webglcontextlost', onContextLost);
        canvas.addEventListener('webglcontextrestored', onContextRestored);
        destroyGraphics = () => {
          stop();
          syncRef.current = null;
          resizeObserver.disconnect();
          document.removeEventListener('visibilitychange', sync);
          motionQuery.removeEventListener('change', sync);
          section?.removeEventListener('pointermove', onPointerMove);
          section?.removeEventListener('pointerdown', onPointerMove);
          section?.removeEventListener('pointerleave', onPointerLeave);
          section?.removeEventListener('pointerup', onPointerLeave);
          canvas.removeEventListener('webglcontextlost', onContextLost);
          canvas.removeEventListener('webglcontextrestored', onContextRestored);
          geometries.forEach((geometry) => geometry.dispose());
          materials.forEach((material) => material.dispose());
          scene.clear();
          renderer.dispose();
          renderer.forceContextLoss();
          canvas.remove();
        };
        resize();
      } catch {
        destroyGraphics?.();
        destroyGraphics = null;
        container.dataset.graphics = 'fallback';
        container.dataset.running = 'false';
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !initializing) void initialize();
      syncRef.current?.();
    }, { threshold: 0.02 });
    observer.observe(container);
    return () => {
      disposed = true;
      observer.disconnect();
      destroyGraphics?.();
      syncRef.current = null;
    };
  }, []);

  useEffect(() => {
    settingsRef.current = { paused, reducedMotion };
    syncRef.current?.();
  }, [paused, reducedMotion]);

  return <div ref={containerRef} className="reservation-optics" data-graphics="fallback" data-running="false" aria-hidden="true" />;
}
