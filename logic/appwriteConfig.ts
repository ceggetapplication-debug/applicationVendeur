import { Client, Databases, Account, Query, ID, Models, Functions } from 'react-native-appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('cegget_project')
  .setPlatform('com.cegget.seller');

export { client, Query, ID, Models };
export const databases = new Databases(client);
export const account = new Account(client);
export const functions = new Functions(client);

export const config = {
  databaseId: 'database_main',
  productsCollectionId: 'products',
  favoritesCollectionId: 'favorites',
  ordersCollectionId: 'orders',
  usersCollectionId: 'users',
  storesCollectionId: 'stores',
  deliveriesCollectionId: 'deliveries',
  feedbackCollectionId: 'feedback_de_suppression',
  premiumCollectionId: 'premium_utilisateurs',
  invitationsCollectionId: 'invitations',
  sireneFunctionId: 'notifications',
  configCollectionId: 'app_config',
} as const;

export const r2Config = {
  workerUrl: 'https://mon-worker.mon-compte.workers.dev',
  publicUrl: 'https://pub-xxxxxxxxxxxxx.r2.dev',
  bucketName: 'cegget-images',
  folders: {
    STORES: "stores/",
    PRODUCTS: "products/",
    PROFILES: "profiles/",
    SHARED: "shared/",
    GROUPS: "groups/",
    DRIVERS: "drivers/",
    IDS: "ids/",
    PORTES: "portes/",
    LOGOS: "logos/",
  }
} as const;

const RESEND_API_KEY = 're_123456789';
const FROM_EMAIL = 'no-reply@votre-domaine.com';

export const sendVerificationEmailWithFallback = async (userEmail: string, verificationUrl: string) => {
  try {
    await account.createVerification(verificationUrl);
  } catch (error) {
    console.warn("Appwrite quota e-mail dépassé. Bascule automatique sur Resend...", error);
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: userEmail,
        subject: 'Ajerred di Cegget',
        html: `<p>Tekki ɣef wassaɣ i wakken ad tjerdeḍ iman-ik/im: </p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
      }),
    });
  }
};

export const sendPasswordResetEmailWithFallback = async (userEmail: string, resetUrl: string) => {
  try {
    await account.createRecovery(userEmail, resetUrl);
  } catch (error) {
    console.warn("Appwrite quota e-mail dépassé. Bascule automatique sur Resend...", error);
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: userEmail,
        subject: 'Aveddel n wawal uffir',
        html: `<p>Tekki ɣef wassaɣ i wakken ad tveddel-ḍ awal uffir:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      }),
    });
  }
};

export const sendTeamInviteEmailWithFallback = async (userEmail: string, storeName: string, inviteUrl: string) => {
  try {
    await account.createVerification(inviteUrl);
  } catch (error) {
    console.warn("Appwrite quota e-mail dépassé. Bascule automatique sur Resend...", error);
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: userEmail,
        subject: `Aneɛruḍ i wakken ad tuɣaleḍ deg aɛeggal di tḥanuţ: ${storeName}`,
        html: `<p>Aqla-k/kem-id teţwaɛerḍeḍ akken ad tuɣal d aɛeggal di tḥanuţ: <strong>${storeName}</strong>.</p><p><a href="${inviteUrl}">Tekki ɣef wassaɣ i wakken ad tizmireḍ ad twaliḍ tḥanuţ, u ad tizmireḍ ad tqedceḍ deg-s.</a></p>`,
      }),
    });
  }
};