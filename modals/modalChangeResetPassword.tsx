import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, useColorScheme } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { Colors } from '../constants/Colors';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { account, sendPasswordResetEmailWithFallback } from '../logic/appwriteConfig';

const ForgotPasswordModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [userId, setUserId] = useState('');
  const [secret, setSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const processUrl = (url: string) => {
      if (url && url.includes('reset-password')) {
        const parsed = Linking.parse(url);
        const uId = (parsed.queryParams?.userId as string) || '';
        const sec = (parsed.queryParams?.secret as string) || '';
        if (uId && sec) {
          setUserId(uId);
          setSecret(sec);
          setResetMode(true);
        }
      }
    };
    Linking.getInitialURL().then((url: string | null) => { if (url) processUrl(url); });
    const subscription = Linking.addEventListener('url', (e: { url: string }) => processUrl(e.url));
    return () => subscription.remove();
  }, []);

  const handleSend = async () => {
    if (email === '') return;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setInvalidEmail(true);
      return;
    }
    try {
      setIsLoading(true);
      const redirectUrl = Linking.createURL('reset-password');
      await sendPasswordResetEmailWithFallback(email, redirectUrl);
      setSent(true);
    } catch (error) {
      setInvalidEmail(true);
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (pwd: string): string[] => {
    const errors = [];
    if (pwd.length < 8) errors.push(t('passwordNote'));
    if (!/[A-Z]/.test(pwd)) errors.push(t('passwordNote'));
    if (!/[a-z]/.test(pwd)) errors.push(t('passwordNote'));
    if (!/[0-9]/.test(pwd)) errors.push(t('passwordNote'));
    if (!/[^A-Za-z0-9]/.test(pwd)) errors.push(t('passwordNote'));
    return errors;
  };

  const handleResetPassword = async () => {
    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrors([t('password/mismatch')]);
      return;
    }
    try {
      setIsLoading(true);
      await account.updateRecovery(userId, secret, newPassword, confirmPassword);
      setPasswordChanged(true);
    } catch (error) {
      setPasswordErrors([t('genericError')]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="chevron-back" size={24} color={colors.textNormal} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('resetPassword')}</Text>
          </View>

          {resetMode ? (
            <>
              <Text style={styles.label}>{t('profileScreen.newPassword')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="**********"
                  placeholderTextColor={colors.noir}
                  value={newPassword}
                  onChangeText={(text: string) => { setNewPassword(text); setPasswordErrors([]); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword((prev: boolean) => !prev)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.blou} />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="**********"
                  placeholderTextColor={colors.noir}
                  value={confirmPassword}
                  onChangeText={(text: string) => { setConfirmPassword(text); setPasswordErrors([]); }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm((prev: boolean) => !prev)} style={styles.eyeButton}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.blou} />
                </TouchableOpacity>
              </View>
              {passwordErrors.map((err: string, i: number) => (
                <Text key={i} style={styles.errorText}>{err}</Text>
              ))}
              <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                <Text style={styles.buttonText}>{t('general.confirm')}</Text>
              </TouchableOpacity>
            </>
          ) : !sent ? (
            <>
              <Text style={styles.label}>{t('email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={colors.noir}
                value={email}
                onChangeText={(text: string) => { setEmail(text); setInvalidEmail(false); }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {invalidEmail && (
                <Text style={styles.errorText}>{t('auth/invalid-email')}</Text>
              )}
              <TouchableOpacity style={styles.button} onPress={handleSend}>
                <Text style={styles.buttonText}>{t('send')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.confirmText}>{t('resetEmailSent')}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '85%',
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 24,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textNormal,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textNormal,
      marginBottom: 6,
      marginTop: 10,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.tint,
      borderRadius: 5,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.noir,
    },
    button: {
      backgroundColor: colors.tint,
      borderRadius: 5,
      paddingVertical: 12,
      alignSelf: 'center',
      marginTop: 15,
      width: 'auto',
      paddingHorizontal: 10,
    },
    buttonText: {
      color: colors.blond,
      fontSize: 16,
      fontWeight: '600',
      alignSelf: 'center',
    },
    confirmText: {
      color: colors.textNormal,
      fontSize: 16,
      textAlign: 'center',
      marginVertical: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 10,
    },
    errorText: {
      color: colors.errorText,
      fontSize: 14,
      fontWeight: 600,
      marginTop: 4,
      alignSelf: 'center',
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.tint,
      borderRadius: 5,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.noir,
    },
    eyeButton: {
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
  });
};

export default ForgotPasswordModal;
