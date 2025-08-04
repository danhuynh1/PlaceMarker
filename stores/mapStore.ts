// stores/mapStore.js
import { create } from 'zustand';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

const useMapStore = create((set) => ({
  location: null,
  errorMsg: null,
  isMapReady: false,

  setLocation: (region) => set({ location: region }),
  setErrorMsg: (message) => set({ errorMsg: message }),
  setMapReady: (ready) => set({ isMapReady: ready }),

  fetchLocation: async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const fine = granted['android.permission.ACCESS_FINE_LOCATION'];
        const coarse = granted['android.permission.ACCESS_COARSE_LOCATION'];

        if (fine !== PermissionsAndroid.RESULTS.GRANTED && coarse !== PermissionsAndroid.RESULTS.GRANTED) {
          set({ errorMsg: 'Location permission denied' });
          return;
        }
      }

      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          const newRegion = {
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          set({ location: newRegion, errorMsg: null });
        },
        error => {
          console.warn('Geolocation error:', error);
          set({ errorMsg: error.message });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    } catch (err) {
      console.error(err);
      set({ errorMsg: 'Failed to get location permission' });
    }
  },
}));

export { useMapStore };