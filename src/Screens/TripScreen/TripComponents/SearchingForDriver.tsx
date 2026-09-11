import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Easing,
    TouchableOpacity,
    Dimensions,
    Platform,
    ToastAndroid,
    Alert,
    FlatList,
    Image,
    Modal,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { Text } from "../../../Components";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Services
import { useFindNearbyDriversMutation, useUpdateTripMutation } from '../../../service/userApi';
import { useCancelTripMutation } from '../../../service/tripApi';

// Socket & Types
import { useSocket } from '../../../Socket/SocketContext';
import { SOCKET_EVENTS } from '../../../Socket/socket.events';
import { TripStatus, CancelBy, CancelReason } from '../../../enums/trip.enum';

// Utils
import { hS, vS, mS } from '../../../lib/responsive';
import colors from '../../../constant/colors';
import { useAppTheme } from '../../../hooks/useAppTheme';

const { width } = Dimensions.get('window');

// ==================== TYPES ====================

export interface Driver {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    current_lat: number;
    current_lng: number;
    distance_meters: number;
    rating: number;
    phone_number?: string;
    driverProfilePic?: string;
}

interface SearchDriverProps {
    tripData?: any;
    navigation?: any;
    route?: any;
}

// ==================== MAIN COMPONENT ====================

const SearchingDriver: React.FC<SearchDriverProps> = ({
    tripData: propTripData,
    navigation,
    route,
}) => {
    const { colors: appColors, isDark } = useAppTheme();
    const tripData = propTripData || route?.params;
    const { socket, isConnected, onTripAccepted } = useSocket();
    const [findNearbyDrivers] = useFindNearbyDriversMutation();
    const [cancelTrip] = useCancelTripMutation();
    const [updateTrip] = useUpdateTripMutation();

    // ==================== STATE ====================
    const [drivers, setDrivers] = useState<Driver[]>([]);

    // Timeout feature states
    const [searchTimer, setSearchTimer] = useState(300); // 5 minutes search timer (5 stages * 1 min)
    const [popupTimer, setPopupTimer] = useState(300); // 5 minutes auto-cancel timer
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [selectedTip, setSelectedTip] = useState<number>(0);
    const [customTip, setCustomTip] = useState<string>('');
    const [isCancelling, setIsCancelling] = useState(false);

    // Prevent navigation while cancelling
    useEffect(() => {
        if (!navigation) return;
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (!isCancelling) {
                return;
            }
            e.preventDefault();
        });
        return unsubscribe;
    }, [navigation, isCancelling]);

    // ✅ Reset local state when trip_id changes
    useEffect(() => {
        if (tripData?.trip_id) {
            setDrivers([]);
        }
    }, [tripData?.trip_id]);

    // ==================== TIMERS ====================
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (!isPopupVisible && searchTimer > 0) {
            interval = setInterval(() => {
                setSearchTimer((prev) => {
                    if (prev <= 1) {
                        setIsPopupVisible(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (isPopupVisible && popupTimer > 0) {
            interval = setInterval(() => {
                setPopupTimer((prev) => {
                    if (prev <= 1) {
                        handleCancelBooking();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [searchTimer, popupTimer, isPopupVisible]);

    const handleCancelBooking = async () => {
        setIsPopupVisible(false);
        setIsCancelling(true);
        try {
            await cancelTrip({
                trip_id: tripData?.trip_id,
                trip_status: TripStatus.CANCELLED,
                cancel_by: CancelBy.USER,
                cancel_reason: CancelReason.WAIT_TIME_TOO_LONG,
                notes: 'Auto-cancelled or manually cancelled due to no driver found',
            }).unwrap();
            if (Platform.OS === 'android') {
                ToastAndroid.show('Booking Cancelled Successfully', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.error('Failed to cancel trip:', error);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleBookAgain = async () => {
        setIsPopupVisible(false);
        setSearchTimer(300);
        setPopupTimer(300);

        try {
            const tipAmount = customTip ? parseInt(customTip) : selectedTip;
            const currentAllowance = tripData?.driver_allowance || 0;
            const currentTotalFare = tripData?.total_fare || 0;

            const newAllowance = currentAllowance + tipAmount;
            const newTotalFare = currentTotalFare + tipAmount;

            let updatedTripData = { ...tripData };

            if (tipAmount > 0) {
                await updateTrip({
                    trip_id: tripData?.trip_id,
                    driver_allowance: newAllowance,
                    total_fare: newTotalFare
                }).unwrap();
                updatedTripData = { ...updatedTripData, driver_allowance: newAllowance, total_fare: newTotalFare };
            }
            // Grab the first element if it's an array
            const tripObj = Array.isArray(updatedTripData) ? updatedTripData[0] : updatedTripData;

            const payload = {
                lat: Number(tripObj.pickup_lat),
                lng: Number(tripObj.pickup_lng),
                newTrip: tripObj,
                radius: getStageAndRadius(300).radius,
            };


            // const payload = {
            //     lat: Number(updatedTripData.pickup_lat),
            //     lng: Number(updatedTripData.pickup_lng),
            //     newTrip: updatedTripData,
            //     radius: getStageAndRadius(300).radius,
            // };
            console.log(payload, "Search payload")

            try {
                await findNearbyDrivers(payload).unwrap();
            } catch (searchError: any) {
                const errMsg = searchError?.data?.message || searchError?.message || "";
                if (errMsg.includes("No drivers found")) {
                    console.log("No drivers found immediately; background stage search will continue.");
                } else {
                    throw searchError;
                }
            }

            if (Platform.OS === 'android' && tipAmount > 0) {
                ToastAndroid.show(`Search restarted with ₹${newAllowance} allowance`, ToastAndroid.SHORT);
            }
        } catch (error) {
            console.error('Failed to restart search:', error);
            Alert.alert('Error', 'Failed to restart search. Please try again.');
        }
    };

    const getStageAndRadius = (timer: number) => {
        if (timer > 240) return { stage: 1, radius: 1000 };
        if (timer > 180) return { stage: 2, radius: 3000 };
        if (timer > 120) return { stage: 3, radius: 5000 };
        if (timer > 60) return { stage: 4, radius: 7000 };
        return { stage: 5, radius: 10000 };
    };

    const currentStageInfo = getStageAndRadius(searchTimer);
    const [lastSearchedStage, setLastSearchedStage] = useState(0);

    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ).start();
    }, [pulseAnim]);

    const activeScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, 1],
    });

    const activeOpacity = pulseAnim.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [0.6, 0, 0],
    });

    // ==================== FETCH NEARBY DRIVERS ====================
    useEffect(() => {
        if (!tripData?.pickup_lat || !tripData?.pickup_lng) {
            return;
        }

        const fetchDriversForStage = async () => {
            try {
                const payload = {
                    lat: Number(tripData.pickup_lat),
                    lng: Number(tripData.pickup_lng),
                    newTrip: tripData,
                    radius: currentStageInfo.radius,
                };

                const response = await findNearbyDrivers(payload).unwrap();

                if (response.success && response.data?.drivers) {
                    setDrivers(response.data.drivers || []);
                }
            } catch (error) {
                // If no drivers found in this radius, we just wait for the next stage
                // console.log(`No drivers found in stage ${currentStageInfo.stage}`);
            }
        };

        // Only fetch if we haven't searched this stage yet
        if (currentStageInfo.stage !== lastSearchedStage) {
            setLastSearchedStage(currentStageInfo.stage);
            fetchDriversForStage();
        }
    }, [tripData?.pickup_lat, tripData?.pickup_lng, tripData?.driver_allowance, tripData?.total_fare, currentStageInfo.stage, lastSearchedStage]);

    // Reset lastSearchedStage when searchTimer resets
    useEffect(() => {
        if (searchTimer === 300) {
            setLastSearchedStage(0);
        }
    }, [searchTimer]);

    const STAGES = [
        { id: 1, label: 'Stage 1 — 1 km', time: '0:00 – 1:00 min', radius: 1000, distance: '1 km' },
        { id: 2, label: 'Stage 2 — 3 km', time: '1:00 – 2:00 min', radius: 3000, distance: '3 km' },
        { id: 3, label: 'Stage 3 — 5 km', time: '2:00 – 3:00 min', radius: 5000, distance: '5 km' },
        { id: 4, label: 'Stage 4 — 7 km', time: '3:00 – 4:00 min', radius: 7000, distance: '7 km' },
        { id: 5, label: 'Stage 5 — 10 km', time: '4:00 – 5:00 min', radius: 10000, distance: '10 km' },
    ];

    // ==================== SUB-COMPONENTS ====================

    /**
     * Searching header with status badge and progress bars
     */
    const renderSearchingHeader = () => (
        <>
            <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE' }]}>
                <Text style={[styles.statusBadgeText, { color: isDark ? '#60A5FA' : '#2563EB' }]}>
                    Connecting to drivers...
                </Text>
            </View>
            <View style={styles.header}>
                <Text style={[styles.title, { color: appColors.text }]}>Finding your Captain</Text>
                <Text style={[styles.subtitle, { color: appColors.secondaryText }]}>
                    Connecting you to the nearest T2Drive driver...
                </Text>
            </View>
            <View style={styles.progressBarsRow}>
                {[1, 2, 3, 4, 5].map((stg) => {
                    const isCompleted = stg <= currentStageInfo.stage;
                    return (
                        <View
                            key={stg}
                            style={[
                                styles.progressBarSegment,
                                { backgroundColor: isCompleted ? appColors.primary : (isDark ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB') }
                            ]}
                        />
                    );
                })}
            </View>
        </>
    );

    /**
     * Radius Tracking UI (Circles Only)
     */
    const renderRadiusTrackingUI = () => (
        <View style={styles.trackingContainer}>
            {/* Concentric Circles Visualization */}
            <View style={styles.circlesWrapper}>
                {[5, 4, 3, 2, 1].map((stg) => {
                    const isActive = stg === currentStageInfo.stage;
                    const isPassed = stg < currentStageInfo.stage;
                    const size = mS(40 + (stg * 40)); // Sizes: 80, 120, 160, 200, 240

                    return (
                        <View
                            key={stg}
                            style={[
                                styles.concentricCircle,
                                {
                                    width: size,
                                    height: size,
                                    borderRadius: size / 2,
                                    borderColor: isActive ? appColors.primary : (isPassed ? 'rgba(59, 130, 246, 0.4)' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB')),
                                    borderStyle: isActive ? 'solid' : 'dashed',
                                    borderWidth: isActive ? 2 : 1,
                                    backgroundColor: 'transparent',
                                }
                            ]}
                        >
                            {isActive && (
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        width: size,
                                        height: size,
                                        borderRadius: size / 2,
                                        backgroundColor: appColors.primary,
                                        opacity: activeOpacity,
                                        transform: [{ scale: activeScale }],
                                    }}
                                />
                            )}
                            {stg === 5 && (
                                <Text style={[styles.circleLabel, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)', color: appColors.secondaryText, top: -vS(8) }]}>10km</Text>
                            )}
                            {stg === 4 && (
                                <Text style={[styles.circleLabel, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)', color: appColors.secondaryText, top: -vS(8) }]}>7km</Text>
                            )}
                            {stg === 3 && (
                                <Text style={[styles.circleLabel, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)', color: appColors.secondaryText, top: -vS(8) }]}>5km</Text>
                            )}
                            {stg === 2 && (
                                <Text style={[styles.circleLabel, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)', color: appColors.secondaryText, top: -vS(8) }]}>3km</Text>
                            )}
                            {stg === 1 && (
                                <View style={[styles.centerPoint, { backgroundColor: appColors.primary }]}>
                                    <View style={styles.centerDot} />
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );

    /**
     * Nearby drivers list (optional UI)
     */
    const renderNearbyDriversList = () => (
        <View style={[styles.listSection, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5' }]}>
            <Text style={[styles.listTitle, { color: appColors.text }]}>Available Drivers</Text>
            <FlatList
                scrollEnabled={false}
                data={drivers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.driverCard, { backgroundColor: appColors.background, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6' }]}>
                        <View>
                            <Text style={[styles.driverCardName, { color: appColors.text }]}>
                                {item.full_name}
                            </Text>
                            <Text style={[styles.driverCardDetails, { color: appColors.secondaryText }]}>
                                ⭐ {item.rating} • {item.distance_meters}m
                                away
                            </Text>
                        </View>
                        <Text style={styles.carEmoji}>🚗</Text>
                    </View>
                )}
            />
        </View>
    );

    /**
     * Safety info footer
     */
    const renderSafetyFooter = () => (
        <View style={styles.footer}>
            <View style={styles.infoRow}>
                <MaterialCommunityIcons
                    name="shield-check"
                    size={hS(20)}
                    color="#29AE46"
                />
                <Text style={styles.infoText}>
                    Your safety is our priority
                </Text>
            </View>
        </View>
    );

    const renderTimeoutPopup = () => {
        const minutes = Math.floor(popupTimer / 60);
        const seconds = (popupTimer % 60).toString().padStart(2, '0');

        return (
            <Modal
                visible={isPopupVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => { }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: appColors.card }]}>
                        {/* Header Warning Icon & Title */}
                        <View style={styles.modalIconWrapper}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={mS(36)} color="#EF4444" />
                        </View>

                        <Text style={[styles.modalTitle, { color: appColors.text }]}>
                            No Driver Found Yet
                        </Text>

                        <Text style={[styles.modalSubtitle, { color: appColors.secondaryText }]}>
                            Would you like to customize your tip to find a driver quickly, or cancel the request?
                        </Text>

                        {/* Premium Timer Pill Badge */}
                        <View style={styles.timerBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={mS(14)} color="#EF4444" />
                            <Text style={styles.timerBadgeText}>
                                Auto-cancelling in {minutes}:{seconds}
                            </Text>
                        </View>

                        {/* Tips Section */}
                        <View style={styles.tipsHeaderRow}>
                            <MaterialCommunityIcons name="gift-outline" size={mS(16)} color={appColors.primary} />
                            <Text style={[styles.tipsTitle, { color: appColors.text }]}>
                                Add a driver incentive (Optional)
                            </Text>
                        </View>

                        <View style={styles.tipsContainer}>
                            {[10, 20, 50].map((tip) => {
                                const isSelected = selectedTip === tip && !customTip;
                                return (
                                    <TouchableOpacity
                                        key={tip}
                                        style={[
                                            styles.tipButton,
                                            { borderColor: isSelected ? appColors.primary : (isDark ? '#334155' : '#E2E8F0') },
                                            isSelected ? { backgroundColor: appColors.primary } : { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }
                                        ]}
                                        onPress={() => { setSelectedTip(tip); setCustomTip(''); }}
                                    >
                                        <Text style={[
                                            styles.tipButtonText,
                                            { color: isSelected ? '#FFFFFF' : appColors.text, fontWeight: isSelected ? '700' : '500' }
                                        ]}>
                                            + ₹{tip}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Custom Tip Input Wrapper */}
                        <View style={[styles.inputWrapper, { borderColor: isDark ? '#334155' : '#E2E8F0', backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                            <Text style={[styles.currencyPrefix, { color: appColors.secondaryText }]}>₹</Text>
                            <TextInput
                                style={[styles.customTipInput, { color: appColors.text }]}
                                placeholder="Enter custom tip amount..."
                                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                                keyboardType="numeric"
                                value={customTip}
                                onChangeText={(text) => {
                                    setCustomTip(text.replace(/[^0-9]/g, ''));
                                    setSelectedTip(0);
                                }}
                            />
                        </View>

                        {/* Actions */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                disabled={isCancelling}
                                onPress={handleCancelBooking}
                            >
                                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.bookAgainButton, { backgroundColor: appColors.primary }]}
                                onPress={handleBookAgain}
                            >
                                <MaterialCommunityIcons name="refresh" size={mS(16)} color="#FFF" style={{ marginRight: hS(4) }} />
                                <Text style={styles.bookAgainButtonText}>Retry Search</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // ==================== RENDER ====================

    return (
        <View style={styles.container}>
            {renderSearchingHeader()}
            {renderRadiusTrackingUI()}
            {renderSafetyFooter()}
            {renderTimeoutPopup()}

            {/* CANCELLING LOADER */}
            <Modal transparent visible={isCancelling} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: appColors.card, padding: hS(24), borderRadius: mS(16), alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={appColors.primary} />
                        <Text style={{ marginTop: vS(12), color: appColors.text, fontWeight: '600' }}>Cancelling Trip...</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: vS(20),
        paddingBottom: vS(20),
        paddingHorizontal: hS(20),
    },

    // Header
    statusBadge: {
        backgroundColor: '#DBEAFE',
        padding: mS(8),
        borderRadius: mS(8),
        alignSelf: 'flex-start',
        marginBottom: vS(10),
    },
    statusBadgeText: {
        color: '#2563EB',
        fontSize: mS(12),
        fontWeight: 'bold',
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: hS(20),
        marginBottom: vS(20),
    },
    title: {
        fontSize: mS(24),
        fontWeight: 'bold',
        color: '#152D5E',
        textAlign: 'center',
        marginBottom: vS(10),
    },
    subtitle: {
        fontSize: mS(14),
        color: '#687487',
    },
    progressBarsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: vS(20),
        gap: hS(6),
    },
    progressBarSegment: {
        flex: 1,
        height: vS(4),
        borderRadius: mS(2),
    },

    // Tracking UI Styles
    trackingContainer: {
        width: '100%',
        alignItems: 'center',
        marginVertical: vS(20),
        justifyContent: 'center',
    },
    circlesWrapper: {
        width: mS(240),
        height: mS(240),
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    concentricCircle: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerPoint: {
        width: mS(24),
        height: mS(24),
        borderRadius: mS(12),
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    centerDot: {
        width: mS(8),
        height: mS(8),
        borderRadius: mS(4),
        backgroundColor: '#FFF',
    },
    circleLabel: {
        position: 'absolute',
        fontSize: mS(10),
        fontWeight: 'bold',
        paddingHorizontal: hS(4),
        borderRadius: mS(4),
    },

    // Footer
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        fontSize: mS(14),
        color: '#687487',
        marginLeft: hS(8),
    },

    // Driver Assigned Content
    content: {
        width: '100%',
        gap: vS(15),
    },
    arrivalBadge: {
        backgroundColor: '#FEF3C7',
        padding: mS(8),
        borderRadius: mS(10),
        alignItems: 'center',
        marginBottom: vS(12),
    },
    arrivalBadgeText: {
        color: '#92400E',
        fontSize: mS(11),
        fontWeight: '800',
    },

    driverProfileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#F9FAFB',
        padding: mS(10),
        borderRadius: mS(20),
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    avatar: {
        width: mS(50),
        height: mS(50),
        borderRadius: mS(27),
        backgroundColor: '#E5E7EB',
    },
    driverInfo: {
        flex: 1,
        marginLeft: hS(10),
    },
    driverName: {
        fontSize: mS(16),
        fontWeight: 'bold',
        color: '#111827',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: vS(2),
    },
    ratingText: {
        color: '#4B5563',
        fontSize: mS(13),
        marginLeft: hS(4),
    },

    actionGroup: {
        flexDirection: 'row',
        gap: hS(10),
        marginVertical: vS(10),
    },
    actionBtn: {
        height: mS(45),
        borderRadius: mS(12),
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        gap: hS(8),
    },
    actionBtnText: {
        fontSize: mS(14),
        fontWeight: '600',
        color: '#111827',
    },

    startBtn: {
        width: '100%',
        height: vS(50),
        borderRadius: mS(12),
        backgroundColor: '#32a852',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: vS(10),
    },
    startBtnText: {
        color: '#FFF',
        fontSize: mS(16),
        fontWeight: 'bold',
    },

    // Drivers List
    listSection: {
        width: '100%',
        marginTop: vS(20),
    },
    listTitle: {
        fontSize: mS(16),
        fontWeight: 'bold',
        marginBottom: vS(10),
        color: '#111827',
    },
    driverCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: mS(15),
        marginBottom: vS(10),
        backgroundColor: '#f9f9f9',
        borderRadius: mS(10),
        alignItems: 'center',
    },
    driverCardName: {
        fontSize: mS(16),
        fontWeight: '600',
        color: '#111827',
    },
    driverCardDetails: {
        color: '#666',
        marginTop: vS(4),
        fontSize: mS(13),
    },
    carEmoji: {
        fontSize: mS(24),
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)', // Deep Slate Overlay
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 100,
    },
    modalContent: {
        width: '88%',
        borderRadius: mS(24), // Softer, highly premium rounded corners
        padding: mS(24),
        alignItems: 'center',
        elevation: 101, // Must be higher than Bottom Sheet elevation (25)
        zIndex: 1001,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    modalIconWrapper: {
        width: mS(60),
        height: mS(60),
        borderRadius: mS(30),
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Light warning red fill
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(14),
    },
    modalTitle: {
        fontSize: mS(20),
        fontWeight: '800',
        marginBottom: vS(8),
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: mS(14),
        lineHeight: vS(20),
        textAlign: 'center',
        marginBottom: vS(16),
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        paddingVertical: vS(6),
        paddingHorizontal: hS(12),
        borderRadius: mS(20),
        marginBottom: vS(24),
    },
    timerBadgeText: {
        color: '#EF4444',
        fontSize: mS(12),
        fontWeight: '700',
        marginLeft: hS(4),
    },
    tipsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginBottom: vS(10),
    },
    tipsTitle: {
        fontSize: mS(14),
        fontWeight: '700',
        marginLeft: hS(6),
        marginBottom: 0,
    },
    tipsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: vS(12),
    },
    tipButton: {
        flex: 1,
        borderWidth: 1.5,
        borderRadius: mS(12),
        paddingVertical: vS(10),
        marginHorizontal: hS(4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    tipButtonText: {
        fontSize: mS(14),
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: mS(12),
        width: '100%',
        paddingHorizontal: hS(12),
        marginBottom: vS(24),
    },
    currencyPrefix: {
        fontSize: mS(16),
        fontWeight: '700',
        marginRight: hS(4),
    },
    customTipInput: {
        flex: 1,
        paddingVertical: vS(10),
        fontSize: mS(14),
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: hS(12),
    },
    modalButton: {
        flex: 1,
        height: vS(48),
        borderRadius: mS(12),
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    cancelButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // Soft red border style
    },
    cancelButtonText: {
        color: '#EF4444',
        fontWeight: '700',
        fontSize: mS(14),
    },
    bookAgainButton: {
        // dynamic color based on theme.primary is passed in inline styles
    },
    bookAgainButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: mS(14),
    },
});

export default SearchingDriver;