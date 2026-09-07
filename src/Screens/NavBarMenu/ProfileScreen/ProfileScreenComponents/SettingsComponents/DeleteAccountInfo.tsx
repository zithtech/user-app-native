import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../../../hooks/useAppTheme';
import { hS, mS, vS } from '../../../../../lib/responsive';
import fonts from '../../../../../constant/fonts';
import { DeleteAccountReasonScreen_Nav } from '../../../../../Navigations/navigations';
import Button from '../../../../../Components/Button';
import { useInitiateDeleteAccountMutation } from '../../../../../service/userApi';
import { useSelector } from 'react-redux';

const DeleteAccountInfo = ({ navigation }: any) => {
    const { colors: appColors, isDark } = useAppTheme();
    const localuser = useSelector((state: any) => state?.userSlice?.user);
    const [initiateDelete, { isLoading }] = useInitiateDeleteAccountMutation();
    const [hasBlockingCondition, setHasBlockingCondition] = useState(false);

    return (
        <ScrollView style={[styles.container, { backgroundColor: appColors.background }]} contentContainerStyle={styles.content}>
            <View style={styles.headerContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={mS(48)} color="#EF4444" style={styles.icon} />
                <Text style={[fonts.bold, styles.title, { color: appColors.text }]}>
                    Delete your account permanently
                </Text>
            </View>

            {hasBlockingCondition && (
                <View style={[styles.banner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}>
                    <MaterialCommunityIcons name="alert" size={mS(20)} color="#EF4444" />
                    <Text style={[styles.bannerText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                        You have an active ride or pending balance. Please resolve this before deleting your account.
                    </Text>
                </View>
            )}

            <View style={[styles.card, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
                <Text style={[fonts.semiBold, styles.cardTitle, { color: appColors.text }]}>What happens next?</Text>

                <View style={styles.bulletItem}>
                    <MaterialCommunityIcons name="account-remove-outline" size={mS(20)} color={appColors.secondaryText} />
                    <Text style={[styles.bulletText, { color: appColors.text }]}>
                        Your profile, saved places, and preferences will be permanently deleted.
                    </Text>
                </View>

                <View style={styles.bulletItem}>
                    <MaterialCommunityIcons name="wallet-outline" size={mS(20)} color={appColors.secondaryText} />
                    <Text style={[styles.bulletText, { color: appColors.text }]}>
                        Your wallet balance (if any) must be withdrawn or settled first.
                    </Text>
                </View>

                <View style={styles.bulletItem}>
                    <MaterialCommunityIcons name="history" size={mS(20)} color={appColors.secondaryText} />
                    <Text style={[styles.bulletText, { color: appColors.text }]}>
                        Trip and payment history will be retained for 7 years as required by law, even after deletion.
                    </Text>
                </View>

                <View style={styles.bulletItem}>
                    <MaterialCommunityIcons name="clock-outline" size={mS(20)} color={appColors.secondaryText} />
                    <Text style={[styles.bulletText, { color: appColors.text }]}>
                        You'll have a 30-day grace period to log back in and cancel this request.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    style={[styles.continueButton, {
                        backgroundColor: 'transparent',
                        borderColor: '#EF4444',
                        borderWidth: 1,
                        opacity: hasBlockingCondition ? 0.5 : 1
                    }]}
                    onPress={async () => {
                        if (!hasBlockingCondition) {
                            try {
                                if (localuser?.id) {
                                    await initiateDelete(localuser.id).unwrap();
                                }
                                navigation.navigate(DeleteAccountReasonScreen_Nav);
                            } catch (error: any) {
                                setHasBlockingCondition(true);
                            }
                        }
                    }}
                    disabled={hasBlockingCondition || isLoading}
                >
                    <Text style={[styles.continueButtonText, { color: '#EF4444' }]}>
                        {isLoading ? 'Processing...' : 'Continue'}
                    </Text>
                </Button>
                <TouchableOpacity style={styles.cancelLink} onPress={() => navigation.goBack()}>
                    <Text style={[styles.cancelText, { color: appColors.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    headerContainer: {
        alignItems: 'center',
        marginVertical: vS(24),
    },
    icon: {
        marginBottom: vS(16),
    },
    title: {
        fontSize: mS(20),
        textAlign: 'center',
    },
    banner: {
        flexDirection: 'row',
        padding: hS(12),
        borderRadius: 8,
        marginBottom: vS(20),
        alignItems: 'flex-start',
    },
    bannerText: {
        fontSize: mS(12),
        marginLeft: hS(8),
        flex: 1,
        lineHeight: vS(18),
    },
    card: {
        borderRadius: 12,
        padding: hS(16),
        borderWidth: 1,
        marginBottom: vS(32),
    },
    cardTitle: {
        fontSize: mS(14),
        marginBottom: vS(16),
    },
    bulletItem: {
        flexDirection: 'row',
        marginBottom: vS(16),
        alignItems: 'flex-start',
    },
    bulletText: {
        fontSize: mS(13),
        marginLeft: hS(12),
        flex: 1,
        lineHeight: vS(20),
    },
    footer: {
        marginTop: 'auto',
    },
    continueButton: {
        width: '100%',
        height: vS(48),
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(16),
    },
    continueButtonText: {
        fontSize: mS(16),
        fontWeight: 'bold',
    },
    cancelLink: {
        alignItems: 'center',
        paddingVertical: vS(8),
    },
    cancelText: {
        fontSize: mS(14),
        fontWeight: '600',
    }
});

export default DeleteAccountInfo;
