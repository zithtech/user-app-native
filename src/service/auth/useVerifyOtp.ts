
import { useState } from 'react';
import { Alert } from 'react-native';
import { useVerifyOtpMutation, useCancelDeleteAccountMutation } from '../userApi';
import { useDispatch } from 'react-redux';
import { setUser } from '../../redux/userSlice';
import { showConfirmDialog } from '../utils/showConfirmDialog';
import { storage } from '../utils/storage';
import { OTPSuccessScreen_Nav, SignUpScreen_Nav, TabNavigation_Nav } from '../../Navigations/navigations';
import { getFcmToken } from '../../notifications';
import { OnboardingStatus } from '../../enums/user.enum';

interface VerifyOtpParams {
    phone_number: string;
    otp: string;
    device_id: string;
    role?: string;
    fcm_token?: string;
    allow_new_device?: boolean;
    isRetry?: boolean;
}

export const useVerifyOtp = (navigation: any) => {
    const dispatch = useDispatch();
    const [verifyOtp] = useVerifyOtpMutation();
    const [cancelDelete] = useCancelDeleteAccountMutation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerifyOtp = async ({
        phone_number,
        otp,
        device_id,
        role = 'customer',
        allow_new_device = false,
        isRetry = false,
    }: VerifyOtpParams) => {
        if (!isRetry) {
            setLoading(true);
            setError(null);
        }
        try {
            const fcm_token = await getFcmToken()

            const response = await verifyOtp({
                phone_number,
                role,
                otp,
                device_id,
                allow_new_device,
                fcm_token,
            }).unwrap();

            const { verified, isNewUser, accessToken, refreshToken, userData } = response.data;

            if (!verified) {
                setError('OTP verification failed');
                Alert.alert('Error', 'OTP verification failed');
                return;
            }

            
            // Save tokens and user early so that RTK Query has auth headers for the cancel API
            await storage.setAccessToken(accessToken);
            await storage.setRefreshToken(refreshToken);
            dispatch(setUser(userData));

            if (response.data.pending_deletion?.is_pending) {

                const confirmed = await showConfirmDialog(
                    'Your account is scheduled for deletion. Do you want to cancel the deletion request and restore your account?',
                    'Restore Account',
                    'Yes, Restore'
                );

                if (confirmed) {
                    try {
                        await cancelDelete(userData.id).unwrap();
                        Alert.alert("Success", "Account deletion cancelled successfully. Welcome back!");
                    } catch (e: any) {
                        console.log(e, "error restore")
                        setError('Failed to restore account');
                        Alert.alert('Error', 'Failed to restore account. Please contact support.');
                        return;
                    }
                } else {
                    // Abort login: clear the early saved tokens so they aren't logged in on reload
                    await storage.removeAccessToken();
                    await storage.removeRefreshToken();
                    dispatch(setUser(null)); 
                    return; 
                }
            }



            // Navigate based on onboarding status
            const status = userData?.onboarding_status;
            let targetScreen = TabNavigation_Nav;

            if (status === OnboardingStatus.COMPLETED || status === OnboardingStatus.PROFILE_COMPLETED) {
                targetScreen = TabNavigation_Nav;
            } else if (status === OnboardingStatus.PHONE_VERIFIED || status === OnboardingStatus.PENDING) {
                targetScreen = SignUpScreen_Nav;
            } else {
                targetScreen = isNewUser ? SignUpScreen_Nav : TabNavigation_Nav;
            }

            if (targetScreen === SignUpScreen_Nav) {
                Alert.alert(
                    'Welcome! 👋',
                    "You don't have an account yet. Let's create one.",
                    [
                        {
                            text: 'Continue to Sign Up',
                            onPress: () => navigation.replace(OTPSuccessScreen_Nav, { targetScreen })
                        }
                    ],
                    { cancelable: false }
                );
            } else {
                navigation.replace(OTPSuccessScreen_Nav, { targetScreen });
            }

        } catch (error: any) {
            const err = error?.data?.data || error?.data?.error || error;
            console.log("verifyOtp Error", err);
            const fcm_token = await getFcmToken() || "";

            if (err?.code === 'DEVICE_CONFLICT') {
                const confirmed = await showConfirmDialog(
                    'You are logged in on another device. Log out from that device?'
                );

                if (confirmed) {
                    await handleVerifyOtp({
                        phone_number,
                        otp,
                        device_id,
                        role,
                        fcm_token,
                        allow_new_device: true,
                        isRetry: true,  // ✅ skip loading reset
                    });
                }
                return;
            }

            if (err?.code === 'OTP_EXPIRED') {
                setError('OTP has expired. Please request a new one.');
                Alert.alert('Expired', 'OTP has expired. Please request a new one.');
                return;
            }

            if (err?.code === 'INVALID_OTP') {
                setError('Incorrect OTP. Please try again.');
                Alert.alert('Invalid', 'Incorrect OTP. Please try again.');
                return;
            }

            if (err?.code === 'VALIDATION_ERROR') {
                setError(err?.message || 'Invalid OTP. Please try again.');
                Alert.alert('Invalid', err?.message || 'Invalid OTP. Please try again.');
                return;
            }

            if (err?.code === 'TOO_MANY_ATTEMPTS') {
                setError('Too many attempts. Your account is locked for 5 minutes.');
                Alert.alert('Blocked', 'Too many attempts. Your account is locked for 5 minutes.');
                return;
            }

            setError(err?.message || 'Verification failed');
            Alert.alert('Error', err?.message || 'Verification failed');
        } finally {
            if (!isRetry) setLoading(false); // ✅ only stop on initial call
        }
    };

    return { handleVerifyOtp, loading, error };
};