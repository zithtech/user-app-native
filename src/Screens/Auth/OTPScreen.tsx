import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from "@react-navigation/native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { Car, Logo } from '../../assets/svg';
import { Styles } from '../../lib/styles';
import colors from '../../constant/colors';
import fonts from '../../constant/fonts';
import { RootState } from '../../redux/store';
import Button from '../../Components/Button';
import { OTPInput } from '../../Components';
import { useLogin } from '../../service/auth/login';
import { hS, vS, mS } from '../../lib/responsive';
import { useVerifyOtp } from '../../service/auth/useVerifyOtp';
import { useRequestOtpMutation } from '../../service/authApi'; // ✅ for resend
import { useAppTheme } from '../../hooks/useAppTheme';

const primaryColor = '#102747';
const accentColor = '#D4D4D4';
const textColor = '#333333';
const lightTextColor = '#666666';
const backgroundColor = colors.background || '#F5F5F5';

const OTPScreen: React.FC<any> = ({ navigation }) => {
    const { colors: appColors, isDark } = useAppTheme();
    const route = useRoute<any>();

    // ✅ Fix: correct destructuring from route.params
    const { OTPdata, userData, device_id } = route.params;

    const { LoginUser } = useLogin(navigation);
    const { handleVerifyOtp, loading, error } = useVerifyOtp(navigation);
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const user = useSelector((state: RootState) => state?.userSlice.user);

    const [otp, setOtp] = useState<string>('');
    const [resendTimer, setResendTimer] = useState<number>(59);
    const [canResend, setCanResend] = useState<boolean>(false);
    const [lockoutTime, setLockoutTime] = useState<number>(0);
    const [devOtp, setDevOtp] = useState<string | undefined>(OTPdata?.otp);

    // ✅ For resend OTP
    const [requestOtp, { isLoading: resending }] = useRequestOtpMutation();

    // Countdown timer
    useEffect(() => {
        if (resendTimer === 0) {
            setCanResend(true);
            return;
        }
        const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendTimer]);

    // Lockout timer logic
    useEffect(() => {
        if (error?.includes('locked for 5 minutes')) {
            setLockoutTime(300);
        }
    }, [error]);

    useEffect(() => {
        if (lockoutTime <= 0) return;
        const timer = setInterval(() => {
            setLockoutTime((t) => t - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [lockoutTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ✅ Fix: actual resend API call
    const handleResendCode = async () => {
        if (!canResend) return;
        try {
            const response = await requestOtp({
                phone_number: userData.phone_number,
                role: 'customer',
                device_id,
                allow_new_device: false,
            }).unwrap();

            setOtp('');
            setResendTimer(59);
            setCanResend(false);

            if (response?.data?.otp) {
                setDevOtp(response.data.otp);
            }
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || 'Failed to resend OTP');
        }
    };

    const handleChangeMobileNumber = () => {
        if (OTPdata?.exists) {
            navigation.goBack();
        } else {
            navigation.navigate('SignUpScreen');
        }
    };

    // ✅ Fix: added handleVerifyOtp to dependency array
    // const handleOtpChange = useCallback(async (text: string) => {
    //     setOtp(text);
    //     console.log(text, 'text');

    //     if (text.length === 4) {
    //         await callHandleVerifyOtp(text);
    //     }
    // }, [handleVerifyOtp]);
    const handleOtpChange = useCallback(async (text: string) => {
        setOtp(text);

        if (text.length === 4) {
            // ✅ call handleVerifyOtp directly, no intermediate function
            await handleVerifyOtp({
                phone_number: userData.phone_number,
                otp: text,
                device_id,
                role: 'customer',
                allow_new_device: false,
                //             errorContainer: {
                //     flexDirection: "row",
                //     alignItems: "center",
                //     backgroundColor: "#FEF2F2",
                //     paddingHorizontal: hS(12),
                //     paddingVertical: vS(8),
                //     borderRadius: mS(10),
                //     marginTop: vS(16),
                //     gap: hS(8),
                //     width: "100%",
                // },
                // errorText: {
                //     fontSize: mS(12),
                //     color: "#EF4444",
                //     fontWeight: "600",
                //     flex: 1,
                // },
            });
        }
    }, [handleVerifyOtp, userData.phone_number, device_id]); // ✅ all deps included

    // ✅ Fix: pass role and allow_new_device
    // const callHandleVerifyOtp = async (otpValue: string) => {
    //     await handleVerifyOtp({
    //         phone_number: userData.phone_number,
    //         otp: otpValue,
    //         device_id,
    //         role: 'customer',           // ✅ required
    //         allow_new_device: false, // ✅ required, handled inside hook on DEVICE_CONFLICT
    //         errorContainer: {
    //         flexDirection: "row",
    //         alignItems: "center",
    //         backgroundColor: "#FEF2F2",
    //         paddingHorizontal: hS(12),
    //         paddingVertical: vS(8),
    //         borderRadius: mS(10),
    //         marginTop: vS(16),
    //         gap: hS(8),
    //         width: "100%",
    //     },
    //     errorText: {
    //         fontSize: mS(12),
    //         color: "#EF4444",
    //         fontWeight: "600",
    //         flex: 1,
    //     },
    // });
    // };

    return (
        <View style={[
            localStyles.container,
            {
                paddingTop: insets.top + vS(10),
                paddingBottom: insets.bottom + vS(20),
                backgroundColor: isDark ? '#020813' : appColors.background,
            }
        ]}>
            {isDark && (
                <View style={{ position: 'absolute', bottom: 0, width: Dimensions.get('window').width, height: vS(160), zIndex: -1 }}>
                    <Image
                        source={require('../../assets/png/SignupBackground.png')}
                        style={{ width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute', transform: [{ scaleY: -1 }] }}
                    />
                </View>
            )}
            <View style={Styles.flex}>
                {/* HEADER ROW */}
                <View style={[localStyles.headerRow, isDark && { zIndex: 10 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={appColors.text} />
                    </TouchableOpacity>
                    <View style={localStyles.logoContainer}>
                        {/* <Logo width={hS(90)} height={vS(24)} /> */}
                        {
                            isDark ?
                                <Image
                                    source={require('../../assets/png/T2DriveLogo.png')}
                                    style={{ width: hS(100), height: vS(24), resizeMode: 'contain' }}
                                />
                                : <Image
                                    source={require('../../assets/png/T2DriveDarkLogo.png')}
                                    style={{ width: hS(100), height: vS(24), resizeMode: 'contain' }}
                                />
                        }

                    </View>
                    {/* Empty view for flex balancing */}
                    <View style={localStyles.backButton} />
                </View>

                {/* ILLUSTRATION */}
                {isDark ? (
                    <View style={{ width: Dimensions.get('window').width, height: vS(260), marginLeft: hS(0), marginTop: -(insets.top + vS(64)), marginBottom: vS(20), pointerEvents: 'none', zIndex: 1, alignItems: 'center' }}>
                        {/* <Image
                            source={require('../../assets/png/LoginScreenImageBackground.png')}
                            style={{ width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' }}
                        /> */}
                        <Image
                            source={require('../../assets/png/OTPScreenShieldImage.png')}
                            style={{ width: hS(220), height: vS(180), resizeMode: 'contain', position: 'absolute', bottom: vS(10), alignSelf: 'center' }}
                        />
                    </View>
                ) : (
                    <View style={localStyles.illustrationContainer}>
                        <Image
                            source={require('../../assets/png/OTPImage.png')}
                            style={{ width: hS(280), height: vS(180), resizeMode: 'contain' }}
                        />
                    </View>
                )}

                {/* TEXT CONTENT */}
                <View style={[localStyles.textContent, isDark && { zIndex: 10 }]}>
                    <View style={[localStyles.badgeContainer, isDark && { backgroundColor: '#BBEBFA' }]}>
                        <Text style={[localStyles.badgeText, isDark && { color: '#0369A1' }]}>VERIFICATION CODE</Text>
                    </View>
                    <Text style={[localStyles.titleText, { color: isDark ? '#FFFFFF' : appColors.text }]}>
                        {OTPdata?.exists ? "Welcome Back!" : "Almost There!"}
                    </Text>
                    <Text style={[localStyles.descriptionText, { color: isDark ? '#9CA3AF' : appColors.lightTextColor }]}>
                        {OTPdata?.exists
                            ? `Enter the 4-digit code sent to`
                            : `Let's verify your account for`}
                    </Text>
                    <Text style={[localStyles.phoneNumberText, { color: isDark ? '#FFFFFF' : appColors.text }]}>
                        {userData?.phone_number || user?.phone_number}
                    </Text>
                </View>

                {/* OTP SECTION (Flat) */}
                <View style={localStyles.otpSection}>
                    <OTPInput
                        numberOfDigits={4}
                        onChangeText={handleOtpChange}
                        value={otp}
                        editable={lockoutTime === 0}
                    />

                    {/* TEMPORARY OTP */}
                    {devOtp ? (
                        <View style={[localStyles.devOtpBanner, isDark && { backgroundColor: '#FFFFFF' }]}>
                            <MaterialCommunityIcons name="information-outline" size={mS(16)} color="#0284C7" />
                            <Text style={localStyles.devOtpText}>
                                Temporary Dev OTP: {devOtp}
                            </Text>
                        </View>
                    ) : null}

                    {lockoutTime > 0 ? (
                        <View style={localStyles.errorContainer}>
                            <MaterialCommunityIcons name="clock-outline" size={mS(16)} color="#EF4444" />
                            <Text style={localStyles.errorText}>Locked! Try again in {formatTime(lockoutTime)}</Text>
                        </View>
                    ) : (error?.includes('locked for 5 minutes') && lockoutTime === 0) ? (
                        <View style={[localStyles.errorContainer, { backgroundColor: '#F0FDF4' }]}>
                            <MaterialCommunityIcons name="check-circle-outline" size={mS(16)} color="#10B981" />
                            <Text style={[localStyles.errorText, { color: '#10B981' }]}>You can try now</Text>
                        </View>
                    ) : error ? (
                        <View style={localStyles.errorContainer}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={mS(16)} color="#EF4444" />
                            <Text style={localStyles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={localStyles.resendContainer}>
                        <Text style={[localStyles.notReceivedText, { color: isDark ? '#9CA3AF' : appColors.lightTextColor }]}>Didn't receive the code? </Text>
                        <TouchableOpacity onPress={handleResendCode} disabled={!canResend || resending}>
                            <Text style={[
                                localStyles.resendLink,
                                { color: canResend ? (isDark ? '#00C2FF' : '#0B3370') : (isDark ? '#00C2FF' : '#38BDF8') }
                            ]}>
                                {resending ? 'Resending...' : canResend ? 'Resend Now' : `Resend in ${resendTimer}s`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Loader */}
                {loading && (
                    <ActivityIndicator size="large" color="#0B3370" style={localStyles.loader} />
                )}

                {/* OR Divider & Action Button */}
                <View style={[localStyles.actionSection, isDark && { zIndex: 10 }]}>
                    <View style={localStyles.dividerContainer}>
                        <View style={[localStyles.line, isDark && { backgroundColor: '#152B4D' }]} />
                        <Text style={[localStyles.orText, isDark && { color: '#FFFFFF' }]}>OR</Text>
                        <View style={[localStyles.line, isDark && { backgroundColor: '#152B4D' }]} />
                    </View>

                    <TouchableOpacity
                        onPress={handleChangeMobileNumber}
                        activeOpacity={0.8}
                        style={[localStyles.outlineActionButton, { backgroundColor: isDark ? '#041026' : appColors.card, borderColor: isDark ? '#152B4D' : appColors.border, borderRadius: isDark ? mS(12) : mS(8) }]}
                    >
                        <MaterialCommunityIcons name="phone-outline" size={mS(20)} color={isDark ? '#FFFFFF' : appColors.text} style={{ marginRight: hS(8) }} />
                        <Text style={[localStyles.outlineActionText, { color: isDark ? '#FFFFFF' : appColors.text }]}>
                            {OTPdata?.exists ? `Change Mobile Number` : `Change Number`}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: hS(24),
        marginBottom: vS(20),
    },
    backButton: {
        width: mS(40),
        alignItems: 'flex-start',
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: vS(10),
    },
    textContent: {
        alignItems: 'center',
        paddingHorizontal: hS(24),
        marginBottom: vS(20),
    },
    badgeContainer: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: hS(12),
        paddingVertical: vS(4),
        borderRadius: mS(12),
        marginBottom: vS(12),
    },
    badgeText: {
        color: '#0284C7',
        fontSize: mS(10),
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    titleText: {
        fontSize: mS(24),
        fontWeight: '800',
        marginBottom: vS(8),
    },
    descriptionText: {
        fontSize: mS(13),
        fontWeight: '500',
        marginBottom: vS(4),
    },
    phoneNumberText: {
        fontSize: mS(15),
        fontWeight: '800',
    },
    otpSection: {
        paddingHorizontal: hS(24),
        alignItems: 'center',
        marginTop: vS(10),
    },
    devOtpBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0F2FE',
        borderRadius: mS(8),
        paddingVertical: vS(10),
        paddingHorizontal: hS(16),
        width: '100%',
        marginTop: vS(20),
    },
    devOtpText: {
        color: '#0284C7',
        fontSize: mS(12),
        fontWeight: '700',
        marginLeft: hS(6),
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: vS(24),
    },
    notReceivedText: {
        fontSize: mS(12),
        fontWeight: '500',
    },
    resendLink: {
        fontSize: mS(12),
        fontWeight: '700',
    },
    loader: {
        marginTop: vS(20),
    },
    actionSection: {
        marginTop: 'auto',
        paddingHorizontal: hS(24),
        paddingBottom: vS(20),
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vS(20),
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#F1F5F9',
    },
    orText: {
        paddingHorizontal: hS(16),
        fontSize: mS(11),
        fontWeight: '700',
        color: '#94A3B8',
    },
    outlineActionButton: {
        flexDirection: 'row',
        height: vS(48),
        borderRadius: mS(8),
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outlineActionText: {
        fontSize: mS(14),
        fontWeight: '700',
        color: '#0F172A',
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        paddingHorizontal: hS(12),
        paddingVertical: vS(8),
        borderRadius: mS(8),
        marginTop: vS(16),
        width: "100%",
    },
    errorText: {
        fontSize: mS(12),
        color: "#EF4444",
        fontWeight: "600",
        marginLeft: hS(6),
        flex: 1,
    },
});

export default OTPScreen;