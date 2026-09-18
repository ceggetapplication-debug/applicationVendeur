import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendInviteEmail } from '../backends/invitDeepLnkMail';
import { TeamBackend } from '../backends/invitGestionnaireBackNd';
import { PremiumCommercant } from '@/app/(main)/calculation-logic/premiums';
import { AppwriteException } from 'react-native-appwrite';
import { validateEmail } from '../logic/centralAuthVerf';
import { account, databases, config, Query } from '@/app/(main)/calculation-logic/appwriteConfig';
import { useAppTranslation } from '@/translations/data/translationCentralization';

export default function TeamManagementScreen({ onBack }: { onBack: () => void }) {
  const { t } = useAppTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [storeId, setStoreId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [activePack, setActivePack] = useState<PremiumCommercant | null>(null);
  const [isPremiumActive, setIsPremiumActive] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    mystore: true,
    mynews: true,
    commands: true,
  });
  const [emails, setEmails] = useState<Record<string, string>>({
    mystore: '',
    mynews: '',
    commands: '',
    recette: '',
  });

  useEffect(() => {
    const fetchPackStatus = async () => {
      try {
        const user = await account.get();
        setUserId(user.$id);
        const response = await databases.listDocuments(
          config.databaseId,
          config.usersCollectionId,
          [Query.equal('userId', user.$id)]
        );
        if (response.documents.length > 0) {
          const doc = response.documents[0];
          setIsPremiumActive(doc.isPremium || false);
          setActivePack(doc.premiumPack as PremiumCommercant || null);
          setStoreId(doc.storeId || '');
        }
      } catch (error) {
        console.error("Erreur pack:", error);
      }
    };
    fetchPackStatus();
  }, []);

  const handleSendIndividualInvite = async (screenKey: keyof typeof emails) => {
    const targetEmail = emails[screenKey].trim();
    if (!targetEmail || !validateEmail(targetEmail)) return;

    setIsLoading(true);
    let invitationData: { success: boolean; inviteId: string; token: string };
    try {
      invitationData = await TeamBackend.sendInvite({
        email: targetEmail,
        inviterId: userId,
        storeId: storeId,
        permissions: {
          mystore: screenKey === 'mystore',
          mynews: screenKey === 'mynews',
          commands: screenKey === 'commands',
          recette: screenKey === 'recette'
        }
      });

      await sendInviteEmail({
        email: targetEmail,
        redirectUrl: `cegget://invite?inviteId=${invitationData.inviteId}`, isPremium: true
      });

      setEmails((prev: Record<string, string>) => ({ ...prev, [screenKey]: '' }));
      Alert.alert(t('general.success'), t('emailEnvoyeSucc'));
    } catch (error) {
      Alert.alert(t('general.error'), t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !email.trim() || !Object.values(permissions).some(v => v);
  const togglePermission = (key: string) => {
    if (!isPremiumActive) return;
    setPermissions((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendInvite = async () => {
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError(t('auth/invalid-email'));
      return;
    }
    let invitationData: { success: boolean; inviteId: string; token: string };
    try {
      setIsLoading(true);
      invitationData = await TeamBackend.sendInvite({
        email: email,
        inviterId: userId,
        storeId: storeId,
        permissions: {
          mystore: !!permissions.mystore,
          mynews: !!permissions.mynews,
          commands: !!permissions.commands,
          recette: false
        }
      });

      await sendInviteEmail({
        email: email,
        redirectUrl: `cegget://invite?inviteId=${invitationData.inviteId}`, isPremium: false
      });

      setEmail('');
      setEmailError('');
      Alert.alert(t('general.success'), t('emailEnvoyeSucc'));
    } catch (error) {
      const err = error as AppwriteException;
      console.error("Erreur Appwrite:", err.message);
      Alert.alert(t('general.error'), t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderCheckbox = (title: string, key: keyof typeof permissions) => {
    const isChecked = isPremiumActive ? permissions[key] : true;
    return (
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => togglePermission(key as string)}
        activeOpacity={isPremiumActive ? 0.7 : 1}
        disabled={!isPremiumActive}
      >
        <Text style={styles.checkboxLabel}>{title}</Text>
        <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
          {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>          <Ionicons name="chevron-back" size={24} color="#001524" />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>{t('profileScreen.gestion')}</Text>
      </View>
      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {(activePack === PremiumCommercant.Gestionnaire3 || activePack === PremiumCommercant.Gestionnaire4Recette) ? (
          <View>
            <View style={styles.permissionsContainer}>
              <Text style={styles.inputLabel}>{t('tab.myStore')}</Text>
              <Text style={styles.infoText}>{t('teamManagement.descMyStore')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('profileScreen.newEmailPlaceholder')}
                value={emails.mystore}
                onChangeText={(text: string) => setEmails((prev: Record<string, string>) => ({ ...prev, mystore: text }))}
              />
              <TouchableOpacity
                style={[styles.submitButton, (!emails.mystore.trim() || isLoading) && styles.submitButtonDisabled]}
                onPress={() => handleSendIndividualInvite('mystore')}
                disabled={!emails.mystore.trim() || isLoading}
              >
                <Text style={styles.submitButtonText}>{t('submitButton')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.permissionsContainer}>
              <Text style={styles.inputLabel}>{t('tab.myNews')}</Text>
              <Text style={styles.infoText}>{t('teamManagement.descMaCom')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('profileScreen.newEmailPlaceholder')}
                value={emails.mynews}
                onChangeText={(text: string) => setEmails((prev: Record<string, string>) => ({ ...prev, mynews: text }))}
              />
              <TouchableOpacity
                style={[styles.submitButton, (!emails.mynews.trim() || isLoading) && styles.submitButtonDisabled]}
                onPress={() => handleSendIndividualInvite('mynews')}
                disabled={!emails.mynews.trim() || isLoading}
              >
                <Text style={styles.submitButtonText}>{t('submitButton')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.permissionsContainer}>
              <Text style={styles.inputLabel}>{t('tab.commandsMgz')}</Text>
              <Text style={styles.infoText}>{t('teamManagement.descCommandes')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('profileScreen.newEmailPlaceholder')}
                value={emails.commands}
                onChangeText={(text: string) => setEmails((prev: Record<string, string>) => ({ ...prev, commands: text }))}
              />
              <TouchableOpacity
                style={[styles.submitButton, (!emails.commands.trim() || isLoading) && styles.submitButtonDisabled]}
                onPress={() => handleSendIndividualInvite('commands')}
                disabled={!emails.commands.trim() || isLoading}
              >
                <Text style={styles.submitButtonText}>{t('submitButton')}</Text>
              </TouchableOpacity>
            </View>

            {activePack === PremiumCommercant.Gestionnaire4Recette && (
              <View style={styles.permissionsContainer}>
                <Text style={styles.inputLabel}>{t('tab.revenue')}</Text>
                <Text style={styles.infoText}>{t('teamManagement.descRecette')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('profileScreen.newEmailPlaceholder')}
                  value={emails.recette}
                  onChangeText={(text: string) => setEmails((prev: Record<string, string>) => ({ ...prev, recette: text }))}
                />
                <TouchableOpacity
                  style={[styles.submitButton, (!emails.recette.trim() || isLoading) && styles.submitButtonDisabled]}
                  onPress={() => handleSendIndividualInvite('recette')}
                  disabled={!emails.recette.trim() || isLoading}
                >
                  <Text style={styles.submitButtonText}>{t('submitButton')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View>
            <Text style={styles.infoText}>{t('teamManagement.description')}</Text>
            <Text style={styles.inputLabel}>{t('profileScreen.email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('profileScreen.newEmailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            <View style={styles.permissionsContainer}>
              {renderCheckbox(t('tab.myStore'), "mystore")}
              {renderCheckbox(t('tab.myNews'), "mynews")}
              {renderCheckbox(t('tab.commandsMgz'), "commands")}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isButtonDisabled && styles.submitButtonDisabled]}
              onPress={handleSendInvite}
              disabled={isButtonDisabled}
            >
              <Text style={styles.submitButtonText}>{t('submitButton')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 35,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 30,
    backgroundColor: '#f9f9f9'
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -25,
    marginBottom: 15,
    marginLeft: 5,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001524',
    marginTop: 10,
    marginBottom: 5
  },
  permissionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#eee'
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333'
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  checkboxActive: {
    backgroundColor: '#001524',
    borderColor: '#001524'
  },
  submitButton: {
    backgroundColor: '#78290f',
    paddingVertical: 12,
    paddingHorizontal: '35%',
    borderRadius: 15,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 40
  },
  submitButtonDisabled: {
    backgroundColor: '#bbb',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
