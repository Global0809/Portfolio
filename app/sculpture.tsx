'use client';
import { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { films } from './films';

type Props = {
  active: number;
  paused: boolean;
  reduced: boolean;
  onSelect: (index: number, target?: HTMLElement) => void;
  onPreview: (index: number) => void;
};
export function FilmSculpture({
  active,
  paused,
  reduced,
  onSelect,
  onPreview,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef({ active, paused, reduced, onSelect });
  current.current = { active, paused, reduced, onSelect };
  const [ready, setReady] = useState(false);
  const wakeRef = useRef<(() => void) | null>(null);
  const hitRef = useRef<((x: number, y: number) => number) | null>(null);
  const swipe = useRef<{ x: number; y: number; pointerId: number } | null>(
    null,
  );
  const ignoreClickUntil = useRef(0);
  useEffect(() => {
    wakeRef.current?.();
  }, [active, paused, reduced]);
  useEffect(() => {
    let stopped = false;
    let cleanup = () => {};
    async function init() {
      if (
        (navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData
      )
        return;
      const THREE = await import('three');
      const { RoundedBoxGeometry } =
        await import('three/addons/geometries/RoundedBoxGeometry.js');
      const { RoomEnvironment } =
        await import('three/addons/environments/RoomEnvironment.js');
      if (stopped || !host.current) return;
      const mount = host.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',
        });
      } catch {
        return;
      }
      renderer.setPixelRatio(
        Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.75),
      );
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      mount.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
      camera.position.set(0, 0.15, 9);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
      scene.add(new THREE.AmbientLight(0xffffff, 2));
      const key = new THREE.DirectionalLight(0xe4f2ff, 3.5);
      key.position.set(-3, 5, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffdfbb, 3.8);
      rim.position.set(4, 2, -2);
      scene.add(rim);
      const sculpture = new THREE.Group();
      scene.add(sculpture);
      const w = 2.16,
        h = 3.84;
      const bodyGeometry = new RoundedBoxGeometry(
        w + 0.14,
        h + 0.14,
        0.22,
        5,
        0.1,
      );
      function roundedShape(width: number, height: number, r: number) {
        const s = new THREE.Shape();
        const x = -width / 2,
          y = -height / 2;
        s.moveTo(x + r, y);
        s.lineTo(x + width - r, y);
        s.quadraticCurveTo(x + width, y, x + width, y + r);
        s.lineTo(x + width, y + height - r);
        s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        s.lineTo(x + r, y + height);
        s.quadraticCurveTo(x, y + height, x, y + height - r);
        s.lineTo(x, y + r);
        s.quadraticCurveTo(x, y, x + r, y);
        return s;
      }
      const photoGeometry = new THREE.ShapeGeometry(roundedShape(w, h, 0.1));
      const positions = photoGeometry.getAttribute('position');
      const uv = photoGeometry.getAttribute('uv');
      for (let i = 0; i < positions.count; i++)
        uv.setXY(i, positions.getX(i) / w + 0.5, positions.getY(i) / h + 0.5);
      const edgeGeometry = new THREE.BufferGeometry().setFromPoints(
        roundedShape(w + 0.06, h + 0.06, 0.12)
          .getSpacedPoints(120)
          .map((p) => new THREE.Vector3(p.x, p.y, 0.155)),
      );
      edgeGeometry.setAttribute(
        'perimeter',
        new THREE.Float32BufferAttribute(
          Array.from({ length: 121 }, (_, i) => i / 120),
          1,
        ),
      );
      const backEdgeGeometry = new THREE.BufferGeometry().setFromPoints(
        roundedShape(w + 0.14, h + 0.14, 0.15)
          .getPoints(48)
          .map((p) => new THREE.Vector3(p.x, p.y, -0.1)),
      );
      const glass = new THREE.MeshPhysicalMaterial({
        color: 0xaab7c0,
        metalness: 0.08,
        roughness: 0.08,
        transmission: 0.75,
        thickness: 0.8,
        ior: 1.5,
        transparent: true,
        opacity: 0.66,
        envMapIntensity: 1.5,
        clearcoat: 1,
        iridescence: 0.12,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [100, 220],
      });
      const loader = new THREE.TextureLoader();
      const photos: InstanceType<typeof THREE.Mesh>[] = [];
      const textures: InstanceType<typeof THREE.Texture>[] = [];
      const edges: InstanceType<typeof THREE.ShaderMaterial>[] = [];
      const groups = films.map((film, index) => {
        const group = new THREE.Group();
        const backing = new THREE.Mesh(bodyGeometry, glass);
        group.add(backing);
        const tex = loader.load(film.cover, () => {
          dirty = true;
          wake();
        });
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        textures.push(tex);
        const photo = new THREE.Mesh(
          photoGeometry,
          new THREE.MeshBasicMaterial({ map: tex }),
        );
        photo.position.z = 0.146;
        photo.userData.index = index;
        group.add(photo);
        photos.push(photo);
        const edge = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: { sweep: { value: 0 }, strength: { value: 0 } },
          vertexShader: `attribute float perimeter; varying float vEdge;
            void main(){vEdge=perimeter;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
          fragmentShader: `uniform float sweep; uniform float strength; varying float vEdge;
            void main(){float d=abs(vEdge-sweep);d=min(d,1.-d);
              float light=exp(-d*d*700.)*strength;
              vec3 silver=mix(vec3(.66,.78,.86),vec3(.98,.97,.93),light);
              gl_FragColor=vec4(silver,.36+light*.64);}`,
        });
        edges.push(edge);
        group.add(new THREE.LineLoop(edgeGeometry, edge));
        group.add(
          new THREE.LineLoop(
            backEdgeGeometry,
            new THREE.LineBasicMaterial({
              color: 0xa3917f,
              transparent: true,
              opacity: 0.55,
            }),
          ),
        );
        sculpture.add(group);
        return group;
      });
      const pointer = new THREE.Vector2(0, 0);
      const raycaster = new THREE.Raycaster();
      let dirty = true,
        lastActive = -1,
        lastTime = 0,
        raf = 0,
        rendered = false,
        inView = true,
        contextLost = false;
      let edgeStarted = -2000;
      const eligible = () =>
        !stopped &&
        !contextLost &&
        inView &&
        !document.hidden &&
        !current.current.paused;
      function wake() {
        if (eligible() && !raf) raf = requestAnimationFrame(render);
      }
      const sync = () => {
        cancelAnimationFrame(raf);
        raf = 0;
        dirty = true;
        wake();
      };
      const resize = () => {
        const rect = mount.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height);
        camera.aspect = rect.width / rect.height;
        camera.position.z =
          rect.width < 320 ? 10.4 : rect.width < 480 ? 9.7 : 9;
        camera.updateProjectionMatrix();
        dirty = true;
        wake();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(mount);
      resize();
      const move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const rect = mount.getBoundingClientRect();
        pointer.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        dirty = true;
        wake();
      };
      const leave = () => {
        pointer.set(0, 0);
        dirty = true;
        wake();
      };
      hitRef.current = (clientX, clientY) => {
        const rect = mount.getBoundingClientRect();
        raycaster.setFromCamera(
          new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            (-(clientY - rect.top) / rect.height) * 2 + 1,
          ),
          camera,
        );
        const hit = raycaster.intersectObjects(photos)[0];
        return hit ? hit.object.userData.index : current.current.active;
      };
      const lost = (e: Event) => {
        e.preventDefault();
        setReady(false);
        contextLost = true;
        delete mount.dataset.rendered;
        cancelAnimationFrame(raf);
        raf = 0;
      };
      const restored = () => {
        contextLost = false;
        rendered = false;
        resize();
      };
      const intersection =
        'IntersectionObserver' in window
          ? new IntersectionObserver(
              ([entry]) => {
                inView = entry.isIntersecting;
                sync();
              },
              { rootMargin: '80px' },
            )
          : null;
      intersection?.observe(mount);
      mount.addEventListener('pointermove', move);
      mount.addEventListener('pointerleave', leave);
      renderer.domElement.addEventListener('webglcontextlost', lost);
      renderer.domElement.addEventListener('webglcontextrestored', restored);
      document.addEventListener('visibilitychange', sync);
      wakeRef.current = sync;
      function render(now: number) {
        raf = 0;
        if (!eligible()) return;
        const state = current.current;
        if (now - lastTime < 32) {
          wake();
          return;
        }
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        if (lastActive !== state.active) {
          lastActive = state.active;
          edgeStarted = now;
          dirty = true;
        }
        // A single short glint on selection; no permanent extra GPU loop.
        const edgeProgress = Math.min(1, (now - edgeStarted) / 1400);
        const edgeAnimating = !state.reduced && edgeProgress < 1;
        if (
          !edgeAnimating &&
          edges.some((edge) => edge.uniforms.strength.value > 0)
        )
          dirty = true;
        edges.forEach((edge, i) => {
          edge.uniforms.sweep.value = edgeProgress;
          edge.uniforms.strength.value =
            edgeAnimating && i === state.active
              ? Math.sin(edgeProgress * Math.PI)
              : 0;
        });
        const lerp = state.reduced ? 1 : 1 - Math.exp(-delta * 5);
        let unsettled = false;
        groups.forEach((group, i) => {
          const d = ((i - state.active + 7) % 5) - 2;
          const x = d === 0 ? 0 : d * 1.03;
          const y = d === 0 ? -0.1 : 0.1 + Math.abs(d) * 0.18;
          const z = d === 0 ? 1.12 : -0.1 - Math.abs(d) * 0.25;
          const rz = d === 0 ? -0.035 : -d * 0.12;
          const ry = d === 0 ? -0.13 : -d * 0.25;
          if (
            Math.abs(group.position.x - x) +
              Math.abs(group.position.z - z) +
              Math.abs(group.rotation.z - rz) >
            0.002
          )
            unsettled = true;
          group.position.x = THREE.MathUtils.lerp(group.position.x, x, lerp);
          group.position.y = THREE.MathUtils.lerp(group.position.y, y, lerp);
          group.position.z = THREE.MathUtils.lerp(group.position.z, z, lerp);
          group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, rz, lerp);
          group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, ry, lerp);
        });
        const targetY = state.reduced ? 0 : pointer.x * 0.055;
        const targetX = state.reduced ? 0 : -pointer.y * 0.035;
        if (
          Math.abs(sculpture.rotation.y - targetY) +
            Math.abs(sculpture.rotation.x - targetX) >
          0.0002
        )
          unsettled = true;
        sculpture.rotation.y = THREE.MathUtils.lerp(
          sculpture.rotation.y,
          targetY,
          lerp,
        );
        sculpture.rotation.x = THREE.MathUtils.lerp(
          sculpture.rotation.x,
          targetX,
          lerp,
        );
        if (dirty || unsettled || edgeAnimating || !rendered) {
          renderer.render(scene, camera);
          dirty = false;
          rendered = true;
          if (mount.dataset.rendered !== 'true') {
            mount.dataset.rendered = 'true';
            setReady(true);
          }
        }
        if ((unsettled || edgeAnimating) && !state.reduced) wake();
      }
      wake();
      cleanup = () => {
        cancelAnimationFrame(raf);
        observer.disconnect();
        intersection?.disconnect();
        wakeRef.current = null;
        hitRef.current = null;
        mount.removeEventListener('pointermove', move);
        mount.removeEventListener('pointerleave', leave);
        renderer.domElement.removeEventListener('webglcontextlost', lost);
        renderer.domElement.removeEventListener(
          'webglcontextrestored',
          restored,
        );
        document.removeEventListener('visibilitychange', sync);
        bodyGeometry.dispose();
        photoGeometry.dispose();
        edgeGeometry.dispose();
        backEdgeGeometry.dispose();
        glass.dispose();
        textures.forEach((t) => t.dispose());
        scene.traverse((obj) => {
          const m = (obj as InstanceType<typeof THREE.Mesh>).material;
          if (m) (Array.isArray(m) ? m : [m]).forEach((m) => m.dispose());
        });
        environment.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }
    void init().catch(() => setReady(false));
    return () => {
      stopped = true;
      cleanup();
    };
  }, []);
  return (
    <div className={`sculpture-wrap ${ready ? 'is-ready' : ''}`}>
      <div className="sculpture-fallback" aria-hidden={ready}>
        {films.map((film, i) => (
          <img
            key={film.id}
            src={film.cover}
            alt=""
            className={i === active ? 'chosen' : ''}
            style={
              { '--offset': ((i - active + 7) % 5) - 2 } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div
        className="sculpture-canvas"
        ref={host}
        role="button"
        tabIndex={0}
        aria-label={`Watch ${films[active].title}`}
        aria-describedby="swipe-hint"
        onPointerDown={(e) => {
          if (!e.isPrimary || e.button !== 0) return;
          swipe.current = {
            x: e.clientX,
            y: e.clientY,
            pointerId: e.pointerId,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerCancel={(e) => {
          if (swipe.current?.pointerId === e.pointerId) swipe.current = null;
        }}
        onLostPointerCapture={(e) => {
          if (swipe.current?.pointerId === e.pointerId) swipe.current = null;
        }}
        onPointerUp={(e) => {
          const start = swipe.current;
          if (start?.pointerId !== e.pointerId) return;
          swipe.current = null;
          if (!start) return;
          const dx = e.clientX - start.x,
            dy = e.clientY - start.y;
          if (Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy) * 1.3) {
            ignoreClickUntil.current = performance.now() + 500;
            onPreview((active + (dx < 0 ? 1 : 4)) % 5);
          }
        }}
        onClick={(e) => {
          if (performance.now() < ignoreClickUntil.current) return;
          onSelect(
            ready ? (hitRef.current?.(e.clientX, e.clientY) ?? active) : active,
            e.currentTarget,
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(active, e.currentTarget);
          }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            onPreview((active + (e.key === 'ArrowRight' ? 1 : 4)) % 5);
          }
        }}
      />
      {!ready && (
        <button
          className="fallback-watch"
          onClick={(e) => onSelect(active, e.currentTarget)}
          aria-label={`Watch ${films[active].title}`}
        >
          <Play size={20} fill="currentColor" />
        </button>
      )}
    </div>
  );
}
