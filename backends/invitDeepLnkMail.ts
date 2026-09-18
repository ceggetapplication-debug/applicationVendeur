import * as Linking from 'expo-linking';
import { ID } from 'react-native-appwrite';
import { account, databases, functions, config, Query } from '@/app/(main)/calculation-logic/appwriteConfig';
import { TeamBackend } from './invitGestionnaireBackNd';

const EMAIL_TEXTS = {
  standard: {
    kab: "Yeɛreḍ-ik/ikem-id vav n tḥanuţ akken ad tuɣaleḍ d aɛeggal/taɛeggalt n tḥanuţ Cegget. Ma yella tekkaḍ ɣef wassaɣ id yeddan di email-agi, ad tuɣaleḍ d aɛeggal/taɛeggalt. Ad tizmirḍ ad twaliḍ u ad tvedleḍ igdilen n: Taḥanuţ-iw, Taɣwalt, Isawaḍen. Lɛeslama-inek/inem ɣer tḥanuţ n Cegget.",
    fr: "Le propriétaire de la boutique dans laquelle vous travaillez vous invite à devenir gérant du magasin en ligne Cegget. En cliquant sur le lien vous acceptez l'invitation et vous devenez gestionnaire des écrans: Mon magasin, Ma Com', Commandes reçues. Bienvenu/e à vous dans le magasin en ligne Cegget."
  },
  premium: {
    kab: "Yeɛreḍ-ik/ikem-id vav n tḥanuţ akken ad tuɣaleḍ d aɛeggal/taɛeggalt n tḥanuţ Cegget. Ma yella tekkaḍ ɣef wassaɣ id yeddan di email-agi, ad tuɣaleḍ d aɛeggal/taɛeggalt. Ad tizmirḍ ad twaliḍ u ad tvedleḍ yiwen seg igdilen: Taḥanuţ-iw, Taɣwalt, Isawaḍen, neɣ Taɛezzult. D vav n tḥanuţ ara d yextiren yiwen seg igdilen ara tsexdmeḍ. Ihi tekki deg wassaɣ akken ad teẓreḍ d anwa agdil ara tesxedmeḍ Lɛeslama-inek/inem ɣer tḥanuţ n Cegget.",
    fr: "Le propriétaire de la boutique dans laquelle vous travaillez vous invite à devenir gérant du magasin en ligne Cegget. En cliquant sur le lien vous acceptez l'invitation et vous devenez gestionnaire d'un des écrans: Mon magasin, Ma Com', Commandes reçues ou Recette. En cliquant sur le lien vous saurez quel écran vous a été désigné. Bienvenu/e à vous dans le magasin en ligne Cegget."
  }
};

export interface InviteDeepLinkParams {
  inviteId: string;
}

export const DeepLinkBackend = {
  parseURL(url: string): InviteDeepLinkParams | null {
    try {
      const parsed = Linking.parse(url);
      const inviteId = parsed.queryParams?.inviteId as string;
      if (!inviteId) return null;
      return { inviteId };
    } catch (error) {
      console.error("Erreur lors du décodage du lien d'invitation:", error);
      return null;
    }
  },
  async processInvite(params: InviteDeepLinkParams) {
    try {
      return await TeamBackend.acceptInvite(params.inviteId);
    } catch (error) {
      console.error("Erreur processInvite:", error);
      return { success: false };
    }
  },

  async getInitialInviteURL(): Promise<InviteDeepLinkParams | null> {
    const url = await Linking.getInitialURL();
    if (!url) return null;
    return this.parseURL(url);
  }
};

export const sendInviteEmail = async ({ email, redirectUrl, isPremium }: {
  email: string;
  redirectUrl: string;
  isPremium: boolean;
}) => {
  const caseType = isPremium ? 'premium' : 'standard';
  const texts = EMAIL_TEXTS[caseType];

  const payload = {
    to: email,
    url: redirectUrl,
    subject: isPremium ? "Invitation Premium Cegget" : "Invitation Cegget",
    bodyFr: texts.fr,
    bodyKab: texts.kab
  };

  try {
    await functions.createExecution(
      'invitation-sender',
      JSON.stringify(payload)
    );
    console.log(`Email d'invitation ${caseType} envoyé avec succès.`);
  } catch (error) {
    console.error("Échec de la fonction Appwrite, passage au Magic URL standard :", error);

    await account.createMagicURLToken(
      ID.unique(),
      email,
      redirectUrl
    );
  }
};
