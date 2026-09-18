import React, { useState, useEffect, useMemo } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, FlatList, Platform, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTranslation } from '@/app/(main)/translations/data/translationCentralization';
import { getHomeGroupes } from '@/app/(main)/calculation-logic/homeDatat';
import ProductModal from '../modals/productModal';
import { useRouter } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { DeepLinkBackend } from '../backends/invitDeepLnkMail';
import { databases, account, config, Query, Models, ID } from '@/app/(main)/calculation-logic/appwriteConfig';
import { ProductType as RawProductType, Group } from '@/app/(main)/modals-others/modalMagasinInfos';

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
  return (
    <View style={productStyles.card}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={productStyles.image} />
      ) : (
        <View style={[productStyles.image, { backgroundColor: '#f0f0f0' }]} />
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
const CategoryButton = ({ name }: { name: string }) => (
  <TouchableOpacity style={styles.categoryButton}>
    <Text style={styles.categoryButtonText}>{name}</Text>
  </TouchableOpacity>
);
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
  const currentStoreType = StoreType.boucherieViandeRouge;

  const { categories, productTypes } = useMemo(() => {
    const homeGroupes = getHomeGroupes(t);
    let storeCategories: Category[] = [];
    let storeProductTypes: ProductType[] = [];

    homeGroupes.forEach((groupe: Group) => {
      const typeMatch = groupe.typesDeStore.find((type) => type.id === currentStoreType);

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
  const params = useLocalSearchParams();
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
    const handleDeepLink = async () => {
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
    handleDeepLink();
  }, [params]);

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
      const mapped: Product[] = resp.documents.map((doc: Models.Document) => ({
        id: doc.$id,
        name: doc.name || doc.nom,
        brand: doc.brand || doc.marque || '',
        descriptionFr: doc.descriptionFr || '',
        descriptionKab: doc.descriptionKab || '',
        price: doc.price || doc.prix || 0,
        imageUrl: doc.imageUrl || '',
        category: doc.category || '',
        productType: doc.productType || '',
        quantityValue: doc.quantityValue,
        quantityUnit: doc.quantityUnit,
      }));
      setProducts(mapped);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveProduct = async (data: Partial<Product>, imageUri: string | null) => {
    if (!storeId) return;
    try {
      const payload = { ...data, storeId, imageUrl: imageUri || data.imageUrl };
      if (productToEdit) {
        await databases.updateDocument(config.databaseId, config.productsCollectionId, productToEdit.id, payload);
      } else {
        await databases.createDocument(config.databaseId, config.productsCollectionId, ID.unique(), payload);
      }
      setIsModalVisible(false);
      fetchProducts(storeId);
    } catch (error) {
      Alert.alert(t('general.error'), t('saveDataFailed'));
    }
  };
  const handleDeleteProduct = async (id: string) => {
    try {
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
        <ActivityIndicator size="large" color="#15616d" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#15616d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tab.myStore')}</Text>
        <TouchableOpacity onPress={() => { setProductToEdit(null); setIsModalVisible(true); }}>
          <Ionicons name="add-circle-outline" size={30} color="#ff7d00" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:
      Platform.OS === 'android' ? 30 : 0,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  categorysScroll: {
    maxHeight: 50,
    marginBottom: 10,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#78290f',
    opacity: 0.5,
  },
  categoryButtonText: {
    color: '#333',
  },
  selectedCategoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  productsContainer: {
    flex: 1,
    marginTop: 10,
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
    color: '#000',
  },
});

const productStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fafafa',
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
    color: '#333',
  },
  price: {
    fontSize: 14,
    color: '#003',
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
    color: '#555',
    paddingHorizontal: 5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
});

const productTypeSectionStyles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    paddingLeft: 5,
  },
  addProductButtonCard: {
    width: 160,
    height: 220,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#15616d',
    borderStyle: 'dashed',
    padding: 10,
  },
  addProductButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003',
    textAlign: 'center',
  },
});
