import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    Image,
    Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import colors from '../../../../../constant/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hS, mS, vS } from '../../../../../lib/responsive';
import { ResponsiveContainer } from '../../../../../Components/ResponsiveContainer';
import { useAppTheme } from '../../../../../hooks/useAppTheme';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BottomWave = ({ isDark, appColors }: { isDark?: boolean, appColors?: any }) => (
    <Svg width="100%" height={mS(60)} style={{ position: 'absolute', bottom: 0, left: 0, zIndex: -1 }} viewBox="0 0 375 60" preserveAspectRatio="none">
        <Path d="M0,60 L0,30 C100,60 200,0 375,40 L375,60 Z" fill={isDark ? '#1E293B' : '#E8F4FF'} />
        <Path d="M0,60 L0,45 C150,60 250,20 375,50 L375,60 Z" fill={isDark && appColors ? appColors.background : '#D1E8FF'} />
    </Svg>
);

const AboutVDrive = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
    const { colors: appColors, isDark } = useAppTheme();

    // ==================== ANIMATIONS ====================
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const StatItem = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => (
        <View style={styles.statItem}>
            <MaterialCommunityIcons name={icon} size={mS(24)} color={isDark && color === '#0B309B' ? '#60A5FA' : color} style={{ marginBottom: vS(4) }} />
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>{value}</Text>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.statLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>{label}</Text>
        </View>
    );

    const FeatureCard = ({ iconName, iconColor, title, desc, delay, isPng, pngSource }: any) => {
        const itemFade = useRef(new Animated.Value(0)).current;
        const itemSlide = useRef(new Animated.Value(20)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.timing(itemFade, {
                    toValue: 1,
                    duration: 600,
                    delay: delay,
                    useNativeDriver: true,
                }),
                Animated.timing(itemSlide, {
                    toValue: 0,
                    duration: 600,
                    delay: delay,
                    useNativeDriver: true,
                }),
            ]).start();
        }, []);

        return (
            <Animated.View style={[
                styles.featureCard,
                { opacity: itemFade, transform: [{ translateY: itemSlide }] },
                { backgroundColor: isDark ? appColors.card : '#FFFFFF', shadowColor: isDark ? '#000' : '#000' }
            ]}>
                <View style={styles.featureIconContainer}>
                    {isPng ? (
                        <Image source={pngSource} style={styles.featurePng} resizeMode="contain" />
                    ) : (
                        <MaterialCommunityIcons name={iconName} size={mS(28)} color={isDark && iconColor === '#0B309B' ? '#60A5FA' : iconColor} />
                    )}
                </View>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.featureTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>{title}</Text>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.featureDesc, { color: isDark ? '#9CA3AF' : '#64748B' }]}>{desc}</Text>
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? appColors.background : '#FFFFFF' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            {/* Top Light Blue Gradient */}
            <View style={[styles.topGradient, { backgroundColor: isDark ? appColors.background : '#F8FAFF' }]} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + vS(20) }}>

                {/* HEADER */}
                <View style={[styles.header, { paddingTop: insets.top + vS(10) }]}>
                    <TouchableOpacity onPress={() => navigation?.goBack()} style={[styles.backButton, { backgroundColor: isDark ? appColors.card : '#F1F5F9' }]}>
                        <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={isDark ? '#FFFFFF' : '#1E293B'} />
                    </TouchableOpacity>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>About</Text>
                    <View style={{ width: mS(40) }} />
                </View>

                {/* BANNER SECTION */}
                <Animated.View style={[styles.bannerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {
                        isDark ?
                            <Image source={require('../../../../../assets/png/T2DriveLogo.png')} style={[styles.logoImage, {
                                shadowColor: isDark ? 'white' : appColors.button
                            }]} resizeMode="contain" />
                            : <Image source={require('../../../../../assets/png/T2DriveDarkLogo.png')} style={[styles.logoImage, {
                                shadowColor: isDark ? 'white' : appColors.button
                            }]} resizeMode="contain" />
                    }
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.tagline, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Redefining Your Daily Commute</Text>

                    <Image source={require('../../../../../assets/png/AboutPageImage.png')} style={[styles.cityImage, isDark && { opacity: 0.8 }]} resizeMode="cover" />

                    {/* OVERLAPPING STATS CARD */}
                    <View style={[styles.statsCard, { backgroundColor: isDark ? appColors.card : '#FFFFFF' }]}>
                        <StatItem icon="car" value="100+" label="Rides" color="#0B309B" />
                        <View style={[styles.statDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                        <StatItem icon="account" value="50+" label="Drivers" color="#0B309B" />
                        <View style={[styles.statDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
                        <StatItem icon="star" value="4.9" label="Rating" color="#FACC15" />
                    </View>
                </Animated.View>

                <ResponsiveContainer>
                {/* OUR MISSION */}
                <View style={styles.contentSection}>
                    <View style={styles.missionHeader}>
                        <View style={[styles.accentLine, isDark && { backgroundColor: '#60A5FA' }]} />
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Our Mission</Text>
                    </View>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.missionText, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                        At T2Drive, we're on a mission to revolutionize urban mobility. We believe that getting from point A to point B should be seamless, safe, and sustainable. By connecting thousands of expert drivers with millions of riders, we're building the future of transportation, one ride at a time.
                    </Text>
                </View>

                {/* FEATURES GRID */}
                <View style={styles.featuresGrid}>
                    <FeatureCard
                        delay={400}
                        isPng={true}
                        pngSource={require('../../../../../assets/png/08_shield.png')}
                        title="Safety First"
                        desc="Advanced SOS & verified drivers for your peace of mind."
                    />
                    <FeatureCard
                        delay={500}
                        isPng={true}
                        pngSource={require('../../../../../assets/png/11_wallet_money.png')}
                        title="Best Prices"
                        desc="Premium service at rates that make sense for everyone."
                    />
                    <FeatureCard
                        delay={600}
                        iconName="clock-fast"
                        iconColor="#0B309B"
                        title="Rapid Pickup"
                        desc="Smart matching ensures a ride is always nearby."
                    />
                    <FeatureCard
                        delay={700}
                        iconName="star"
                        iconColor="#FACC15"
                        title="Elite Service"
                        desc="Highly rated drivers providing a top-tier experience."
                    />
                </View>

                {/* CONNECT WITH US */}
                <View style={styles.connectSection}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.connectTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Connect With Us</Text>
                    <View style={styles.socialRow}>
                        {/* Facebook Button */}
                        <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: '#1877F2' }]}>
                            <FontAwesome name="facebook-f" size={mS(24)} color="#FFF" />
                        </TouchableOpacity>

                        {/* Instagram Button with Gradient */}
                        <TouchableOpacity style={[styles.socialIconBtn, { overflow: 'hidden' }]}>
                            <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
                                <Defs>
                                    <LinearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                        <Stop offset="0%" stopColor="#f09433" />
                                        <Stop offset="33%" stopColor="#DD2A7B" />
                                        <Stop offset="66%" stopColor="#8134AF" />
                                        <Stop offset="100%" stopColor="#515BD4" />
                                    </LinearGradient>
                                </Defs>
                                <Rect width="100%" height="100%" fill="url(#ig-grad)" />
                            </Svg>
                            <MaterialCommunityIcons name="instagram" size={mS(24)} color="#FFF" />
                        </TouchableOpacity>

                        {/* Twitter Button */}
                        <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: '#1DA1F2' }]}>
                            <MaterialCommunityIcons name="twitter" size={mS(24)} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.legalRow}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.legalText, { color: isDark ? '#60A5FA' : '#0B309B' }]}>Terms of Service</Text>
                        <View style={[styles.legalDot, { backgroundColor: isDark ? '#60A5FA' : '#0B309B' }]} />
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.legalText, { color: isDark ? '#60A5FA' : '#0B309B' }]}>Privacy Policy</Text>
                    </View>

                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.versionText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                        ❤️ Made with ❤️ in India
                    </Text>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.versionNumber, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>Version 1.0.4</Text>
                </View>

                </ResponsiveContainer>
            </ScrollView>

            {/* Wavy Background at the bottom */}
            <BottomWave isDark={isDark} appColors={appColors} />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: vS(300),
        backgroundColor: '#F8FAFF', // Very light blue tint at the top
        zIndex: 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: hS(20),
        marginBottom: vS(20),
        zIndex: 1,
    },
    backButton: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(20),
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: mS(18),
        fontWeight: '700',
        color: '#1E293B',
    },
    bannerSection: {
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
    },
    logoImage: {
        width: mS(160),
        height: mS(40),
    },
    tagline: {
        fontSize: mS(13),
        color: '#64748B',
        fontWeight: '500',
        marginTop: vS(5),
        marginBottom: vS(15),
    },
    cityImage: {
        width: '100%',
        height: mS(180),
        // borderRadius: mS(20),
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        width: '90%',
        maxWidth: 600,
        alignSelf: 'center',
        paddingVertical: vS(15),
        borderRadius: mS(16),
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginTop: -mS(30), // Overlap the city image
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: mS(16),
        fontWeight: '800',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: mS(11),
        color: '#64748B',
        fontWeight: '500',
        marginTop: vS(2),
    },
    statDivider: {
        width: 1,
        height: vS(30),
        backgroundColor: '#E2E8F0',
    },
    contentSection: {
        paddingHorizontal: hS(20),
        paddingTop: vS(30),
        zIndex: 2,
    },
    missionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vS(10),
    },
    accentLine: {
        width: hS(4),
        height: vS(20),
        backgroundColor: '#0B309B',
        borderRadius: mS(2),
        marginRight: hS(10),
    },
    sectionTitle: {
        fontSize: mS(18),
        fontWeight: '800',
        color: '#1E293B',
    },
    missionText: {
        fontSize: mS(13),
        color: '#64748B',
        lineHeight: vS(20),
        fontWeight: '400',
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: hS(15),
        paddingTop: vS(20),
        justifyContent: 'space-between',
        zIndex: 2,
    },
    featureCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: mS(16),
        padding: mS(15),
        marginBottom: vS(15),
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    featureIconContainer: {
        width: mS(40),
        height: mS(40),
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: vS(10),
    },
    featurePng: {
        width: mS(32),
        height: mS(32),
    },
    featureTitle: {
        fontSize: mS(14),
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: vS(4),
    },
    featureDesc: {
        fontSize: mS(11),
        color: '#64748B',
        lineHeight: vS(16),
    },
    connectSection: {
        alignItems: 'center',
        paddingTop: vS(20),
        paddingBottom: vS(40),
        zIndex: 2,
    },
    connectTitle: {
        fontSize: mS(14),
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: vS(15),
    },
    socialRow: {
        flexDirection: 'row',
        gap: hS(20),
        marginBottom: vS(25),
    },
    socialIconBtn: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(20),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    legalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vS(15),
    },
    legalText: {
        fontSize: mS(12),
        color: '#0B309B',
        fontWeight: '500',
    },
    legalDot: {
        width: mS(4),
        height: mS(4),
        borderRadius: mS(2),
        backgroundColor: '#0B309B',
        marginHorizontal: hS(10),
    },
    versionText: {
        fontSize: mS(12),
        color: '#1E293B',
        fontWeight: '600',
        marginBottom: vS(4),
    },
    versionNumber: {
        fontSize: mS(12),
        color: '#1E293B',
        fontWeight: '800',
    },
});

export default AboutVDrive;