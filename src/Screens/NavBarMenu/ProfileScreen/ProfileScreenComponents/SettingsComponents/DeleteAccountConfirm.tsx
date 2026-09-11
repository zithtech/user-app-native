import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../../../hooks/useAppTheme';
import { hS, mS, vS } from '../../../../../lib/responsive';
import fonts from '../../../../../constant/fonts';
import { DeleteAccountSuccessScreen_Nav } from '../../../../../Navigations/navigations';
import Button from '../../../../../Components/Button';
import { useVerifyOTPForDeleteMutation } from '../../../../../service/userApi';
import { useSelector } from 'react-redux';

const DeleteAccountConfirm = ({ route, navigation }: any) => {
    const { colors: appColors, isDark } = useAppTheme();
    const { reason, otp } = route.params || {};
    const localuser = useSelector((state: any) => state?.userSlice?.user);
    const [verifyOTP, { isLoading: isDeleting }] = useVerifyOTPForDeleteMutation();
    const [isChecked, setIsChecked] = useState(false);

    const handleDelete = async () => {
        try {
            if (localuser?.id) {
                await verifyOTP({ 
                    id: localuser.id, 
                    otp, 
                    reason,
                    phone_number: localuser.phone_number,
                    role: localuser.role || 'customer',
                    device_id: localuser.device_id || 'unknown_device_id_12345'
                }).unwrap();
            }
            navigation.navigate(DeleteAccountSuccessScreen_Nav);
        } catch (error) {
            console.error('Delete account failed', JSON.stringify(error));
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: appColors.background }]}>
            <View style={styles.content}>
                <View style={styles.warningIconContainer}>
                    <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}>
                        <MaterialCommunityIcons name="alert-decagram-outline" size={mS(32)} color="#EF4444" />
                    </View>
                </View>

                <Text style={[fonts.bold, styles.title, { color: appColors.text }]}>
                    Final Confirmation
                </Text>

                <View style={[styles.warningBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
                    <Text style={[styles.warningText, { color: appColors.text }]}>
                        This action cannot be undone after 30 days. Your account and all associated data will be permanently erased per the DPDP Act 2023, except for legally required financial records.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.checkboxContainer}
                    activeOpacity={0.7}
                    onPress={() => setIsChecked(!isChecked)}
                >
                    <MaterialCommunityIcons
                        name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"}
                        size={mS(24)}
                        color={isChecked ? '#EF4444' : appColors.secondaryText}
                    />
                    <Text style={[styles.checkboxLabel, { color: appColors.text }]}>
                        I understand my account will be permanently deleted and this cannot be undone after the grace period.
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.footer, { backgroundColor: appColors.background, borderTopColor: appColors.border }]}>
                <Button
                    style={[
                        styles.deleteButton,
                        { backgroundColor: '#EF4444', opacity: (!isChecked || isDeleting) ? 0.5 : 1 }
                    ]}
                    onPress={handleDelete}
                    disabled={!isChecked || isDeleting}
                >
                    <Text style={[fonts.bold, { color: '#FFFFFF' }]}>
                        {isDeleting ? "Processing..." : "Delete My Account"}
                    </Text>
                </Button>
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
        flex: 1,
    },
    warningIconContainer: {
        alignItems: 'center',
        marginVertical: vS(20),
    },
    iconBox: {
        width: hS(64),
        height: hS(64),
        borderRadius: hS(32),
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: mS(22),
        textAlign: 'center',
        marginBottom: vS(24),
    },
    warningBox: {
        padding: hS(16),
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: vS(32),
    },
    warningText: {
        fontSize: mS(14),
        lineHeight: vS(22),
        textAlign: 'center',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingRight: hS(24),
    },
    checkboxLabel: {
        fontSize: mS(14),
        marginLeft: hS(12),
        lineHeight: vS(20),
    },
    footer: {
        padding: hS(20),
        paddingBottom: vS(32),
        borderTopWidth: 1,
    },
    deleteButton: {
        width: '100%',
        height: vS(48),
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default DeleteAccountConfirm;
