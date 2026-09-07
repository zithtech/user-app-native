import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Modal,
    Pressable,
    Alert,
    Platform,
    ToastAndroid,
    TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import colors from '../../../../../constant/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SavedLocation } from '../../../../../service/utils/storage';
import { useUpdateUserMutation } from '../../../../../service/userApi';
import { updateUserStore } from '../../../../../redux/userSlice';
import { hS, vS, mS } from '../../../../../lib/responsive';
import { useAppTheme } from "../../../../../hooks/useAppTheme";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_LOCATIONS_KEY = '@recent_locations';

const Favourites = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const localuser = useSelector((state: RootState) => state?.userSlice?.user);
    const [savedPlaces, setSavedPlaces] = useState(localuser?.favourite_places || []);
    const [recentLocations, setRecentLocations] = useState<SavedLocation[]>([]);
    const dispatch = useDispatch();
    const [updateUser] = useUpdateUserMutation();
    const { colors: appColors, isDark } = useAppTheme();

    useEffect(() => {
        const fetchRecentLocations = async () => {
            try {
                const data = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
                if (data) {
                    setRecentLocations(JSON.parse(data));
                }
            } catch (error) {
                console.log('Failed to fetch recent locations', error);
            }
        };
        fetchRecentLocations();
    }, []);

    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [optionsVisible, setOptionsVisible] = useState(false);
    const [renameVisible, setRenameVisible] = useState(false);
    const [newName, setNewName] = useState('');

    const handleOpenOptions = (item: any) => {
        setSelectedItem(item);
        setOptionsVisible(true);
    };

    const handleCloseOptions = () => {
        setOptionsVisible(false);
        setSelectedItem(null);
    };

    const handleSync = async (updatedArray: SavedLocation[]) => {
        setSavedPlaces(updatedArray);
        try {
            const payload = {
                id: localuser.id,
                favourite_places: updatedArray
            };
            const response = await updateUser(payload).unwrap();
            if (response.success) {
                dispatch(updateUserStore({ favourite_places: response.data.favourite_places }));
                ToastAndroid.show("Favorites updated successfully", ToastAndroid.SHORT);
            }
        } catch (error) {
            setSavedPlaces(localuser?.favourite_places || []);
            Alert.alert('Limit Reached! Delete a Location to Add!');
        }
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;
        const updated = savedPlaces.filter((f: SavedLocation) => f.id !== selectedItem.id);
        handleCloseOptions();
        await handleSync(updated);
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Place",
            `Are you sure you want to remove "${selectedItem?.showname || selectedItem?.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: confirmDelete }
            ]
        );
    };

    const handleRename = () => {
        setNewName(selectedItem?.showname || selectedItem?.name || '');
        setOptionsVisible(false);
        setRenameVisible(true);
    };

    const confirmRename = async () => {
        if (!newName.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }
        const updated = savedPlaces.map((f: SavedLocation) =>
            f.id === selectedItem.id ? { ...f, showname: newName.trim() } : f
        );
        setRenameVisible(false);
        await handleSync(updated);
    };

    const getIconColor = (type: string, isDarkTheme: boolean) => {
        const lowerType = type?.toLowerCase();
        if (lowerType?.includes('home')) return { bg: isDarkTheme ? 'rgba(59, 130, 246, 0.15)' : '#E8F2FF', color: '#3B82F6' };
        if (lowerType?.includes('office') || lowerType?.includes('work')) return { bg: isDarkTheme ? 'rgba(168, 85, 247, 0.15)' : '#F4E8FF', color: '#A855F7' };
        if (lowerType?.includes('fitness') || lowerType?.includes('gym')) return { bg: isDarkTheme ? 'rgba(249, 115, 22, 0.15)' : '#FFEDD5', color: '#F97316' };
        if (lowerType?.includes('restaurant') || lowerType?.includes('food')) return { bg: isDarkTheme ? 'rgba(239, 68, 68, 0.15)' : '#FDE8E8', color: '#EF4444' };
        if (lowerType?.includes('airport')) return { bg: isDarkTheme ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5', color: '#10B981' };
        return { bg: isDarkTheme ? 'rgba(107, 114, 128, 0.15)' : '#F3F4F6', color: '#6B7280' };
    };

    const getIcon = (type: string) => {
        const lowerType = type?.toLowerCase();
        if (lowerType?.includes('home')) return 'home-outline';
        if (lowerType?.includes('office') || lowerType?.includes('work')) return 'briefcase-outline';
        if (lowerType?.includes('fitness') || lowerType?.includes('gym')) return 'dumbbell';
        if (lowerType?.includes('restaurant') || lowerType?.includes('food')) return 'silverware-fork-knife';
        if (lowerType?.includes('airport')) return 'airplane';
        return 'map-marker-outline';
    };

    const renderCustomHeader = () => (
        <View style={[styles.customHeader, { paddingTop: insets.top + vS(10) }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity style={[styles.headerIconBtn, { backgroundColor: isDark ? appColors.card : '#FFFFFF' }]} onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons name="arrow-left" size={mS(20)} color={isDark ? "#FFF" : "#111827"} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? "#FFF" : "#111827" }]}>Favourites</Text>
            </View>
            {/* <TouchableOpacity style={styles.headerIconBtn}>
                <MaterialCommunityIcons name="plus" size={mS(20)} color="#3B82F6" />
            </TouchableOpacity> */}
        </View>
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const iconTheme = getIconColor(item.showname || item.name, isDark);
        const isRecent = index < 2;

        return (
            <View style={[styles.card, { backgroundColor: isDark ? appColors.card : '#FFFFFF', borderColor: isDark ? appColors.border : '#E5E7EB' }]}>
                <View style={styles.cardLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: iconTheme.bg }]}>
                        <MaterialCommunityIcons
                            name={getIcon(item.showname || item.name)}
                            size={mS(20)}
                            color={iconTheme.color}
                        />
                    </View>
                    <View style={styles.textGroup}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.titleText, { color: isDark ? '#FFF' : '#111827' }]} numberOfLines={1}>{item?.showname || item?.name || 'Other'}</Text>
                            {isRecent && (
                                <View style={[styles.recentBadge, { backgroundColor: isDark ? appColors.primary + "15" : '#E8F2FF' }]}>
                                    <Text style={[styles.recentBadgeText, { color: isDark ? appColors.primary : '#3B82F6' }]}>Recent</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.addressText, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={1}>
                            {item.address || 'No address provided'}
                        </Text>

                        {/* <View style={styles.metaRow}>
                            <MaterialCommunityIcons name="map-marker-outline" size={mS(10)} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
                            <Text style={[styles.metaText, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>{item.distance ? `${Number(item.distance).toFixed(1)} km` : ''} </Text>
                            <Text style={[styles.metaDot, { color: isDark ? '#4B5563' : '#D1D5DB' }]}>•</Text>
                            <MaterialCommunityIcons name="clock-outline" size={mS(10)} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
                            <Text style={[styles.metaText, { color: isDark ? '#9CA3AF' : '#9CA3AF' }]}>{item.eta ? `${Number(item.eta).toFixed(1)} min` : ''}</Text>
                        </View> */}
                    </View>
                </View>
                <View style={styles.actionGroup}>
                    <TouchableOpacity style={[styles.actionCircleButton, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                        <MaterialCommunityIcons name="star-outline" size={mS(16)} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionCircleButton, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => handleOpenOptions(item)}
                    >
                        <MaterialCommunityIcons name="dots-vertical" size={mS(16)} color={isDark ? '#9CA3AF' : "#6B7280"} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderListFooter = () => (
        <View style={styles.footerSection}>
            <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeader, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>RECENT LOCATIONS</Text>
                {/* <TouchableOpacity onPress={() => {
                    
                 }}>
                    <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity> */}
            </View>

            <View style={styles.recentContainer}>
                {recentLocations.map((loc, index) => (
                    <TouchableOpacity
                        key={loc.id || index.toString()}
                        style={[
                            styles.recentCard,
                            { backgroundColor: isDark ? appColors.card : '#F3F4F6' },
                            index !== recentLocations.length - 1 && { marginBottom: vS(8) }
                        ]}
                    >
                        <MaterialCommunityIcons name="history" size={mS(18)} color={isDark ? "#9CA3AF" : "#6B7280"} style={styles.recentIcon} />
                        <View style={styles.recentTextGroup}>
                            <Text style={[styles.recentTitle, { color: isDark ? '#FFF' : '#111827' }]} numberOfLines={1}>{loc.showname || loc.name}</Text>
                            <Text style={[styles.recentSubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]} numberOfLines={1}>{loc.address}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
                {recentLocations.length === 0 && (
                    <Text style={{ color: isDark ? '#9CA3AF' : '#9CA3AF', fontSize: mS(13), fontStyle: 'italic', paddingHorizontal: hS(4) }}>No recent locations yet.</Text>
                )}
            </View>

            <View style={[styles.proTipCard, { backgroundColor: isDark ? '#082f49' : '#EFF6FF' }]}>
                <View style={styles.proTipIconContainer}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={mS(20)} color={isDark ? "#38bdf8" : "#3B82F6"} />
                </View>
                <View style={styles.proTipTextGroup}>
                    <Text style={[styles.proTipTitle, { color: isDark ? '#FFF' : '#1E3A8A' }]}>Pro Tip</Text>
                    <Text style={[styles.proTipDesc, { color: isDark ? '#bae6fd' : '#64748B' }]}>
                        Save your frequent destinations as favourites for faster bookings.
                    </Text>
                </View>
            </View>
        </View>
    );

    const EmptyList = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: appColors.iconBox }]}>
                <MaterialCommunityIcons name="map-marker-star-outline" size={mS(60)} color={appColors.secondaryText} />
            </View>
            <Text style={[styles.emptyText, { color: appColors.text }]}>No Saved Places</Text>
            <Text style={[styles.emptySubText, { color: appColors.secondaryText }]}>Save your favorite destinations for a faster booking experience.</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? appColors.background : '#F8FAFC' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#0F172A' : '#F8FAFC'} />

            {renderCustomHeader()}

            <View style={styles.content}>
                <FlatList
                    data={savedPlaces}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={() => (
                        <View style={styles.listHeaderWrapper}>
                            <Text style={[styles.sectionHeaderMain, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>SAVED PLACES</Text>
                        </View>
                    )}
                    ListFooterComponent={renderListFooter}
                    ListEmptyComponent={EmptyList}
                />
            </View>

            {/* Options Bottom Sheet Modal */}
            <Modal statusBarTranslucent navigationBarTranslucent visible={optionsVisible} transparent={true} animationType="slide">
                <Pressable style={styles.modalOverlay} onPress={handleCloseOptions}>
                    <View style={[styles.optionsCard, { backgroundColor: appColors.card }]}>
                        <View style={[styles.indicator, { backgroundColor: appColors.border }]} />
                        <View style={styles.modalHeader}>
                            <Text style={[styles.optionsHeader, { color: appColors.secondaryText }]}>Location Options</Text>
                            <Text style={[styles.selectedItemName, { color: appColors.text }]} numberOfLines={1}>{selectedItem?.showname || selectedItem?.name}</Text>
                        </View>

                        <TouchableOpacity style={styles.optionRow} onPress={handleRename}>
                            <View style={[styles.optionIconContainer, { backgroundColor: isDark ? 'rgba(0, 122, 255, 0.15)' : '#F0F7FF' }]}>
                                <MaterialCommunityIcons name="pencil-outline" size={mS(20)} color={isDark ? '#60A5FA' : '#007AFF'} />
                            </View>
                            <Text style={[styles.optionText, { color: appColors.text }]}>Rename Location</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionRow} onPress={handleDelete}>
                            <View style={[styles.optionIconContainer, { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : '#FFF0F0' }]}>
                                <MaterialCommunityIcons name="trash-can-outline" size={mS(20)} color="#FF3B30" />
                            </View>
                            <Text style={[styles.optionText, { color: '#FF3B30' }]}>Remove from Favorites</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.cancelActionBtn, { backgroundColor: appColors.iconBox }]} onPress={handleCloseOptions}>
                            <Text style={[styles.cancelActionText, { color: appColors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* Rename Modal */}
            <Modal statusBarTranslucent navigationBarTranslucent visible={renameVisible} transparent={true} animationType="fade">
                <View style={[styles.renameOverlay, isDark && { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
                    <View style={[styles.renameCard, { backgroundColor: appColors.card }]}>
                        <Text style={[styles.renameTitle, { color: appColors.text }]}>Rename Favorite</Text>
                        <Text style={[styles.renameSubtitle, { color: appColors.secondaryText }]}>Give your location a recognizable name</Text>

                        <View style={[styles.inputWrapper, { backgroundColor: appColors.background, borderColor: appColors.border }]}>
                            <TextInput
                                style={[styles.textInput, { color: appColors.text }]}
                                value={newName}
                                onChangeText={setNewName}
                                placeholder="e.g., My Favorite Cafe"
                                autoFocus={true}
                                placeholderTextColor={appColors.secondaryText}
                            />
                            {newName.length > 0 && (
                                <TouchableOpacity onPress={() => setNewName('')}>
                                    <MaterialCommunityIcons name="close-circle" size={mS(18)} color="#CCC" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.buttonGroup}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: appColors.card, borderColor: appColors.border }]} onPress={() => setRenameVisible(false)}>
                                <Text style={[styles.cancelBtnText, { color: appColors.text }]}>Discard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn, !newName.trim() && { opacity: 0.6 }]}
                                onPress={confirmRename}
                                disabled={!newName.trim()}
                            >
                                <Text style={styles.saveBtnText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: hS(16),
        paddingBottom: vS(12),
        backgroundColor: 'transparent',
    },
    headerIconBtn: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(20),
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    headerTitle: {
        fontSize: mS(18),
        fontWeight: '700',
        marginLeft: hS(14),
    },
    content: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: hS(16),
        paddingBottom: vS(30),
        flexGrow: 1,
    },
    listHeaderWrapper: {
        paddingTop: vS(4),
        paddingBottom: vS(10),
    },
    sectionHeaderMain: {
        fontSize: mS(11),
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.8,
        marginLeft: hS(4),
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: mS(12),
        borderRadius: mS(20),
        marginBottom: vS(10),
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 3,
        elevation: 1,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: mS(44),
        height: mS(44),
        borderRadius: mS(14),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(12),
    },
    textGroup: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vS(2),
    },
    titleText: {
        fontSize: mS(14),
        fontWeight: '700',
        flexShrink: 1,
    },
    recentBadge: {
        backgroundColor: '#E8F2FF',
        paddingHorizontal: hS(6),
        paddingVertical: vS(2),
        borderRadius: mS(6),
        marginLeft: hS(6),
    },
    recentBadgeText: {
        fontSize: mS(9),
        fontWeight: '700',
        color: '#3B82F6',
    },
    addressText: {
        fontSize: mS(11.5),
        marginBottom: vS(4),
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: mS(11),
        color: '#9CA3AF',
        marginLeft: hS(3),
        fontWeight: '500',
    },
    metaDot: {
        fontSize: mS(11),
        color: '#D1D5DB',
        marginHorizontal: hS(6),
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: hS(8),
    },
    actionCircleButton: {
        width: mS(32),
        height: mS(32),
        borderRadius: mS(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: hS(6),
    },
    footerSection: {
        marginTop: vS(12),
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vS(12),
        paddingHorizontal: hS(4),
    },
    sectionHeader: {
        fontSize: mS(11),
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.8,
    },
    viewAllText: {
        fontSize: mS(13),
        fontWeight: '600',
        color: '#3B82F6',
    },
    recentContainer: {
        marginBottom: vS(8),
    },
    recentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: mS(14),
        borderRadius: mS(16),
    },
    recentIcon: {
        marginRight: hS(14),
    },
    recentTextGroup: {
        flex: 1,
    },
    recentTitle: {
        fontSize: mS(13.5),
        fontWeight: '600',
        marginBottom: vS(1),
    },
    recentSubtitle: {
        fontSize: mS(11.5),
    },
    proTipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: mS(16),
        borderRadius: mS(20),
        marginTop: vS(8),
        marginBottom: vS(20),
    },
    proTipIconContainer: {
        marginRight: hS(12),
        marginTop: vS(2),
    },
    proTipTextGroup: {
        flex: 1,
    },
    proTipTitle: {
        fontSize: mS(14),
        fontWeight: '700',
        marginBottom: vS(2),
    },
    proTipDesc: {
        fontSize: mS(11.5),
        lineHeight: mS(16),
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: vS(80),
    },
    emptyIconWrapper: {
        width: mS(120),
        height: mS(120),
        borderRadius: mS(60),
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(24),
    },
    emptyText: {
        fontSize: mS(20),
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: vS(8),
    },
    emptySubText: {
        fontSize: mS(15),
        color: '#666666',
        textAlign: 'center',
        paddingHorizontal: hS(40),
        lineHeight: mS(22),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    optionsCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: mS(32),
        borderTopRightRadius: mS(32),
        paddingHorizontal: hS(24),
        paddingBottom: Platform.OS === 'ios' ? vS(40) : vS(24),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    indicator: {
        width: hS(36),
        height: vS(4),
        backgroundColor: '#E5E5E5',
        borderRadius: mS(2),
        alignSelf: 'center',
        marginTop: vS(12),
        marginBottom: vS(24),
    },
    modalHeader: {
        marginBottom: vS(20),
    },
    optionsHeader: {
        fontSize: mS(14),
        fontWeight: '600',
        color: '#999999',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    selectedItemName: {
        fontSize: mS(20),
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: vS(4),
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vS(16),
    },
    optionIconContainer: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(16),
    },
    optionText: {
        fontSize: mS(16),
        fontWeight: '600',
        color: '#333333',
    },
    cancelActionBtn: {
        marginTop: vS(8),
        paddingVertical: vS(16),
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: mS(16),
    },
    cancelActionText: {
        fontSize: mS(16),
        fontWeight: '700',
        color: '#666666',
    },
    renameOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: hS(24),
    },
    renameCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: mS(28),
        padding: mS(24),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 10,
    },
    renameTitle: {
        fontSize: mS(22),
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: vS(8),
    },
    renameSubtitle: {
        fontSize: mS(14),
        color: '#666666',
        marginBottom: vS(24),
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: mS(16),
        paddingHorizontal: hS(16),
        borderWidth: 1,
        borderColor: '#E9ECEF',
        marginBottom: vS(24),
    },
    textInput: {
        flex: 1,
        height: vS(56),
        fontSize: mS(16),
        color: '#1A1A1A',
        fontWeight: '600',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: hS(12),
    },
    modalBtn: {
        flex: 1,
        height: vS(56),
        borderRadius: mS(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    saveBtn: {
        backgroundColor: colors.button,
    },
    cancelBtnText: {
        fontSize: mS(16),
        fontWeight: '700',
        color: '#666666',
    },
    saveBtnText: {
        fontSize: mS(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default Favourites;