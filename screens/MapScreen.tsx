import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Circle,
  Region,
} from 'react-native-maps';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAppStore } from '../stores/useLocationStore';

const DEFAULT_REGION = {
  latitude: 43.4549,
  longitude: -80.4998,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapScreen = () => {
  // Store hooks
  const userLocation = useAppStore(state => state.userLocation);
  const visibleRestaurants = useAppStore(state => state.visibleRestaurants);
  const savedRestaurants = useAppStore(state => state.savedRestaurants);
  const searchRadius = useAppStore(state => state.searchRadius);
  const currentRegion = useAppStore(state => state.currentRegion);
  const setCurrentRegion = useAppStore(state => state.setCurrentRegion);
  const findNearbyRestaurants = useAppStore(
    state => state.findNearbyRestaurants,
  );
  const requestLocationPermission = useAppStore(
    state => state.requestLocationPermission,
  );

  // Local state
  const mapRef = useRef<MapView>(null);
  const [mapIsReady, setMapIsReady] = useState(false);

  // This hook returns true if the screen is focused, and false otherwise.
  const isFocused = useIsFocused();

  // Request location permission on focus
  useFocusEffect(
    useCallback(() => {
      requestLocationPermission();
      return () => setMapIsReady(false);
    }, [requestLocationPermission]),
  );

  // This effect runs whenever the user's location or the list of saved
  // restaurants changes. It ensures that the visible restaurants are always
  // up-to-date without needing a manual button press.
  useEffect(() => {
    if (userLocation && savedRestaurants.length > 0) {
      findNearbyRestaurants();
    }
  }, [userLocation, savedRestaurants, findNearbyRestaurants]);

  // Set initial region when user location is available
  useEffect(() => {
    if (userLocation && !currentRegion) {
      setCurrentRegion(userLocation);
    }
  }, [userLocation, currentRegion, setCurrentRegion]);

  // Handlers
  const goToCurrentPosition = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    }
  };

  const handleFindRestaurants = () => {
    findNearbyRestaurants();

    // Fit map to show all visible restaurants after a short delay
    setTimeout(() => {
      if (mapRef.current && visibleRestaurants.length > 0) {
        const coordinates = visibleRestaurants.map(r => ({
          latitude: r.latitude,
          longitude: r.longitude,
        }));

        if (userLocation) {
          coordinates.push({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          });
        }

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
          animated: true,
        });
      }
    }, 300);
  };

  const handleRegionChangeComplete = (region: Region) => {
    setCurrentRegion(region);
  };

  const handleZoom = (factor: number) => {
    if (!currentRegion || !mapRef.current) return;

    const newRegion = {
      ...currentRegion,
      latitudeDelta: currentRegion.latitudeDelta * factor,
      longitudeDelta: currentRegion.longitudeDelta * factor,
    };
    mapRef.current.animateToRegion(newRegion, 250);
  };

  // Determine initial region
  const initialRegion = currentRegion || userLocation || DEFAULT_REGION;

  // We only render the MapView if the screen is focused.
  // Otherwise, we render an empty View.
  if (!isFocused) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        ref={mapRef}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={() => setMapIsReady(true)}
      >
        {mapIsReady && (
          <>
            {/* Search radius circle */}
            {userLocation && (
              <>
                <Circle
                  center={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  radius={searchRadius}
                  strokeColor="rgba(0, 128, 0, 0.5)"
                  fillColor="rgba(0, 128, 0, 0.1)"
                />
                {/* Custom User Location Marker */}
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  title="You Are Here"
                ></Marker>
              </>
            )}

            {/* Saved restaurants with always-visible titles */}
            {savedRestaurants.map(restaurant => {
              const isVisible = visibleRestaurants.some(
                r => r.id === restaurant.id,
              );
              return (
                <Marker
                  key={restaurant.id}
                  coordinate={{
                    latitude: restaurant.latitude,
                    longitude: restaurant.longitude,
                  }}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={styles.customMarker}>
                    <View style={styles.markerBubble}>
                      <Text style={styles.markerText}>{restaurant.name}</Text>
                    </View>
                    <View
                      style={[
                        styles.markerPin,
                        { borderTopColor: isVisible ? 'green' : 'blue' },
                      ]}
                    />
                  </View>
                </Marker>
              );
            })}
          </>
        )}
      </MapView>

      {/* Action buttons */}
      {userLocation && (
        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={goToCurrentPosition}>
            <Text style={styles.buttonText}>My Location</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.findButton]}
            onPress={handleFindRestaurants}
          >
            <Text style={styles.buttonText}>Find Restaurants</Text>
          </Pressable>
        </View>
      )}

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <Pressable style={styles.zoomButton} onPress={() => handleZoom(0.5)}>
          <Text style={styles.zoomButtonText}>+</Text>
        </Pressable>
        <Pressable style={styles.zoomButton} onPress={() => handleZoom(2)}>
          <Text style={styles.zoomButtonText}>-</Text>
        </Pressable>
      </View>
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
  zoomControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'column',
  },
  zoomButton: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  zoomButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  // Styles for custom markers with always-visible titles
  customMarker: {
    alignItems: 'center',
  },
  markerBubble: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderColor: '#555',
    borderWidth: 1,
  },
  markerText: {
    color: '#333',
    fontWeight: 'bold',
  },
  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
  },
});
