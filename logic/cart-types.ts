import { Models } from 'react-native-appwrite';
import { LocalisationUser, Store, Driver, Coordonnees, TypeLivraison, ResultatCalcul, ResultatFinalDeLivraison } from '../logic/calculLivraison';


export interface Product extends Models.Document {
  id: string;
  name: string;
  marque?: string;
  prix: number;
  quantity_unit_dzd_per_kg?: number;
  valeurQuantite?: number;
  uniteQuantite?: string;
  storeId: string;
  imageUrl?: string;
}

export interface CoursesListItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface CartProductsTabProps {
  products: Product[];
  stores: Store[];
  userLocation: LocalisationUser | null;
  deliveryCost: number;
  totalCommand: number;
  calculationResult: ResultatCalcul | null;
  selectedDeliveryType: TypeLivraison | null;
  onDeliveryTypeSelect: (type: TypeLivraison) => void;
  onToggleProduct: (id: string, checked: boolean) => void;
  onOpenQuantityModal: (product: Product) => void;
  onConfirmOrder: () => void;
  MC: number;
  CC: number;
  fraisAppli: number;
  finalTotal: number;
}

export interface DeliveryStatusTabProps {
  isOrderConfirmed: boolean;
  isOrderCancelled: boolean;
  deliveryStatusMessage: string;
  currentDriver: Driver | null;
  hasDeliveryArrived: boolean;
  isDriverAcceptedOrder: boolean;
  onCancelOrder: () => void;
  onOpenQR: () => void;
  onSelectRating: (rating: number) => void;
  selectedRating: number;
}

export interface Delivery extends Models.Document {
  userId: string;
  userLocation: string | null;
  orderRef: string;
  deliveryType: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  totalPaid: number;
  createdAt: string;
}
