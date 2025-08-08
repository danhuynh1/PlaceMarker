import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FavouritesScreen from './MarkedScreen';
import MapScreen from './MapScreen';
import ProfileScreen from './SearchScreen';
import { StyleSheet} from 'react-native';

const Tab = createBottomTabNavigator();
/**
 *
 * @returns HomeScreen container with 3 Bottom Tabs (Marked|Map|Search)
 */
const HomeScreen = () => {
  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        firstRoute: route.name === 'Map',
        headerShown: false,
        tabBarStyle: styles.floatingTab,
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: '',
      })}
    >
      <Tab.Screen
        name="Marked"
        options={{
          title: 'Marked',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-marker-outline"
              color={color}
              size={size}
            />
          ),
        }}
        component={FavouritesScreen}
      />
      <Tab.Screen
        name="Map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-outline"
              color={color}
              size={size}
            />
          ),
        }}
        component={MapScreen}
      />
      <Tab.Screen
        name="Search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="map-search-outline"
              color={color}
              size={size}
            />
          ),
        }}
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  floatingTab: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(56,142,60,0.6)',
    borderRadius: 30,
    height: 60,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 5,
  },
});
