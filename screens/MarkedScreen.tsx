// MarkedScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import  {useAppStore} from '../stores/useLocationStore'; // Make sure the path is correct


const MarkedScreen = ({ navigation }) => {
  const savedRestaurants = useAppStore(state => state.savedRestaurants);
  const removeSelectedRestaurant = useAppStore(state => state.removeRestaurant);
  const setCurrentRegion = useAppStore(state => state.setCurrentRegion);

  const handleViewOnMap = (restaurant) => {
    // 1. Create a region object from the restaurant's coordinates
    const region = {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        latitudeDelta: 0.01, // A nice, close-up zoom level
        longitudeDelta: 0.01,
    };

    // 2. Update the global state with the new camera position
    setCurrentRegion(region);

    // 3. Navigate the user to the Map screen
    navigation.navigate('Map');
  };

  const renderRestaurantItem = ({ item }) => (
    // Wrap the entire item container in a Pressable
    <Pressable onPress={() => handleViewOnMap(item)} style={styles.itemContainer}>
      <Text style={styles.itemName}>{item.name}</Text>
      {/* Use a separate Pressable for the remove button to stop event propagation */}
      <Pressable onPress={(e) => { e.stopPropagation(); removeSelectedRestaurant(item.id); }} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Marked Restaurants</Text>
      {savedRestaurants.length > 0 ? (
        <FlatList
          data={savedRestaurants}
          renderItem={renderRestaurantItem}
          keyExtractor={item => item.id}
          style={styles.list}
        />
      ) : (
        <Text style={styles.emptyText}>No restaurants have been marked yet.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1, // Allow text to take up available space
  },
  removeButton: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginLeft: 10, // Add some space between name and button
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  }
});

export default MarkedScreen;
