import { databases, config } from './appwriteConfig';
import { Query } from 'react-native-appwrite';
import { OneSignal } from 'react-native-onesignal';
import { getProductSuggestions, loadTranslationsFromJson, productNameTranslator, ProductNameKey, normalizeText, } from './logiqueNoms';

interface AppwriteProductDoc {
    $id: string;
    name?: string;
    brand?: string;
    price?: number;
    descriptionFr?: string;
    descriptionKab?: string;
    imageId?: string;
    storeNom?: string;
    address?: string;
    uniteQuantite?: string;
    valeurQuantite?: number;
}

export interface SearchResult {
    id: string;
    name: string;
    marque: string;
    prix: string;
    descriptionFr: string;
    descriptionKab: string;
    imageId?: string;
    store?: string;
    address?: string;
    unite?: string;
    valeur?: number;
}

export interface PopularProduct {
    name: string;
    searchCount: number;
}

export class SearchLogic {
    static async performSearch(term: string, language: 'fr' | 'kab'): Promise<SearchResult[]> {
        try {
            await loadTranslationsFromJson();
            const matched = getProductSuggestions(term, language, 20);
            if (matched.length === 0) return [];
            const searchNames: string[] = [];
            matched.forEach(s => {
                const nameFr = productNameTranslator(s.productNameKey, 'fr');
                const nameKab = productNameTranslator(s.productNameKey, 'kab');
                if (nameFr) searchNames.push(nameFr);
                if (nameKab && nameKab !== nameFr) searchNames.push(nameKab);
            });

            const allResults: SearchResult[] = [];
            for (const name of searchNames) {
                try {
                    const response = await databases.listDocuments(
                        config.databaseId,
                        config.productsCollectionId,
                        [Query.contains('name', name), Query.limit(10)]
                    );
                    response.documents.forEach((doc: AppwriteProductDoc) => {
                        const alreadyIn = allResults.find(r => r.id === doc.$id);
                        if (!alreadyIn) {
                            allResults.push({
                                id: doc.$id,
                                name: doc.name ?? '',
                                marque: doc.brand ?? '',
                                prix: doc.price != null ? String(doc.price) + ' DA' : '',
                                descriptionFr: doc.descriptionFr ?? '',
                                descriptionKab: doc.descriptionKab ?? '',
                                imageId: doc.imageId,
                                store: doc.storeNom,
                                address: doc.address,
                                unite: doc.uniteQuantite,
                                valeur: doc.valeurQuantite
                            });
                        }
                    });
                } catch (_) { }
            }

            return allResults;
        } catch (e) {
            console.error('performSearch error:', e);
            return [];
        }
    }

    static async updatePopularity(term: string): Promise<void> {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.productsCollectionId,
                [Query.contains('name', normalizeText(term)), Query.limit(1)]
            );
            if (response.documents.length === 0) return;
            const doc = response.documents[0] as AppwriteProductDoc & { searchCount?: number };
            await databases.updateDocument(
                config.databaseId,
                config.productsCollectionId,
                doc.$id,
                { searchCount: (doc.searchCount ?? 0) + 1 }
            );
        } catch (e) {
            console.warn('updatePopularity error:', e);
        }
    }

    static async getPopularProducts(): Promise<PopularProduct[]> {
        try {
            const response = await databases.listDocuments(
                config.databaseId,
                config.productsCollectionId,
                [Query.orderDesc('searchCount'), Query.limit(10)]
            );
            return response.documents.map((doc: Models.Document) => {
                const product = doc as AppwriteProductDoc & { searchCount?: number };
                return {
                    name: product.name ?? '',
                    searchCount: product.searchCount ?? 0,
                };
            });
        } catch (e) {
            console.error('getPopularProducts error:', e);
            return [];
        }
    }
}

