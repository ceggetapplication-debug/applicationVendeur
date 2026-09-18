import React, { useState, useEffect, useMemo } from 'react';
import { calculateCeggetGain, COMMERCE_PERCENTAGES, applyMultipleOf5, CommerceType, generateWeeklyViewsData, DeliveryMode } from '../logic/gainSellerLogic';
import { account, databases, config, Query } from '@/app/(main)/calculation-logic/appwriteConfig';
import { Models } from 'react-native-appwrite';
import { } from '../logic/gainSellerLogic';
import { router, useLocalSearchParams } from 'expo-router';
import { DeepLinkBackend } from '../backends/invitDeepLnkMail';
import { Text, View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAppTranslation } from '@/app/(main)/translations/data/translationCentralization';

interface StoreDocument extends Models.Document {
  $id: string;
  type: CommerceType;
  vusNormaux?: number;
  vusPickup?: number;
  userId: string;
}

interface OrderDocument extends Models.Document {
  $id: string;
  commandId: string;
  storeId: string;
  deliveryMode?: "normal" | "rapid" | "pickup";
  deliveryType?: "normal" | "rapid" | "pickup";
  products: Array<{
    id: string;
    name: string;
    quantityWeightVolume: number;
    price: number;
    unitKey?: string;
    isChecked: boolean;
  }>;
  montantTotal: number;
  deliveryDate: string;
  pseudonyme: string;
  isServedUI: boolean;
}

interface ProductInOrder {
  id: string;
  name: string;
  quantityWeightVolume: number;
  unitKey?: string;
  price: number;
  isChecked: boolean;
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

interface ProductForDailyRevenue {
  name: string;
  quantityWeightVolume?: number;
  unitKey?: string;
  price?: number;
}

interface DailyRevenueMontantCmd {
  totalAmount: number;
  productAmounts: number[];
}

interface DailyRevenueItem {
  id: string;
  products: ProductForDailyRevenue[];
  montantCmd: DailyRevenueMontantCmd;
  yourPart: number;
  ceggetPart: number;
  rawDate: string;
}

interface WeeklyRevenueItem {
  day: string;
  nombre: number;
  montant: number;
  yourPart: number;
  ceggetPart: number;
}

export default function RecetteScreen() {
  const { t } = useAppTranslation();
  const params = useLocalSearchParams();
  const [orders, setOrders] = useState<OrderDocument[]>([]);
  const [storeData, setStoreData] = useState<StoreDocument | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'views'>('daily');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const lastPaymentDate = '-';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const user = await account.get();
        const storeResp = await databases.listDocuments(config.databaseId, config.storesCollectionId, [Query.equal('userId', user.$id)]);

        if (storeResp.documents.length > 0) {
          const storeDoc = storeResp.documents[0] as StoreDocument;
          setStoreData(storeDoc);
          const ordersResp = await databases.listDocuments(config.databaseId, config.ordersCollectionId, [Query.equal('storeId', storeDoc.$id)]);
          setOrders(ordersResp.documents as OrderDocument[]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const stats = useMemo(() => {
    if (!storeData || orders.length === 0) return null;

    const dailyData: DailyRevenueItem[] = orders.map((o: OrderDocument) => {
      const res = calculateCeggetGain({
        orderId: o.commandId,
        deliveryMode: (o.deliveryType || o.deliveryMode || 'normal') as DeliveryMode,
        stores: [{
          storeId: storeData.$id,
          commerceType: storeData.type,
          items: o.products.map((p: ProductInOrder) => ({
            productId: p.id,
            price: p.price,
            quantity: p.quantityWeightVolume
          }))
        }]
      });
      const storeGain = res.storeGains[0];

      return {
        id: o.commandId,
        products: o.products.map((p: ProductInOrder) => ({
          name: p.name,
          quantityWeightVolume: p.quantityWeightVolume,
          unitKey: p.unitKey,
          price: p.price
        })),
        montantCmd: {
          totalAmount: storeGain.totalProducts,
          productAmounts: o.products.map((p: ProductInOrder) => p.price)
        },
        yourPart: storeGain.gainCommercant,
        ceggetPart: storeGain.gainCegget,
        rawDate: o.deliveryDate
      };
    });

    const weekMap: Record<string, WeeklyRevenueItem> = {};

    dailyData.forEach(item => {
      const dateObj = item.rawDate ? new Date(item.rawDate) : new Date();
      const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
      const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

      if (!weekMap[capitalizedDay]) {
        weekMap[capitalizedDay] = {
          day: capitalizedDay,
          nombre: 0,
          montant: 0,
          yourPart: 0,
          ceggetPart: 0
        };
      }

      weekMap[capitalizedDay].nombre += 1;
      weekMap[capitalizedDay].montant += item.montantCmd.totalAmount;
      weekMap[capitalizedDay].yourPart += item.yourPart;
      weekMap[capitalizedDay].ceggetPart += item.ceggetPart;
    });

    return {
      dailyData,
      weeklyData: Object.values(weekMap),
      totalDaily: dailyData.reduce((sum, item) => sum + item.yourPart, 0),
      totalWeekly: Object.values(weekMap).reduce((sum, item) => sum + item.yourPart, 0)
    };
  }, [orders, storeData]);

  const viewsData = storeData ? generateWeeklyViewsData(storeData.type as CommerceType, storeData.vusNormaux || 0, storeData.vusPickup || 0) : [];
  const totalNormaux = viewsData.reduce((acc, curr) => acc + curr.normaux, 0);
  const totalPickup = viewsData.reduce((acc, curr) => acc + curr.pickup, 0);
  const totalSomme = viewsData.reduce((acc, curr) => acc + curr.sommeCalcul, 0);

  return (
    <View style={[styles.screenContainer, { backgroundColor: '#f5f5f5' }]}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        <View style={styles.tabsContainer}>
          <Text
            onPress={() => setActiveTab('daily')}
            style={activeTab === 'daily' ? styles.tabActive : styles.tabInactive}
          >
            {t('revenueScreen.dailyRevenue')}
          </Text>
          <Text
            onPress={() => setActiveTab('weekly')}
            style={activeTab === 'weekly' ? styles.tabActive : styles.tabInactive}
          >
            {t('revenueScreen.weeklyRevenue')}
          </Text>
          <Text
            onPress={() => setActiveTab('views')}
            style={activeTab === 'views' ? styles.tabActive : styles.tabInactive}
          >
            {t('views')}
          </Text>
        </View>

        {activeTab !== 'views' && (
          <View style={styles.tableContainer}>
            <View style={styles.tableRowHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'left', paddingLeft: 10 }]}>
                {activeTab === 'daily' ? t('srvdCmnd') : t('revenueScreen.days')}
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>
                {activeTab === 'daily' ? t('Items') : t('revenueScreen.count')}
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
                {t('montantKrs')}
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
                {t('yrPart')}
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>
                {t('cgtPart')}
              </Text>
            </View>

            {(activeTab === 'daily' ? stats?.dailyData : stats?.weeklyData)?.map((item: DailyRevenueItem | WeeklyRevenueItem, idx: number) => (
              <View key={'id' in item ? item.id : idx} onTouchStart={() => setExpandedOrderId(activeTab === 'daily' && 'id' in item ? (expandedOrderId === item.id ? null : item.id) : null)} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 3, flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <Text style={styles.commandIdText}>{activeTab === 'daily' ? (item as DailyRevenueItem).id : (item as WeeklyRevenueItem).day}</Text>
                  <Text style={styles.tableCell}>{activeTab === 'daily' ? (item as DailyRevenueItem).products.length : (item as WeeklyRevenueItem).nombre}</Text>
                </View>

                <View style={[styles.tableCell, { flex: 1.2 }]}>
                  <Text>{'montantCmd' in item ? item.montantCmd.totalAmount.toFixed(2) : item.montant.toFixed(2)}</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'center' }]}>
                  {item.yourPart.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'center' }]}>
                  {item.ceggetPart.toFixed(2)}
                </Text>
                {activeTab === 'daily' && expandedOrderId === (item as DailyRevenueItem).id && (
                  <View style={styles.infoBlock}>
                    {(item as DailyRevenueItem).products.map((p: ProductForDailyRevenue, i: number) => (
                      <Text key={i} style={styles.productItem}> - {p.name} : {p.price?.toFixed(2)} DZD</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
        {activeTab === 'daily' && (
          <>
            <View style={styles.totalRowBelowTable}>
              <Text style={styles.totalText}>
                {t('revenueScreen.dailyTotal')} : {stats?.totalDaily.toFixed(2)} DZD
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoText}>
                {t('txtgaininfokmrs', { percentage: (100 - COMMERCE_PERCENTAGES[storeData!.type as CommerceType]).toFixed(2) })}
              </Text>
            </View>
          </>
        )}
        {activeTab === 'weekly' && (
          <>
            <View style={styles.totalRowBelowTable}>
              <Text style={styles.totalText}>
                {t('revenueScreen.weeklyTotal')} : {stats?.totalWeekly.toFixed(2)} DZD
              </Text>
              <Text style={styles.totalNetText}>
                {t('totalNetMultiple5')} : {applyMultipleOf5(stats?.totalWeekly || 0, 0).affiche} DZD
              </Text>
            </View>
            <Text style={styles.lastPaymentText}>
              {t('revenueScreen.lastPaymentDate')}{lastPaymentDate}
            </Text>
          </>
        )}
        {activeTab === 'views' && (
          <>

            <View style={styles.tableRowTotal}>
              <Text style={[styles.commandIdText, styles.boldText, { flex: 2 }]}>{t('totalUpper')}</Text>
              <Text style={[styles.tableCell, styles.boldText, { flex: 1 }]}>{totalNormaux.toFixed(0)}</Text>
              <Text style={[styles.tableCell, styles.boldText, { flex: 1 }]}>{totalPickup.toFixed(0)}</Text>
              <Text style={[styles.tableCell, styles.boldText, { flex: 1.2, color: '#ff7d00' }]}>{totalSomme.toFixed(2)} DZD</Text>
            </View>
            <View style={styles.totalRowBelowTable}>
              <Text style={styles.totalText}>
                {t('totalDesVues')} : {totalSomme.toFixed(2)} DZD
              </Text>
              <Text style={styles.totalNetText}>
                {t('finalTotal')} : {applyMultipleOf5(totalSomme, 0).affiche} DZD
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingTop: 10,
    paddingHorizontal: 5,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#78290f',
    paddingBottom: 5,
  },
  tableContainer: {
    backgroundColor: '#f1f1f1',
    overflow: 'hidden',
    marginBottom: 5,
    marginTop: 5,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#78290f',
  },

  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#ffecd1',
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 0,
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    borderBottomWidth: 1.2,
    borderBottomColor: '#ffecd1',
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78290f',
  },
  commandIdText: {
    flex: 1.5,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffecd1',
    paddingLeft: 5,
    textAlign: 'left',
  },
  productItem: {
    fontSize: 11,
    color: '#333',
    marginLeft: 10,
    lineHeight: 16,
    textAlign: 'left',
  },
  totalRowBelowTable: {
    backgroundColor: 'transparent',
    borderTopWidth: 3,
    borderTopColor: '#e0dfdf',
    marginTop: 0,
    marginBottom: 15,
    paddingVertical: 10,
    textAlign: 'left',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  infoBlock: {
    backgroundColor: 'transparent',
    padding: 15,
    marginBottom: 0,
    marginTop: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#000',
    marginBottom: 2,
    lineHeight: 18,
  },
  lastPaymentText: {
    fontSize: 13,
    color: '#000',
    textAlign: 'left',
    marginTop: 15,
    fontStyle: 'italic',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 15
  },
  tabActive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#15616d',
    borderBottomWidth: 2,
    borderBottomColor: '#ff7d00',
    paddingBottom: 5
  },
  tabInactive: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e8e9eb',
    opacity: 0.5
  },
  totalNetText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#78290f',
    marginTop: 8
  },
  tableRowTotal: {
    flexDirection: 'row',
    paddingVertical: 18,
    backgroundColor: 'transparent',
    borderTopWidth: 2,
    borderTopColor: '#000',
    alignItems: 'center'
  },
  boldText: {
    fontWeight: 'bold'
  },
  orangeText: {
    color: '#003'
  },

});
