import React from 'react';
import { useGameStore, CARS, UPGRADES } from '../store';
import { ShoppingCart, Wrench, Play, DollarSign, ArrowLeft } from 'lucide-react';
import { CarDef, OwnedCar } from '../types';

interface MenuProps {
  onRace: () => void;
}

export const Garage: React.FC<MenuProps> = ({ onRace }) => {
  const { credits, ownedCars, activeCarId, buyCar, selectCar, buyUpgrade, sellCar, getCarStats } = useGameStore();
  const [view, setView] = React.useState<'GARAGE' | 'DEALER'>('GARAGE');
  const [selectedCarId, setSelectedCarId] = React.useState<string | null>(activeCarId || null);

  const activeCar = ownedCars.find(c => c.instanceId === selectedCarId);
  const activeDef = activeCar ? CARS.find(c => c.id === activeCar.defId) : null;
  const stats = selectedCarId ? getCarStats(selectedCarId) : null;

  if (view === 'DEALER') {
    return (
      <div className="absolute inset-0 bg-black/90 p-8 overflow-y-auto text-white z-50">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold italic tracking-tighter">GRAN TURISMO <span className="text-red-600">LITE</span> DEALERSHIP</h1>
            <div className="flex items-center gap-4">
               <span className="text-yellow-400 font-mono text-xl flex items-center"><DollarSign size={20}/> {credits.toLocaleString()}</span>
               <button onClick={() => setView('GARAGE')} className="flex items-center gap-2 hover:text-red-500"><ArrowLeft /> BACK TO GARAGE</button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CARS.map(car => (
              <div key={car.id} className="glass-panel p-6 flex flex-col gap-4 group hover:border-white transition-all">
                <div className="h-32 bg-gradient-to-br from-gray-800 to-black rounded-lg flex items-center justify-center">
                    {/* Placeholder for car image */}
                    <span className="text-4xl opacity-20 font-bold">{car.meshType.toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{car.name}</h3>
                  <div className="text-sm opacity-60 flex gap-4 mt-2">
                    <span>{car.baseStats.horsepower} HP</span>
                    <span>{car.driveTrain}</span>
                    <span>{car.baseStats.weight} KG</span>
                  </div>
                </div>
                <div className="mt-auto flex justify-between items-center">
                   <span className="text-xl font-mono text-yellow-400">{car.price.toLocaleString()} CR</span>
                   <button 
                     onClick={() => buyCar(car.id, car.color)}
                     disabled={credits < car.price}
                     className="px-6 py-2 bg-white text-black font-bold uppercase hover:bg-red-600 hover:text-white disabled:opacity-50 disabled:bg-gray-600"
                   >
                     Purchase
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black text-white p-8 overflow-hidden flex flex-col z-50">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center font-bold italic text-xl">GT</div>
             <h1 className="text-3xl font-light">MY GARAGE</h1>
        </div>
        <div className="flex gap-6 items-center">
          <span className="text-yellow-400 font-mono text-2xl flex items-center"><DollarSign /> {credits.toLocaleString()}</span>
          <button onClick={() => setView('DEALER')} className="px-6 py-2 border border-white hover:bg-white hover:text-black transition-colors uppercase text-sm tracking-widest">
            Car Dealer
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Car List */}
        <div className="w-1/3 flex flex-col gap-2 overflow-y-auto pr-2">
           <h3 className="opacity-50 text-sm tracking-widest mb-2 border-b border-gray-700 pb-2">OWNED VEHICLES</h3>
           {ownedCars.length === 0 && <div className="opacity-50 italic">No cars owned. Visit the dealer.</div>}
           {ownedCars.map(car => {
             const def = CARS.find(c => c.id === car.defId);
             return (
               <button 
                 key={car.instanceId} 
                 onClick={() => { setSelectedCarId(car.instanceId); selectCar(car.instanceId); }}
                 className={`p-4 text-left border-l-4 transition-all glass-panel ${selectedCarId === car.instanceId ? 'border-red-500 bg-white/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
               >
                 <div className="font-bold text-lg">{def?.name}</div>
                 <div className="text-xs opacity-50 font-mono">ID: {car.instanceId.slice(0,6)}</div>
               </button>
             );
           })}
        </div>

        {/* Selected Car Details */}
        <div className="flex-1 flex flex-col relative">
           {activeCar && activeDef && stats ? (
             <>
               <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-4 relative flex items-center justify-center overflow-hidden border border-white/10">
                   {/* 3D Preview would go here, static for now */}
                   <div className="text-9xl font-black opacity-10 italic select-none absolute transform -rotate-12">{activeDef.meshType}</div>
                   <div className="z-10 text-center">
                      <h2 className="text-5xl font-black italic mb-2 tracking-tighter">{activeDef.name.toUpperCase()}</h2>
                      <div className="flex gap-8 justify-center mt-8">
                         <div className="text-center"><div className="text-3xl font-mono text-red-500">{stats.horsepower}</div><div className="text-xs tracking-widest">HP</div></div>
                         <div className="text-center"><div className="text-3xl font-mono text-blue-500">{stats.torque}</div><div className="text-xs tracking-widest">NM</div></div>
                         <div className="text-center"><div className="text-3xl font-mono text-green-500">{stats.weight}</div><div className="text-xs tracking-widest">KG</div></div>
                         <div className="text-center"><div className="text-3xl font-mono text-yellow-500">{stats.grip.toFixed(1)}</div><div className="text-xs tracking-widest">GRIP</div></div>
                      </div>
                   </div>
               </div>

               <div className="h-1/3 flex gap-4">
                  {/* Upgrades */}
                  <div className="flex-1 glass-panel p-4 overflow-y-auto">
                     <h3 className="flex items-center gap-2 mb-4 font-bold border-b border-white/10 pb-2"><Wrench size={16}/> TUNING SHOP</h3>
                     <div className="space-y-2">
                        {UPGRADES.map(upg => {
                           const owned = activeCar.upgrades.includes(upg.id);
                           return (
                             <div key={upg.id} className="flex justify-between items-center text-sm p-2 hover:bg-white/5 rounded">
                                <div>
                                   <div className={owned ? "text-green-400" : ""}>{upg.name}</div>
                                   <div className="text-xs opacity-50">{Object.keys(upg.modifiers).join(', ')}</div>
                                </div>
                                {owned ? (
                                   <span className="text-xs bg-green-900 text-green-200 px-2 py-1 rounded">INSTALLED</span>
                                ) : (
                                   <button 
                                     onClick={() => buyUpgrade(activeCar.instanceId, upg.id)}
                                     disabled={credits < upg.cost}
                                     className="px-3 py-1 bg-white text-black font-bold text-xs hover:bg-red-500 hover:text-white disabled:opacity-20"
                                   >
                                     {upg.cost} CR
                                   </button>
                                )}
                             </div>
                           );
                        })}
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="w-48 flex flex-col gap-2">
                      <button onClick={onRace} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-2xl italic tracking-tighter flex items-center justify-center gap-2">
                         <Play fill="currentColor" /> RACE
                      </button>
                      <button onClick={() => sellCar(activeCar.instanceId)} className="py-4 bg-gray-800 hover:bg-red-900 text-sm font-mono border border-white/10">
                         SELL CAR
                      </button>
                  </div>
               </div>
             </>
           ) : (
             <div className="flex items-center justify-center h-full opacity-50">Select a car to tune</div>
           )}
        </div>
      </div>
    </div>
  );
};

export const HUD = ({ speed, rpm, gear, lapTime }: { speed: number, rpm: number, gear: number, lapTime: number }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
      <div className="flex justify-between items-start">
         <div className="glass-panel px-4 py-2">
            <div className="text-xs text-gray-400">LAP TIME</div>
            <div className="text-2xl font-mono">{lapTime.toFixed(2)}</div>
         </div>
      </div>
      
      <div className="flex justify-end items-end">
         <div className="glass-panel p-6 rounded-tl-3xl relative overflow-hidden w-64">
             {/* Tachometer Bar */}
             <div className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 transition-all duration-100 ease-out" style={{ width: `${(rpm / 8000) * 100}%` }}></div>
             
             <div className="flex items-baseline justify-end gap-2">
                <span className="text-6xl font-black italic tracking-tighter">{Math.floor(speed * 3.6)}</span>
                <span className="text-xl font-light opacity-60">KMH</span>
             </div>
             
             <div className="flex justify-between items-end mt-2">
                 <div className="text-center">
                    <div className="text-4xl font-bold text-yellow-500">{gear}</div>
                    <div className="text-[10px] tracking-widest opacity-50">GEAR</div>
                 </div>
                 <div className="text-right">
                    <div className="font-mono text-lg">{Math.round(rpm)}</div>
                    <div className="text-[10px] tracking-widest opacity-50">RPM</div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};
