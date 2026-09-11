import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing, Platform, ScrollView, StatusBar, Image, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../../constant/colors';
import { hS, mS, vS } from '../../../../lib/responsive';
import { TabNavigation_Nav } from '../../../../Navigations/navigations';
import { TripStatus } from '../../../../enums/trip.enum';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { ResponsiveContainer } from '../../../../Components/ResponsiveContainer';

const { width } = Dimensions.get('window');

// const BannerWaves = () => (
//     <>
//         <Svg
//             width="100%"
//             height={mS(55)}
//             style={{
//                 position: 'absolute',
//                 bottom: -1,
//                 left: 0,
//                 zIndex: 8,
//             }}
//             viewBox="0 0 375 55"
//             preserveAspectRatio="none"
//         >
//             <Path
//                 d="M 0 10 C 80 35, 145 50, 225 42 C 290 36, 330 18, 375 15 L 375 55 L 0 55 Z"
//                 fill="#DCEEFF"
//             />
//         </Svg>
//         <Svg
//             width="100%"
//             height={mS(48)}
//             style={{
//                 position: 'absolute',
//                 bottom: -1,
//                 left: 0,
//                 zIndex: 9,
//             }}
//             viewBox="0 0 375 48"
//             preserveAspectRatio="none"
//         >
//             <Path
//                 d="M 0 0 C 70 30, 135 48, 215 42 C 280 38, 330 20, 375 17 L 375 48 L 0 48 Z"
//                 fill="#FFFFFF"
//             />
//         </Svg>
//     </>
// );

const BannerWaves = ({ isDark, appColors }: any) => {
    return (
        <>
            {/* Light blue outer wave */}
            <Svg
                width="100%"
                height={mS(65)}
                viewBox="0 0 375 65"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    zIndex: 8,
                }}
            >
                <Path
                    d="
            M 0 0
            C 55 25, 120 55, 195 52
            C 270 50, 320 20, 375 12
            L 375 65
            L 0 65
            Z
          "
                    fill={isDark ? 'rgba(59, 130, 246, 0.15)' : "#DCEEFF"}
                />
            </Svg>

            {/* White inner wave */}
            <Svg
                width="100%"
                height={mS(52)}
                viewBox="0 0 375 52"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    zIndex: 9,
                }}
            >
                <Path
                    d="
            M 0 0
            C 60 28, 125 48, 200 46
            C 270 44, 325 16, 375 10
            L 375 52
            L 0 52
            Z
          "
                    fill={isDark ? appColors.background : "#FFFFFF"}
                />
            </Svg>
        </>
    );
};
export const ScheduledWaitingView = ({
    tripData,
    driver,
    onCancel,
    onTransition
}: {
    tripData: any,
    driver?: any,
    onCancel: () => void,
    onTransition: () => void
}) => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { colors: appColors, isDark } = useAppTheme();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const isAccepted = !!tripData.driver_id;
    const tripStatus = tripData?.trip_status || tripData?.status;

    const getTitle = () => {
        if (!isAccepted) return "Finding your Driver";
        switch (tripStatus) {
            case TripStatus.ARRIVING: return "Driver is Arriving";
            case TripStatus.ARRIVED: return "Driver has Arrived";
            case TripStatus.LIVE: return "Trip in Progress";
            case TripStatus.DESTINATION_REACHED: return "Destination Reached";
            default: return "Driver is Confirmed";
        }
    };

    const getSubtitle = () => {
        if (!isAccepted) return "Relax! We're matching you with the best driver\nfor your scheduled trip.";
        switch (tripStatus) {
            case TripStatus.ARRIVING: return "Your driver is on the way to the pickup location.";
            case TripStatus.ARRIVED: return "Your driver is waiting at the pickup location.";
            case TripStatus.LIVE: return "You are currently on your way to the destination.";
            case TripStatus.DESTINATION_REACHED: return "You have successfully reached your destination.";
            default: return "Your driver is ready for the scheduled time.";
        }
    };

    const getBadgeTitle = () => {
        switch (tripStatus) {
            case TripStatus.ARRIVING: return "Driver Arriving!";
            case TripStatus.ARRIVED: return "Driver Arrived!";
            case TripStatus.LIVE: return "Trip in Progress";
            case TripStatus.DESTINATION_REACHED: return "Destination Reached";
            default: return "Driver Confirmed! 🎉";
        }
    };

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.5,
                    duration: 1500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const handleBackToHome = () => {
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: TabNavigation_Nav }],
            })
        );
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: isDark ? appColors.background : '#FFFFFF' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? appColors.background : '#FFFFFF'} />
            <ResponsiveContainer>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + vS(10), paddingBottom: vS(100) }]}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* Banner */}
                <TouchableOpacity
                    style={[styles.bannerContainer, {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#E8F5E9',
                        borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#C8E6C9'
                    }]}
                    disabled={!isAccepted}
                    onPress={isAccepted ? onTransition : undefined}
                >
                    <View style={styles.bannerIconBox}>
                        <MaterialCommunityIcons name="check" size={mS(18)} color="#FFFFFF" />
                    </View>
                    <View style={styles.bannerTextContainer}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.bannerTitle, { color: isDark ? '#34D399' : '#0B309B' }]}>
                            {isAccepted ? getBadgeTitle() : 'Booking Confirmed! 🎉'}
                        </Text>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.bannerSubtitle, { color: isDark ? '#10B981' : '#047857' }]}>
                            {isAccepted ? 'Tap to see your ride on map' : 'Your ride has been scheduled successfully.'}
                        </Text>
                    </View>
                    {isAccepted && (
                        <MaterialCommunityIcons name="chevron-right" size={mS(24)} color="#10B981" />
                    )}
                </TouchableOpacity>

                {/* Hero Image & Radar */}
                <View style={styles.heroContainer}>
                    <Image source={require('../../../../assets/png/ScheduledWaitingScreenImage.png')} style={styles.heroImage} resizeMode="contain" />
                    <BannerWaves isDark={isDark} appColors={appColors} />

                    <View style={styles.radarWrapper}>
                        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.6, 0] }) }]} />
                        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.4, 0] }), delay: 500 } as any]} />
                        <View style={styles.radarCenterCircle}>
                            <MaterialCommunityIcons name="car" size={mS(36)} color="#FFFFFF" />
                        </View>
                    </View>
                </View>

                {/* Status Section */}
                <View style={styles.statusSection}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.statusTitle, { color: isDark ? appColors.text : '#0B309B' }]}>{getTitle()}</Text>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.statusSubtitle, { color: isDark ? appColors.secondaryText : '#64748B' }]}>{getSubtitle()}</Text>

                    {/* <View style={styles.dotsContainer}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View> */}
                </View>

                {/* Info Cards */}
                <View style={styles.cardsContainer}>

                    {/* Schedule & Ride Type Card */}
                    <View style={[styles.card, { backgroundColor: isDark ? appColors.card : '#FFFFFF', borderColor: isDark ? appColors.border : '#F1F5F9' }]}>
                        <View style={styles.cardRow}>
                            {/* Left Side */}
                            <View style={styles.halfCol}>
                                <View style={[styles.iconSquare, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }]}>
                                    <MaterialCommunityIcons name="calendar-month" size={mS(20)} color={isDark ? '#60A5FA' : '#1877F2'} />
                                </View>
                                <View style={styles.colText}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colLabel, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>SCHEDULED FOR</Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colValue, { color: isDark ? appColors.text : '#0F172A' }]}>
                                        {new Date(tripData.scheduled_start_time).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colValueSub, { color: isDark ? appColors.secondaryText : '#64748B' }]}>
                                        {new Date(tripData.scheduled_start_time).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </Text>
                                </View>
                            </View>

                            {/* Divider */}
                            <View style={styles.verticalDivider} />

                            {/* Right Side */}
                            <View style={styles.halfCol}>
                                <View style={[styles.iconSquare, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }]}>
                                    <MaterialCommunityIcons name="car" size={mS(20)} color={isDark ? '#60A5FA' : '#1877F2'} />
                                </View>
                                <View style={styles.colText}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colLabel, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>RIDE TYPE</Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colValue, { color: isDark ? appColors.text : '#0F172A' }]} numberOfLines={1}>
                                        {tripData?.ride_type?.includes('OUTSTATION') ? 'Outstation' : (tripData?.ride_type?.replace(/_/g, ' ') || 'Ride')}
                                    </Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colValueSub, { color: isDark ? appColors.secondaryText : '#64748B' }]} numberOfLines={1}>
                                        {tripData?.ride_type?.includes('ROUND_TRIP') ? 'Round Trip' : 'One Way'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Driver Card (if accepted) */}
                    {isAccepted && (
                        <TouchableOpacity style={[styles.card, { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? appColors.card : '#FFFFFF', borderColor: isDark ? appColors.border : '#F1F5F9' }]} onPress={onTransition}>
                            <View style={[styles.iconSquare, { width: mS(46), height: mS(46), borderRadius: mS(23), overflow: 'hidden', backgroundColor: isDark ? 'rgba(255, 161, 47, 0.1)' : '#EFF6FF' }]}>
                                {driver?.driverProfilePic ? (
                                    <Image source={{ uri: driver.driverProfilePic }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <MaterialCommunityIcons name="account" size={mS(28)} color="#F59E0B" />
                                )}
                            </View>
                            <View style={{ flex: 1, marginLeft: hS(12) }}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colLabel, { color: isDark ? '#60A5FA' : '#3B82F6' }]}>DRIVER DETAILS</Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colValue, { color: isDark ? appColors.text : '#0F172A' }]}>{driver?.driverName || tripData.driver_name || 'Driver'}</Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.colValueSub, { color: isDark ? appColors.secondaryText : '#64748B' }]}>★ {driver?.driverRating || '4.9'} • {driver?.totalRides || '4.5k'} Rides</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={mS(24)} color={isDark ? appColors.text : "#94A3B8"} />
                        </TouchableOpacity>
                    )}

                    {/* Locations Card */}
                    <View style={[styles.card, { backgroundColor: isDark ? appColors.card : '#FFFFFF', borderColor: isDark ? appColors.border : '#F1F5F9' }]}>
                        {/* Pickup */}
                        <View style={styles.locRow}>
                            <View style={styles.locIconCol}>
                                <MaterialCommunityIcons name="map-marker" size={mS(22)} color="#10B981" />
                            </View>
                            <View style={styles.locTextCol}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.locLabel}>PICKUP</Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.locValue, { color: isDark ? appColors.text : '#1E293B' }]}>{tripData.pickup_address}</Text>
                            </View>
                        </View>

                        {/* Dashed Line */}
                        <View style={styles.dashedLineContainer}>
                            <View style={styles.dashLine} />
                            <View style={styles.dashLine} />
                            <View style={styles.dashLine} />
                            <View style={styles.horizontalDashedDivider} />
                        </View>

                        {/* Drop */}
                        <View style={styles.locRow}>
                            <View style={styles.locIconCol}>
                                <MaterialCommunityIcons name="map-marker" size={mS(22)} color="#EF4444" />
                            </View>
                            <View style={styles.locTextCol}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.locLabel, { color: '#EF4444' }]}>DESTINATION</Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.locValue, { color: isDark ? appColors.text : '#1E293B' }]}>{tripData.drop_address}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Security Info */}
                    <View style={[styles.securityBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
                        <View style={styles.securityIconBox}>
                            <MaterialCommunityIcons name="shield-check" size={mS(20)} color="#FFFFFF" />
                        </View>
                        <View style={styles.securityTextCol}>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.securityTitle, { color: isDark ? '#34D399' : '#064E3B' }]}>Your ride is secured.</Text>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.securitySubtitle, { color: isDark ? '#10B981' : '#047857' }]}>We'll notify you 15 mins before the trip starts.</Text>
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* Sticky Footer Actions */}
            <View style={[styles.footerContainer, {
                paddingBottom: Math.max(insets.bottom, vS(16)),
                backgroundColor: isDark ? appColors.card : '#FFFFFF',
                borderTopColor: isDark ? appColors.border : '#F1F5F9'
            }]}>
                <TouchableOpacity style={[styles.footerBtnBlue, {
                    backgroundColor: isDark ? 'rgba(24, 119, 242, 0.15)' : '#EFF6FF',
                    borderColor: isDark ? 'rgba(24, 119, 242, 0.3)' : '#DBEAFE'
                }]} onPress={handleBackToHome}>
                    <MaterialCommunityIcons name="home-outline" size={mS(18)} color={isDark ? '#60A5FA' : '#1877F2'} />
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.footerBtnTextBlue, { color: isDark ? '#60A5FA' : '#1877F2' }]}>Back to Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.footerBtnRed, {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FEE2E2'
                }]} onPress={onCancel}>
                    <MaterialCommunityIcons name="close" size={mS(18)} color={isDark ? '#F87171' : '#EF4444'} />
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.footerBtnTextRed, { color: isDark ? '#F87171' : '#EF4444' }]}>Cancel Request</Text>
                </TouchableOpacity>
            </View>
            </ResponsiveContainer>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        // padding top set dynamically
    },
    bannerContainer: {
        flexDirection: 'row',
        backgroundColor: '#E8F5E9',
        marginHorizontal: hS(16),
        padding: mS(12),
        borderRadius: mS(16),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C8E6C9',
        zIndex: 10,
    },
    bannerIconBox: {
        width: mS(32),
        height: mS(32),
        borderRadius: mS(16),
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerTextContainer: {
        marginLeft: hS(12),
        flex: 1,
    },
    bannerTitle: {
        fontSize: mS(14),
        fontWeight: '800',
        color: '#0B309B',
        marginBottom: vS(2),
    },
    bannerSubtitle: {
        fontSize: mS(12),
        color: '#047857',
        fontWeight: '500',
    },
    heroContainer: {
        width: width,
        marginTop: -vS(20),
        position: 'relative',
        alignItems: 'center',
    },
    heroImage: {
        width: '100%',
        aspectRatio: 1.75,
    },
    radarWrapper: {
        position: 'absolute',
        top: vS(50),
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseCircle: {
        position: 'absolute',
        width: mS(120),
        height: mS(120),
        borderRadius: mS(60),
        backgroundColor: '#1877F2',
    },
    radarCenterCircle: {
        width: mS(70),
        height: mS(70),
        borderRadius: mS(35),
        backgroundColor: '#0B309B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 5,
    },
    statusSection: {
        alignItems: 'center',
        paddingHorizontal: hS(24),
        marginTop: vS(10),
    },
    statusTitle: {
        fontSize: mS(22),
        fontWeight: '800',
        color: '#0B309B',
        marginBottom: vS(6),
    },
    statusSubtitle: {
        fontSize: mS(13),
        color: '#64748B',
        textAlign: 'center',
        lineHeight: mS(18),
    },
    dotsContainer: {
        flexDirection: 'row',
        marginTop: vS(16),
        alignItems: 'center',
    },
    dot: {
        width: mS(8),
        height: mS(8),
        borderRadius: mS(4),
        backgroundColor: '#BFDBFE',
        marginHorizontal: hS(4),
    },
    activeDot: {
        backgroundColor: '#1877F2',
        width: mS(10),
        height: mS(10),
        borderRadius: mS(5),
    },
    cardsContainer: {
        paddingHorizontal: hS(16),
        marginTop: vS(24),
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: mS(16),
        padding: mS(16),
        marginBottom: vS(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    halfCol: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconSquare: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(10),
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colText: {
        marginLeft: hS(10),
        flex: 1,
    },
    colLabel: {
        fontSize: mS(10),
        color: '#3B82F6',
        fontWeight: '700',
        marginBottom: vS(2),
        letterSpacing: 0.5,
    },
    colValue: {
        fontSize: mS(14),
        fontWeight: '800',
        color: '#0F172A',
    },
    colValueSub: {
        fontSize: mS(12),
        color: '#64748B',
        fontWeight: '600',
        marginTop: vS(2),
    },
    verticalDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#E2E8F0',
        marginHorizontal: hS(12),
    },
    locRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locIconCol: {
        width: mS(24),
        alignItems: 'center',
        paddingTop: vS(2),
    },
    locTextCol: {
        flex: 1,
        marginLeft: hS(12),
    },
    locLabel: {
        fontSize: mS(10),
        fontWeight: '700',
        color: '#10B981',
        marginBottom: vS(2),
        letterSpacing: 0.5,
    },
    locValue: {
        fontSize: mS(13),
        fontWeight: '500',
        color: '#1E293B',
        lineHeight: mS(18),
    },
    dashedLineContainer: {
        marginLeft: mS(11),
        paddingVertical: vS(4),
        alignItems: 'center',
        width: 2,
    },
    dashLine: {
        width: 2,
        height: vS(4),
        backgroundColor: '#94A3B8',
        marginVertical: vS(2),
    },
    horizontalDashedDivider: {
        position: 'absolute',
        top: vS(10),
        left: hS(36),
        right: -hS(300),
        height: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    securityBox: {
        flexDirection: 'row',
        backgroundColor: '#ECFDF5',
        borderRadius: mS(12),
        padding: mS(16),
        marginBottom: vS(24),
        alignItems: 'center',
    },
    securityIconBox: {
        width: mS(28),
        height: mS(28),
        borderRadius: mS(14),
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    securityTextCol: {
        marginLeft: hS(12),
        flex: 1,
    },
    securityTitle: {
        fontSize: mS(13),
        fontWeight: '800',
        color: '#064E3B',
        marginBottom: vS(2),
    },
    securitySubtitle: {
        fontSize: mS(12),
        color: '#047857',
        fontWeight: '500',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: hS(16),
        paddingTop: vS(16),
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerBtnBlue: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        paddingVertical: vS(14),
        borderRadius: mS(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(6),
    },
    footerBtnTextBlue: {
        fontSize: mS(13),
        fontWeight: '700',
        color: '#1877F2',
        marginLeft: hS(6),
    },
    footerBtnRed: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
        paddingVertical: vS(14),
        borderRadius: mS(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: hS(6),
    },
    footerBtnTextRed: {
        fontSize: mS(13),
        fontWeight: '700',
        color: '#EF4444',
        marginLeft: hS(6),
    }
});