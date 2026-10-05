import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, TextInput, Modal, Keyboard, useColorScheme } from 'react-native';
import { Colors } from '../appSellerColors';
import { launchImageLibrary } from 'react-native-image-picker';
import { setProductPhoto } from '../logic/imagesLogic';
import { ID } from '../logic/appwriteConfig';
import { blockArabicInput } from '../translations/data/blockerArab';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { getProductSuggestions, loadTranslationsFromJson, estimateInputLanguage } from '../logic/logiqueNoms';

interface Product {
  id: string;
  name: string;
  brand: string;
  descriptionFr: string;
  descriptionKab: string;
  price: number;
  imageUrl: string;
  categories: string;
  productTypes?: string;
  quantityValue?: number;
  quantityUnit?: string;
}

interface AddProductModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (product: Product | Omit<Product, 'id' | 'imageUrl'>, imageUri: string | null) => void;
  productTypes: string;
  productToEdit?: Product | null;
  selectedCategories: string;
  mode?: 'edit' | 'promo';
}

const AddProductModal = ({ isVisible, onClose, onSave, productTypes, productToEdit, selectedCategories, mode = 'edit', }: AddProductModalProps) => {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];
  const modalStyles = getModalStyles(theme);

  const PLACEHOLDER_COLOR = colors.greyDes;
  const THEME_COLOR = colors.green;
  const ACTIVE_TEXT_COLOR = colors.text;
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantityValue, setQuantityValue] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('');
  const [price, setPrice] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<Array<{ productNameKey: string; translatedName: string; }>>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const isSelectingRef = useRef(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [descFr, setDescFr] = useState('');
  const [descKab, setDescKab] = useState('');
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [showUnitList, setShowUnitList] = useState(false);

  const units = ['l', 'cl', 'ml', 'Kg', 'g', 'DZD/Kg', ' '];

  const getQuantityTypeLabel = (unit: string) => {
    const volumeUnits = ['l', 'cl', 'ml'];
    const weightUnits = ['Kg', 'g'];
    const bulkUnits = ['DZD/Kg'];
    const lowerUnit = unit.toLowerCase().trim();
    if (volumeUnits.includes(lowerUnit)) return t('general.volume');
    if (weightUnits.includes(lowerUnit)) return t('general.weight');
    if (bulkUnits.includes(lowerUnit)) return t('aLaMesure');
    return '';
  };

  useEffect(() => {
    loadTranslationsFromJson().catch(console.error);
  }, []);

  useEffect(() => {
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    if (name && name.length > 0) {
      const handler = setTimeout(() => {
        const detectedLang = estimateInputLanguage(name);
        const langToUse = detectedLang === 'unknown' ? 'kab' : detectedLang;
        try {
          const results = getProductSuggestions(name, langToUse, 10);
          setProductSuggestions(results);
          setShowProductSuggestions(results.length > 0);
        } catch (error) {
          setProductSuggestions([]);
          setShowProductSuggestions(false);
        }
      }, 300);
      return () => clearTimeout(handler);
    } else {
      setProductSuggestions([]);
      setShowProductSuggestions(false);
    }
  }, [name]);

  const handleSelectSuggestion = (translatedName: string) => {
    isSelectingRef.current = true;
    setName(translatedName);
    setProductSuggestions([]);
    setShowProductSuggestions(false);
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (isVisible) {
      if (productToEdit) {
        setName(productToEdit.name);
        setBrand(productToEdit.brand || '');
        setQuantityValue(productToEdit.quantityValue?.toString() || '');
        setQuantityUnit(productToEdit.quantityUnit || '');
        setPrice(productToEdit.price.toString());
        setSelectedImageUri(productToEdit.imageUrl || null);
        setDescFr(productToEdit.descriptionFr || '');
        setDescKab(productToEdit.descriptionKab || '');
        if (productToEdit.descriptionFr && productToEdit.descriptionKab) setDetailsConfirmed(true);
      } else {
        setName('');
        setQuantityValue('');
        setQuantityUnit('');
        setPrice('');
        setSelectedImageUri(null);
        setDescFr('');
        setDescKab('');
        setDetailsConfirmed(false);
      }
    }
  }, [isVisible, productToEdit]);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.7,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri || null);
    }
  };

  const handleSave = async () => {
    try {
      const parsedPrice = parseFloat(price) || 0;
      const finalId = productToEdit?.id || ID.unique();
      let finalImageUrl = productToEdit?.imageUrl || '';

      if (selectedImageUri && selectedImageUri !== productToEdit?.imageUrl) {
        const r2File = {
          uri: selectedImageUri,
          name: `${finalId}.jpg`,
          type: 'image/jpeg',
        };
        const photoUrls = await setProductPhoto(finalId, r2File);
        finalImageUrl = photoUrls?.apercu || '';
      }

      const productData = {
        id: finalId,
        name,
        brand: brand.trim(),
        descriptionFr: descFr.trim(),
        descriptionKab: descKab.trim(),
        price: parsedPrice,
        categories: selectedCategories,
        productTypes: productTypes,
        quantityValue: parseFloat(quantityValue) || 0,
        quantityUnit: quantityUnit.trim(),
        imageUrl: finalImageUrl,
      };

      onSave(productData, finalImageUrl);
    } catch (error) {
      console.error("Erreur Sauvegarde Product Modal:", error);
      Alert.alert(t('general.error'), t('genericError'));
    }
  };

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={modalStyles.modalTitle}>
              {productToEdit ? t('addProductModal.editTitle') : t('addProduct')}
            </Text>

            <Text style={modalStyles.label}>{t('product_name')}</Text>

            <View style={modalStyles.container100}>
              <TextInput
                style={modalStyles.input}
                placeholder={t('lookingForProd')}
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={name}
                onChangeText={(text: string) => {
                  isSelectingRef.current = false;
                  const safeText = blockArabicInput(text);
                  setName(safeText);
                  if (safeText.length === 0) setShowProductSuggestions(false);
                }}
                onFocus={() => {
                  if (productSuggestions.length > 0) setShowProductSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
              />

              {showProductSuggestions && productSuggestions.length > 0 && (
                <ScrollView
                  style={modalStyles.suggestionList}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                  {productSuggestions.map((item, index) => (
                    <TouchableOpacity
                      key={String(item.productNameKey) + index}
                      style={modalStyles.suggestionItem}
                      onPress={() => handleSelectSuggestion(item.translatedName)}
                    >
                      <Text style={modalStyles.suggestionText}>{item.translatedName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            <Text style={modalStyles.label}>{t('product_brand')}</Text>
            <TextInput
              style={modalStyles.input}
              placeholder="..."
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={brand}
              onChangeText={setBrand}
            />

            <Text style={modalStyles.label}>{t('productDetails')}</Text>

            <View style={modalStyles.container100}>
              <Text style={modalStyles.label}>Français</Text>
              <TextInput
                style={modalStyles.textArea}
                placeholder="..."
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={descFr}
                onChangeText={(text: string) => {
                  setDescFr(blockArabicInput(text));
                  setDetailsConfirmed(false);
                }}
                multiline
              />

              <Text style={modalStyles.label}>Taqvaylit</Text>
              <TextInput
                style={modalStyles.textArea}
                placeholder="..."
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={descKab}
                onChangeText={(text: string) => {
                  setDescKab(blockArabicInput(text));
                  setDetailsConfirmed(false);
                }}
                multiline
              />

              {!detailsConfirmed && (
                <TouchableOpacity
                  style={modalStyles.imagePickerButton}
                  disabled={descFr.trim().length === 0 || descKab.trim().length === 0}
                  onPress={() => setDetailsConfirmed(true)}
                >
                  <Text style={modalStyles.imagePickerButtonText}>
                    {t('general.save')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {getQuantityTypeLabel(quantityUnit) ? (
              <Text style={modalStyles.label}>{getQuantityTypeLabel(quantityUnit)} :</Text>
            ) : null}

            <View style={modalStyles.qtyRow}>
              <TextInput
                style={modalStyles.inputVal}
                placeholder={t('valeur_label')}
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={quantityValue}
                onChangeText={setQuantityValue}
                keyboardType="numeric"
              />

              <View style={modalStyles.unitContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={modalStyles.inputUnit}
                  onPress={() => setShowUnitList(!showUnitList)}
                >
                  <Text style={{ color: (quantityUnit === '' || quantityUnit === ' ') ? PLACEHOLDER_COLOR : ACTIVE_TEXT_COLOR }}>
                    {(!quantityUnit || quantityUnit === ' ') ? t('unit_label') : quantityUnit}
                  </Text>
                  <Text style={modalStyles.dropdownArrow}>▼</Text>
                </TouchableOpacity>

                {showUnitList && (
                  <View style={modalStyles.dropdown}>
                    <ScrollView nestedScrollEnabled={true}>
                      {units.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[modalStyles.optionItem, quantityUnit === u && modalStyles.optionActive]}
                          onPress={() => { setQuantityUnit(u); setShowUnitList(false); }}
                        >
                          <Text style={{
                            color: quantityUnit === u ? THEME_COLOR : ACTIVE_TEXT_COLOR,
                            fontWeight: quantityUnit === u ? 'bold' : 'normal'
                          }}>
                            {(u === ' ') ? t('unit_label') : u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {mode === 'promo' && productToEdit ? (
              <>
                <Text style={modalStyles.label}>{t('promo.ancienPrix')}</Text>
                <TextInput
                  style={[modalStyles.input, modalStyles.disabledInput]}
                  value={`${productToEdit.price.toFixed(2)} DZD`}
                  editable={false}
                />
                <Text style={modalStyles.label}>{t('promo.nouveauPrix')}</Text>
              </>
            ) : productToEdit ? (
              <Text style={modalStyles.label}>{t('modify')}</Text>
            ) : (
              <Text style={modalStyles.label}>{t('commandsMgz.unitPrice')}</Text>
            )}

            <TextInput
              style={modalStyles.input}
              placeholder="0.00"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <TouchableOpacity style={modalStyles.imagePickerButton} onPress={pickImage}>
              <Text style={modalStyles.imagePickerButtonText}>{t('importPhotoBtn')}</Text>
            </TouchableOpacity>

            {selectedImageUri && (
              <View style={modalStyles.imagePreviewContainer}>
                <View style={modalStyles.imageBorder}>
                  <Image source={{ uri: selectedImageUri }} style={modalStyles.imagePreview} />
                </View>

                <TouchableOpacity
                  onPress={pickImage}
                  style={[modalStyles.imagePickerButton, modalStyles.imageChangeButton]}>
                  <Text style={modalStyles.imagePickerButtonText}>{t('importPhotoBtn')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={modalStyles.qtyRow}>
              <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                <Text style={modalStyles.actionButtonText}>{t('general.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.actionButton} onPress={handleSave}>
                <Text style={modalStyles.actionButtonText}>
                  {productToEdit ? t('modify') : t('general.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const getModalStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
      width: '90%',
      maxHeight: '90%',
      backgroundColor: colors.background,
      borderRadius: 15,
      padding: 20,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.green,
      textAlign: 'center',
      marginBottom: 15,
    },
    label: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 10,
      marginBottom: 5,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.surface,
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.surface,
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      minHeight: 80,
      textAlignVertical: 'top',
      color: colors.text,
      backgroundColor: colors.surface,
    },
    container100: {
      width: '100%',
    },
    suggestionList: {
      maxHeight: 150,
      borderWidth: 1,
      borderColor: colors.surface,
      borderRadius: 8,
      marginTop: 5,
      backgroundColor: colors.surface,
    },
    suggestionItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
    },
    suggestionText: {
      fontSize: 16,
      color: colors.text,
    },
    qtyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    inputVal: {
      borderWidth: 1,
      borderColor: colors.surface,
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      width: '55%',
      color: colors.text,
      backgroundColor: colors.surface,
    },
    unitContainer: {
      width: '40%',
    },
    inputUnit: {
      borderWidth: 1,
      borderColor: colors.surface,
      borderRadius: 8,
      padding: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    dropdownArrow: {
      fontSize: 12,
      color: colors.text,
    },
    dropdown: {
      position: 'absolute',
      top: 50,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.surface,
      borderRadius: 8,
      zIndex: 1000,
      maxHeight: 200,
    },
    optionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
    },
    optionActive: {
      backgroundColor: colors.accent,
    },
    imagePickerButton: {
      backgroundColor: colors.green,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 15,
    },
    imagePickerButtonText: {
      color: colors.textNormal,
      fontWeight: 'bold',
      fontSize: 16,
    },
    imagePreviewContainer: {
      alignItems: 'center',
      marginTop: 15,
    },
    imageBorder: {
      borderWidth: 1,
      borderColor: colors.surface,
      borderRadius: 10,
      overflow: 'hidden',
    },
    imagePreview: {
      width: 200,
      height: 200,
    },
    imageChangeButton: {
      marginTop: 10,
      backgroundColor: colors.greyDes,
    },
    disabledInput: {
      backgroundColor: colors.surface,
      color: colors.greyDes,
    },
    cancelButton: {
      backgroundColor: colors.tint,
      padding: 12,
      borderRadius: 8,
      width: '45%',
      alignItems: 'center',
    },
    actionButton: {
      backgroundColor: colors.green,
      padding: 12,
      borderRadius: 8,
      width: '45%',
      alignItems: 'center',
    },
    actionButtonText: {
      color: colors.textNormal,
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
};

export default AddProductModal;
