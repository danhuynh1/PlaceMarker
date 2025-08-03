import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
  },
});
const AboutScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>About This App</Text>
  </View>
);

export default AboutScreen;
