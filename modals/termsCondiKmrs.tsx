import React from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../constants/Colors';
import { TEXT_BEFORE_COMMISSIONS, TEXT_BEFORE_VIEWS, TEXT_BEFORE_PICKUP, TEXT_AFTER, COMMISSIONS_TABLE, VIEWS_TABLE, PICKUP_TABLE, } from '../constants/termsConditionsKmrs';

interface TermsModalProps {
    visible: boolean;
    onClose: () => void;
}

const Table = ({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) => {
    const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
    const colors = Colors[colorScheme];
    const theme = colorScheme === 'dark' ? 'dark' : 'light';
    const styles = getStyles(theme);

    return (
        <View style={[styles.tableContainer, { borderColor: colors.surface }]}>
            <View style={[styles.tableHeader, { backgroundColor: colors.surface }]}>
                {headers.map((h, i) => (
                    <Text key={i} style={[styles.headerCell, { flex: i === 0 ? 2 : 1, color: colors.textNormal }]}>
                        {h}
                    </Text>
                ))}
            </View>
            {rows.map((row, rIdx) => (
                <View key={rIdx} style={[styles.tableRow, { borderTopWidth: 1, borderTopColor: colors.surface }]}>
                    {row.map((cell, cIdx) => (
                        <Text key={cIdx} style={[styles.dataCell, { flex: cIdx === 0 ? 2 : 1, color: colors.text }]}>
                            {cell}
                        </Text>
                    ))}
                </View>
            ))}
        </View>
    );
};

export const TermsModal = ({ visible, onClose }: TermsModalProps) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? 'dark' : 'light';
    const colors = Colors[theme];
    const styles = getStyles(theme);

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Conditions Générales</Text>
                    <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
                        <Ionicons name="close-outline" size={28} color={colors.textNormal} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.termsText}>{TEXT_BEFORE_COMMISSIONS}</Text>

                    <Text style={styles.sectionTitle}>Tableau 1 : Commissions sur les Livraisons</Text>
                    <Table headers={["Types de commerces", "Commerçant (%)", "Cegget (%)"]} rows={COMMISSIONS_TABLE} />

                    <Text style={styles.termsText}>{TEXT_BEFORE_VIEWS}</Text>

                    <Text style={styles.sectionTitle}>Tableau 2 : Tarifs des Vues ( Visibilité )</Text>
                    <Table headers={["Types de commerces", "Taux (%)", "100 Vues (DZD)"]} rows={VIEWS_TABLE} />

                    <Text style={styles.termsText}>{TEXT_BEFORE_PICKUP}</Text>

                    <Text style={styles.sectionTitle}>Tableau 3 : Tarifs des Commandes Pick-up</Text>
                    <Table headers={["Types de commerces", "Taux (%)", "10 Pick-up (DZD)"]} rows={PICKUP_TABLE} />

                    <Text style={styles.termsText}>{TEXT_AFTER}</Text>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.iconButton} onPress={onClose}>
                        <Ionicons name="checkmark-circle-outline" size={36} color={colors.tint} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const getStyles = (theme: 'light' | 'dark') => {
    const colors = Colors[theme];

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.surface,
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.textNormal,
            flex: 1,
            marginRight: 10,
        },
        closeIcon: {
            padding: 4,
        },
        scrollView: {
            flex: 1,
            paddingHorizontal: 20,
        },
        scrollContent: {
            paddingVertical: 16,
        },
        termsText: {
            fontSize: 13,
            lineHeight: 21,
            color: colors.text,
            marginBottom: 12,
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: colors.tint,
            marginTop: 16,
            marginBottom: 8,
        },
        tableContainer: {
            borderWidth: 1,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 16,
        },
        tableHeader: {
            flexDirection: 'row',
            paddingVertical: 10,
            paddingHorizontal: 8,
        },
        headerCell: {
            fontSize: 11,
            fontWeight: 'bold',
            textAlign: 'center',
        },
        tableRow: {
            flexDirection: 'row',
            paddingVertical: 8,
            paddingHorizontal: 8,
        },
        dataCell: {
            fontSize: 11,
            textAlign: 'center',
        },
        footer: {
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconButton: {
            padding: 8,
            alignItems: 'center',
            justifyContent: 'center',
        },
    });
};