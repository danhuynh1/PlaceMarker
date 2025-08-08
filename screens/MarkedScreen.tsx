// MarkedScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useAppStore } from '../stores/useLocationStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Restaurant } from '../types/restaurantType';
import { deleteMarkedPlaceDB } from '../db/database';

const MarkedScreen = ({ navigation } : {navigation : any}) => {
  const savedRestaurants = useAppStore(state => state.savedRestaurants);
  const removeSelectedRestaurant = useAppStore(state => state.removeRestaurant);
  const setCurrentRegion = useAppStore(state => state.setCurrentRegion);

  const handleViewOnMap = (restaurant: Restaurant) => {
    const region = {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setCurrentRegion(region);
    navigation.navigate('Map');
  };

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <Pressable
      onPress={() => handleViewOnMap(item)}
      style={styles.itemContainer}
    >
      {/* View to group text content vertically */}
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        {/* Added address field with its own style */}
        <Text style={styles.itemAddress}>{item.address}</Text>
      </View>

      {/* Separate Pressable for the remove button */}
      <Pressable
        onPress={e => {
          e.stopPropagation(); // Prevents navigating to map when removing
          removeSelectedRestaurant(item.id);
          deleteMarkedPlaceDB(item.id);
        }}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Marked Restaurants</Text>
        {savedRestaurants.length > 0 ? (
          <FlatList
            data={savedRestaurants}
            renderItem={renderRestaurantItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContentContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No restaurants have been marked yet.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9', // A slightly off-white background
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 16,
    marginBottom: 24,
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 7,
    // shadowColor: '#000',
    // elevation: 3,
  },
  itemTextContainer: {
    flex: 1, // Allows this container to grow and push the button to the right
    marginRight: 10,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  itemAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    backgroundColor: '#fee2e2', 
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  removeButtonText: {
    color: '#ef4444', // A matching red text color
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50, // Offset from the center a bit
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default MarkedScreen;
