import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Three.js hero backdrop: a stylised mechanical face seal (two interlocking
 * steel rings + rubber o-rings) that idles with a slow spin and leans with
 * page scroll. Adapted from the standalone Stitch export.
 */
export function SealCanvas({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const dir = new THREE.DirectionalLight(0xffffff, 1.3);
    dir.position.set(5, 5, 5);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xdfe8f5, 0.6);
    dir2.position.set(-4, -2, 3);
    scene.add(dir2);
    const blueLight = new THREE.PointLight(0x07549a, 2.4, 12);
    blueLight.position.set(-2, 1, 2);
    scene.add(blueLight);

    // Seal
    const sealGroup = new THREE.Group();

    const ringGeometry = new THREE.TorusGeometry(2, 0.3, 32, 100);
    const steelMaterial = new THREE.MeshPhongMaterial({
      color: 0x7d8794,
      specular: 0xffffff,
      shininess: 120,
    });
    const ring1 = new THREE.Mesh(ringGeometry, steelMaterial);
    const ring2 = new THREE.Mesh(ringGeometry, steelMaterial);
    ring2.rotation.x = Math.PI;
    ring2.position.z = 0.4;
    sealGroup.add(ring1, ring2);

    const oRingGeom = new THREE.TorusGeometry(2.3, 0.1, 16, 100);
    const rubberMaterial = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const oring1 = new THREE.Mesh(oRingGeom, rubberMaterial);
    const oring2 = new THREE.Mesh(oRingGeom, rubberMaterial);
    oring1.position.z = -0.2;
    oring2.position.z = 0.6;
    sealGroup.add(oring1, oring2);

    scene.add(sealGroup);

    // Scroll interaction
    let scrollY = window.scrollY;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!reduce) {
        sealGroup.rotation.y += 0.005;
        const targetRotX = scrollY * 0.001;
        sealGroup.rotation.x = THREE.MathUtils.lerp(sealGroup.rotation.x, targetRotX, 0.1);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      ringGeometry.dispose();
      oRingGeom.dispose();
      steelMaterial.dispose();
      rubberMaterial.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}
