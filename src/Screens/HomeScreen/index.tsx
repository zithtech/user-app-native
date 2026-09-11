import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Dimensions,
    Platform,
    TouchableOpacity,
    Animated,
    Image,
} from "react-native";
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useTheme, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Config from 'react-native-config';
import { useAppTheme } from "../../hooks/useAppTheme";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
// Components & Constants
import { Styles } from "../../lib/styles";
import { ResponsiveContainer } from "../../Components/ResponsiveContainer";
import colors from "../../constant/colors";
import { hS, vS, mS, SCREEN_HEIGHT } from '../../lib/responsive';
import { GoogleNameIcon, IIcon } from '../../assets/svg';
import Button from "../../Components/Button";
import MapViewComponent from '../MapTrackingScreen/MapViewComponent';
import { LocationSearch_Nav } from "../../Navigations/navigations";

// Tab Components
import { OneWayComponent } from './HomeScreenComponents/OneWayComponent';
import { RoundedTrip } from "./HomeScreenComponents/RoundedTripComponent";
import { OutstationComponent } from './HomeScreenComponents/OutStationcomponent';
import { DailyComponent } from './HomeScreenComponents/DailyComponent';
import { useLocation } from "../../hooks/useLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GlobalRideCard from "../TripScreen/TripComponents/GlobalRideCard";
import { ActiveTripBadge } from "../TripScreen/TripComponents/LiveRideBadge/ActiveTripBadge";
import { ScheduledTripBadge } from "../TripScreen/TripComponents/ScheduledRideBadge/ScheduledTripBadge";
import { BookedTripScreen_Nav } from "../../Navigations/navigations";
import { useLazyGetByTripIdQuery } from "../../service/tripApi";
import Skeleton from "../../Components/Skeleton";
import LowBalanceBanner from '../../Components/Wallet/LowBalanceBanner';

let initialLoadChecked = false;

const HomeScreenSkeleton = ({ insets, appColors, isDark }: any) => {
    return (
        <View style={{ flex: 1, backgroundColor: appColors.background, paddingTop: insets.top, paddingHorizontal: insets.left }}>
            {/* Header Skeleton */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: hS(20), paddingTop: vS(10), paddingBottom: vS(10) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: hS(10) }}>
                    <Skeleton width={mS(45)} height={mS(45)} borderRadius={mS(22.5)} />
                    <View style={{ gap: vS(4) }}>
                        <Skeleton width={120} height={16} borderRadius={4} />
                        <Skeleton width={80} height={14} borderRadius={4} />
                    </View>
                </View>
                {/* Right side active badge placeholder */}
                <Skeleton width={mS(40)} height={mS(40)} borderRadius={mS(12)} />
            </View>

            {/* Map Skeleton */}
            <View style={{ height: SCREEN_HEIGHT * 0.35, width: '100%' }}>
                <Skeleton width="100%" height="100%" borderRadius={0} />
            </View>

            {/* Location Card Skeleton */}
            <View style={{
                marginHorizontal: hS(20),
                marginTop: vS(-45),
                paddingHorizontal: hS(16),
                paddingVertical: vS(16),
                borderRadius: mS(12),
                backgroundColor: isDark ? appColors.card : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Skeleton width={mS(18)} height={mS(18)} borderRadius={mS(9)} />
                    <View style={{ flex: 1, marginLeft: hS(12), gap: vS(6) }}>
                        <Skeleton width="40%" height={10} borderRadius={2} />
                        <Skeleton width="80%" height={14} borderRadius={4} />
                    </View>
                    <Skeleton width={mS(32)} height={mS(32)} borderRadius={mS(16)} />
                </View>

                {/* Divider space */}
                <View style={{ height: vS(24), marginLeft: hS(8), width: 2, alignItems: 'center', justifyContent: 'center' }}>
                    <Skeleton width={1} height="100%" borderRadius={0} />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Skeleton width={mS(18)} height={mS(18)} borderRadius={mS(9)} />
                    <View style={{ flex: 1, marginLeft: hS(12) }}>
                        <Skeleton width="60%" height={14} borderRadius={4} />
                    </View>
                    <Skeleton width={mS(24)} height={mS(24)} borderRadius={mS(12)} />
                </View>
            </View>

            {/* Compact Buttons Skeleton */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: hS(20), marginTop: vS(20) }}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={{ width: '23%', height: vS(70), borderRadius: mS(12), backgroundColor: isDark ? appColors.card : '#FFFFFF', padding: mS(8), alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }}>
                        <Skeleton width={mS(24)} height={mS(24)} borderRadius={mS(12)} />
                        <View style={{ marginTop: vS(8) }}>
                            <Skeleton width={mS(40)} height={mS(8)} borderRadius={mS(4)} />
                        </View>
                    </View>
                ))}
            </View>

            {/* Popular Routes Title Skeleton */}
            <View style={{ paddingHorizontal: hS(20), marginTop: vS(24), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width={140} height={20} borderRadius={4} />
                <Skeleton width={60} height={14} borderRadius={4} />
            </View>

            {/* Popular Routes Cards Skeleton */}
            <View style={{ flexDirection: 'row', paddingHorizontal: hS(20), marginTop: vS(16), gap: hS(12) }}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={{ width: hS(72), height: vS(90), borderRadius: mS(16), backgroundColor: isDark ? appColors.card : '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
                        <Skeleton width={mS(32)} height={mS(32)} borderRadius={mS(12)} />
                        <View style={{ marginTop: vS(8) }}>
                            <Skeleton width={mS(40)} height={mS(10)} borderRadius={mS(2)} />
                        </View>
                    </View>
                ))}
            </View>

        </View>
    );
};


const bookingSteps = [
    {
        icon: 'car-select',
        title: 'Choose Service',
        desc: 'Select from One-Way, Round-Trip, Outstation, or Schedule rides.',
        color: '#3B82F6', // Blue
        bgColor: '#EFF6FF'
    },
    {
        icon: 'map-marker-path',
        title: 'Enter Locations',
        desc: 'Provide your precise pickup and drop-off points.',
        color: '#10B981', // Green
        bgColor: '#ECFDF5'
    },
    {
        icon: 'account-tie',
        title: 'Select Driver',
        desc: 'Review available drivers, check ratings, and compare fares.',
        color: '#F59E0B', // Amber
        bgColor: '#FFFBEB'
    },
    {
        icon: 'check-decagram',
        title: 'Confirm & Go',
        desc: 'Confirm your booking and track your driver to your doorstep.',
        color: '#8B5CF6', // Purple
        bgColor: '#F5F3FF'
    }
];

const HomeScreen: React.FC<any> = ({ navigation }) => {
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { fonts } = useTheme();
    const { colors: appColors, isDark } = useAppTheme();

    const [isHomepage, setIsHomepage] = useState(true);
    const [screenName, setscreenName] = useState('OneWay');
    const [active, setActive] = useState<number>(0);
    const [isScreenLoading, setIsScreenLoading] = useState(true);
    const [currentAddress, setCurrentAddress] = useState<string>("Fetching location...");

    const [triggerGetTrip] = useLazyGetByTripIdQuery();
    const { getCurrentLocation, getAddressFromCoords } = useLocation();

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const pos = await getCurrentLocation();
                const addressData = await getAddressFromCoords(pos.coords.latitude, pos.coords.longitude);
                if (addressData?.formatted) {
                    setCurrentAddress(addressData.formatted);
                } else if (addressData?.area) {
                    setCurrentAddress(addressData.area);
                } else {
                    setCurrentAddress("Location not found");
                }
            } catch (err) {
                setCurrentAddress("Location permission denied");
            }
        };
        fetchLocation();
    }, []);

    const localUser = useSelector((state: RootState) => state?.userSlice?.user);
    // console.log("localUser", localUser);

    const imageSource = localUser?.profile_url;
    const BASE_URL = `${Config.DEV_BACKEND_URL}/api`;
    const proxiedImageSource = imageSource ? (imageSource.startsWith('http') ? `${BASE_URL}/media/proxy?url=${encodeURIComponent(imageSource)}` : imageSource) : null;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const buttons = [
        { name: 'OneWay', iconName: 'man' },
        { name: 'RoundedTrip', iconName: 'retweet' },
        { name: 'Outstation', iconName: 'enviromento' },
        { name: 'Schedule', iconName: 'profile' },
    ];


    // ==================== ANIMATIONS ====================
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const slideAnim = React.useRef(new Animated.Value(20)).current;

    // Staggered animated values
    const buttonsAnim = React.useRef(buttons.map(() => new Animated.Value(0))).current;
    const stepsAnim = React.useRef(bookingSteps.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Reset values for clean entry
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        buttonsAnim.forEach(anim => anim.setValue(0));
        stepsAnim.forEach(anim => anim.setValue(0));

        // Simulate initial skeleton load for heavy map/components
        const timer = setTimeout(() => {
            setIsScreenLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    // Trigger animations only after the skeleton has finished loading
    useEffect(() => {
        if (!isScreenLoading) {
            // Main entrance
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
            ]).start();

            // Staggered buttons
            const buttonAnims = buttonsAnim.map((anim, i) =>
                Animated.spring(anim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    delay: 300 + (i * 100),
                    useNativeDriver: true,
                })
            );

            // Staggered steps
            const stepAnims = stepsAnim.map((anim, i) =>
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 600,
                    delay: 600 + (i * 150),
                    useNativeDriver: true,
                })
            );

            Animated.parallel([...buttonAnims, ...stepAnims]).start();
        }
    }, [isScreenLoading, fadeAnim, slideAnim, buttonsAnim, stepsAnim]);


    // Inside your Home.tsx or App.tsx
    // useEffect(() => {
    //     const resumeSession = async () => {
    //         const savedId = await getActiveTripId();
    //         if (savedId) {
    //             try {
    //                 const result = await triggerGetTrip(savedId).unwrap();
    //                 // If the trip is still active, jump straight to TripScreen
    //                 if (result.success && (result.data.trip_status === 'LIVE' || result.data.trip_status === 'REQUESTED')) {
    //                     // navigation.replace('TripScreen', { trip_id: savedId });
    //                 } else {
    //                     await clearActiveTrip(); // Clean up if trip ended
    //                 }
    //             } catch (err) {
    //                 console.error("Session Resume Error:", err);
    //             }
    //         }
    //     };
    //     resumeSession();
    // }, []);

    const handleTabChange = (index: number, btn: any) => {
        setIsHomepage(index === 0);
        setActive(index);
        setscreenName(btn.name);
    };

    const renderContent = () => {
        switch (active) {
            case 0: return <OneWayComponent onSelectLocation={() => { }} />;
            case 1: return <RoundedTrip />;
            case 2: return <OutstationComponent />;
            case 3: return <DailyComponent />;
            default: return <OneWayComponent onSelectLocation={() => { }} />;
        }
    };

    if (isScreenLoading) {
        return <HomeScreenSkeleton insets={insets} appColors={appColors} isDark={isDark} />;
    }

    return (
        <View style={{ flex: 1 }}>

            <View style={{ flex: 1, backgroundColor: appColors.background, paddingTop: insets.top, paddingHorizontal: insets.left }}>

                {/* --- HEADER SECTION --- */}
                <View style={[style.headerContainer, { paddingHorizontal: hS(20), paddingTop: vS(10), paddingBottom: vS(10), zIndex: 9999 }]}>
                    <View style={style.headerLeft}>
                        <TouchableOpacity
                            style={[style.profileImageContainer, { backgroundColor: isDark ? appColors.card : '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            {imageSource ? (
                                <Image
                                    source={{ uri: proxiedImageSource || '' }}
                                    style={style.profileImage}
                                />
                            ) : (
                                <FontAwesome name="user" size={mS(24)} color={isDark ? appColors.lightTextColor : '#CBD5E1'} />
                            )}
                            <View style={[style.onlineDot, { borderColor: appColors.background }]} />
                        </TouchableOpacity>
                        <View style={style.headerTextContainer}>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.greetingText, { color: appColors.text }]}>
                                {getGreeting()}, <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.userNameText, { color: appColors.secondaryText }]}>{localUser?.full_name?.split(' ')[0] || localUser?.name?.split(' ')[0] || 'User'}</Text>
                            </Text>
                            <View style={style.ratingContainer}>
                                <AntDesign name="star" size={mS(12)} color="#F59E0B" />
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.ratingText, { color: appColors.text }]}>{localUser?.rating || '4.0'} <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.ridesText, { color: appColors.secondaryText }]}>({localUser?.total_rides || '0'})</Text></Text>
                                {/* <View style={[style.eliteBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#E0E7FF' }]}>
                                    <MaterialCommunityIcons name="diamond-stone" size={mS(10)} color={isDark ? '#93C5FD' : '#3730A3'} />
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.eliteText, { color: isDark ? '#93C5FD' : '#3730A3' }]}>ELITE</Text>
                                </View> */}
                            </View>
                        </View>
                    </View>

                    <View style={style.headerRight}>
                        <View style={style.badgesContainer}>
                            <ActiveTripBadge />
                            <ScheduledTripBadge />
                        </View>
                    </View>
                </View>

                <ScrollView
                    bounces={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + vS(20), backgroundColor: isDark ? '#020813' : '#F8FAFC' }}
                >
                    <LowBalanceBanner />

                    {/* --- SECTION 1: MAP SECTION --- */}
                    <Animated.View style={{ height: SCREEN_HEIGHT * 0.35, width: '100%', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        <MapViewComponent />
                    </Animated.View>

                    <ResponsiveContainer>
                    {/* Location Selection Card */}
                    <Animated.View style={[style.locationCard, { backgroundColor: isDark ? '#0A1931' : appColors.card, borderColor: isDark ? '#1E3A8A' : '#F1F5F9', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <View style={style.locationRow}>
                            <MaterialCommunityIcons name="record-circle-outline" size={mS(18)} color="#10B981" />
                            <View style={style.locationTextContainer}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.locationLabel, { color: appColors.secondaryText }]}>Pickup location</Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.locationValue, { color: appColors.text }]} numberOfLines={1}>{currentAddress}</Text>
                            </View>
                            <TouchableOpacity style={[style.targetIconBtn, { backgroundColor: appColors.background, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]}>
                                <MaterialCommunityIcons name="crosshairs-gps" size={mS(16)} color={appColors.icon} />
                            </TouchableOpacity>
                        </View>

                        <View style={style.locationDividerContainer}>
                            <View style={[style.dashedLine, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }]} />
                            <View style={[style.solidLine, { backgroundColor: appColors.border }]} />
                        </View>

                        <View style={style.locationRow}>
                            <MaterialCommunityIcons name="record-circle-outline" size={mS(18)} color="#F59E0B" />
                            <TouchableOpacity style={style.locationTextContainer} onPress={() => navigation.navigate(LocationSearch_Nav, { screenName })}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.whereToText, { color: appColors.secondaryText }]}>Where to?</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={style.plusIconBtn} onPress={() => navigation.navigate(LocationSearch_Nav, { screenName })}>
                                <MaterialCommunityIcons name="plus" size={mS(18)} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Mode Selection Buttons */}
                    <View style={style.compactButtonContainer}>
                        {buttons.map((btn, index) => {
                            const btnColors = ['#00C2FF', '#3B82F6', '#8B5CF6', '#F59E0B'];
                            const btnColor = btnColors[index % btnColors.length];

                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        style.compactButtonWrapper,
                                        {
                                            opacity: buttonsAnim[index],
                                            transform: [
                                                { translateY: buttonsAnim[index].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                                                { scale: buttonsAnim[index] }
                                            ]
                                        }
                                    ]}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => handleTabChange(index, btn)}
                                        style={[
                                            style.compactBtnStyle,
                                            {
                                                backgroundColor: active === index ? (isDark ? 'rgba(0,194,255,0.1)' : appColors.card) : (isDark ? '#0A1931' : appColors.card),
                                                borderColor: active === index ? (isDark ? '#00C2FF' : btnColor) : (isDark ? 'transparent' : '#F8FAFC'),
                                                borderWidth: active === index ? 1 : (isDark ? 0 : 1),
                                                elevation: active === index ? (isDark ? 0 : 2) : 1,
                                                shadowColor: active === index ? (isDark ? 'transparent' : btnColor) : '#000',
                                                shadowOffset: { width: 0, height: 2 },
                                                shadowOpacity: active === index ? (isDark ? 0 : 0.2) : 0.05,
                                                shadowRadius: active === index ? (isDark ? 0 : 4) : 4,
                                            }
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={btn.name === 'OneWay' ? 'car' : btn.name === 'RoundedTrip' ? 'autorenew' : btn.name === 'Outstation' ? 'map-marker-outline' : 'calendar-month-outline'}
                                            size={mS(24)}
                                            color={btnColor}
                                            style={
                                                active === index && isDark
                                                    ? {
                                                        textShadowColor: '#00C2FF',
                                                        textShadowOffset: { width: 0, height: 0 },
                                                        textShadowRadius: 8,
                                                    }
                                                    : {}
                                            }
                                        />
                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} numberOfLines={1}
                                            style={[
                                                style.compactBtnTxtstyle,
                                                {
                                                    color: active === index ? (isDark ? '#00C2FF' : appColors.text) : (isDark ? '#94A3B8' : appColors.secondaryText),
                                                    fontWeight: active === index ? '700' : '500'
                                                }
                                            ]}
                                        >
                                            {btn.name === 'RoundedTrip' ? 'Round Trip' : btn.name === 'OneWay' ? 'One Way' : btn.name}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            )
                        })}
                    </View>

                    {/* Dynamic Tab Content Area */}
                    <View style={style.tabContentArea}>
                        {renderContent()}
                    </View>

                    {/* Horizontal How to Book */}
                    <View style={[style.horizontalHowToBook, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#F0F9FF', borderColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#BAE6FD' }]}>
                        <View style={style.horizontalHowToBookHeader}>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.horizontalHowToBookTitle, { color: appColors.text }]}>How to Book a Driver</Text>
                            <View style={style.horizontalHowToBookRight}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.horizontalHowToBookSeeWorks, { color: isDark ? '#38BDF8' : '#0284C7' }]}>See how it works</Text>
                                <MaterialCommunityIcons name="play-circle-outline" size={mS(16)} color={isDark ? '#38BDF8' : '#0284C7'} />
                            </View>
                        </View>
                        <View style={style.horizontalStepsRow}>
                            {bookingSteps.map((step, index) => (
                                <React.Fragment key={index}>
                                    <View style={style.horizontalStepContainer}>
                                        <View style={[style.horizontalStepIcon, { backgroundColor: isDark ? `${step.color}20` : step.bgColor }]}>
                                            <MaterialCommunityIcons name={step.title === 'Choose Service' ? 'car' : step.title === 'Enter Locations' ? 'map-marker-path' : step.title === 'Select Driver' ? 'account-tie' : 'check-decagram'} size={mS(20)} color={step.color} />
                                        </View>
                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.horizontalStepTitle, { color: appColors.text }]} numberOfLines={1}>{step.title}</Text>
                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[style.horizontalStepDesc, { color: appColors.secondaryText }]} numberOfLines={2}>{step.title === 'Choose Service' ? 'Select your ride' : step.title === 'Enter Locations' ? 'Add pickup & drop' : step.title === 'Select Driver' ? 'Pick your driver' : 'Track & enjoy ride'}</Text>
                                    </View>
                                    {index < bookingSteps.length - 1 && (
                                        <View style={[style.horizontalStepDashedLine, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }]} />
                                    )}
                                </React.Fragment>
                            ))}
                        </View>
                    </View>

                    </ResponsiveContainer>
                </ScrollView>
            </View>
        </View>
    );
};

const style = StyleSheet.create({
    locationCard: {
        marginHorizontal: hS(20),
        marginTop: vS(-45),
        paddingHorizontal: hS(16),
        paddingVertical: vS(16),
        borderRadius: mS(12),
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationTextContainer: {
        flex: 1,
        marginLeft: hS(12),
        marginRight: hS(12),
    },
    locationLabel: {
        fontSize: mS(10),
        fontWeight: '500',
        marginBottom: vS(2),
    },
    locationValue: {
        fontSize: mS(13),
        fontWeight: '700',
    },
    whereToText: {
        fontSize: mS(14),
        fontWeight: '500',
    },
    targetIconBtn: {
        width: mS(32),
        height: mS(32),
        borderRadius: mS(16),
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusIconBtn: {
        width: mS(24),
        height: mS(24),
        borderRadius: mS(12),
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationDividerContainer: {
        height: vS(24),
        marginLeft: hS(8),
        width: 2,
        flexDirection: 'row',
    },
    dashedLine: {
        height: '100%',
        width: 1,
        borderLeftWidth: 1,
        borderStyle: 'dashed',
    },
    solidLine: {
        height: 1,
        // width: '100%',
        position: 'absolute',
        top: '50%',
        left: hS(26),
        width: hS(260), // Approximated width for line from dot to end of location input
    },

    compactButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: hS(20),
        marginTop: vS(20),
    },
    compactButtonWrapper: {
        width: '23%',
    },
    compactBtnStyle: {
        width: '100%',
        height: vS(70),
        borderRadius: mS(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactBtnTxtstyle: {
        fontSize: mS(10),
        marginTop: vS(8),
    },
    tabContentArea: {
        marginTop: vS(20),
    },

    horizontalHowToBook: {
        marginHorizontal: hS(20),
        marginTop: vS(20),
        paddingHorizontal: hS(16),
        paddingVertical: vS(16),
        borderRadius: mS(16),
        borderWidth: 1,
    },
    horizontalHowToBookHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vS(16),
    },
    horizontalHowToBookTitle: {
        fontSize: mS(14),
        fontWeight: '800',
    },
    horizontalHowToBookRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(4),
    },
    horizontalHowToBookSeeWorks: {
        fontSize: mS(11),
        fontWeight: '600',
    },
    horizontalStepsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    horizontalStepContainer: {
        alignItems: 'center',
        width: '24%',
    },
    horizontalStepIcon: {
        width: mS(36),
        height: mS(36),
        borderRadius: mS(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(8),
    },
    horizontalStepTitle: {
        fontSize: mS(9),
        fontWeight: '700',
        textAlign: 'center',
    },
    horizontalStepDesc: {
        fontSize: mS(8),
        textAlign: 'center',
        marginTop: vS(2),
        lineHeight: mS(10),
    },
    horizontalStepDashedLine: {
        position: 'absolute',
        top: mS(18),
        right: -'14%',
        width: '28%',
        borderTopWidth: 1,
        borderStyle: 'dashed',
    },
    badgesRowContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? vS(60) : vS(50),
        left: hS(20),
        right: hS(20),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end', // Aligns to the right
        gap: hS(12),
        pointerEvents: 'box-none',
        zIndex: 9999,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImageContainer: {
        width: mS(45),
        height: mS(45),
        borderRadius: mS(22.5),
        marginRight: hS(10),
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: mS(22.5),
        resizeMode: 'cover',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: mS(10),
        height: mS(10),
        borderRadius: mS(5),
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    headerTextContainer: {
        justifyContent: 'center',
    },
    greetingText: {
        fontSize: mS(14),
        fontWeight: 'bold',
        marginBottom: vS(2),
    },
    userNameText: {
        fontWeight: '400',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(4),
    },
    ratingText: {
        fontSize: mS(12),
        fontWeight: 'bold',
    },
    ridesText: {
        fontWeight: '400',
        fontSize: mS(11),
    },
    eliteBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(6),
        paddingVertical: vS(2),
        borderRadius: mS(10),
        marginLeft: hS(6),
        gap: hS(2),
    },
    eliteText: {
        fontSize: mS(9),
        fontWeight: 'bold',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(10),
    },
    badgesContainer: {
        flexDirection: 'row',
        gap: hS(8),
    },
    settingsButton: {
        width: mS(36),
        height: mS(36),
        borderRadius: mS(18),
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HomeScreen;