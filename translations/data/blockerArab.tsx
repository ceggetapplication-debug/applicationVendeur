
export const isArabicChar = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0600 && code <= 0x06FF) || 
    (code >= 0x0750 && code <= 0x077F) || 
    (code >= 0x08A0 && code <= 0x08FF) || 
    (code >= 0xFB50 && code <= 0xFDFF) || 
    (code >= 0xFE70 && code <= 0xFEFF)   
  );
};

export const containsArabic = (text: string): boolean => {
  return [...text].some(char => isArabicChar(char));
};

export const filterArabicChars = (input: string): string => {
  return input
    .split('')
    .map(char => isArabicChar(char) ? '□' : char)
    .join('');
};

export const replaceArabicChars = (input: string, replacement: string = '□'): string => {
  return input
    .split('')
    .map(char => isArabicChar(char) ? replacement : char)
    .join('');
};

export const removeArabicChars = (input: string): string => {
  return input
    .split('')
    .filter(char => !isArabicChar(char))
    .join('');
};

export const blockArabicInput = (text: string): string => {
  return filterArabicChars(text);
};
