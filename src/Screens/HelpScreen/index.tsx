import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, TextInput, Linking, Alert, Image
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FAQDetailsScreen_Nav } from '../../Navigations/navigations';
import { useNavigation } from '@react-navigation/native';
import colors from '../../constant/colors';
import { useAppTheme } from '../../hooks/useAppTheme';
import { hS, mS, vS } from '../../lib/responsive';
import FaqChatbotModal from './FaqChatbotModal';
import Svg, { Path } from 'react-native-svg';

const FAQ_CATEGORIES = [
    {
        id: 'ride',
        title: 'Ride Related Queries',
        icon: 'car-connected',
        faqs: [
            { id: 'r1', question: 'How do I track my T2Drive?', answer: 'You can track your ride in real-time from the active bookings tab.' },
            { id: 'r2', question: 'Can I change my destination mid-ride?', answer: 'Yes, you can update the destination in-app during an active ride.' }
        ]
    },
    {
        id: 'driver',
        title: 'Driver Related Queries',
        icon: 'account-tie',
        faqs: [
            { id: 'd1', question: 'How to rate my driver?', answer: 'Once the trip ends, a rating star screen will automatically appear.' },
            { id: 'd2', question: 'What if my driver is late?', answer: 'You can call the driver via the app or cancel the ride if they exceed the ETA.' }
        ]
    },
    {
        id: 'payment',
        title: 'Payment Related Queries',
        icon: 'credit-card-outline',
        faqs: [
            { id: 'p1', question: 'What are the payment methods?', answer: 'We accept Credit/Debit cards, UPI, and digital wallets like Paytm.' },
            { id: 'p2', question: 'Is my payment secure?', answer: 'Yes, all transactions are encrypted and follow PCI-DSS standards.' }
        ]
    }
];

const HelpScreen: React.FC<ScreenProps> = () => {
    const [search, setSearch] = useState('');
    const [isChatbotVisible, setIsChatbotVisible] = useState(false);
    const navigation = useNavigation<any>();
    const { colors: appColors, isDark } = useAppTheme();

    const handleCall = () => {
        Linking.openURL('tel:+1234567890').catch(() =>
            Alert.alert('Error', 'Call feature is not supported on this device')
        );
    };

    const handleEmail = () => {
        Linking.openURL('mailto:support@t2drive.com?subject=Help Request').catch(() =>
            Alert.alert('Error', 'Email feature is not supported on this device')
        );
    };

    const filteredCategories = FAQ_CATEGORIES.filter(cat =>
        cat.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? appColors.background : '#F8FAFC' }]}>
            {isDark && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: vS(200) }}>
                    <Svg height="100%" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <Path
                            fill="rgba(30, 58, 138, 0.3)"
                            d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                        />
                    </Svg>
                </View>
            )}

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* --- MODERN SUPPORT HEADER --- */}
                <View style={[styles.supportHeader, { backgroundColor: 'transparent' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vS(16) }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.headerTitle, { color: isDark ? '#F8FAFC' : appColors.text }]}>How can we help you?</Text>
                            <Text style={[styles.headerSubtitle, { color: isDark ? '#94A3B8' : appColors.lightTextColor }]}>Our team is here to support you 24/7</Text>
                        </View>
                        {isDark ? (
                            <Image
                                source={require('../../assets/png/HelpHeadesetDark.png')}
                                style={{ width: mS(120), height: mS(120), resizeMode: 'contain' }}
                            />
                        ) : (
                            <Image
                                source={require('../../assets/png/HelpHeadset.png')}
                                style={{ width: mS(120), height: mS(120), resizeMode: 'contain' }}
                            />
                        )}
                    </View>

                    <View style={styles.contactRow}>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={[styles.contactCard, { backgroundColor: isDark ? appColors.card : '#F4FAF6', borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#D1FAE5' }]}
                            onPress={handleCall}
                        >
                            <View style={[styles.contactIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5' }]}>
                                <MaterialCommunityIcons name="phone" size={mS(18)} color="#10B981" />
                            </View>
                            <View style={styles.contactTextWrapper}>
                                <Text style={[styles.contactLabel, { color: isDark ? '#F8FAFC' : appColors.text }]}>Call Us</Text>
                                <Text style={[styles.contactSublabel, { color: isDark ? '#94A3B8' : appColors.lightTextColor }]}>Instant Support</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={mS(16)} color={isDark ? '#64748B' : appColors.lightTextColor} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={[styles.contactCard, { backgroundColor: isDark ? appColors.card : '#F4F8FF', borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#DBEAFE' }]}
                            onPress={handleEmail}
                        >
                            <View style={[styles.contactIconCircle, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#EFF6FF' }]}>
                                <MaterialCommunityIcons name="email" size={mS(18)} color={isDark ? '#38BDF8' : '#3B82F6'} />
                            </View>
                            <View style={styles.contactTextWrapper}>
                                <Text style={[styles.contactLabel, { color: isDark ? '#F8FAFC' : appColors.text }]}>Email Us</Text>
                                <Text style={[styles.contactSublabel, { color: isDark ? '#94A3B8' : appColors.lightTextColor }]}>Within 24 hours</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={mS(16)} color={isDark ? '#64748B' : appColors.lightTextColor} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- POLISHED SEARCH BAR --- */}
                <View style={styles.searchWrapper}>
                    <View style={[styles.searchContainer, { backgroundColor: isDark ? appColors.card : '#FFFFFF', borderColor: isDark ? appColors.border : '#F1F5F9' }]}>
                        <MaterialCommunityIcons name="magnify" size={mS(20)} color={isDark ? '#64748B' : appColors.lightTextColor} />
                        <TextInput
                            placeholder="Search help topics..."
                            placeholderTextColor={isDark ? '#64748B' : appColors.lightTextColor}
                            style={[styles.searchInput, { color: isDark ? '#F8FAFC' : appColors.text }]}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {/* --- FAQ CATEGORIES SECTION --- */}
                <View style={styles.faqSection}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : appColors.text, marginBottom: vS(6) }]}>Browse Categories</Text>
                    <View style={{ width: mS(36), height: vS(3), backgroundColor: isDark ? '#0EA5E9' : '#3B82F6', marginBottom: vS(12), borderRadius: mS(2) }} />

                    <View style={[styles.cardContainer, { backgroundColor: isDark ? appColors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', paddingVertical: vS(8) }]}>
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((cat, index) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    activeOpacity={0.7}
                                    style={[
                                        styles.categoryActionRow,
                                        { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : appColors.border },
                                        index === filteredCategories.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                    onPress={() =>
                                        navigation.navigate(FAQDetailsScreen_Nav, {
                                            title: cat.title,
                                            questions: cat.faqs
                                        })
                                    }
                                >
                                    <View style={[styles.categoryIconBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                                        <MaterialCommunityIcons name={cat.icon} size={mS(22)} color={isDark ? '#60A5FA' : '#1E293B'} />
                                    </View>
                                    <View style={styles.categoryContent}>
                                        <Text style={[styles.categoryTitle, { color: isDark ? '#F8FAFC' : appColors.text }]}>{cat.title}</Text>
                                        <Text style={[styles.categorySub, { color: isDark ? '#94A3B8' : appColors.lightTextColor }]}>{cat.faqs.length} Questions Available</Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={mS(20)} color={isDark ? '#64748B' : appColors.border} />
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noResultsBox}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={mS(32)} color={isDark ? '#64748B' : appColors.lightTextColor} />
                                <Text style={[styles.noResultsText, { color: isDark ? '#94A3B8' : appColors.lightTextColor }]}>No help topics found for "{search}"</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.footerInfo}>
                    <MaterialCommunityIcons name="shield-check-outline" size={mS(24)} color={isDark ? '#0EA5E9' : "#3B82F6"} style={{ marginBottom: vS(8) }} />
                    <Text style={[styles.footerText, { color: isDark ? '#94A3B8' : appColors.lightTextColor }]}>We're committed to providing</Text>
                    <Text style={[styles.footerText, { color: isDark ? '#94A3B8' : appColors.lightTextColor, marginBottom: vS(16) }]}>you the best support experience.</Text>
                    <Text style={[styles.footerText, { color: isDark ? '#64748B' : appColors.lightTextColor }]}>Version 1.0.42 (Beta)</Text>
                </View>
            </ScrollView>

            {/* --- FLOATING CHATBOT BUTTON --- */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: isDark ? '#3B82F6' : '#4F46E5' }]}
                onPress={() => setIsChatbotVisible(true)}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="chat-processing" size={mS(28)} color="#FFFFFF" />
            </TouchableOpacity>

            <FaqChatbotModal
                visible={isChatbotVisible}
                onClose={() => setIsChatbotVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    scrollContent: {
        paddingBottom: vS(40)
    },
    supportHeader: {
        paddingTop: vS(8),
        paddingHorizontal: hS(20),
        paddingBottom: vS(20),
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    headerTitle: {
        fontSize: mS(26),
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: mS(13),
        color: '#64748B',
        marginTop: vS(2),
        fontWeight: '500',
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: hS(12),
    },
    contactCard: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        padding: mS(10),
        paddingHorizontal: hS(10),
        borderRadius: mS(10),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    contactIconCircle: {
        width: mS(34),
        height: mS(34),
        borderRadius: mS(17),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(8),
    },
    contactTextWrapper: {
        flex: 1,
    },
    contactLabel: {
        fontSize: mS(13),
        fontWeight: '700',
        color: '#1E293B',
    },
    contactSublabel: {
        fontSize: mS(10),
        color: '#94A3B8',
        marginTop: vS(1),
        fontWeight: '500',
    },
    searchWrapper: {
        marginTop: vS(12),
        paddingHorizontal: hS(20),
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: hS(16),
        borderRadius: mS(16),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: vS(44),
    },
    searchInput: {
        flex: 1,
        marginLeft: hS(10),
        fontSize: mS(14),
        color: '#1E293B',
        fontWeight: '500',
    },
    faqSection: {
        marginTop: vS(20),
        paddingHorizontal: hS(20),
    },
    sectionTitle: {
        fontSize: mS(18),
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: vS(16),
    },
    cardContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: mS(12),
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    categoryActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: mS(12),
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    categoryIconBox: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(12),
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(14),
    },
    categoryContent: {
        flex: 1,
    },
    categoryTitle: {
        fontSize: mS(14),
        fontWeight: '700',
        color: '#1E293B',
    },
    categorySub: {
        fontSize: mS(12),
        color: '#64748B',
        marginTop: vS(2),
        fontWeight: '500',
    },
    noResultsBox: {
        padding: vS(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    noResultsText: {
        fontSize: mS(14),
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: vS(12),
        textAlign: 'center',
    },
    footerInfo: {
        marginTop: vS(24),
        alignItems: 'center',
    },
    footerText: {
        fontSize: mS(12),
        color: '#94A3B8',
        fontWeight: '500',
    },
    fab: {
        position: 'absolute',
        bottom: vS(30),
        right: hS(20),
        width: mS(56),
        height: mS(56),
        borderRadius: mS(28),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default HelpScreen;