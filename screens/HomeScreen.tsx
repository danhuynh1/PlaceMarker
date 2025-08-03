import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FavouritesScreen from './MarkedScreen';
import MapScreen from './MapScreen';
import ProfileScreen from './SearchScreen';
import { StyleSheet, Platform } from 'react-native';

const Tab = createBottomTabNavigator();

const HomeScreen = () => {
  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        firstRoute: route.name === 'Map',
        headerShown: false,
        tabBarStyle: styles.floatingTab,
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'black',
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Map') {
            iconName = 'map-outline';
          } else if (route.name === 'Marked') {
            iconName = 'map-marker-outline';
          } else if (route.name === 'Search') {
            iconName = 'map-search-outline';
          }

          return (
            <MaterialCommunityIcons name={iconName} color={color} size={size} />
          );
        },
      })}
    >
      <Tab.Screen name="Marked" component={FavouritesScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Search" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  floatingTab: {
    color: 'white',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    elevation: 5,
    backgroundColor: 'rgba(56,142,60,0.3)',
    borderRadius: 30,
    height: 60,
    paddingBottom: Platform.OS === 'android' ? 10 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 5,
  },
});
