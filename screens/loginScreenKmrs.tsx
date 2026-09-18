import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Linking, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { account } from './appwriteConfig';
import ForgotPasswordModal from '../modals-others/modalChangeResetPassword';
import { useRouter } from 'expo-router';
import { AppwriteException } from 'react-native-appwrite';
import { getAppLogo } from '../calculation-logic/imagesLogic';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { Colors } from '../appSellerColors';

const LoginScreen = () => {
  const { t, currentLang, setLanguage } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [userDisabled, setUserDisabled] = useState(false);

  const [showResetModal, setShowResetModal] = useState(false);

  const router = useRouter();

  const toggleLang = () => {
    const nextLang = currentLang === 'kab' ? 'fr' : 'kab';
    setLanguage(nextLang);
  };

  const handleLogin = async () => {
    if (email === '' || password === '') return;

    setInvalidEmail(false);
    setWrongPassword(false);
    setAccountNotFound(false);
    setUserDisabled(false);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setInvalidEmail(true);
      return;
    }

    try {
      await account.createEmailPasswordSession(email, password);
    } catch (error) {
      if ((error as AppwriteException).code === 401) {
        setWrongPassword(true);
      } else if ((error as AppwriteException).code === 404) {
        setAccountNotFound(true);
      } else if ((error as AppwriteException).code === 403) {
        setUserDisabled(true);
      } else {
        console.log("Erreur inattendue", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <Image
            source={getAppLogo(false).source}
            style={{ width: getAppLogo(false).width as number, height: getAppLogo(false).height as number, borderRadius: 12 }}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity onPress={toggleLang} style={styles.langButton}>
          <Ionicons name="globe-outline" size={18} color={Colors[theme].tint} />
          <Text style={styles.langButtonText}>
            {currentLang === 'kab' ? 'Taqvaylit' : 'Français'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('welcome')}</Text>
        {!accountNotFound && (
          <>
            <Text style={styles.label}>{t('email')}</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color={Colors[theme].icon} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={Colors[theme].greyDes}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {invalidEmail && (
              <Text style={styles.errorText}>{t('auth/invalid-email')}</Text>
            )}
            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors[theme].icon} style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder='**********'
                placeholderTextColor={Colors[theme].greyDes}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((prev: boolean) => !prev)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={Colors[theme].icon} />
              </TouchableOpacity>
            </View>
            {wrongPassword && (
              <>
                <Text style={styles.errorText}>{t('auth/wrong-password')}</Text>
                <TouchableOpacity
                  style={styles.footerLinkContaineroub}
                  onPress={() => setShowResetModal(true)}
                >
                  <Text style={styles.footerLink}>{t('forgotPassword')}</Text>
                </TouchableOpacity>
              </>
            )}

            {userDisabled && (
              <Text style={styles.errorText}>{t('auth/user-disabled')}</Text>
            )}
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>{t('login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerButton} onPress={() => router.push('/(main)/modals-others/registrationForm')}>
              <Text style={styles.registerButtonText}>{t('registerMySelf')}</Text>
            </TouchableOpacity>
          </>
        )}
        {accountNotFound && (
          <>
            <Text style={styles.notFoundText}>{t('auth/user-not-found')}</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(main)/modals-others/registrationForm')}>
              <Text style={styles.loginButtonText}>{t('registerMySelf')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <ForgotPasswordModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
      />
    </SafeAreaView>

  );
};

const getStyles = (theme: 'light' | 'dark') => StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors[theme].green,
    opacity: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors[theme].background,
  },
  topBar: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: Colors[theme].background,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: Colors[theme].accent,
  },
  langButtonText: {
    color: Colors[theme].tint,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: Colors[theme].green,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 26,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '650',
    alignSelf: 'center',
    color: Colors[theme].accent,
    marginBottom: 30,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '620',
    color: Colors[theme].textNormal,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors[theme].greyDes,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors[theme].background,
    borderWidth: 2,
    borderColor: Colors[theme].tint,
    borderRadius: 999,
    paddingHorizontal: 20,
  },
  inputIcon: {
    flexShrink: 0,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors[theme].textNormal,
  },
  eyeButton: {
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  loginButton: {
    backgroundColor: Colors[theme].tint,
    borderRadius: 16,
    paddingVertical: 16,
    alignSelf: 'stretch',
    marginTop: 34,
    alignItems: 'center',
    width: '30%',
  },
  loginButtonText: {
    color: Colors[theme].accent,
    fontSize: 16,
    fontWeight: '700',
  },
  footerLinkContaineroub: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: Colors[theme].green,
    maxWidth: '60%',
    marginTop: 20,
    marginBottom: 10,
  },
  footerLink: {
    fontSize: 16,
    color: Colors[theme].textNormal,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  notFoundText: {
    color: Colors[theme].textNormal,
    fontSize: 18,
    fontWeight: '600',
    alignSelf: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  errorText: {
    color: '#FF9E80',
    fontSize: 15,
    fontWeight: '600',
    alignSelf: 'center',
    marginTop: 12,
  },
  registerButton: {
    borderRadius: 5,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 10,
    width: '30%',
    borderWidth: 2,
  },
  registerButtonText: {
    color: Colors[theme].accent,
    fontSize: 16,
    fontWeight: '700',
    alignSelf: 'center',
  },
});

export default LoginScreen;
