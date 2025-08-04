import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

/**
 * FavoritesScreen component displays a list of favorite countries.
 */
const MarkedScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Favorites</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
export default MarkedScreen;
