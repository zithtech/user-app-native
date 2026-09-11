import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootState } from '../../../../redux/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookedTripScreen_Nav, TabNavigation_Nav } from '../../../../Navigations/navigations';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { ResponsiveContainer } from '../../../../Components/ResponsiveContainer';
import { useGetActiveTripbyUserIdQuery, useGetTripQuery } from '../../../../service/userApi';

const ScheduledTripsList = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const { colors: appColors, isDark } = useAppTheme();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const localuser = useSelector((state: RootState) => state.userSlice.user);
    const { refetch, isFetching } = useGetActiveTripbyUserIdQuery(localuser?.id, {
        skip: !localuser?.id,
    });

    const { data: tripsData, isFetching: isPastFetching, refetch: refetchPast } = useGetTripQuery(
        { id: localuser?.id, limit: 50 },
        { skip: !localuser?.id }
    );

    const pastTrips = React.useMemo(() => {
        return (tripsData?.data?.data || []).filter((trip: any) =>
            trip.booking_type === 'SCHEDULED' &&
            ['COMPLETED', 'CANCELLED', 'MID_CANCELLED'].includes(trip.trip_status)
        ).slice(0, 5);
    }, [tripsData]);

    const handleRefresh = () => {
        refetch();
        refetchPast();
    };

    const scheduledTrips = useSelector((state: RootState) => state.tripSlice.scheduledTrips);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'REQUESTED':
                return { label: 'Searching Driver', bgColor: isDark ? 'rgba(148, 163, 184, 0.1)' : '#F3F4F6', dotColor: '#9CA3AF', textColor: isDark ? '#94A3B8' : '#6B7280' };
            case 'ACCEPTED':
                return { label: 'Driver Accepted', bgColor: isDark ? 'rgba(14, 165, 233, 0.1)' : '#E0F2FE', dotColor: '#0EA5E9', textColor: '#0EA5E9' };
            case 'ARRIVING':
                return { label: 'Driver Arriving', bgColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7', dotColor: '#F59E0B', textColor: isDark ? '#F59E0B' : '#D97706' };
            case 'LIVE':
                return { label: 'Live', bgColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#DCFCE7', dotColor: '#10B981', textColor: isDark ? '#10B981' : '#16A34A' };
            case 'CANCELLED':
            case 'MID_CANCELLED':
                return { label: 'Cancelled', bgColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2', dotColor: '#EF4444', textColor: isDark ? '#F87171' : '#B91C1C' };
            case 'COMPLETED':
                return { label: 'Completed', bgColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', dotColor: '#10B981', textColor: isDark ? '#34D399' : '#059669' };
            case 'CONFIRMED':
                return { label: 'Confirmed', bgColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7', dotColor: '#16A34A', textColor: '#16A34A' };
            default:
                return { label: status, bgColor: isDark ? 'rgba(148, 163, 184, 0.1)' : '#F3F4F6', dotColor: '#9CA3AF', textColor: isDark ? '#94A3B8' : '#6B7280' };
        }
    };

    const formatRideType = (type: string) => {
        if (!type) return 'Ride';
        const parts = type.split('_');
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    };

    const renderTripItem = ({ item }: { item: any }) => {
        const statusInfo = getStatusInfo(item.trip_status);
        const isSearching = item.trip_status === 'REQUESTED';
        const dateObj = item.scheduled_start_time ? new Date(item.scheduled_start_time) : new Date();
        const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const date = dateObj.getDate();
        const day = dateObj.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();
        const timeStr = dateObj.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        // Build Title
        let rideTypeTitle = formatRideType(item.ride_type);
        if (item.service_type === 'OUTSTATION' && !rideTypeTitle.toLowerCase().includes('outstation')) {
            rideTypeTitle += ' • Outstation';
        } else if (item.ride_type === 'OUTSTATION_ONE_WAY') {
            rideTypeTitle = 'One Way • Outstation';
        } else if (item.ride_type === 'OUTSTATION_ROUND_TRIP') {
            rideTypeTitle = 'Round Trip • Outstation';
        }

        const isConfirmed = item.trip_status === 'ACCEPTED' || item.trip_status === 'CONFIRMED' || item.trip_status === 'REQUESTED';

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9', borderWidth: 1 }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(BookedTripScreen_Nav, item)}
            >
                <View style={styles.cardTopRow}>
                    {/* Date Block */}
                    <View style={[styles.dateBlock, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC' }]}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.dateMonth, { color: '#3B82F6' }]}>{month}</Text>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.dateDay, { color: appColors.text }]}>{date}</Text>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.dateWeekday, { color: appColors.secondaryText }]}>{day}</Text>
                    </View>

                    {/* Trip Info Block */}
                    <View style={styles.tripInfoBlock}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.rideTypeTitle, { color: '#2563EB', flex: 1 }]} numberOfLines={1}>
                                {rideTypeTitle}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.statusBadgeText, { color: statusInfo.textColor }]}>
                                    {statusInfo.label}
                                </Text>
                            </View>
                            <TouchableOpacity style={{ paddingLeft: 8 }}>
                                <MaterialCommunityIcons name="dots-vertical" size={20} color={isDark ? appColors.text : "#475569"} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color="#64748B" />
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.timeText, { color: isDark ? appColors.text : '#0F172A' }]}>{timeStr}</Text>
                        </View>

                        {/* Timeline Addresses */}
                        <View style={styles.timelineContainer}>
                            <View style={styles.timelineDots}>
                                <View style={styles.pickupDot} />
                                <View style={styles.dottedLine} />
                                <MaterialCommunityIcons name="map-marker" size={12} color="#EF4444" style={{ marginLeft: -2 }} />
                            </View>
                            <View style={styles.addressSection}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.addressText, { color: isDark ? appColors.text : '#0F172A' }]} numberOfLines={2}>
                                    {item.pickup_address || 'Current Location'}
                                </Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.addressText, { color: isDark ? appColors.text : '#0F172A', marginTop: 12 }]} numberOfLines={2}>
                                    {item.drop_address}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Divider */}
                <View style={[styles.cardDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]} />

                {/* Bottom Row */}
                <View style={styles.bottomRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialCommunityIcons name="account-outline" size={18} color="#1E3A8A" />
                        {isSearching ? (
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.driverText, { color: appColors.secondaryText }]} numberOfLines={1}>
                                Driver: <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#2563EB', fontWeight: '600' }}>Searching...</Text>
                            </Text>
                        ) : (
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.driverText, { color: appColors.secondaryText }]} numberOfLines={1}>
                                Driver: <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: appColors.text, fontWeight: '600' }}>{item.driver_details?.full_name || 'Assigned'}</Text>
                            </Text>
                        )}
                    </View>
                    <View style={[styles.serviceBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.serviceBadgeText, { color: appColors.secondaryText }]}>
                            {item.trip_status || 'SCHEDULED'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-blank" size={60} color={isDark ? 'rgba(255, 255, 255, 0.1)' : "#E2E8F0"} />
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptyTitle, { color: appColors.text }]}>No scheduled rides</Text>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptySub, { color: appColors.secondaryText }]}>
                {activeTab === 'upcoming' ? "Your upcoming bookings will appear here." : "Your past bookings will appear here."}
            </Text>
        </View>
    );

    const renderFooter = () => {
        if (activeTab === 'past') {
            if (pastTrips.length === 0) return null;
            return (
                <TouchableOpacity 
                    style={[styles.bookBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2563EB', marginTop: 16 }]}
                    onPress={() => navigation.navigate(TabNavigation_Nav, { screen: 'Activity' })}
                >
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.bookBtnText, { color: '#2563EB' }]}>View All Past Trips</Text>
                </TouchableOpacity>
            );
        }

        if (activeTab !== 'upcoming' || scheduledTrips.length === 0) return null;
        return (
            <TouchableOpacity style={[styles.footerAlert, { backgroundColor: isDark ? appColors.card : '#F8FAFC' }]}>
                <MaterialCommunityIcons name="calendar-clock" size={36} color="#2563EB" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.alertTitle, { color: appColors.text }]}>Need to make changes?</Text>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.alertSub, { color: appColors.secondaryText }]}>
                        You can reschedule or cancel up to 2 hours before pickup.
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? appColors.secondaryText : "#475569"} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: appColors.background, paddingTop: insets.top }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={appColors.background} />
            <ResponsiveContainer>

            {/* Header */}
            <View style={[styles.header, { backgroundColor: appColors.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={appColors.text} />
                </TouchableOpacity>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.headerTitle, { color: appColors.text }]}>Scheduled Trips</Text>
                {isFetching || isPastFetching ? (
                    <View style={styles.iconBtn}>
                        <ActivityIndicator size="small" color={appColors.text} />
                    </View>
                ) : (
                    <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn}>
                        <MaterialCommunityIcons name="refresh" size={24} color={appColors.text} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.tabText, { color: activeTab === 'upcoming' ? '#2563EB' : appColors.secondaryText }]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                    onPress={() => setActiveTab('past')}
                >
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.tabText, { color: activeTab === 'past' ? '#2563EB' : appColors.secondaryText }]}>Past</Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={activeTab === 'upcoming' ? scheduledTrips : pastTrips}
                keyExtractor={(item) => item.trip_id.toString()}
                renderItem={renderTripItem}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    activeTab === 'upcoming' && scheduledTrips.length > 0 ? (
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.sectionTitle}>UPCOMING TRIPS</Text>
                    ) : null
                }
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                showsVerticalScrollIndicator={false}
            />

            {/* Book New Trip Button */}
            <View style={[styles.bottomBtnContainer, { paddingBottom: insets.bottom || 20 }]}>
                <TouchableOpacity
                    style={styles.bookBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.bookBtnText}>Book New Trip</Text>
                </TouchableOpacity>
            </View>
            </ResponsiveContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        marginHorizontal: 16,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#2563EB',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // padding for bottom fixed button
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    dateBlock: {
        width: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 8,
        alignItems: 'center',
        marginRight: 12,
    },
    dateMonth: { fontSize: 10, fontWeight: '800' },
    dateDay: { fontSize: 20, fontWeight: '700', marginVertical: -2 },
    dateWeekday: { fontSize: 10, fontWeight: '600' },
    tripInfoBlock: {
        flex: 1,
    },
    rideTypeTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    timeText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    timelineContainer: {
        flexDirection: 'row',
        marginTop: 16,
    },
    timelineDots: {
        alignItems: 'center',
        width: 16,
        marginRight: 8,
        paddingTop: 4,
    },
    pickupDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    dottedLine: {
        width: 1,
        height: 24,
        borderStyle: 'dotted',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginVertical: 2,
        borderRadius: 1,
    },
    addressSection: {
        flex: 1,
    },
    addressText: {
        fontSize: 13,
        fontWeight: '500',
    },
    cardDivider: {
        height: 1,
        width: '100%',
        marginVertical: 14,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    driverText: {
        fontSize: 13,
        marginLeft: 6,
    },
    serviceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    serviceBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    footerAlert: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 24,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    alertSub: {
        fontSize: 12,
        lineHeight: 18,
    },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 15 },
    emptySub: { fontSize: 14, marginTop: 5 },
    bottomBtnContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: 'transparent',
    },
    bookBtn: {
        flexDirection: 'row',
        backgroundColor: '#1D4ED8',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ScheduledTripsList;