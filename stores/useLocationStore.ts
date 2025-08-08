/*
================================================================================
| FILE: /stores/useLocationStore.ts
| DESC: Zustand store for managing restaurant and location state.
================================================================================
*/

import { create } from 'zustand';
import { Region } from 'react-native-maps';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation, {
  GeolocationResponse,
  GeolocationError,
} from '@react-native-community/geolocation';

import { Restaurant } from '../types/restaurantType';

interface AppState {
  userLocation: Region | null;
  refreshUserLocation: () => Promise<boolean>;

  currentRegion: Region | null;
  setCurrentRegion: (region: Region) => void;

  savedRestaurants: Restaurant[];
  addRestaurant: (restaurant: Restaurant) => void;
  removeRestaurant: (restaurantId: string) => void;

  searchRadius: number;
  setSearchRadius: (radius: number) => void;
  setSavedState: (restaurants: Restaurant[]) => void;
}

// Zustand Implementation
export const useAppStore = create<AppState>((set) => ({
  userLocation: null,
  currentRegion: null,
  savedRestaurants: [],
  searchRadius: 5000,

  /**
   * Set Current Area of View (Region) for MapView
   */
  setCurrentRegion: (region: Region) => set({ currentRegion: region }),

  /**
   * Asynchronously requests location permission (on Android) and fetches the user's current GPS coordinates.
   * It updates the `userLocation` in the store on success.
   * @returns {Promise<boolean>} A promise that resolves to `true` if the location was successfully fetched, and `false` otherwise.
   */
  refreshUserLocation: async () => {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await requestAndroidLocationPermission();
        if (!hasPermission) {
          console.warn('Location permission denied');
          return false;
        }
      }
      const location = await getCurrentPosition();
      set({ userLocation: location });
      return true;
    } catch (error) {
      console.warn('Error getting user location:', error);
      return false;
    }
  },

  /**
   * Add Unique Restaurant to Saved Restaurants
   */
  addRestaurant: (restaurant: Restaurant) =>
    set(state => {
      if (state.savedRestaurants.some(r => r.id === restaurant.id)) {
        return state;
      }
      return {
        savedRestaurants: [...state.savedRestaurants, restaurant],
      };
    }),

  /**
   * Remove Restaurant to Saved Restaurants
   */
  removeRestaurant: (restaurantId: string) =>
    set(state => ({
      savedRestaurants: state.savedRestaurants.filter(
        r => r.id !== restaurantId,
      ),
    })),

  setSearchRadius: (radius: number) => set({ searchRadius: radius }),
  setSavedState : (restaurants: Restaurant[]) => set({savedRestaurants:restaurants})
}));

/**
 * Helper Function to prompt the user for location permission on Android devices.
 * @returns {Promise<boolean>} A promise, `true` if the user grants permission, and `false` if they deny it or an error occurs.
 */
const requestAndroidLocationPermission = async (): Promise<boolean> => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message:
          'This app needs access to your location to find nearby restaurants.',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Permission request error:', err);
    return false;
  }
};

/**
 * A Promise for the Geolocation.getCurrentPosition API.
 * @returns {Promise<Region>} A promise that resolves with a `Region` object containing the user's current coordinates and a default zoom level, or rejects with a GeolocationError if it fails.
 */

const getCurrentPosition = (): Promise<Region> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position: GeolocationResponse) => {
        const { latitude, longitude } = position.coords;
        resolve({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0922,
        });
      },
      (error: GeolocationError) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
};
