// three.js scene for SolarSystemOrrery. Loaded lazily so three/r3f only ship to
// readers who scroll to the lab (blog AGENTS: heavy islands use client:visible).
//
// Surface maps: Solar System Scope (https://www.solarsystemscope.com/textures/),
// CC BY 4.0, based on NASA imagery. Re-encoded to WebP; credit is shown under the lab.
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, Html, Line, useTexture } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  RingGeometry,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Mesh,
  type Texture,
} from "three";
import { HelioVector, Ecliptic } from "astronomy-engine";
import { PLANETS, SCENE, type PlanetId, type PlanetInfo } from "./data";
import sunUrl from "./textures/sun.webp?url";
import mercuryUrl from "./textures/mercury.webp?url";
import venusUrl from "./textures/venus.webp?url";
import earthDayUrl from "./textures/earth-day.webp?url";
import earthNightUrl from "./textures/earth-night.webp?url";
import earthCloudsUrl from "./textures/earth-clouds.webp?url";
import moonUrl from "./textures/moon.webp?url";
import marsUrl from "./textures/mars.webp?url";
import jupiterUrl from "./textures/jupiter.webp?url";
import saturnUrl from "./textures/saturn.webp?url";
import saturnRingUrl from "./textures/saturn-ring.webp?url";
import uranusUrl from "./textures/uranus.webp?url";
import neptuneUrl from "./textures/neptune.webp?url";
import milkyWayUrl from "./textures/milky-way.webp?url";

export interface ScenePlanet {
  id: PlanetId;
  /** heliocentric ecliptic longitude, degrees */
  elon: number;
  /** heliocentric ecliptic latitude, degrees */
  elat: number;
  /** distance from the Sun, AU */
  r: number;
}

/** Geocentric ecliptic direction of the Moon, degrees. */
export interface SceneMoon {
  elon: number;
  elat: number;
}

interface Props {
  planets: ScenePlanet[];
  moon: SceneMoon | null;
  names: Record<string, string>;
  selected: PlanetId | null;
  /** planet the camera flies to; null = whole-system view */
  focus: PlanetId | null;
  onSelect: (id: PlanetId) => void;
  trueScale: boolean;
}

const SURFACE: Record<PlanetId, string> = {
  mercury: mercuryUrl,
  venus: venusUrl,
  earth: earthDayUrl,
  mars: marsUrl,
  jupiter: jupiterUrl,
  saturn: saturnUrl,
  uranus: uranusUrl,
  neptune: neptuneUrl,
};

// Axial tilt (deg, IAU) and sidereal day (hours). Venus/Uranus retrograde spin is
// carried by a tilt above 90°. Spin is slowed to a readable visual pace below.
const SPIN: Record<PlanetId, { tilt: number; dayHours: number }> = {
  mercury: { tilt: 0.03, dayHours: 1407.6 },
  venus: { tilt: 177.36, dayHours: 5832.5 },
  earth: { tilt: 23.44, dayHours: 23.93 },
  mars: { tilt: 25.19, dayHours: 24.62 },
  jupiter: { tilt: 3.13, dayHours: 9.93 },
  saturn: { tilt: 26.73, dayHours: 10.66 },
  uranus: { tilt: 97.77, dayHours: 17.24 },
  neptune: { tilt: 28.32, dayHours: 16.11 },
};

const DEG = Math.PI / 180;

// Distances are compressed (√AU) so Mercury and Neptune fit in one view; sizes are
// exaggerated for the same reason. The UI states both, and "true scale" switches distance.
function scaleDistance(au: number, trueScale: boolean): number {
  return trueScale ? au * 1.2 : 4 * Math.sqrt(au);
}

function displayRadius(p: PlanetInfo): number {
  return 0.2 * Math.sqrt(p.radiusKm / 6371);
}

function toXYZ(elon: number, elat: number, r: number): [number, number, number] {
  const lon = elon * DEG;
  const lat = elat * DEG;
  return [r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), -r * Math.cos(lat) * Math.sin(lon)];
}

function useReducedMotion(): boolean {
  return useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
}

function useOrbitPaths(trueScale: boolean) {
  return useMemo(() => {
    const start = Date.UTC(2026, 0, 1);
    return PLANETS.map((p) => {
      const pts: [number, number, number][] = [];
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const t = new Date(start + (p.periodDays * 86_400_000 * i) / steps);
        const v = HelioVector(p.body, t);
        const e = Ecliptic(v);
        const r = Math.hypot(v.x, v.y, v.z);
        pts.push(toXYZ(e.elon, e.elat, scaleDistance(r, trueScale)));
      }
      return { id: p.id, pts };
    });
  }, [trueScale]);
}

function srgb(...textures: Texture[]) {
  for (const t of textures) {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
  }
}

/* ---------- Sun ---------- */

const SUN_GLOW = new Color(SCENE.sunlight).multiplyScalar(3.2);

function Sun({ still }: { still: boolean }) {
  const map = useTexture(sunUrl, (t) => srgb(t));
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (!still && ref.current) ref.current.rotation.y += dt * 0.03;
  });
  return (
    <group>
      {/* toneMapped=false + colour above 1 → only the Sun crosses the bloom threshold */}
      <mesh ref={ref}>
        <sphereGeometry args={[1, 64, 32]} />
        <meshBasicMaterial map={map} color={SUN_GLOW} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2.6} decay={0} color={SCENE.sunlight} />
    </group>
  );
}

/* ---------- Earth: day/night shader, clouds, atmosphere ---------- */

const EARTH_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosW = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const EARTH_FRAG = /* glsl */ `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D cloudMap;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 toSun = normalize(-vPosW);
  float d = dot(n, toSun);
  vec3 day = texture2D(dayMap, vUv).rgb;
  vec3 night = texture2D(nightMap, vUv).rgb;
  float cloud = texture2D(cloudMap, vUv).r;
  vec3 lit = mix(day, vec3(1.0), cloud * 0.85) * (0.02 + 1.1 * max(d, 0.0));
  vec3 dark = day * 0.006 + night * 2.2 * (1.0 - cloud * 0.7);
  gl_FragColor = vec4(mix(dark, lit, smoothstep(-0.12, 0.18, d)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const ATMO_FRAG = /* glsl */ `
uniform vec3 glow;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 n = normalize(vNormalW);
  vec3 v = normalize(cameraPosition - vPosW);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  float sun = smoothstep(-0.3, 0.6, dot(n, normalize(-vPosW)));
  gl_FragColor = vec4(glow * rim * sun * 1.4, rim * sun);
  #include <colorspace_fragment>
}`;

function EarthSurface({ radius }: { radius: number }) {
  const [day, night, clouds] = useTexture([earthDayUrl, earthNightUrl, earthCloudsUrl], (ts) =>
    srgb(...(ts as Texture[]).slice(0, 2)),
  );
  const uniforms = useMemo(
    () => ({ dayMap: { value: day }, nightMap: { value: night }, cloudMap: { value: clouds } }),
    [day, night, clouds],
  );
  const atmo = useMemo(() => ({ glow: { value: new Color(SCENE.atmosphere) } }), []);
  return (
    <>
      <mesh>
        <sphereGeometry args={[radius, 64, 32]} />
        <shaderMaterial vertexShader={EARTH_VERT} fragmentShader={EARTH_FRAG} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.06}>
        <sphereGeometry args={[radius, 48, 24]} />
        <shaderMaterial
          vertexShader={EARTH_VERT}
          fragmentShader={ATMO_FRAG}
          uniforms={atmo}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function Moon({ dir, earthRadius }: { dir: SceneMoon; earthRadius: number }) {
  const map = useTexture(moonUrl, (t) => srgb(t));
  // Not to scale: the real orbit (60 Earth radii) would put it far outside the
  // exaggerated planet sizes. Direction is the true geocentric one for the date.
  const pos = toXYZ(dir.elon, dir.elat, earthRadius * 3.2);
  return (
    <mesh position={pos}>
      <sphereGeometry args={[earthRadius * 0.27, 32, 16]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  );
}

/* ---------- Saturn's rings ---------- */

function SaturnRings({ radius }: { radius: number }) {
  const map = useTexture(saturnRingUrl, (t) => srgb(t));
  const geometry = useMemo(() => {
    // Ring texture runs inner→outer along U, so remap UVs radially.
    const inner = radius * 1.24;
    const outer = radius * 2.27;
    const g = new RingGeometry(inner, outer, 128, 1);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [radius]);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial map={map} transparent side={DoubleSide} roughness={1} depthWrite={false} />
    </mesh>
  );
}

/* ---------- Planets ---------- */

function TexturedSurface({ id, radius }: { id: PlanetId; radius: number }) {
  const map = useTexture(SURFACE[id], (t) => srgb(t));
  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 32]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

function Planet({
  info,
  pos,
  name,
  selected,
  focused,
  moon,
  still,
  onSelect,
}: {
  info: PlanetInfo;
  pos: [number, number, number];
  name: string;
  selected: boolean;
  /** labels are hidden while the camera is close to a planet (they would balloon in size) */
  focused: boolean;
  moon: SceneMoon | null;
  still: boolean;
  onSelect: (id: PlanetId) => void;
}) {
  const radius = displayRadius(info);
  const spin = SPIN[info.id];
  const spinRef = useRef<Group>(null);
  const speed = 0.35 * Math.pow(24 / spin.dayHours, 0.35);
  useFrame((_, dt) => {
    if (!still && spinRef.current) spinRef.current.rotation.y += dt * speed;
  });
  const fallback = (
    <mesh>
      <sphereGeometry args={[radius, 32, 16]} />
      <meshStandardMaterial color={info.color} roughness={1} />
    </mesh>
  );
  return (
    <group position={pos}>
      <group
        rotation={[0, 0, spin.tilt * DEG]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(info.id);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <group ref={spinRef}>
          <Suspense fallback={fallback}>
            {info.id === "earth" ? <EarthSurface radius={radius} /> : <TexturedSurface id={info.id} radius={radius} />}
          </Suspense>
        </group>
        {info.id === "saturn" && (
          <Suspense fallback={null}>
            <SaturnRings radius={radius} />
          </Suspense>
        )}
        {/* generous invisible hit area so small planets are easy to tap */}
        <mesh visible={false}>
          <sphereGeometry args={[Math.max(radius * 1.6, 0.35), 12, 8]} />
        </mesh>
      </group>
      {info.id === "earth" && moon && (
        <Suspense fallback={null}>
          <Moon dir={moon} earthRadius={radius} />
        </Suspense>
      )}
      {/* kept mounted and hidden with CSS: unmounting drei <Html> mid-render races React */}
      <Html center distanceFactor={14} position={[0, radius + 0.35, 0]} zIndexRange={[10, 0]}>
        <button
          type="button"
          onClick={() => onSelect(info.id)}
          tabIndex={focused ? -1 : 0}
          aria-hidden={focused}
          className={
            focused
              ? "hidden"
              : selected
                ? "rounded-md bg-primary px-2 py-1 text-xs font-semibold whitespace-nowrap text-primary-foreground"
                : "rounded-md bg-background/80 px-2 py-1 text-xs whitespace-nowrap text-foreground"
          }
        >
          {name}
        </button>
      </Html>
    </group>
  );
}

/* ---------- Asteroid belt (illustrative, not real asteroid positions) ---------- */

function AsteroidBelt({ trueScale }: { trueScale: boolean }) {
  const count = 1400;
  const mesh = useMemo(() => {
    const geo = new IcosahedronGeometry(1, 0);
    const mat = new MeshStandardMaterial({ color: SCENE.asteroid, roughness: 1, flatShading: true });
    const m = new InstancedMesh(geo, mat, count);
    const dummy = new Object3D();
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const au = 2.15 + rand() * 1.15;
      const r = scaleDistance(au, trueScale);
      const a = rand() * Math.PI * 2;
      dummy.position.set(r * Math.cos(a), (rand() - 0.5) * 0.25 * (r / 6), -r * Math.sin(a));
      dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      dummy.scale.setScalar(0.008 + rand() * rand() * 0.035);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    return m;
  }, [trueScale]);
  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as MeshStandardMaterial).dispose();
    },
    [mesh],
  );
  return <primitive object={mesh} />;
}

function MilkyWay() {
  const map = useTexture(milkyWayUrl, (t) => srgb(t));
  return (
    <mesh>
      <sphereGeometry args={[400, 48, 24]} />
      <meshBasicMaterial map={map} side={BackSide} color={SCENE.skyDim} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/* ---------- Camera ---------- */

function CameraRig({
  focusId,
  focusPos,
  focusRadius,
  far,
}: {
  focusId: PlanetId | null;
  focusPos: [number, number, number] | null;
  focusRadius: number;
  far: number;
}) {
  const ref = useRef<CameraControls>(null);
  const last = useRef<Vector3 | null>(null);
  const key = focusId ? `${focusId}-${far}` : `overview-${far}`;

  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (!focusPos) {
      last.current = null;
      void c.setLookAt(0, far * 0.75, far * 0.85, 0, 0, 0, true);
      return;
    }
    // Look from the side so the day/night line and the night lights show.
    const p = new Vector3(...focusPos);
    last.current = p.clone();
    const toSun = p.clone().negate().normalize();
    const side = new Vector3(0, 1, 0).cross(toSun).normalize();
    const dir = toSun.multiplyScalar(-0.1).add(side).add(new Vector3(0, 0.3, 0)).normalize();
    const dist = Math.max(focusRadius * 6.5, 1.2);
    const cam = p.clone().add(dir.multiplyScalar(dist));
    void c.setLookAt(cam.x, cam.y, cam.z, p.x, p.y, p.z, true);
    // focusPos is read only when the focus target itself changes
  }, [key]);

  // While time flows, carry the camera along with the focused planet, keeping the reader's angle.
  const fx = focusPos?.[0];
  const fy = focusPos?.[1];
  const fz = focusPos?.[2];
  useEffect(() => {
    const c = ref.current;
    const prev = last.current;
    if (!c || !prev || fx === undefined || fy === undefined || fz === undefined) return;
    const delta = new Vector3(fx, fy, fz).sub(prev);
    if (delta.lengthSq() < 1e-10) return;
    last.current = new Vector3(fx, fy, fz);
    const pos = new Vector3();
    const target = new Vector3();
    c.getPosition(pos, true);
    c.getTarget(target, true);
    pos.add(delta);
    target.add(delta);
    void c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);
  }, [fx, fy, fz]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={0.6}
      maxDistance={far * 2.2}
      smoothTime={0.6}
      truckSpeed={0}
    />
  );
}

export default function OrreryScene({ planets, moon, names, selected, focus, onSelect, trueScale }: Props) {
  const orbits = useOrbitPaths(trueScale);
  const still = useReducedMotion();
  const far = trueScale ? 48 : 30;
  const focusInfo = focus ? PLANETS.find((p) => p.id === focus) : undefined;
  const focusSp = focus ? planets.find((p) => p.id === focus) : undefined;
  const focusPos = focusSp ? toXYZ(focusSp.elon, focusSp.elat, scaleDistance(focusSp.r, trueScale)) : null;

  return (
    <Canvas camera={{ position: [0, far * 0.75, far * 0.85], fov: 45, near: 0.05, far: 1000 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={[SCENE.space]} />
      <ambientLight intensity={0.07} />
      <Suspense fallback={null}>
        <MilkyWay />
      </Suspense>
      <Suspense fallback={null}>
        <Sun still={still} />
      </Suspense>
      {orbits.map((o) => (
        <Line
          key={o.id}
          points={o.pts}
          color={o.id === selected ? SCENE.highlight : SCENE.orbit}
          lineWidth={o.id === selected ? 1.6 : 0.8}
          transparent
          opacity={o.id === selected ? 0.9 : 0.55}
        />
      ))}
      <AsteroidBelt trueScale={trueScale} />
      {planets.map((sp) => {
        const info = PLANETS.find((p) => p.id === sp.id);
        if (!info) return null;
        return (
          <Planet
            key={sp.id}
            info={info}
            pos={toXYZ(sp.elon, sp.elat, scaleDistance(sp.r, trueScale))}
            name={names[sp.id]}
            selected={selected === sp.id}
            focused={focus !== null}
            moon={moon}
            still={still}
            onSelect={onSelect}
          />
        );
      })}
      <CameraRig focusId={focusInfo ? focus : null} focusPos={focusPos} focusRadius={focusInfo ? displayRadius(focusInfo) : 0} far={far} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={1.1} radius={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
