import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
const ContactScreen = () => (
  <View style={styles.container}>
    <Text style={styles.bodyText}>Student ID: 9057270</Text>
    <Text style={styles.bodyText}>Email: dhuynh7270@conestogac.on.ca</Text>
  </View>
);
export default ContactScreen;
