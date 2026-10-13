import { Dimensions, ImageSourcePropType } from "react-native";
import { databases, config, ID, Query, r2Config } from "./appwriteConfig";

const baseUrl = r2Config.publicUrl;
const DB_ID = config.databaseId;

const COLS = {
  STORES: config.storesCollectionId,
  PRODUCTS: config.productsCollectionId,
  SHARED: "col_shared",
  PROFILES: config.usersCollectionId,
  DRIVERS: "col_drivers",
  ADRESSES: "col_adresses",
  SIGNALEMENTS: "col_signalements",
};

export interface R2File {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface Document {
  $id: string;
}

export async function deleteFromR2(fileKey: string): Promise<void> {
  try {
    await fetch(`${r2Config.workerUrl}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: fileKey }),
    });
  } catch (err) {
    console.error("Erreur suppression R2:", err);
  }
}

export async function uploadToR2(fileKey: string, file: R2File): Promise<void> {
  const imageResponse = await fetch(file.uri);
  const blob = await imageResponse.blob();

  const form = new FormData();
  form.append("key", fileKey);
  form.append("file", blob, file.name);

  const response = await fetch(`${r2Config.workerUrl}/upload`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    throw new Error("R2_UPLOAD_FAILED");
  }
}

function screen() {
  return Dimensions.get("window");
}

export function sizes() {
  const { width: W, height: H } = screen();
  return {
    PRODUCT_APERCU_W: Math.round(W * 0.38),
    PRODUCT_APERCU_H: 130,
    PRODUCT_DETAIL_W: Math.round(W * 0.63),
    PRODUCT_DETAIL_H: Math.round(H * 0.3),
    STORE_W: Math.round(W * 0.85),
    STORE_H: 170,
    PROFIL_PIC: 120,
    SHARED_VIGNETTE: 280,
    SHARED_PLEIN_W: W,
    SHARED_PLEIN_H: H,
    AVATAR: 60,
    GROUP: Math.min(220, Math.round(W * 0.5)),
    LOGO: 70,
    CATEGORY_W: 40,
    CATEGORY_H: 40,
  };
}

export interface Store extends Document {
  name: string;
  description: string;
  ownerId: string;
}

export interface Product extends Document {
  name: string;
  descriptionFr: string;
  descriptionKab: string;
  price: number;
  storeId: string;
  categories?: string;
  productTypes?: string;
}

export interface SharedPhoto extends Document {
  merchantId: string;
  storeId: string;
  caption: string;
  createdAt: string;
}

export interface UserProfile extends Document {
  userId: string;
  role: "merchant" | "buyer" | "driver";
}

export interface Driver extends Document {
  userId: string;
}

export interface Adresse extends Document {
  buyerId: string;
  adresse: string;
}

export interface Signalement extends Document {
  signalePar: string;
  contenuType: "photo_partagee" | "photo_product" | "photo_store" | "photo_profil";
  contenuId: string;
  raison: string;
  statut: "en_attente" | "supprime" | "ignore";
  createdAt: string;
}

export interface ProductPhoto { fileId: string; apercu: string; detail: string; }
export interface StorePhoto { fileId: string; cover: string; }
export interface StoreProfilePhoto { fileId: string; miniature: string; }
export interface SharedPhotoUrls { fileId: string; vignette: string; pleinEcran: string; }
export interface ProfilePhoto { fileId: string; avatar: string; }
export interface GroupPhoto { fileId: string; figure: string; }
export interface DriverProfilePhoto { fileId: string; avatar: string; }
export interface DriverIdPhoto { fileId: string; url: string; }
export interface PortePhoto { fileId: string; url: string; }
export interface Logos { fileId: string; url: string; }

export function buildProductPhoto(productId: string): ProductPhoto {
  const s = sizes();
  const path = `${r2Config.folders.PRODUCTS}${productId}.jpg`;
  return {
    fileId: productId,
    apercu: `${baseUrl}/cdn-cgi/image/width=${s.PRODUCT_APERCU_W},height=${s.PRODUCT_APERCU_H},fit=crop/${path}`,
    detail: `${baseUrl}/cdn-cgi/image/width=${s.PRODUCT_DETAIL_W},height=${s.PRODUCT_DETAIL_H},fit=crop/${path}`,
  };
}

export function buildStorePhoto(storeId: string): StorePhoto {
  const s = sizes();
  const path = `${r2Config.folders.STORES}${storeId}.jpg`;
  return {
    fileId: storeId,
    cover: `${baseUrl}/cdn-cgi/image/width=${s.STORE_W},height=${s.STORE_H},fit=crop/${path}`,
  };
}

export function buildStoreProfilePhoto(storeId: string): StoreProfilePhoto {
  const s = sizes();
  const path = `${r2Config.folders.STORES}profile_${storeId}.jpg`;
  return {
    fileId: storeId,
    miniature: `${baseUrl}/cdn-cgi/image/width=${s.PROFIL_PIC},height=${s.PROFIL_PIC},fit=crop/${path}`,
  };
}

export function buildProfilePhoto(userId: string): ProfilePhoto {
  const s = sizes();
  const path = `${r2Config.folders.PROFILES}${userId}.jpg`;
  return {
    fileId: userId,
    avatar: `${baseUrl}/cdn-cgi/image/width=${s.AVATAR},height=${s.AVATAR},fit=crop/${path}`,
  };
}

export function buildSharedPhoto(docId: string): SharedPhotoUrls {
  const s = sizes();
  const path = `${r2Config.folders.SHARED}${docId}.jpg`;
  return {
    fileId: docId,
    vignette: `${baseUrl}/cdn-cgi/image/width=${s.SHARED_VIGNETTE},height=${s.SHARED_VIGNETTE},fit=crop/${path}`,
    pleinEcran: `${baseUrl}/cdn-cgi/image/width=${s.SHARED_PLEIN_W},height=${s.SHARED_PLEIN_H},fit=contain/${path}`,
  };
}

export function buildGroupPhoto(groupId: string): GroupPhoto {
  const s = sizes();
  const path = `${r2Config.folders.GROUPS}${groupId}.jpg`;
  return {
    fileId: groupId,
    figure: `${baseUrl}/cdn-cgi/image/width=${s.GROUP},height=${s.GROUP},fit=crop/${path}`,
  };
}

export function buildDriverProfilePhoto(driverId: string): DriverProfilePhoto {
  const s = sizes();
  const path = `${r2Config.folders.DRIVERS}${driverId}.jpg`;
  return {
    fileId: driverId,
    avatar: `${baseUrl}/cdn-cgi/image/width=${s.AVATAR},height=${s.AVATAR},fit=crop/${path}`,
  };
}

export function buildDriverIdPhoto(driverId: string): DriverIdPhoto {
  const path = `${r2Config.folders.IDS}${driverId}.jpg`;
  return {
    fileId: driverId,
    url: `${baseUrl}/cdn-cgi/image/width=${sizes().AVATAR},height=${sizes().AVATAR},fit=crop/${path}`
  };
}

export function buildPortePhoto(adresseId: string): PortePhoto {
  const s = sizes();
  const path = `${r2Config.folders.PORTES}${adresseId}.jpg`;
  return {
    fileId: adresseId,
    url: `${baseUrl}/cdn-cgi/image/width=${s.PRODUCT_DETAIL_W},fit=crop/${path}`
  };
}

export function getAppLogo(hasSpace: boolean) {
  const s = sizes();
  return {
    source: hasSpace
      ? require('../../../assets/images/logo6.5.png')
      : require('../../../assets/images/logAppKMRS.png'),
    width: hasSpace ? s.PROFIL_PIC : s.LOGO,
    height: hasSpace ? s.PROFIL_PIC : s.LOGO,
  };
}

export async function createStore(name: string, description: string, ownerId: string): Promise<Store> {
  return databases.createDocument<Store>(DB_ID, COLS.STORES, ID.unique(), {
    name,
    description,
    ownerId,
  });
}

export async function setStorePhoto(storeId: string, file: R2File): Promise<StorePhoto> {
  await uploadToR2(`${r2Config.folders.STORES}${storeId}.jpg`, file);
  return buildStorePhoto(storeId);
}

export async function getStorePhoto(storeId: string): Promise<StorePhoto> {
  return buildStorePhoto(storeId);
}

export async function setStoreProfilePhoto(storeId: string, file: R2File): Promise<StoreProfilePhoto> {
  await uploadToR2(`${r2Config.folders.STORES}profile_${storeId}.jpg`, file);
  return buildStoreProfilePhoto(storeId);
}

export async function getStoreProfilePhoto(storeId: string): Promise<StoreProfilePhoto> {
  return buildStoreProfilePhoto(storeId);
}

export async function createProduct(name: string, descFr: string, descKab: string, price: number, storeId: string): Promise<Product> {
  return databases.createDocument<Product>(DB_ID, COLS.PRODUCTS, ID.unique(), {
    name,
    descriptionFr: descFr,
    descriptionKab: descKab,
    price,
    storeId,
  });
}

export async function setProductPhoto(productId: string, file: R2File): Promise<ProductPhoto> {
  await uploadToR2(`${r2Config.folders.PRODUCTS}${productId}.jpg`, file);
  return buildProductPhoto(productId);
}

export async function getProductPhoto(productId: string): Promise<ProductPhoto> {
  return buildProductPhoto(productId);
}

export async function getStoreProductsWithPhotos(storeId: string): Promise<Array<{ product: Product; photo: ProductPhoto }>> {
  const response = await databases.listDocuments<Product>(DB_ID, COLS.PRODUCTS, [
    Query.equal("storeId", storeId),
  ]);

  return response.documents.map((product: Product) => ({

    product,
    photo: buildProductPhoto(product.$id),
  }));
}

export async function deleteProductPhoto(productId: string): Promise<void> {
  await deleteFromR2(`${r2Config.folders.PRODUCTS}${productId}.jpg`);
}

export async function sharePhoto(file: R2File, merchantId: string, storeId: string, caption: string = ""): Promise<SharedPhoto & SharedPhotoUrls> {
  const doc = await databases.createDocument<SharedPhoto>(DB_ID, COLS.SHARED, ID.unique(), {
    merchantId,
    storeId,
    caption,
    createdAt: new Date().toISOString(),
  });

  await uploadToR2(`${r2Config.folders.SHARED}${doc.$id}.jpg`, file);

  return {
    ...doc,
    ...buildSharedPhoto(doc.$id)
  };
}

export async function getStoreSharedPhotos(storeId: string): Promise<Array<SharedPhoto & SharedPhotoUrls>> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const response = await databases.listDocuments<SharedPhoto>(DB_ID, COLS.SHARED, [
    Query.equal("storeId", storeId),
    Query.greaterThanEqual("createdAt", sevenDaysAgo.toISOString()),
    Query.orderDesc("createdAt")
  ]);

  return response.documents.map((doc: SharedPhoto) => ({
    ...doc,
    ...buildSharedPhoto(doc.$id)
  }));
}

export async function deleteSharedPhoto(documentId: string, fileId: string): Promise<void> {
  await deleteFromR2(`${r2Config.folders.SHARED}${documentId}.jpg`);
  await databases.deleteDocument(DB_ID, COLS.SHARED, documentId);
}

export async function setGroupPhoto(groupId: string, file: R2File): Promise<GroupPhoto> {
  await uploadToR2(`${r2Config.folders.GROUPS}${groupId}.jpg`, file);
  return buildGroupPhoto(groupId);
}

export function getGroupPhoto(groupId: string): ImageSourcePropType {
  switch (groupId) {
    case 'group1': return require('../../../assets/icones/Ecran-daccueil/Courses.png');
    case 'group2': return require('../../../assets/icones/Ecran-daccueil/Frais.png');
    case 'group3': return require('../../../assets/icones/Ecran-daccueil/Snack.png');
    case 'group4': return require('../../../assets/icones/Ecran-daccueil/Dejeuner.png');
    case 'group5': return require('../../../assets/icones/Ecran-daccueil/Magasin.png');
    default: return require('../../../assets/icones/Ecran-daccueil/Courses.png');
  }
}

export async function createProfile(userId: string, role: "merchant" | "buyer" | "driver"): Promise<UserProfile> {
  return databases.createDocument<UserProfile>(DB_ID, COLS.PROFILES, userId, {
    userId,
    role,
  });
}

export async function updateProfilePhoto(userId: string, file: R2File): Promise<ProfilePhoto> {
  await uploadToR2(`${r2Config.folders.PROFILES}${userId}.jpg`, file);
  return buildProfilePhoto(userId);
}

export async function getProfile(userId: string): Promise<UserProfile & Partial<ProfilePhoto>> {
  const profile = await databases.getDocument<UserProfile>(DB_ID, COLS.PROFILES, userId);
  return {
    ...profile,
    ...buildProfilePhoto(userId)
  };
}

export async function removeProfilePhoto(userId: string): Promise<void> {
  await deleteFromR2(`${r2Config.folders.PROFILES}${userId}.jpg`);
}

export async function createDriver(userId: string): Promise<Driver> {
  return databases.createDocument<Driver>(DB_ID, COLS.DRIVERS, userId, {
    userId,
  });
}

export async function setDriverProfilePhoto(driverId: string, file: R2File): Promise<DriverProfilePhoto> {
  await uploadToR2(`${r2Config.folders.DRIVERS}${driverId}.jpg`, file);
  return buildDriverProfilePhoto(driverId);
}

export async function getDriverProfilePhoto(driverId: string): Promise<ProfilePhoto> {
  return buildProfilePhoto(driverId);
}

export async function getDriverIdPhoto(driverId: string): Promise<DriverIdPhoto> {
  return buildDriverIdPhoto(driverId);
}

export async function setPortePhoto(adresseId: string, imageUri: string): Promise<PortePhoto> {
  await uploadToR2(`${r2Config.folders.PORTES}${adresseId}.jpg`, {
    uri: imageUri,
    name: `${adresseId}.jpg`,
    type: "image/jpeg"
  });
  return buildPortePhoto(adresseId);
}

export async function getPortePhoto(adresseId: string): Promise<PortePhoto> {
  return buildPortePhoto(adresseId);
}

export async function signalerPhoto(
  signalePar: string,
  contenuType: Signalement["contenuType"],
  contenuId: string,
  fileId: string,
  bucket: string,
  raison: string
): Promise<Signalement> {
  return databases.createDocument<Signalement>(DB_ID, COLS.SIGNALEMENTS, ID.unique(), {
    signalePar,
    contenuType,
    contenuId,
    raison,
    statut: "en_attente",
    createdAt: new Date().toISOString(),
  });
}

function getFolderForSignalement(type: Signalement["contenuType"]): string {
  switch (type) {
    case "photo_product": return r2Config.folders.PRODUCTS;
    case "photo_store": return r2Config.folders.STORES;
    case "photo_profil": return r2Config.folders.PROFILES;
    case "photo_partagee": return r2Config.folders.SHARED;
    default: return "";
  }
}

export async function getSignalementsEnAttente(): Promise<Array<Signalement & { photoUrl: string }>> {
  const response = await databases.listDocuments<Signalement>(DB_ID, COLS.SIGNALEMENTS, [
    Query.equal("statut", "en_attente"),
    Query.orderDesc("createdAt"),
  ]);

  return response.documents.map((s: Signalement) => {
    const folder = getFolderForSignalement(s.contenuType);
    return {
      ...s,
      photoUrl: `${baseUrl}/${folder}${s.contenuId}.jpg`
    };
  });
}

export async function supprimerPhotoSignalee(signalementId: string): Promise<void> {
  const s = await databases.getDocument<Signalement>(DB_ID, COLS.SIGNALEMENTS, signalementId);
  const folder = getFolderForSignalement(s.contenuType);

  await deleteFromR2(`${folder}${s.contenuId}.jpg`);
  await databases.updateDocument(DB_ID, COLS.SIGNALEMENTS, signalementId, { statut: "supprime" });
}

export async function ignorerSignalement(signalementId: string): Promise<void> {
  await databases.updateDocument(DB_ID, COLS.SIGNALEMENTS, signalementId, { statut: "ignore" });
}

export async function cleanupOldStories(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const response = await databases.listDocuments<SharedPhoto>(DB_ID, COLS.SHARED, [
      Query.lessThan("createdAt", thirtyDaysAgo.toISOString())
    ]);

    for (const doc of response.documents) {
      try {
        await deleteFromR2(`${r2Config.folders.SHARED}${doc.$id}.jpg`);
        await databases.deleteDocument(DB_ID, COLS.SHARED, doc.$id);
      } catch (err) { }
    }
    return response.documents.length;
  } catch (error) {
    return 0;
  }
}

export async function cleanupInactiveAccounts(): Promise<number> {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const response = await databases.listDocuments<UserProfile>(DB_ID, COLS.PROFILES, [
      Query.lessThan("lastActiveAt", sixtyDaysAgo.toISOString())
    ]);

    for (const doc of response.documents) {
      try {
        await deleteFromR2(`${r2Config.folders.PROFILES}${doc.userId}.jpg`);
        await databases.deleteDocument(DB_ID, COLS.PROFILES, doc.$id);
      } catch (err) { }
    }
    return response.documents.length;
  } catch (error) {
    return 0;
  }
}

export function getCategoryPhoto(categories: string): ImageSourcePropType {
  switch (categories) {
    case 'superette_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'superette_topVentes': return require('../../../assets/icones/Partagees/Top-ventes.png');
    case 'superette_cat_laitiers': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'superette_dairy_milkCream': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'superette_dairy_yogurtDesserts': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'superette_dairy_cheese': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'superette_dairy_butterMargarine': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'superette_cat_petitdej': return require('../../../assets/icones/Superette/Petit-dejeuner.png');
    case 'superette_breakfast_cereals': return require('../../../assets/icones/Superette/Petit-dejeuner.png');
    case 'superette_breakfast_chocolatConfiture': return require('../../../assets/icones/Superette/Petit-dejeuner.png');
    case 'superette_breakfast_cafethe': return require('../../../assets/icones/Superette/Petit-dejeuner.png');
    case 'superette_cat_bebes': return require('../../../assets/icones/Superette/Bebes.png');
    case 'superette_bebe_savonShampoing': return require('../../../assets/icones/Superette/Bebes.png');
    case 'superette_bebe_couchesLingettes': return require('../../../assets/icones/Superette/Bebes.png');
    case 'superette_bebe_laitYaourt': return require('../../../assets/icones/Superette/Bebes.png');
    case 'superette_bebe_repasComplementaire': return require('../../../assets/icones/Superette/Bebes.png');
    case 'superette_cat_patisserie_sup': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'superette_patisserie_farineSemoule': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'superette_patisserie_sucreSirop': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'superette_patisserie_aromesColorants': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'superette_patisserie_fruitsACoque': return require('../../../assets/icones/Partagees/Fruits-coque.png');
    case 'superette_patisserie_montageDecoration': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'superette_cat_patesgraines': return require('../../../assets/icones/Superette/Pates-graines.png');
    case 'superette_patesgraines_pates': return require('../../../assets/icones/Superette/Pates-graines.png');
    case 'superette_patesgraines_riz_cous': return require('../../../assets/icones/Superette/Pates-graines.png');
    case 'superette_patesgraines_legumesSecs': return require('../../../assets/icones/Superette/Pates-graines.png');
    case 'superette_patesgraines_mesure': return require('../../../assets/icones/Superette/Pates-graines.png');
    case 'superette_cat_condiments': return require('../../../assets/icones/Superette/Epice-condi.png');
    case 'superette_condiments_conserveFruitsConfits': return require('../../../assets/icones/Superette/Epice-condi.png');
    case 'superette_condiments_epices': return require('../../../assets/icones/Superette/Epice-condi.png');
    case 'superette_condiments_huileVinaigreSauce': return require('../../../assets/icones/Superette/Epice-condi.png');
    case 'superette_cat_snacks': return require('../../../assets/icones/Partagees/Snacks.png');
    case 'superette_snacks_barresBonbons': return require('../../../assets/icones/Partagees/Snacks.png');
    case 'superette_snacks_chipsAmuseGueule': return require('../../../assets/icones/Partagees/Snacks.png');
    case 'superette_cat_boissons': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'superette_boissons_jusBouteille': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'superette_boissons_jusBoite': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'superette_boissons_boissonsGazeuses': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'superette_boissons_eauMinerale': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'superette_cat_hygiene': return require('../../../assets/icones/Partagees/Hygiene.png');
    case 'superette_hygiene_corporelle': return require('../../../assets/icones/Partagees/Hygiene.png');
    case 'superette_hygiene_ditergent': return require('../../../assets/icones/Superette/Menage-sav.png');
    case 'superette_hygiene_papierHygiene': return require('../../../assets/icones/Partagees/Hygiene.png');
    case 'superette_hygiene_lessiveVess': return require('../../../assets/icones/Superette/Menage-sav.png');
    case 'superette_cat_autres': return require('../../../assets/icones/Partagees/Autre.png');

    case 'epicerie_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'epicerie_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'epicerie_cat_epices': return require('../../../assets/icones/Epicerie/Epices.png');
    case 'epicerie_cat_epicesEnMesure': return require('../../../assets/icones/Epicerie/Epices-en-vrac.png');
    case 'epicerie_cat_herbesAromatiques': return require('../../../assets/icones/Epicerie/Herbes-aromatiques.png');
    case 'epicerie_cat_fruitACoque': return require('../../../assets/icones/Partagees/Fruits-coque.png');
    case 'epicerie_cat_herbesMedicinales': return require('../../../assets/icones/Epicerie/Herbes-medicinales.png');
    case 'epicerie_cat_autre': return require('../../../assets/icones/Partagees/Autre.png');

    case 'productsCosmetiques_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'productsCosmetiques_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'cosmetique_cat_visage': return require('../../../assets/icones/Cosmetique/Visage.png');
    case 'cosmetique_cat_cheveux': return require('../../../assets/icones/Cosmetique/Cheveux.png');
    case 'cosmetique_cat_corps': return require('../../../assets/icones/Cosmetique/Corps.png');
    case 'cosmetique_cat_autre': return require('../../../assets/icones/Partagees/Autre.png');

    case 'bureauTabac_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'bureauTabac_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'bureauTabac_cat_scolaire': return require('../../../assets/icones/Bureau-tabac/Affaires-scolaire.png');
    case 'bureauTabac_cat_hygiene': return require('../../../assets/icones/Partagees/Hygiene.png');
    case 'bureauTabac_cat_jouets': return require('../../../assets/icones/Bureau-tabac/Jouets.png');
    case 'bureauTabac_cat_snacks': return require('../../../assets/icones/Partagees/Snacks.png');
    case 'bureauTabac_cat_autre': return require('../../../assets/icones/Partagees/Autre.png');

    case 'alimGle_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'alimGle_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'alimGle_cat_laitiers': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'alimGle_cat_petitdej': return require('../../../assets/icones/Partagees/Autre.png');
    case 'alimGle_cat_patesgraines': return require('../../../assets/icones/Partagees/Autre.png');
    case 'alimGle_cat_snacks': return require('../../../assets/icones/Partagees/Snacks.png');
    case 'alimGle_cat_boissons': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'alimGle_cat_hygiene': return require('../../../assets/icones/Partagees/Hygiene.png');
    case 'alimGle_cat_fruitLegu': return require('../../../assets/icones/Partagees/Autre.png');
    case 'superette_cat_autres': return require('../../../assets/icones/Partagees/Autre.png');

    case 'fruitsEtLegumes_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'fruitsEtLegumes_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'fruitsEtLegumes_cat_fruits': return require('../../../assets/icones/Fruits-legumes/Fruits-legume.png');
    case 'fruitsEtLegumes_cat_legumesVerts': return require('../../../assets/icones/Fruits-legumes/Legumes-verts.png');
    case 'fruitsEtLegumes_cat_legumesRacines': return require('../../../assets/icones/Fruits-legumes/Legumes-recine.png');
    case 'fruitsEtLegumes_cat_autre': return require('../../../assets/icones/Partagees/Autre.png');

    case 'boucherieViandeRouge_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'boucherieViandeRouge_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'boucherieViandeRouge_cat_boeuf': return require('../../../assets/icones/Boucherie-viande-rouge/Boeuf.png');
    case 'boucherieViandeRouge_boeuf_cuisseEpaule': return require('../../../assets/icones/Boucherie-viande-rouge/Boeuf.png');
    case 'boucherieViandeRouge_boeuf_cotePoitrineFlanc': return require('../../../assets/icones/Boucherie-viande-rouge/Boeuf.png');
    case 'boucherieViandeRouge_boeuf_tetePattesLangue': return require('../../../assets/icones/Boucherie-viande-rouge/Boeuf.png');
    case 'boucherieViandeRouge_boeuf_organesTripes': return require('../../../assets/icones/Boucherie-viande-rouge/Boeuf.png');
    case 'boucherieViandeRouge_cat_mouton': return require('../../../assets/icones/Boucherie-viande-rouge/Mouton.png');
    case 'boucherieViandeRouge_mouton_gigotEpaule': return require('../../../assets/icones/Boucherie-viande-rouge/Mouton.png');
    case 'boucherieViandeRouge_mouton_cotePoitrine': return require('../../../assets/icones/Boucherie-viande-rouge/Mouton.png');
    case 'boucherieViandeRouge_mouton_filetCollier': return require('../../../assets/icones/Boucherie-viande-rouge/Mouton.png');
    case 'boucherieViandeRouge_mouton_tetePattesLangue': return require('../../../assets/icones/Boucherie-viande-rouge/Mouton.png');
    case 'boucherieViandeRouge_mouton_organesTripes': return require('../../../assets/icones/Boucherie-viande-rouge/Mouton.png');
    case 'boucherieViandeRouge_cat_cheval': return require('../../../assets/icones/Boucherie-viande-rouge/Cheval.png');
    case 'boucherieViandeRouge_cheval_rampeEpaule': return require('../../../assets/icones/Boucherie-viande-rouge/Cheval.png');
    case 'boucherieViandeRouge_cheval_flancPoitrine': return require('../../../assets/icones/Boucherie-viande-rouge/Cheval.png');
    case 'boucherieViandeRouge_cheval_filetCollier': return require('../../../assets/icones/Boucherie-viande-rouge/Cheval.png');
    case 'boucherieViandeRouge_cat_importation': return require('../../../assets/icones/Boucherie-viande-rouge/Importation.png');
    case 'boucherieViandeRouge_cat_specialites': return require('../../../assets/icones/Partagees/Specialites.png');
    case 'boucherieViandeRouge_cat_autres': return require('../../../assets/icones/Partagees/Autre.png');

    case 'boucherieViandeBlanche_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'boucherieViandeBlanche_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'boucherieViandeBlanche_cat_poulet': return require('../../../assets/icones/Volaille/Poulet.png');
    case 'boucherieViandeBlanche_poulet_entierCarcasse': return require('../../../assets/icones/Volaille/Poulet.png');
    case 'boucherieViandeBlanche_poulet_cuissesAils': return require('../../../assets/icones/Volaille/Poulet.png');
    case 'boucherieViandeBlanche_poulet_poitrineEscalope': return require('../../../assets/icones/Volaille/Poulet.png');
    case 'boucherieViandeBlanche_poulet_abats_oeufs': return require('../../../assets/icones/Volaille/Poulet.png');
    case 'boucherieViandeBlanche_cat_dinde': return require('../../../assets/icones/Volaille/Dinde.png');
    case 'boucherieViandeBlanche_dinde_cuissesAils': return require('../../../assets/icones/Volaille/Dinde.png');
    case 'boucherieViandeBlanche_dinde_poitrineEscalope': return require('../../../assets/icones/Volaille/Dinde.png');
    case 'boucherieViandeBlanche_cat_caille': return require('../../../assets/icones/Volaille/Caille.png');
    case 'boucherieViandeBlanche_cat_specialites': return require('../../../assets/icones/Partagees/Specialites.png');

    case 'poissonerie_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'poissonerie_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'poissonerie_cat_sardineBle': return require('../../../assets/icones/Poissonerie/Sardin.png');
    case 'poissonerie_cat_sardineBlc': return require('../../../assets/icones/Poissonerie/Sardin.png');
    case 'poissonerie_cat_sardineBig': return require('../../../assets/icones/Poissonerie/Sardin.png');
    case 'poissonerie_cat_autre': return require('../../../assets/icones/Partagees/Autre.png');

    case 'pizzeriaPatisserie_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'pizzeriaPatisserie_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'pizzeriaPatisserie_cat_pizzaCalzone': return require('../../../assets/icones/Partagees/Pizza.png');
    case 'pizzeriaPatisserie_pizza_pizza': return require('../../../assets/icones/Partagees/Pizza.png');
    case 'pizzeriaPatisserie_pizza_pizzaFourreeCarree': return require('../../../assets/icones/Partagees/Pizza.png');
    case 'pizzeriaPatisserie_pizza_calzoneQuiche': return require('../../../assets/icones/Partagees/Pizza.png');
    case 'pizzeriaPatisserie_cat_viennoiserie': return require('../../../assets/icones/Partagees/Viennoiseries.png');
    case 'pizzeriaPatisserie_viennoiserie_brioches': return require('../../../assets/icones/Partagees/Viennoiseries.png');
    case 'pizzeriaPatisserie_viennoiserie_feuilletee': return require('../../../assets/icones/Partagees/Viennoiseries.png');
    case 'pizzeriaPatisserie_cat_patisserie': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'pizzeriaPatisserie_patisserie_genoiseMilleFeuilles': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'pizzeriaPatisserie_patisserie_tarteletteEclair': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'pizzeriaPatisserie_patisserie_gateau': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'pizzeriaPatisserie_autres': return require('../../../assets/icones/Partagees/Autre.png');

    case 'gateauxTraditionnels_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'gateauxTraditionnels_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'gateauxTraditionnel_cat_galette': return require('../../../assets/icones/Partagees/Tamtunt.png');
    case 'gateauxTraditionnel_galette_tamtunt': return require('../../../assets/icones/Partagees/Tamtunt.png');
    case 'gateauxTraditionnel_galette_aghrumUneeruk': return require('../../../assets/icones/Partagees/Tamtunt.png');
    case 'gateauxTraditionnel_galette_lesfenj': return require('../../../assets/icones/Partagees/Tamtunt.png');
    case 'gateauxTraditionnel_cat_biscuit': return require('../../../assets/icones/Gateaux-trad/Biscuits.png');
    case 'gateauxTraditionnel_biscuit_simples': return require('../../../assets/icones/Gateaux-trad/Biscuits.png');
    case 'gateauxTraditionnel_biscuit_enrobesFourrees': return require('../../../assets/icones/Gateaux-trad/Biscuits.png');
    case 'gateauxTraditionnel_cat_extrasucre': return require('../../../assets/icones/Gateaux-trad/Extra-sucre.png');
    case 'gateauxTraditionnel_extrasucre_meqrutBaqlawa': return require('../../../assets/icones/Gateaux-trad/Extra-sucre.png');
    case 'gateauxTraditionnel_extrasucre_fruitACoque': return require('../../../assets/icones/Partagees/Fruits-coque.png');
    case 'gateauxTraditionnel_extrasucre_dessertRamdan': return require('../../../assets/icones/Gateaux-trad/Extra-sucre.png');
    case 'gateauxTraditionnel_cat_decore': return require('../../../assets/icones/Gateaux-trad/Decores.png');
    case 'gateauxTraditionnel_decore_glacagePateSucre': return require('../../../assets/icones/Gateaux-trad/Decores.png');
    case 'gateauxTraditionnel_decore_autresDecorations': return require('../../../assets/icones/Gateaux-trad/Decores.png');
    case 'gateauxTraditionnel_autres': return require('../../../assets/icones/Partagees/Autre.png');

    case 'boulangerie_cat_promotion': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'boulangerie_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'boulangerie_cat_pain': return require('../../../assets/icones/Boulangerie/Pain.png');
    case 'boulangerie_pain_bleOrge': return require('../../../assets/icones/Boulangerie/Pain.png');
    case 'boulangerie_pain_oliveNigelle': return require('../../../assets/icones/Boulangerie/Pain.png');
    case 'boulangerie_pain_rond': return require('../../../assets/icones/Boulangerie/Pain.png');
    case 'boulangerie_cat_viennoiserie': return require('../../../assets/icones/Partagees/Viennoiseries.png');
    case 'boulangerie_viennoiserie_brioche': return require('../../../assets/icones/Partagees/Viennoiseries.png');
    case 'boulangerie_viennoiserie_feuilletee': return require('../../../assets/icones/Partagees/Viennoiseries.png');
    case 'boulangerie_cat_galette': return require('../../../assets/icones/Partagees/Tamtunt.png');
    case 'boulangerie_galette_tamtunt': return require('../../../assets/icones/Partagees/Tamtunt.png');
    case 'boulangerie_galette_aghrumUneeruk': return require('../../../assets/icones/Partagees/Tamtunt.png');
    case 'boulangerie_autres': return require('../../../assets/icones/Partagees/Autre.png');

    case 'fastFood_promotions': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'fastFood_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'fastFood_cat_pizza&': return require('../../../assets/icones/Partagees/Pizza.png');
    case 'fastFood_pizza_pizza': return require('../../../assets/icones/Partagees/Pizza.png');
    case 'fastFood_pizza_calzone': return require('../../../assets/icones/Partagees/Pizza.png');
    case 'fastFood_pizza_quiche': return require('../../../assets/icones/Partagees/Pizza.png');
    case 'fastFood_cat_tacos': return require('../../../assets/icones/Fast-food/Tacos.png');
    case 'fastFood_cat_plats': return require('../../../assets/icones/Partagees/Plat.png');
    case 'fastFood_plat_viande': return require('../../../assets/icones/Partagees/Plat.png');
    case 'fastFood_plat_poulet': return require('../../../assets/icones/Partagees/Plat.png');
    case 'fastFood_plat_shawarma': return require('../../../assets/icones/Partagees/Plat.png');
    case 'fastFood_plat_salade': return require('../../../assets/icones/Partagees/Plat.png');
    case 'fastFood_cat_sandwichs': return require('../../../assets/icones/Partagees/Sandwich.png');
    case 'fastFood_cat_galette': return require('../../../assets/icones/Fast-food/galette.png');
    case 'fastFood_cat_burger': return require('../../../assets/icones/Fast-food/Burger.png');
    case 'fastFood_cat_supl': return require('../../../assets/icones/Partagees/Supplement.png');
    case 'fastFood_supplement_frites': return require('../../../assets/icones/Partagees/Supplement.png');
    case 'fastFood_supplement_viandePouletShawarma': return require('../../../assets/icones/Partagees/Supplement.png');
    case 'fastFood_supplement_fromage': return require('../../../assets/icones/Partagees/Supplement.png');
    case 'fastFood_supplement_salade': return require('../../../assets/icones/Partagees/Supplement.png');
    case 'fastFood_supplement_oeuf': return require('../../../assets/icones/Partagees/Supplement.png');
    case 'fastFood_cat_boisson': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'fastFood_boisson_eau': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'fastFood_boisson_jus': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'fastFood_boisson_boissonGazeuse': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'fastFood_boisson_canetteBoites': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'fastFood_cat_autres': return require('../../../assets/icones/Partagees/Autre.png');

    case 'restaurant_promotions': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'restaurant_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'restaurant_cat_entrees': return require('../../../assets/icones/Restaurant/Entrees.png');
    case 'restaurant_entree_chaude': return require('../../../assets/icones/Restaurant/Entrees.png');
    case 'restaurant_entree_froide': return require('../../../assets/icones/Restaurant/Entrees.png');
    case 'restaurant_cat_plats': return require('../../../assets/icones/Partagees/Plat.png');
    case 'restaurant_plat_melange': return require('../../../assets/icones/Partagees/Plat.png');
    case 'restaurant_plat_demi': return require('../../../assets/icones/Partagees/Plat.png');
    case 'restaurant_cat_desserts': return require('../../../assets/icones/Restaurant/Dessert.png');
    case 'restaurant_cat_viande': return require('../../../assets/icones/Partagees/Viandes.png');
    case 'restaurant_viande_viande': return require('../../../assets/icones/Partagees/Viandes.png');
    case 'restaurant_viande_poulet': return require('../../../assets/icones/Partagees/Viandes.png');
    case 'restaurant_viande_merguez': return require('../../../assets/icones/Partagees/Viandes.png');
    case 'restaurant_cat_sandwichs': return require('../../../assets/icones/Partagees/Sandwich.png');
    case 'restaurant_cat_boisson': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'restaurant_boisson_eau': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'restaurant_boisson_jus': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'restaurant_boisson_boissonGazeuse': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'restaurant_boisson_canetteBoite': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'restaurant_cat_autres': return require('../../../assets/icones/Partagees/Autre.png');

    case 'cremerie_promotions': return require('../../../assets/icones/Partagees/Promotion.png');
    case 'cremerie_topVentes': return require('../../../assets/icones/Partagees/Patisserie.png');
    case 'cremerie_cat_seksu': return require('../../../assets/icones/Cremerie/couscous.png');
    case 'cremerie_cat_plats': return require('../../../assets/icones/Partagees/Plat.png');
    case 'cremerie_cat_sandwichs': return require('../../../assets/icones/Partagees/Sandwich.png');
    case 'cremerie_cat_productsLaitiers': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'cremerie_productsLaitiers_ighiIkkiyAyefki': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'cremerie_productsLaitiers_fromage': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'cremerie_productsLaitiers_udiCreme': return require('../../../assets/icones/Partagees/Produits-laitiers.png');
    case 'cremerie_cat_supl': return require('../../../assets/icones/Partagees/Supplement.png');
    case 'cremerie_cat_boisson': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'cremerie_boisson_eau': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'cremerie_boisson_jus': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'cremerie_boisson_boissonGazeuse': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'cremerie_boisson_canetteBoites': return require('../../../assets/icones/Partagees/Boissons.png');
    case 'cremerie_cat_autres': return require('../../../assets/icones/Partagees/Autre.png');

    default: return { uri: '' };

  }
}
