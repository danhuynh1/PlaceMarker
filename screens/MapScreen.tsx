import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Circle,
  Callout,
} from 'react-native-maps';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAppStore} from '../stores/useLocationStore';
import { getDistance } from 'geolib';
import { Restaurant } from '../types/restaurantType';

const MapScreen = () => {
  // Hooks
  const userLocation = useAppStore(state => state.userLocation);
  const savedRestaurants = useAppStore(state => state.savedRestaurants);
  const searchRadius = useAppStore(state => state.searchRadius);
  const currentRegion = useAppStore(state => state.currentRegion);
  const setCurrentRegion = useAppStore(state => state.setCurrentRegion);
  const refreshUserLocation = useAppStore(state => state.refreshUserLocation);

  // Local state
  const mapRef = useRef<MapView>(null);
  const [mapIsReady, setMapIsReady] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const isFocused = useIsFocused();
  const [visibleRestaurants, setVisibleRestaurants] = useState<Restaurant[]>(
    [],
  );

  // Request location permission and get initial location on focus
  useFocusEffect(
    useCallback(() => {
      refreshUserLocation();
      return () => setMapIsReady(false);
    }, [refreshUserLocation]),
  );

  // Updates the list of visible restaurants based on the user's current location.
  // Filters saved restaurants to include only those within the specified search radius.
  useEffect(() => {
    if (!userLocation) {
      return;
    }

    const nearbyRestaurants = savedRestaurants.filter(restaurant => {
      const distance = getDistance(userLocation, restaurant);
      return distance <= searchRadius;
    });

    setVisibleRestaurants(nearbyRestaurants);
  }, [userLocation, savedRestaurants, searchRadius]);

  // When the user's location becomes available and no current map region is set,
  // the map centers on the user's location on first load.
  useEffect(() => {
    if (userLocation && !currentRegion) {
      setCurrentRegion(userLocation);
    }
  }, [userLocation, currentRegion, setCurrentRegion]);

  // Animates the map to the user's current location.
  const goToCurrentPosition = async () => {
    try {
      setIsFetchingLocation(true);
      const lastKnownLocation = useAppStore.getState().userLocation;

      if (lastKnownLocation && mapRef.current) {
        mapRef.current.animateToRegion(lastKnownLocation, 500);
      }

      const success = await refreshUserLocation();
      if (success) {
        const updatedLocation = useAppStore.getState().userLocation;
        if (updatedLocation && mapRef.current) {
          mapRef.current.animateToRegion(updatedLocation, 1000);
        }
      }
    } catch (error) {
      console.warn('Error getting current location:', error);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  // Adjusts the map view to fit all visible restaurants and the user's location.
  // Does nothing if there are no visible restaurants or the map reference is not ready.
  const handleFindRestaurants = () => {
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
        edgePadding: { top: 200, right: 150, bottom: 150, left: 150 },
        animated: true,
      });
    }
  };

  //Used By the Marker Callout to Open in GoogleMaps in Android
  const openInMaps = (
    latitude: number,
    longitude: number,
    label: string = 'Location',
  ) => {
    const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(
      label,
    )})`;

    Linking.openURL(url).catch(err => {
      console.error('Failed to open map:', err);
    });
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

  // We only render the MapView if the screen is focused.
  // Something with rendering Markers when it is not focused.
  if (!isFocused) {
    return <View style={styles.container} />;
  }

  //Loading
  if (!currentRegion) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        ref={mapRef}
        initialRegion={currentRegion}
        onRegionChangeComplete={region => setCurrentRegion(region)}
        onMapReady={() => setMapIsReady(true)}
      >
        {mapIsReady && (
          <>
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
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  title="You Are Here"
                ></Marker>
              </>
            )}

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
                    <Text style={styles.markerText}>{restaurant.name}</Text>
                    <View
                      style={[
                        styles.markerPin,
                        { borderTopColor: isVisible ? 'green' : 'blue' },
                      ]}
                    />
                  </View>

                  <Callout
                    onPress={() =>
                      openInMaps(
                        restaurant.latitude,
                        restaurant.longitude,
                        restaurant.name,
                      )
                    }
                  >
                    <View>
                      <Text style={{ fontWeight: 'bold' }}>
                        {restaurant.name}
                      </Text>
                      <Text>Open in Maps</Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </>
        )}
      </MapView>
      {userLocation && (
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.button}
            onPress={goToCurrentPosition}
            disabled={isFetchingLocation}
          >
            {isFetchingLocation ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>My Location</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, styles.findButton]}
            onPress={handleFindRestaurants}
          >
            <Text style={styles.buttonText}>Find Restaurants</Text>
          </Pressable>
        </View>
      )}

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
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    flexDirection: 'column',
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
    minWidth: 10,
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

  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },

  markerText: {
    backgroundColor: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
    overflow: 'hidden',
    marginBottom: 2,
  },

  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'blue',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
