import { createStore } from 'stan-js';
import fr from './fr.json';
import kab from './kab.json';

const dictionaries: Record<string, Record<string, string>> = { fr, kab };

const { useStore, store } = createStore({
  selectedLanguage: 'kab' as 'fr' | 'kab',
});

const translate = (lang: 'fr' | 'kab', key: string, data?: Record<string, any>): string => {
  const cleanKey = key.trim();

  // 1. On cherche dans la langue demandée
  let result = dictionaries[lang][cleanKey];

  // 2. Fallback intelligent : si absent en FR, on cherche en KAB
  if (!result && lang !== 'kab') {
    result = dictionaries['kab'][cleanKey];
  }

  // 3. Recherche insensible à la casse si toujours rien
  if (!result) {
    const keys = Object.keys(dictionaries[lang]);
    const foundKey = keys.find(k => k.toLowerCase() === cleanKey.toLowerCase());
    if (foundKey) result = dictionaries[lang][foundKey];
  }

  // 4. Fallback ultime : si absent en KAB, on cherche en FR
  if (!result && lang === 'kab') {
      result = dictionaries['fr'][cleanKey];
  }

  // 5. Si vraiment rien, on renvoie la clé
  if (typeof result !== 'string') return cleanKey;

  // Injection des variables {{...}}
  if (data) {
    return result.replace(/{{(.*?)}}/g, (match, p1) => {
      const keyFound = p1.trim();
      return data[keyFound] !== undefined ? String(data[keyFound]) : match;
    });
  }
  return result;
};

export function useAppTranslation() {
  const { selectedLanguage } = useStore();
  const currentLang = selectedLanguage || 'kab';

  const t = (key: string, data?: Record<string, any>) => translate(currentLang, key, data);

  const setLanguage = (lang: 'fr' | 'kab') => {
    store.selectedLanguage = lang;
  };

  return { t, currentLang, setLanguage };
}
