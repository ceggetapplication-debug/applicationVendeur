import React, { useState, useEffect, useCallback } from 'react';
import { Text, Appearance, View, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Linking, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { account, databases, config, Query } from '@/app/(main)/calculation-logic/appwriteConfig';
import { Models } from 'react-native-appwrite';
import { useAppTranslation } from '@/app/(main)/translations/data/translationCentralization';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '../appSellerColors';
import { DeepLinkBackend } from '@/backends/invitDeepLnkMail';
import { UserPermissions } from '../backends/invitGestionnaireBackNd';

const colorScheme = Appearance.getColorScheme() ?? 'light';
const theme = Colors[colorScheme as 'light' | 'dark'];

interface ProductInOrder {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  quantityWeightVolume: number;
  unitKey?: string;
  price: number;
  isChecked: boolean;
  storeId: string;
}

interface Order {
  id: string;
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
  const params = useLocalSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const user = await account.get();
      const userProfiles = await databases.listDocuments(config.databaseId, config.usersCollectionId, [Query.equal('userId', user.$id)]);
      if (userProfiles.total > 0) {
        const profile = userProfiles.documents[0];
        const storeId = profile.storeId as string;
        const response = await databases.listDocuments(
          config.databaseId,
          config.ordersCollectionId,
          [Query.equal('storeId', storeId), Query.orderDesc('$createdAt')]
        );
        const fetchedOrders = response.documents.map((doc: Models.Document) => {
          const productsRaw = typeof doc.products === 'string' ? JSON.parse(doc.products) : doc.products;
          const storeProducts = productsRaw.filter((p: ProductInOrder) => p.storeId === storeId);
          const storeTotal = storeProducts.reduce((sum: number, p: ProductInOrder) => sum + (p.price * p.quantityWeightVolume), 0);
          return {
            id: doc.$id,
            commandId: doc.commandId as string,
            storeId: doc.storeId as string,
            products: storeProducts,
            montantTotal: storeTotal,
            deliveryDate: doc.deliveryDate as string,
            pseudonyme: doc.pseudonyme as string,
            isServedUI: doc.isServedUI as boolean,
          };
        }) as Order[];
        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error("Erreur fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = databases.subscribe(
      [`databases.${config.databaseId}.collections.${config.ordersCollectionId}.documents`],
      (response: Models.RealtimeResponseEvent<Models.Document>) => {
        if (response.events.some((e: string) => e.includes('.create') || e.includes('.update') || e.includes('.delete'))) {
          fetchOrders();
        }
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleDeepLink = async () => {
      const { inviteId } = params;
      if (inviteId) {
        setLoading(true);
        try {
          const result = await DeepLinkBackend.processInvite({
            inviteId: inviteId as string
          }) as { success: boolean; permissions?: UserPermissions };
          if (result.success) {
          }
        } catch (e) {
          Alert.alert(t('general.error'), "Lien invalide");
        } finally {
          setLoading(false);
        }
      }
    };
    handleDeepLink();
  }, [params]);

  {/*const handlePremiumStatsPress = useCallback(() => {
    Linking.openURL('https://www.example.com/premium-offers').catch(() =>
      Alert.alert(t('general.error'), 'Impossible d\'ouvrir le lien.')
    );
  }, [t]);*/}

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev: string | null) => (prev === orderId ? null : orderId));
  };

  const toggleProductDescription = (productId: string) => {
    setExpandedProductId((prev: string | null) => (prev === productId ? null : productId));
  };

  const toggleProductChecked = useCallback((orderId: string, productId: string) => {
    setOrders((prev: Order[]) =>
      prev.map((order: Order) =>
        order.id !== orderId
          ? order
          : {
            ...order,
            products: order.products.map((p: ProductInOrder) =>
              p.id === productId ? { ...p, isChecked: !p.isChecked } : p
            ),
          }
      )
    );
  }, []);

  const allProductsChecked = (order: Order) =>
    order.products.every((p: ProductInOrder) => p.isChecked);

  const handleOrderServed = async (orderId: string) => {
    try {
      await databases.updateDocument(
        config.databaseId,
        config.ordersCollectionId,
        orderId,
        { isServedUI: true }
      );
      setOrders((prev: Order[]) =>
        prev.map((o: Order) => o.id === orderId ? { ...o, isServedUI: true } : o)
      );
      Alert.alert(t('general.success'), t('commandsMgz.orderServedTitle'));
    } catch (error) {
      Alert.alert(t('general.error'), t('manipPicError'));
    }
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={styles.loadingText}>{t('loadingMgz')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* <TouchableOpacity style={styles.statsBanner} onPress={handlePremiumStatsPress}>
          <Text style={styles.statsBannerText}>{t('commandsMgz.statsTitle')}</Text>
          <Ionicons name="lock-closed" size={16} color="#001524" />
        </TouchableOpacity> */}
        {orders.length === 0 ? (
          <Text style={styles.noOrdersText}>{t('commandsMgz.noOrdersYet')}</Text>
        ) : (
          orders.map((order: Order) => (
            <View key={order.id} style={styles.orderCard}>
              <TouchableOpacity
                onPress={() => toggleExpand(order.id)}
                style={styles.orderHeader}
              >
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderRef}>{order.commandId}</Text>
                  <Text style={styles.orderDeliveryInfo}>
                    Par {order.pseudonyme}
                  </Text>
                </View>
                <Ionicons
                  name={expandedOrderId === order.id ? 'chevron-up-outline' : 'chevron-down-outline'}
                  size={24}
                  color="#001524"
                />
              </TouchableOpacity>

              {expandedOrderId === order.id && (
                <View style={styles.orderDetails}>
                  <Text style={styles.productsTitle}>{t('prods')}</Text>

                  {order.products.map((product: ProductInOrder) => (
                    <TouchableOpacity key={product.id} style={styles.productItem} onPress={() => toggleProductDescription(product.id)} activeOpacity={1}>
                      <View style={styles.productMainRow}>
                        <Text style={styles.productName}>{product.quantityWeightVolume}x</Text>

                        <View style={styles.productTextContainer}>
                          <Text style={styles.productName}>{product.name}</Text>
                        </View>

                        <Text style={styles.productPriceText}>
                          {product.quantityWeightVolume * product.price} DZD
                        </Text>

                        <TouchableOpacity
                          style={styles.checkbox}
                          onPress={() => toggleProductChecked(order.id, product.id)}
                        >
                          <Ionicons
                            name={product.isChecked ? 'checkbox-outline' : 'square-outline'}
                            size={28}
                            color={product.isChecked ? theme.tint : theme.text}
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.productSubRow}>
                        {product.brand ? (
                          <Text style={styles.productSubText}>{product.brand}</Text>
                        ) : <View style={{ width: 100 }} />}
                        <Text style={styles.productSubText}>{product.unitKey}</Text>
                      </View>

                      {expandedProductId === product.id && product.description && (
                        <View style={styles.descriptionContainer}>
                          <Text style={styles.productSubText}>{product.description}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.totalPrice}>
                    Total : {order.montantTotal} DZD
                  </Text>
                  {order.isServedUI ? (
                    <Text style={styles.servedText}>{t('commandsMgz.orderServedTitle')}✓</Text>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.markServedButton,
                        !allProductsChecked(order) && styles.markServedButtonDisabled,
                      ]}
                      onPress={() => handleOrderServed(order.id)}
                      disabled={!allProductsChecked(order)}
                    >
                      <Text style={styles.markServedButtonText}>{t('commandsMgz.orderServedTitle')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
    padding: 10,
    backgroundColor: theme.background,
  },
  scrollViewContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surface,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.text,
  },
  orderCard: {
    backgroundColor: theme.background,
    borderRadius: 10,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.tabIconDefault,
  },
  orderRef: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  orderDeliveryInfo: {
    fontSize: 14,
    color: theme.text,
    marginTop: 4,
  },
  orderDetails: {
    padding: 15,
  },
  productsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.text,
  },
  productItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.surface,
  },
  productMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  productPriceText: {
    width: 100,
    fontSize: 16,
    fontWeight: '800',
    color: theme.tint,
    textAlign: 'right',
    marginRight: 10,
  },
  checkbox: {
    width: 40,
    alignItems: 'flex-end',
  },
  productSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingLeft: 50,
    paddingRight: 50,
  },
  productSubText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '700',
  },
  descriptionContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: theme.greyDes,
    borderRadius: 8,
    alignItems: 'center',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.tint,
    textAlign: 'right',
    marginTop: 15,
    marginBottom: 15,
  },
  markServedButton: {
    backgroundColor: theme.accent,
    padding: 15,
    borderRadius: 15,
    width: '30%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markServedButtonDisabled: {
    backgroundColor: theme.tabIconDefault,
  },
  markServedButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  servedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.green,
    textAlign: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: theme.green,
    borderRadius: 15,
    width: '30%',
    alignSelf: 'center',
    marginTop: 20,
  },
});

