import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    View, Text, SectionList, TextInput, StyleSheet,
    TouchableOpacity, ActivityIndicator, PermissionsAndroid, Platform,
    Image, Alert, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Contacts from 'react-native-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hS, mS, vS } from '../../lib/responsive';
import AntDesign from 'react-native-vector-icons/AntDesign'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAppTheme } from '../../hooks/useAppTheme';
import { ResponsiveContainer } from '../../Components/ResponsiveContainer';

const RECENT_CONTACTS_KEY = '@recent_contacts';
const FAVORITE_CONTACTS_KEY = '@favorite_contacts';

const { width, height } = Dimensions.get('window');

const ContactListScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    const [contacts, setContacts] = useState<any[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [recentNumbers, setRecentNumbers] = useState<string[]>([]);
    const [favoriteNumbers, setFavoriteNumbers] = useState<string[]>([]);

    const { onSelectContact } = route.params || {};

    const sectionListRef = useRef<SectionList>(null);

    useEffect(() => {
        loadStorageAndContacts();
    }, []);

    const loadStorageAndContacts = async () => {
        try {
            // 1. Load async storage first
            const [recentsJson, favsJson] = await Promise.all([
                AsyncStorage.getItem(RECENT_CONTACTS_KEY),
                AsyncStorage.getItem(FAVORITE_CONTACTS_KEY)
            ]);

            if (recentsJson) {
                const recentsParsed = JSON.parse(recentsJson);
                // LocationSelection/index.tsx stores objects {name, phone}, we just need phones for fast lookup
                const rPhones = recentsParsed.map((r: any) => r.phone?.replace(/\D/g, '').slice(-10)).filter(Boolean);
                setRecentNumbers(rPhones);
            }
            if (favsJson) {
                setFavoriteNumbers(JSON.parse(favsJson));
            }

            // 2. Load contacts
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_CONTACTS
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    setLoading(false);
                    return;
                }
            }

            const allContacts = await Contacts.getAll();
            const sorted = allContacts.sort((a, b) =>
                (a.displayName || "").localeCompare(b.displayName || "")
            );
            setContacts(sorted);
            setFilteredContacts(sorted);
        } catch (err) {
            Alert.alert('Something Went Wrong!!!', 'Try Again Later');
        } finally {
            setLoading(false);
        }
    };

    const formatDataForSections = (data: any[]) => {
        const sectionsMap: { [key: string]: any[] } = {};

        data.forEach(item => {
            const char = item.displayName ? item.displayName[0].toUpperCase() : '#';
            const key = /[A-Z]/.test(char) ? char : '#';
            if (!sectionsMap[key]) sectionsMap[key] = [];
            sectionsMap[key].push(item);
        });

        return Object.keys(sectionsMap)
            .sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
            .map(key => ({
                title: key,
                data: sectionsMap[key],
            }));
    };

    const sections = useMemo(() => {
        // Filter contacts based on active tab
        let displayList = filteredContacts;
        if (activeTab === 'Recent') {
            displayList = filteredContacts.filter(c => {
                const phone = c.phoneNumbers[0]?.number?.replace(/\D/g, '').slice(-10);
                return phone && recentNumbers.includes(phone);
            });
        } else if (activeTab === 'Favorites') {
            displayList = filteredContacts.filter(c => {
                const phone = c.phoneNumbers[0]?.number?.replace(/\D/g, '').slice(-10);
                return phone && favoriteNumbers.includes(phone);
            });
        }
        return formatDataForSections(displayList);
    }, [filteredContacts, activeTab, recentNumbers, favoriteNumbers]);

    const alphabetIndex = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");

    const handleSearch = (text: string) => {
        setSearch(text);
        const filtered = contacts.filter(c =>
            c.displayName?.toLowerCase().includes(text.toLowerCase()) ||
            c.phoneNumbers.some((p: any) => p.number.replace(/\D/g, '').includes(text))
        );
        setFilteredContacts(filtered);
    };

    const openCreateContactForm = () => {
        const newPerson = {
            givenName: "",
            phoneNumbers: [{ label: "mobile", number: "" }],
        };
        Contacts.openContactForm(newPerson).then((contact) => {
            if (contact) loadStorageAndContacts();
        }).catch(() => { });
    };

    const toggleFavorite = async (rawPhone: string) => {
        if (!rawPhone) return;
        const phone = rawPhone.replace(/\D/g, '').slice(-10);
        if (!phone) return;

        setFavoriteNumbers(prev => {
            let newFavs;
            if (prev.includes(phone)) {
                newFavs = prev.filter(p => p !== phone);
            } else {
                newFavs = [...prev, phone];
            }
            AsyncStorage.setItem(FAVORITE_CONTACTS_KEY, JSON.stringify(newFavs)).catch(console.error);
            return newFavs;
        });
    };

    const scrollToSection = (letter: string) => {
        const index = sections.findIndex(sec => sec.title === letter);
        if (sectionListRef.current && index !== -1) {
            sectionListRef.current.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                animated: true,
            });
        }
    };

    const renderItem = ({ item, index, section }: any) => {
        const rawPhone = item.phoneNumbers[0]?.number || "";
        const phone = item.phoneNumbers[0]?.number || "No number";
        const initials = item.displayName ? item.displayName[0] : "?";

        const isFirst = index === 0;
        const isLast = index === section.data.length - 1;

        const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);
        const isFavorite = cleanPhone && favoriteNumbers.includes(cleanPhone);

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                style={[
                    styles.contactCard,
                    {
                        backgroundColor: isDark ? colors.card : '#FFFFFF',
                        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                        borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                        borderTopLeftRadius: isFirst ? mS(16) : 0,
                        borderTopRightRadius: isFirst ? mS(16) : 0,
                        borderBottomLeftRadius: isLast ? mS(16) : 0,
                        borderBottomRightRadius: isLast ? mS(16) : 0,
                    }
                ]}
                onPress={() => {
                    // Navigate back first to avoid UI lag, the parent 'onSelectContact' will save it to recents
                    navigation.goBack();
                    if (onSelectContact) onSelectContact({ name: item.displayName, phone: phone });
                }}
            >
                <View style={[styles.avatar, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EBF4FF' }]}>
                    {item.thumbnailPath ? (
                        <Image source={{ uri: item.thumbnailPath }} style={styles.avatarImage} />
                    ) : (
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.avatarText, { color: isDark ? colors.primary : '#1E3A8A' }]}>
                            {initials.toUpperCase()}
                        </Text>
                    )}
                </View>

                <View style={styles.contactInfo}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {item.displayName}
                    </Text>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.phone, { color: colors.secondaryText }]}>
                        {rawPhone}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.starContainer}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => toggleFavorite(rawPhone)}
                >
                    {isFavorite ? (
                        <MaterialCommunityIcons name="star" size={22} color="#F59E0B" />
                    ) : (
                        <MaterialCommunityIcons name="star-outline" size={22} color={isDark ? '#475569' : '#94A3B8'} />
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    if (loading) return (
        <View style={[styles.center, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
            <ActivityIndicator color={colors.primary} size="large" />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
            <ResponsiveContainer>
            {/* Header Area */}
            <View style={[styles.navHeader, { paddingTop: insets.top, backgroundColor: isDark ? colors.background : '#F9FAFB' }]}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={colors.text} />
                </TouchableOpacity>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.navTitle, { color: colors.text }]}>Select Contact</Text>

                <TouchableOpacity onPress={openCreateContactForm} style={styles.rightHeaderButton}>
                    <AntDesign name="user" size={mS(20)} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchSection, { backgroundColor: isDark ? colors.card : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', borderWidth: 1 }]}>
                <AntDesign name="search1" size={20} color={isDark ? '#94A3B8' : '#64748B'} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchBar, { color: colors.text }]}
                    placeholder="Search contacts..."
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    value={search}
                    onChangeText={handleSearch}
                />
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
                {['All', 'Recent', 'Favorites'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        activeOpacity={0.7}
                        onPress={() => setActiveTab(tab)}
                        style={[
                            styles.filterPill,
                            {
                                backgroundColor: activeTab === tab
                                    ? (isDark ? colors.primary : '#1E3A8A')
                                    : (isDark ? colors.card : '#F1F5F9')
                            }
                        ]}
                    >
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[
                            styles.filterText,
                            {
                                color: activeTab === tab
                                    ? '#FFFFFF'
                                    : (isDark ? '#94A3B8' : '#1E293B')
                            }
                        ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.listWrapper}>
                <SectionList
                    ref={sectionListRef}
                    sections={sections}
                    keyExtractor={(item) => item.recordID || item.rawContactId}
                    renderItem={renderItem}
                    stickySectionHeadersEnabled={false}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.alphabetHeader}>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.alphabetText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>{title}</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />

                {/* A-Z Index Sidebar */}
                <View style={styles.alphabetSidebar}>
                    {alphabetIndex.map((letter) => (
                        <TouchableOpacity
                            key={letter}
                            onPress={() => scrollToSection(letter)}
                            style={styles.sidebarLetterContainer}
                        >
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sidebarLetter, { color: isDark ? colors.primary : '#2563EB' }]}>
                                {letter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            </ResponsiveContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(16),
        paddingVertical: vS(12),
        justifyContent: 'space-between',
    },
    backButton: {
        padding: mS(8),
    },
    navTitle: {
        fontSize: mS(18),
        fontWeight: '700',
    },
    rightHeaderButton: {
        padding: mS(8),
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: hS(20),
        marginTop: vS(10),
        marginBottom: vS(16),
        borderRadius: mS(24),
    },
    searchIcon: {
        paddingLeft: hS(16),
    },
    searchBar: {
        flex: 1,
        paddingRight: hS(16),
        paddingLeft: hS(10),
        paddingVertical: vS(14),
        fontSize: mS(15),
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: hS(20),
        marginBottom: vS(16),
        gap: hS(10),
    },
    filterPill: {
        paddingVertical: vS(8),
        paddingHorizontal: hS(16),
        borderRadius: mS(20),
    },
    filterText: {
        fontSize: mS(14),
        fontWeight: '600',
    },
    listWrapper: {
        flex: 1,
        flexDirection: 'row',
    },
    listContent: {
        paddingHorizontal: hS(20),
        paddingBottom: vS(40),
    },
    alphabetHeader: {
        paddingVertical: vS(12),
        paddingLeft: hS(4),
    },
    alphabetText: {
        fontSize: mS(14),
        fontWeight: '700',
    },
    contactCard: {
        flexDirection: 'row',
        padding: hS(14),
        alignItems: 'center',
    },
    avatar: {
        width: hS(48),
        height: hS(48),
        borderRadius: hS(24),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(16),
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: hS(24),
    },
    avatarText: {
        fontSize: mS(20),
        fontWeight: '600',
    },
    contactInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: mS(16),
        fontWeight: '600',
        marginBottom: vS(2),
    },
    phone: {
        fontSize: mS(13),
    },
    starContainer: {
        padding: hS(8),
    },
    alphabetSidebar: {
        width: hS(30),
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: hS(10),
    },
    sidebarLetterContainer: {
        paddingVertical: vS(1),
    },
    sidebarLetter: {
        fontSize: mS(10),
        fontWeight: '700',
    }
});

export default ContactListScreen;