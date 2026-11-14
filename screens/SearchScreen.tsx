import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../stores/useLocationStore';
import { insertMarkedPlaceDB } from '../db/database';
import { Restaurant } from '../types/restaurantType';
import {
  autocompletePlaces,
  getPlaceDetails,
  getPlacePhotoUrl,
  searchNearbyRestaurants,
  Place,
  PlaceSuggestion,
} from '../services/placesApi';

const SearchScreen = () => {
  const navigation = useNavigation();
  const addNewRestaurant = useAppStore(state => state.addRestaurant);
  const userLocation = useAppStore(state => state.userLocation);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Place[]>([]);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [query, setQuery] = useState('');
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2 || selectedPlace) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const result = await autocompletePlaces(
          query,
          userLocation?.latitude,
          userLocation?.longitude,
        );
        setSuggestions(result.suggestions);
        setError(null);
      } catch (requestError) {
        setSuggestions([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Search failed',
        );
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, selectedPlace, userLocation]);

  const handleAddPlace = () => {
    if (!selectedPlace) return;
    const restaurant: Restaurant = {
      id: selectedPlace.id,
      name: selectedPlace.name,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      address: selectedPlace.address,
    };
    insertMarkedPlaceDB(
      restaurant,
      () => {
        addNewRestaurant(restaurant);
        navigation.goBack();
      },
      message => setError(message),
    );
  };

  const handleNearbySearch = async () => {
    if (!userLocation) {
      setError('Your location is not available yet.');
      return;
    }
    setLoadingNearby(true);
    setHasSearched(true);
    setSelectedPlace(null);
    setError(null);
    try {
      const result = await searchNearbyRestaurants(
        userLocation.latitude,
        userLocation.longitude,
        1500,
      );
      setNearbyRestaurants(result.places);
    } catch (requestError) {
      setNearbyRestaurants([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Nearby search failed',
      );
    } finally {
      setLoadingNearby(false);
    }
  };

  const handleSelectPlace = async (placeId: string) => {
    try {
      setError(null);
      setSelectedPlace(await getPlaceDetails(placeId));
      setNearbyRestaurants([]);
      setSuggestions([]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load place details',
      );
    }
  };

  const clearAll = () => {
    setSelectedPlace(null);
    setNearbyRestaurants([]);
    setSuggestions([]);
    setQuery('');
    setError(null);
    setHasSearched(false);
  };

  const renderSearchUI = () => (
    <>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search for a restaurant"
        placeholderTextColor="#A9A9A9"
        style={styles.textInput}
        autoCorrect={false}
      />
      {loadingSuggestions && (
        <ActivityIndicator style={styles.inlineLoader} color="#388e3c" />
      )}
      <FlatList
        data={suggestions}
        keyExtractor={item => item.placeId}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            style={styles.suggestionItem}
            onPress={() => handleSelectPlace(item.placeId)}
          >
            <Text style={styles.name}>{item.primaryText}</Text>
            {!!item.secondaryText && (
              <Text style={styles.address}>{item.secondaryText}</Text>
            )}
          </Pressable>
        )}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleNearbySearch}>
        <Text style={styles.buttonText}>Find Restaurants Nearby</Text>
      </Pressable>
      <View style={styles.emptyListContainer}>
        <Text style={styles.emptyListText}>
          Search for a place or find restaurants near you to begin.
        </Text>
      </View>
    </>
  );

  const renderNearbyResultsUI = () => (
    <>
      <Pressable style={[styles.button, styles.clearButton]} onPress={clearAll}>
        <Text style={[styles.buttonText, styles.clearButtonText]}>Back</Text>
      </Pressable>
      {loadingNearby ? (
        <ActivityIndicator
          size="large"
          color="#388e3c"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={nearbyRestaurants}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              No restaurants found nearby.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.nearbyItem}
              onPress={() => handleSelectPlace(item.id)}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </Pressable>
          )}
        />
      )}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  const renderDetailsUI = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.detailsContainer}
    >
      <Pressable style={[styles.button, styles.clearButton]} onPress={clearAll}>
        <Text style={[styles.buttonText, styles.clearButtonText]}>Back</Text>
      </Pressable>
      <Text style={styles.detailsName}>{selectedPlace?.name}</Text>
      <Text style={styles.address}>{selectedPlace?.address}</Text>
      {selectedPlace?.rating !== undefined && (
        <Text style={styles.rating}>
          Rating {selectedPlace.rating.toFixed(1)} (
          {selectedPlace.userRatingsTotal ?? 0} reviews)
        </Text>
      )}
      {selectedPlace?.photoName && (
        <Image
          source={{ uri: getPlacePhotoUrl(selectedPlace.photoName) }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      <Pressable style={styles.button} onPress={handleAddPlace}>
        <Text style={styles.buttonText}>Mark this Place</Text>
      </Pressable>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {selectedPlace
          ? renderDetailsUI()
          : hasSearched
          ? renderNearbyResultsUI()
          : renderSearchUI()}
      </View>
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  textInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#388e3c',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  clearButtonText: { color: '#333', fontWeight: '600' },
  nearbyItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  suggestionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  name: { fontSize: 17, fontWeight: '600', color: '#333' },
  detailsName: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  address: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 8 },
  rating: { fontSize: 15, color: '#555', marginVertical: 12 },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  detailsContainer: { paddingBottom: 40 },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '20%',
  },
  emptyListText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
  },
  inlineLoader: { marginVertical: 8 },
  errorText: { color: '#b42318', textAlign: 'center', marginVertical: 10 },
});
