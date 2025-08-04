// store/locationStore.ts
import { create } from 'zustand';

type Location = {
  latitude: number;
  longitude: number;
};

interface LocationStore {
  location: Location | null;
  setLocation: (location: Location) => void;
}

export const useLocationStore = create<LocationStore>(set => ({
  location: null,
  setLocation: location => set({ location }),
}));
