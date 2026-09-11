import React, { useState, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Modal,
    Pressable,
    useColorScheme,
    Alert,
    ToastAndroid,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Styles } from '../../../../lib/styles';
import fonts from '../../../../constant/fonts';
import colors from '../../../../constant/colors';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store';
import { AboutVdriveScreen_Nav, FavouritelocationScreens_Nav, HelpContactScreen_Nav, NotificationScreen_Nav, PreferencesScreen_Nav, ProfilescreenComponents_Nav, ProfileUpdateScreen_Nav, SafetyScreen_Nav, OffersScreen_Nav, WalletScreen_Nav } from '../../../../Navigations/navigations';
import { useSignOut } from '../../../../service/auth/signout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeleteUserMutation } from '../../../../service/userApi';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { useDispatch } from 'react-redux';
import { setThemeMode, ThemeMode } from '../../../../redux/themeSlice';
import { useResponsive } from '../../../../hooks/useResponsive';
import { ResponsiveContainer } from '../../../../Components/ResponsiveContainer';

interface RapidoItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    color?: string;
    iconColor?: string;
    iconBgColor?: string;
    isCritical?: boolean;
}

const Settings = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const { colors, isDark, mode } = useAppTheme();
    const [deleteuser] = useDeleteUserMutation();
    const localuser = useSelector((state: RootState) => state?.userSlice?.user);
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [themeVisible, setThemeVisible] = useState(false);
    const { signOut } = useSignOut();

    const { hS, vS, mS } = useResponsive();

    const styles = useMemo(() => StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            paddingTop: vS(12),
            paddingBottom: vS(30),
        },
        sectionHeader: {
            marginTop: vS(12),
            marginHorizontal: hS(20),
            marginBottom: vS(4),
        },
        sectionTitle: {
            fontSize: mS(13),
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
        },
        actionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: vS(10),
            minHeight: 48,
        },
        rowIconBox: {
            width: mS(36),
            height: mS(36),
            borderRadius: mS(10),
            justifyContent: 'center',
            alignItems: 'center',
        },
        rowContent: {
            flex: 1,
            marginLeft: hS(14),
        },
        rowTitle: {
            fontSize: mS(14),
            fontWeight: '700',
        },
        rowSubtitle: {
            fontSize: mS(11),
            marginTop: vS(1),
            fontWeight: '500',
        },
        versionText: {
            textAlign: 'center',
            color: '#94A3B8',
            fontSize: mS(12),
            marginTop: vS(10),
            fontWeight: '500',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
        },
        sheetContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: mS(30),
            borderTopRightRadius: mS(30),
            padding: mS(24),
            paddingBottom: vS(40),
            alignItems: 'center',
        },
        dragHandle: {
            width: hS(36),
            height: vS(4),
            borderRadius: mS(2),
            marginBottom: vS(24),
        },
        logoutIconBox: {
            width: mS(70),
            height: mS(70),
            borderRadius: mS(35),
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: vS(16),
        },
        sheetTitle: {
            fontSize: mS(22),
            fontWeight: '800',
            marginBottom: vS(8),
        },
        sheetSubtitle: {
            fontSize: mS(15),
            textAlign: 'center',
            lineHeight: mS(22),
            marginBottom: vS(32),
            paddingHorizontal: hS(10),
        },
        sheetActionContainer: {
            flexDirection: 'row',
            width: '100%',
            gap: mS(12),
        },
        sheetButton: {
            flex: 1,
            height: vS(54),
            minHeight: 48,
            borderRadius: mS(16),
            justifyContent: 'center',
            alignItems: 'center',
        },
        cancelButton: {
            // Styled dynamically in component
        },
        confirmLogoutButton: {
            backgroundColor: '#EF4444',
        },
        cancelButtonText: {
            fontWeight: '700',
            fontSize: mS(15),
        },
        logoutButtonText: {
            color: '#FFF',
            fontWeight: '700',
            fontSize: mS(15),
        },
        themeOptionsList: {
            width: '100%',
            marginTop: vS(10),
        },
        themeOptionItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: vS(16),
            paddingHorizontal: hS(16),
            borderRadius: mS(16),
            marginBottom: vS(8),
            minHeight: 48,
        },
        themeOptionLabel: {
            flex: 1,
            fontSize: mS(16),
            fontWeight: '600',
            marginLeft: hS(16),
        },
        criticalCard: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: vS(12),
            paddingHorizontal: hS(16),
            borderRadius: mS(16),
            minHeight: 48,
        },
        criticalCardIconBox: {
            width: mS(36),
            height: mS(36),
            justifyContent: 'center',
            alignItems: 'center',
        },
        criticalCardTitle: {
            fontSize: mS(14),
            fontWeight: '700',
            color: '#EF4444',
        },
        criticalCardSubtitle: {
            fontSize: mS(11),
            marginTop: vS(1),
            fontWeight: '500',
            color: '#F87171',
        },
    }), [hS, vS, mS]);

    const handleNavigation = (screenName: string) => {
        navigation.navigate(screenName);
    };

    const handleDelete = () => {
        handleNavigation('DeleteAccountInfoScreen');
    };

    const ActionRow = ({ icon, title, subtitle, onPress, showArrow = true, isCritical = false, iconColor, iconBgColor, isCircularIcon = false, hideBorder = false }: RapidoItemProps & { isCircularIcon?: boolean, hideBorder?: boolean }) => (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            <View style={[styles.actionRow, { borderBottomWidth: 0, paddingHorizontal: hS(20) }]}>
                <View style={[
                    styles.rowIconBox,
                    isCircularIcon && { borderRadius: mS(24) },
                    { backgroundColor: iconBgColor || 'transparent' },
                    isCritical && { backgroundColor: isDark ? 'transparent' : 'transparent' }
                ]}>
                    <MaterialCommunityIcons
                        name={icon}
                        size={mS(20)}
                        color={isCritical ? '#EF4444' : (iconColor || (isDark ? colors.text : '#1E293B'))}
                    />
                </View>
                <View style={styles.rowContent}>
                    <Text style={[styles.rowTitle, { color: isCritical ? '#EF4444' : colors.text }]} allowFontScaling={true}>{title}</Text>
                    {subtitle && <Text style={[styles.rowSubtitle, { color: isCritical ? '#F87171' : colors.lightTextColor }]} allowFontScaling={true}>{subtitle}</Text>}
                </View>
                {showArrow && (
                    <MaterialCommunityIcons name="chevron-right" size={mS(20)} color={isCritical ? '#EF4444' : colors.lightTextColor} />
                )}
            </View>
            {!hideBorder && <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0', marginLeft: hS(20) + mS(36) + hS(14) }} />}
        </TouchableOpacity>
    );

    const ThemeSelectionModal = () => {
        const themeOptions: { label: string; value: ThemeMode; icon: string }[] = [
            { label: 'Light Mode', value: 'light', icon: 'white-balance-sunny' },
            { label: 'Dark Mode', value: 'dark', icon: 'moon-waning-crescent' },
            { label: 'System Default', value: 'system', icon: 'theme-light-dark' },
        ];

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={themeVisible}
                onRequestClose={() => setThemeVisible(false)}
                statusBarTranslucent
                navigationBarTranslucent
            >
                <Pressable style={styles.modalOverlay} onPress={() => setThemeVisible(false)} />
                <View style={[styles.sheetContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                    <Text style={[styles.sheetTitle, { color: colors.text }]}>Choose Theme</Text>
                    <View style={styles.themeOptionsList}>
                        {themeOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.themeOptionItem,
                                    mode === option.value && { backgroundColor: colors.iconBox }
                                ]}
                                onPress={() => {
                                    dispatch(setThemeMode(option.value));
                                    setThemeVisible(false);
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={option.icon}
                                    size={mS(24)}
                                    color={mode === option.value ? colors.primary : colors.lightTextColor}
                                />
                                <Text style={[
                                    styles.themeOptionLabel,
                                    { color: colors.text },
                                    mode === option.value && { color: colors.primary, fontWeight: '700' }
                                ]} allowFontScaling={true}>
                                    {option.label}
                                </Text>
                                {mode === option.value && (
                                    <MaterialCommunityIcons name="check-circle" size={mS(20)} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <ResponsiveContainer>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + vS(20) }]}
                >
                    <View style={{ marginTop: vS(10) }}>
                        <ActionRow
                            icon="account-outline"
                            iconColor="#3B82F6"
                            iconBgColor={isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF'}
                            isCircularIcon={true}
                            title="Profile"
                            subtitle={localuser?.phone_number}
                            onPress={() => navigation.navigate(ProfilescreenComponents_Nav, { screen: ProfileUpdateScreen_Nav, params: { localuser } })}
                        />
                    </View>

                    {/* --- ACCOUNT SECTION --- */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: '#64748B' }]} allowFontScaling={true}>ACCOUNT</Text>
                    </View>
                    <View>
                        <ActionRow
                            icon="wallet-outline"
                            iconColor="#10B981"
                            title="My Wallet"
                            subtitle="Manage balance & transactions"
                            onPress={() => handleNavigation(WalletScreen_Nav)}
                        />
                        <ActionRow
                            icon="ticket-percent-outline"
                            iconColor="#F59E0B"
                            title="Offers"
                            subtitle="View coupons & discounts"
                            onPress={() => handleNavigation(OffersScreen_Nav)}
                            hideBorder={true}
                        />
                    </View>

                    {/* --- PREFERENCES SECTION --- */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: '#64748B' }]} allowFontScaling={true}>PREFERENCES</Text>
                    </View>
                    <View>
                        <ActionRow
                            icon="heart-outline"
                            iconColor="#EF4444"
                            title="Favourites"
                            subtitle="Manage favourite locations"
                            onPress={() => handleNavigation(FavouritelocationScreens_Nav)}
                        />
                        <ActionRow
                            icon="tune"
                            iconColor="#8B5CF6"
                            title="Preferences"
                            subtitle='Manage your preferences'
                            onPress={() => handleNavigation(PreferencesScreen_Nav)}
                        />
                        <ActionRow
                            icon="bell-ring-outline"
                            iconColor="#F59E0B"
                            title="Notifications"
                            subtitle="Manage notification settings"
                            onPress={() => handleNavigation(NotificationScreen_Nav)}
                            showArrow={true}
                            hideBorder={true}
                        />
                    </View>

                    {/* --- OTHERS SECTION --- */}
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: '#64748B' }]} allowFontScaling={true}>OTHERS</Text>
                    </View>
                    <View>
                        <ActionRow
                            icon="palette-outline"
                            iconColor="#3B82F6"
                            title="Theme"
                            subtitle={mode === 'system' ? 'System Default' : mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                            onPress={() => setThemeVisible(true)}
                        />
                        <ActionRow
                            icon="shield-check-outline"
                            iconColor="#10B981"
                            title="Safety"
                            subtitle="Emergency contacts & Insurance"
                            onPress={() => handleNavigation(SafetyScreen_Nav)}
                        />
                        <ActionRow
                            icon="help-circle-outline"
                            iconColor="#8B5CF6"
                            title="Support"
                            subtitle="Help centre & Contact us"
                            onPress={() => handleNavigation(HelpContactScreen_Nav)}
                        />
                        <ActionRow
                            icon="information-outline"
                            iconColor="#64748B"
                            title="About T2Drive"
                            subtitle="App info & version"
                            onPress={() => handleNavigation(AboutVdriveScreen_Nav)}
                            hideBorder={true}
                        />
                    </View>

                    {/* --- ACCOUNT ACTIONS --- */}
                    <View style={{ marginTop: vS(12), marginBottom: vS(20), paddingHorizontal: hS(16), gap: vS(12) }}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setLogoutVisible(true)}
                            style={[styles.criticalCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}
                        >
                            <View style={styles.criticalCardIconBox}>
                                <MaterialCommunityIcons name="logout" size={mS(20)} color="#EF4444" />
                            </View>
                            <View style={styles.rowContent}>
                                <Text style={styles.criticalCardTitle} allowFontScaling={true}>Logout</Text>
                                <Text style={styles.criticalCardSubtitle} allowFontScaling={true}>Sign out from your account</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={mS(20)} color="#EF4444" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleDelete()}
                            style={[styles.criticalCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}
                        >
                            <View style={styles.criticalCardIconBox}>
                                <MaterialCommunityIcons name="trash-can-outline" size={mS(20)} color="#EF4444" />
                            </View>
                            <View style={styles.rowContent}>
                                <Text style={styles.criticalCardTitle} allowFontScaling={true}>Delete Account</Text>
                                <Text style={styles.criticalCardSubtitle} allowFontScaling={true}>Permanently remove account</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={mS(20)} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.versionText} allowFontScaling={true}>Version 1.0.42 (Beta)</Text>
                </ScrollView>
            </ResponsiveContainer>

            <Modal
                animationType="slide"
                transparent={true}
                visible={logoutVisible}
                onRequestClose={() => setLogoutVisible(false)}
                statusBarTranslucent
                navigationBarTranslucent
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setLogoutVisible(false)}
                />

                <View style={[styles.sheetContainer, { backgroundColor: colors.card }]}>
                    <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

                    <View style={styles.logoutIconBox}>
                        <MaterialCommunityIcons name="logout" size={mS(32)} color="#EF4444" />
                    </View>

                    <Text style={[styles.sheetTitle, { color: colors.text }]} allowFontScaling={true}>Logout</Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.lightTextColor }]} allowFontScaling={true}>Are you sure you want to logout? You will need to sign in again to use the app.</Text>

                    <View style={styles.sheetActionContainer}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.sheetButton, styles.cancelButton, { backgroundColor: colors.iconBox }]}
                            onPress={() => setLogoutVisible(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color: isDark ? colors.icon : '#475569' }]} allowFontScaling={true}>Stay Signed In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={[styles.sheetButton, styles.confirmLogoutButton]}
                            onPress={() => {
                                setLogoutVisible(false);
                                signOut(localuser.id);
                            }}
                        >
                            <Text style={styles.logoutButtonText} allowFontScaling={true}>Yes, Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ThemeSelectionModal />
        </View>
    );
};

export default Settings;