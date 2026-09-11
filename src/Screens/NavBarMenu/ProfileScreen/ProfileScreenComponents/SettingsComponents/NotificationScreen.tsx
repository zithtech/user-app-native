import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Platform,
    LayoutAnimation,
    UIManager,
    ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../../../../constant/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hS, mS, vS } from '../../../../../lib/responsive';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import {
    markAsRead,
    clearAll,
    removeNotification,
    Notification
} from '../../../../../redux/notificationSlice';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import { BookedTripScreen_Nav } from '../../../../../Navigations/navigations';
import { ResponsiveContainer } from "../../../../../Components/ResponsiveContainer";
import { useAppTheme } from "../../../../../hooks/useAppTheme";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NotificationScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();
    const notifications = useSelector((state: RootState) => state.notifications.notifications);
    const { colors: appColors, isDark } = useAppTheme();
    const [activeTab, setActiveTab] = useState('All');

    const tabs = [
        { id: 'All', icon: null },
        { id: 'Rides', icon: 'car-outline' },
        { id: 'Account', icon: 'account-outline' },
        { id: 'Offers', icon: 'tag-outline' },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;
    const totalCount = notifications.length;

    const getIcon = (type: string, isDarkTheme: boolean) => {
        switch (type) {
            case 'otp':
            case 'security':
            case 'shield': return { name: 'shield-check', color: '#1877F2', bg: isDarkTheme ? 'rgba(24, 119, 242, 0.15)' : '#EBF5FF' };
            case 'RIDE_STARTED':
            case 'TRIP_UPDATE':
            case 'BOOKING_CONFIRMED':
            case 'ride':
            case 'car': return { name: 'car', color: '#34C759', bg: isDarkTheme ? 'rgba(52, 199, 89, 0.15)' : '#E8F5E9' };
            case 'PAYMENT_SUCCESS':
            case 'wallet': return { name: 'wallet', color: '#FF9500', bg: isDarkTheme ? 'rgba(255, 149, 0, 0.15)' : '#FFF5E6' };
            case 'PROMO_CODE':
            case 'promo':
            case 'offer': return { name: 'tag', color: '#FF2D55', bg: isDarkTheme ? 'rgba(255, 45, 85, 0.15)' : '#FFE5EC' };
            case 'DRIVER_ASSIGNED':
            case 'star': return { name: 'star', color: '#AF52DE', bg: isDarkTheme ? 'rgba(175, 82, 222, 0.15)' : '#F2E6FF' };
            case 'Safety Alert':
            case 'alert':
            case 'bell': return { name: 'bell', color: '#1877F2', bg: isDarkTheme ? 'rgba(24, 119, 242, 0.15)' : '#EBF5FF' };
            default: return { name: 'bell', color: '#1877F2', bg: isDarkTheme ? 'rgba(24, 119, 242, 0.15)' : '#EBF5FF' };
        }
    };

    const handleNotificationPress = (item: Notification) => {
        dispatch(markAsRead(item.id));

        // Route based on notification data if available
        if (item.data?.tripId) {
            navigation.navigate(BookedTripScreen_Nav, { trip_id: item.data.tripId });
        }
    };

    const handleClearAll = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        dispatch(clearAll());
    };

    const handleRemove = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        dispatch(removeNotification(id));
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Rides') return ['RIDE_STARTED', 'TRIP_UPDATE', 'BOOKING_CONFIRMED', 'DRIVER_ASSIGNED', 'ride', 'car'].includes(n.type);
        if (activeTab === 'Offers') return ['PROMO_CODE', 'promo', 'offer'].includes(n.type);
        if (activeTab === 'Account') return ['PAYMENT_SUCCESS', 'wallet', 'otp', 'security', 'shield', 'Safety Alert', 'alert', 'bell'].includes(n.type);
        return true;
    });

    const renderItem = ({ item }: { item: Notification }) => {
        const iconDetails = getIcon(item.type, isDark);
        // Clean up moment output for brevity like "1 hour ago", "3 hours ago"
        const timeAgo = moment(item.time).fromNow();

        return (
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    { backgroundColor: appColors.card },
                    !item.read && [styles.unreadCard, { backgroundColor: appColors.card, borderLeftColor: '#0B309B' }]
                ]}
                activeOpacity={0.8}
                onPress={() => handleNotificationPress(item)}
                onLongPress={() => handleRemove(item.id)}
            >
                <View style={[styles.iconBox, { backgroundColor: iconDetails.bg }]}>
                    <MaterialCommunityIcons name={iconDetails.name} size={mS(24)} color={iconDetails.color} />
                </View>

                <View style={styles.content}>
                    <View style={styles.row}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.title, !item.read && styles.unreadText, { color: appColors.text }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <View style={styles.timeRow}>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.time, { color: '#94A3B8' }]}>{timeAgo}</Text>
                            {!item.read && <View style={styles.unreadDot} />}
                        </View>
                    </View>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.message, { color: '#64748B' }]} numberOfLines={2}>{item.message}</Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={mS(20)} color="#CBD5E1" style={styles.chevron} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: appColors.background }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
            <ResponsiveContainer>

            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + vS(10), backgroundColor: appColors.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn,
                { backgroundColor: isDark ? '#111827' : '#EFF6FF', borderColor: isDark ? '#111827' : '#DBEAFE' }]}>
                    <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={isDark ? '#F7FAFC' : '#1E293B'} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.headerTitle, { color: appColors.text }]}>Notifications</Text>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.headerSubtitle, { color: '#64748B' }]}>{unreadCount} unread • {totalCount} total</Text>
                </View>
                {notifications.length > 0 ? (
                    <TouchableOpacity onPress={handleClearAll} style={[styles.clearBtn,
                    {
                        backgroundColor: isDark ? '#111827' : '#EFF6FF',
                        borderColor: isDark ? '#111827' : '#DBEAFE'
                    }]}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.markReadText}>Clear All</Text>
                    </TouchableOpacity>
                ) : <View style={{ width: hS(70) }} />}
            </View>

            {/* FILTER TAPS */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.tabBtn,
                                    isActive ? styles.activeTabBtn : styles.inactiveTabBtn,
                                    {
                                        backgroundColor: isActive ? '#0B309B' : isDark ? '#111827' : '#FFFFFF',
                                        borderColor: isDark ? '#111827' : '#DBEAFE'
                                    }
                                ]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                {tab.icon && (
                                    <MaterialCommunityIcons
                                        name={tab.icon}
                                        size={mS(16)}
                                        color={isActive ? '#FFFFFF' : '#64748B'}
                                        style={styles.tabIcon}
                                    />
                                )}
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[
                                    styles.tabText,
                                    { color: isActive ? '#FFFFFF' : '#64748B' },
                                    isActive && { fontWeight: '700' }
                                ]}>
                                    {tab.id}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* NOTIFICATIONS LIST */}
            <FlatList
                data={filteredNotifications}
                renderItem={renderItem}
                keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : index.toString()}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                contentContainerStyle={[styles.listPadding, { paddingBottom: insets.bottom + vS(20) }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconContainer, { backgroundColor: appColors.iconBox }]}>
                            <MaterialCommunityIcons name="bell-off-outline" size={mS(70)} color={appColors.secondaryText} />
                        </View>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptyTitle, { color: appColors.text }]}>All caught up!</Text>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptySub, { color: appColors.secondaryText }]}>We'll notify you when something important arrives.</Text>
                    </View>
                }
            />
            </ResponsiveContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: hS(20),
        paddingBottom: vS(15),
    },
    backBtn: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(20),
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: mS(18),
        fontWeight: '800',
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: mS(12),
        color: '#64748B',
        fontWeight: '500',
        marginTop: vS(2),
    },
    clearBtn: {
        paddingHorizontal: hS(12),
        paddingVertical: vS(6),
        backgroundColor: '#EFF6FF',
        borderRadius: mS(16),
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    markReadText: {
        fontSize: mS(12),
        fontWeight: '700',
        color: '#1877F2',
    },
    tabsContainer: {
        marginBottom: vS(10),
    },
    tabsScrollContent: {
        paddingHorizontal: hS(20),
        gap: hS(10),
        paddingVertical: vS(5),
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(16),
        paddingVertical: vS(8),
        borderRadius: mS(20),
        borderWidth: 1,
    },
    activeTabBtn: {
        borderColor: '#0B309B',
    },
    inactiveTabBtn: {
        borderColor: '#E2E8F0',
    },
    tabIcon: {
        marginRight: hS(6),
    },
    tabText: {
        fontSize: mS(13),
        fontWeight: '500',
    },
    listPadding: {
        paddingHorizontal: hS(20),
        paddingVertical: vS(10),
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: mS(16),
        marginBottom: vS(12),
        borderRadius: mS(20),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#0B309B',
    },
    iconBox: {
        width: mS(48),
        height: mS(48),
        borderRadius: mS(24),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(12),
    },
    content: {
        flex: 1,
        marginRight: hS(8),
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vS(4),
    },
    title: {
        fontSize: mS(15),
        fontWeight: '700',
        color: '#1E293B',
        flex: 1,
    },
    unreadText: {
        fontWeight: '800',
    },
    message: {
        fontSize: mS(13),
        color: '#64748B',
        lineHeight: vS(18),
        fontWeight: '400',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    time: {
        fontSize: mS(11),
        color: '#94A3B8',
        fontWeight: '500',
    },
    unreadDot: {
        width: mS(6),
        height: mS(6),
        borderRadius: mS(3),
        backgroundColor: '#1877F2',
        marginLeft: hS(6),
    },
    chevron: {
        marginLeft: hS(5),
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: vS(120),
        paddingHorizontal: hS(40),
    },
    emptyIconContainer: {
        width: hS(140),
        height: hS(140),
        borderRadius: hS(70),
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(24),
    },
    emptyTitle: {
        fontSize: mS(22),
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: vS(8),
    },
    emptySub: {
        fontSize: mS(15),
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: vS(22),
    }
});

export default NotificationScreen;