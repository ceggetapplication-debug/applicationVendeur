import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, FlatList, Platform, ActivityIndicator, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../appSellerColors';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { getHomeGroupes } from '../logic/homeDatat';
import ProductModal from '../modals/productModal';
import { databases, account, config, Query, Models, ID } from '../logic/appwriteConfig';
import { ProductType as RawProductType, Group, StoreType as StoreTypeData } from '../modals/modalMagasinInfos';
import { setProductPhoto, deleteFromR2, deleteProductPhoto, buildProductPhoto, uploadToR2, r2Config } from '../logic/imagesLogic';

enum StoreType {
  fastFood = 'fastFood',
  restaurant = 'restaurant',
  superette = 'superette',
  epicerie = 'epicerie',
  alimGle = 'alimGle',
  fruitsEtLegumes = 'fruitsEtLegumes',
  boucherieViandeRouge = 'boucherieViandeRouge',
  boucherieViandeBlanche = 'boucherieViandeBlanche',
  poissonerie = 'poissonerie',
  pizzeriaPatisserie = 'pizzeriaPatisserie',
  gateauxTraditionnels = 'gateauxTraditionnels',
  boulangerie = 'boulangerie',
  cremerie = 'cremerie',
  produitsCosmetiques = 'produitsCosmetiques',
  bureauTabac = 'bureauTabac',
}

interface Product {
  id: string;
  name: string;
  brand: string;
  descriptionFr: string;
  descriptionKab: string;
  price: number;
  imageUrl: string;
  category: string;
  categories: string;
  productType?: string;
  quantityValue?: number;
  quantityUnit?: string;
}

interface Category {
  id: string;
  name: string;
  productTypes?: RawProductType[];
}

interface ProductType {
  id: string;
  name: string;
}

interface ProductCardProps {
  product: Product;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  t: (key: string) => string;
}

const ProductCard = ({ product, onEdit, onDelete, t }: ProductCardProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const productStyles = getProductStyles(theme);

  return (
    <View style={productStyles.card}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={productStyles.image} />
      ) : (
        <View style={[productStyles.image, { backgroundColor: Colors[theme].surface }]} />
      )}
      <Text style={productStyles.name} numberOfLines={1}>{product.name}</Text>
      <Text style={productStyles.price}>{product.price.toFixed(2)} DZD</Text>
      <View style={productStyles.menuButtonContainer}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              t('prodAction'),
              product.name,
              [
                { text: t('modify'), onPress: () => onEdit(product.id) },
                { text: t('myNewsScreen.delete'), onPress: () => onDelete(product.id), style: 'destructive' },
                { text: t('general.cancel'), style: 'cancel' },
              ]
            )
          }
        >
          <Text style={productStyles.menuButton}>...</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface ProductTypeSectionProps {
  key?: string | number;
  category: Category;
  productType?: ProductType | RawProductType;
  products: Product[];
  onEditProduct: (productId: string) => void;
  onDeleteProduct: (productId: string) => void | Promise<void>;
  onAddProduct: (name?: string) => void;
  t: (key: string) => string;
}

const ProductTypeSection = ({
  category,
  productType,
  products,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
  t,
}: ProductTypeSectionProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const productTypeSectionStyles = getProductTypeSectionStyles(theme);
  const sectionTitle = productType ? productType.name : category.name;
  return (
    <View style={productTypeSectionStyles.container}>
      <Text style={productTypeSectionStyles.title}>{sectionTitle}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[...products, { id: 'add_button_placeholder', name: '' } as unknown as Product]}
        keyExtractor={(item: Product) => item.id}
        renderItem={({ item }: { item: Product }) => {
          if (item.id === 'add_button_placeholder') {
            return (
              <TouchableOpacity
                style={productTypeSectionStyles.addProductButtonCard}
                onPress={() => onAddProduct(sectionTitle)}
              >
                <Text style={productTypeSectionStyles.addProductButtonText}>{t('addProduct')}</Text>
                <Text style={productTypeSectionStyles.addProductButtonText}>({sectionTitle})</Text>
              </TouchableOpacity>
            );
          }
          return (
            <ProductCard
              product={item as Product}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
              t={t}
            />
          );
        }}
      />
    </View>
  );
};

interface ProductTypeRowProps {
  item: ProductType;
  category: Category;
  groupedProducts: Record<string, Product[]>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  t: (key: string) => string;
}
const CategoryButton = ({ name }: { name: string }) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  return (
    <TouchableOpacity style={styles.categoryButton}>
      <Text style={styles.categoryButtonText}>{name}</Text>
    </TouchableOpacity>
  );
};
const ProductTypeRow = ({ item, category, groupedProducts, onEdit, onDelete, onAdd, t }: ProductTypeRowProps) => (
  <ProductTypeSection
    key={item.id}
    category={category}
    productType={item}
    products={groupedProducts[item.id] || []}
    onEditProduct={onEdit}
    onDeleteProduct={onDelete}
    onAddProduct={onAdd}
    t={t}
  />
);

export default function MyStoreScreen() {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];
  const styles = getStyles(theme);
  const currentStoreType = StoreType.boucherieViandeRouge;

  const { categories, productTypes } = useMemo(() => {
    const homeGroupes = getHomeGroupes(t);
    let storeCategories: Category[] = [];
    let storeProductTypes: ProductType[] = [];

    homeGroupes.forEach((groupe: Group) => {
      const typeMatch = groupe.typesDeStore.find((type: StoreTypeData) => type.id === currentStoreType);

      if (typeMatch && typeMatch.stores?.[0]) {
        const AUTO_CATS = ['_cat_promotion', '_topVentes'];
        const rawCats: Category[] = typeMatch.stores[0].categories || [];

        storeCategories = rawCats
          .filter(c => !AUTO_CATS.some(suffix => c.id.endsWith(suffix)))
          .map(c => ({ id: c.id, name: c.name }));

        storeProductTypes = rawCats.flatMap((c: Category) =>
          (c.productTypes || []).map((pt: RawProductType) => ({
            id: pt.id,
            name: pt.name,
            category: c.id,
          }))
        );
      }
    });

    return { categories: storeCategories, productTypes: storeProductTypes };
  }, [t, currentStoreType]);

  const [products, setProducts] = useState<Product[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const router = useRouter();
  const productTypeIds = useMemo(() => productTypes.map((pt: ProductType) => pt.id).join(','), [productTypes]);
  const categoryIds = useMemo(() => categories.map((c: Category) => c.id).join(','), [categories]);
  const groupedProducts = useMemo(() => {
    return products.reduce((acc: Record<string, Product[]>, p: Product) => {
      const key = p.productType || p.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);
  const activeCategory = useMemo(() => {
    return categories.find((c: Category) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);
  const renderContent = () => {
    if (!activeCategory) return null;
    if (activeCategory.productTypes && activeCategory.productTypes.length > 0) {
      return activeCategory.productTypes.map((pt: RawProductType) => (
        <ProductTypeSection
          key={pt.id}
          category={activeCategory}
          productType={{
            id: activeCategory.id,
            name: activeCategory.name,
          }}
          products={groupedProducts[pt.id] || []}
          onEditProduct={openEdit}
          onDeleteProduct={handleDeleteProduct}
          onAddProduct={() => { setProductToEdit(null); setIsModalVisible(true); }}
          t={t}
        />
      ));
    }
    return (
      <ProductTypeSection
        category={activeCategory}
        productType={{
          id: activeCategory.id,
          name: activeCategory.name
        }}
        products={groupedProducts[activeCategory.id] || []}
        onEditProduct={openEdit}
        onDeleteProduct={handleDeleteProduct}
        onAddProduct={() => { setProductToEdit(null); setIsModalVisible(true); }}
        t={t}
      />
    );
  };

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    const initStore = async () => {
      try {
        const user = await account.get();
        const response = await databases.listDocuments(
          config.databaseId,
          config.storesCollectionId,
          [Query.equal('userId', user.$id)]
        );
        if (response.documents.length > 0) {
          const sid = response.documents[0].$id;
          setStoreId(sid);
          fetchProducts(sid);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        setIsLoading(false);
      }
    };
    initStore();
  }, []);
  const fetchProducts = async (sid: string) => {
    try {
      setIsLoading(true);
      const resp = await databases.listDocuments(config.databaseId, config.productsCollectionId, [Query.equal('storeId', sid)]);
      const mapped: Product[] = resp.documents.map((doc: Models.Document) => {
        const r2Path = `${r2Config.folders.PRODUCTS}${doc.$id}.jpg`;
        const r2DirectUrl = `${r2Config.publicUrl}/${r2Path}`;
        const photoR2 = buildProductPhoto(doc.$id);
        const finalImageUrl = doc.imageUrl || photoR2.detail || photoR2.apercu || r2DirectUrl;

        return {
          id: doc.$id,
          name: doc.name || doc.nom,
          brand: doc.brand || doc.marque || '',
          descriptionFr: doc.descriptionFr || '',
          descriptionKab: doc.descriptionKab || '',
          price: doc.price || doc.prix || 0,
          imageUrl: finalImageUrl,
          category: doc.category || doc.categories || '',
          categories: doc.categories || doc.category || '',
          productType: doc.productType || '',
          quantityValue: doc.quantityValue,
          quantityUnit: doc.quantityUnit,
        };
      });
      setProducts(mapped);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveProduct = async (data: Partial<Product>, imageUri: string | null) => {
    if (!storeId) return;
    try {
      let docId = productToEdit?.id;
      const payload = { ...data, storeId, imageUrl: imageUri || data.imageUrl };

      if (productToEdit) {
        await databases.updateDocument(config.databaseId, config.productsCollectionId, productToEdit.id, payload);
      } else {
        const newDoc = await databases.createDocument(config.databaseId, config.productsCollectionId, ID.unique(), payload);
        docId = newDoc.$id;
      }
      if (imageUri && docId) {
        const r2Path = `${r2Config.folders.PRODUCTS}${docId}.jpg`;
        const fileToUpload = { uri: imageUri, name: `${docId}.jpg`, type: 'image/jpeg' };

        await uploadToR2(r2Path, fileToUpload);
        await setProductPhoto(docId, fileToUpload);
      }

      setIsModalVisible(false);
      fetchProducts(storeId);
    } catch (error) {
      Alert.alert(t('general.error'), t('saveDataFailed'));
    }
  };
  const handleDeleteProduct = async (id: string) => {
    try {
      const r2Path = `${r2Config.folders.PRODUCTS}${id}.jpg`;
      await deleteFromR2(r2Path);
      await deleteProductPhoto(id);

      await databases.deleteDocument(config.databaseId, config.productsCollectionId, id);
      setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== id));
    } catch (error) {
      Alert.alert(t('general.error'), t('genericError'));
    }
  };
  const openEdit = (id: string) => {
    const p = products.find((prod: Product) => prod.id === id);
    if (p) {
      setProductToEdit(p);
      setIsModalVisible(true);
    }
  };
  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.green} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tab.myStore')}</Text>
        <TouchableOpacity onPress={() => { setProductToEdit(null); setIsModalVisible(true); }}>
          <Ionicons name="add-circle-outline" size={30} color={colors.tint} />
        </TouchableOpacity>
      </View>
      <View style={styles.categorysScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat: Category) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryButton, selectedCategoryId === cat.id && styles.selectedCategoryButton]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text style={[styles.categoryButtonText, selectedCategoryId === cat.id && styles.selectedCategoryButtonText]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.productsContainer}>
        {renderContent()}
      </ScrollView>
      {isModalVisible && (
        <ProductModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSave={handleSaveProduct}
          productToEdit={productToEdit}
          selectedCategories={selectedCategoryId || ''}
          productTypes={productToEdit?.productType || ''}
        />
      )}
    </View>
  );
}

const getStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? 30 : 0,
      padding: 10,
      backgroundColor: colors.background,
    },
    categorysScroll: {
      maxHeight: 50,
      marginBottom: 10,
    },
    categoryButton: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      backgroundColor: colors.surface,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedCategoryButton: {
      backgroundColor: colors.tint,
    },
    categoryButtonText: {
      color: colors.text,
    },
    selectedCategoryButtonText: {
      color: colors.textNormal,
      fontWeight: 'bold',
    },
    productsContainer: {
      flex: 1,
      marginTop: 40,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 300,
      height: 200,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
      marginTop: 40,
      marginBottom: 20,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
  });
};

const getProductStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 10,
      marginRight: 10,
      width: 160,
      height: 220,
      elevation: 3,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    image: {
      width: '100%',
      height: 100,
      borderRadius: 6,
      marginBottom: 8,
      resizeMode: 'cover',
    },
    name: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.text,
    },
    price: {
      fontSize: 14,
      color: colors.green,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    menuButtonContainer: {
      alignSelf: 'flex-end',
      marginTop: 'auto',
    },
    menuButton: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.icon,
      paddingHorizontal: 5,
    },
  });
};

const getProductTypeSectionStyles = (theme: 'light' | 'dark') => {
  const colors = Colors[theme];
  return StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
      color: colors.text,
      paddingLeft: 5,
    },
    addProductButtonCard: {
      width: 160,
      height: 220,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.green,
      borderStyle: 'dashed',
      padding: 10,
    },
    addProductButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.green,
      textAlign: 'center',
    },
  });
}