import { create } from 'zustand';
import { Country } from '../data/countries';

type CountryState = {
  favorites: Country[];
  visited: Set<number>;
  addFavorite: (country: Country) => void;
  removeFavorite: (countryId: number) => void;
  markAsVisited: (countryId: number) => void;
};
/* * Zustand store for maintaining a consistent state of
 * favorite countries and visited countries across the app.
 */
const useCountryStore = create<CountryState>((set, get) => ({
  favorites: [],
  visited: new Set(),
  // Function to add a country to favorites
  addFavorite: country =>
    set(state => ({ favorites: state.favorites.concat(country) })),

  // Function to remove a country from favorites
  removeFavorite: countryId =>
    set(state => ({
      favorites: state.favorites.filter(c => c.countryId !== countryId),
    })),

  // Function to mark a country as visited
  markAsVisited: countryId =>
    set(state => {
      const newVisited = new Set(state.visited);
      newVisited.add(countryId);
      return { visited: newVisited };
    }),
}));

export default useCountryStore;
