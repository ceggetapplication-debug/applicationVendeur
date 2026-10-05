import React, { useEffect, useState } from 'react';
import { PremiumCommercant, PRIX_PREMIUM_COMMERCANT } from '../logic/premiums';
import { Modal, Alert, View, Text, TouchableOpacity, ScrollView, StyleSheet, GestureResponderEvent, useColorScheme } from 'react-native';
import { Colors } from '../appSellerColors';
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
  //value?: number;
  //months?: number;
  price: number;
  confirmationTitle: string;
  confirmationBody: string;
  level?: PremiumCommercant;
}

const PremiumKmrsOffersModal = ({ isVisible, onClose, onUpgradePress }: PremiumOffersModalProps) => {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];
  const modalStyles = getModalStyles(theme);
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
        config.notificationFunctionId,
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
      <View style={modalStyles.fullScreenOverlay}>
        {currentView === 'offers' && (
          <View style={modalStyles.premiumModalView}>
            <View style={modalStyles.modalHeader}>
              <TouchableOpacity onPress={onClose} style={modalStyles.modalCloseButton}>
                <Icon name="chevron-left" size={35} color={colors.text} />
              </TouchableOpacity>
              <Text style={modalStyles.modalTitle}>{t('view_premium_offers')}</Text>
            </View>
            <ScrollView style={modalStyles.scrollViewContent}>
              <Text style={modalStyles.generalInfoText}>
                {t('textePresentationPremium')}
              </Text>
              {errorStatus && <Text style={modalStyles.generalInfoText}>{errorStatus}</Text>}
              <Text style={modalStyles.groupCtaText}>
                {t('avantagePremium')}
              </Text>
              {/*<View style={modalStyles.buttonGroup}>
                <TouchableOpacity
                  style={modalStyles.advantageButton}
                  onPress={() => handleKmrsOptionPress(PremiumCommercant.Niveau1, `1 ${t('month')}`)}
                >
                  <TouchableOpacity style={modalStyles.infoIconContainer} onPress={(e) => handleInfoIconPress(e, t('infosNiveau1'))}>
                    <Icon name="information-outline" size={18} color={BROWN} />
                  </TouchableOpacity>

                  <View style={modalStyles.buttonContent}>
                    <Icon name="calendar-month" size={40} color="#fff" />
                    <Text style={modalStyles.largeButtonLabel}>1 {t('month')}</Text>
                    <Text style={modalStyles.buttonPrice}>{PRIX_PREMIUM_COMMERCANT[PremiumCommercant.Niveau1]}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modalStyles.advantageButton}
                  onPress={() => handleKmrsOptionPress(PremiumCommercant.Niveau2, `6 ${t('months')}`)}
                >
                  <TouchableOpacity style={modalStyles.infoIconContainer} onPress={(e) => handleInfoIconPress(e, t('infosNiveau2'))}>
                    <Icon name="information-outline" size={18} color={BROWN} />
                  </TouchableOpacity>
                  <View style={modalStyles.buttonContent}>
                    <Icon name="calendar-range" size={40} color={TEAL} />
                    <Text style={modalStyles.largeButtonLabel}>6 {t('months')}</Text>
                    <Text style={modalStyles.buttonPrice}>{PRIX_PREMIUM_COMMERCANT[PremiumCommercant.Niveau2]}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={modalStyles.advantageButton}
                  onPress={() => handleKmrsOptionPress(PremiumCommercant.Niveau3, `12 ${t('months')}`)}
                >
                  <TouchableOpacity style={modalStyles.infoIconContainer} onPress={(e) => handleInfoIconPress(e, t('infosNiveau3'))}>
                    <Icon name="information-outline" size={18} color={BROWN} />
                  </TouchableOpacity>
                  <View style={modalStyles.buttonContent}>
                    <Icon name="crown" size={40} color="#ffd700" />
                    <Text style={modalStyles.largeButtonLabel}>12 {t('months')}</Text>
                    <Text style={modalStyles.buttonPrice}>{PRIX_PREMIUM_COMMERCANT[PremiumCommercant.Niveau3]}</Text>
                  </View>
                </TouchableOpacity> 
              </View> */}
              <View style={modalStyles.buttonGroup}>
                <TouchableOpacity
                  style={modalStyles.dealButton}
                  onPress={() => handleKmrsOptionPress(PremiumCommercant.Gestionnaire3, t('teamManagement.pack3'))}
                >
                  <TouchableOpacity style={modalStyles.infoIconContainer} onPress={(e: GestureResponderEvent) => handleInfoIconPress(e, t('infosPack3'))}>
                    <Icon name="information-outline" size={18} color={colors.tint} />
                  </TouchableOpacity>

                  <View style={modalStyles.buttonContent}>
                    <Icon name="people-outline" size={40} color={colors.text} />
                    <Text style={modalStyles.largeButtonLabel}>{t('teamManagement.pack3')}</Text>
                    <Text style={modalStyles.buttonPrice}>{PRIX_PREMIUM_COMMERCANT[PremiumCommercant.Gestionnaire3]}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={modalStyles.dealButton}
                  onPress={() => handleKmrsOptionPress(PremiumCommercant.Gestionnaire4Recette, t('teamManagement.pack4'))}
                >
                  <TouchableOpacity style={modalStyles.infoIconContainer} onPress={(e: GestureResponderEvent) => handleInfoIconPress(e, t('infosPack4'))}>
                    <Icon name="information-outline" size={18} color={colors.tint} />
                  </TouchableOpacity>
                  <View style={modalStyles.buttonContent}>
                    <Icon name="people-circle-outline" size={40} color={colors.text} />
                    <Text style={modalStyles.largeButtonLabel}>{t('teamManagement.pack4')}</Text>
                    <Text style={modalStyles.buttonPrice}>{PRIX_PREMIUM_COMMERCANT[PremiumCommercant.Gestionnaire4Recette]}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {currentView === 'confirmation' && selectedOffer && (
          <View style={modalStyles.fullScreenOverlay}>
            <View style={modalStyles.infoModalContainer}>
              <ScrollView contentContainerStyle={{ padding: 20 }}>

                {/* NOUVEAU HEADER : Chevron à GAUCHE, Titre à DROITE */}
                <View style={modalStyles.overlayHeader}>
                  <TouchableOpacity onPress={() => setCurrentView('offers')} style={modalStyles.modalCloseButton}>
                    <Icon name="chevron-back" size={35} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[modalStyles.groupCtaText, { marginBottom: 0, flex: 1 }]}>
                    {selectedOffer.confirmationTitle}
                  </Text>
                </View>

                <Text style={modalStyles.generalInfoText}>{selectedOffer.confirmationBody}</Text>
                {errorStatus && <Text style={[modalStyles.generalInfoText, { color: 'red' }]}>{errorStatus}</Text>}
                <View style={[modalStyles.buttonGroup, { marginTop: 10 }]}>
                  <TouchableOpacity style={[modalStyles.dealButton, modalStyles.confirmationButton]} onPress={handleConfirmCashPayment}>
                    <Text style={[modalStyles.largeButtonLabel, { color: '#fff', fontSize: 16 }]}>{t('general.confirm')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[modalStyles.advantageButton, modalStyles.confirmationButton]} onPress={() => setCurrentView('offers')}>
                    <Text style={[modalStyles.largeButtonLabel, { color: '#fff', fontSize: 16 }]}>{t('general.cancel')}</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          </View>
        )}

        {isInfoModalVisible && (
          <View style={modalStyles.fullScreenOverlay} pointerEvents="box-none">
            <View style={modalStyles.infoModalContainer}>
              <View style={modalStyles.overlayHeader}>
                <TouchableOpacity onPress={() => setIsInfoModalVisible(false)} style={modalStyles.modalCloseButton}>
                  <Icon name="chevron-back" size={35} color={colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <Text style={modalStyles.infoModalText}>
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

const getModalStyles = (theme: 'light' | 'dark') => {
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
      shadowColor: colors.icon,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      flex: 1,
    },
    infoModalText: {
      fontSize: 16,
      color: colors.text,
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
      backgroundColor: 'rgba(0,0,0,0.5)',
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
      marginBottom: 10,
      marginRight: 20,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'left',
      flex: 1,
    },
    scrollViewContent: {
      paddingHorizontal: 5,
    },
    generalInfoText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
      textAlign: 'left',
      lineHeight: 20,
    },
    groupCtaText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
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
      backgroundColor: colors.surface,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
    },
    buttonContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    largeButtonLabel: {
      color: colors.text,
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
      shadowColor: colors.icon,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.07,
      shadowRadius: 15,
      elevation: 5,
      borderWidth: 1,
      borderColor: colors.surface,
    },
  });
};

export default PremiumKmrsOffersModal;