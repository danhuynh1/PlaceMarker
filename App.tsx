/*
================================================================================
| FILE: App.tsx
| DESC: App Entrypoint
================================================================================
*/
import React, { useEffect } from 'react';
import { StyleSheet} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import ContactScreen from './screens/ContactUsScreen';
import { createTables, fetchMarkedPlacesDB } from './db/database';
import { useAppStore } from './stores/useLocationStore';

const Drawer = createDrawerNavigator();
const App = () => {
  const setSavedRestaurants = useAppStore(state => state.setSavedState);
  // Initizializes sqllite database
  useEffect(() => {
    createTables();
    fetchMarkedPlacesDB(data => setSavedRestaurants(data));
  });
  return (
    <NavigationContainer>
      {/* Drawer navigation */}
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: styles.header,
          headerTintColor: 'white',
          drawerStyle: styles.drawer,
          drawerActiveTintColor: 'white',
          drawerInactiveTintColor: 'rgba(255, 255, 255, 1)',
          headerTitle: 'PlaceMarker',
          headerTitleAlign: 'center',
        }}
      >
        <Drawer.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="home-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="AboutApp"
          component={AboutScreen}
          options={{
            title: 'About App',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="information-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="ContactUs"
          component={ContactScreen}
          options={{
            title: 'Contact Us',
            drawerIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="email-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'green',
  },
  drawer: {
    backgroundColor: 'rgba(0, 128, 0, .3)',
  },
});

export default App;
