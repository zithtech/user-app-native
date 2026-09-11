import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ResponsiveContainer } from "../../../../Components/ResponsiveContainer";
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { hS, mS, vS } from '../../../../lib/responsive';
import colors from '../../../../constant/colors';

import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RatingInfoScreen = () => {
    const insets = useSafeAreaInsets();
    const { colors: appColors, isDark } = useAppTheme();
    const user = useSelector((state: RootState) => state.userSlice.user);

    const currentRating = user?.rating ? Number(user.rating).toFixed(2) : '0.00';
    const totalTrips = user?.total_trips || 0;

    const steps = [
        {
            id: 1,
            title: "Drivers rate you",
            desc: "After every ride, the Captain rates your trip from 1 to 5 stars based on behavior and punctuality.",
            icon: "star-shooting-outline",
            color: "#F59E0B",
            delay: 300
        },
        {
            id: 2,
            title: "Anonymity is key",
            desc: "Your rating is private. Captains cannot see individual ratings you give them, and they can't see who gave you a score.",
            icon: "shield-account",
            color: "#6366F1",
            delay: 400
        },
        {
            id: 3,
            title: "Mathematical Average",
            desc: "We take the sum of all your star points and divide it by the total number of rated trips.",
            icon: "calculator-variant-outline",
            color: "#10B981",
            delay: 500
        },
        {
            id: 4,
            title: "Rolling 500 Trips",
            desc: "Your rating is calculated based on your last 500 rated trips to keep it fair and up to date.",
            icon: "trophy-outline",
            color: "#3B82F6",
            delay: 600
        }
    ];

    return (
        <View style={[styles.container, { backgroundColor: isDark ? "#020813" : appColors.background }]}>
            <ResponsiveContainer>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + vS(40) }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* HERO SECTION */}
                <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
                    <View style={[styles.heroCard, { backgroundColor: '#021638' }]}>
                        <View style={styles.heroContentRow}>
                            <View style={styles.heroIconBox}>
                                <Image
                                    source={require("../../../../assets/png/RatingScreenImage.png")}
                                    style={styles.heroImage}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.heroTextContainer}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.heroTitle}>Your Community{'\n'}Reputation</Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.heroSubtitle}>Understanding how ratings{'\n'}empower the T2Drive network</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* TIMELINE SECTION */}
                <View style={styles.timelineContainer}>
                    {steps.map((step, index) => (
                        <Animated.View
                            key={step.id}
                            entering={FadeInLeft.delay(step.delay).duration(600)}
                            style={styles.stepItem}
                        >
                            <View style={styles.timelineAnchor}>
                                {index !== 0 && <View style={[styles.verticalLineTop, { backgroundColor: appColors.border }]} />}
                                <View style={[styles.outerDot, { borderColor: step.color, backgroundColor: appColors.background }]}>
                                    <View style={[styles.innerDot, { backgroundColor: step.color }]} />
                                </View>
                                {index !== steps.length - 1 && <View style={[styles.verticalLineBottom, { backgroundColor: appColors.border }]} />}
                            </View>

                            <View style={[styles.stepCard, { backgroundColor: isDark ? '#0A1931' : '#FFF', borderColor: isDark ? '#1E3A8A' : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
                                <View style={[styles.stepIconBox, { backgroundColor: step.color + '15' }]}>
                                    <Icon name={step.icon} size={mS(24)} color={step.color} />
                                </View>
                                <View style={styles.stepTextContent}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.stepTitle, { color: appColors.text }]}>{step.title}</Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.stepDesc, { color: appColors.lightTextColor }]} numberOfLines={4}>{step.desc}</Text>
                                </View>
                                <View style={styles.stepRightContent}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.stepNumber, { color: step.color }]}>{`0${step.id}`}</Text>
                                    <Icon name="chevron-right" size={mS(20)} color={appColors.lightTextColor} style={{ marginTop: vS(6) }} />
                                </View>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                {/* CURRENT RATING CARD */}
                <Animated.View entering={FadeInUp.delay(800).duration(800)}>
                    <View style={[styles.ratingCard, { backgroundColor: isDark ? '#0A1931' : '#F8FAFC', borderWidth: isDark ? 1 : 0, borderColor: isDark ? "#1E3A8A" : appColors.border }]}>
                        <View style={styles.ratingCardRow}>
                            <View style={styles.ratingLeft}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.ratingTitle, { color: appColors.text }]}>Your Current Rating</Text>
                                <View style={styles.ratingScoreRow}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.ratingScoreText, { color: '#3B82F6' }]}>{currentRating}</Text>
                                    <Icon name="star" size={mS(24)} color="#3B82F6" />
                                </View>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.ratingSubtitle, { color: appColors.lightTextColor }]}>Based on last {totalTrips} rated trips</Text>

                            </View>

                            <View style={[styles.ratingDivider, { backgroundColor: appColors.border }]} />

                            <View style={styles.ratingRight}>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((star, i) => (
                                        <Icon key={i} name={i < 4 ? "star" : "star-half-full"} size={mS(18)} color="#3B82F6" />
                                    ))}
                                </View>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.excellentText, { color: appColors.text }]}>Excellent</Text>
                                <View style={[styles.goodStandingBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7' }]}>
                                    <Icon name="arrow-up" size={mS(12)} color="#10B981" />
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.goodStandingText}>Good standing</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* BOTTOM DISCLAIMER */}
                <View style={styles.disclaimerContainer}>
                    <View style={[styles.disclaimerIconBox, { backgroundColor: isDark ? appColors.card : '#F1F5F9' }]}>
                        <Icon name="shield-check-outline" size={mS(20)} color={isDark ? appColors.text : "#1E293B"} />
                    </View>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.disclaimerText, { color: appColors.lightTextColor }]}>
                        Ratings help us build a safe, respectful and reliable community for everyone.
                    </Text>
                </View>

            </ScrollView>
            </ResponsiveContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: hS(16),
        paddingTop: vS(12),
    },
    heroSection: {
        marginBottom: vS(20),
    },
    heroCard: {
        borderRadius: mS(16),
        paddingVertical: vS(20),
        paddingHorizontal: hS(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'hidden',
    },
    heroContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(12),
    },
    heroIconBox: {
        width: mS(100),
        height: mS(100),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent !important',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent !important',
    },
    heroTextContainer: {
        flex: 1,
    },
    heroTitle: {
        fontSize: mS(18),
        fontWeight: '800',
        color: '#FFF',
        marginBottom: vS(6),
    },
    heroSubtitle: {
        fontSize: mS(12),
        color: '#94A3B8',
        lineHeight: mS(16),
    },
    timelineContainer: {
        paddingLeft: hS(4),
        marginBottom: vS(12),
    },
    stepItem: {
        flexDirection: 'row',
        minHeight: vS(80),
    },
    timelineAnchor: {
        width: hS(24),
        alignItems: 'center',
    },
    outerDot: {
        width: mS(12),
        height: mS(12),
        borderRadius: mS(6),
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: vS(28),
        zIndex: 2,
    },
    innerDot: {
        width: mS(6),
        height: mS(6),
        borderRadius: mS(3),
    },
    verticalLineTop: {
        width: 1,
        height: vS(28),
        position: 'absolute',
        top: 0,
    },
    verticalLineBottom: {
        width: 1,
        flex: 1,
        position: 'absolute',
        top: vS(28) + mS(12),
        bottom: 0,
    },
    stepCard: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: mS(12),
        padding: mS(14),
        marginLeft: hS(8),
        marginBottom: vS(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        alignItems: 'center',
    },
    stepIconBox: {
        width: mS(44),
        height: mS(44),
        borderRadius: mS(22),
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepTextContent: {
        flex: 1,
        marginLeft: hS(12),
        marginRight: hS(8),
    },
    stepTitle: {
        fontSize: mS(13),
        fontWeight: '700',
        marginBottom: vS(4),
    },
    stepDesc: {
        fontSize: mS(11),
        lineHeight: mS(16),
    },
    stepRightContent: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100%',
        paddingTop: vS(2),
    },
    stepNumber: {
        fontSize: mS(12),
        fontWeight: '800',
    },
    ratingCard: {
        borderRadius: mS(16),
        padding: mS(20),
        marginBottom: vS(16),
    },
    ratingCardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingLeft: {
        flex: 1.2,
    },
    ratingTitle: {
        fontSize: mS(13),
        fontWeight: '700',
        marginBottom: vS(10),
    },
    ratingScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(8),
        marginBottom: vS(10),
    },
    ratingScoreText: {
        fontSize: mS(36),
        fontWeight: '900',
    },
    ratingSubtitle: {
        fontSize: mS(11),
        lineHeight: mS(16),
    },
    ratingDivider: {
        width: 1,
        height: '100%',
        marginHorizontal: hS(16),
    },
    ratingRight: {
        flex: 1,
        alignItems: 'flex-start',
        paddingVertical: vS(8),
    },
    starsRow: {
        flexDirection: 'row',
        gap: hS(2),
        marginBottom: vS(8),
    },
    excellentText: {
        fontSize: mS(12),
        fontWeight: '700',
        marginBottom: vS(10),
    },
    goodStandingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(8),
        paddingVertical: vS(4),
        borderRadius: mS(6),
        gap: hS(4),
    },
    goodStandingText: {
        color: '#10B981',
        fontSize: mS(10),
        fontWeight: '700',
    },
    disclaimerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: vS(8),
        gap: hS(12),
        paddingHorizontal: hS(8),
    },
    disclaimerIconBox: {
        width: mS(36),
        height: mS(36),
        borderRadius: mS(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    disclaimerText: {
        flex: 1,
        fontSize: mS(11),
        lineHeight: mS(16),
    }
});

export default RatingInfoScreen;