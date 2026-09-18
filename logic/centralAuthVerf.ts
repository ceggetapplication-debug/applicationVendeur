export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export interface PhoneValidationResult {
  isValid: boolean;
  errorKey?: string;
}

export const validatePhone = (phone: string): PhoneValidationResult => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) return { isValid: false, errorKey: 'errorPhoneIncomplete' };
  if (cleaned.length < 10) return { isValid: false, errorKey: 'errorPhoneIncomplete' };

  const hasValidPrefix = cleaned.startsWith('05') || cleaned.startsWith('06') || cleaned.startsWith('07');
  if (!hasValidPrefix) return { isValid: false, errorKey: 'errorPhoneStart' };

  if (cleaned.length > 10) return { isValid: false, errorKey: 'errorPhoneMax' };

  return { isValid: true };
};

export interface BirthDateValidationResult {
  isValid: boolean;
  errorKey?: string;
  age?: number;
}

export const validateBirthDate = (birthDate: string): BirthDateValidationResult => {
  if (birthDate.length !== 10) return { isValid: false };

  const [dd, mm, yyyy] = birthDate.split('/').map(Number);
  const isValidMonth = mm >= 1 && mm <= 12;
  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  const isValidDay = dd >= 1 && dd <= daysInMonth;

  if (!isValidMonth) return { isValid: false, errorKey: 'errorBirthDateMonth' };
  if (!isValidDay) return { isValid: false, errorKey: 'errorBirthDateDay' };

  const today = new Date();
  const birthDateObj = new Date(yyyy, mm - 1, dd);
  let age = today.getFullYear() - yyyy;
  const monthDiff = today.getMonth() - birthDateObj.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }

  if (age < 19) return { isValid: false, errorKey: 'errorBirthDateAgeTooYoung', age };
  if (age > 100) return { isValid: false, errorKey: 'errorBirthDateAgeTooOld', age };

  return { isValid: true, age };
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) errors.push('passwordNote');
  if (!/[A-Z]/.test(password)) errors.push('passwordNote');
  if (!/[a-z]/.test(password)) errors.push('passwordNote');
  if (!/[0-9]/.test(password)) errors.push('passwordNote');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('passwordNote');

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatBirthDateInput = (text: string): string => {
  let formatted = text.replace(/\D/g, '');
  if (formatted.length >= 2 && formatted.length < 4) {
    formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
  } else if (formatted.length >= 4) {
    formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4) + '/' + formatted.slice(4, 8);
  }
  return formatted.slice(0, 10);
};
