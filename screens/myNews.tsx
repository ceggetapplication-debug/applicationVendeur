import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Modal, Pressable, Linking, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { DeepLinkBackend } from '../backends/invitDeepLnkMail';
import { sizes, uploadToR2, sharePhoto, getStoreSharedPhotos, deleteSharedPhoto } from '../../app/(main)/calculation-logic/imagesLogic';
import { useAppTranslation } from '../../app/(main)/translations/data/translationCentralization';
import { r2Config, databases, config, Query, account } from '../../app/(main)/calculation-logic/appwriteConfig';

const s = sizes();

interface Photo {
  id: string;
  uri: string;
  likes: number;
}

export default function MyNewsScreen() {
  const { t } = useAppTranslation();
  const params = useLocalSearchParams();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPickerModalVisible, setPickerModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [fullScreenPhoto, setFullScreenPhoto] = useState<Photo | null>(null);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [currentMenuPhoto, setCurrentMenuPhoto] = useState<Photo | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [storeId, setStoreId] = useState<string>('');
  const [merchantId, setMerchantId] = useState<string>('');
  const [likesCount, setLikesCount] = useState<number>(0);


  const fetchNewsData = useCallback(async () => {
    try {
      if (!storeId) return;

      const storeData = await databases.getDocument(
        config.databaseId,
        config.storesCollectionId,
        storeId
      );
      setFollowersCount(storeData.followers || 0);
      setLikesCount(storeData.likes || 0);

      const loadedFromDB = await getStoreSharedPhotos(storeId);
      const mappedPhotos: Photo[] = loadedFromDB.map((p) => ({
        id: p.$id,
        uri: p.vignette,
        likes: 0
      }));

      setPhotos(mappedPhotos);
    } catch (error) {
      console.error(error);
    }
  }, [storeId]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') Alert.alert(t('general.error'), t('photoPermissionDenied'));

        const user = await account.get();
        setMerchantId(user.$id);

        const res = await databases.listDocuments(config.databaseId, config.storesCollectionId, [
          Query.equal('userId', user.$id)
        ]);

        if (res.documents.length > 0) {
          setStoreId(res.documents[0].$id);
        }
      } catch (error) {
        console.error(error);
      }
    };
    initApp();
  }, [t, fetchNewsData]);

  useEffect(() => {
    const handleCaptureInvite = async () => {
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
    handleCaptureInvite();
  }, [params]);

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

  const closeImportModal = () => {
    setPickerModalVisible(false);
    setSelectedImageUri(null);
  };

  const handleProcessAndAddPhoto = async () => {
    if (!selectedImageUri) return;

    try {
      const fileName = `news_${Date.now()}.jpg`;
      const newPhoto = await sharePhoto(
        { uri: selectedImageUri, name: fileName, type: 'image/jpeg' },

        merchantId,
        storeId
      );

      setPhotos((prev: Photo[]) => [{ id: newPhoto.$id, uri: newPhoto.vignette, likes: 0 }, ...prev]);
      closeImportModal();
      Alert.alert(t('myNewsScreen.photoImported'));

    } catch (error) {
      console.error("Erreur R2 :", error);
      Alert.alert(t('general.error'), t('genericError'));
    }
  };

  const openFullScreenPhoto = (photo: Photo) => {
    setFullScreenPhoto(photo);
  };

  const closeFullScreenPhoto = () => {
    setFullScreenPhoto(null);
    setIsMenuModalVisible(false);
    setCurrentMenuPhoto(null);
  };

  const handleLike = async (photoId: string) => {
    setPhotos((prev: Photo[]) =>
      prev.map((photo: Photo) =>
        photo.id === photoId ? { ...photo, likes: (photo.likes || 0) + 1 } : photo
      )
    );

    try {
      const photoDoc = await databases.getDocument(config.databaseId, 'col_shared', photoId);
      await databases.updateDocument(config.databaseId, 'col_shared', photoId, {
        likes: (photoDoc.likes || 0) + 1
      });
    } catch (error) {
      console.error(error);
    }
  };


  const openPhotoMenu = (photo: Photo) => {
    setCurrentMenuPhoto(photo);
    setIsMenuModalVisible(true);
  };
  const closeMenu = () => {
    setIsMenuModalVisible(false);
    setCurrentMenuPhoto(null);
  };

  const handleDeletePhoto = useCallback(() => {
    if (currentMenuPhoto) {
      Alert.alert(
        t('myNewsScreen.deletePhoto'),
        t('myNewsScreen.deleteConfirm'),
        [
          { text: t('general.cancel'), style: 'cancel' },
          {
            text: t('myNewsScreen.delete'),
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteSharedPhoto(currentMenuPhoto.id, currentMenuPhoto.id);

                setPhotos((prev: Photo[]) => prev.filter((p: Photo) => p.id !== currentMenuPhoto.id));

                closeMenu();
              } catch (error) {
                console.error(error);
                Alert.alert(t('general.error'), t('myNewsScreen.deleteError'));
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  }, [currentMenuPhoto, t, closeMenu]);


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>{t('myNewsScreen.statistics')}</Text>
          <Text style={styles.followersCountText}>
            {t('myNewsScreen.totalFollowers')} {followersCount}
          </Text>
          <Text style={styles.followersCountText}>
            {t('myNewsScreen.totalLikes')} {likesCount}
          </Text>
        </View>

        <View style={styles.photosGridContainer}>
          <Text style={styles.sectionTitle}>{t('myNewsScreen.myPhotos')}</Text>
          {photos.length === 0 ? (
            <View style={styles.noPhotosContainer}>
              <Text style={styles.noPhotosText}>{t('myNewsScreen.noPhotosYet')}</Text>
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
                  <Ionicons name="heart" size={20} color="#d30202" />
                  <Text style={[styles.photoLikes, { fontSize: 15 }]}>{photo.likes}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
            <Ionicons name="add-circle-outline" size={35} color="#78290f" />
            <Text style={styles.addPhotoText}>{t('myNewsScreen.addPhoto')}</Text>
          </TouchableOpacity>
        </View>
        <Modal
          animationType="fade"
          transparent={true}
          visible={isPickerModalVisible}
          onRequestClose={closeImportModal}
        >
          <View style={styles.fullScreenOverlay}>
            {selectedImageUri && (
              <>
                <Image
                  source={{ uri: selectedImageUri }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
                <View style={styles.fullScreenHeader}>
                  <TouchableOpacity
                    onPress={closeImportModal}
                    style={styles.fullScreenCloseButton}
                  >
                    <Ionicons name="close" size={35} color="#ffecd1" />
                  </TouchableOpacity>
                </View>
                <View style={styles.shareButtonContainer}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleProcessAndAddPhoto}
                  >
                    <Ionicons name="share-outline" size={24} color="#fff" />
                    <Text style={styles.shareButtonText}>{t('myNewsScreen.addPhotoToMyNews')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
                    <Ionicons name="close" size={35} color="#ffecd1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openPhotoMenu(fullScreenPhoto)}
                    style={styles.fullScreenMenuButton}
                  >
                    <Ionicons name="ellipsis-vertical" size={30} color="#ffecd1" />
                  </TouchableOpacity>
                </View>

                <View style={styles.photoOverlay}>
                  <TouchableOpacity
                    onPress={() => handleLike(fullScreenPhoto.id)}
                    style={styles.fullScreenLikeButton}
                  >
                    <Ionicons name="heart" size={28} color="#d30202" />
                    <Text style={[styles.photoLikes, { fontSize: 24 }]}>
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
                        <Ionicons name="trash-outline" size={24} color="#dc3545" />
                        <Text style={styles.menuOptionText}>
                          {t('myNewsScreen.delete')}
                        </Text>
                      </Pressable>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </>
            )}
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#78290f',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#ff7d00',
    paddingBottom: 5,
  },
  photosGridContainer: {
    paddingVertical: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  photoContainerPic: {
    width: s.PRODUCT_APERCU_W,
    height: s.PRODUCT_APERCU_H,
    marginBottom: 15,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoLikes: {
    color: '#ffecd1',
    fontWeight: '900',
    marginLeft: 5,
    textShadowColor: '#000000',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  addPhotoButton: {
    width: s.PRODUCT_APERCU_W,
    height: s.PRODUCT_APERCU_H,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#15616d',
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  addPhotoText: {
    color: '#001524',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  noPhotosContainer: {
    width: s.PRODUCT_APERCU_W,
    height: s.PRODUCT_APERCU_H,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  noPhotosText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
  centeredViewPic: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalViewPic: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    maxHeight: '80%',
  },
  modalCloseIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitlePic: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#001524',
    textAlign: 'center',
  },
  selectedImagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
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
    backgroundColor: '#ff7d00',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
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
    backgroundColor: '#001524',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fullScreenCloseButton: {
    padding: 5,
  },
  fullScreenMenuButton: {
    padding: 5,
  },
  fullScreenFooter: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  fullScreenLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  fullScreenLikesText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  menuModalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  likesGridOverlay: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuModalContent: {
    backgroundColor: '#fff',
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
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
    color: '#000',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  smallLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#001524',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  followersLabel: {
    marginTop: 15,
  },
  followersCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#001524',
    textAlign: 'left',
    marginTop: 10,
    marginLeft: 10,
  },
});