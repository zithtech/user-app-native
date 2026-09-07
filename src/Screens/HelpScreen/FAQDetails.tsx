import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../../constant/colors';
import { useAppTheme } from '../../hooks/useAppTheme';
import { hS, mS, vS } from '../../lib/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAQDetails = ({ route }: any) => {
    const insets = useSafeAreaInsets();
    const { colors: appColors, isDark } = useAppTheme();
    const { title, questions } = route.params;
    // Track which question is expanded
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <View style={[styles.container, { backgroundColor: appColors.background }]}>
            {/* --- MODERN HEADER --- */}
            <View style={[styles.headerCard, { marginTop: vS(16), backgroundColor: isDark ? appColors.card : '#F0F6FF' }]}>
                <View style={styles.headerContentWrapper}>
                    <View style={styles.headerTextWrapper}>
                        <Text style={[styles.headerTitle, { color: isDark ? appColors.text : '#1E293B' }]}>{title}</Text>
                        <Text style={[styles.headerSubtitle, { color: isDark ? appColors.lightTextColor : '#64748B' }]}>Find answers to the most common questions</Text>
                    </View>
                    <Image source={require('../../assets/png/FAQImage.png')} style={styles.headerImage} />
                </View>
            </View>

            <FlatList
                data={questions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const isExpanded = expandedId === item.id;
                    return (
                        <View style={[
                            styles.faqCard,
                            { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }
                        ]}>
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.questionRow}
                                onPress={() => toggleExpand(item.id)}
                            >
                                <View style={styles.questionRowLeft}>
                                    <View style={[styles.leftIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF6FF' }]}>
                                        <MaterialCommunityIcons
                                            name={item.id === 'r1' ? 'map-search-outline' : (item.id === 'r2' ? 'map-marker-path' : (item.id.startsWith('d') ? 'account-tie' : 'credit-card-outline'))}
                                            size={mS(20)}
                                            color={isDark ? appColors.text : "#1E3A8A"}
                                        />
                                    </View>
                                    <Text style={[styles.questionText, { color: appColors.text }]}>
                                        {item.question}
                                    </Text>
                                </View>
                                <View style={[styles.rightIconCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF6FF' }]}>
                                    <MaterialCommunityIcons
                                        name={isExpanded ? "minus" : "plus"}
                                        size={mS(18)}
                                        color={isDark ? appColors.text : "#1E3A8A"}
                                    />
                                </View>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={styles.answerRow}>
                                    <View style={[styles.separator, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9' }]} />
                                    <Text style={[styles.answerText, { color: appColors.lightTextColor }]}>{item.answer}</Text>

                                    {item.id === 'r1' && (
                                        <TouchableOpacity
                                            style={[styles.actionBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F4F8FE' }]}
                                            activeOpacity={0.8}
                                        >
                                            <MaterialCommunityIcons name="map-outline" size={mS(18)} color="#3B82F6" />
                                            <Text style={styles.actionBoxText}>Go to the Trip screen to live track your ride.</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    headerCard: {
        marginHorizontal: hS(16),
        borderRadius: mS(16),
        overflow: 'hidden',
        marginBottom: vS(8),
    },
    headerContentWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(20),
        paddingVertical: vS(12),
        minHeight: vS(120),
    },
    headerTextWrapper: {
        flex: 1,
        zIndex: 1,
    },
    headerImage: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        top: 0,
        width: mS(200),
        height: '100%',
        resizeMode: 'cover',
    },
    headerTitle: {
        fontSize: mS(22),
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: mS(14),
        color: '#64748B',
        marginTop: vS(6),
        fontWeight: '500',
        paddingRight: hS(40),
    },
    listPadding: {
        padding: mS(16),
        paddingTop: vS(4),
    },
    faqCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: mS(16),
        marginBottom: vS(12),
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
        marginHorizontal: hS(2),
    },
    questionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: mS(16)
    },
    questionRowLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftIconCircle: {
        width: mS(36),
        height: mS(36),
        borderRadius: mS(18),
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(16),
    },
    questionText: {
        flex: 1,
        fontSize: mS(15),
        fontWeight: '700',
        color: '#1E293B',
        lineHeight: mS(22),
    },
    rightIconCircle: {
        width: mS(36),
        height: mS(36),
        borderRadius: mS(18),
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: hS(12),
    },
    answerRow: {
        paddingBottom: vS(16),
        paddingHorizontal: hS(16),
    },
    separator: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: vS(12),
    },
    answerText: {
        fontSize: mS(14),
        color: '#64748B',
        lineHeight: mS(22),
        fontWeight: '500',
    },
    actionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4F8FE',
        padding: mS(12),
        borderRadius: mS(10),
        marginTop: vS(12),
    },
    actionBoxText: {
        color: '#3B82F6',
        fontSize: mS(13),
        fontWeight: '500',
        marginLeft: hS(8),
    }
});

export default FAQDetails;