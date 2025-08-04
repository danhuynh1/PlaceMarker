// store.ts
import { create } from 'zustand';
import { Region } from 'react-native-maps';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface AppState {
  userLocation: Region | null;
  restaurantMarkers: Restaurant[];
  selectedRestaurants: Restaurant[];
  searchRadius: number;
  renderedMarkers: Restaurant[]; // <-- New state for the final list of markers

  setLocation: (location: Region) => void;
  setRestaurantMarkers: (markers: Restaurant[]) => void;
  addSelectedRestaurant: (restaurant: Restaurant) => void;
  removeSelectedRestaurant: (restaurantId: string) => void;
  requestLocationPermission: () => Promise<void>;
  searchRestaurants: () => Promise<void>;
  updateRenderedMarkers: (markers: Restaurant[]) => void; // <-- New action
}

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // in metres
};

export const useAppStore = create<AppState>((set, get) => ({
  userLocation: null,
  restaurantMarkers: [],
  selectedRestaurants: [],
  searchRadius: 5000,
  renderedMarkers: [],

  setLocation: location => set({ userLocation: location }),
  setRestaurantMarkers: markers => set({ restaurantMarkers: markers }),

  addSelectedRestaurant: restaurant =>
    set(state => ({
      selectedRestaurants: state.selectedRestaurants.some(
        r => r.id === restaurant.id,
      )
        ? state.selectedRestaurants
        : [...state.selectedRestaurants, restaurant],
    })),
  
  removeSelectedRestaurant: (restaurantId) =>
    set(state => ({
      selectedRestaurants: state.selectedRestaurants.filter(r => r.id !== restaurantId),
      restaurantMarkers: state.restaurantMarkers.filter(r => r.id !== restaurantId),
    })),

  requestLocationPermission: async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Location permission denied');
        return;
      }
    }
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        get().setLocation({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0922,
        });
      },
      error => console.warn('Geolocation error:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  },

  searchRestaurants: async () => {
    const location = get().userLocation;
    const searchRadius = get().searchRadius;
    if (!location) {
      console.warn('Current location not available for search.');
      return;
    }
    
    const filteredRestaurants = get().selectedRestaurants.filter(restaurant => {
      const distance = getDistance(
        location.latitude,
        location.longitude,
        restaurant.latitude,
        restaurant.longitude,
      );
      return distance <= searchRadius;
    });

    get().setRestaurantMarkers(filteredRestaurants);
  },

  updateRenderedMarkers: (markers) => set({ renderedMarkers: markers }),
}));