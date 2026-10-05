import React, { useState, useEffect } from 'react';
import { useColorScheme, ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import MapView, { Marker, Region } from 'react-native-maps';
import { account, databases, config, ID, r2Config } from '../../app/main/calculation-logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { uploadToR2 } from '../../app/main/calculation-logic/imagesLogic';
import { Colors } from '../appSellerColors';
import { COMMERCE_PERCENTAGES } from '../logic/gainSellerLogic';
import { useAgePhoneValidation, useTimeValidation } from '../logic/verifAgeNum';

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
  idPhotoUri?: string | null;
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
  const commerceKey = (formData.storeType || '') as keyof typeof COMMERCE_PERCENTAGES;
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
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, idPhotoUri: result.assets[0].uri });
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

  const isFormValid = (): boolean => {
    return (
      formData.name.trim() !== '' &&
      isBirthDateValid() &&
      isPhoneValid() &&
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.commercialRegistrationNumber.trim() !== '' &&
      formData.location !== null &&
      formData.idPhotoUri !== undefined &&
      formData.workDays.length > 0 &&
      weekdayTimeError === '' &&
      weekendTimeError === '' &&
      formData.storeType !== undefined
    );
  }

  const isNextButtonEnabled = isFormValid() && !isLoading;
  const handleNext = () => {
    if (isFormValid()) {
      setCurrentStep('commission');
    } else {
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const user = await account.create(
        ID.unique(),
        formData.email.trim(),
        formData.password,
        formData.name.trim()
      );

      let photoUrl = '';
      if (formData.idPhotoUri) {
        const r2Path = `${r2Config.folders.STORES}${user.$id}.jpg`;
        const fileToUpload = { uri: formData.idPhotoUri, name: `${user.$id}.jpg`, type: 'image/jpeg' };
        await uploadToR2(r2Path, fileToUpload);
        photoUrl = `${r2Config.publicUrl}/${r2Path}`;
      }

      await databases.createDocument(
        config.databaseId,
        config.storesCollectionId,
        ID.unique(),
        {
          userId: user.$id,
          nom: formData.storeName.trim(),
          type: formData.storeType,
          commune: formData.commune,
          village: formData.village,
          telephone: formData.phoneNumber,
          email: formData.email.trim(),
          registreCommerce: formData.commercialRegistrationNumber,
          photoUrl: photoUrl,
          latitude: formData.location?.latitude,
          longitude: formData.location?.longitude,
        }
      );

      Alert.alert(t('general.success'), t('registrationSuccess'));
    } catch (error) {
      console.error('Erreur inscription vendeur:', error);
      Alert.alert(t('general.error'), t('registrationFailed'));
    } finally {
      setIsLoading(false);
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
          {t('commissionDesc')} {t(formData.storeType || '')} {t('commissionDesc01')} {commissionPercentage}% {t('commissionDesc02')}
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
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text: string) => handleInputChange('name', text)}
        placeholder={t('placeholderFullName')}
        placeholderTextColor={theme.greyDes}
      />
      <TextInput
        style={styles.input}
        value={birthDate}
        onChangeText={handleBirthDateChange}
        placeholder={t('dobPlaceholder')}
        placeholderTextColor={theme.greyDes}
        maxLength={10}
      />
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={handlePhoneChange}
        placeholder={'0XXXXXXXXX'}
        placeholderTextColor={theme.greyDes}
        maxLength={14}
      />
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={formData.password}
          onChangeText={(text: string) => handleInputChange('password', text)}
          placeholder={'********'}
          placeholderTextColor={theme.greyDes}
          secureTextEntry={!passwordVisible}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color={theme.textNormal} />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        value={formData.storeName}
        onChangeText={(text: string) => handleInputChange('storeName', text)}
        placeholder={t('storeNamePlaceholder')}
      />
      <TouchableOpacity style={styles.customButton} onPress={handleImportPhoto}>
        <Text style={styles.customButtonText}>{t('importPhotoBtn')}</Text>
      </TouchableOpacity>
      {formData.idPhotoUri && <Image source={{ uri: formData.idPhotoUri }} style={styles.idPhotoPreview} />}

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.storeType}
          onValueChange={(itemValue: string | undefined) => handleInputChange('storeType', itemValue)}
        >
          <Picker.Item label={t('storeTypePlaceholder')} value={undefined} />
          {storeTypes.map((type, index) => (
            <Picker.Item key={index} label={t(type)} value={type} />
          ))}
        </Picker>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          onRegionChangeComplete={setMapRegion}
          onPress={handleMapPress}
        >
          {tempSelectedLocation && <Marker coordinate={tempSelectedLocation} />}
        </MapView>
      </View>

      {tempSelectedLocation && (
        <TouchableOpacity onPress={handleConfirmLocation} style={[styles.customButton, styles.confirmLocationButton]}>
          <Text style={styles.customButtonText}>{t('confirmLocationBtn')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.customButton, styles.nextButton, !isNextButtonEnabled && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isNextButtonEnabled}
      >
        <Text style={styles.customButtonText}>{t('nextButton')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (theme: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: theme.background },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.text },
  input: { borderWidth: 1, borderColor: theme.surface, borderRadius: 8, padding: 12, marginBottom: 15, backgroundColor: theme.surface, color: theme.text },
  passwordInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.surface, borderRadius: 8, marginBottom: 15, backgroundColor: theme.surface },
  passwordInput: { flex: 1, padding: 12, color: theme.text },
  passwordToggle: { padding: 12 },
  customButton: { backgroundColor: theme.green, padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  customButtonText: { color: theme.textNormal, fontWeight: 'bold' },
  idPhotoPreview: { width: 150, height: 100, alignSelf: 'center', marginBottom: 15 },
  pickerContainer: { borderWidth: 1, borderColor: theme.surface, borderRadius: 8, marginBottom: 15, backgroundColor: theme.surface },
  mapContainer: { height: 200, marginBottom: 15 },
  map: { flex: 1 },
  confirmLocationButton: { backgroundColor: theme.tint },
  nextButton: { marginTop: 20 },
  nextButtonDisabled: { opacity: 0.5 },
  infoTextDes: { color: theme.text, marginBottom: 15 }
});

export default RegistrationForm;
