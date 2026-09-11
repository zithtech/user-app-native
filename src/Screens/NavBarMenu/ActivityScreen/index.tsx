
import { ActivityIndicator, Animated, FlatList, Platform, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, Image } from "react-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ResponsiveContainer } from "../../../Components/ResponsiveContainer";
import { Text } from "../../../Components";
import { Styles } from "../../../lib/styles";
import fonts from "../../../constant/fonts";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dropdown } from 'react-native-element-dropdown';
import DatePicker from "../../../Components/DatePicker";
import { BookedTripScreen_Nav, RideDetails_Nav, RideDetailsEdit_Nav } from "../../../Navigations/navigations";
import colors, { darkColors } from "../../../constant/colors";
import formatDate from "../../../Components/FormatDate";
import { useGetAllTripsQuery, useGetTripQuery } from "../../../service/userApi";
import { Trip } from "../../../types/trip";
import { useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import Skeleton from "../../../Components/Skeleton";
import { useAppTheme } from "../../../hooks/useAppTheme";

const ActivityCardSkeleton = ({ isDark, appColors }: any) => (
    <View style={{
        backgroundColor: isDark ? appColors.card : '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 12,
        marginHorizontal: 2,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    }}>
        {/* Left Icon */}
        <Skeleton width={38} height={38} borderRadius={10} />

        {/* Timeline Indicator */}
        <View style={{ marginHorizontal: 8, width: 6, height: 38, alignItems: 'center', justifyContent: 'space-between' }}>
            <Skeleton width={6} height={6} borderRadius={3} />
            <Skeleton width={2} height={20} borderRadius={1} />
            <Skeleton width={6} height={6} borderRadius={3} />
        </View>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {/* Middle Section */}
            <View style={{ flex: 1, paddingRight: 4, justifyContent: 'center' }}>
                <View style={{ marginBottom: 8 }}>
                    <Skeleton width="85%" height={14} borderRadius={4} />
                </View>
                <Skeleton width="60%" height={12} borderRadius={4} />
            </View>

            {/* Right Section */}
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <View style={{ marginBottom: 8 }}>
                    <Skeleton width={50} height={14} borderRadius={4} />
                </View>
                <Skeleton width={60} height={14} borderRadius={4} />
            </View>
        </View>

        <View style={{ marginLeft: 8 }}>
            <Skeleton width={12} height={20} borderRadius={4} />
        </View>
    </View>
);

const AnimatedListItem = ({ index, children }: { index: number, children: React.ReactNode }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        // Cap the delay so items further down the list don't wait forever to appear
        const staggerDelay = Math.min(index, 8) * 100;
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: staggerDelay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: staggerDelay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {children}
        </Animated.View>
    );
};

const ActivityScreenSkeleton = ({ appColors, isDark }: any) => (
    <View style={{ flex: 1, backgroundColor: isDark ? appColors.background : '#FFFFFF' }}>
        {/* Search & Filter Skeleton */}
        <View style={{
            paddingTop: 16,
            paddingBottom: 16,
            paddingHorizontal: 16,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: '40%' }}>
                    <Skeleton width="100%" height={44} borderRadius={12} />
                </View>
                <View style={{ flex: 1 }}>
                    <Skeleton width="100%" height={44} borderRadius={12} />
                </View>
            </View>
        </View>

        {/* Tab Switcher Skeleton */}
        <View style={{
            flexDirection: 'row',
            backgroundColor: isDark ? appColors.card : '#F8FAFC',
            marginHorizontal: 16,
            marginBottom: 20,
            marginTop: 4,
            borderRadius: 16,
            padding: 4,
            alignItems: 'center'
        }}>
            <View style={{ flex: 1 }}><Skeleton width="100%" height={38} borderRadius={12} /></View>
            <View style={{ width: 1, height: '40%', marginHorizontal: 2 }} />
            <View style={{ flex: 1 }}><Skeleton width="100%" height={38} borderRadius={12} /></View>
            <View style={{ width: 1, height: '40%', marginHorizontal: 2 }} />
            <View style={{ flex: 1 }}><Skeleton width="100%" height={38} borderRadius={12} /></View>
        </View>

        {/* Ride List Skeleton */}
        <View style={{ paddingHorizontal: 16 }}>
            {[1, 2, 3, 4, 5].map(i => <ActivityCardSkeleton key={i} isDark={isDark} appColors={appColors} />)}
        </View>
    </View>
);

const Activity: React.FC<ScreenProps> = ({ navigation }) => {
    // const { data: trips, isLoading, isFetching, refetch } = useGetAllTripsQuery();
    const localuser = useSelector((state: RootState) => state?.userSlice?.user);
    const dispatch = useDispatch()
    const { colors: appColors, isDark } = useAppTheme();
    const [searchBy, setSearchBy] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScreenLoading, setIsScreenLoading] = useState(true);
    const [filteredData, setFilteredData] = useState<Trip[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('completed');
    const [activeLimit, setActiveLimit] = useState<number | undefined>(5);
    const [selectedRideType, setSelectedRideType] = useState<string | null>(null);
    const rideTypeOptions = [
        { label: 'One Way', value: 'ONE_WAY' },
        { label: 'Round Trip', value: 'ROUND_TRIP' },
        { label: 'Outstation', value: 'OUTSTATION' },
        { label: 'Scheduled', value: 'SCHEDULED' },
    ];

    const searchOptions = [
        { label: 'Date', value: 'date' },
        { label: 'Location', value: 'location' },
        { label: 'Ride Type', value: 'rideType' },
    ];

    const [locations, setLocations] = useState<{ label: string; value: string }[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    const hasActiveFilters = Boolean(searchQuery.trim() !== '' || selectedLocation !== null || startDate !== null || endDate !== null || selectedRideType !== null);
    const limitToUse = hasActiveFilters ? undefined : activeLimit;

    const { data: trips, isLoading, isFetching, refetch } = useGetTripQuery({ id: localuser?.id, limit: limitToUse, tab: activeTab }, {
        skip: !localuser?.id, // Don't run if we don't have a user ID yet
    });

    const [rideHistory, setRideHistory] = useState<Trip[]>(trips?.data?.data ? trips.data.data : []);


    const onRefresh = useCallback(async () => {
        // No need to set a local "refreshing" state if you use isFetching from RTK Query
        await refetch();
    }, [refetch]);

    // ==================== ANIMATIONS ====================
    const screenFadeAnim = useRef(new Animated.Value(0)).current;
    const screenSlideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsScreenLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Trigger animations only after the skeleton has finished loading
    useEffect(() => {
        if (!isScreenLoading) {
            Animated.parallel([
                Animated.timing(screenFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(screenSlideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            ]).start();
        }
    }, [isScreenLoading, screenFadeAnim, screenSlideAnim]);

    // useFocusEffect(
    //     useCallback(() => {
    //         // This runs every time the screen is focused
    //         refetch();
    //     }, [refetch])
    // );

    useEffect(() => {
        // This will now run every time 'trips' changes (from undefined to data)
        if (trips?.success && trips?.data?.data) {
            setRideHistory(trips.data.data);
        }
    }, [trips, isFetching]);


    const fadeAnim = useRef(new Animated.Value(0)).current; // Initial opacity: 0

    useEffect(() => {
        if (rideHistory && rideHistory.length > 0) {
            const uniqueAreas = new Set<string>();
            rideHistory.forEach((trip: Trip) => {
                if (trip.drop_address) {
                    const parts = trip.drop_address.split(',').map(p => p.trim());
                    // Heuristic: In many address formats, the area is the 3rd or 4th component from the end.
                    // If address is "House, Street, Area, City, State, Country", parts.length = 6.
                    // Area (index 2) is parts[parts.length - 4].
                    // If it's shorter "Area, City", parts.length = 2. index 0 is parts[0].

                    let area = null;
                    if (parts.length >= 4) {
                        area = parts[parts.length - 4];
                    } else if (parts.length >= 2) {
                        area = parts[0];
                    } else if (parts.length === 1) {
                        area = parts[0];
                    }

                    if (area && area.length > 2 && !/^\d+$/.test(area)) { // Avoid house numbers/pincodes if possible
                        uniqueAreas.add(area);
                    }
                }
            });

            const dynamicLocations = Array.from(uniqueAreas).map(area => ({
                label: area,
                value: area
            }));
            setLocations(dynamicLocations);
        }
    }, [rideHistory]);

    useEffect(() => {
        if (isLoading || (isFetching && rideHistory.length === 0)) {
            // 1. Wait 500ms, then fade in over 300ms
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                delay: 500,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [isLoading, isFetching, rideHistory.length]);



    useEffect(() => {
        // 1. First, pick the base data based on tab
        let baseData = [...rideHistory];

        // The backend now filters by `activeTab` so we don't need to do it here.

        // 2. Apply Text Search if it exists
        if (searchQuery) {
            baseData = baseData.filter(item =>
                item.drop_address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 3. Apply Location Filter if it exists
        if (selectedLocation) {
            baseData = baseData.filter(item =>
                item.drop_address.toLowerCase().includes(selectedLocation.toLowerCase())
            );
        }

        // 4. Apply Date Range Filter if it exists
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            baseData = baseData.filter(ride => {
                const rideDate = new Date(ride.scheduled_start_time || ride.original_scheduled_start_time);
                return rideDate >= start && rideDate <= end;
            });
        }

        // 5. Apply Ride Type Filter if it exists
        if (selectedRideType) {
            baseData = baseData.filter(item => {
                if (selectedRideType === 'OUTSTATION') {
                    return item.ride_type === 'OUTSTATION_ONE_WAY' || item.ride_type === 'OUTSTATION_ROUND_TRIP';
                }
                return item.ride_type === selectedRideType;
            });
        }

        setFilteredData(baseData);
    }, [activeTab, searchQuery, selectedLocation, startDate, endDate, selectedRideType, rideHistory]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);

    };

    const handleLocationFilter = (loc: string) => {
        setSelectedLocation(loc);

    };


    const filterRidesByRange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
        setSelectedRideType(null);
    };


    const clearAllFilters = () => {
        setSearchBy(null);
        setSelectedLocation(null);
        setSearchQuery('');
        setStartDate(null);
        setEndDate(null);
        setSelectedRideType(null);
    };

    const formatDateToDMY = (dateStr: string | null) => {
        if (!dateStr) return '';
        return dateStr.split('-').reverse().join('-');
    };

    if (isScreenLoading) {
        return <ActivityScreenSkeleton appColors={appColors} isDark={isDark} />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#020813' : '#FFFFFF' }}>
            <ResponsiveContainer>
            <Animated.View style={{ flex: 1, opacity: screenFadeAnim, transform: [{ translateY: screenSlideAnim }] }}>
                {/* ───────────────────── SEARCH & FILTER SECTION ───────────────────── */}
                <View style={{
                    paddingTop: 16,
                    paddingBottom: 16,
                    paddingHorizontal: 16,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {/* Filter Type Dropdown */}
                        <Dropdown
                            style={{
                                width: '40%',
                                backgroundColor: isDark ? '#0A1931' : '#FFFFFF',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: isDark ? '#1E3A8A' : '#E2E8F0',
                                paddingHorizontal: 10,
                                height: 44,
                            }}
                            renderLeftIcon={() => (
                                <MaterialCommunityIcons name="calendar-month-outline" size={18} color={isDark ? appColors.text : '#1E293B'} style={{ marginRight: 8 }} />
                            )}
                            containerStyle={{ backgroundColor: appColors.card, borderColor: isDark ? 'transparent' : '#E2E8F0', borderRadius: 8 }}
                            itemTextStyle={{ color: appColors.text, fontSize: 13 }}
                            activeColor={isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'}
                            placeholderStyle={{ color: isDark ? appColors.text : '#1E293B', fontSize: 13, fontWeight: '500' }}
                            selectedTextStyle={{ color: isDark ? appColors.text : '#1E293B', fontSize: 13, fontWeight: '500' }}
                            data={searchOptions}
                            labelField="label"
                            valueField="value"
                            value={searchBy}
                            onChange={(item) => {
                                setSearchBy(item.value);
                                setSearchQuery('');
                                setSelectedLocation(null);
                                setSelectedRideType(null);
                                // Removing manual setFilteredData to let useEffect handle it
                            }}
                        />

                        {/* Dynamic Search Box */}
                        <View style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: isDark ? '#0A1931' : '#FFFFFF',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: isDark ? '#1E3A8A' : '#E2E8F0',
                            paddingHorizontal: 10,
                            height: 44,
                        }}>
                            <MaterialCommunityIcons
                                name={"magnify"}
                                size={20}
                                color={isDark ? appColors.lightTextColor : '#64748B'}
                            />

                            {searchBy === 'location' ? (
                                <Dropdown
                                    style={{ flex: 1, height: 48, marginLeft: 8 }}
                                    containerStyle={{ backgroundColor: appColors.card, borderColor: isDark ? 'transparent' : '#E2E8F0', borderRadius: 8 }}
                                    itemTextStyle={{ color: appColors.text, fontSize: 14 }}
                                    activeColor={isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'}
                                    placeholder="Select Location"
                                    placeholderStyle={{ color: appColors.lightTextColor, fontSize: 14 }}
                                    selectedTextStyle={{ color: appColors.text, fontSize: 14, fontWeight: '600' }}
                                    data={locations}
                                    labelField="label"
                                    valueField="value"
                                    value={selectedLocation}
                                    onChange={(item) => handleLocationFilter(item.value)}
                                />
                            ) : searchBy === 'rideType' ? (
                                <Dropdown
                                    style={{ flex: 1, height: 48, marginLeft: 8 }}
                                    containerStyle={{ backgroundColor: appColors.card, borderColor: isDark ? 'transparent' : '#E2E8F0', borderRadius: 8 }}
                                    itemTextStyle={{ color: appColors.text, fontSize: 14 }}
                                    activeColor={isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9'}
                                    placeholder="Select Ride Type"
                                    placeholderStyle={{ color: appColors.lightTextColor, fontSize: 14 }}
                                    selectedTextStyle={{ color: appColors.text, fontSize: 14, fontWeight: '600' }}
                                    data={rideTypeOptions}
                                    labelField="label"
                                    valueField="value"
                                    value={selectedRideType}
                                    onChange={(item) => setSelectedRideType(item.value)}
                                />
                            ) : searchBy === 'date' ? (
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={{ flex: 1, marginLeft: 8, height: 48, justifyContent: 'center' }}
                                >
                                    <TextInput allowFontScaling={true} maxFontSizeMultiplier={1.2} placeholder="Tap calendar icon..."
                                        placeholderTextColor={appColors.lightTextColor}
                                        style={{ fontSize: 14, color: appColors.text, paddingVertical: 0 }}
                                        value={startDate && endDate ? `${formatDateToDMY(startDate)} to ${formatDateToDMY(endDate)}` : ''}
                                        editable={false}
                                        pointerEvents="none"
                                    />
                                </TouchableOpacity>
                            ) : (
                                <TextInput allowFontScaling={true} maxFontSizeMultiplier={1.2} placeholder="Search destination..."
                                    placeholderTextColor={appColors.lightTextColor}
                                    style={{ flex: 1, marginLeft: 8, fontSize: 14, color: appColors.text }}
                                    value={searchQuery}
                                    onChangeText={handleSearch}
                                />
                            )}

                            {searchBy === 'date' && (
                                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                    <MaterialCommunityIcons name="calendar-search" size={20} color="#2563EB" />
                                </TouchableOpacity>
                            )}

                        </View>

                    </View>

                    {/* CLEAR ALL FILTERS BUTTON */}
                    {hasActiveFilters && (
                        <TouchableOpacity
                            onPress={clearAllFilters}
                            style={{
                                alignSelf: 'flex-end',
                                marginTop: 10,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE'
                            }}
                        >
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{
                                color: isDark ? '#60A5FA' : '#2563EB',
                                fontSize: 13,
                                fontWeight: '700',
                                textDecorationLine: 'underline'
                            }}>
                                Clear All Filters
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* DATE PICKER MODAL */}
                    {showDatePicker ? (
                        <DatePicker
                            mode="range"
                            visible={showDatePicker}
                            onRangeSelect={(start, end) => {
                                filterRidesByRange(start, end);
                            }}
                            onClose={() => setShowDatePicker(false)} />
                    ) : null}
                </View>

                {/* ───────────────────── MODERN TAB SWITCHER ───────────────────── */}
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: isDark ? '#0A1931' : '#F8FAFC',
                    marginHorizontal: 16,
                    marginBottom: 20,
                    marginTop: 4,
                    borderRadius: 16,
                    padding: 4,
                    alignItems: 'center'
                }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('completed')}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            paddingVertical: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 12,
                            backgroundColor: activeTab === 'completed' ? (isDark ? '#007BFF' : '#152D5E') : 'transparent',
                        }}
                    >
                        <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: activeTab === 'completed' ? '#FFFFFF' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: activeTab === 'completed' ? 0 : 1, borderColor: isDark ? '#64748B' : '#94A3B8' }}>
                            <MaterialCommunityIcons name="check" size={14} color={activeTab === 'completed' ? (isDark ? '#007BFF' : '#152D5E') : 'transparent'} />
                        </View>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'completed' ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#64748B') }}>
                            Completed
                        </Text>
                    </TouchableOpacity>

                    {/* Vertical Divider */}
                    <View style={{ width: 1, height: '40%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', marginHorizontal: 2, opacity: (activeTab === 'completed' || activeTab === 'cancelled') ? 0 : 1 }} />

                    <TouchableOpacity
                        onPress={() => setActiveTab('cancelled')}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            paddingVertical: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 12,
                            backgroundColor: activeTab === 'cancelled' ? (isDark ? '#007BFF' : '#152D5E') : 'transparent',
                        }}
                    >
                        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: activeTab === 'cancelled' ? '#FFFFFF' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: activeTab === 'cancelled' ? 0 : 1, borderColor: activeTab === 'cancelled' ? 'transparent' : (isDark ? '#64748B' : '#94A3B8') }}>
                            <MaterialCommunityIcons name="close" size={12} color={activeTab === 'cancelled' ? (isDark ? '#007BFF' : '#152D5E') : (isDark ? '#9CA3AF' : '#94A3B8')} />
                        </View>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'cancelled' ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#64748B') }}>
                            Cancelled
                        </Text>
                    </TouchableOpacity>

                    {/* Vertical Divider */}
                    <View style={{ width: 1, height: '40%', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', marginHorizontal: 2, opacity: (activeTab === 'cancelled' || activeTab === 'upcoming') ? 0 : 1 }} />

                    <TouchableOpacity
                        onPress={() => setActiveTab('upcoming')}
                        style={{
                            flex: 1,
                            flexDirection: 'row',
                            paddingVertical: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 12,
                            backgroundColor: activeTab === 'upcoming' ? (isDark ? '#007BFF' : '#152D5E') : 'transparent',
                        }}
                    >
                        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: activeTab === 'upcoming' ? '#FFFFFF' : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: activeTab === 'upcoming' ? 0 : 1, borderColor: activeTab === 'upcoming' ? 'transparent' : (isDark ? '#64748B' : '#94A3B8') }}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={activeTab === 'upcoming' ? (isDark ? '#007BFF' : '#152D5E') : (isDark ? '#9CA3AF' : '#94A3B8')} />
                        </View>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: 13, fontWeight: '700', color: activeTab === 'upcoming' ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#64748B') }}>
                            Upcoming
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ───────────────────── SEE ALL / SHOW LESS BUTTON ───────────────────── */}
                {/* ───────────────────── LIST HEADER & SEE ALL ───────────────────── */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 }}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : appColors.text }}>
                        {activeTab === 'completed' ? 'Completed Rides' : activeTab === 'cancelled' ? 'Cancelled Rides' : 'Upcoming Rides'}
                    </Text>
                    {!isLoading && !isFetching && !hasActiveFilters && trips?.data?.total && trips.data.total > 5 ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (activeLimit === 5) {
                                    setActiveLimit(undefined);
                                } else {
                                    setActiveLimit(5);
                                }
                            }}
                        >
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{
                                fontSize: 14,
                                fontWeight: '700',
                                color: isDark ? '#007BFF' : colors.button,
                            }}>
                                {activeLimit === 5 ? "See All ->" : "Show Less"}
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* ───────────────────── RIDE LIST ───────────────────── */}
                {(isLoading || (isFetching && rideHistory.length === 0)) ? (
                    <ScrollView style={{ paddingHorizontal: 16 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={isFetching}
                                onRefresh={onRefresh}
                                colors={[colors.button]}
                                tintColor={colors.button}
                            />
                        }
                    >
                        <View>
                            {[1, 2, 3, 4, 5].map(i => <ActivityCardSkeleton key={i} isDark={isDark} appColors={appColors} />)}
                        </View>
                    </ScrollView>
                ) : (
                    <FlatList
                        style={{ paddingHorizontal: 16 }}
                        data={filteredData}
                        keyExtractor={(item) => item.trip_id.toString()}
                        removeClippedSubviews={false}
                        initialNumToRender={10}
                        maxToRenderPerBatch={5}
                        refreshControl={
                            <RefreshControl
                                refreshing={isFetching}
                                onRefresh={onRefresh}
                                colors={[colors.button]}
                                tintColor={colors.button}
                            />
                        }
                        ListEmptyComponent={
                            <View style={{ marginTop: 60, alignItems: 'center', paddingHorizontal: 40 }}>
                                <MaterialCommunityIcons
                                    name={searchQuery || selectedLocation ? "database-search-outline" : "car-off"}
                                    size={70}
                                    color={appColors.lightTextColor}
                                />
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{
                                    color: appColors.text,
                                    fontSize: 16,
                                    fontWeight: '600',
                                    marginTop: 15,
                                    textAlign: 'center'
                                }}>
                                    {searchQuery || selectedLocation ? "No matches found" : "No rides yet"}
                                </Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: appColors.lightTextColor, textAlign: 'center', marginTop: 8 }}>
                                    {searchQuery || selectedLocation
                                        ? "Try adjusting your filters or search terms."
                                        : activeTab === 'upcoming'
                                            ? "You don't have any scheduled trips."
                                            : "Your completed trips will appear here."}
                                </Text>
                                {(searchQuery || selectedLocation) && (
                                    <TouchableOpacity
                                        onPress={clearAllFilters}
                                        style={{
                                            marginTop: 20,
                                            backgroundColor: appColors.iconBox,
                                            paddingHorizontal: 20,
                                            paddingVertical: 10,
                                            borderRadius: 10
                                        }}
                                    >
                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? appColors.text : colors.button, fontWeight: '700' }}>Reset Filters</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                        ListFooterComponent={
                            isFetching && activeLimit === undefined && rideHistory.length > 5 ? (
                                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                                    <ActivityIndicator size="small" color={colors.button} />
                                </View>
                            ) : null
                        }
                        renderItem={({ item, index }) => (
                            <AnimatedListItem index={index}>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        const status = item.trip_status.toUpperCase();
                                        if (activeTab === 'upcoming') {
                                            if (status === 'REQUESTED' || status === 'ACCEPTED') {
                                                navigation.navigate(RideDetailsEdit_Nav, { rideData: item });
                                            } else if (status === 'ARRIVING' || status === 'ARRIVED') {
                                                navigation.navigate(BookedTripScreen_Nav, item);
                                            } else {
                                                navigation.navigate(RideDetails_Nav, { rideData: item });
                                            }
                                        } else {
                                            navigation.navigate(RideDetails_Nav, { rideData: item });
                                        }
                                    }}
                                    style={{
                                        backgroundColor: isDark ? '#0A1931' : '#FFFFFF',
                                        borderRadius: 12,
                                        paddingVertical: 12,
                                        paddingHorizontal: 14,
                                        marginBottom: 12,
                                        marginHorizontal: 2,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        borderWidth: isDark ? 1 : 0,
                                        borderColor: isDark ? '#1E3A8A' : 'transparent',
                                        shadowColor: '#64748B',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 8,
                                        elevation: 2,
                                    }}
                                >
                                    {/* Left Image */}
                                    <View style={{
                                        width: 50, height: 40,
                                        alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Image
                                            // source={item.ride_type === 'OUTSTATION_ONE_WAY' || item.ride_type === 'OUTSTATION_ROUND_TRIP' ? require('../../../assets/png/T2Drive_CarSedan.png') : item.booking_type === 'SCHEDULED' ? require('../../../assets/png/car.png') : require('../../../assets/png/t2drive_yellow_taxi.png')}
                                            source={require('../../../assets/png/T2Drive_CarSedan.png')}
                                            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                                        />
                                    </View>

                                    {/* Timeline Indicator */}
                                    <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', shadowColor: '#10B981', shadowRadius: 4, shadowOpacity: isDark ? 0.8 : 0, shadowOffset: { width: 0, height: 0 } }} />
                                        <View style={{ width: 1, height: 24, borderStyle: 'dotted', borderWidth: 1, borderColor: isDark ? '#1E3A8A' : '#CBD5E1', marginVertical: 2, borderRadius: 1 }} />
                                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', shadowColor: '#F59E0B', shadowRadius: 4, shadowOpacity: isDark ? 0.8 : 0, shadowOffset: { width: 0, height: 0 } }} />
                                    </View>

                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                        {/* Middle Section (Destination + Subtitle) */}
                                        <View style={{ flex: 1, paddingRight: 4 }}>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: isDark ? appColors.text : '#0F172A' }}>
                                                {item.drop_address}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                <MaterialCommunityIcons name={item.booking_type === 'SCHEDULED' ? "calendar-month-outline" : "update"} size={12} color="#64748B" />
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: 10, color: item.booking_type === 'SCHEDULED' ? '#64748B' : '#3B82F6', marginLeft: 4, fontWeight: '700', letterSpacing: 0.2 }}>
                                                    {item.booking_type === 'SCHEDULED' ? 'SCHEDULED' : 'LIVE'}
                                                </Text>
                                                <MaterialCommunityIcons name="circle-small" size={14} color="#CBD5E1" style={{ marginHorizontal: 0 }} />
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: 9.5, color: '#64748B', fontWeight: '500' }}>
                                                    {item?.scheduled_start_time || item?.original_scheduled_start_time ? (
                                                        <>
                                                            {formatDate(new Date(item?.scheduled_start_time || item?.original_scheduled_start_time))}
                                                            <MaterialCommunityIcons name="circle-small" size={12} color="#CBD5E1" style={{ marginHorizontal: 0 }} />
                                                            {new Date(item?.scheduled_start_time || item?.original_scheduled_start_time).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </>
                                                    ) : 'N/A'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Right Section (Price + Status) */}
                                        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: 13, fontWeight: '800', color: isDark ? appColors.text : '#0F172A' }}>
                                                ₹{Number(item.total_fare).toFixed(2)}
                                            </Text>
                                            <View style={{
                                                marginTop: 4, paddingHorizontal: 6, paddingVertical: 2,
                                                borderRadius: 4,
                                                backgroundColor:
                                                    item.trip_status.toLowerCase() === 'completed' ? (isDark ? '#064E3B' : '#DCFCE7') :
                                                        (item.trip_status.toLowerCase() === 'requested' || item.trip_status.toLowerCase() === 'accepted') ? (isDark ? '#7C2D12' : '#FFEDD5') : (isDark ? '#7F1D1D' : '#FEE2E2')
                                            }}>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{
                                                    fontSize: 7.5, fontWeight: '800', letterSpacing: 0.2,
                                                    color:
                                                        item.trip_status.toLowerCase() === 'completed' ? (isDark ? '#10B981' : '#166534') :
                                                            (item.trip_status.toLowerCase() === 'requested' || item.trip_status.toLowerCase() === 'accepted') ? (isDark ? '#F97316' : '#9A3412') : (isDark ? '#EF4444' : '#991B1B')
                                                }}>
                                                    {item.trip_status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? appColors.text : "#0F172A"} style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            </AnimatedListItem>
                        )}
                    />
                )}
            </Animated.View>
            </ResponsiveContainer>
        </View>
    );
};


export default Activity;
