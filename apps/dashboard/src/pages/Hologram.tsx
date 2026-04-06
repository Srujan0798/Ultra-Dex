import React, { useRef, useState, memo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useWebSocket } from '../hooks/useWebSocket';

interface BuildingData {
    id: number;
    x: number;
    z: number;
    height: number;
    type: string;
    color: string;
    name: string;
    complexity: number;
}

const FILE_COLORS: Record<string, string> = {
    ts: '#3178c6',
    tsx: '#61dafb',
    js: '#f7df1e',
    css: '#264de4',
    json: '#a0a0a0'
};

function getFileType(name: string) {
    const parts = name.split('.');
    const ext = parts[parts.length - 1] || 'ts';
    return ext.toLowerCase();
}

// Mock Data for Code City
const generateCityData = (count = 50): BuildingData[] => {
    const data: BuildingData[] = [];
    const fileTypes = ['ts', 'tsx', 'js', 'css', 'json'] as const;

    for (let i = 0; i < count; i++) {
        const type = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        data.push({
            id: i,
            x: (Math.random() - 0.5) * 40,
            z: (Math.random() - 0.5) * 40,
            height: Math.random() * 5 + 1, // Lines of Code
            type,
            color: FILE_COLORS[type] || '#6b7280',
            name: `file_${i}.${type}`,
            complexity: Math.random() // width
        });
    }
    return data;
};

function buildCityFromGraph(nodes: Array<{ id?: string; name?: string; path?: string; size?: number; complexity?: number; metrics?: { loc?: number } }>) {
    if (!nodes.length) return generateCityData(40);

    const grid = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 3;

    return nodes.map((node, index) => {
        const row = Math.floor(index / grid);
        const col = index % grid;
        const name = node.name || node.path || `file_${index}.ts`;
        const type = getFileType(name);
        const loc = node.metrics?.loc || node.size || 10;
        const height = Math.max(1, Math.min(12, loc / 20));

        return {
            id: index,
            x: (col - grid / 2) * spacing,
            z: (row - grid / 2) * spacing,
            height,
            type,
            color: FILE_COLORS[type] || '#6b7280',
            name,
            complexity: node.complexity || Math.random()
        } as BuildingData;
    });
}

interface BuildingProps {
    position: [number, number, number];
    height: number;
    color: string;
    name: string;
    complexity?: number;
    onHover?: (name: string | null) => void;
}

const Building = ({ position, height, color, name, onHover }: BuildingProps) => {
    const mesh = useRef<Mesh | null>(null);
    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);

    useFrame((state, delta) => {
        if (active && mesh.current) {
            mesh.current.rotation.y += delta;
        }
    });

    return (
        <group position={position}>
            {/* Building Mesh */}
            <mesh
                ref={mesh}
                position={[0, height / 2, 0]}
                scale={active ? 1.2 : 1}
                onClick={() => setActive(!active)}
                onPointerOver={() => {
                    setHover(true);
                    onHover?.(name);
                }}
                onPointerOut={() => {
                    setHover(false);
                    onHover?.(null);
                }}
                aria-label={`File: ${name}`}
            >
                <boxGeometry args={[1, height, 1]} />
                <meshStandardMaterial
                    color={hovered ? 'hotpink' : color}
                    metalness={0.5}
                    roughness={0.2}
                />
            </mesh>
        </group>
    );
};

const CameraDrift = () => {
    const angleRef = useRef(0);

    useFrame((state, delta) => {
        angleRef.current += delta * 0.12;
        const radius = 16;
        state.camera.position.x = Math.cos(angleRef.current) * radius;
        state.camera.position.z = Math.sin(angleRef.current) * radius;
        state.camera.position.y = 10;
        state.camera.lookAt(0, 2, 0);
    });

    return null;
};

/**
 * Hologram Page - 3D Code Visualization
 * @returns {JSX.Element} Hologram page component
 */
const Hologram = memo(() => {
    const [cityData, setCityData] = useState<BuildingData[]>(() => generateCityData(60));
    const [hoveredFile, setHoveredFile] = useState<string | null>(null);
    const socketUrl =
        (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ULTRA_DEX_WS) ||
        'ws://localhost:3002/ws';
    const { data } = useWebSocket(socketUrl);

    useEffect(() => {
        if (!data || typeof data !== 'object') return;
        const payload = data as {
            type?: string;
            nodes?: Array<{ id?: string; name?: string; path?: string; size?: number; complexity?: number; metrics?: { loc?: number } }>;
            data?: { nodes?: Array<{ id?: string; name?: string; path?: string; size?: number; complexity?: number; metrics?: { loc?: number } }> };
        };

        if (payload.type === 'graph' && Array.isArray(payload.nodes)) {
            setCityData(buildCityFromGraph(payload.nodes));
        }

        if (payload.type === 'graph_update' && Array.isArray(payload.data?.nodes)) {
            setCityData(buildCityFromGraph(payload.data.nodes));
        }
    }, [data]);

    return (
        <main
            className="h-full w-full bg-gray-900 text-white flex flex-col"
            role="application"
            aria-label="3D Code Visualization"
        >
            <header className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Project Hologram: Code City
                </h1>
                <div className="flex gap-4 text-sm text-gray-400" aria-label="Language Legend">
                    <span className="flex items-center"><span className="w-3 h-3 bg-[#3178c6] mr-2" aria-hidden="true"></span>TS</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-[#61dafb] mr-2" aria-hidden="true"></span>React</span>
                    <span className="flex items-center"><span className="w-3 h-3 bg-[#f7df1e] mr-2" aria-hidden="true"></span>JS</span>
                </div>
            </header>

            <div className="flex-1 relative" aria-label="3D Canvas">
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                    {/* Lighting */}
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />
                    <spotLight position={[-10, 10, -10]} angle={0.3} penumbra={1} intensity={2} />

                    {/* Environment */}
                    <gridHelper args={[60, 60, '#4f4f4f', '#2f2f2f']} />
                    <CameraDrift />

                    {/* City */}
                    <group>
                        {cityData.map((building) => (
                            <Building
                                key={building.id}
                                position={[building.x, 0, building.z]}
                                height={building.height}
                                color={building.color}
                                name={building.name}
                                complexity={building.complexity}
                                onHover={setHoveredFile}
                            />
                        ))}
                    </group>

                </Canvas>

                <div
                    className="absolute bottom-4 left-4 bg-black/50 p-2 rounded text-xs"
                    role="contentinfo"
                    aria-label="Navigation Controls"
                >
                    <p>Auto-orbit enabled | Click building to inspect</p>
                </div>
                {hoveredFile && (
                    <div
                        className="absolute top-4 right-4 bg-black/60 px-3 py-2 rounded text-xs"
                        aria-live="polite"
                    >
                        {hoveredFile}
                    </div>
                )}
            </div>
        </main>
    );
});

export default Hologram;

/**
 * Error handler for Hologram component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handleHologramError(error: Error, errorInfo?: React.ErrorInfo) {
  try {
    console.error(`[Hologram] Rendering error:`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
