
export type CommerceType =
  | "boulangerie"
  | "fruits_legumes"
  | "fruits_legumes_specialise"
  | "alimentation_generale"
  | "superette"
  | "boucherie_viande_rouge"
  | "boucherie_viande_blanche"
  | "boucherie_chevaline"
  | "fast_food"
  | "restaurant"
  | "cremerie"
  | "pizzeria_patisserie"
  | "gateaux_traditionnels"
  | "bureau_tabac"
  | "poissonerie"
  | "epicerie"
  | "produits_cosmetiques";

export type TypeVusNormaux =
  | "story"
  | "infos_magasin"
  | "produits_magasin"
  | "profil_magasin"
  | "localisation";

export type TypeVusPickup =
  | "clic_pickup";

export interface ActionVu {
  storeId: string;
  typeVu: "vusNormaux" | "vusPickup";
  actionExacte: TypeVusNormaux | TypeVusPickup;
}

export function estVusNormaux(action: TypeVusNormaux | TypeVusPickup): boolean {
  const actionsVusNormaux: TypeVusNormaux[] = [
    "story",
    "infos_magasin",
    "produits_magasin",
    "profil_magasin",
    "localisation"
  ];
  return actionsVusNormaux.includes(action as TypeVusNormaux);
}

export interface ActionVu {
  storeId: string;
  typeVu: "vusNormaux" | "vusPickup";
  actionExacte: TypeVusNormaux | TypeVusPickup;
}

export type DeliveryMode = "normal" | "rapid" | "pickup";

export interface OrderItem {
  productId: string;
  price: number;
  quantity: number;
}

export interface StoreOrder {
  storeId: string;
  commerceType: CommerceType;
  items: OrderItem[];
}

export interface Order {
  orderId: string;
  deliveryMode: DeliveryMode;
  stores: StoreOrder[];
}

export interface StoreGain {
  storeId: string;
  commerceType: CommerceType;
  totalProducts: number;
  percentage: number;
  gainCegget: number;
  gainCommercant: number;
}

export interface CeggetGainResult {
  orderId: string;
  deliveryMode: DeliveryMode;
  commissionApplied: boolean;
  storeGains: StoreGain[];
}

export interface WeeklyViewsRow {
  id: number;
  range: string;
  normaux: number;
  pickup: number;
  sommeCalcul: number;
}

export const COMMERCE_PERCENTAGES: Record<CommerceType, number> = {
  boulangerie: 1.43,
  fruits_legumes: 2.51,
  fruits_legumes_specialise: 2.54,
  alimentation_generale: 1.9,
  superette: 3.458,
  boucherie_viande_rouge: 2.83,
  boucherie_viande_blanche: 2.5,
  boucherie_chevaline: 2.6,
  fast_food: 2.51,
  restaurant: 2.8,
  cremerie: 2.55,
  pizzeria_patisserie: 2.6,
  gateaux_traditionnels: 2.45,
  bureau_tabac: 2.45,
  poissonerie: 2.2,
  epicerie: 2,
  produits_cosmetiques: 2.825,
};

function getTotalProducts(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateStoreGain(store: StoreOrder): StoreGain {
  const percentage = COMMERCE_PERCENTAGES[store.commerceType];
  const totalProducts = getTotalProducts(store.items);
  const gainCegget = (totalProducts * percentage) / 100;
  const gainCommercant = totalProducts - gainCegget;

  return {
    storeId: store.storeId,
    commerceType: store.commerceType,
    totalProducts,
    percentage,
    gainCegget,
    gainCommercant,
  };
}

export interface MultipleOf5Result {
  affiche: number;
  reste: number;
}

export function applyMultipleOf5(somme: number, resteAccumule: number): MultipleOf5Result {
  const total = somme + resteAccumule;
  const affiche = Math.floor(total / 5) * 5;
  const reste = total - affiche;

  return { affiche, reste };
}

export interface StoreViewsPayment {
  storeId: string;
  commerceType: CommerceType;
  mois: number;
  vusNormaux: number;
  vusPickup: number;
  totalVusBruts: number;
  multiplicateurPickup: number;
  equivalentVusPickup: number;
  nombreVus: number;
  percentage: number;
  sommeVus: number;
}

export function calculateViewsPayment(
  storeId: string,
  commerceType: CommerceType,
  vusNormaux: number,
  vusPickup: number,
  mois: number
): StoreViewsPayment {

  const percentage = COMMERCE_PERCENTAGES[commerceType];
  const multiplicateurPickup = 5;
  const totalVusBruts = vusNormaux + vusPickup;
  const equivalentVusPickup = vusPickup * multiplicateurPickup;
  const nombreVus = vusNormaux + equivalentVusPickup;
  const sommeVus = (percentage / 10) * nombreVus;

  return {
    storeId,
    commerceType,
    mois,
    vusNormaux,
    vusPickup,
    totalVusBruts,
    multiplicateurPickup,
    equivalentVusPickup,
    nombreVus,
    percentage,
    sommeVus,
  };
}

export function calculateCeggetGain(order: Order): CeggetGainResult {
  const commissionApplied = order.deliveryMode === "normal" || order.deliveryMode === "rapid";

  if (!commissionApplied) {
    return {
      orderId: order.orderId,
      deliveryMode: order.deliveryMode,
      commissionApplied: false,
      storeGains: [],
    };
  }

  const storeGains = order.stores.map((store) => {
    const storeGain = calculateStoreGain(store);
    return {
      ...storeGain,
      totalGainCegget: storeGain.gainCegget,
      totalGainCommercant: storeGain.gainCommercant,
    };
  });

  return {
    orderId: order.orderId,
    deliveryMode: order.deliveryMode,
    commissionApplied: true,
    storeGains,
  };
}

export function generateWeeklyViewsData(
  commerceType: CommerceType,
  totalNormaux: number,
  totalPickup: number
): WeeklyViewsRow[] {
  const percentage = COMMERCE_PERCENTAGES[commerceType] || 2;
  const multiplicateurPickup = 5;
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return [
    { id: 1, range: `01/${mm}/${yy} - 07/${mm}/${yy}`, normaux: totalNormaux * 0.4, pickup: totalPickup * 0.4 },
    { id: 2, range: `08/${mm}/${yy} - 14/${mm}/${yy}`, normaux: totalNormaux * 0.3, pickup: totalPickup * 0.3 },
    { id: 3, range: `15/${mm}/${yy} - 21/${mm}/${yy}`, normaux: totalNormaux * 0.2, pickup: totalPickup * 0.2 },
    { id: 4, range: `22/${mm}/${yy} - ${lastDay}/${mm}/${yy}`, normaux: totalNormaux * 0.1, pickup: totalPickup * 0.1 },
  ].map(item => {
    const equivalentPickup = item.pickup * multiplicateurPickup;
    const nombreVus = item.normaux + equivalentPickup;
    return {
      ...item,
      sommeCalcul: (percentage / 10) * nombreVus
    };
  });
}