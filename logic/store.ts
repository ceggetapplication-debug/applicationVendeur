import { createStore } from 'stan-js';
import { Models } from 'react-native-appwrite';

interface GlobalState {
  user: Models.User<Models.Preferences> | undefined;
  selectedLanguage: 'kab' | 'fr' | null;
}

export const { useStore, store, useStoreEffect } = createStore<GlobalState>({
  user: undefined, 
  selectedLanguage: 'kab', 
});

export const setUser = (userData: Models.User<Models.Preferences> | undefined) => {
  store.user = userData;
};

export const setSelectedLanguage = (lang: 'kab' | 'fr') => {
  store.selectedLanguage = lang;
};
