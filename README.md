# PlaceMarker

A cross-platform mobile app built with **React Native CLI** and **TypeScript** that lets you search, discover, bookmark, and annotate restaurants on an interactive map.

---

## Features

- **Interactive Map** — Google Maps integration with custom restaurant markers, a search radius circle, and animated navigation to your current location
- **Nearby Search** — Find restaurants around you using the Google Places API, filtered to a configurable search radius
- **Place Autocomplete** — Search any restaurant by name with Google Places Autocomplete and view details including ratings and photos
- **Bookmark Restaurants** — Mark places and view them on the map or in a saved list; bookmarks persist locally via SQLite
- **Notes** — Add and edit personal notes per restaurant, stored in Firebase Realtime Database and tied to your anonymous user session
- **Radius Filtering** — Markers on the map visually distinguish restaurants within your search radius vs. outside it
- **Open in Maps** — Tap any map marker callout to open the location directly in Google Maps

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native CLI, TypeScript |
| Maps | Google Maps SDK (`react-native-maps`) |
| Places | Google Places API (Nearby Search, Place Details, Autocomplete, Photos) |
| Remote Storage | Firebase Realtime Database |
| Auth | Firebase Anonymous Authentication |
| Local Storage | SQLite (`react-native-sqlite-storage`) |
| State Management | Zustand |
| Navigation | React Navigation — Drawer + Bottom Tabs |
| Location | `@react-native-community/geolocation`, `geolib` |

---

## App Structure

```
App.tsx                  # Entry point — Drawer navigation
screens/
  HomeScreen.tsx         # Bottom tab container (Map | Search | Marked)
  MapScreen.tsx          # Interactive map with markers and radius circle
  SearchScreen.tsx       # Place search, nearby results, detail view, notes
  MarkedScreen.tsx       # Saved restaurant list with note viewer
stores/
  useLocationStore.ts    # Zustand store — location, restaurants, radius
db/
  database.ts            # SQLite helpers — create, insert, fetch, delete
  firebaseConfig.ts      # Firebase initialization
```

---

## Screens

### Map
- Displays user location with a configurable radius circle
- Shows all saved restaurants as custom markers with restaurant name labels
- Green markers = within radius, blue = outside radius
- Tap a marker to open a callout with a link to open in Google Maps
- My Location and Find Restaurants buttons for quick navigation

### Search
- Google Places Autocomplete for searching any location
- Find Restaurants Nearby button to fetch places within your radius
- Tap a result to view details: name, address, rating, photo
- Mark a place to save it locally
- Add or edit a personal note per place — synced to Firebase

### Marked
- Lists all bookmarked restaurants with name and address
- Tap any item to navigate the map to that location
- View Note button to retrieve your saved Firebase note
- Remove button to delete a bookmark locally

---

## Setup

### Prerequisites
- Node.js
- React Native CLI environment (Android Studio / Xcode)
- Google Maps API key with Maps SDK, Places API enabled
- Firebase project with Realtime Database enabled

### Install

```bash
git clone https://github.com/danhuynh1/PlaceMarker.git
cd PlaceMarker
npm install
```

### Environment

Create a `.env` file in the root:

```
GOOGLE_MAPS_API_KEY=your_key_here
```

### Android

```bash
npx react-native run-android
```

### iOS

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

---

## Architecture Notes

- **Zustand** manages all global state — user location, saved restaurants, search radius, and current map region — keeping components clean and free of prop drilling
- **SQLite** handles offline-first local persistence for bookmarked restaurants so saved places survive app restarts without a network call
- **Firebase Realtime Database** stores per-user notes keyed by `placeId` and `uid`, using anonymous authentication so no sign-up is required
- **React Navigation** uses a Drawer at the top level with Bottom Tabs nested inside the Home screen, allowing the map to persist its state while navigating between tabs

---

## Author

Dan Huynh — [github.com/danhuynh1](https://github.com/danhuynh1)
