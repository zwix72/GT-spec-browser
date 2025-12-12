import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CarDef, Upgrade, OwnedCar, GameState, CarStats } from './types';
import { v4 as uuidv4 } from 'uuid';

// --- DATA CATALOG ---

export const CARS: CarDef[] = [
  {
    id: 'starter_hatch',
    name: 'Civetta Bolide (Used)',
    price: 5000,
    driveTrain: 'FWD',
    color: '#8899AA',
    meshType: 'sport',
    baseStats: { horsepower: 110, torque: 140, weight: 1200, grip: 1.0, topSpeed: 180, acceleration: 8.5 }
  },
  {
    id: 'muscle_classic',
    name: 'V8 Stallion',
    price: 25000,
    driveTrain: 'RWD',
    color: '#AA2200',
    meshType: 'muscle',
    baseStats: { horsepower: 300, torque: 450, weight: 1600, grip: 0.9, topSpeed: 240, acceleration: 5.8 }
  },
  {
    id: 'super_concept',
    name: 'Proto X-1',
    price: 150000,
    driveTrain: 'AWD',
    color: '#11FF44',
    meshType: 'super',
    baseStats: { horsepower: 600, torque: 700, weight: 1100, grip: 2.5, topSpeed: 330, acceleration: 2.9 }
  }
];

export const UPGRADES: Upgrade[] = [
  { id: 'ecu_1', name: 'Sports ECU', type: 'engine', tier: 1, cost: 2000, modifiers: { horsepower: 20, torque: 15 } },
  { id: 'turbo_1', name: 'Bolt-on Turbo', type: 'turbo', tier: 1, cost: 4500, modifiers: { horsepower: 60, torque: 80, weight: 10 } },
  { id: 'tires_1', name: 'Semi-Slicks', type: 'tires', tier: 1, cost: 3000, modifiers: { grip: 0.3 } },
  { id: 'weight_1', name: 'Strip Interior', type: 'weight', tier: 1, cost: 1000, modifiers: { weight: -100 } },
  { id: 'tires_2', name: 'Racing Slicks', type: 'tires', tier: 2, cost: 8000, modifiers: { grip: 0.6 } },
  { id: 'turbo_2', name: 'Twin Turbo Kit', type: 'turbo', tier: 2, cost: 12000, modifiers: { horsepower: 150, torque: 180, weight: 25 } },
];

// --- LOGIC ---

interface StoreState extends GameState {
  buyCar: (defId: string, color: string) => void;
  sellCar: (instanceId: string) => void;
  buyUpgrade: (instanceId: string, upgradeId: string) => void;
  selectCar: (instanceId: string) => void;
  addCredits: (amount: number) => void;
  getCarStats: (instanceId: string) => CarStats;
}

export const useGameStore = create<StoreState>()(
  persist(
    (set, get) => ({
      credits: 20000,
      ownedCars: [],
      activeCarId: '',
      unlockedTracks: ['track_1'],

      buyCar: (defId, color) => {
        const car = CARS.find(c => c.id === defId);
        if (!car) return;
        const state = get();
        if (state.credits >= car.price) {
          const newCar: OwnedCar = {
            instanceId: uuidv4(),
            defId,
            upgrades: [],
            customColor: color
          };
          set({
            credits: state.credits - car.price,
            ownedCars: [...state.ownedCars, newCar],
            activeCarId: state.ownedCars.length === 0 ? newCar.instanceId : state.activeCarId
          });
        }
      },

      sellCar: (instanceId) => {
        // Simple 50% resale logic
        const state = get();
        const car = state.ownedCars.find(c => c.instanceId === instanceId);
        if (!car) return;
        const def = CARS.find(c => c.id === car.defId);
        if (!def) return;
        
        const value = def.price * 0.5; // + upgrades value calculation could go here
        
        const remaining = state.ownedCars.filter(c => c.instanceId !== instanceId);
        set({
          credits: state.credits + value,
          ownedCars: remaining,
          activeCarId: state.activeCarId === instanceId ? (remaining[0]?.instanceId || '') : state.activeCarId
        });
      },

      buyUpgrade: (instanceId, upgradeId) => {
        const state = get();
        const upgrade = UPGRADES.find(u => u.id === upgradeId);
        const car = state.ownedCars.find(c => c.instanceId === instanceId);
        
        if (car && upgrade && state.credits >= upgrade.cost && !car.upgrades.includes(upgradeId)) {
          // Check for conflicts (simple tier check logic could go here)
          const updatedCars = state.ownedCars.map(c => {
            if (c.instanceId === instanceId) {
              return { ...c, upgrades: [...c.upgrades, upgradeId] };
            }
            return c;
          });
          
          set({
            credits: state.credits - upgrade.cost,
            ownedCars: updatedCars
          });
        }
      },

      selectCar: (instanceId) => set({ activeCarId: instanceId }),
      
      addCredits: (amount) => set(s => ({ credits: s.credits + amount })),

      getCarStats: (instanceId) => {
        const state = get();
        const car = state.ownedCars.find(c => c.instanceId === instanceId);
        if (!car) return { horsepower: 0, torque: 0, weight: 1000, grip: 1, topSpeed: 0, acceleration: 0 };
        
        const def = CARS.find(c => c.id === car.defId);
        if (!def) return { horsepower: 0, torque: 0, weight: 1000, grip: 1, topSpeed: 0, acceleration: 0 };

        let stats = { ...def.baseStats };
        
        car.upgrades.forEach(uId => {
          const upg = UPGRADES.find(u => u.id === uId);
          if (upg) {
            if (upg.modifiers.horsepower) stats.horsepower += upg.modifiers.horsepower;
            if (upg.modifiers.torque) stats.torque += upg.modifiers.torque;
            if (upg.modifiers.weight) stats.weight += upg.modifiers.weight;
            if (upg.modifiers.grip) stats.grip += upg.modifiers.grip;
          }
        });

        return stats;
      }
    }),
    {
      name: 'gt-browser-save',
    }
  )
);