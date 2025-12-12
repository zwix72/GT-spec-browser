import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Environment, OrbitControls, Sky } from '@react-three/drei';
import { useGameStore, CARS } from './store';
import { Vehicle } from './components/Vehicle';
import { Track } from './components/Track';
import { Garage, HUD } from './components/UI';

const KeyboardControls = ({ onInput }: { onInput: (c: any) => void }) => {
  useEffect(() => {
    const keys = { w: false, s: false, a: false, d: false, ' ': false };
    const update = () => onInput({
      forward: keys.w,
      backward: keys.s,
      left: keys.a,
      right: keys.d,
      brake: keys[' ']
    });
    
    const down = (e: any) => {
      if(keys.hasOwnProperty(e.key.toLowerCase())) {
        (keys as any)[e.key.toLowerCase()] = true;
        update();
      }
    };
    const up = (e: any) => {
      if(keys.hasOwnProperty(e.key.toLowerCase())) {
        (keys as any)[e.key.toLowerCase()] = false;
        update();
      }
    };
    
    (window as any).addEventListener('keydown', down);
    (window as any).addEventListener('keyup', up);
    return () => {
      (window as any).removeEventListener('keydown', down);
      (window as any).removeEventListener('keyup', up);
    };
  }, [onInput]);
  return null;
};

const Race = ({ onExit }: { onExit: () => void }) => {
  const { activeCarId, ownedCars, getCarStats } = useGameStore();
  
  // Resolve car data
  const car = ownedCars.find(c => c.instanceId === activeCarId) || ownedCars[0]; // Fallback
  const def = CARS.find(c => c.id === car?.defId);
  const stats = car ? getCarStats(car.instanceId) : null;
  
  const [controls, setControls] = useState({ forward: false, backward: false, left: false, right: false, brake: false });
  const [telemetry, setTelemetry] = useState({ speed: 0, rpm: 0, gear: 1 });
  const [lapTime, setLapTime] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setLapTime(t => t + 0.1), 100);
    return () => clearInterval(i);
  }, []);

  // Escape to exit
  useEffect(() => {
    const handleKey = (e: any) => {
      if (e.key === 'Escape') onExit();
    };
    (window as any).addEventListener('keydown', handleKey);
    return () => (window as any).removeEventListener('keydown', handleKey);
  }, [onExit]);

  if (!car || !def || !stats) return <div className="text-white">Car Error</div>;

  return (
    <>
      <Canvas shadows camera={{ position: [0, 5, -10], fov: 60 }}>
        <Sky sunPosition={[100, 20, 100]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 50, 10]} intensity={1} castShadow />
        
        <Physics gravity={[0, -9.8, 0]}>
          <Vehicle 
            position={[0, 2, 0]} 
            rotation={[0, Math.PI, 0]} 
            stats={stats}
            def={def}
            color={car.customColor}
            controls={controls}
            onSpeedUpdate={(s, r, g) => setTelemetry({ speed: s, rpm: r, gear: g })}
          />
          <Track />
        </Physics>
        
        <KeyboardControls onInput={setControls} />
      </Canvas>
      <HUD {...telemetry} lapTime={lapTime} />
      <div className="absolute top-4 right-4 text-white/50 text-sm">PRESS ESC TO EXIT</div>
    </>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<'GARAGE' | 'RACE'>('GARAGE');
  
  // Hydration check for persist
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(true), []);

  if (!loaded) return <div className="bg-black text-white h-screen flex items-center justify-center">Loading Engine...</div>;

  return (
    <div className="w-full h-screen bg-black">
      {mode === 'GARAGE' && <Garage onRace={() => setMode('RACE')} />}
      {mode === 'RACE' && <Race onExit={() => setMode('GARAGE')} />}
    </div>
  );
};

export default App;