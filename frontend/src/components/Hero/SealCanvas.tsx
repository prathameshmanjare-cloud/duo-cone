import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Three.js hero backdrop: a photoreal-ish DUO-CONE mechanical face seal pair
 * (two machined steel half-rings with black elastomer toric rings) rendered
 * with PBR chrome + an environment map for reflections. Idles with a slow
 * spin and a gentle tilt, and leans slightly toward the pointer.
 */
export function SealCanvas({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight || 1;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 9.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // ---- environment for reflections (no asset needed) ----
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    // ---- lights ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 6, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe8f5, 1.1);
    rim.position.set(-6, -1, 2);
    scene.add(rim);
    const blue = new THREE.PointLight(0x2f7fd0, 30, 30);
    blue.position.set(-3, 2, 3);
    scene.add(blue);

    // ---- materials ----
    const steel = new THREE.MeshStandardMaterial({
      color: 0xb8c0c9,
      metalness: 1,
      roughness: 0.22,
      envMapIntensity: 1.4,
    });
    const steelDark = new THREE.MeshStandardMaterial({
      color: 0x8b939d,
      metalness: 1,
      roughness: 0.38,
      envMapIntensity: 1.1,
    });
    const rubber = new THREE.MeshStandardMaterial({
      color: 0x0c0c0e,
      metalness: 0.1,
      roughness: 0.55,
      envMapIntensity: 0.6,
    });

    // ---- a single DUO-CONE seal, exploded into its parts along the axis ----
    // revolved profile of one machined metal sealing ring (x = radius, y = axial)
    const metalProfile: THREE.Vector2[] = [
      new THREE.Vector2(1.62, -0.5),
      new THREE.Vector2(1.62, 0.32),
      new THREE.Vector2(1.78, 0.48),
      new THREE.Vector2(2.16, 0.26), // angled duo-cone sealing face
      new THREE.Vector2(2.36, 0.18),
      new THREE.Vector2(2.36, -0.5),
      new THREE.Vector2(1.62, -0.5),
    ];

    function metalRing(mirror: boolean) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.LatheGeometry(metalProfile, 180), steel);
      body.rotation.x = -Math.PI / 2; // lathe axis Y -> Z
      const chamfer = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.04, 20, 180), steelDark);
      chamfer.position.z = 0.26;
      g.add(body, chamfer);
      if (mirror) g.rotation.y = Math.PI;
      return g;
    }
    function toric() {
      return new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.19, 26, 180), rubber);
    }

    const seal = new THREE.Group();
    type Part = { obj: THREE.Object3D; baseZ: number; drift: number };
    const parts: Part[] = [
      { obj: metalRing(false), baseZ: 1.7, drift: 0.6 },
      { obj: toric(), baseZ: 0.6, drift: -0.9 },
      { obj: toric(), baseZ: -0.6, drift: 0.9 },
      { obj: metalRing(true), baseZ: -1.7, drift: -0.6 },
    ];
    parts.forEach((p) => {
      p.obj.position.z = p.baseZ;
      seal.add(p.obj);
    });

    // present at a 3/4 angle
    seal.rotation.x = -0.42;
    seal.rotation.y = -0.4;
    seal.scale.setScalar(1);
    scene.add(seal);

    // ---- interaction ----
    let targetTilt = 0;
    let scrollY = window.scrollY;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onPointer = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      targetTilt = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });

    const onResize = () => {
      const w = container.clientWidth || container.offsetWidth || window.innerWidth;
      const h = container.clientHeight || container.offsetHeight || window.innerHeight || 1;
      if (w === width && h === height) return;
      width = w;
      height = h;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    ro?.observe(container);
    requestAnimationFrame(onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (!reduce) {
        seal.rotation.y += 0.0032;
        seal.rotation.x = -0.42 + Math.sin(t * 0.5) * 0.05 - scrollY * 0.0004;
        seal.position.y = Math.sin(t * 0.7) * 0.12;
        seal.rotation.z = THREE.MathUtils.lerp(seal.rotation.z, targetTilt * 0.4, 0.05);
        // breathe the exploded parts apart and back
        const explode = 1 + (Math.sin(t * 0.55) * 0.5 + 0.5) * 0.55;
        parts.forEach((p) => {
          p.obj.position.z = p.baseZ * explode;
          p.obj.rotation.z = Math.sin(t * 0.4 + p.drift * 3) * 0.06 * p.drift;
        });
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
        }
      });
      steel.dispose();
      steelDark.dispose();
      rubber.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
