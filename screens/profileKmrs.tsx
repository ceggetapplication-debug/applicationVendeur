import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Platform, Linking, TextInput, Modal, Pressable, Switch } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { OneSignal } from 'react-native-onesignal';
import TeamManagementScreen from '../modals/invitationGestionnaire';
import PremiumKmrsOffersModal from '../modals/modalPremiumsKMRS';
import { sizes, buildStoreProfilePhoto, buildStorePhoto, uploadToR2 } from '@/app/(main)/calculation-logic/imagesLogic';
import { account, databases, config, Query, ID } from '@/app/(main)/calculation-logic/appwriteConfig';
import { useAppTranslation } from '@/app/(main)/translations/data/translationCentralization';
import { DeepLinkBackend } from '../backends/invitDeepLnkMail';

const s = sizes();

interface UserProfile {
  storeName: string;
  storeAdress: string;
  photoURL?: string;
  coverURL?: string;
  email: string;
  phoneNumber: string;
  storeId?: string;
}

function ProfileSELLScreen() {
  const { t, setLanguage, currentLang: language } = useAppTranslation();
  const params = useLocalSearchParams();
  const [currentView, setCurrentView] = useState<'menu' | 'accountDetails' | 'languages' | 'notifications' | 'gestion'>('menu');
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(false);
  const [receiveNewOrderNotifications, setReceiveNewOrderNotifications] = useState(true);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [deleteAccountModalVisible, setDeleteAccountModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');
  const [profileDocId, setProfileDocId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [arePushNotificationsEnabled, setArePushNotificationsEnabled] = useState(true);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [showEmailCodeInput, setShowEmailCodeInput] = useState(false);
  const [avantagesModalVisible, setAvantagesModalVisible] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumPackName, setPremiumPackName] = useState('');
  const [premiumEndDate, setPremiumEndDate] = useState('');
  const [isPremiumOffersVisible, setIsPremiumOffersVisible] = useState(false);
  const [showPasswordCodeInput, setShowPasswordCodeInput] = useState(false);
  const [userData, setUserData] = useState<UserProfile>({
    storeName: '',
    storeAdress: '',
    photoURL: '',
    coverURL: '',
    email: '',
    phoneNumber: '',
  });
  const [globalConfig, setGlobalConfig] = useState({
    appDomain: '',
    supportEmail: '',
    supportPhone: ''
  });

  useEffect(() => {
    Notifications.setNotificationChannelAsync('orders_channel', {
      name: 'Nouvelles commandes',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }, []);

  const fetchGlobalSettings = async () => {
    try {
      const settings = await databases.listDocuments(
        config.databaseId,
        'settings',
        [Query.limit(1)]
      );
      if (settings.documents.length > 0) {
        const doc = settings.documents[0];
        setGlobalConfig({
          appDomain: doc.appDomain || '',
          supportEmail: doc.supportEmail || '',
          supportPhone: doc.supportPhone || ''
        });
      }
    } catch (error) {
      console.error("Erreur de récupération des paramètres dynamiques");
    }
  };

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await databases.updateDocument(
        config.databaseId,
        config.usersCollectionId,
        profileDocId,
        { language: languageCode }
      );
      setLanguage(languageCode as 'fr' | 'kab');
      Alert.alert(t('profileScreen.languageSelected'), t('profileScreen.languageSelected'));
      setCurrentView('menu');
    } catch (error) {
      Alert.alert(t('general.error'), t('genericError'));
    }
  };

  const fetchUserData = async () => {
    try {
      const user = await account.get();
      const response = await databases.listDocuments(
        config.databaseId,
        config.usersCollectionId,
        [Query.equal('userId', user.$id)]
      );
      if (response.documents.length > 0) {
        const doc = response.documents[0];
        setProfileDocId(doc.$id);
        setIsPremium(doc.isPremium || false);
        setPremiumPackName(doc.premiumPack || '');
        setPremiumEndDate(doc.premiumEnd || '');
        if (doc.language) {
          setLanguage(doc.language as 'fr' | 'kab');
        }
        const profilData: UserProfile & { id: string; userId: string } = {
          id: doc.$id,
          userId: user.$id,
          storeName: doc.storeName || '',
          storeAdress: doc.storeAdress || '',
          email: user.email,
          phoneNumber: doc.phoneNumber || '',
          storeId: doc.storeId,
        };
        const storePhoto = buildStorePhoto(doc.storeId);
        profilData.photoURL = buildStoreProfilePhoto(doc.storeId).miniature;
        profilData.coverURL = storePhoto.cover;

        setUserData(profilData);
      }
    } catch (error) {
      console.error("Erreur Appwrite:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    const handleDeepLink = async () => {
      const { inviteId } = params;
      if (inviteId) {
        setIsLoading(true);
        try {
          const result = await DeepLinkBackend.processInvite({
            inviteId: inviteId as string
          }) as { success: boolean; permissions?: { mystore: boolean; mynews: boolean; commands: boolean; recette: boolean } };
          if (result.success && result.permissions) {
            const p = result.permissions;
            if (p.mystore) router.push('/appSeller/screens/myStore');
            else if (p.mynews) router.push('/appSeller/screens/myNews');
            else if (p.commands) router.push('/appSeller/screens/commands');
            else if (p.recette) router.push('/appSeller/screens/recette');
          }
        } catch (e) {
          Alert.alert(t('general.error'), t('auth/invalid-link') || "Lien invalide");
        } finally {
          setIsLoading(false);
        }
      }
    };
    handleDeepLink();
  }, [params]);

  const toggleNewOrderNotifications = async (value: boolean) => {
    setReceiveNewOrderNotifications(value);
    OneSignal.User.addTag("receive_orders", value ? "true" : "false");
  };

  const togglePushNotifications = async (value: boolean) => {
    setArePushNotificationsEnabled(value);
    if (value) {
      OneSignal.Notifications.requestPermission(true);
    }
    OneSignal.User.addTag("favorite_notifs", value ? "true" : "false");
  };

  const handleEditEmail = () => {
    setNewEmailInput('');
    setVerificationCodeInput('');
    setShowEmailCodeInput(false);
    setEmailModalVisible(true);
  };

  const handleSaveNewEmail = async () => {
    if (!newEmailInput) {
      Alert.alert(t('general.error'), t('profileScreen.enterNewEmailError'));
      return;
    }
    try {
      setIsLoading(true);
      await account.createVerification(`${globalConfig.appDomain}/verify-email`);
      Alert.alert(t('general.success'), t('profileScreen.emailLinkSentMessage'));
      setEmailModalVisible(false);
    } catch (error) {
      Alert.alert(t('general.error'), t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setVerificationCodeInput('');
    setShowPasswordCodeInput(false);
    setPasswordModalVisible(true);
  };

  const handleSaveNewPassword = async () => {
    if (!currentPasswordInput || !newPasswordInput) {
      Alert.alert(t('general.error'), t('profileScreen.passwordFieldsRequired'));
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[*@#!?&%])(?=.{8,})/;
    if (!passwordRegex.test(newPasswordInput)) {
      Alert.alert(t('profileScreen.weakPassword'), t('profileScreen.weakPasswordHint'));
      return;
    }
    try {
      setIsLoading(true);
      await account.createRecovery(userData.email, `${globalConfig.appDomain}/reset-password`);
      Alert.alert(
        t('general.success'),
        t('profileScreen.passwordLinkSent')
      );
      setPasswordModalVisible(false);
    } catch (error) {
      console.error("Erreur Recovery:", error);
      Alert.alert(t('general.error'), t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhoneNumber = () => {
    setNewPhoneInput('');
    setCurrentPasswordInput('');
    setPhoneModalVisible(true);
  };

  const handleSaveNewPhoneNumber = async () => {
    setPasswordError('');
    if (!newPhoneInput) {
      setPasswordError(t('profileScreen.enterNewPhoneNumberError'));
      return;
    }
    if (!currentPasswordInput) {
      setPasswordError(t('profileScreen.currentPasswordPlaceholder'));
      return;
    }
    try {
      setIsLoading(true);
      const checkPhone = await databases.listDocuments(
        config.databaseId,
        config.usersCollectionId,
        [Query.equal('phoneNumber', newPhoneInput)]
      );
      if (checkPhone.documents.length > 0 && checkPhone.documents[0].$id !== profileDocId) {
        setIsLoading(false);
        setPasswordError(t('phoneAlreadyInUse'));
        return;
      }
      try {
        const sessionVerification = await account.createEmailPasswordSession(userData.email, currentPasswordInput);
        await account.deleteSession(sessionVerification.$id);
      } catch (error) {
        setIsLoading(false);
        const authError = error as { code: number; message: string; type: string };
        if (authError.code === 401) {
          setPasswordError(t('auth/wrong-password'));
        } else if (authError.code === 429) {
          setPasswordError(t('tooManyAttempts'));
        } else {
          setPasswordError(t('genericError'));
        }
        return;
      }
      await databases.updateDocument(config.databaseId, config.usersCollectionId, profileDocId, {
        phoneNumber: newPhoneInput
      });
      setUserData({ ...userData, phoneNumber: newPhoneInput });
      setPhoneModalVisible(false);
      Alert.alert(t('general.success'), t('profileScreen.phoneNumberUpdatedSuccess'));
    } catch (error) {
      Alert.alert(t('general.error'), t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBackFromContactModal = () => setContactModalVisible(false);
  const handleGoBackFromDeleteAccountModal = () => {
    setDeleteAccountModalVisible(false);
    setDeleteReason('');
    handleGoBackFromSubMenu();
  };

  const handleContactByEmail = () => {
    setContactModalVisible(false);
    const subject = encodeURIComponent(t('profileScreen.contactUsTitle'));
    const mailtoUrl = `mailto:${globalConfig.supportEmail}?subject=${subject}`;
    Linking.openURL(mailtoUrl).catch(() =>
      Alert.alert(t('general.error'), t('profileScreen.cannotOpenEmail'))
    );
  };

  const handleContactByPhone = () => {
    setContactModalVisible(false);
    Linking.openURL(`tel:${globalConfig.supportPhone}`).catch(() =>
      Alert.alert(t('general.error'), t('profileScreen.cannotOpenPhone'))
    );
  }

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      router.replace('/(auth)/sign-in');
    } catch (error) {
      router.replace('/(auth)/sign-in');
    }
  };

  const handleLogoutAlert = () => {
    Alert.alert(
      t('profileScreen.logout'),
      t('profileScreen.logoutAlertMessage'),
      [
        { text: t('general.cancel'), style: 'cancel' },
        { text: t('profileScreen.logout'), onPress: handleLogout, style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  const handlePressEditCoverPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [sizes().STORE_W, sizes().STORE_H],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0 && userData.storeId) {
      try {
        setIsLoading(true);
        const fileToUpload = {
          uri: result.assets[0].uri,
          name: 'cover.jpg',
          type: 'image/jpeg',
        };
        await uploadToR2(`stores/${userData.storeId}.jpg`, fileToUpload);
        setUserData({ ...userData, coverURL: buildStorePhoto(userData.storeId).cover });
        Alert.alert(t('general.success'), t('profileScreen.photoUpdatedSuccess'));
      } catch (error) {
        Alert.alert(t('general.error'), "Erreur upload cover");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      await databases.deleteDocument(config.databaseId, config.usersCollectionId, profileDocId);
      await account.deleteSession('current');
      router.replace('/(auth)/sign-in');
    } catch (error) {
      Alert.alert(t('general.error'), t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressEditPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('general.requiredPermission'), t('general.requiredPermission'));
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      try {
        setIsLoading(true);
        const fileToUpload = {
          uri: selectedAsset.uri,
          name: selectedAsset.fileName || 'profile.jpg',
          type: selectedAsset.mimeType || 'image/jpeg',
        };
        await uploadToR2(`profiles/${profileDocId}.jpg`, fileToUpload);
        const updatedPhoto = buildStoreProfilePhoto(profileDocId).miniature;
        setUserData({ ...userData, photoURL: updatedPhoto });
        Alert.alert(t('general.success'), t('profileScreen.photoUpdatedSuccess') || "Photo mise à jour !");
      } catch (error) {
        Alert.alert(t('general.error'), "Erreur lors de l'upload");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePressMenuItem = (itemKey: string) => {
    switch (itemKey) {
      case t('profileScreen.account'): setCurrentView('accountDetails'); break;
      case t('profileScreen.languages'): setCurrentView('languages'); break;
      case t('profileScreen.notifications'): setIsNotificationsExpanded(!isNotificationsExpanded); break;
      case t('profileScreen.avontajeu') || 'Avantages': setAvantagesModalVisible(true); break;
      case t('profileScreen.gestion') || 'Gestion': setCurrentView('gestion'); break;
      case t('profileScreen.contactUs'): setContactModalVisible(true); break;
      case t('profileScreen.logout'): handleLogoutAlert(); break;
      case t('profileScreen.deleteAccount'): setDeleteAccountModalVisible(true); break;
      default: break;
    }
  };

  const handleGoBackFromSubMenu = () => {
    setCurrentView('menu');
    setIsNotificationsExpanded(false);
    setEmailModalVisible(false);
    setPasswordModalVisible(false);
    setPhoneModalVisible(false);
    setContactModalVisible(false);
    setDeleteAccountModalVisible(false);
    setAvantagesModalVisible(false);
    setIsPremiumOffersVisible(false);
  };

  const renderMenuItem = (iconName: string, label: string) => (
    <TouchableOpacity key={label} style={styles.menuItem} onPress={() => handlePressMenuItem(label)}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={iconName as any} size={24} color="#001524" />
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {currentView === 'gestion' && (
        <TeamManagementScreen onBack={() => setCurrentView('menu')} />
      )}
      {currentView === 'menu' && (
        <>
          <View style={styles.coverContainer}>
            {userData.coverURL && <Image source={{ uri: userData.coverURL }} style={styles.coverImage} />}
            <TouchableOpacity style={styles.editCoverIcon} onPress={handlePressEditCoverPhoto}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileHeader}>
            <View style={styles.photoContainer}>
              <Image
                style={styles.profilePhoto}
                source={userData.photoURL ? { uri: userData.photoURL } : null}
              />
              <TouchableOpacity style={styles.editPhotoIcon} onPress={handlePressEditPhoto}>
                <Ionicons name="camera-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.storeNameText}>{userData.storeName}</Text>
              <Text style={styles.zoneText}>{userData.storeAdress}</Text>
            </View>
          </View>
          <View style={styles.menuContainer}>
            <ScrollView>
              {renderMenuItem('person-outline', t('profileScreen.account'))}
              {renderMenuItem('language-outline', t('profileScreen.languages'))}
              {renderMenuItem('notifications-outline', t('profileScreen.notifications'))}
              {isNotificationsExpanded && (
                <View style={styles.notificationsDetails}>
                  <Text style={styles.notificationsText}>{t('profileScreen.notificationsHint')}</Text>
                  <View style={styles.notificationOptionRow}>
                    <Text style={styles.notificationOptionText}>{t('newCommandNotif')}</Text>
                    <Switch value={receiveNewOrderNotifications} onValueChange={toggleNewOrderNotifications}
                      trackColor={{ false: '#001524', true: '#ff7d00' }}
                      thumbColor={receiveNewOrderNotifications ? '#ffecd1' : '#15616d'} />
                  </View>
                  <View style={styles.notificationOptionRow}>
                    <Text style={styles.notificationOptionText}>{t('profileScreen.favoriteNotif') || 'Notifications Favoris'}</Text>
                    <Switch value={arePushNotificationsEnabled} onValueChange={togglePushNotifications}
                      trackColor={{ false: '#001524', true: '#ff7d00' }}
                      thumbColor={arePushNotificationsEnabled ? '#ffecd1' : '#15616d'} />
                  </View>
                </View>
              )}
              {renderMenuItem('gift-outline', t('profileScreen.avontajeu') || 'Avantages')}
              {renderMenuItem('people-outline', t('profileScreen.gestion') || 'Gestion')}
              {renderMenuItem('call-outline', t('profileScreen.contactUs'))}
              {renderMenuItem('log-out-outline', t('profileScreen.logout'))}
              {renderMenuItem('trash-outline', t('profileScreen.deleteAccount'))}
            </ScrollView>
          </View>
        </>
      )}
      {currentView === 'accountDetails' && (
        <View style={styles.accountDetailsContainer}>
          <TouchableOpacity onPress={handleGoBackFromSubMenu} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#001524" />
          </TouchableOpacity>
          <ScrollView>
            <Text style={styles.accountDetailTitle}>{t('profileScreen.accountDetailsTitle')}</Text>
            <View style={styles.accountDetailItem}>
              <Text style={styles.accountDetailLabel}>{t('profileScreen.storeName')}</Text>
              <View style={styles.accountDetailValueRow}>
                <Text style={styles.accountDetailValue}>{userData.storeName}</Text>
              </View>
            </View>
            <View style={styles.accountDetailItem}>
              <Text style={styles.accountDetailLabel}>{t('profileScreen.email')}</Text>
              <View style={styles.accountDetailValueRow}>
                <Text style={styles.accountDetailValue}>{userData.email}</Text>
                <TouchableOpacity onPress={handleEditEmail}>
                  <Ionicons name="create-outline" size={20} color="#15616d" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.accountDetailItem}>
              <Text style={styles.accountDetailLabel}>{t('profileScreen.password')}</Text>
              <View style={styles.accountDetailValueRow}>
                <Text style={styles.accountDetailValue}>********</Text>
                <TouchableOpacity onPress={handleChangePassword}>
                  <Ionicons name="create-outline" size={20} color="#0b0f10ff" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.accountDetailItem}>
              <Text style={styles.accountDetailLabel}>{t('profileScreen.phoneNumber')}</Text>
              <View style={styles.accountDetailValueRow}>
                <Text style={styles.accountDetailValue}>{userData.phoneNumber}</Text>
                <TouchableOpacity onPress={handleChangePhoneNumber}>
                  <Ionicons name="create-outline" size={20} color="#15616d" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.accountDetailItem}>
              <Text style={styles.accountDetailLabel}>{t('profileScreen.storeAdress')}</Text>
              <View style={styles.accountDetailValueRow}>
                <Text style={styles.accountDetailValue}>{userData.storeAdress}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
      {currentView === 'languages' && (
        <View style={styles.languagesContainer}>
          <TouchableOpacity onPress={handleGoBackFromSubMenu} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#001524" />
          </TouchableOpacity>
          <ScrollView>
            <Text style={styles.languageTitle}>{t('profileScreen.languagesTitle') || 'Languages'}</Text>
            <TouchableOpacity style={styles.languageItem} onPress={() => handleLanguageSelect('fr')}>
              <Text style={styles.languageText}>Français (fr)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.languageItem} onPress={() => handleLanguageSelect('kab')}>
              <Text style={styles.languageText}>Taqvaylit (kab)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <Modal transparent visible={emailModalVisible} onRequestClose={() => setEmailModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEmailModalVisible(false)} style={styles.backButtonModal}>
                <Ionicons name="chevron-back" size={24} color="#001524" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('profileScreen.changeEmailTitle')}</Text>
              <View style={{ width: 24 }} />
            </View>
            <Text style={styles.modalLabel}>{t('profileScreen.currentEmail')}</Text>
            <Text style={styles.modalValue}>{userData.email}</Text>
            <Text style={styles.modalLabel}>{t('profileScreen.newEmail')}</Text>
            <TextInput style={styles.modalInput} placeholder={t('profileScreen.newEmailPlaceholder')}
              keyboardType="email-address" value={newEmailInput} onChangeText={setNewEmailInput} autoCapitalize="none" />
            <Pressable style={[styles.modalButton, styles.modalButtonSave]} onPress={handleSaveNewEmail}>
              <Text style={styles.textStyle}>{t('general.save')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={passwordModalVisible} onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={styles.backButtonModal}>
                <Ionicons name="chevron-back" size={24} color="#001524" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('profileScreen.changePasswordTitle')}</Text>
              <View style={{ width: 24 }} />
            </View>
            <Text style={styles.modalLabel}>{t('profileScreen.currentPassword')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('profileScreen.currentPasswordPlaceholder')}
              secureTextEntry={true}
              value={currentPasswordInput}
              onChangeText={setCurrentPasswordInput}
            />
            <Text style={styles.modalLabel}>{t('profileScreen.newPassword')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('profileScreen.newPasswordPlaceholder')}
              secureTextEntry={true}
              value={newPasswordInput}
              onChangeText={setNewPasswordInput}
            />
            <Text style={styles.passwordHintText}>{t('profileScreen.weakPasswordHint')}</Text>
            <Pressable style={[styles.modalButton, styles.modalButtonSave]} onPress={handleSaveNewPassword}>
              <Text style={styles.textStyle}>{t('profileScreen.changePasswordTitle')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={phoneModalVisible} onRequestClose={() => { setPhoneModalVisible(false); }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setPhoneModalVisible(false); }} style={styles.backButtonModal}>
                <Ionicons name="chevron-back" size={24} color="#001524" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('profileScreen.changePhoneNumberTitle')}</Text>
              <View style={{ width: 24 }} />
            </View>
            <Text style={styles.modalLabel}>{t('profileScreen.currentPhoneNumber')}</Text>
            <Text style={styles.modalValue}>{userData.phoneNumber}</Text>
            <Text style={styles.modalLabel}>{t('profileScreen.newPhoneNumber')}</Text>
            <TextInput style={styles.modalInput} placeholder="0XXXXXXXXX"
              keyboardType="phone-pad" value={newPhoneInput} onChangeText={setNewPhoneInput} />
            <Text style={styles.modalLabel}>{t('profileScreen.currentPasswordPlaceholder') || "Mot de passe actuel"}</Text>
            <TextInput style={styles.modalInput} placeholder="********"
              secureTextEntry={true} value={currentPasswordInput} onChangeText={setCurrentPasswordInput} />
            <Pressable style={[styles.modalButton, styles.modalButtonSave]} onPress={handleSaveNewPhoneNumber}>
              <Text style={styles.textStyle}>{t('general.save')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={contactModalVisible} onRequestClose={() => setContactModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleGoBackFromContactModal} style={styles.backButtonModal}>
                <Ionicons name="chevron-back" size={24} color="#001524" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('profileScreen.contactUsTitle')}</Text>
              <View style={{ width: 24 }} />
            </View>
            <TouchableOpacity style={styles.contactOption} onPress={handleContactByEmail}>
              <Ionicons name="mail-outline" size={24} color="#001524" style={{ marginRight: 10 }} />
              <Text style={styles.contactOptionText}>{t('profileScreen.contactByEmail')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactOption} onPress={handleContactByPhone}>
              <Ionicons name="call-outline" size={24} color="#001524" style={{ marginRight: 10 }} />
              <Text style={styles.contactOptionText}>{t('profileScreen.contactByPhone')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={deleteAccountModalVisible} onRequestClose={() => { setDeleteAccountModalVisible(false); setDeleteReason(''); }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleGoBackFromDeleteAccountModal} style={styles.backButtonModal}>
                <Ionicons name="chevron-back" size={24} color="#001524" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('profileScreen.deleteAccountTitle')}</Text>
              <View style={{ width: 24 }} />
            </View>
            <Text style={[styles.modalMessage, { color: '#ff7d00', fontWeight: 'bold' }]}>
              {t('profileScreen.deleteAccountMessage')}
            </Text>
            <Text style={styles.modalLabel}>{t('profileScreen.deleteReasonLabel')}</Text>
            <TextInput
              style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
              multiline maxLength={150} value={deleteReason} onChangeText={setDeleteReason}
              placeholder={t('profileScreen.deleteReasonPlaceholder')} />
            <Text style={{ alignSelf: 'flex-end', fontSize: 12, color: '#555', marginTop: 2, marginBottom: 10 }}>
              {deleteReason.length}/150
            </Text>
            <Pressable
              style={[styles.modalButton, styles.modalButtonSave, { backgroundColor: '#15616d', marginTop: 20 }, !deleteReason.trim() && styles.disabledButtonModal]}
              onPress={handleDeleteAccount} disabled={!deleteReason.trim()}>
              <Text style={[styles.textStyle, !deleteReason.trim() && styles.disabledButtonText]}>
                {t('profileScreen.cancelContract')}
              </Text>
            </Pressable>
            <Pressable style={[styles.modalButton, { backgroundColor: '#ff7d00' }]} onPress={handleGoBackFromDeleteAccountModal}>
              <Text style={styles.textStyle}>{t('general.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={avantagesModalVisible}
        onRequestClose={() => setAvantagesModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAvantagesModalVisible(false)} style={styles.backButtonModal}>
                <Ionicons name="chevron-back" size={24} color="#001524" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('profileScreen.avontajeu')}</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.accountDetailItem}>
              {isPremium ? (
                <>
                  <Text style={styles.accountDetailValue}>
                    {t('youHavePackActive').replace('{{pack}}', premiumPackName)}
                  </Text>
                  <Text style={styles.modalMessage}>
                    {t('endDateIs').replace('{{date}}', premiumEndDate)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.accountDetailValue}>
                    {t('noActiveOffer')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave]}
                    activeOpacity={0.7}
                    onPress={() => setIsPremiumOffersVisible(true)}
                  >
                    <Text style={styles.textStyle}>{t('activatePremiumBtn')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
      <PremiumKmrsOffersModal
        isVisible={isPremiumOffersVisible}
        onClose={() => setIsPremiumOffersVisible(false)}
        onUpgradePress={() => { }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  photoContainer: {
    position: 'relative',
    marginRight: 10,
  },
  profilePhoto: {
    width: s.PROFIL_PIC,
    height: s.PROFIL_PIC,
    borderRadius: 8,
    borderColor: '#ff7d00',
    borderWidth: 1.5,
    backgroundColor: '#ccc',
  },
  coverContainer: {
    width: s.STORE_W,
    height: s.STORE_H,
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
    borderRadius: 15,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editPhotoIcon: {
    position: 'absolute',
    color: '#ffecd1',
    top: 0,
    right: 0,
    borderRadius: 10,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    justifyContent: 'center',
  },
  storeNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffecd1',
  },
  zoneText: {
    fontSize: 12,
    color: '#ff7d00',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderColor: '#ff7d00',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 20,
    elevation: 0,
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ffecd1',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  menuItemText: {
    fontSize: 14,
    marginLeft: 10,
  },
  accountDetailsContainer: {
    flex: 0.86,
    backgroundColor: '#fff',
    borderColor: '#ff7d00',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 100,
    elevation: 0,
    shadowColor: '#001524',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  accountDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    marginLeft: 30,
    color: '#001524',
  },
  accountDetailItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ffecd1',
    paddingBottom: 10,
  },
  accountDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#001524',
    marginBottom: 5,
  },
  accountDetailValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountDetailValue: {
    fontSize: 16,
    color: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#001524',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    flex: 1,
    marginLeft: 20,
  },
  backButtonModal: {
    padding: 0,
    alignContent: 'flex-start',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#001524',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  modalValue: {
    fontSize: 16,
    color: '#000',
    alignSelf: 'center',
    marginBottom: 10,
    marginLeft: 0,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#ff7d00',
    borderRadius: 5,
    width: 300,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  passwordHintText: {
    fontSize: 11,
    color: '#001524',
    marginBottom: 15,
    textAlign: 'left',
    width: 320,
  },
  modalMessage: {
    fontSize: 15,
    color: '#ff7d00',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 10,
    width: '100%',
  },
  modalButtonSave: {
    backgroundColor: '#ff7d00',
  },
  textStyle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  languagesContainer: {
    flex: 0.46,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 200,
    elevation: 0,
    shadowColor: '#001524',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    color: '#001524',
    marginLeft: 30,
  },
  languageItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ffecd1',
  },
  languageText: {
    fontSize: 15,
    color: '#000',
  },
  notificationsDetails: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ffecd1',
    marginBottom: 5,
    marginLeft: 20,
    marginRight: 20,
  },
  notificationsText: {
    fontSize: 14,
    color: '#001524',
    marginBottom: 10,
  },
  notificationOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  notificationOptionText: {
    fontSize: 15,
    color: '#000',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ff7d00',
    width: '100%',
    marginBottom: 10,
  },
  contactOptionText: {
    fontSize: 14,
    color: '#000',
  },
  disabledButtonModal: {
    opacity: 0.3,
  },
  disabledButtonText: {
    color: '#ffecd1',
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
});

export default ProfileSELLScreen;