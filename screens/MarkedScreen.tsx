/*
================================================================================
| FILE: /screen/MarkedScreen.tsx
| DESC: Displayes all marked restaurants
================================================================================
*/
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Modal, ScrollView } from 'react-native';
import { useAppStore } from '../stores/useLocationStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Restaurant } from '../types/restaurantType';
import { deleteMarkedPlaceDB } from '../db/database';
import { ref, get } from 'firebase/database';
import { db, auth } from '../db/firebaseConfig';
import { signInAnonymously } from 'firebase/auth';

const MarkedScreen = ({ navigation } : {navigation : any}) => {
  const savedRestaurants = useAppStore(state => state.savedRestaurants);
  const removeSelectedRestaurant = useAppStore(state => state.removeRestaurant);
  const setCurrentRegion = useAppStore(state => state.setCurrentRegion);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  // Retrieves from firebase notes added by the user
  const fetchNoteForPlace = async (placeId: string) => {
    try {
      if (!auth.currentUser) {
        // Anonymous sign in if no user
        await signInAnonymously(auth);
      }
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setSelectedNote("No user logged in");
        setModalVisible(true);
        return;
      }
      
      const snapshot = await get(ref(db, 'placeNotes'));
      if (snapshot.exists()) {
        const allNotes:any = snapshot.val();
        const matchedNotes = Object.values(allNotes).filter(
          (note: any) => note.placeId === placeId && note.uid === uid
        );
        if (matchedNotes.length > 0) {
          setSelectedNote(matchedNotes[0].note);
        } else {
          setSelectedNote("No notes found for this place.");
        }
      } else {
        setSelectedNote("No notes found.");
      }
    } catch (error) {
      setSelectedNote("Error fetching note.");
      console.error(error);
    }
    setModalVisible(true);
  };

  // Handles for setting current region
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

  // This is every item in the flatlist
  const renderRestaurantItem = ({ item }: { item: Restaurant }) => (
    <Pressable
      onPress={() => handleViewOnMap(item)}
      style={styles.itemContainer}
    >
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemAddress}>{item.address}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={e => {
            e.stopPropagation();
            removeSelectedRestaurant(item.id);
            deleteMarkedPlaceDB(item.id);
          }}
          style={styles.removeButton}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </Pressable>

        <Pressable
          onPress={e => {
            e.stopPropagation();
            fetchNoteForPlace(item.id);
          }}
          style={styles.viewNoteButton}
        >
          <Text style={styles.viewNoteButtonText}>View Note</Text>
        </Pressable>
      </View>
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Note</Text>
            <ScrollView style={styles.modalContent}>
              <Text>{selectedNote}</Text>
            </ScrollView>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
  },
  itemTextContainer: {
    flex: 1,
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
    color: '#ef4444', 
    fontWeight: '600',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50, 
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
    viewNoteButton: {
    backgroundColor: '#cce5ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewNoteButtonText: {
    color: '#004085',
    fontWeight: '600',
    fontSize: 12,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalContent: {
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: '#388e3c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MarkedScreen;
