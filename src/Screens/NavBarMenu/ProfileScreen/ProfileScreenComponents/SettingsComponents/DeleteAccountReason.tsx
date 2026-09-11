import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../../../hooks/useAppTheme';
import { hS, mS, vS } from '../../../../../lib/responsive';
import fonts from '../../../../../constant/fonts';
import { DeleteAccountVerifyScreen_Nav } from '../../../../../Navigations/navigations';
import Button from '../../../../../Components/Button';

const REASONS = [
    { id: '1', label: 'Found a better app' },
    { id: '2', label: 'Privacy concerns' },
    { id: '3', label: 'Not using the service' },
    { id: '4', label: 'Other' },
];

const DeleteAccountReason = ({ navigation }: any) => {
    const { colors: appColors, isDark } = useAppTheme();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);

    const handleContinue = () => {
        navigation.navigate(DeleteAccountVerifyScreen_Nav, { reason: selectedReason });
    };

    return (
        <View style={[styles.container, { backgroundColor: appColors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[fonts.bold, styles.title, { color: appColors.text }]}>
                    Why are you leaving?
                </Text>
                <Text style={[styles.subtitle, { color: appColors.secondaryText }]}>
                    Your feedback helps us improve our service. This step is optional.
                </Text>

                <View style={[styles.card, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
                    {REASONS.map((reason, index) => {
                        const isSelected = selectedReason === reason.label;
                        return (
                            <TouchableOpacity
                                key={reason.id}
                                style={[
                                    styles.reasonRow,
                                    index !== REASONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: appColors.border }
                                ]}
                                onPress={() => setSelectedReason(reason.label)}
                            >
                                <Text style={[fonts.medium, styles.reasonText, { color: appColors.text }]}>
                                    {reason.label}
                                </Text>
                                <MaterialCommunityIcons
                                    name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                                    size={mS(24)}
                                    color={isSelected ? '#EF4444' : appColors.secondaryText}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: appColors.background, borderTopColor: appColors.border }]}>
                <Button
                    style={styles.continueButton}
                    onPress={handleContinue}
                >
                    <Text style={{ color: '#FFFFFF', fontSize: mS(16), fontWeight: '600' }}>Continue</Text>
                </Button>
                <TouchableOpacity style={styles.skipLink} onPress={handleContinue}>
                    <Text style={[styles.skipText, { color: appColors.secondaryText }]}>Skip</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: hS(20),
        paddingBottom: vS(40),
    },
    title: {
        fontSize: mS(24),
        marginBottom: vS(8),
    },
    subtitle: {
        fontSize: mS(14),
        marginBottom: vS(24),
        lineHeight: vS(20),
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    reasonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: hS(16),
        height: vS(56),
    },
    reasonText: {
        fontSize: mS(15),
    },
    footer: {
        padding: hS(20),
        paddingBottom: vS(32),
        borderTopWidth: 1,
    },
    continueButton: {
        width: '100%',
        height: vS(48),
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(16),
        backgroundColor: '#EF4444',
    },
    skipLink: {
        alignItems: 'center',
        paddingVertical: vS(8),
    },
    skipText: {
        fontSize: mS(14),
        fontWeight: '600',
    }
});

export default DeleteAccountReason;
