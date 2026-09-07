import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useAppTheme } from '../../../../../hooks/useAppTheme';
import { hS, mS, vS } from '../../../../../lib/responsive';
import fonts from '../../../../../constant/fonts';
import { DeleteAccountConfirmScreen_Nav } from '../../../../../Navigations/navigations';
import Button from '../../../../../Components/Button';
import { useSelector } from 'react-redux';
import { useRequestOtpMutation } from '../../../../../service/authApi';

const DeleteAccountVerify = ({ route, navigation }: any) => {
    const { colors: appColors, isDark } = useAppTheme();
    const { reason } = route.params || {};
    const localuser = useSelector((state: any) => state?.userSlice?.user);
    const [requestOtp] = useRequestOtpMutation();
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        if (localuser?.phone_number) {
            requestOtp({
                phone_number: localuser.phone_number,
                role: localuser.role || 'customer', // pass the role
                device_id: localuser.device_id || 'unknown_device_id_12345' // pass a 16+ char device id
            });
        }
    }, [localuser?.phone_number]);

    const handleResend = () => {
        if (localuser?.phone_number) {
            requestOtp({
                phone_number: localuser.phone_number,
                role: localuser.role || 'customer',
                device_id: localuser.device_id || 'unknown_device_id_12345'
            });
        }
    };

    const handleVerify = () => {
        setIsSubmitting(true);

        setTimeout(() => {
            setIsSubmitting(false);
            navigation.navigate(DeleteAccountConfirmScreen_Nav, { reason, otp });
        }, 800);
    };

    return (
        <View style={[styles.container, { backgroundColor: appColors.background }]}>
            <View style={styles.content}>
                <Text style={[fonts.bold, styles.title, { color: appColors.text }]}>
                    Verify it's you
                </Text>
                <Text style={[styles.subtitle, { color: appColors.secondaryText }]}>
                    We've sent a 6-digit code to your registered mobile number.
                </Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.otpInput,
                            {
                                backgroundColor: appColors.card,
                                borderColor: appColors.border,
                                color: appColors.text,
                                letterSpacing: mS(8)
                            }
                        ]}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="0000"
                        placeholderTextColor={appColors.secondaryText}
                    />
                </View>

                <View style={styles.helpLinks}>
                    <TouchableOpacity onPress={handleResend}>
                        <Text style={[styles.linkText, { color: appColors.primary }]}>
                            Resend OTP
                        </Text>
                    </TouchableOpacity>
                    <View style={[styles.dot, { backgroundColor: appColors.border }]} />
                    <TouchableOpacity>
                        <Text style={[styles.linkText, { color: appColors.primary }]}>
                            Need help? Contact support
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.footer, { backgroundColor: appColors.background, borderTopColor: appColors.border }]}>
                <Button
                    style={styles.verifyButton}
                    onPress={handleVerify}
                    disabled={otp.length !== 4 || isSubmitting}
                >
                    <Text style={[fonts.bold, { color: appColors.background, fontSize: mS(16) }]}>
                        {isSubmitting ? "Verifying..." : "Verify"}
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
    title: {
        fontSize: mS(24),
        marginBottom: vS(8),
    },
    subtitle: {
        fontSize: mS(14),
        marginBottom: vS(32),
        lineHeight: vS(20),
    },
    inputContainer: {
        alignItems: 'center',
        marginBottom: vS(24),
    },
    otpInput: {
        width: '100%',
        height: vS(56),
        borderWidth: 1,
        borderRadius: 12,
        fontSize: mS(24),
        fontWeight: 'bold',
        textAlign: 'center',
    },
    helpLinks: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkText: {
        fontSize: mS(14),
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginHorizontal: hS(12),
    },
    footer: {
        padding: hS(20),
        paddingBottom: vS(32),
        borderTopWidth: 1,
    },
    verifyButton: {
        width: '100%',
        height: vS(48),
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default DeleteAccountVerify;
