import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, useColorScheme } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import MapView, { Marker, Region } from 'react-native-maps';
import { account, databases, config, ID, r2Config } from '../logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { blockArabicInput } from '../translations/data/blockerArab';
import { uploadToR2 } from '../logic/imagesLogic';
import { Colors } from '../constants/Colors';
import { COMMERCE_PERCENTAGES } from '../logic/gainSellerLogic';
import { DAIRAS_CONFIG, DEFAULT_ACTIVE_DAIRAS } from '../logic/calLivDaira';
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

  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [tempSelectedLocation, setTempSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'commission'>('form');
  const [selectedDairaId, setSelectedDairaId] = useState<string>('');

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
      <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
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
            color={termsAccepted ? colors.green : colors.noir}
          />
          <Text style={styles.passwordInput}>{t('termsAcceptance')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.customButton, styles.nextButton, (!termsAccepted || isLoading) && styles.nextButtonDisabled]}
          onPress={handleRegister}
          disabled={!termsAccepted || isLoading}
        >
          <Text style={styles.customButtonText}>
            {isLoading ? <ActivityIndicator color={colors.accent} /> : t('registerMySelf')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: 'center' }}>
      <Text style={styles.title}>{t('titleMgz')}</Text>
      <Text style={styles.sidetitle}>{t('aboutYou')}</Text>
      <Text style={styles.label}>{t('nameLabel')}</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text: string) => handleInputChange('name', blockArabicInput(text))}
        placeholder={t('placeholderFullName')}
        placeholderTextColor={colors.tabIconDefault}
      />
      <Text style={styles.label}>{t('dobLabel')}</Text>
      <TextInput
        style={styles.input}
        value={birthDate}
        onChangeText={handleBirthDateChange}
        placeholder={t('dobPlaceholder')}
        placeholderTextColor={colors.tabIconDefault}
        maxLength={10}
      />
      {birthDateError ? <Text style={styles.errorText}>{birthDateError}</Text> : null}

      <Text style={styles.label}>{t('phoneLabel')}</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={handlePhoneChange}
        placeholder={'0XXXXXXXXX'}
        placeholderTextColor={colors.tabIconDefault}
        maxLength={14}
      />
      {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
      <Text style={styles.sidetitle}>{t('sidetitleConnection')}</Text>
      <Text style={styles.label}>{t('emailLabel')}</Text>
      <TextInput
        style={styles.input} value={formData.email}
        onChangeText={(text: string) => handleInputChange('email', text)}
        placeholder={t('emailPlaceholder')}
        placeholderTextColor={colors.tabIconDefault}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>{t('passwordLabel')}</Text>
      <View style={styles.passwordInputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={formData.password}
          onChangeText={(text: string) => handleInputChange('password', text)}
          placeholder={'********'}
          placeholderTextColor={colors.tabIconDefault}
          secureTextEntry={!passwordVisible}
        />
        <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
          <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color={colors.textNormal} />
        </TouchableOpacity>
      </View>
      <Text style={styles.sidetitle}>{t('sidetitleActivity')}</Text>
      <Text style={styles.label}>{t('storeNameLabel')}</Text>
      <TextInput
        style={styles.input}
        value={formData.storeName}
        onChangeText={(text: string) => handleInputChange('storeName', blockArabicInput(text))}
        placeholder={t('storeNamePlaceholder')}
      />
      <Text style={styles.label}>{t('commercialRegLabel')}</Text>
      <TextInput
        style={styles.input}
        value={formData.commercialRegistrationNumber}
        onChangeText={(text: string) => handleInputChange('commercialRegistrationNumber', blockArabicInput(text))}
        placeholder="N° Registre du commerce"
        placeholderTextColor={colors.tabIconDefault}
      />
      <Text style={styles.label}>{t('storePhotoLabel')}</Text>
      <TouchableOpacity
        style={styles.customButton}
        onPress={handleImportPhoto}
      >
        <Text style={styles.customButtonText}>{t('importPhotoBtn')}</Text>
      </TouchableOpacity>
      {formData.idPhotoUri && <Image source={{ uri: formData.idPhotoUri }} style={styles.idPhotoPreview} />}

      <Text style={styles.label}>{t('storeTypes')}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.storeType}
          onValueChange={(itemValue: string | undefined) => handleInputChange('storeType', itemValue)}
        >
          <Picker.Item label={t('storeTypePlaceholder')} value="" color={colors.tabIconDefault} />
          {storeTypes.map((type, index) => (
            <Picker.Item key={index} label={t(type)} value={type} color={colors.noir} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Daïra :</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedDairaId}
          onValueChange={(dairaId: string) => {
            setSelectedDairaId(dairaId);
            const found = DAIRAS_CONFIG.find(d => d.id === dairaId);
            if (found && found.communes.length > 0) {
              handleInputChange('commune', found.communes[0].name);
            }
          }}
        >
          <Picker.Item label={t('storeTypePlaceholder')} value="" />
          {DAIRAS_CONFIG.filter(d => DEFAULT_ACTIVE_DAIRAS.includes(d.id)).map((daira) => (
            <Picker.Item key={daira.id} label={daira.name} value={daira.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>{t('communeLabel')}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.commune}
          onValueChange={(communeName: string) => handleInputChange('commune', communeName)}
          enabled={!!selectedDairaId}
        >
          <Picker.Item label={t('communePlaceholder')} value="" />
          {(DAIRAS_CONFIG.find(d => d.id === selectedDairaId)?.communes || []).map((com) => (
            <Picker.Item key={com.id} label={com.name} value={com.name} />
          ))}
        </Picker>
      </View>
      <Text style={styles.label}>{t('villageLabel')}</Text>
      <TextInput
        style={styles.input}
        value={formData.village}
        onChangeText={(text: string) => handleInputChange('village', blockArabicInput(text))}
        placeholder={t('villagePlaceholder')}
        placeholderTextColor={colors.tabIconDefault}
      />

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          onRegionChangeComplete={setMapRegion}
          onPress={handleMapPress}
        >
          {tempSelectedLocation && <Marker coordinate={tempSelectedLocation} />}
        </MapView>
      </View>

      <Text style={styles.sidetitle}>{t('workDaysLabel')}</Text>
      <View style={styles.workDaysContainer}>
        {weekDays.map((day) => {
          const isSelected = formData.workDays.includes(day);
          return (
            <TouchableOpacity key={day} style={[styles.dayButton, isSelected && styles.selectedDayButton]} onPress={() => toggleWorkDay(day)}>
              <Text style={isSelected ? styles.selectedDayButtonText : styles.dayButtonText}>{t(day)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sidetitle}>{t('workHoursLabel')}</Text>
      <Text style={styles.label}>{t('weekdaysText')}</Text>
      <View style={styles.timeInputContainer}>
        <TextInput style={styles.timeInput} value={formData.weekdayOpening.hour} onChangeText={(text: string) => handleTimeChange('weekdayOpening', 'hour', text)} placeholder={t('saaa')} maxLength={2} keyboardType="numeric" />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput style={styles.timeInput} value={formData.weekdayOpening.minute} onChangeText={(text: string) => handleTimeChange('weekdayOpening', 'minute', text)} placeholder={t('dqiqa')} maxLength={2} keyboardType="numeric" />
        <Text style={styles.timeRangeText}> - </Text>
        <TextInput style={styles.timeInput} value={formData.weekdayClosing.hour} onChangeText={(text: string) => handleTimeChange('weekdayClosing', 'hour', text)} placeholder={t('saaa')} maxLength={2} keyboardType="numeric" />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput style={styles.timeInput} value={formData.weekdayClosing.minute} onChangeText={(text: string) => handleTimeChange('weekdayClosing', 'minute', text)} placeholder={t('dqiqa')} maxLength={2} keyboardType="numeric" />
      </View>
      {weekdayTimeError ? <Text style={styles.errorText}>{weekdayTimeError}</Text> : null}

      <Text style={styles.label}>{t('weekendText')}</Text>
      <View style={styles.timeInputContainer}>
        <TextInput style={styles.timeInput} value={formData.weekendOpening.hour} onChangeText={(text: string) => handleTimeChange('weekendOpening', 'hour', text)} placeholder={t('saaa')} maxLength={2} keyboardType="numeric" />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput style={styles.timeInput} value={formData.weekendOpening.minute} onChangeText={(text: string) => handleTimeChange('weekendOpening', 'minute', text)} placeholder={t('dqiqa')} maxLength={2} keyboardType="numeric" />
        <Text style={styles.timeRangeText}> - </Text>
        <TextInput style={styles.timeInput} value={formData.weekendClosing.hour} onChangeText={(text: string) => handleTimeChange('weekendClosing', 'hour', text)} placeholder={t('saaa')} maxLength={2} keyboardType="numeric" />
        <Text style={styles.timeSeparator}>:</Text>
        <TextInput style={styles.timeInput} value={formData.weekendClosing.minute} onChangeText={(text: string) => handleTimeChange('weekendClosing', 'minute', text)} placeholder={t('dqiqa')} maxLength={2} keyboardType="numeric" />
      </View>
      {weekendTimeError ? <Text style={styles.errorText}>{weekendTimeError}</Text> : null}

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

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor:
        colors.background
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: colors.text
    },
    sidetitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.tint,
      marginTop: 15,
      marginBottom: 10,
      textDecorationLine: 'underline'
    },
    input: {
      borderWidth: 1,
      borderColor: colors.tint,
      borderRadius: 8,
      padding: 12,
      marginBottom: 15,
      backgroundColor: colors.surface,
      color: colors.noir
    },
    passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.tint,
      borderRadius: 8,
      marginBottom: 15,
      backgroundColor: colors.surface
    },
    passwordInput: {
      flex: 1,
      padding: 12,
      color: colors.noir
    },
    passwordToggle: {
      padding: 12
    },
    customButton: {
      backgroundColor: colors.green,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15,
      width: 'auto',
      paddingHorizontal: 15,
      alignSelf: 'center',
      justifyContent: 'center',
    },
    customButtonText: {
      color: colors.textNormal,
      fontWeight: 'bold'
    },
    idPhotoPreview: {
      width: 150,
      height: 100,
      alignSelf: 'center',
      marginBottom: 15
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.tint,
      borderRadius: 8,
      marginBottom: 15,
      backgroundColor: colors.surface
    },
    mapContainer: {
      height: 200,
      marginBottom: 15
    },
    map: {
      flex: 1
    },
    confirmLocationButton: {
      backgroundColor: colors.tint,
      width: 'auto',
      paddingHorizontal: 15,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextButton: {
      marginTop: 20
    },
    nextButtonDisabled: {
      opacity: 0.5
    },
    infoTextDes: {
      color: colors.greyDes,
      marginBottom: 15
    },
    errorText: {
      color: colors.errorText,
      fontSize: 12,
      marginTop: -5,
      marginBottom: 15
    },
    timeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 10,
      width: 52,
      paddingHorizontal: 5,
    },
    timeInput: {
      height: 48,
      borderWidth: 1.5,
      borderColor: colors.surface,
      borderRadius: 10,
      backgroundColor: colors.surface,
      color: colors.noir,
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
      width: 'auto',
      paddingHorizontal: 5,
    },
    timeSeparator: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.tint,
      marginHorizontal: 4,
    },
    timeRangeText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.noir,
      marginHorizontal: 12,
    },
    workDaysContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginVertical: 10,
      width: 'auto',

    },
    dayButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.tint,
      backgroundColor: colors.surface,
    },
    selectedDayButton: {
      backgroundColor: colors.tint,
      borderColor: colors.tint,
    },
    dayButtonText: {
      color: colors.noir,
      fontSize: 14,
      fontWeight: '600',
    },
    selectedDayButtonText: {
      color: colors.textNormal,
      fontSize: 14,
      fontWeight: 'bold',
    }
  });
};

export default RegistrationForm;
