// three.js scene for SolarSystemOrrery. Loaded lazily so three/r3f only ship to
// readers who scroll to the lab (blog AGENTS: heavy islands use client:visible).
import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, Line, OrbitControls, Stars } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace, type Texture } from "three";
import { HelioVector, Ecliptic } from "astronomy-engine";
import { PLANETS, SCENE, type PlanetId, type PlanetInfo } from "./data";

export interface ScenePlanet {
  id: PlanetId;
  /** heliocentric ecliptic longitude, degrees */
  elon: number;
  /** heliocentric ecliptic latitude, degrees */
  elat: number;
  /** distance from the Sun, AU */
  r: number;
}

interface Props {
  planets: ScenePlanet[];
  names: Record<string, string>;
  selected: PlanetId | null;
  onSelect: (id: PlanetId) => void;
  trueScale: boolean;
}

// Distances are compressed (√AU) so Mercury and Neptune fit in one view; sizes are
// exaggerated for the same reason. The UI states both, and "true scale" switches distance.
function scaleDistance(au: number, trueScale: boolean): number {
  return trueScale ? au * 1.2 : 4 * Math.sqrt(au);
}

function displayRadius(p: PlanetInfo): number {
  return 0.2 * Math.sqrt(p.radiusKm / 6371);
}

function toXYZ(elon: number, elat: number, r: number): [number, number, number] {
  const lon = (elon * Math.PI) / 180;
  const lat = (elat * Math.PI) / 180;
  return [r * Math.cos(lat) * Math.cos(lon), r * Math.sin(lat), -r * Math.cos(lat) * Math.sin(lon)];
}

function makeTexture(p: PlanetInfo): Texture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = p.color;
  ctx.fillRect(0, 0, 256, 128);
  // deterministic pseudo-random so the texture is stable across renders
  let seed = p.id.length * 9301 + p.radiusKm;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  if (p.kind === "giant" && p.band) {
    for (let y = 0; y < 128; y += 4 + Math.floor(rand() * 10)) {
      ctx.globalAlpha = 0.25 + rand() * 0.45;
      ctx.fillStyle = rand() > 0.5 ? p.band : p.color;
      ctx.fillRect(0, y, 256, 2 + rand() * 7);
    }
    if (p.id === "jupiter") {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = "#b5523b";
      ctx.beginPath();
      ctx.ellipse(170, 82, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.15 + rand() * 0.35;
      ctx.fillStyle = p.band && rand() > 0.4 ? p.band : rand() > 0.5 ? "#00000044" : "#ffffff33";
      ctx.beginPath();
      ctx.arc(rand() * 256, 14 + rand() * 100, 2 + rand() * (p.id === "earth" ? 18 : 8), 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.id === "earth" || p.id === "mars") {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, 256, 6);
      ctx.fillRect(0, 122, 256, 6);
    }
  }
  ctx.globalAlpha = 1;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

function useOrbitPaths(trueScale: boolean) {
  return useMemo(() => {
    const start = Date.UTC(2026, 0, 1);
    return PLANETS.map((p) => {
      const pts: [number, number, number][] = [];
      const steps = 160;
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

function Planet({
  info,
  pos,
  name,
  selected,
  onSelect,
}: {
  info: PlanetInfo;
  pos: [number, number, number];
  name: string;
  selected: boolean;
  onSelect: (id: PlanetId) => void;
}) {
  const texture = useMemo(() => makeTexture(info), [info]);
  const radius = displayRadius(info);
  return (
    <group position={pos}>
      <mesh
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
        <sphereGeometry args={[radius, 32, 16]} />
        <meshStandardMaterial map={texture ?? undefined} color={texture ? "white" : info.color} roughness={0.9} />
      </mesh>
      {info.id === "saturn" && (
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <ringGeometry args={[radius * 1.3, radius * 2.2, 64]} />
          <meshBasicMaterial color={SCENE.ring} transparent opacity={0.6} side={2} />
        </mesh>
      )}
      {selected && (
        <mesh>
          <ringGeometry args={[radius * 1.6, radius * 1.8, 48]} />
          <meshBasicMaterial color={SCENE.highlight} side={2} />
        </mesh>
      )}
      <Html center distanceFactor={14} position={[0, radius + 0.35, 0]} zIndexRange={[10, 0]}>
        <button
          type="button"
          onClick={() => onSelect(info.id)}
          className={
            selected
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

export default function OrreryScene({ planets, names, selected, onSelect, trueScale }: Props) {
  const orbits = useOrbitPaths(trueScale);
  const far = trueScale ? 48 : 30;
  return (
    <Canvas camera={{ position: [0, far * 0.75, far * 0.85], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={[SCENE.space]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={3} decay={0} />
      <Stars radius={120} depth={40} count={2500} factor={3} fade speed={0.4} />
      <mesh>
        <sphereGeometry args={[1, 48, 24]} />
        <meshBasicMaterial color={SCENE.sun} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.35, 32, 16]} />
        <meshBasicMaterial color={SCENE.sun} transparent opacity={0.15} />
      </mesh>
      {orbits.map((o) => (
        <Line
          key={o.id}
          points={o.pts}
          color={o.id === selected ? SCENE.highlight : SCENE.orbit}
          lineWidth={o.id === selected ? 1.6 : 0.8}
          transparent
          opacity={0.8}
        />
      ))}
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
            onSelect={onSelect}
          />
        );
      })}
      <OrbitControls enablePan={false} minDistance={4} maxDistance={far * 2.2} enableDamping />
    </Canvas>
  );
}
