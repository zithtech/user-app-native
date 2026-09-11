import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet, View, Text, ScrollView, Switch,
    StatusBar, ActivityIndicator, Alert,
    Platform,
    AppState, AppStateStatus
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../../constant/colors';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import { useGetUserQuery, useUpdateUserMutation } from '../../../../../service/userApi';
import { updateUserStore } from '../../../../../redux/userSlice';
import {
    checkNotifications,
    requestNotifications,
    RESULTS,
    openSettings
} from 'react-native-permissions';
import { useAppTheme } from "../../../../../hooks/useAppTheme";
import { useResponsive } from '../../../../../hooks/useResponsive';
import { ResponsiveContainer } from '../../../../../Components/ResponsiveContainer';

type PreferenceKey = 'invoice_email' | 'promo_email' | 'whatsapp_updates' | 'push_notifications' | 'sms_alerts';

type SettingsPreference = {
    invoice_email: boolean,
    promo_email: boolean,
    whatsapp_updates: boolean,
    push_notifications: boolean,
    sms_alerts: boolean,
}

const initialSettingsPreference = {
    invoice_email: false,
    promo_email: false,
    whatsapp_updates: false,
    push_notifications: false,
    sms_alerts: false,
}

const Preferences = () => {
    const { data: userData, isLoading } = useGetUserQuery()
    const insets = useSafeAreaInsets();
    const localuser = useSelector((state: RootState) => state?.userSlice?.user);
    const dispatch = useDispatch()
    const [updateUser] = useUpdateUserMutation();
    const [loading, setLoading] = useState(false);
    const [updatingKey, setUpdatingKey] = useState<string | null>(null);
    const [settings, setSettings] = useState<SettingsPreference>(localuser?.settings_preferences ? localuser?.settings_preferences : initialSettingsPreference);
    const { colors: appColors, isDark } = useAppTheme();
    const { hS, vS, mS } = useResponsive();

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
        },
        center: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        },
        scrollContent: {
            paddingTop: vS(16),
            paddingHorizontal: hS(16),
        },
        infoBox: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: mS(12),
            borderRadius: mS(8),
            marginBottom: vS(20),
            borderWidth: 1,
        },
        infoIconBox: {
            marginRight: hS(12),
            alignSelf: 'flex-start',
            marginTop: vS(2)
        },
        infoText: {
            flex: 1,
            fontSize: mS(12),
            color: '#1E3A8A',
            lineHeight: mS(18),
            fontWeight: '500',
        },
        sectionHeader: {
            marginTop: vS(4),
            marginBottom: vS(8),
            marginLeft: hS(4),
        },
        sectionTitle: {
            fontSize: mS(11),
            fontWeight: '600',
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        cardContainer: {
            borderRadius: mS(12),
            borderWidth: 1,
            marginBottom: vS(20),
        },
        toggleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: vS(12),
            paddingHorizontal: hS(12),
            borderBottomWidth: 0.5,
            minHeight: 48,
        },
        iconContainer: {
            width: mS(36),
            height: mS(36),
            borderRadius: mS(18),
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: hS(12),
        },
        textContainer: {
            flex: 1,
            marginRight: hS(10),
        },
        toggleTitle: {
            fontSize: mS(14),
            fontWeight: '600',
            color: '#0F172A',
            marginBottom: vS(2),
        },
        toggleDesc: {
            fontSize: mS(11.5),
            color: '#64748B',
            fontWeight: '400',
            lineHeight: mS(16),
        },
        controlContainer: {
            width: hS(50),
            alignItems: 'flex-end',
            justifyContent: 'center',
        },
    }), [hS, vS, mS]);


    useEffect(() => {
        const incomingPreferences = (userData as any)?.settings_preferences;

        if (incomingPreferences) {
            setSettings(incomingPreferences);
        }
    }, [userData, isLoading]);

    const handleNotificationPermission = async () => {
        const { status } = await checkNotifications();

        if (status === RESULTS.GRANTED) {
            return true;
        }

        if (status === RESULTS.DENIED) {
            const { status: newStatus } = await requestNotifications(['alert', 'sound', 'badge']);

            if (newStatus === RESULTS.GRANTED) {
                return true;
            }
            else if (newStatus === RESULTS.BLOCKED || newStatus === RESULTS.DENIED) {
                showSettingsAlert();
                return false;
            }
        }
        else if (status === RESULTS.BLOCKED) {
            showSettingsAlert();
            return false;
        }

        return false;
    };

    const showSettingsAlert = () => {
        Alert.alert(
            "Notifications are Off",
            "We need notification access to send you ride updates. Please enable them in Settings.",
            [
                { text: "Not Now", style: "cancel" },
                { text: "Open Settings", onPress: () => openSettings() }
            ]
        );
    };

    const handleToggle = async (key: PreferenceKey) => {
        const newValue = !settings[key];

        if (key === 'push_notifications' && newValue === true) {
            const hasPermission = await handleNotificationPermission();
            if (!hasPermission) {
                return;
            }
        }

        const updatedPreferences = {
            ...settings,
            [key]: newValue
        };

        setUpdatingKey(key);

        try {
            const payload = {
                id: localuser.id,
                settings_preferences: updatedPreferences
            };

            const response = await updateUser(payload).unwrap();

            if (response.success) {
                dispatch(updateUserStore({ settings_preferences: updatedPreferences }));
                setSettings(updatedPreferences);
            }
        } catch (error: any) {
            Alert.alert('Something Went Wrong!!!', 'Try Again Later');
        } finally {
            setUpdatingKey(null);
        }
    };

    const PreferenceToggle = ({ title, description, icon, prefKey, iconColor, iconBgColor, borderBottomColor }: { title: string, description: string, icon: string, prefKey: PreferenceKey, iconColor: string, iconBgColor: string, borderBottomColor?: string }) => (
        <View style={[styles.toggleRow, { borderBottomColor: borderBottomColor }]}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? appColors.iconBox : iconBgColor }]}>
                <MaterialCommunityIcons name={icon} size={mS(20)} color={isDark ? '#38BDF8' : iconColor} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.toggleTitle, { color: appColors.text }]} allowFontScaling={true}>{title}</Text>
                <Text style={[styles.toggleDesc, { color: appColors.secondaryText }]} allowFontScaling={true}>{description}</Text>
            </View>
            <View style={styles.controlContainer}>
                {updatingKey === prefKey ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                    <Switch
                        trackColor={{ false: appColors.border, true: '#2563EB' }}
                        thumbColor={'#FFF'}
                        ios_backgroundColor={appColors.border}
                        onValueChange={() => handleToggle(prefKey)}
                        value={settings[prefKey]}
                    />
                )}
            </View>
        </View>
    );

    useEffect(() => {
        const syncNotificationToggle = async () => {
            const { status } = await checkNotifications();

            if (status !== RESULTS.GRANTED && settings.push_notifications === true) {
                const updatedPreferences = {
                    ...settings,
                    push_notifications: false
                };

                setSettings(updatedPreferences);
                dispatch(updateUserStore({ settings_preferences: updatedPreferences }));
            }
        };

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                syncNotificationToggle();
            }
        });

        syncNotificationToggle();

        return () => {
            subscription.remove();
        };
    }, [settings.push_notifications]);

    if (loading) return (
        <View style={[styles.center, { backgroundColor: appColors.background }]}>
            <ActivityIndicator size="large" color={colors.button} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? appColors.background : '#FFFFFF' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? appColors.background : '#FFFFFF'} />
            <ResponsiveContainer>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + vS(40) }]}
                >
                    <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#F4F8FD', borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#EBF1FA' }]}>
                        <View style={styles.infoIconBox}>
                            <MaterialCommunityIcons name="information-outline" size={mS(20)} color={isDark ? '#38BDF8' : '#1E40AF'} />
                        </View>
                        <Text style={[styles.infoText, isDark && { color: '#38BDF8' }]} allowFontScaling={true}>Customize how you'd like to stay informed about your rides and exclusive offers.</Text>
                    </View>

                    {/* --- Section: Email Settings --- */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: appColors.secondaryText }]} allowFontScaling={true}>Email Settings</Text>
                    </View>

                    <View style={[styles.cardContainer, { backgroundColor: appColors.card, borderColor: isDark ? "transparent" : '#F1F5F9' }]}>
                        <PreferenceToggle
                            icon="file-document-outline"
                            title="Ride Invoices"
                            description="Direct copies of your bills after every trip."
                            prefKey="invoice_email"
                            iconColor="#1D4ED8"
                            iconBgColor="#EFF6FF"
                            borderBottomColor={isDark ? appColors.border : '#F1F5F9'}
                        />
                        <PreferenceToggle
                            icon="brightness-percent"
                            title="Promotions"
                            description="Updates on discounts and new features."
                            prefKey="promo_email"
                            iconColor="#1E3A8A"
                            iconBgColor="#EFF6FF"
                            borderBottomColor={isDark ? "transparent" : '#F1F5F9'}
                        />
                    </View>

                    {/* --- Section: Direct Messaging --- */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: appColors.secondaryText }]} allowFontScaling={true}>Direct Messaging</Text>
                    </View>

                    <View style={[styles.cardContainer, { backgroundColor: appColors.card, borderColor: isDark ? "transparent" : '#F1F5F9' }]}>
                        <PreferenceToggle
                            icon="whatsapp"
                            title="WhatsApp Updates"
                            description="Ride status and booking info on WhatsApp."
                            prefKey="whatsapp_updates"
                            iconColor="#15803D"
                            iconBgColor="#DCFCE7"
                            borderBottomColor={isDark ? appColors.border : '#F1F5F9'}
                        />
                        <PreferenceToggle
                            icon="message-text-outline"
                            title="SMS Alerts"
                            description="Crucial account updates via Text Message."
                            prefKey="sms_alerts"
                            iconColor="#1D4ED8"
                            iconBgColor="#EFF6FF"
                            borderBottomColor={isDark ? "transparent" : '#F1F5F9'}
                        />
                    </View>

                    {/* --- Section: Mobile App --- */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: appColors.secondaryText }]} allowFontScaling={true}>Mobile App</Text>
                    </View>

                    <View style={[styles.cardContainer, { backgroundColor: appColors.card, borderColor: isDark ? "transparent" : '#F1F5F9' }]}>
                        <PreferenceToggle
                            icon="bell-ring-outline"
                            title="Push Notifications"
                            description="Real-time alerts for ride arrival and safety."
                            prefKey="push_notifications"
                            iconColor="#6D28D9"
                            iconBgColor="#F3E8FF"
                            borderBottomColor={isDark ? "transparent" : '#F1F5F9'}
                        />
                    </View>

                    <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#F4F8FD', borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#EBF1FA', marginBottom: vS(20), marginTop: vS(8) }]}>
                        <View style={styles.infoIconBox}>
                            <MaterialCommunityIcons name="shield-check-outline" size={mS(20)} color={isDark ? '#38BDF8' : '#1D4ED8'} />
                        </View>
                        <Text style={[styles.infoText, isDark && { color: '#38BDF8' }]} allowFontScaling={true}>
                            Essential service updates regarding your account or active rides cannot be disabled.
                        </Text>
                    </View>
                </ScrollView>
            </ResponsiveContainer>
        </View>
    );
};

export default Preferences;