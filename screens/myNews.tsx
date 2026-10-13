import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Modal, Pressable, Linking, useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { uploadToR2, deleteFromR2 } from '../logic/imagesLogic';
import { account, databases, config, Query, Models, ID, r2Config } from '../logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';

interface Photo {
  id: string;
  uri: string;
  likes: number;
  isLiked?: boolean;
  title?: string;
}

export default function MyNewsScreen() {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];
  const styles = getStyles(theme);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isPickerModalVisible, setPickerModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<Photo | null>(null);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [currentMenuPhoto, setCurrentMenuPhoto] = useState<Photo | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [evaluationData, setEvaluationData] = useState<{ ratings: Record<number, number> }>({
    ratings: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    const fetchStoreDataAndPhotos = async () => {
      try {
        const user = await account.get();
        const storeResp = await databases.listDocuments(
          config.databaseId,
          config.storesCollectionId,
          [Query.equal('userId', user.$id)]
        );

        if (storeResp.documents.length > 0) {
          const storeDoc = storeResp.documents[0];
          const sid = storeDoc.$id;
          setStoreId(sid);
          setFollowersCount(storeDoc.followersCount || storeDoc.followers || 0);
          if (storeDoc.ratings) {
            setEvaluationData({
              ratings: {
                5: storeDoc.ratings[5] || 0,
                4: storeDoc.ratings[4] || 0,
                3: storeDoc.ratings[3] || 0,
                2: storeDoc.ratings[2] || 0,
                1: storeDoc.ratings[1] || 0,
              }
            });
          }

          const photosResp = await databases.listDocuments(
            config.databaseId,
            config.productsCollectionId,
            [Query.equal('storeId', sid)]
          );

          const fetchedPhotos: Photo[] = photosResp.documents.map((doc: Models.Document) => ({
            id: doc.$id,
            uri: doc.imageUrl || `${r2Config.publicUrl}/${r2Config.folders.STORES}news_${doc.$id}.jpg`,
            likes: doc.likes || 0,
            title: doc.title || '',
          }));

          setPhotos(fetchedPhotos);
        }
      } catch (error) {
        console.error('Erreur chargement BDD Appwrite:', error);
      }
    };

    fetchStoreDataAndPhotos();
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('general.error') || 'Erreur',
            'Permission refusée pour accéder aux photos.'
          );
        }
      }
    })();
  }, [t]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
      setPickerModalVisible(true);
    }
  };

  const handleProcessAndAddPhoto = async () => {
    if (!selectedImageUri) return;
    try {
      const photoId = ID.unique();
      const r2Key = `${r2Config.folders.STORES}news_${photoId}.jpg`;
      const fileToUpload = {
        uri: selectedImageUri,
        name: `news_${photoId}.jpg`,
        type: 'image/jpeg',
      };

      await uploadToR2(r2Key, fileToUpload);
      const publicImageUrl = `${r2Config.publicUrl}/${r2Key}`;

      const newPhoto: Photo = {
        id: photoId,
        uri: publicImageUrl,
        likes: 0,
        title: t('myNewsScreen.defaultPhotoTitle') || 'Ma photo',
      };

      setPhotos((prev: Photo[]) => [...prev, newPhoto]);
      closeImportModal();
      Alert.alert(
        t('myNewsScreen.photoImported') || 'Succès',
        'Photo partagée avec succès !'
      );
    } catch (error) {
      Alert.alert(
        t('general.error') || 'Erreur',
        'Impossible de partager la photo.'
      );
    }
  };

  const closeImportModal = () => {
    setPickerModalVisible(false);
    setSelectedImageUri(null);
  };

  const openFullScreenPhoto = (photo: Photo) => setFullScreenPhoto(photo);

  const closeFullScreenPhoto = () => {
    setFullScreenPhoto(null);
    setIsMenuModalVisible(false);
    setCurrentMenuPhoto(null);
  };

  const handleLike = (photoId: string) => {
    setPhotos((prev: Photo[]) =>
      prev.map((photo: Photo) =>
        photo.id === photoId ? { ...photo, likes: photo.likes + 1 } : photo
      )
    );
  };

  const openPhotoMenu = (photo: Photo) => {
    setCurrentMenuPhoto(photo);
    setIsMenuModalVisible(true);
  };

  const handleDeletePhoto = useCallback(async () => {
    if (!currentMenuPhoto) return;
    Alert.alert(
      t('myNewsScreen.deletePhotoConfirmationTitle') || 'Supprimer la photo',
      t('myNewsScreen.deletePhotoConfirmationMessage') || 'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
        {
          text: t('general.cancel') || 'Annuler',
          style: 'cancel',
          onPress: () => setIsMenuModalVisible(false),
        },
        {
          text: t('myNewsScreen.delete') || 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const photoId = currentMenuPhoto.id;
              const r2Key = `${r2Config.folders.STORES}news_${photoId}.jpg`;
              await deleteFromR2(r2Key);
              setPhotos((prev: Photo[]) => prev.filter((p: Photo) => p.id !== photoId));
            } catch (err) {
              console.error('Erreur suppression R2:', err);
            } finally {
              setIsMenuModalVisible(false);
              setFullScreenPhoto(null);
              setCurrentMenuPhoto(null);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [currentMenuPhoto, t]);

  const renderHeartRating = (starsCount: number, count: number, heartColor: string) => (
    <View key={starsCount} style={styles.ratingRow}>
      <View style={styles.heartsContainer}>
        {Array.from({ length: starsCount }).map((_, index) => (
          <Ionicons key={index} name="heart" size={16} color={heartColor} style={{ marginRight: 2 }} />
        ))}
      </View>
      <Text style={styles.evaluationText}>{count} {t('myNewsScreen.evaluation') || 'cœurs'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('tab.myNews') || "Ma Com'"}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('myNewsScreen.myPhotos') || 'Mes Photos'}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosScrollView}
        >
          {photos.length === 0 ? (
            <View style={styles.noPhotosContainer}>
              <Text style={styles.noPhotosText}>
                {t('myNewsScreen.noPhotosYet') || 'Aucune photo pour l\'instant.'}
              </Text>
            </View>
          ) : (
            photos.map((photo: Photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoContainerPic}
                onPress={() => openFullScreenPhoto(photo)}
              >
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                <View style={styles.photoOverlay}>
                  <Ionicons name="heart" size={18} color={colors.azuvagh} />
                  <Text style={styles.photoLikes}>{photo.likes}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
            <Ionicons name="add-circle-outline" size={32} color={colors.ranjou} />
            <Text style={styles.addPhotoText}>{t('myNewsScreen.addPhoto') || 'Ajouter une photo'}</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isPickerModalVisible}
          onRequestClose={closeImportModal}
        >
          <View style={styles.centeredViewPic}>
            <View style={styles.modalViewPic}>
              <TouchableOpacity onPress={closeImportModal} style={styles.modalCloseIcon}>
                <Ionicons name="close-circle-outline" size={28} color={colors.icon} />
              </TouchableOpacity>

              <Text style={styles.modalTitlePic}>{t('myNewsScreen.selectPhotoToImport') || 'Sélectionner une photo'}</Text>

              {selectedImageUri && (
                <>
                  <Image
                    source={{ uri: selectedImageUri }}
                    style={styles.selectedImagePreview}
                  />
                  <Pressable
                    style={[styles.modalButtonPic, styles.modalButtonPrimary]}
                    onPress={handleProcessAndAddPhoto}
                  >
                    <Text style={styles.modalButtonText}>{t('myNewsScreen.addPhotoToMyNews') || 'Partager'}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={!!fullScreenPhoto}
          onRequestClose={closeFullScreenPhoto}
        >
          <View style={styles.fullScreenOverlay}>
            {fullScreenPhoto && (
              <>
                <Image
                  source={{ uri: fullScreenPhoto.uri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />

                <View style={styles.fullScreenHeader}>
                  <TouchableOpacity
                    onPress={closeFullScreenPhoto}
                    style={styles.fullScreenCloseButton}
                  >
                    <Ionicons name="close-outline" size={32} color={colors.blond} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openPhotoMenu(fullScreenPhoto)}
                    style={styles.fullScreenMenuButton}
                  >
                    <Ionicons name="ellipsis-vertical" size={26} color={colors.blond} />
                  </TouchableOpacity>
                </View>

                <View style={styles.fullScreenFooter}>
                  <TouchableOpacity
                    onPress={() => handleLike(fullScreenPhoto.id)}
                    style={styles.socialLikeButtonColumn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="heart" size={32} color={colors.azuvagh} />
                    <Text style={styles.socialLikesCountUnderText}>
                      {fullScreenPhoto.likes}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={isMenuModalVisible && !!currentMenuPhoto}
                  onRequestClose={() => setIsMenuModalVisible(false)}
                >
                  <TouchableOpacity
                    style={styles.menuModalBackground}
                    activeOpacity={1}
                    onPressOut={() => setIsMenuModalVisible(false)}
                  >
                    <View style={styles.menuModalContent}>
                      <Pressable
                        style={styles.menuOptionButton}
                        onPress={handleDeletePhoto}
                      >
                        <Ionicons name="trash-outline" size={22} color={colors.azuvagh} />
                        <Text style={styles.menuOptionText}>{t('myNewsScreen.delete') || 'Supprimer'}</Text>
                      </Pressable>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            )}
          </View>
        </Modal>

        <Text style={styles.sectionTitle}>{t('myNewsScreen.statistics') || 'Statistiques'}</Text>

        <View style={styles.statsContainer}>
          <Text style={styles.smallLabel}>{t('myNewsScreen.evaluation') || 'Évaluations'}</Text>
          <View>
            {renderHeartRating(5, evaluationData.ratings[5], colors.azuvagh)}
            {renderHeartRating(4, evaluationData.ratings[4], colors.ranjou)}
            {renderHeartRating(3, evaluationData.ratings[3], colors.green)}
            {renderHeartRating(2, evaluationData.ratings[2], colors.blou)}
            {renderHeartRating(1, evaluationData.ratings[1], colors.noir)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? 30 : 0,
      backgroundColor: colors.background,
    },
    scrollViewContent: {
      paddingHorizontal: 15,
      paddingBottom: 30,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.green,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textNormal,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textNormal,
      marginTop: 20,
      marginBottom: 10,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.green,
      paddingBottom: 5,
    },
    photosScrollView: {
      paddingVertical: 10,
      alignItems: 'center',
    },
    photoContainerPic: {
      width: 120,
      height: 120,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.ranjou,
      marginHorizontal: 5,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
      position: 'relative',
    },
    photoThumbnail: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    photoOverlay: {
      position: 'absolute',
      bottom: 5,
      left: 5,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.noir,
      borderRadius: 5,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    photoLikes: {
      color: colors.blond,
      fontSize: 12,
      marginLeft: 4,
      fontWeight: 'bold',
    },
    addPhotoButton: {
      width: 120,
      height: 120,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.ranjou,
      marginHorizontal: 5,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    addPhotoText: {
      color: colors.textNormal,
      fontSize: 12,
      fontWeight: 'bold',
      marginTop: 5,
      textAlign: 'center',
    },
    noPhotosContainer: {
      width: 250,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.surface,
      borderRadius: 8,
      marginRight: 10,
      backgroundColor: colors.surface,
    },
    noPhotosText: {
      color: colors.textu,
      fontSize: 14,
      textAlign: 'center',
    },
    centeredViewPic: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.noir,
    },
    modalViewPic: {
      margin: 20,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 25,
      alignItems: 'center',
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      width: '90%',
      maxHeight: '80%',
    },
    modalCloseIcon: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 1,
    },
    modalTitlePic: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 20,
      color: colors.textNormal,
      textAlign: 'center',
    },
    selectedImagePreview: {
      width: '100%',
      height: 200,
      resizeMode: 'contain',
      marginBottom: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.background,
    },
    modalButtonPic: {
      borderRadius: 10,
      padding: 12,
      elevation: 2,
      width: '100%',
      alignItems: 'center',
      marginTop: 10,
    },
    modalButtonPrimary: {
      backgroundColor: colors.ranjou,
    },
    modalButtonText: {
      color: colors.blond,
      fontWeight: 'bold',
      textAlign: 'center',
      fontSize: 16,
    },
    fullScreenOverlay: {
      flex: 1,
      backgroundColor: colors.noir,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullScreenImage: {
      width: '100%',
      height: '100%',
    },
    fullScreenHeader: {
      position: 'absolute',
      top: 40,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 1,
    },
    fullScreenCloseButton: {
      padding: 5,
    },
    fullScreenMenuButton: {
      padding: 5,
    },
    fullScreenFooter: {
      position: 'absolute',
      top: '50%',
      left: 15,
      transform: [{ translateY: -25 }],
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 1,
      backgroundColor: 'transparent',
    },
    socialLikeButtonColumn: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 6,
    },
    socialLikesCountUnderText: {
      color: colors.blond,
      fontSize: 15,
      fontWeight: 'bold',
      marginTop: 4,
      textAlign: 'center',
    },
    menuModalBackground: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: colors.noir,
    },
    menuModalContent: {
      backgroundColor: colors.surface,
      width: '100%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      alignItems: 'center',
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 5,
    },
    menuOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      width: '100%',
      justifyContent: 'center',
    },
    menuOptionText: {
      fontSize: 18,
      color: colors.azuvagh,
      marginLeft: 10,
      fontWeight: 'bold',
    },
    statsContainer: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.ranjou,
      padding: 15,
      marginTop: 20,
      marginBottom: 20,
    },
    smallLabel: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.textNormal,
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.green,
      paddingBottom: 5,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
    heartsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    evaluationText: {
      fontSize: 14,
      color: colors.textu,
      fontWeight: '600',
    },
  });
};
