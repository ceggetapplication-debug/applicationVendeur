import type { Favorite, Product } from '@/types';
import { DB_CONFIG } from '@/utils/vars';
import { databases } from '@/services/api/init';
import { useState, useCallback } from 'react';

import { Alert } from 'react-native';
import { ID, Query } from 'react-native-appwrite';

export const useFavorites = (user: { $id: string }) => {
    const [favorites, setFavorites] = useState<Favorite[]>([]);

    const toggleFavorite = useCallback(async (product: Product) => {
        try {
            const existingFavorite = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.FAVORITES_COLLECTION_ID,
                [
                    Query.equal('userId', user.$id),
                    Query.equal('productId', product.$id)
                ]
            );

            if (existingFavorite.documents.length > 0) {
                await databases.deleteDocument(
                    DB_CONFIG.DATABASE_ID,
                    DB_CONFIG.FAVORITES_COLLECTION_ID,
                    existingFavorite.documents[0].$id
                );
                Alert.alert('Removed', 'Product removed from favorites');
            } else {
                await databases.createDocument(
                    DB_CONFIG.DATABASE_ID,
                    DB_CONFIG.FAVORITES_COLLECTION_ID,
                    ID.unique(),
                    {
                        userId: user.$id,
                        productId: product.$id,
                        productName: product.name,
                        productPrice: product.price,
                        productImage: product.imageUrl,
                        createdAt: new Date().toISOString()
                    }
                );
                Alert.alert('Added', 'Product added to favorites!');
            }
        } catch (error) {
            console.log('Error toggling favorite:', error);
            Alert.alert('Error', 'Failed to update favorites');
        }
    }, [user.$id]);

    return { toggleFavorite };
};