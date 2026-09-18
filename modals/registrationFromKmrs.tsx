import React, { useState, useEffect } from 'react';
import { useColorScheme, ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import MapView, { Marker, Region } from 'react-native-maps';
import { account, databases, config, ID, r2Config, functions } from '@/app/(main)/calculation-logic/appwriteConfig';
import { useAppTranslation } from './translations/data/translationCentralization';
import { uploadToR2, R2File } from '@/app/(main)/calculation-logic/imagesLogic';
import { Colors } from '../appSellerColors';
import { COMMERCE_PERCENTAGES } from '../logic/gainSellerLogic';
import { useAgePhoneValidation, useTimeValidation } from '@/app/(main)/calculation-logic/verifAgeNum';

interface Time {
  hour: string;
  minute: string;
}

interface RegistrationFormState {
  name: string;
  dob: string;
  phoneNumber: string;
  photo: string;
  imageId?: string | null;
  email: string;
  password: string;
  storeName: string;
  storeType: string | undefined;
  commercialRegistrationNumber: string;
  commune: string;
  village: string;
  location: { latitude: number; longitude: number } | null;
  workDays: string[];
  weekdayOpening: Time;
  weekdayClosing: Time;
  weekendOpening: Time;
  weekendClosing: Time;
}

const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormState>({
    name: '',
    dob: '',
    phoneNumber: '',
    photo: '',
    imageId: '',
    email: '',
    password: '',
    storeName: '',
    storeType: undefined,
    commercialRegistrationNumber: '',
    commune: '',
    village: '',
    location: null,
    workDays: [],
    weekdayOpening: { hour: '', minute: '' },
    weekdayClosing: { hour: '', minute: '' },
    weekendOpening: { hour: '', minute: '' },
    weekendClosing: { hour: '', minute: '' },
  });

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme as 'light' | 'dark'];
  const styles = createStyles(theme);

  const { t } = useAppTranslation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [tempSelectedLocation, setTempSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'commission'>('form');

  const storeTypes: string[] = ['fast', 'rest', 'sup', 'alim', 'frleg', 'pzpat', 'blnj', 'gatrad', 'prodcos', 'brtbc', 'bcvr', 'bcvb', 'pss', 'epss', 'cremerie'];
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const commerceKey = storeTypes[formData.storeType || ''] as keyof typeof COMMERCE_PERCENTAGES;
  const commissionPercentage = commerceKey ? COMMERCE_PERCENTAGES[commerceKey] : 0;
  const viewRate = commissionPercentage / 10;
  const { birthDate,
    birthDateError,
    handleBirthDateChange,
    isBirthDateValid,
    phone,
    phoneError,
    handlePhoneChange,
    isPhoneValid } = useAgePhoneValidation();

  const {
    weekdayTimeError,
    weekendTimeError,
    handleTimeChange,
    checkWeekdayPair,
    checkWeekendPair
  } = useTimeValidation(setFormData);

  const handleInputChange = <K extends keyof RegistrationFormState>(field: K, value: RegistrationFormState[K]) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  useEffect(() => {
    checkWeekdayPair(formData.weekdayOpening, formData.weekdayClosing);
  }, [formData.weekdayOpening, formData.weekdayClosing]);

  useEffect(() => {
    checkWeekendPair(formData.weekendOpening, formData.weekendClosing);
  }, [formData.weekendOpening, formData.weekendClosing]);

  const handleConfirmLocation = () => {
    if (tempSelectedLocation) {
      setFormData({ ...formData, location: tempSelectedLocation });
    } else {
      Alert.alert(t('general.error'), t('noLocationSelected'));
    }
  };

  const handleImportPhoto = async () => {
    try {
      let { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('photoError'), t('photoPermissionDenied'));
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({ ...formData, idPhotoUri: result.assets[0].uri });
      } else if (result.canceled) {
      }

    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('photoError'), t('importFailed'));
    }
  };

  const toggleWorkDay = (day: string) => {
    setFormData((prev: RegistrationFormState) => {
      const isSelected = prev.workDays.includes(day);
      if (isSelected) {
        return {
          ...prev,
          workDays: prev.workDays.filter((d: string) => d !== day),
        };
      } else {
        return {
          ...prev,
          workDays: [...prev.workDays, day],
        };
      }
    });
  };

  const uploadImage = async (uri: string, uid: string): Promise<string | null> => {
    if (!uri) return null;
    setIsLoading(true);
    try {
      const fileKey = `${r2Config.folders.STORES}${uid}.jpg`;

      const file: R2File = {
        uri: uri,
        name: `${uid}.jpg`,
        type: 'image/jpeg',
      };

      await uploadToR2(fileKey, file);

      const downloadURL = `${r2Config.publicUrl}/${fileKey}`;
      setIsLoading(false);
      return downloadURL;
    } catch (error) {
      const err = error as Error;
      console.error("Error uploading image:", err);
      Alert.alert(t('uploadPhotoFailed'), err.message || t('genericError'));
      setIsLoading(false);
      return null;
    }
  };

  const isFormValid = (): boolean => {
    const requiredFieldsFilled =
      formData.name.trim() !== '' &&
      isBirthDateValid() &&
      isPhoneValid() &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.commercialRegistrationNumber.trim() !== '' &&
      formData.location !== null &&
      formData.idPhotoUri !== null &&
      formData.workDays.length > 0 &&
      formData.weekdayOpening.hour.trim() !== '' && formData.weekdayOpening.minute.trim() !== '' &&
      formData.weekdayClosing.hour.trim() !== '' && formData.weekdayClosing.minute.trim() !== '' &&
      formData.weekendOpening.hour.trim() !== '' && formData.weekendOpening.minute.trim() !== '' &&
      formData.weekendClosing.hour.trim() !== '' && formData.weekendClosing.minute.trim() !== '';

    const noErrors =
      weekdayTimeError === '' &&
      weekendTimeError === '';

    const storeTypeSelected = formData.storeType !== undefined;

    return requiredFieldsFilled && noErrors && storeTypeSelected;
  }

  const isNextButtonEnabled = isFormValid() && !isLoading;
  const handleNext = () => {
    if (isFormValid()) {
      setCurrentStep('commission');
    } else {
      const missingFields = [];
      if (formData.name.trim() === '') missingFields.push(t('nameLabel'));
      if (!isBirthDateValid()) missingFields.push(t('dobLabel') + (birthDateError ? ` (${birthDateError})` : ''));
      if (!isPhoneValid()) missingFields.push(t('phoneLabel') + (phoneError ? ` (${phoneError})` : ''));
      if (formData.email.trim() === '') missingFields.push(t('emailLabel'));
      if (formData.password.trim() === '') missingFields.push(t('passwordLabel'));
      if (formData.commercialRegistrationNumber.trim() === '') missingFields.push(t('commercialRegLabel'));
      if (formData.location === null) missingFields.push(t('tab.gps'));
      if (formData.idPhotoUri === null) missingFields.push(t('idPhotoLabel'));
      if (formData.workDays.length === 0) missingFields.push(t('workDaysLabel'));
      if (formData.weekdayOpening.hour.trim() === '' || formData.weekdayOpening.minute.trim() === '' || weekdayTimeError !== '') missingFields.push(t('workHoursLabel') + ` (${t('weekdaysText')})` + (weekdayTimeError ? ` (${weekdayTimeError})` : ''));
      if (formData.weekendOpening.hour.trim() === '' || formData.weekendOpening.minute.trim() === '' || weekendTimeError !== '') missingFields.push(t('workHoursLabel') + ` (${t('weekendText')})` + (weekendTimeError ? ` (${weekendTimeError})` : ''));
      if (formData.storeType === undefined) missingFields.push(t('storeTypes'));
      let errorMessage = t('missingFieldsPrompt') + '\n\n' + missingFields.join('\n');
      Alert.alert(t('formIncompleteTitle'), errorMessage);
    }
  };

  const handleRegister = async () => {
    if (isFormValid()) {
      setIsLoading(true);
      try {
        const userAccount = await account.create(
          ID.unique(),
          formData.email,
          formData.password,
          formData.name
        );
        const uid = userAccount.$id;
        const storePhotoUrl = await uploadImage(formData.idPhotoUri as string, uid);
        if (!storePhotoUrl) {
          throw new Error('Failed to upload store photo');
        }
        const storeData = {
          userId: uid,
          name: formData.name,
          dob: birthDate,
          phoneNumber: phone,
          email: formData.email,
          storeName: formData.storeName,
          storeType: formData.storeType,
          commercialRegistrationNumber: formData.commercialRegistrationNumber,
          commune: formData.commune,
          village: formData.village,
          latitude: formData.location?.latitude,
          longitude: formData.location?.longitude,
          workDays: formData.workDays,
          weekdayOpeningHour: formData.weekdayOpening.hour,
          weekdayOpeningMinute: formData.weekdayOpening.minute,
          weekdayClosingHour: formData.weekdayClosing.hour,
          weekdayClosingMinute: formData.weekdayClosing.minute,
          weekendOpeningHour: formData.weekendOpening.hour,
          weekendOpeningMinute: formData.weekendOpening.minute,
          weekendClosingHour: formData.weekendClosing.hour,
          weekendClosingMinute: formData.weekendClosing.minute,
          storePhotoUrl: storePhotoUrl,
          registrationDate: new Date().toISOString(),
          status: 'pending_approval'
        };
        await databases.createDocument(
          config.databaseId,
          config.storesCollectionId,
          uid,
          storeData
        );
        console.log('Inscription réussie, données enregistrées:', storeData);
        Alert.alert(t('general.success'), t('registrationSuccess'));
      } catch (error) {
        const err = error as Error & { code?: number };
        console.error('Appwrite registration error:', error);
        let errorMessage = t('registrationFailed');
        if (err.code === 409) {
          errorMessage = t('emailAlreadyInUse');
        } else if (err.message === 'Failed to upload store photo') {
          errorMessage = t('uploadPhotoFailed');
        } else {
          errorMessage = `${t('registrationFailed')}: ${err.message}`;
        }
        Alert.alert(t('general.error'), errorMessage);
      } finally {
        setIsLoading(false);
      }
    } else {
      const missingFields = [];
      if (formData.name.trim() === '') missingFields.push(t('nameLabel'));
      if (!isBirthDateValid()) missingFields.push(t('dobLabel') + (birthDateError ? ` (${birthDateError})` : ''));
      if (!isPhoneValid()) missingFields.push(t('phoneLabel') + (phoneError ? ` (${phoneError})` : ''));
      if (formData.email.trim() === '') missingFields.push(t('emailLabel'));
      if (formData.password.trim() === '') missingFields.push(t('passwordLabel'));
      if (formData.commercialRegistrationNumber.trim() === '') missingFields.push(t('commercialRegLabel'));
      if (formData.location === null) missingFields.push(t('tab.gps'));
      if (formData.idPhotoUri === null) missingFields.push(t('idPhotoLabel'));
      if (formData.workDays.length === 0) missingFields.push(t('workDaysLabel'));
      if (formData.weekdayOpening.hour.trim() === '' || formData.weekdayOpening.minute.trim() === '' || weekdayTimeError !== '') missingFields.push(t('workHoursLabel') + ` (${t('weekdaysText')})` + (weekdayTimeError ? ` (${weekdayTimeError})` : ''));
      if (formData.weekendOpening.hour.trim() === '' || formData.weekendOpening.minute.trim() === '' || weekendTimeError !== '') missingFields.push(t('workHoursLabel') + ` (${t('weekendText')})` + (weekendTimeError ? ` (${weekendTimeError})` : ''));
      if (formData.storeType === undefined) missingFields.push(t('storeTypes'));

      let errorMessage = t('missingFieldsPrompt') + '\n\n' + missingFields.join('\n');
      Alert.alert(t('formIncompleteTitle'), errorMessage);
    }
  };

  const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    setTempSelectedLocation(event.nativeEvent.coordinate);
  };

  if (currentStep === 'commission') {
    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{t('commissionTitle')}</Text>
        <Text style={styles.infoTextDes}>
          {t('commissionDesc')}
          {' '}
          <Text style={styles.label}>{t(formData.storeType || '')}</Text>
          {t('commissionDesc01')}
          <Text style={styles.label}>{commissionPercentage}%</Text>
          {' '}
          {t('commissionDesc02')}
        </Text>
        <Text style={styles.sidetitle}>{t('commissionViews')}</Text>
        <Text style={styles.infoTextDes}>
          {t('commissionViews01')}
          {' '}
          <Text style={styles.label}>{viewRate.toFixed(3)} DZD {t('perView')}</Text>
        </Text>

        <TouchableOpacity
          onPress={() => setTermsAccepted(!termsAccepted)}
          disabled={isLoading}
          style={styles.passwordInputContainer}
        >
          <Ionicons
            name={termsAccepted ? 'checkbox' : 'square-outline'}
            size={30}
            color={termsAccepted ? theme.green : theme.greyDes}
          />
          <Text style={styles.passwordInput}>{t('termsAcceptance')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.customButton, styles.nextButton, (!termsAccepted || isLoading) && styles.nextButtonDisabled]}
          onPress={handleRegister}
          disabled={!termsAccepted || isLoading}
        >
          <Text style={styles.customButtonText}>
            {isLoading ? <ActivityIndicator color={theme.accent} /> : t('registerMySelf')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('titleMgz')}</Text>
      <Text style={styles.sidetitle}>{t('aboutYou')}</Text>
      <Text style={styles.label}>{t('nameLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text: string) => handleInputChange('name', text)}
        placeholder={t('placeholderFullName')}
        keyboardType="default"
        autoCapitalize="words"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('dobLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={birthDate}
        onChangeText={handleBirthDateChange}
        placeholder={t('dobPlaceholder')}
        keyboardType="number-pad"
        maxLength={10}
        editable={!isLoading}
      />

      {birthDateError ? <Text style={styles.errorText}>{birthDateError}</Text> : null}
      <Text style={styles.label}>{t('phoneLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={handlePhoneChange}
        placeholder={'0XXXXXXXXX'}
        keyboardType="phone-pad"
        maxLength={14}
        editable={!isLoading}
      />
      {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

      <Text style={styles.sidetitle}>{t('connectionInfo')}</Text>
      <Text style={styles.label}>{t('emailLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.email}
        onChangeText={(text: string) => handleInputChange('email', text)}
        placeholder={t('profileScreen.newEmailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('passwordLabel')} :</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={formData.password}
          onChangeText={(text: string) => handleInputChange('password', text)}
          placeholder={'********'}
          secureTextEntry={!passwordVisible}
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setPasswordVisible(!passwordVisible)}
          disabled={isLoading}
        >
          <Ionicons
            name={passwordVisible ? 'eye-off' : 'eye'}
            size={24}
            color={theme.textNormal}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.sidetitle}>{t('activityInfo')}</Text>
      <Text style={styles.label}>{t('storeNameLabel')} :</Text>        <TextInput
        style={styles.input}
        value={formData.storeName}
        onChangeText={(text: string) => handleInputChange('storeName', text)}
        placeholder={t('storeNamePlaceholder')}
        keyboardType="default"
        autoCapitalize="words"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('storePhotoLabel')} :</Text>
      <TouchableOpacity
        style={styles.customButton}
        onPress={handleImportPhoto}
        disabled={isLoading}
      >
        <Text style={styles.customButtonText}>{isLoading ? <ActivityIndicator color={theme.accent} size="small" /> : t('importPhotoBtn')}</Text>
      </TouchableOpacity>

      {formData.idPhotoUri && (
        <Image
          source={{ uri: formData.idPhotoUri }}
          style={styles.idPhotoPreview}
          resizeMode="cover"
        />
      )}
      <Text style={styles.label}>{t('storeTypes')} :</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.storeType}
          onValueChange={(itemValue: string | undefined) =>
            handleInputChange('storeType', itemValue)
          }
          style={styles.picker}
          enabled={!isLoading}
        >
          <Picker.Item label={t('storeTypePlaceholder')} value={undefined} enabled={false} />
          {storeTypes.map((type, index) => (
            <Picker.Item key={index} label={t(type)} value={type} />
          ))}
        </Picker>
      </View>
      <Text style={styles.label}>{t('commercialRegLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.commercialRegistrationNumber}
        onChangeText={(text: string) => handleInputChange('commercialRegistrationNumber', text)}
        placeholder={t('commercialRegPlaceholder')}
        keyboardType="default"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('storeAddressLabel')} :</Text>
      <Text style={styles.label}>{t('communeLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.commune}
        onChangeText={(text: string) => handleInputChange('commune', text)}
        placeholder={t('communePlaceholder')}
        keyboardType="default"
        autoCapitalize="words"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('villageLabel')} :</Text>
      <TextInput
        style={styles.input}
        value={formData.village}
        onChangeText={(text: string) => handleInputChange('village', text)}
        placeholder={t('villagePlaceholder')}
        keyboardType="default"
        autoCapitalize="words"
        editable={!isLoading}
      />
      <Text style={styles.label}>{t('tab.gps')} :</Text>
      <Text style={styles.mapInstructionText}>{t('simulateMapText')}</Text>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={mapRegion || undefined}
          showsUserLocation={true}
          showsMyLocationButton={true}
          onRegionChangeComplete={setMapRegion}
          onPress={handleMapPress}
          zoomEnabled={!isLoading}
          scrollEnabled={!isLoading}
          pitchEnabled={!isLoading}
          rotateEnabled={!isLoading}
        >
          {tempSelectedLocation && (
            <Marker
              coordinate={tempSelectedLocation}
              title={t('selectLocationOnMap')}
              pinColor={theme.errorText}
            />
          )}
        </MapView>
      </View>

      {tempSelectedLocation && (
        <TouchableOpacity
          onPress={handleConfirmLocation}
          style={[styles.customButton, styles.confirmLocationButton]}
          disabled={isLoading}
        >
          <Text style={styles.customButtonText}>{isLoading ? t('loading') : t('confirmLocationBtn')}</Text>
        </TouchableOpacity>
      )}

      {formData.location && (
        <Text style={styles.locationSelectedText}>
          {t('locationSelectedText', { lat: formData.location.latitude, lng: formData.location.longitude })}
        </Text>
      )}
      <Text style={styles.sidetitle}>{t('workDaysLabel')} :</Text>
      <View style={styles.workDaysContainer}>
        {weekDays.map(day => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              formData.workDays.includes(day) && styles.selectedDayButton,
            ]}
            onPress={() => toggleWorkDay(day)}
            disabled={isLoading}
          >
            <Text style={[
              styles.dayButtonText,
              formData.workDays.includes(day) && styles.selectedDayButtonText,
            ]}>{t(day)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sidetitle}>{t('workHoursLabel')} :</Text>
      <Text style={styles.label}>{t('weekdaysText')} :</Text>
      <View style={styles.timeInputContainer}>
        <TextInput
          style={styles.timeInput}
          value={formData.weekdayOpening.hour}
          onChangeText={(text: string) => handleTimeChange('weekdayOpening', 'hour', text)}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekdayOpening.minute}
          onChangeText={(text: string) => handleTimeChange('weekdayOpening', 'minute', text)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeRangeText}> - </Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekdayClosing.hour}
          onChangeText={(text: string) => handleTimeChange('weekdayClosing', 'hour', text)}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekdayClosing.minute}
          onChangeText={(text: string) => handleTimeChange('weekdayClosing', 'minute', text)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
      </View>
      {weekdayTimeError ? <Text style={styles.errorText}>{weekdayTimeError}</Text> : null}

      <Text style={styles.label}>{t('weekendText')} :</Text>
      <View style={styles.timeInputContainer}>
        <TextInput
          style={styles.timeInput}
          value={formData.weekendOpening.hour}
          onChangeText={(text: string) => handleTimeChange('weekendOpening', 'hour', text)}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekendOpening.minute}
          onChangeText={(text: string) => handleTimeChange('weekendOpening', 'minute', text)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeRangeText}> - </Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekendClosing.hour}
          onChangeText={(text: string) => handleTimeChange('weekendClosing', 'hour', text)}
          placeholder="HH"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput
          style={styles.timeInput}
          value={formData.weekendClosing.minute}
          onChangeText={(text: string) => handleTimeChange('weekendClosing', 'minute', text)}
          placeholder="MM"
          keyboardType="number-pad"
          maxLength={2}
          editable={!isLoading}
        />
      </View>
      {weekendTimeError ? <Text style={styles.errorText}>{weekendTimeError}</Text> : null}

      <TouchableOpacity
        style={[styles.customButton, styles.nextButton, !isNextButtonEnabled && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isNextButtonEnabled}
      >
        <Text style={styles.customButtonText}>
          {isLoading ? <ActivityIndicator color={theme.accent} /> : t('nextButton')}
        </Text>
      </TouchableOpacity>
      <Text style={styles.infoText}>{t('noteVerification')}</Text>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const createStyles = (theme: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: theme.text,
  },
  sidetitle: {
    fontSize: 18,
    color: theme.tint,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
    alignSelf: 'auto',
    textDecorationLine: 'underline'
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginTop: 10,
    color: theme.text,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.textNormal,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: theme.surface,
  },
  errorText: {
    color: theme.errorText,
    fontSize: 12,
    marginTop: 0,
    marginBottom: 15,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.green,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: theme.surface,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  passwordToggle: {
    padding: 12,
  },
  infoText: {
    fontSize: 13,
    color: theme.greyDes,
    marginTop: 0,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  infoTextDes: {
    fontSize: 14,
    color: theme.greyDes,
    marginTop: 0,
    marginBottom: 15,
  },
  customButton: {
    backgroundColor: theme.green,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    width: '30%',
    selfAlign: 'center',
  },
  customButtonText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  idPhotoPreview: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 15,
    alignSelf: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.text,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: theme.surface,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  mapInstructionText: {
    fontSize: 14,
    color: theme.textNormal,
    marginBottom: 10,
    textAlign: 'center',
  },
  mapContainer: {
    height: 300,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: theme.tint,
  },
  map: {
    flex: 1,
  },
  confirmLocationButton: {
    backgroundColor: theme.tint,
  },
  locationSelectedText: {
    fontSize: 14,
    color: theme.textNormal,
    textAlign: 'center',
    marginBottom: 15,
  },
  workDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dayButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: theme.tint,
    borderRadius: 20,
    margin: 4,
  },
  selectedDayButton: {
    backgroundColor: theme.green,
  },
  dayButtonText: {
    color: theme.tint,
    fontSize: 14,
  },
  selectedDayButtonText: {
    color: theme.accent,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    selfAlign: 'center',
    marginBottom: 15,
  },
  timeInput: {
    width: 50,
    borderWidth: 1.5,
    borderColor: theme.textNormal,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: theme.surface,
  },
  timeSeparator: {
    fontSize: 18,
    marginHorizontal: 5,
    color: theme.textNormal,
  },
  timeRangeText: {
    fontSize: 16,
    marginHorizontal: 10,
    color: theme.textNormal,
  },
  nextButton: {
    backgroundColor: theme.green,
    marginTop: 20,
    width: '30%',
    selfAlign: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: theme.greyDes,
    width: '30%',
    opacity: 0.5,
    selfAlign: 'center',
  },
});

export default RegistrationForm;
