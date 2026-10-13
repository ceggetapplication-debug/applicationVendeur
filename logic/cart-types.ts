import { Models } from 'react-native-appwrite';


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

export interface Delivery extends Models.Document {
  userId: string;
  userLocation: string | null;
  orderRef: string;
  deliveryType: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  totalPaid: number;
  createdAt: string;
}
