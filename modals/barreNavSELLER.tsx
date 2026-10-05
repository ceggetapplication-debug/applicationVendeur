import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';

type BarreNavigationProps = {
    activeTab?: string;
    onTabPress?: (id: string) => void;
    allowedTabs?: readonly string[];
};

const tabs = [
    { id: 'tab.myStore', icon: 'storefront-outline', activeIcon: 'storefront' },
    { id: 'tab.myNews', icon: 'newspaper-outline', activeIcon: 'newspaper' },
    { id: 'tab.commandsMgz', icon: 'cart-outline', activeIcon: 'cart' },
    { id: 'tab.revenue', icon: 'cash-outline', activeIcon: 'cash' },
    { id: 'tab.profile', icon: 'person-outline', activeIcon: 'person' },
] as const;

const colorScheme = useColorScheme();
const theme = colorScheme === 'dark' ? 'dark' : 'light';
const colors = Colors[theme];

const BarreNavigation = ({
    activeTab: activeTabProp = 'tab.myStore',
    onTabPress,
    allowedTabs,
}: BarreNavigationProps) => {
    const [internalTab, setInternalTab] = useState(activeTabProp);
    const activeTab = onTabPress ? activeTabProp : internalTab;

    const handlePress = (id: string) => {
        if (onTabPress) {
            onTabPress(id);
        } else {
            setInternalTab(id);
        }
    };

    const visibleTabs = allowedTabs
        ? tabs.filter((tab) => allowedTabs.includes(tab.id))
        : tabs;

    return (
        <View style={styles.container}>
            {visibleTabs.map((tab, index) => (
                <React.Fragment key={tab.id}>
                    <TouchableOpacity style={styles.tab} onPress={() => handlePress(tab.id)}>
                        <Ionicons
                            name={(activeTab === tab.id ? tab.activeIcon : tab.icon) as keyof typeof Ionicons.glyphMap}
                            size={24}
                            color={activeTab === tab.id ? '#78290f' : '#001524'}
                        />
                    </TouchableOpacity>
                    {index < visibleTabs.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
            ))}
        </View>
    );
};

const getStyles = (theme: 'light' | 'dark') => {
    const colors = Colors[theme];
    return StyleSheet.create({
        container: {
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            width: '100%',
            height: 50,
            backgroundColor: 'rgba(255, 236, 209, 0.6)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            borderRadius: 30,
            overflow: 'hidden',
            borderWidth: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
        },
        tab: {
            flex: 1,
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
        },
        separator: {
            width: 1,
            height: 20,
            backgroundColor: '#313630',
        },
    });
};

export default BarreNavigation;