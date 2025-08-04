/*
================================================================================
|                                                                              |
|   FILE: /stores/useLocationStore.ts                                          |
|   DESC: Zustand store for managing restaurant and location state.            |
|                                                                              |
================================================================================
*/

import { create } from 'zustand';
import { Region } from 'react-native-maps';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

/**
 * @interface Restaurant
 * Defines the structure for a single restaurant object.
 */
export interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * @interface AppState
 * Defines the complete state and actions for the application store.
 */
interface AppState {
  // --- STATE ---
  userLocation: Region | null;
  currentRegion: Region | null;
  savedRestaurants: Restaurant[];      // All saved restaurants
  visibleRestaurants: Restaurant[];    // Restaurants currently visible on map (within radius)
  searchRadius: number;

  // --- ACTIONS ---
  // Location
  requestLocationPermission: () => Promise<void>;
  setCurrentRegion: (region: Region) => void;
  
  // Restaurant Management
  addRestaurant: (restaurant: Restaurant) => void;
  removeRestaurant: (restaurantId: string) => void;
  toggleRestaurant: (restaurant: Restaurant) => void;
  clearAllRestaurants: () => void;
  
  // Search
  findNearbyRestaurants: () => void;
  setSearchRadius: (radius: number) => void;
}

/**
 * Calculate distance between two coordinates in meters
 */
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
};

/**
 * Request location permission on Android
 */
const requestAndroidLocationPermission = async (): Promise<boolean> => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location to find nearby restaurants.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};

/**
 * Get current device position
 */
const getCurrentPosition = (): Promise<Region> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        resolve({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0922,
        });
      },
      error => reject(error),
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 10000 
      }
    );
  });
};

/**
 * Zustand store implementation
 */
export const useAppStore = create<AppState>((set, get) => ({
  // --- INITIAL STATE ---
  userLocation: null,
  currentRegion: null,
  savedRestaurants: [],
  visibleRestaurants: [],
  searchRadius: 5000, // 5km default

  // --- LOCATION ACTIONS ---
  setCurrentRegion: (region: Region) => set({ currentRegion: region }),
  
  requestLocationPermission: async () => {
    try {
      // Check Android permissions
      if (Platform.OS === 'android') {
        const hasPermission = await requestAndroidLocationPermission();
        if (!hasPermission) {
          console.log('Location permission denied');
          return;
        }
      }

      // Get current position
      const location = await getCurrentPosition();
      set({ userLocation: location });
      
    } catch (error) {
      console.warn('Geolocation error:', error);
    }
  },

  // --- RESTAURANT MANAGEMENT ---
  addRestaurant: (restaurant: Restaurant) =>
    set(state => {
      // Prevent duplicates
      if (state.savedRestaurants.some(r => r.id === restaurant.id)) {
        return state;
      }
      
      // Return new state with the added restaurant
      return {
        savedRestaurants: [...state.savedRestaurants, restaurant],
      };
    }),

  removeRestaurant: (restaurantId: string) =>
    set(state => ({
      savedRestaurants: state.savedRestaurants.filter(r => r.id !== restaurantId),
      visibleRestaurants: state.visibleRestaurants.filter(r => r.id !== restaurantId),
    })),

  toggleRestaurant: (restaurant: Restaurant) => {
    const { savedRestaurants, addRestaurant, removeRestaurant } = get();
    const isSelected = savedRestaurants.some(r => r.id === restaurant.id);
    
    if (isSelected) {
      removeRestaurant(restaurant.id);
    } else {
      addRestaurant(restaurant);
    }
  },

  clearAllRestaurants: () => set({
    savedRestaurants: [],
    visibleRestaurants: [],
  }),

  // --- SEARCH FUNCTIONALITY ---
  setSearchRadius: (radius: number) => set({ searchRadius: radius }),
  
  findNearbyRestaurants: () => {
    const { userLocation, searchRadius, savedRestaurants } = get();
    
    if (!userLocation) {
      console.warn('Current location not available for search.');
      return;
    }

    // Filter saved restaurants by distance
    const nearbyRestaurants = savedRestaurants.filter(restaurant => {
      const distance = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurant.latitude,
        restaurant.longitude
      );
      return distance <= searchRadius;
    });

    // Update visible restaurants
    set({ visibleRestaurants: nearbyRestaurants });
  },
}));
