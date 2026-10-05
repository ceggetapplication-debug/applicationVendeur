import { useState, useCallback } from 'react';
import { useAppTranslation } from './translations/data/translationCentralization.ts';

export const useAgePhoneValidation = () => {
  const { t } = useAppTranslation();
  const [birthDate, setBirthDate] = useState('');
  const [birthDateError, setBirthDateError] = useState('');

  const handleBirthDateChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let i = 0;
    let day = '';
    let month = '';
    let year = '';

    if (i < digits.length) {
      const c = digits[i];
      if (c > '3') { day = '0' + c; i++; }
      else {
        day = c; i++;
        if (i < digits.length) { day += digits[i]; i++; }
      }
    }
    if (i < digits.length) {
      const c = digits[i];
      if (c > '1') { month = '0' + c; i++; }
      else {
        month = c; i++;
        if (i < digits.length) { month += digits[i]; i++; }
      }
    }
    year = digits.slice(i, i + 4);

    let formatted = day;
    if (month) formatted += '/' + month;
    if (year) formatted += '/' + year;
    if (formatted.length >= 2 && formatted.charAt(2) !== '/') formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    if (formatted.length >= 5 && formatted.charAt(5) !== '/') formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9);
    if (formatted.length > 10) formatted = formatted.slice(0, 10);

    setBirthDate(formatted);

    if (formatted.length === 10) {
      const [dd, mm, yyyy] = formatted.split('/').map(Number);
      const isValidMonth = mm >= 1 && mm <= 12;
      const daysInMonth = new Date(yyyy, mm, 0).getDate();
      const isValidDay = dd >= 1 && dd <= daysInMonth;
      const today = new Date();
      const birthDateObj = new Date(yyyy, mm - 1, dd);
      let age = today.getFullYear() - yyyy;
      const m = today.getMonth() - birthDateObj.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) age--;

      if (!isValidMonth) setBirthDateError(t('errorBirthDateMonth'));
      else if (!isValidDay) setBirthDateError(t('errorBirthDateDay'));
      else if (age < 19) setBirthDateError(t('errorBirthDateAgeTooYoung').replace('{0}', String(age)));
      else if (age > 100) setBirthDateError(t('errorBirthDateAgeTooOld').replace('{0}', String(age)));
      else setBirthDateError('');
    } else {
      setBirthDateError('');
    }
  };

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setPhone(cleaned);

    if (cleaned.length === 0) setPhoneError('');
    else if (cleaned.length < 10) setPhoneError(t('errorPhoneIncomplete'));
    else if (!/^0[567]/.test(cleaned)) setPhoneError(t('errorPhoneStart'));
    else if (cleaned.length > 10) setPhoneError(t('errorPhoneMax'));
    else setPhoneError('');
  };

  const isBirthDateValid = () => !!birthDate && birthDate.length === 10 && !birthDateError;
  const isPhoneValid = () => !!phone && phone.replace(/\D/g, '').length === 10 && !phoneError;

  return {
    birthDate, birthDateError, handleBirthDateChange, isBirthDateValid,
    phone, phoneError, handlePhoneChange, isPhoneValid,
  };
};

export const useTimeValidation = <T extends Record<string, any>>(setFormData: (updater: (prev: T) => T) => void) => {
  const { t } = useAppTranslation();
  const [weekdayTimeError, setWeekdayTimeError] = useState('');
  const [weekendTimeError, setWeekendTimeError] = useState('');

  const validateTime = useCallback((time: { hour: string; minute: string }): string => {
    if (!time.hour && !time.minute) return '';
    const hour = parseInt(time.hour, 10);
    const minute = parseInt(time.minute, 10);
    if (time.hour.length !== 2 || time.minute.length !== 2 || isNaN(hour) || isNaN(minute)) return t('timeFormatError');
    if (hour < 0 || hour > 23) return t('hoursError');
    if (minute < 0 || minute > 59) return t('minutesError');
    return '';
  }, [t]);

  const validateTimePair = useCallback((open: { hour: string; minute: string }, close: { hour: string; minute: string }): string => {
    const openError = validateTime(open);
    if (openError) return openError;
    const closeError = validateTime(close);
    if (closeError) return closeError;
    if ((!open.hour || !open.minute) && (!close.hour || !close.minute)) return '';
    if ((!open.hour || !open.minute) || (!close.hour || !close.minute)) return t('timeFormatError');
    const openMinutes = parseInt(open.hour, 10) * 60 + parseInt(open.minute, 10);
    const closeMinutes = parseInt(close.hour, 10) * 60 + parseInt(close.minute, 10);
    if (closeMinutes < openMinutes) return t('timeOrderError');
    return '';
  }, [validateTime, t]);

  const checkWeekdayPair = useCallback((opening: { hour: string; minute: string }, closing: { hour: string; minute: string }) => {
    setWeekdayTimeError(validateTimePair(opening, closing));
  }, [validateTimePair]);

  const checkWeekendPair = useCallback((opening: { hour: string; minute: string }, closing: { hour: string; minute: string }) => {
    setWeekendTimeError(validateTimePair(opening, closing));
  }, [validateTimePair]);

  const handleTimeChange = (
    timeField: string,
    part: 'hour' | 'minute',
    value: string
  ) => {
    const cleanedValue = value.replace(/\D/g, '');
    let formattedValue = cleanedValue;

    if (part === 'hour') {
      if (formattedValue.length > 2) formattedValue = formattedValue.slice(0, 2);
      const hour = parseInt(formattedValue, 10);
      if (formattedValue.length > 0 && (isNaN(hour) || hour < 0 || hour > 23)) {
        if (timeField.startsWith('weekday')) setWeekdayTimeError(t('hoursError'));
        if (timeField.startsWith('weekend')) setWeekendTimeError(t('hoursError'));
      } else {
        if (timeField.startsWith('weekday')) setWeekdayTimeError('');
        if (timeField.startsWith('weekend')) setWeekendTimeError('');
      }
    }
    if (part === 'minute') {
      if (formattedValue.length > 2) formattedValue = formattedValue.slice(0, 2);
      const minute = parseInt(formattedValue, 10);
      if (formattedValue.length > 0 && (isNaN(minute) || minute < 0 || minute > 59)) {
        if (timeField.startsWith('weekday')) setWeekdayTimeError(t('minutesError'));
        if (timeField.startsWith('weekend')) setWeekendTimeError(t('minutesError'));
      } else {
        if (timeField.startsWith('weekday')) setWeekdayTimeError('');
        if (timeField.startsWith('weekend')) setWeekendTimeError('');
      }
    }

    setFormData((prev: T) => ({
      ...prev,
      [timeField]: { ...(prev[timeField] as Record<string, string>), [part]: formattedValue },
    }));
  };

  return { weekdayTimeError, weekendTimeError, handleTimeChange, checkWeekdayPair, checkWeekendPair };
};

