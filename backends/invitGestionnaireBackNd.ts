import { ID, Query, Models } from 'react-native-appwrite';
import { account, databases, config } from '@/app/(main)/calculation-logic/appwriteConfig';

export interface UserPermissions {
    mystore: boolean;
    mynews: boolean;
    commands: boolean;
    recette: boolean;
}

export interface UserProfile extends Models.Document {
    userId: string;
    email: string;
    role: 'commercant' | 'gestionnaire';
    storeId: string;
    permissions: string;
    isPremium: boolean;
    premiumPack: string | null;
}

export interface Invitation extends Models.Document {
    $id: string;
    email: string;
    token: string;
    role: 'gestionnaire';
    inviterId: string;
    storeId: string;
    permissions: string;
    accepted: boolean;
    expiresAt: string;
}

export const TeamBackend = {
    async sendInvite(params: {
        email: string;
        inviterId: string;
        storeId: string;
        permissions: UserPermissions;
    }): Promise<{ success: boolean; inviteId: string; token: string }> {

        const token: string = ID.unique();
        const expiresAt: Date = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const inviteData = {
            email: params.email,
            token: token,
            role: 'gestionnaire' as const,
            inviterId: params.inviterId,
            storeId: params.storeId,
            permissions: JSON.stringify(params.permissions),
            expiresAt: expiresAt.toISOString(),
            accepted: false,
        };

        const doc: Invitation = await databases.createDocument<Invitation>(
            config.databaseId,
            config.invitationsCollectionId,
            ID.unique(),
            inviteData
        );
        return { success: true, inviteId: doc.$id, token: token };
    },

    async acceptInvite(inviteId: string) {
        try {
            const inv = await databases.getDocument<Invitation>(
                config.databaseId,
                config.invitationsCollectionId,
                inviteId
            );

            const user = await account.get();

            const userProfiles = await databases.listDocuments(
                config.databaseId,
                config.usersCollectionId,
                [Query.equal('userId', user.$id)]
            );

            if (userProfiles.total > 0) {
                await databases.updateDocument(
                    config.databaseId,
                    config.usersCollectionId,
                    userProfiles.documents[0].$id,
                    {
                        role: 'gestionnaire',
                        storeId: inv.storeId,
                        permissions: inv.permissions
                    }
                );
            }

            await databases.updateDocument(
                config.databaseId,
                config.invitationsCollectionId,
                inviteId,
                { accepted: true }
            );

            return {
                success: true,
                permissions: JSON.parse(inv.permissions)
            };
        } catch (error) {
            console.error("Erreur acceptInvite:", error);
            return { success: false };
        }
    },
};

export const PermissionGuard = {
    hasAccess(user: UserProfile, permission: keyof UserPermissions): boolean {
        if (user.role === 'commercant') {
            return true;
        }

        try {
            const perms: UserPermissions = JSON.parse(user.permissions);
            return perms[permission] === true;
        } catch (error) {
            console.error("Permission parse error:", error);
            return false;
        }
    }
};
