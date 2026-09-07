// import React from "react";
// import { View, StyleSheet } from "react-native";
// import { DailyComponentImage } from '../../../assets/svg';
// import { Styles } from "../../../lib/styles";
// import fonts from "../../../constant/fonts";
// import Button from "../../../Components/Button";
// import Text from '../../../Components/Text';
// import { useAppTheme } from "../../../hooks/useAppTheme";

// // Import your responsive utilities
// import { hS, vS, mS } from '../../../lib/responsive';

// export function DailyComponent() {
//     const { colors: appColors, isDark } = useAppTheme();
//     return (
//         <View style={style.container}>
//             <View style={[style.cardContainer, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
//                 {/* Left Column: Text & Button */}
//                 <View style={style.textColumn}>
//                     <Text style={[fonts.bold, style.title, { color: appColors.text }]}>
//                         Get Schedule Drivers
//                     </Text>

//                     <Text style={[fonts.light, style.description, { color: appColors.secondaryText }]}>
//                         Hire the drivers who speaks your languages for up to week & we ‘ll make it happen
//                     </Text>

//                     <Button style={style.reserveBtn}>
//                         <Text style={[fonts.regular, style.btnText]}>
//                             Reserve Now
//                         </Text>
//                     </Button>
//                 </View>

//                 {/* Right Column: Image */}
//                 <DailyComponentImage width={hS(100)} height={vS(100)} />
//             </View>
//         </View>
//     );
// }

// const style = StyleSheet.create({
//     container: {
//         width: '100%',
//         // Use minHeight to allow content to expand if needed
//         minHeight: vS(165),
//         rowGap: vS(9),
//         alignItems: 'center',
//         // Centers the component within the parent's padding
//         alignSelf: 'center',
//     },
//     cardContainer: {
//         flexDirection: 'row',
//         width: '90%', // Use percentage to fit the parent white sheet
//         minHeight: vS(128),
//         backgroundColor: '#F4F4F4',
//         borderWidth: 0.8,
//         borderColor: '#E5E5E5',
//         borderRadius: mS(20),
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: hS(15), // Replaces 'left: 15' for internal spacing
//         alignSelf: 'center',
//     },
//     textColumn: {
//         width: '60%', // Take up 60% of the card width
//         justifyContent: 'center',
//     },
//     title: {
//         fontSize: mS(15),
//         fontWeight: '700',
//         lineHeight: vS(21),
//         color: '#000000',
//     },
//     description: {
//         fontSize: mS(10),
//         fontWeight: '300',
//         lineHeight: vS(13),
//         color: '#000000',
//         marginVertical: vS(4),
//     },
//     reserveBtn: {
//         width: hS(120),
//         height: vS(32),
//         borderRadius: mS(20),
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginTop: vS(5),
//     },
//     btnText: {
//         fontSize: mS(10),
//         fontWeight: '400',
//         color: '#FFFFFF',
//     }
// });

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, TouchableOpacity, FlatList, ScrollView } from "react-native";
import { DailyComponentImage } from '../../../assets/svg';
import fonts from "../../../constant/fonts";
import Button from "../../../Components/Button";
import Text from '../../../Components/Text';
import { useAppTheme } from "../../../hooks/useAppTheme";
import { hS, vS, mS } from '../../../lib/responsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from "@react-navigation/native";
import { BookedTripScreen_Nav, LocationSearch_Nav, TabNavigation_Nav } from "../../../Navigations/navigations";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";




interface ScheduleOption {
    id: string;
    duration: string;
    days: number;
    price: string;
    discount?: string;
    popular?: boolean;
}

export function DailyComponent() {
    const { colors: appColors, isDark } = useAppTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const navigation = useNavigation<any>();
    const scheduledTrips = useSelector((state: RootState) => state.tripSlice.scheduledTrips);

    const scheduleOptions: ScheduleOption[] = [
        { id: '1', duration: '1 Day', days: 1, price: '₹2,500' },
        { id: '2', duration: '3 Days', days: 3, price: '₹6,500', discount: '15% off' },
        { id: '3', duration: '1 Week', days: 7, price: '₹13,500', discount: '20% off', popular: true },
        { id: '4', duration: '2 Weeks', days: 14, price: '₹25,000', discount: '25% off' },
    ];

    const driverFeatures = [
        { icon: 'checkmark-circle', label: 'Verified Drivers', description: 'Background checked & certified', iconcolor: '#8B5CF6', iconBgColor: '#8B5CF615' },
        { icon: 'globe', label: 'Multi Drivers Types', description: 'Normal-Elite-Premium Drivers', iconcolor: '#F59E0B', iconBgColor: '#F59E0B15' },
        { icon: 'star', label: 'Top Rated', description: '4.8+ average rating', iconcolor: '#10B981', iconBgColor: '#10B98115' },
        { icon: 'time', label: 'Flexible Scheduling', description: 'Book on your terms', iconcolor: '#3B82F6', iconBgColor: '#3B82F615' },
    ];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }
            ]}
        >
            {/* Hero Card Section */}
            <View
                style={[
                    styles.heroCard,
                    {
                        backgroundColor: isDark ? '#0A1931' : appColors.button,
                        borderColor: isDark ? '#152B4D' : appColors.border,
                        borderWidth: isDark ? 1 : 0,
                    }
                ]}
            >
                {/* Left Content */}
                <View style={styles.heroContent}>
                    <View style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#FFFFFF' }]}>
                        <Ionicons name="flash" size={14} color={isDark ? '#FCD34D' : appColors.primary} />
                        <Text style={[styles.badgeText, { color: isDark ? '#E2E8F0' : '#000' }]}>LIMITED TIME OFFER</Text>
                    </View>

                    <Text style={[fonts.bold, styles.heroTitle, { color: isDark ? '#FFFFFF' : appColors.text }]}>
                        Get Scheduled <Text style={{ color: isDark ? '#3B82F6' : appColors.text }}>Drivers</Text>
                    </Text>

                    <Text style={[styles.heroDescription, { color: isDark ? '#9CA3AF' : '#E0E7FF' }]}>
                        Hire verified drivers who speak your language for up to a week. Professional, reliable, and hassle-free.
                    </Text>

                    {/* Quick Stats */}
                    <View style={styles.statsRow}>
                        <StatBadge icon="star" label="4.8 Rating" value="5K+ Reviews" isDark={isDark} appColors={appColors} />
                        <StatBadge icon="checkmark-shield" label="100% Verified" value="Safe & Secure" isDark={isDark} appColors={appColors} />
                    </View>

                    {/* Primary CTA */}
                    <Button
                        style={[styles.reserveBtn, { backgroundColor: isDark ? '#007BFF' : '#FFFFFF' }]}
                        onPress={() =>
                            navigation.navigate(LocationSearch_Nav, { screenName: 'Schedule' })
                        }
                    >
                        <Text style={[fonts.bold, styles.btnTextPrimary, { color: isDark ? '#FFFFFF' : '#000' }]}>
                            Reserve Now
                        </Text>
                        <Ionicons name="arrow-forward" size={16} color={isDark ? '#FFFFFF' : appColors.primary} />
                    </Button>

                    {/* Secondary CTA */}
                    <TouchableOpacity style={styles.learnMoreBtn}>
                        <Text style={[styles.learnMoreText, { color: isDark ? '#3B82F6' : '#FFFFFF' }]}>Learn more</Text>
                        <Ionicons name="chevron-forward" size={12} color={isDark ? '#3B82F6' : '#FFFFFF'} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                </View>

                {/* Right Image */}
                <View style={styles.heroImageContainer}>
                    <DailyComponentImage width={hS(140)} height={vS(180)} />
                </View>
            </View>

            {/* Schedule Options */}
            {/* <View style={styles.scheduleSection}>
                <Text style={[fonts.bold, styles.sectionTitle, { color: appColors.text }]}>
                    Choose Your Schedule
                </Text>
                <Text style={[styles.sectionSubtitle, { color: appColors.text }]}>
                    Flexible plans starting from ₹2,500/day
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scheduleScroll}
                    scrollEventThrottle={16}
                >
                    {scheduleOptions.map((option) => (
                        <ScheduleCard key={option.id} option={option} appColors={appColors} isDark={isDark} />
                    ))}
                </ScrollView>
            </View> */}

            {/* Driver Features Grid */}
            <View style={styles.featuresSection}>
                <View style={styles.sectionHeader}>
                    <Text style={[fonts.bold, styles.sectionTitle, { color: isDark ? '#FFFFFF' : appColors.text }]}>
                        Why Choose Our Drivers?
                    </Text>
                    <TouchableOpacity>
                        <Text style={[styles.viewAllText, { color: isDark ? '#3B82F6' : appColors.primary }]}>View All  </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.featuresGrid}>
                    {driverFeatures.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} appColors={appColors} isDark={isDark} iconcolor={feature.iconcolor} iconBgColor={feature.iconBgColor} />
                    ))}
                </View>
            </View>

            {/* Driver Showcase */}
            <View style={styles.driversSection}>
                <View style={styles.driversHeader}>
                    <Text style={[fonts.bold, styles.sectionTitle, { color: isDark ? '#FFFFFF' : appColors.text }]}>
                        Recently Scheduled
                    </Text>
                    <TouchableOpacity
                        style={{ paddingHorizontal: 10 }}
                        onPress={() => navigation.navigate(TabNavigation_Nav, {
                            screen: 'Activity'
                        })}>
                        <Text style={[styles.viewAllText, { color: isDark ? '#3B82F6' : appColors.primary }]}>View All  </Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={scheduledTrips.slice(0, 3)}
                    keyExtractor={(item) => item.trip_id?.toString() || item.id?.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <ScheduledTripCard
                            trip={item}
                            appColors={appColors}
                            isDark={isDark}
                            onPress={() => navigation.navigate(BookedTripScreen_Nav, item)}
                        />
                    )}
                    ItemSeparatorComponent={() => (
                        <View style={[styles.driverSeparator, { backgroundColor: appColors.border }]} />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyStateSmall}>
                            <Ionicons name="calendar-outline" size={40} color={isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'} />
                            <Text style={[styles.emptyText, { color: appColors.text }]}>No recently scheduled rides</Text>
                        </View>
                    }
                    contentContainerStyle={styles.driversList}
                />
            </View>

            {/* How It Works */}
            <View style={[styles.howItWorksSection, { backgroundColor: isDark ? '#0A1931' : '#F9FAFB', borderRadius: 16 }]}>
                <Text style={[fonts.bold, styles.sectionTitle, { color: appColors.text }]}>
                    How It Works
                </Text>

                <View style={styles.stepsContainer}>
                    {[
                        { number: '1', title: 'Search Drivers', description: 'Find drivers by location and language', icon: 'search-outline' },
                        { number: '2', title: 'Select Schedule', description: 'Choose your preferred dates and times', icon: 'calendar-outline' },
                        { number: '3', title: 'Confirm Booking', description: 'Complete payment securely', icon: 'shield-checkmark-outline' },
                        { number: '4', title: 'Meet & Ride', description: 'Your driver arrives on time', icon: 'car-outline' }
                    ].map((step, index) => (
                        <StepCard key={step.number} step={step} index={index} appColors={appColors} isDark={isDark} />
                    ))}
                </View>
            </View>

            {/* Call to Action Footer */}
            <View style={[styles.ctaFooter, { backgroundColor: isDark ? '#1E3A8A' : appColors.primary }]}>
                <View>
                    <Text style={styles.footerTitle}>Ready to Book?</Text>
                    <Text style={styles.footerSubtitle}>Get your driver today</Text>
                </View>
                <Button
                    style={styles.footerBtn}
                    onPress={() => navigation.navigate(LocationSearch_Nav, { screenName: 'Schedule' })}
                >
                    <Text style={[fonts.bold, styles.footerBtnText]}>Book Now</Text>
                </Button>
            </View>
        </Animated.View>
    );
}

// Helper Components

interface StatBadgeProps {
    icon: string;
    label: string;
    value: string;
    isDark: boolean;
    appColors: any;
}

function StatBadge({ icon, label, value, isDark, appColors }: StatBadgeProps) {
    return (
        <View style={[styles.statBadge, { backgroundColor: isDark ? '#152B4D' : 'rgba(255,255,255,0.2)', borderColor: isDark ? '#1E3A8A' : 'rgba(255,255,255,0.3)', borderWidth: 1 }]}>
            <Ionicons name={icon as any} size={16} color={isDark ? '#3B82F6' : '#FFFFFF'} />
            <View>
                <Text style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#E0E7FF' }]}>{label}</Text>
                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#FFFFFF' }]}>{value}</Text>
            </View>
        </View>
    );
}

interface ScheduleCardProps {
    option: ScheduleOption;
    appColors: any;
    isDark: boolean;
}

function ScheduleCard({ option, appColors, isDark }: ScheduleCardProps) {
    return (
        <TouchableOpacity
            style={[
                styles.scheduleCard,
                {
                    backgroundColor: option.popular ? appColors.primary : (isDark ? '#1F2937' : '#FFFFFF'),
                    borderColor: option.popular ? appColors.primary : appColors.border,
                }
            ]}
            activeOpacity={0.7}
        >
            {option.popular && (
                <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                </View>
            )}

            <Text style={[fonts.bold, styles.scheduleDuration, { color: option.popular ? '#FFFFFF' : appColors.text }]}>
                {option.duration}
            </Text>

            <Text style={[styles.schedulePrice, { color: option.popular ? 'rgba(255,255,255,0.9)' : appColors.text }]}>
                {option.price}
            </Text>

            {option.discount && (
                <View style={[styles.discountTag, { backgroundColor: option.popular ? 'rgba(255,255,255,0.2)' : appColors.primary + '20' }]}>
                    <Text style={[styles.discountText, { color: option.popular ? '#FFFFFF' : appColors.primary }]}>
                        {option.discount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

interface FeatureCardProps {
    feature: any;
    appColors: any;
    isDark: boolean;
    iconcolor: string;
    iconBgColor: string;
}

function FeatureCard({ feature, appColors, isDark, iconcolor, iconBgColor }: FeatureCardProps) {
    return (
        <View
            style={[
                styles.featureCard,
                {
                    backgroundColor: isDark ? '#0A1931' : '#FFFFFF',
                    borderColor: isDark ? '#152B4D' : appColors.border,
                }
            ]}
        >
            <View style={[styles.featureIcon, { backgroundColor: iconBgColor || appColors.primary + '15' }]}>
                <Ionicons name={feature.icon as any} size={28} color={iconcolor || appColors.primary} />
            </View>
            <Text style={[fonts.bold, styles.featureLabel, { color: isDark ? '#FFFFFF' : appColors.text, textAlign: 'center' }]}>
                {feature.label}
            </Text>
            <Text style={[styles.featureDescription, { color: isDark ? '#9CA3AF' : appColors.secondaryText, textAlign: 'center' }]}>
                {feature.description}
            </Text>
        </View>
    );
}



function ScheduledTripCard({ trip, appColors, isDark, onPress }: { trip: any; appColors: any; isDark: boolean; onPress: () => void }) {
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
                return { label: 'Cancelled', bgColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2', dotColor: '#EF4444', textColor: isDark ? '#F87171' : '#B91C1C' };
            case 'COMPLETED':
                return { label: 'Completed', bgColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', dotColor: '#10B981', textColor: isDark ? '#34D399' : '#059669' };
            default:
                return { label: status, bgColor: isDark ? 'rgba(148, 163, 184, 0.1)' : '#F3F4F6', dotColor: '#9CA3AF', textColor: isDark ? '#94A3B8' : '#6B7280' };
        }
    };

    const statusInfo = getStatusInfo(trip.trip_status);

    return (
        <TouchableOpacity
            style={[styles.driverCard, { backgroundColor: isDark ? '#0A1931' : '#FFFFFF', borderColor: isDark ? '#152B4D' : appColors.border }]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.statusTag, { backgroundColor: statusInfo.bgColor }]}>
                    <View style={[styles.dot, { backgroundColor: statusInfo.dotColor }]} />
                    <Text style={[styles.statusText, { color: statusInfo.textColor }]}>{statusInfo.label}</Text>
                </View>
                <View style={styles.timeContainer}>
                    <Ionicons name="time-outline" size={14} color={isDark ? appColors.secondaryText : "#6B7280"} />
                    <Text style={[styles.dateTimeText, { color: appColors.secondaryText }]}>
                        {trip.scheduled_start_time ? new Date(trip.scheduled_start_time).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : 'Pending Time'}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: hS(12), marginVertical: vS(8) }}>
                <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : appColors.primary + '15', width: hS(32), height: hS(32) }]}>
                    <Ionicons name="navigate" size={16} color={isDark ? '#3B82F6' : appColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.addressLabel, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>PICKUP</Text>
                    <Text style={[styles.addressText, { color: isDark ? '#FFFFFF' : appColors.text }]} numberOfLines={1}>{trip.pickup_address || 'Current Location'}</Text>
                </View>
            </View>

            {/* Connecting Line Placeholder */}
            <View style={{ position: 'absolute', left: hS(32), top: vS(68), bottom: vS(110), width: 1, backgroundColor: isDark ? '#152B4D' : '#E5E7EB', zIndex: -1 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: hS(12) }}>
                <View style={[styles.featureIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#10B98115', width: hS(32), height: hS(32) }]}>
                    <Ionicons name="location" size={16} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.addressLabel, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>DROP-OFF</Text>
                    <Text style={[styles.addressText, { color: isDark ? '#FFFFFF' : appColors.text }]} numberOfLines={1}>{trip.drop_address}</Text>
                </View>
            </View>

            {trip.driver_details && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: vS(10), paddingTop: vS(10), borderTopWidth: 1, borderTopColor: isDark ? '#152B4D' : '#F3F4F6' }}>
                    <Text style={[styles.driverNote, { color: isDark ? '#9CA3AF' : appColors.secondaryText }]}>
                        Driver: <Text style={{ fontWeight: '700', color: isDark ? '#FFFFFF' : appColors.text }}>{trip.driver_details?.full_name}</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={{ color: isDark ? '#FFFFFF' : appColors.text, fontSize: mS(12), fontWeight: '700' }}>4.8</Text>
                        <TouchableOpacity style={{ backgroundColor: isDark ? '#1E3A8A' : appColors.primary + '15', padding: mS(6), borderRadius: mS(20), marginLeft: hS(10) }}>
                            <Ionicons name="call" size={14} color={isDark ? '#FFFFFF' : appColors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
}

interface StepCardProps {
    step: any;
    index: number;
    appColors: any;
    isDark: boolean;
}

function StepCard({ step, index, appColors, isDark }: StepCardProps) {
    return (
        <View style={styles.stepContainer}>
            <View style={styles.stepNumberContainer}>
                <View style={[styles.stepIconContainer, { backgroundColor: isDark ? `${appColors.primary}20` : '#EFF6FF', borderWidth: 0 }]}>
                    <Ionicons name={step.icon as any} size={22} color={appColors.primary} />
                    <View style={[styles.stepBadge, { backgroundColor: appColors.primary }]}>
                        <Text style={[styles.stepBadgeText, { color: '#FFFFFF' }]}>{step.number}</Text>
                    </View>
                </View>
                {index < 3 && <View style={[styles.stepLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />}
            </View>

            <View style={styles.stepContent}>
                <View style={[styles.stepCardContent, { backgroundColor: isDark ? 'transparent' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                    <Text style={[fonts.bold, styles.stepTitle, { color: appColors.text }]}>
                        {step.title}
                    </Text>
                    <Text style={[styles.stepDescription, { color: appColors.secondaryText }]}>
                        {step.description}
                    </Text>
                </View>
            </View>
        </View>
    );
}

// Mock data
// const mockDrivers: Driver[] = [
//     {
//         id: '1',
//         name: 'Rajesh Kumar',
//         rating: 4.9,
//         reviews: 245,
//         languages: ['Hindi', 'English', 'Marathi'],
//         experience: '8 years driving experience',
//         verified: true,
//         availability: 'Available Now',
//         hourlyRate: '₹500/hr',
//     },
//     {
//         id: '2',
//         name: 'Priya Sharma',
//         rating: 4.8,
//         reviews: 189,
//         languages: ['Hindi', 'English', 'Tamil'],
//         experience: '6 years driving experience',
//         verified: true,
//         availability: 'Available Tomorrow',
//         hourlyRate: '₹450/hr',
//     },
//     {
//         id: '3',
//         name: 'Vikram Patel',
//         rating: 4.7,
//         reviews: 156,
//         languages: ['Gujarati', 'Hindi', 'English'],
//         experience: '5 years driving experience',
//         verified: true,
//         availability: 'Available Next Week',
//         hourlyRate: '₹400/hr',
//     },
// ];

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: hS(16),
        paddingVertical: vS(20),
        gap: vS(24),
    },

    // Hero Card
    heroCard: {
        flexDirection: 'row',
        borderRadius: 20,
        paddingHorizontal: hS(20),
        paddingVertical: vS(24),
        minHeight: vS(220),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    heroContent: {
        flex: 1,
        gap: vS(12),
        marginRight: hS(16),
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(6),
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: hS(10),
        paddingVertical: vS(6),
        borderRadius: 20,
    },
    badgeText: {
        fontSize: mS(9),
        fontWeight: '600',
        color: '#000',
        letterSpacing: 0.5,
    },
    heroTitle: {
        fontSize: mS(22),
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: vS(28),
    },
    heroDescription: {
        fontSize: mS(13),
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: vS(18),
    },
    statsRow: {
        flexDirection: 'row',
        gap: hS(12),
        marginVertical: vS(8),
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(8),
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: hS(10),
        paddingVertical: vS(6),
        borderRadius: 8,
    },
    statLabel: {
        fontSize: mS(9),
        color: 'rgba(255, 255, 255, 0.8)',
    },
    statValue: {
        fontSize: mS(11),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    reserveBtn: {
        flexDirection: 'row',
        paddingHorizontal: hS(20),
        paddingVertical: vS(12),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: hS(8),
        marginTop: vS(8),
    },
    btnTextPrimary: {
        fontSize: mS(13),
        fontWeight: '700',
        color: '#000',
    },
    learnMoreBtn: {
        marginTop: vS(8),
    },
    learnMoreText: {
        fontSize: mS(11),
        fontWeight: '600',
        color: '#FFFFFF',
        textDecorationLine: 'underline',
    },
    heroImageContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: -35 }],
    },

    // Schedule Section
    scheduleSection: {
        gap: vS(12),
    },
    sectionTitle: {
        fontSize: mS(18),
        fontWeight: '700',
        lineHeight: vS(24),
    },
    sectionSubtitle: {
        fontSize: mS(12),
        fontWeight: '400',
        lineHeight: vS(16),
    },
    scheduleScroll: {
        gap: hS(12),
        paddingHorizontal: hS(4),
    },
    scheduleCard: {
        width: hS(140),
        borderRadius: 14,
        borderWidth: 2,
        paddingHorizontal: hS(12),
        paddingVertical: vS(16),
        gap: vS(10),
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: vS(-12),
        backgroundColor: '#FF6B35',
        paddingHorizontal: hS(10),
        paddingVertical: vS(4),
        borderRadius: 12,
    },
    popularText: {
        fontSize: mS(8),
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    scheduleDuration: {
        fontSize: mS(15),
        fontWeight: '700',
        textAlign: 'center',
    },
    schedulePrice: {
        fontSize: mS(16),
        fontWeight: '700',
    },
    discountTag: {
        paddingHorizontal: hS(8),
        paddingVertical: vS(4),
        borderRadius: 6,
    },
    discountText: {
        fontSize: mS(10),
        fontWeight: '600',
    },

    // Features Section
    featuresSection: {
        gap: vS(14),
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: hS(4),
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: hS(12),
        justifyContent: 'space-between',
    },
    featureCard: {
        width: '48%',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: hS(12),
        paddingVertical: vS(14),
        alignItems: 'center',
        gap: vS(8),
    },
    featureIcon: {
        width: hS(44),
        height: hS(44),
        borderRadius: hS(22),
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureLabel: {
        fontSize: mS(12),
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: mS(10),
        textAlign: 'center',
        lineHeight: vS(13),
    },

    // Drivers Section
    driversSection: {
        gap: vS(14),
    },
    driversHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: hS(4),
    },
    viewAllText: {
        fontSize: mS(12),
        fontWeight: '600',
    },
    driversList: {
        gap: vS(12),
    },
    driverCard: {
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: hS(14),
        paddingVertical: vS(14),
        gap: vS(10),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(12),
    },
    driverImagePlaceholder: {
        position: 'relative',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: hS(20),
        height: hS(20),
        borderRadius: hS(10),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    driverName: {
        fontSize: mS(14),
        marginBottom: vS(3),
    },
    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(4),
        marginBottom: vS(3),
    },
    driverRating: {
        fontSize: mS(11),
        fontWeight: '500',
    },
    driverExperience: {
        fontSize: mS(10),
    },
    priceTag: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: hS(8),
        paddingVertical: vS(6),
        borderRadius: 8,
    },
    priceTagText: {
        fontSize: mS(12),
    },
    languagesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: hS(6),
    },
    languageBadge: {
        paddingHorizontal: hS(8),
        paddingVertical: vS(4),
        borderRadius: 6,
    },
    languageText: {
        fontSize: mS(10),
        fontWeight: '500',
    },
    selectDriverBtn: {
        flexDirection: 'row',
        paddingVertical: vS(10),
        paddingHorizontal: hS(16),
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        gap: hS(6),
        marginTop: vS(8),
    },
    selectDriverText: {
        fontSize: mS(11),
        color: '#FFFFFF',
    },
    driverSeparator: {
        height: 1,
        marginVertical: vS(6),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vS(12),
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(10),
        paddingVertical: vS(4),
        borderRadius: 20,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: mS(10),
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(4),
    },
    dateTimeText: {
        fontSize: mS(12),
        fontWeight: '600',
    },
    addressLabel: {
        fontSize: mS(9),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    addressText: {
        fontSize: mS(13),
        fontWeight: '600',
    },
    driverNote: {
        fontSize: mS(12),
    },
    emptyStateSmall: {
        alignItems: 'center',
        paddingVertical: vS(20),
        gap: vS(10),
    },
    emptyText: {
        fontSize: mS(12),
        fontWeight: '500',
    },

    // How It Works
    howItWorksSection: {
        borderRadius: 24,
        paddingHorizontal: hS(20),
        paddingVertical: vS(24),
        gap: vS(20),
    },
    stepsContainer: {
        gap: vS(0),
    },
    stepContainer: {
        flexDirection: 'row',
        gap: hS(16),
    },
    stepNumberContainer: {
        alignItems: 'center',
        width: hS(48),
    },
    stepIconContainer: {
        width: hS(48),
        height: hS(48),
        borderRadius: hS(24),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    stepBadge: {
        position: 'absolute',
        top: -vS(2),
        right: -hS(2),
        width: hS(18),
        height: hS(18),
        borderRadius: hS(9),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    stepBadgeText: {
        fontSize: mS(9),
        fontWeight: '800',
        color: '#FFFFFF',
    },
    stepLine: {
        width: 2,
        height: vS(45),
        marginVertical: vS(4),
    },
    stepContent: {
        flex: 1,
        paddingBottom: vS(20),
    },
    stepCardContent: {
        paddingHorizontal: hS(16),
        paddingVertical: vS(12),
        borderRadius: 16,
        borderWidth: 1,
        gap: vS(4),
    },
    stepTitle: {
        fontSize: mS(14),
        fontWeight: '700',
    },
    stepDescription: {
        fontSize: mS(12),
        lineHeight: vS(16),
        opacity: 0.8,
    },

    // CTA Footer
    ctaFooter: {
        flexDirection: 'row',
        borderRadius: 16,
        paddingHorizontal: hS(20),
        paddingVertical: vS(18),
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vS(20),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    footerTitle: {
        fontSize: mS(16),
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: vS(2),
    },
    footerSubtitle: {
        fontSize: mS(11),
        color: 'rgba(255, 255, 255, 0.8)',
    },
    footerBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: hS(18),
        paddingVertical: vS(10),
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerBtnText: {
        fontSize: mS(12),
        color: '#000',
    },
});