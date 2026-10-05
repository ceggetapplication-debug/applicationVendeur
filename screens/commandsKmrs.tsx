import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl, useColorScheme, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import PremiumKmrsOffersModal from '../modals/modalPremiumsKMRS';
import { router } from 'expo-router';
import { account, databases, config, Query, Models } from '../logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';
import { Colors } from '../constants/Colors';

interface ProductInOrder {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  quantityWeightVolume: number;
  unitKey?: string;
  price: number;
  isChecked: boolean;
}

interface OrderDocument extends Models.Document {
  $id: string;
  commandId: string;
  storeId: string;
  products: ProductInOrder[];
  montantTotal: number;
  deliveryDate: string;
  pseudonyme: string;
  isServedUI: boolean;
}


export default function CommandsMgzScreen() {
  const { t } = useAppTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const styles = getStyles(theme);
  const colors = Colors[theme];

  const [orders, setOrders] = useState<OrderDocument[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = useCallback(async () => {
    if (storeId) {
      setRefreshing(true);
      await fetchOrders(storeId);
      setRefreshing(false);
    }
  }, [storeId]);

  useEffect(() => {
    const initStoreAndOrders = async () => {
      try {
        setLoading(true);
        const user = await account.get();
        const storeResp = await databases.listDocuments(
          config.databaseId,
          config.storesCollectionId,
          [Query.equal('userId', user.$id)]
        );

        if (storeResp.documents.length > 0) {
          const sid = storeResp.documents[0].$id;
          setStoreId(sid);
          await fetchOrders(sid);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur chargement magasin/commandes:', error);
        setLoading(false);
      }
    };
    initStoreAndOrders();
  }, []);

  const fetchOrders = async (sid: string) => {
    try {
      const resp = await databases.listDocuments(
        config.databaseId,
        config.ordersCollectionId,
        [Query.equal('storeId', sid), Query.orderDesc('$createdAt')]
      );

      const parsedOrders: OrderDocument[] = resp.documents.map((doc: Models.Document) => {
        let rawProducts = doc.products;
        if (typeof rawProducts === 'string') {
          try {
            rawProducts = JSON.parse(rawProducts);
          } catch (e) {
            rawProducts = [];
          }
        }

        const products: ProductInOrder[] = (rawProducts || []).map((p: any, idx: number) => ({
          id: p.id || `p_${idx}`,
          name: p.name || p.nom || '',
          brand: p.brand || p.marque || '',
          description: p.description || p.descriptionFr || p.descriptionKab || '',
          quantityWeightVolume: p.quantityWeightVolume || p.quantity || 1,
          unitKey: p.unitKey || p.unite || '',
          price: p.price || p.prix || 0,
          isChecked: p.isChecked ?? false,
        }));

        return {
          ...doc,
          $id: doc.$id,
          commandId: doc.commandId || doc.orderRef || doc.$id,
          pseudonyme: doc.pseudonyme || doc.userName || 'Client',
          montantTotal: doc.montantTotal || doc.totalPaid || 0,
          isServedUI: doc.isServedUI ?? false,
          deliveryDate: doc.deliveryDate || doc.createdAt || '',
          products,
        } as OrderDocument;
      });

      setOrders(parsedOrders);
      if (parsedOrders.length > 0) {
        setExpandedOrderId(parsedOrders[0].$id);
      }
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isPremiumOffersVisible, setIsPremiumOffersVisible] = useState<boolean>(false);

  const handlePremiumStatsPress = useCallback(() => {
    setIsPremiumOffersVisible(true);
  }, []);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const toggleProductChecked = useCallback(async (orderId: string, productId: string) => {
    let updatedProductsForDb: ProductInOrder[] | null = null;

    setOrders((prevOrders: OrderDocument[]) => {
      return prevOrders.map((order: OrderDocument) => {
        if (order.$id === orderId) {
          const updatedProducts = order.products.map((product: ProductInOrder) => {
            if (product.id === productId) {
              return { ...product, isChecked: !product.isChecked };
            }
            return product;
          });
          updatedProductsForDb = updatedProducts;
          return { ...order, products: updatedProducts };
        }
        return order;
      });
    });

    if (updatedProductsForDb) {
      try {
        await databases.updateDocument(
          config.databaseId,
          config.ordersCollectionId,
          orderId,
          { products: JSON.stringify(updatedProductsForDb) }
        );
      } catch (e) {
        console.warn('Erreur mise à jour produit coché:', e);
      }
    }
  }, []);

  const allProductsChecked = (order: OrderDocument) => {
    return order.products.every(product => product.isChecked);
  };

  const handleOrderServed = useCallback(
    async (orderId: string) => {
      const targetOrder = orders.find((o: OrderDocument) => o.$id === orderId);
      if (!targetOrder) return;

      if (allProductsChecked(targetOrder)) {
        Alert.alert(
          t('commandsMgz.orderServedTitle') || 'Commande Prête',
          t('commandsMgz.orderServedMessage', { orderRef: targetOrder.commandId }) ||
          `La commande ${targetOrder.commandId} a été marquée comme prête.`
        );

        setOrders((prevOrders: OrderDocument[]) =>
          prevOrders.map((o: OrderDocument) => (o.$id === orderId ? { ...o, isServedUI: true } : o))
        );

        try {
          await databases.updateDocument(
            config.databaseId,
            config.ordersCollectionId,
            orderId,
            { isServedUI: true }
          );
        } catch (e) {
          console.error('Erreur enregistrement statut prête:', e);
        }
      } else {
        Alert.alert(
          t('general.error'),
          t('cmndScreenCocheTt') || 'Veuillez cocher tous les articles avant de valider.'
        );
      }
    },
    [orders, t]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={styles.loadingText}> {t('loadingMgz') || 'Chargement...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.blou]} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-left" size={28} color={colors.textu} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('tab.commandsMgz')}</Text>
        </View>

        {orders.length === 0 ? (
          <Text style={styles.noOrdersText}>
            {t('commandsMgz.noOrdersYet') || 'Aucune commande reçue.'}
          </Text>
        ) : (
          orders.map((order: OrderDocument) => (
            <View key={order.$id} style={styles.orderCard}>
              <TouchableOpacity
                onPress={() => toggleExpand(order.$id)}
                style={styles.orderHeader}
              >
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderRef}>{order.commandId}</Text>
                  <Text style={styles.orderDeliveryInfo}>
                    {t('commandList.by') || 'Par'} {order.pseudonyme}
                  </Text>
                </View>
                <Ionicons
                  name={
                    expandedOrderId === order.$id
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={24}
                  color={colors.textu}
                />
              </TouchableOpacity>

              {expandedOrderId === order.$id && (
                <View style={styles.orderDetails}>
                  <Text style={styles.productsTitle}>{t('prods') || 'Produits'}</Text>
                  {order.products.map(product => {
                    const itemTotalPrice = (product.quantityWeightVolume || 1) * product.price;

                    return (
                      <View key={product.id} style={styles.productItem}>
                        <View style={styles.productTextContainer}>
                          <Text style={styles.productName}>
                            {product.quantityWeightVolume}x {product.name}
                          </Text>
                          {product.brand ? (
                            <Text style={styles.productDetails}>
                              {t('product_brand') || 'Marque'} : {product.brand}
                            </Text>
                          ) : null}
                          {product.unitKey ? (
                            <Text style={styles.productDetails}>
                              {t('qntVolPds') || 'Vol/Poids'} : {product.unitKey}
                            </Text>
                          ) : null}
                          {product.description ? (
                            <Text style={styles.productDetails}>
                              {product.description}
                            </Text>
                          ) : null}
                          <Text style={styles.productDetails}>
                            {t('commandsMgz.unitPrice') || 'Prix unitaire'} : {product.price} DZD ({itemTotalPrice} DZD)
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.checkbox}
                          onPress={() => toggleProductChecked(order.$id, product.id)}
                        >
                          <Ionicons
                            name={
                              product.isChecked
                                ? 'checkbox-outline'
                                : 'square-outline'
                            }
                            size={28}
                            color={product.isChecked ? colors.tint : colors.textu}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  <Text style={styles.totalPrice}>
                    {t('commandsMgz.totalPrice') || 'Total :'} {order.montantTotal} DZD
                  </Text>

                  {order.isServedUI ? (
                    <Text style={styles.servedText}>
                      {t('cmndready') || 'Prête ✓'}
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.markServedButton,
                        !allProductsChecked(order) &&
                        styles.markServedButtonDisabled,
                      ]}
                      onPress={() => handleOrderServed(order.$id)}
                      disabled={!allProductsChecked(order)}
                    >
                      <Text style={styles.markServedButtonText}>
                        {t('cmndready') || 'Prête'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <PremiumKmrsOffersModal
        isVisible={isPremiumOffersVisible}
        onClose={() => setIsPremiumOffersVisible(false)}
        onUpgradePress={() => setIsPremiumOffersVisible(false)}
      />
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    scrollViewContent: {
      paddingHorizontal: 15,
      paddingBottom: 30,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: colors.noir,
    },
    noOrdersText: {
      fontSize: 18,
      color: colors.noir,
      textAlign: 'center',
      marginTop: 50,
      fontWeight: '700',
    },
    orderCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
      borderLeftWidth: 5,
      borderLeftColor: colors.tint,
      elevation: 3,
      shadowColor: colors.noir,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
    },
    orderHeaderLeft: {
      flex: 1,
    },
    orderRef: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.tint,
    },
    orderDeliveryInfo: {
      fontSize: 13,
      color: colors.noir,
      marginTop: 5,
      fontWeight: '600',
    },
    orderDetails: {
      padding: 20,
      backgroundColor: colors.surface,
    },
    productsTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.tint,
      marginBottom: 10,
    },
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    productTextContainer: {
      flex: 1,
      marginRight: 10,
    },
    productName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.blou,
    },
    productDetails: {
      fontSize: 13,
      color: colors.noir,
      marginTop: 2,
    },
    totalPrice: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.ranjou,
      textAlign: 'right',
      marginTop: 15,
      marginBottom: 20,
    },
    markServedButton: {
      backgroundColor: colors.green,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      width: 'auto',
      marginTop: 10,
      alignSelf: 'center',
    },
    markServedButtonDisabled: {
      backgroundColor: colors.textu,
    },
    markServedButtonText: {
      color: colors.txtDghn,
      fontSize: 16,
      fontWeight: 'bold',
    },
    servedText: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: '800',
      color: colors.green,
      textAlign: 'center',
      padding: 10,
      borderWidth: 1,
      borderColor: colors.green,
      borderRadius: 5,
    },
    checkbox: {
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};