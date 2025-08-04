// SearchScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore, Restaurant } from '../stores/useLocationStore';

const pseudoSearch = (query: string, userLocation): Restaurant[] => {
  if (!userLocation) {
    return [];
  }
  
  const baseLat = userLocation.latitude;
  const baseLon = userLocation.longitude;
  
  return [
    { id: '6', name: 'Sushi Spot', latitude: baseLat + 0.005, longitude: baseLon + 0.005 },
    { id: '7', name: 'Pizza Place', latitude: baseLat - 0.003, longitude: baseLon - 0.003 },
    { id: '8', name: 'Thai Express', latitude: baseLat + 0.001, longitude: baseLon - 0.008 },
    { id: '9', name: 'Indian Palace', latitude: baseLat - 0.006, longitude: baseLon + 0.004 },
    { id: '10', name: 'Starbucks', latitude: baseLat + 0.004, longitude: baseLon + 0.002 },
  ];
};

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const addSelectedRestaurant = useAppStore(state => state.addSelectedRestaurant);
  const userLocation = useAppStore(state => state.userLocation);
  const navigation = useNavigation();

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      Alert.alert('Error', 'Please enter a search query.');
      return;
    }
    
    const results = pseudoSearch(searchQuery, userLocation);
    
    if (results.length === 0) {
      Alert.alert('No Results', 'No nearby restaurants were found.');
      return;
    }

    results.forEach(restaurant => {
      addSelectedRestaurant(restaurant);
    });

    Alert.alert('Success', `${results.length} restaurants added to Marked!`);
    
    // --- THIS IS THE KEY FIX ---
    // The setTimeout is the critical piece that prevents a crash.
    setTimeout(() => {
      navigation.navigate('Marked');
    }, 500);

  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Restaurant</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Italian, Sushi, Thai"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <Pressable style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search & Mark</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SearchScreen;