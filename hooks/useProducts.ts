import type { Product } from '@/types';
import { DB_CONFIG } from '@/utils/vars';
import { databases } from '@/services/api/init';
import { useState, useEffect, useCallback } from 'react';
import { Models, Query } from 'react-native-appwrite';


interface ProductDocument extends Models.Document {
    name?: string;
    price?: number;
    imageUrl?: string;
}

export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            const response = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.PRODUCTS_COLLECTION_ID,
                [Query.orderDesc('$createdAt')]
            );
            setProducts(response.documents.map((doc: ProductDocument) => ({
                $id: doc.$id,
                name: doc.name || '',
                price: doc.price || 0,
                imageUrl: doc.imageUrl || ''
            })));
        } catch (error) {
            console.log('Erreur lors de la récupération des produits:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProducts();
    }, [fetchProducts]);

    return { products, loading, refreshing, onRefresh };
};