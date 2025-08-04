// MarkedScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useAppStore } from '../stores/useLocationStore'; // Make sure the path is correct

const MarkedScreen = () => {
  const selectedRestaurants = useAppStore(state => state.selectedRestaurants);
  const removeSelectedRestaurant = useAppStore(state => state.removeSelectedRestaurant);

  const renderRestaurantItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Pressable onPress={() => removeSelectedRestaurant(item.id)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Marked Restaurants</Text>
      {selectedRestaurants.length > 0 ? (
        <FlatList
          data={selectedRestaurants}
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
  },
  removeButton: {
    backgroundColor: '#FF6347',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
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