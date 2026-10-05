import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { useAppTranslation } from '../translations/data/translationCentralization';

const ForgotPasswordModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const { t } = useAppTranslation();
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

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (event.url.includes('reset-password')) {
        setResetMode(true);
      }
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleSend = () => {
    if (email === '') return;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setInvalidEmail(true);
      return;
    }
    setSent(true);
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

  const handleResetPassword = () => {
    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrors([t('password/mismatch')]);
      return;
    }
    setPasswordChanged(true);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="chevron-back" size={24} color="#15616d" />
            </TouchableOpacity>
            <Text style={styles.title}>
              <Text style={styles.title}>{t('resetPassword')}</Text>
            </Text>
          </View>

          {resetMode ? (
            <>
              <Text style={styles.label}>{t('profileScreen.newPassword')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="**********"
                  placeholderTextColor="#313638"
                  value={newPassword}
                  onChangeText={(text: string) => { setNewPassword(text); setPasswordErrors([]); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword((prev: boolean) => !prev)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#001524" />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="**********"
                  placeholderTextColor="#313638"
                  value={confirmPassword}
                  onChangeText={(text: string) => { setConfirmPassword(text); setPasswordErrors([]); }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm((prev: boolean) => !prev)} style={styles.eyeButton}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={22} color="#001524" />
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
                placeholderTextColor="#313638"
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#15616d',
    alignSelf: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#001524',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#15616d',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
  },
  button: {
    backgroundColor: '#15616d',
    borderRadius: 5,
    paddingVertical: 12,
    alignSelf: 'center',
    marginTop: 15,
    width: '50%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'center',
  },
  confirmText: {
    color: '#000',
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
    color: '#ff7d00',
    fontSize: 14,
    fontWeight: 600,
    marginTop: 4,
    alignSelf: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#15616d',
    borderRadius: 5,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});

export default ForgotPasswordModal;
