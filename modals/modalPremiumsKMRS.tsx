import React, { useEffect, useState } from 'react';
import { PremiumCommercant, PRIX_PREMIUM_COMMERCANT } from '../logic/premiums';
import { Modal, Alert, View, Text, TouchableOpacity, ScrollView, StyleSheet, GestureResponderEvent, useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { account, databases, ID, config, functions } from '../logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';

interface PremiumOffersModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUpgradePress: (offer: SelectedOfferDetails) => void;
}

interface SelectedOfferDetails {
  type: 'advantage' | 'subscription';
  label: string;
  price: number;
  confirmationTitle: string;
  confirmationBody: string;
  level?: PremiumCommercant;
}

const PremiumKmrsOffersModal = ({ isVisible, onClose, onUpgradePress }: PremiumOffersModalProps) => {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState<boolean>(false);
  const [infoModalContent, setInfoModalContent] = useState<string>('');
  const [currentView, setCurrentView] = useState<'offers' | 'confirmation'>('offers');
  const [selectedOffer, setSelectedOffer] = useState<SelectedOfferDetails | null>(null);

  useEffect(() => {
    if (isVisible) {
      setCurrentView('offers');
      setSelectedOffer(null);
      setErrorStatus(null);
      setIsInfoModalVisible(false);
    }
  }, [isVisible]);

  const sendAdminNotification = async (offer: SelectedOfferDetails) => {
    try {
      const user = await account.get();

      const execution = await functions.createExecution(
        config.sireneFunctionId,
        JSON.stringify({
          userId: user.$id,
          userEmail: user.email,
          offerDetails: offer,
          requestTime: new Date().toISOString(),
        })
      );

      if (execution.status === 'completed') {
        const result = JSON.parse(execution.responseBody);
        return { success: result.success, message: result.message };
      } else {
        throw new Error(`Function execution failed with status: ${execution.status}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Appwrite Error in sendAdminNotification:', errorMessage);

      const appwriteErr = error as { code?: number; type?: string };
      if (appwriteErr.code === 401 || appwriteErr.type === 'user_unauthorized') {
        return { success: false, error: "Authentication required or unauthorized." };
      }
      return { success: false, error: errorMessage };
    }
  };

  const handleKmrsOptionPress = (level: PremiumCommercant, label: string) => {
    const price = PRIX_PREMIUM_COMMERCANT[level];
    if (price === null) return;

    const offerDetails: SelectedOfferDetails = {
      type: 'subscription',
      label: label,
      price: price,
      confirmationTitle: label,
      confirmationBody: t('infosPremCommercant').replace('{{label}}', label).replace('{{price}}', String(price)),
      level: level
    };
    setSelectedOffer(offerDetails);
    setCurrentView('confirmation');
  };

  const handleInfoIconPress = (event: GestureResponderEvent, content: string) => {
    event.stopPropagation();
    setInfoModalContent(content);
    setIsInfoModalVisible(true);
  };

  const handleBack = () => {
    if (isInfoModalVisible) setIsInfoModalVisible(false);
    else if (currentView === 'confirmation') setCurrentView('offers');
    else onClose();
  };

  const handleConfirmCashPayment = async () => {
    if (!selectedOffer) return;
    setErrorStatus(null);
    try {
      const user = await account.get();
      const userId = user.$id;
      const userEmail = user.email;

      const result = await sendAdminNotification(selectedOffer);

      if (result.success) {
        await databases.createDocument(
          config.databaseId,
          config.premiumCollectionId,
          ID.unique(),
          {
            userId: userId,
            userEmail: userEmail,
            offerType: selectedOffer.type,
            offerLabel: selectedOffer.label,
            offerPrice: selectedOffer.price,
            offerLevel: selectedOffer.level,
            purchaseDate: new Date().toISOString(),
          }
        );

        Alert.alert(
          t('general.success'),
          t('weWillContactYouForPayment'),
          [{ text: 'OK', onPress: onClose }]
        );
        onUpgradePress(selectedOffer);
      } else {
        setErrorStatus(`${t('general.error')} : ${result.error || t('genericError')}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('genericError');
      console.error('Erreur lors de la confirmation ou de l\'enregistrement DB:', errorMessage);
      setErrorStatus(`${t('general.error')} : ${errorMessage}`);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.fullScreenOverlay}>
        {currentView === 'offers' && (
          <View style={styles.premiumModalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <Icon name="chevron-left" size={35} color={colors.textNormal} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t('view_premium_offers')}</Text>
            </View>
            <ScrollView style={styles.scrollViewContent}>
              <Text style={styles.generalInfoText}>
                {t('textePresentationPremium')}
              </Text>
              {errorStatus && <Text style={styles.generalInfoText}>{errorStatus}</Text>}
              <Text style={styles.groupCtaText}>
                {t('avantagePremium')}
              </Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.dealButton}
                  onPress={() => handleKmrsOptionPress(PremiumCommercant.Gestionnaire3, t('teamManagement.pack3'))}
                >
                  <TouchableOpacity style={styles.infoIconContainer} onPress={(e: GestureResponderEvent) => handleInfoIconPress(e, t('infosPack3'))}>
                    <Icon name="information-outline" size={18} color={colors.tint} />
                  </TouchableOpacity>

                  <View style={styles.buttonContent}>
                    <Icon name="account-group-outline" size={40} color={colors.tint} />
                    <Text style={styles.largeButtonLabel}>{t('teamManagement.pack3')}</Text>
                    <Text style={styles.buttonPrice}>{PRIX_PREMIUM_COMMERCANT[PremiumCommercant.Gestionnaire3]}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dealButton}
                  onPress={() => handleKmrsOptionPress(PremiumCommercant.Gestionnaire4Recette, t('teamManagement.pack4'))}
                >
                  <TouchableOpacity style={styles.infoIconContainer} onPress={(e: GestureResponderEvent) => handleInfoIconPress(e, t('infosPack4'))}>
                    <Icon name="information-outline" size={18} color={colors.tint} />
                  </TouchableOpacity>
                  <View style={styles.buttonContent}>
                    <Icon name="account-circle-outline" size={40} color={colors.tint} />
                    <Text style={styles.largeButtonLabel}>{t('teamManagement.pack4')}</Text>
                    <Text style={styles.buttonPrice}>{PRIX_PREMIUM_COMMERCANT[PremiumCommercant.Gestionnaire4Recette]}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {currentView === 'confirmation' && selectedOffer && (
          <View style={styles.fullScreenOverlay}>
            <View style={styles.infoModalContainer}>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View style={styles.overlayHeader}>
                  <TouchableOpacity onPress={() => setCurrentView('offers')} style={styles.modalCloseButton}>
                    <Icon name="chevron-left" size={35} color={colors.textNormal} />
                  </TouchableOpacity>
                  <Text style={[styles.groupCtaText, { marginBottom: 0, flex: 1 }]}>
                    {selectedOffer.confirmationTitle}
                  </Text>
                </View>

                <Text style={styles.generalInfoText}>{selectedOffer.confirmationBody}</Text>
                {errorStatus && <Text style={[styles.generalInfoText, { color: 'red' }]}>{errorStatus}</Text>}
                <View style={[styles.buttonGroup, { marginTop: 10 }]}>
                  <TouchableOpacity style={[styles.dealButton, styles.confirmationButton]} onPress={handleConfirmCashPayment}>
                    <Text style={[styles.largeButtonLabel, { color: '#fff', fontSize: 16 }]}>{t('general.confirm')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.advantageButton, styles.confirmationButton]} onPress={() => setCurrentView('offers')}>
                    <Text style={[styles.largeButtonLabel, { color: '#fff', fontSize: 16 }]}>{t('general.cancel')}</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          </View>
        )}

        {isInfoModalVisible && (
          <View style={styles.fullScreenOverlay} pointerEvents="box-none">
            <View style={styles.infoModalContainer}>
              <View style={styles.overlayHeader}>
                <TouchableOpacity onPress={() => setIsInfoModalVisible(false)} style={styles.modalCloseButton}>
                  <Icon name="chevron-back" size={35} color={colors.textNormal} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={styles.infoModalText}>
                  {infoModalContent}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    confirmationButton: {
      backgroundColor: colors.tint,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
    },
    infoModalContainer: {
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingTop: 35,
      marginTop: 0,
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      flex: 1,
    },
    infoModalText: {
      fontSize: 16,
      color: colors.txtDghn,
      textAlign: 'left',
      marginBottom: 30,
      marginLeft: 25,
      marginRight: 25,
    },
    infoModalCloseButton: {
      position: 'absolute',
      top: 5,
      right: 10,
      padding: 0,
    },
    fullScreenOverlay: {
      flex: 1,
      backgroundColor: colors.greyDes,
    },
    premiumModalView: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 0,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 0,
      position: 'relative',
      borderBottomWidth: 2,
      borderBottomColor: colors.tint,
      height: 60,
    },
    modalCloseButton: {
      left: 5,
      padding: 2,
      marginRight: 20,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.textNormal,
      textAlign: 'left',
      flex: 1,
    },
    scrollViewContent: {
      paddingHorizontal: 5,
    },
    generalInfoText: {
      fontSize: 16,
      color: colors.textNormal,
      marginBottom: 20,
      textAlign: 'left',
      lineHeight: 20,
    },
    groupCtaText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textNormal,
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 15,
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 15,
      paddingHorizontal: 0,
    },
    overlayHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    advantageButton: {
      backgroundColor: colors.greyDes,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    buttonContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    largeButtonLabel: {
      color: colors.textNormal,
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    buttonPrice: {
      color: colors.tint,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 8,
      opacity: 0.7,
      textAlign: 'center',
    },
    infoIconContainer: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: colors.surface,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dealButton: {
      backgroundColor: colors.surface,
      padding: 15,
      borderRadius: 24,
      marginHorizontal: 8,
      flex: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      height: 170,
      position: 'relative',
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.07,
      shadowRadius: 15,
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.tint,
    },
  });
};

export default PremiumKmrsOffersModal;