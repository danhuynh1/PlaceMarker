import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../stores/useLocationStore';

const MapScreen = () => {
  const userLocation = useAppStore(state => state.userLocation);
  const restaurantMarkers = useAppStore(state => state.restaurantMarkers);
  const selectedRestaurants = useAppStore(state => state.selectedRestaurants);
  const searchRestaurants = useAppStore(state => state.searchRestaurants);
  const requestLocationPermission = useAppStore(state => state.requestLocationPermission);
  const searchRadius = useAppStore(state => state.searchRadius);

  const mapRef = useRef<MapView>(null);
  const [mapIsReady, setMapIsReady] = useState(false);
  const [initialAnimationDone, setInitialAnimationDone] = useState(false);

  useFocusEffect(
    useCallback(() => {
      requestLocationPermission();
      return () => setMapIsReady(false);
    }, [requestLocationPermission]),
  );

  useEffect(() => {
    if (!mapIsReady || !mapRef.current) {
      return;
    }
    
    // Animate to fit all found restaurants
    if (restaurantMarkers.length > 0) {
      const allCoordinates = [
        ...restaurantMarkers.map(r => ({ latitude: r.latitude, longitude: r.longitude })),
      ];
      if (userLocation) {
        allCoordinates.push({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
      }
      mapRef.current.fitToCoordinates(allCoordinates, {
        edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
      setInitialAnimationDone(true);
    } else if (userLocation && !initialAnimationDone) {
      // Otherwise, just animate to the user's location
      mapRef.current.animateToRegion(userLocation, 1000);
      setInitialAnimationDone(true);
    }
  }, [mapIsReady, userLocation, restaurantMarkers, initialAnimationDone]);

  const goToCurrentPosition = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  const findNearbyRestaurants = () => {
    searchRestaurants();
  };

  const initialRegion = userLocation || {
    latitude: 43.4549,
    longitude: -80.4998,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const isMarked = (restaurantId) => {
    return selectedRestaurants.some(r => r.id === restaurantId);
  }

  return (
    <View style={styles.container}>
      {userLocation ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          ref={mapRef}
          initialRegion={initialRegion}
          showsUserLocation={true}
          onMapReady={() => setMapIsReady(true)}
        >
          {userLocation && (
            <Marker coordinate={userLocation} title="You are here" pinColor="blue" />
          )}
          {userLocation && mapIsReady && (
            <Circle
              center={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
              radius={searchRadius}
              strokeColor="rgba(0, 128, 0, 0.5)"
              fillColor="rgba(0, 128, 0, 0.1)"
            />
          )}

          {/* This is the final, corrected marker rendering logic */}
          {restaurantMarkers.map((restaurant) => (
            <Marker
              key={restaurant.id}
              coordinate={{
                latitude: restaurant.latitude,
                longitude: restaurant.longitude,
              }}
              title={restaurant.name}
              pinColor="green"
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.screenContainer}>
          <Text style={styles.screenTitle}>Loading Map...</Text>
          <ActivityIndicator size="large" color="#388e3c" />
        </View>
      )}

      {userLocation && (
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={goToCurrentPosition}>
            <Text style={styles.buttonText}>My Location</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.findButton]} onPress={findNearbyRestaurants}>
            <Text style={styles.buttonText}>Find Restaurants</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  screenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: '#388e3c',
    borderRadius: 50,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  findButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});