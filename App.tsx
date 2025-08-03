import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from './screens/HomeScreen';
import AboutScreen from './screens/AboutScreen';
import ContactScreen from './screens/ContactUsScreen';

const Drawer = createDrawerNavigator(); 
const App = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: true,
          headerStyle: styles.header,
          headerTintColor: colors.white,
          drawerStyle: styles.drawer,
          drawerActiveTintColor: colors.activeDrawerItem,
          drawerInactiveTintColor: colors.inactiveDrawerItem,
          headerTitle: 'PlaceMarker',
          headerTitleAlign: 'center',
          headerRight: () => <View />,
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

const colors = {
  primary: 'green',
  white: '#fff',
  activeDrawerItem: '#fff',
  inactiveDrawerItem: 'rgba(255, 255, 255, 0.75)',
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
  },
  drawer: {
    backgroundColor: colors.primary,
  },
});

export default App;
