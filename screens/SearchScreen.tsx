/*
================================================================================
| FILE: /screen/SearchScreen.tsx
| DESC: Searches nearby places and add/edit notes
================================================================================
*/
import React, { useEffect, useState } from 'react';
import {
  Image,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Button,
  Alert
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useNavigation } from '@react-navigation/native';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { useAppStore } from '../stores/useLocationStore';
import { insertMarkedPlaceDB } from '../db/database';
import { Restaurant } from '../types/restaurantType';
import { auth, db } from '../db/firebaseConfig';
import { ref, push, get, update } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';

const SearchScreen = () => {
  const navigation = useNavigation();
  const addNewRestaurant = useAppStore(state => state.addRestaurant);
  const userLocation = useAppStore(state => state.userLocation);
  const searchRadius = useAppStore(state => state.searchRadius);

  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [placeNote, setPlaceNote] = useState("");

  // it gets called when the place note changes
  useEffect(() => {
    async function fetchNote() {
      if (!selectedPlace?.id) {
        setPlaceNote('');
        return;
      }
      try {
        // Ensure user is signed in (anonymous if no login)
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setPlaceNote('');
          return;
        }
        const placeNotesRef = ref(db, 'placeNotes');
        const snapshot = await get(placeNotesRef);

        if (snapshot.exists()) {
          const allNotes: any = snapshot.val();

          // Filter for BOTH current user & selected place
          const matchedPlaceNotes = Object.entries(allNotes).filter(
            ([, value]) =>
              (value as { placeId?: string; uid?: string }).placeId === selectedPlace.id &&
              (value as { placeId?: string; uid?: string }).uid === uid
          );

          if (matchedPlaceNotes.length > 0) {
            const [, placeData] = matchedPlaceNotes[0]; // First match
            setPlaceNote((placeData as { note?: string }).note || '');
          } else {
            setPlaceNote('');
          }
        } else {
          setPlaceNote('');
        }
      } catch (error) {
        console.error('Failed to fetch note:', error);
        setPlaceNote('');
      }
    }
    fetchNote();
  }, [selectedPlace]);

  // For adding marked place to the zustand store nad sqllite database
  const handleAddPlace = () => {
    if (!selectedPlace) return;
    const restaurant : Restaurant = {
      id: selectedPlace.id,
      name: selectedPlace.name,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
      address: selectedPlace.address,
    };
    addNewRestaurant(restaurant);
    console.log('Saving info into db...')
    insertMarkedPlaceDB({...restaurant}, () => navigation.goBack());
    setSelectedPlace(null);
    setNearbyRestaurants([]);
    clearAll();
  };

  // helper function for fetching all the restaurants within radius
  const handleNearbySearch = async () => {
    if (!userLocation) return;
    setLoadingNearby(true);
    setHasSearched(true); // Mark that a search was initiated
    setSelectedPlace(null); // Clear any selected place
    try {
      const radius = searchRadius;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userLocation.latitude},${userLocation.longitude}&radius=${radius}&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      setNearbyRestaurants(data.results ?? []);
    } catch (error) {
      console.error('Nearby search failed:', error);
      setNearbyRestaurants([]);
    } finally {
      setLoadingNearby(false);
    }
  };

  // helper function when a restaurant item is pressed to get its details with user added notes
  const handleSelectNearby = async (place: any) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=place_id,name,geometry,formatted_address,rating,user_ratings_total,photos&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      const details = data.result;

      const photoRef = details?.photos?.[0]?.photo_reference;
      const photoUrl = photoRef
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`
        : null;

      setSelectedPlace({
        id: details.place_id,
        name: details.name,
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        address: details.formatted_address,
        rating: details.rating,
        user_ratings_total: details.user_ratings_total,
        photoUrl,
      });
      setNearbyRestaurants([]);
    } catch (error) {
      console.error('Failed to fetch place details:', error);
    }
  };

  // For adding or editing notes by user
  const handleSaveNote = async () => {
    try {
      // Ensure user is signed in (anonymous if no login)
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.log("Unable to fetch uid");
        Alert.alert("Unable to save notes");
        return;
      }
      if (placeNote.trim() && selectedPlace.id) {
        const newData = {
          placeId: selectedPlace.id,
          note: placeNote,
          uid: uid
        };
        const snapshot = await get(ref(db, 'placeNotes'));
  
        if (snapshot.exists()) {
          const allNotes:any = snapshot.val();
          // Filter entries matching selectedPlace.id
          const matchedNotes = Object.entries(allNotes).filter(
            ([, value]) => 
              (value as { placeId?: string; uid?: string }).placeId === selectedPlace.id &&
              (value as { placeId?: string; uid?: string }).uid === uid
          );
          if (matchedNotes.length > 0){
            const updates: Record<string, any> = {};
            matchedNotes.forEach(([key]) => {
              updates[`${key}/note`] = newData.note;
            });
            await update(ref(db, 'placeNotes'), updates);
          }
          else {
            await push(ref(db, 'placeNotes'), newData);
          }
        }
        else {
          await push(ref(db, 'placeNotes'), newData);
        }
        Alert.alert("Note saved successfully!")
      } else {
        Alert.alert("Error in saving the note, please make sure you have entered a valid note and selected a valid place.");
      }
    }
    catch(error) {
      console.log(error);
    }
  };

  // Clear all selections and search results
  const clearAll = () => {
    setSelectedPlace(null);
    setNearbyRestaurants([]);
    setHasSearched(false);
  };
  // Renders the main search UI
  const renderSearchUI = () => (
    <>
      <GooglePlacesAutocomplete
        placeholder="Search for a Location"
        fetchDetails={true}
        onPress={(data, details = null) => {
          if (!details) return;

          const photoRef = details.photos?.[0]?.photo_reference;

          const photoUrl = photoRef
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`
            : null;

          setSelectedPlace({
            id: details.place_id,

            name: details.name,

            latitude: details.geometry.location.lat,

            longitude: details.geometry.location.lng,

            address: details.formatted_address,

            rating: details.rating,

            user_ratings_total: details.user_ratings_total,

            photoUrl,
          });

          setNearbyRestaurants([]);
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          
          language: 'en',
        }}
        GooglePlacesSearchQuery={{
          rankby: 'distance',

          type: 'restaurant',
        }}
        textInputProps={{
          placeholderTextColor: '#A9A9A9',
        }}
        styles={{
          container: { marginBottom: 12 },

          textInput: styles.textInput,

          // listView: styles.listView,
        }}
        minLength={2}
        debounce={300}
        keyboardShouldPersistTaps="handled"
        enablePoweredByContainer={false}
        nearbyPlacesAPI="GooglePlacesSearch"
        onFail={error =>
          console.error('Google Places Autocomplete Error:', error)
        }
        onTimeout={() =>
          console.warn('Google Places Autocomplete: Request timed out')
        }
        predefinedPlaces={[]}
        autoFillOnNotFound={false}
        currentLocation={false}
        disableScroll={false}
        isRowScrollable={true}
        listViewDisplayed="auto"
        keepResultsAfterBlur={false}
        predefinedPlacesAlwaysVisible={false}
        suppressDefaultStyles={false}
        timeout={20000}
      />
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

  // Renders the nearby results list
  const renderNearbyResultsUI = () => (
    <>
      <Pressable style={[styles.button, styles.clearButton]} onPress={clearAll}>
        <Text style={[styles.buttonText, styles.clearButtonText]}>‹ Back</Text>
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
          keyExtractor={item => item.place_id}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={styles.nearbyItem}
              onPress={() => handleSelectNearby(item)}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.vicinity}</Text>
            </Pressable>
          )}
        />
      )}
    </>
  );

  // This is the view for restaurant details
  const renderDetailsUI = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.detailsContainer}
    >
      <Pressable style={[styles.button, styles.clearButton]} onPress={clearAll}>
        <Text style={[styles.buttonText, styles.clearButtonText]}>‹ Back</Text>
      </Pressable>

      <Text style={styles.detailsName}>{selectedPlace.name}</Text>
      <Text style={styles.address}>{selectedPlace.address}</Text>
      {selectedPlace.rating && (
        <Text style={styles.rating}>
          ⭐ {selectedPlace.rating.toFixed(1)} (
          {selectedPlace.user_ratings_total} reviews)
        </Text>
      )}
      {selectedPlace.photoUrl && (
        <Image
          source={{ uri: selectedPlace.photoUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <Pressable style={styles.button} onPress={handleAddPlace}>
        <Text style={styles.buttonText}>Mark this Place</Text>
      </Pressable>
      <View>
        <Text style={styles.titleText}>Add/Edit note:</Text>
        <TextInput
        style={styles.textArea}
        value = {placeNote}
        onChangeText={setPlaceNote}
        placeholder="Enter your notes here and press save..."
        multiline={true}
        numberOfLines={4} // optional, sets initial height
        />
        <Button title="Save" onPress={handleSaveNote}/>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* This decides whether the search view, nearny restaurant view, or restaurant detail view should be displayed */}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchContainer: {
    flex: 0,
    marginBottom: 16,
  },
  textInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#388e3c',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  clearButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  nearbyItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  detailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  rating: {
    fontSize: 15,
    color: '#555',
    marginVertical: 12,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  detailsContainer: {
    paddingBottom: 40,
  },
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
  },
  textArea: {
    height: 120,
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
    textAlignVertical: "top",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
  }
});
