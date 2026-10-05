import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Alert } from 'react-native';
import TaBarre from './modals/barreNavSELLER';
import MyStoreScreen from './screens/myStore';
import MyNewsScreen from './screens/myNews';
import CommandsMgzScreen from './screens/commandsKmrs';
import RecetteScreen from './screens/recette';
import ProfileSELLScreen from './screens/profileKmrs';
import { DeepLinkBackend } from './backends/invitDeepLnkMail';
import { account, databases, config, Query } from './logic/appwriteConfig';
import { UserPermissions, UserProfile } from './backends/invitGestionnaireBackNd';

const Tab = createBottomTabNavigator();

export default function AppRoot() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const fetchUserProfile = async () => {
        try {
            const user = await account.get();
            const resp = await databases.listDocuments(
                config.databaseId,
                config.usersCollectionId,
                [Query.equal('userId', user.$id)]
            );
            if (resp.documents.length > 0) {
                setUserProfile(resp.documents[0] as unknown as UserProfile);
            }
        } catch (e) {
            console.warn("Utilisateur non connecté ou profil introuvable");
        }
    };

    useEffect(() => {
        const checkInviteLink = async () => {
            try {
                const params = await DeepLinkBackend.getInitialInviteURL();
                if (params && params.inviteId) {
                    const result = await DeepLinkBackend.processInvite(params) as {
                        success: boolean;
                        permissions?: UserPermissions;
                    };
                    if (result.success && result.permissions) {
                        Alert.alert("Invitation acceptée", "Bienvenue dans l'équipe !");
                        await fetchUserProfile();
                    }
                }
            } catch (error) {
                console.error("Erreur traitement lien invitation :", error);
            }
        };

        fetchUserProfile();
        checkInviteLink();
    }, []);

    let userPermissions: UserPermissions | undefined;
    if (userProfile?.permissions) {
        try {
            userPermissions = typeof userProfile.permissions === 'string'
                ? JSON.parse(userProfile.permissions)
                : userProfile.permissions;
        } catch (e) {
            console.error("Erreur parse permissions:", e);
        }
    }

    const isCommercant = !userProfile || userProfile.role === 'commercant';

    return (
        <NavigationContainer>
            <Tab.Navigator
                tabBar={(props: BottomTabBarProps) => (
                    <TaBarre
                        activeTab={props.state.routeNames[props.state.index]}
                        onTabPress={(name: string) => props.navigation.navigate(name as never)}
                        allowedTabs={props.state.routeNames}
                    />
                )}
                screenOptions={{ headerShown: false }}
            >
                {(isCommercant || userPermissions?.mystore) && (
                    <Tab.Screen name="tab.myStore" component={MyStoreScreen} />
                )}
                {(isCommercant || userPermissions?.mynews) && (
                    <Tab.Screen name="tab.myNews" component={MyNewsScreen} />
                )}
                {(isCommercant || userPermissions?.commands) && (
                    <Tab.Screen name="tab.commandsMgz" component={CommandsMgzScreen} />
                )}
                {(isCommercant || userPermissions?.recette) && (
                    <Tab.Screen name="tab.revenue" component={RecetteScreen} />
                )}
                <Tab.Screen name="tab.profile" component={ProfileSELLScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}