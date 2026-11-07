import { createStore } from 'stan-js';
const fr = require('./fr.json');
const kab = require('./kab.json');

const dictionaries: Record<string, Record<string, string>> = { fr, kab };

const { useStore, store } = createStore({
  selectedLanguage: 'kab' as 'fr' | 'kab',
});

const translate = (lang: 'fr' | 'kab', key: string, data?: Record<string, any>): string => {
  const cleanKey = key.trim();

  let result = dictionaries[lang][cleanKey];

  if (!result && lang !== 'kab') {
    result = dictionaries['kab'][cleanKey];
  }

  if (!result) {
    const keys = Object.keys(dictionaries[lang]);
    const foundKey = keys.find(k => k.toLowerCase() === cleanKey.toLowerCase());
    if (foundKey) result = dictionaries[lang][foundKey];
  }

  if (!result && lang === 'kab') {
    result = dictionaries['fr'][cleanKey];
  }

  if (typeof result !== 'string') return cleanKey;

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
