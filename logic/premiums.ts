export enum PremiumUtilisateur {
    Aucun = 'aucunUtil',
    Level1 = 'premiumUtil1',
    Level2 = 'premiumUtil2',
    ListeCourses1Mois = 'premiumUtilListeCourses1Mois',
    ListeCourses6Mois = 'premiumUtilListeCourses6Mois',
    ListeCourses12Mois = 'premiumUtilListeCourses12Mois',
}

export enum PremiumCommercant {
    Aucun = 'aucunCmrs',
    Niveau1 = 'premiumCmrst1',
    Niveau2 = 'premiumCmrs2',
    Niveau3 = 'premiumCmrs3',
    Gestionnaire3 = 'premiumCmrsGestionnaire3',
    Gestionnaire4Recette = 'premiumCmrsGestionnaire4Recette',
}

export interface AddressRuleDefinition {
    isPaymentApplicable: boolean;
    freeAddressLimit: number;
    blockSize: number;
    costPerBlock: number;
}

export interface AddressPaymentBaseRule {
    paymentRequired: boolean;
    addressesPerBlock: number;
    costPerBlock: number;
}

export const defaultAddressPaymentRule: AddressPaymentBaseRule = {
    paymentRequired: true,
    addressesPerBlock: 8,
    costPerBlock: 1000.00,
};

export function purchaseTopDisplayPlacement(merchantId: string, currentHighestBid: number): { amountToPay: number; paymentProcess: 'external' } {
    const MINIMUM_STARTING_PRICE = 1000.00;
    const BID_INCREMENT_PERCENTAGE = 0.20;

    let nextCalculatedBid = MINIMUM_STARTING_PRICE;
    if (currentHighestBid >= MINIMUM_STARTING_PRICE) {
        nextCalculatedBid = currentHighestBid * (1 + BID_INCREMENT_PERCENTAGE);
    }

    const floorValue = Math.floor(nextCalculatedBid);
    const lastDigit = floorValue % 10;

    let amountRequired = floorValue;
    if (lastDigit === 0 || lastDigit === 5) {
        amountRequired = floorValue;
    } else if (lastDigit >= 1 && lastDigit <= 4) {
        amountRequired = floorValue - lastDigit;
    } else {
        amountRequired = floorValue + (10 - lastDigit);
    }

    return {
        amountToPay: amountRequired,
        paymentProcess: 'external',
    };
}

export interface FollowerDemographics {
    genreDistribution: { [key: string]: number };
    ageDistribution: { range: string; count: number }[];
    mostLikedImages: string[];
}

export interface ProductSalesEntry {
    productId: string;
    productName: string;
    salesCount: number;
}

export interface OrderStatistics {
    mostOrderedProductsByMonth?: { month: string; products: ProductSalesEntry[] }[];
    mostOrderedProductsByDay?: { dayOfWeek: string; products: ProductSalesEntry[] }[];
    mostOrderedProductsBySeason?: { season: string; products: ProductSalesEntry[] }[];
    mostOrderedProductsOverall?: ProductSalesEntry[];
}

export interface CommercantPremiumDetails {
    level: PremiumCommercant;
    subscriptionDurationMonths: number;
    hasFollowerAnalytics: boolean;
    hasOrderStatistics: boolean;
    canAccessTrendAnalysis: boolean;
    canAccessEstimations: boolean;
    canAccessMyStore: boolean;
    canAccessMyNews: boolean;
    canAccessCommands: boolean;
    canAccessRecette: boolean;
    maxManagers: number;
    canManagersAccessRecette: boolean;
}

export function getCommercantPremiumFeatures(level: PremiumCommercant): CommercantPremiumDetails {
    switch (level) {
        case PremiumCommercant.Niveau1:
            return {
                level: PremiumCommercant.Niveau1,
                subscriptionDurationMonths: 1,
                hasFollowerAnalytics: true,
                hasOrderStatistics: true,
                canAccessTrendAnalysis: true,
                canAccessEstimations: true,
                canAccessMyStore: true,
                canAccessMyNews: true,
                canAccessCommands: true,
                canAccessRecette: true,
                maxManagers: 1,
                canManagersAccessRecette: false,
            };
        case PremiumCommercant.Niveau2:
            return {
                level: PremiumCommercant.Niveau2,
                subscriptionDurationMonths: 6,
                hasFollowerAnalytics: true,
                hasOrderStatistics: true,
                canAccessTrendAnalysis: true,
                canAccessEstimations: true,
                canAccessMyStore: true,
                canAccessMyNews: true,
                canAccessCommands: true,
                canAccessRecette: true,
                maxManagers: 1,
                canManagersAccessRecette: false,
            };
        case PremiumCommercant.Niveau3:
            return {
                level: PremiumCommercant.Niveau3,
                subscriptionDurationMonths: 12,
                hasFollowerAnalytics: true,
                hasOrderStatistics: true,
                canAccessTrendAnalysis: true,
                canAccessEstimations: true,
                canAccessMyStore: true,
                canAccessMyNews: true,
                canAccessCommands: true,
                canAccessRecette: true,
                maxManagers: 1,
                canManagersAccessRecette: false,
            };
        case PremiumCommercant.Gestionnaire3:
            return {
                level: PremiumCommercant.Gestionnaire3,
                subscriptionDurationMonths: 12,
                hasFollowerAnalytics: false,
                hasOrderStatistics: false,
                canAccessTrendAnalysis: false,
                canAccessEstimations: false,
                canAccessMyStore: true,
                canAccessMyNews: true,
                canAccessCommands: true,
                canAccessRecette: true,
                maxManagers: 3,
                canManagersAccessRecette: false,
            };
        case PremiumCommercant.Gestionnaire4Recette:
            return {
                level: PremiumCommercant.Gestionnaire4Recette,
                subscriptionDurationMonths: 12,
                hasFollowerAnalytics: false,
                hasOrderStatistics: false,
                canAccessTrendAnalysis: false,
                canAccessEstimations: false,
                canAccessMyStore: true,
                canAccessMyNews: true,
                canAccessCommands: true,
                canAccessRecette: true,
                maxManagers: 4,
                canManagersAccessRecette: true,
            };
        case PremiumCommercant.Aucun:
        default:
            return {
                level: PremiumCommercant.Aucun,
                subscriptionDurationMonths: 0,
                hasFollowerAnalytics: false,
                hasOrderStatistics: false,
                canAccessTrendAnalysis: false,
                canAccessEstimations: false,
                canAccessMyStore: true,
                canAccessMyNews: true,
                canAccessCommands: true,
                canAccessRecette: true,
                maxManagers: 1,
                canManagersAccessRecette: false,
            };
    }
}

export const PRIX_PREMIUM_COMMERCANT: { [key in PremiumCommercant]: number | null } = {
    [PremiumCommercant.Aucun]: null,
    [PremiumCommercant.Niveau1]: 800.00,
    [PremiumCommercant.Niveau2]: 4200.00,
    [PremiumCommercant.Niveau3]: 8400.00,
    [PremiumCommercant.Gestionnaire3]: 3600.00,
    [PremiumCommercant.Gestionnaire4Recette]: 4800.00,
};

export function getPrixPremiumCommercant(level: PremiumCommercant): number | null {
    return PRIX_PREMIUM_COMMERCANT[level];
}

export function calculerAge(dateDeNaissance: Date | string): number {
    const naissance = new Date(dateDeNaissance);
    const aujourdHui = new Date();

    let age = aujourdHui.getFullYear() - naissance.getFullYear();
    const mois = aujourdHui.getMonth() - naissance.getMonth();

    if (mois < 0 || (mois === 0 && aujourdHui.getDate() < naissance.getDate())) {
        age--;
    }

    return age;
}

export const PRIX_PREMIUM_UTILISATEUR: { [key in PremiumUtilisateur]: number | null } = {
    [PremiumUtilisateur.Aucun]: null,
    [PremiumUtilisateur.Level1]: 500.00,
    [PremiumUtilisateur.Level2]: 1200.00,
    [PremiumUtilisateur.ListeCourses1Mois]: 300.00,
    [PremiumUtilisateur.ListeCourses6Mois]: 1300.00,
    [PremiumUtilisateur.ListeCourses12Mois]: 3000.00,
};

export function getPrixPremiumUtilisateur(level: PremiumUtilisateur): number | null {
    return PRIX_PREMIUM_UTILISATEUR[level];
}
