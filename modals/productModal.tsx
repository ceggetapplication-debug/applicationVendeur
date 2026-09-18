import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, TextInput, Modal, Button, Keyboard } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { setProductPhoto, R2File } from '../../app/(main)/calculation-logic/imagesLogic';
import { ID } from '../../app/(main)/calculation-logic/appwriteConfig';
import { blockArabicInput } from '../../app/(main)/translations/data/blockerArab';
import { useAppTranslation } from '../../app/(main)/translations/data/translationCentralization';
import { getProductSuggestions, loadTranslationsFromJson, estimateInputLanguage } from '../../app/(main)/calculation-logic/logiqueNoms';

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

const PLACEHOLDER_COLOR = '#999';
const THEME_COLOR = '#15616d';
const ACTIVE_TEXT_COLOR = '#000';

const AddProductModal = ({ isVisible, onClose, onSave, productType, productToEdit, mode = 'edit', }: AddProductModalProps) => {
  const { t } = useAppTranslation();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [quantityValue, setQuantityValue] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('');
  const [price, setPrice] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<Array<{ productNameKey: string; translatedName: string; }>>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
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
    if (name && name.length > 0) {
      const handler = setTimeout(() => {
        const detectedLang = estimateInputLanguage(name);
        const langToUse = detectedLang === 'unknown' ? 'fr' : detectedLang;
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

        try {
          if (productToEdit.descriptionFr || productToEdit.descriptionKab) {
            setDescFr(productToEdit.descriptionFr || '');
            setDescKab(productToEdit.descriptionKab || '');
            if (productToEdit.descriptionFr && productToEdit.descriptionKab) setDetailsConfirmed(true);
          } else {
            setDescFr('');
            setDescKab('');
          }
        } catch (e) {
          setDescFr('');
          setDescKab('');
        }

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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('general.error'), t('photoPermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      const parsedPrice = parseFloat(price) || 0;
      const finalId = productToEdit?.id || ID.unique();
      let finalImageUrl = productToEdit?.imageUrl || '';

      if (selectedImageUri && selectedImageUri !== productToEdit?.imageUrl) {
        const r2File: R2File = {
          uri: selectedImageUri,
          name: `${finalId}.jpg`,
          type: 'image/jpeg',
        };

        const photoUrls = await setProductPhoto(finalId, r2File);
        finalImageUrl = photoUrls.apercu;
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

      if (mode === 'promo') {
        fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': 'Basic TON_REST_API_KEY_ONESIGNAL'
          },
          body: JSON.stringify({
            app_id: "TON_APP_ID_ONESIGNAL",
            contents: {
              "fr": "Le produit que vous cherchiez est enfin en promotion !",
              "kab": "Lḥağa-nni i tqellbeḍ tura tewqem !"
            },
            filters: [
              { "field": "tag", "key": `search_${finalId}`, "relation": ">=", "value": "5" }
            ]
          })
        }).catch(error => console.log("Erreur Notification OneSignal:", error));
      }

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
                  {productSuggestions.map((item: { productNameKey: string; translatedName: string; }, index: number) => (
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

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcfcfc'
  },
  modalView: {
    width: '85%',
    maxHeight: '85%',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 24,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#15616d',
    alignSelf: 'center',
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#001524',
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#15616d',
    borderRadius: 5,
    padding: 12,
    fontSize: 15,
    color: '#000',
    width: '100%'
  },
  textArea: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#15616d',
    borderRadius: 5,
    padding: 12,
    fontSize: 15,
    color: '#000',
    width: '100%',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  inputVal: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#15616d',
    borderRadius: 5,
    padding: 12,
    fontSize: 15,
    color: '#000',
    flex: 0.55
  },
  inputUnit: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#15616d',
    borderRadius: 5,
    padding: 12,
    fontSize: 15,
    color: '#000',
    flex: 0.40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  imagePickerButton: {
    backgroundColor: '#15616d',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
    width: '50%',
    alignSelf: 'center'
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  cancelButton: {
    backgroundColor: '#ff7d00',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    elevation: 5
  },
  actionButton: {
    backgroundColor: '#001524',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
    elevation: 5
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  qtyRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  dropdown: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    maxHeight: 180,
    position: 'absolute',
    bottom: 55,
    left: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#15616d',
    zIndex: 10
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15
  },
  optionActive: {
    backgroundColor: '#001524'
  },
});

export default AddProductModal;
