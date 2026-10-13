import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { account, databases, config, Query, ID, sendTeamInviteEmailWithFallback } from '../logic/appwriteConfig';

interface TeamManagementProps {
  onBack?: () => void;
}

const TeamManagementScreen: React.FC<TeamManagementProps> = ({ onBack }: TeamManagementProps) => {
  const { t } = useAppTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];
  const styles = getStyles(theme);

  const [isLoading, setIsLoading] = useState(false);
  const [packNumber, setPackNumber] = useState<number>(0);
  const [emailPack0State, setEmailPack0] = useState('');
  const [emailStore, setEmailStore] = useState('');
  const [emailNews, setEmailNews] = useState('');
  const [emailCommands, setEmailCommands] = useState('');
  const [emailRecette, setEmailRecette] = useState('');

  useEffect(() => {
    const fetchPack = async () => {
      try {
        const user = await account.get();
        const resp = await databases.listDocuments(
          config.databaseId,
          config.usersCollectionId,
          [Query.equal('userId', user.$id)]
        );
        if (resp.documents.length > 0) {
          const doc = resp.documents[0];
          if (doc.premiumPack === 'pack_4' || doc.premiumPack === 'Pack 4') {
            setPackNumber(4);
          } else if (doc.premiumPack === 'pack_3' || doc.premiumPack === 'Pack 3') {
            setPackNumber(3);
          } else {
            setPackNumber(0);
          }
        }
      } catch (error) {
        console.error("Erreur récupération du pack:", error);
      }
    };
    fetchPack();
  }, []);

  const handleSendInvite = async (targetEmail: string, permissions: { mystore: boolean; mynews: boolean; commands: boolean; recette: boolean }) => {
    if (packNumber === 0) {
      Alert.alert(
        t('premiumRequiredTitle'),
        t('premiumRequiredDesc'),
        [
          { text: t('general.cancel'), style: 'cancel' },
          {
            text: t('activatePremium'),
            onPress: () => router.push('/appSeller/modals/modalPremiumsKMRS')
          }
        ]
      );
      return;
    }

    const cleanEmail = targetEmail.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert(t('general.error'), t('auth/invalid-email'));
      return;
    }

    try {
      setIsLoading(true);
      const user = await account.get();
      await databases.createDocument(
        config.databaseId,
        'invitations',
        ID.unique(),
        {
          ownerUserId: user.$id,
          targetEmail: cleanEmail,
          permissions: JSON.stringify(permissions),
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
      );

      await sendTeamInviteEmailWithFallback(targetEmail, 'Mon Magasin', 'cegget://accept-invite');
      Alert.alert(t('general.success'), t('emailEnvoyeSucc'));

    } catch (error) {
      console.error("Erreur envoi invitation:", error);
      Alert.alert(t('general.error'), t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textu} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('teamManagement.title')}</Text>
      </View>

      <View style={styles.checkboxRow}>
        <TouchableOpacity style={[styles.submitButton, packNumber !== 0 && styles.submitButtonDisabled]} onPress={() => setPackNumber(0)}>
          <Text style={styles.submitButtonText}>{t('profileScreen.gestion')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitButton, packNumber !== 3 && styles.submitButtonDisabled]} onPress={() => setPackNumber(3)}>
          <Text style={styles.submitButtonText}>{t('teamManagement.pack3')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitButton, packNumber !== 4 && styles.submitButtonDisabled]} onPress={() => setPackNumber(4)}>
          <Text style={styles.submitButtonText}>{t('teamManagement.pack4')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {packNumber === 0 && (
          <View>
            <Text style={styles.sectionTitle}>{t('teamManagement.inviteManagerTitle')}</Text>
            <Text style={styles.description}>{t('teamManagement.inviteManagerDesc')}</Text>

            <Text style={styles.inputLabel}>{t('profileScreen.email')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface }]}
              placeholder={t('emailPlaceholder')}
              placeholderTextColor={colors.greyDes}
              value={emailPack0State}
              onChangeText={setEmailPack0}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.sectionTitle}>{t('teamManagement.permissionsTitle')}</Text>
            <Text style={styles.description}>{t('teamManagement.permissionsDesc')}</Text>

            <View style={styles.permissionsContainer}>
              <View style={styles.checkboxRow}>
                <Text style={styles.checkboxLabel}>{t('tab.myStore')}</Text>
                <View style={[styles.checkboxBox, styles.checkboxBoxActive]}>
                  <Ionicons name="checkmark" size={16} color={colors.textNormal} />
                </View>
              </View>

              <View style={styles.checkboxRow}>
                <Text style={styles.checkboxLabel}>{t('tab.myNews')}</Text>
                <View style={[styles.checkboxBox, styles.checkboxBoxActive]}>
                  <Ionicons name="checkmark" size={16} color={colors.textNormal} />
                </View>
              </View>

              <View style={styles.checkboxRow}>
                <Text style={styles.checkboxLabel}>{t('tab.commandsMgz')}</Text>
                <View style={[styles.checkboxBox, styles.checkboxBoxActive]}>
                  <Ionicons name="checkmark" size={16} color={colors.textNormal} />
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!emailPack0State.trim() || isLoading) && styles.submitButtonDisabled]}
              disabled={!emailPack0State.trim() || isLoading}
              onPress={() => handleSendInvite(emailPack0State, { mystore: true, mynews: true, commands: true, recette: false })}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textNormal} />
              ) : (
                <Text style={styles.submitButtonText}>{t('general.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {(packNumber === 3 || packNumber === 4) && (
          <View>
            <View style={styles.permissionsContainer}>
              <Text style={styles.cardTitle}>{t('tab.myStore')}</Text>
              <Text style={styles.description}>{t('teamManagement.descMyStore')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={colors.greyDes}
                value={emailStore}
                onChangeText={setEmailStore}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.submitButton, (!emailStore.trim() || isLoading) && styles.submitButtonDisabled]}
                disabled={!emailStore.trim() || isLoading}
                onPress={() => handleSendInvite(emailStore, { mystore: true, mynews: false, commands: false, recette: false })}
              >
                <Text style={styles.submitButtonText}>{t('general.save')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.permissionsContainer}>
              <Text style={styles.cardTitle}>{t('tab.myNews')}</Text>
              <Text style={styles.description}>{t('teamManagement.descMaCom')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={colors.greyDes}
                value={emailNews}
                onChangeText={setEmailNews}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.submitButton, (!emailNews.trim() || isLoading) && styles.submitButtonDisabled]}
                disabled={!emailNews.trim() || isLoading}
                onPress={() => handleSendInvite(emailNews, { mystore: false, mynews: true, commands: false, recette: false })}
              >
                <Text style={styles.submitButtonText}>{t('general.save')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.permissionsContainer}>
              <Text style={styles.cardTitle}>{t('tab.commandsMgz')}</Text>
              <Text style={styles.description}>{t('teamManagement.descCommandes')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={colors.greyDes}
                value={emailCommands}
                onChangeText={setEmailCommands}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.submitButton, (!emailCommands.trim() || isLoading) && styles.submitButtonDisabled]}
                disabled={!emailCommands.trim() || isLoading}
                onPress={() => handleSendInvite(emailCommands, { mystore: false, mynews: false, commands: true, recette: false })}
              >
                <Text style={styles.submitButtonText}>{t('general.save')}</Text>
              </TouchableOpacity>
            </View>
            {packNumber === 4 && (
              <View style={styles.permissionsContainer}>
                <Text style={styles.cardTitle}>{t('tab.revenue')}</Text>
                <Text style={styles.description}>{t('teamManagement.descRecette')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('emailPlaceholder')}
                  placeholderTextColor={colors.greyDes}
                  value={emailRecette}
                  onChangeText={setEmailRecette}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.submitButton, (!emailRecette.trim() || isLoading) && styles.submitButtonDisabled]}
                  disabled={!emailRecette.trim() || isLoading}
                  onPress={() => handleSendInvite(emailRecette, { mystore: false, mynews: false, commands: false, recette: true })}
                >
                  <Text style={styles.submitButtonText}>{t('general.save')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 40,
      paddingBottom: 20,
      backgroundColor: colors.txtDghn,
      elevation: 3,
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    backButton: {
      marginRight: 15,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textu,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.tint,
      marginTop: 10,
      marginBottom: 5,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.tint,
      marginBottom: 5,
    },
    description: {
      fontSize: 14,
      color: colors.greyDes,
      marginBottom: 15,
      lineHeight: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textu,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.tint,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 20,
      backgroundColor: colors.background,
      color: colors.textNormal,
    },
    permissionsContainer: {
      backgroundColor: colors.txtDghn,
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
      borderColor: colors.tint,
      borderWidth: 2,
    },
    checkboxRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.tint,
    },
    checkboxLabel: {
      fontSize: 16,
      color: colors.textu,
    },
    checkboxBox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    checkboxBoxActive: {
      backgroundColor: colors.green,
      borderColor: colors.green,
    },
    submitButton: {
      backgroundColor: colors.tint,
      paddingVertical: 12,
      borderRadius: 15,
      alignItems: 'center',
      alignSelf: 'center',
      width: 'auto',
      marginTop: 10,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    submitButtonDisabled: {
      backgroundColor: colors.greyDes,
      opacity: 0.5,
    },
    submitButtonText: {
      color: colors.txtDghn,
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
};

export default TeamManagementScreen;