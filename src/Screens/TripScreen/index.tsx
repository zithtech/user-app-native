import messaging from '@react-native-firebase/messaging';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Animated,
    PanResponder,
    Dimensions,
    Modal,
    Platform,
    ToastAndroid,
    Alert,
    TextInput,
    BackHandler
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';

// Components
import MapLocationPolyline from './TripComponents/MapLocationPolyline';
import SearchingDriver from './TripComponents/SearchingForDriver';
import OnRideView from './TripComponents/OnRideviewScreen';
import RatingView from './TripComponents/RatingviewScreen';
import TrackingView from './TripComponents/TrackingScreen';
import RoundTripWaitingView from './TripComponents/RoundTripWaitingView';
import DayHaltWaitingView from './TripComponents/DayHaltWaitingView';
import ReturnStartedView from './TripComponents/ReturnStartedView';
import RideClosurePreview from './TripComponents/RideClosurePreview';
import SafetyToolkitModal from './TripComponents/SafetyToolkitModal';
import { UserAppUI, TripPhase } from '../MapTrackingScreen/UserMapScreen';
import { ScheduledWaitingView } from './TripComponents/ScheduledTripRideUpdates/ScheduledTripWaitingScreen';
import VerificationPendingView from './TripComponents/VerificationPendingView';
import { RideCompletedScreen_Nav, TabNavigation_Nav } from '../../Navigations/navigations';

// Types & Enums
import { Trip, TripChangesPayload } from '../../types/trip';
import { CancelBy, CancelReason, ChangeBy, ChangeType, TripStatus } from '../../enums/trip.enum';
import { TripStatusSocket, SOCKET_EVENTS } from '../../Socket/socket.events';
import { updateTripInArray } from '../../redux/tripSlice';

// API & Services
import {
    useGetByTripIdQuery,
    useUpdateTripMutation,
    useUpdateTripChangesMutation,
} from '../../service/userApi';
import { useCancelTripMutation } from '../../service/tripApi';
import AudioService from '../../service/AudioService';

// Socket & Storage
import { useSocket } from '../../Socket/SocketContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Utilities
import { hS, vS, mS } from '../../lib/responsive';
import colors from '../../constant/colors';
import Skeleton from '../../Components/Skeleton';
import Config from 'react-native-config';

const getProxiedImageUrl = (url: string | undefined | null) => {
    if (!url) return null;
    if (url.startsWith('http')) {
        const BASE_URL = `${Config.DEV_BACKEND_URL}/api`;
        return `${BASE_URL}/media/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
};


const TripScreenSkeleton = () => {
    const { colors: appColors, isDark } = useAppTheme();
    const insets = useSafeAreaInsets();
    return (
        <View style={{ flex: 1, backgroundColor: appColors.background }}>
            {/* Map Area Skeleton */}
            <View style={{ flex: 1, backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }}>
                <Skeleton width="100%" height="100%" borderRadius={0} />
            </View>

            {/* Bottom Sheet Skeleton */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                backgroundColor: appColors.card,
                borderTopLeftRadius: mS(30),
                borderTopRightRadius: mS(30),
                paddingHorizontal: hS(20),
                paddingTop: vS(15),
                paddingBottom: insets.bottom + vS(20),
                elevation: 25,
            }}>
                <View style={{
                    width: hS(40),
                    height: vS(5),
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB',
                    borderRadius: mS(10),
                    alignSelf: 'center',
                    marginBottom: vS(15),
                }} />

                <Skeleton width={120} height={24} borderRadius={8} style={{ marginBottom: 20 }} />
                <Skeleton width="90%" height={16} style={{ marginBottom: 10 }} />
                <Skeleton width="70%" height={16} style={{ marginBottom: 30 }} />

                <Skeleton width="100%" height={50} borderRadius={12} />
            </View>
        </View>
    );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_TOP = 0;
const SNAP_BOTTOM = 220;
const DRAG_THRESHOLD = 80;

const PRE_TRIP_REASONS = [
    { label: "Driver is too far away", value: CancelReason.DRIVER_TOO_FAR },
    { label: "Wait time is too long", value: CancelReason.WAIT_TIME_TOO_LONG },
    { label: "Mistake in pickup/drop address", value: CancelReason.MISTAKE_IN_ADDRESS },
    { label: "Found another ride", value: CancelReason.FOUND_ANOTHER_RIDE },
    { label: "Changed my mind", value: CancelReason.CHANGED_MY_MIND },
];

const MID_TRIP_REASONS = [
    { label: "Changed my mind", value: CancelReason.CHANGED_MY_MIND },
    { label: "Unsafe driving", value: CancelReason.UNSAFE_DRIVING },
    { label: "Driver behavior", value: CancelReason.DRIVER_BEHAVIOR },
    { label: "Vehicle condition", value: CancelReason.VEHICLE_CONDITION },
    { label: "Wrong route", value: CancelReason.WRONG_ROUTE },
    { label: "Feeling unwell", value: CancelReason.FEELING_UNWELL },
    { label: "Change plans", value: CancelReason.CHANGE_PLANS },
    { label: "Taking too long", value: CancelReason.TAKING_TOO_LONG },
    { label: "Vehicle mismatch", value: CancelReason.VEHICLE_MISMATCH },
    { label: "Fare concern", value: CancelReason.FARE_CONCERN },
    { label: "Found alternative", value: CancelReason.FOUND_ALTERNATIVE },
    { label: "Other", value: CancelReason.OTHER },
];

interface TripScreenProps {
    navigation: any;
}

const TripScreen: React.FC<TripScreenProps> = ({ navigation }) => {
    const { colors: appColors, isDark } = useAppTheme();
    const dispatch = useDispatch();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const tripfromroute = route.params;

    // ==================== STATE ====================
    const [assignedDriver, setAssignedDriver] = useState<any>(null);
    const [driverLocation, setDriverLocation] = useState<any>(null);
    const [eta, setEta] = useState<number>(2);
    const [tripPhase, setTripPhase] = useState<TripPhase>('TO_PICKUP');
    const [hasManuallyTransitioned, setHasManuallyTransitioned] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<TripStatus>(
        tripfromroute?.trip_status || TripStatus.REQUESTED
    );
    const [showReasons, setShowReasons] = useState(false);
    const [showTripOptions, setShowTripOptions] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [driverLocationHistory, setDriverLocationHistory] = useState<any[]>([]);
    const [selectedReason, setSelectedReason] = useState<{ value: CancelReason | null, label: string }>({ value: null, label: '' });
    const [otherReason, setOtherReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const localUser = useSelector((state: RootState) => state?.userSlice?.user);
    const emergencyContacts = localUser?.emergency_contacts || [];
    const [isRated, setIsRated] = useState(tripfromroute?.isRated || false);
    console.log("tripfromroute", tripfromroute);

    // Prevent navigation while cancelling
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (!isCancelling) {
                return;
            }
            e.preventDefault();
        });
        return unsubscribe;
    }, [navigation, isCancelling]);
    // ==================== SOCKET SETUP ====================
    const {
        socket,
        isConnected,
        joinTripRoom,
        joinUserRoom,
        leaveTripRoom,
        onTripAccepted,
        onTripArriving,
        onTripLive,
        onDestinationReached,
        onTripCompleted,
        onTripCancelled,
        onTripMidCancelled,
        onTripStatusChanged,
        onDriverLocationUpdated,
        emit,
    } = useSocket();

    // ==================== API QUERIES & MUTATIONS ====================
    const { data: tripdata, refetch, isLoading } = useGetByTripIdQuery(
        tripfromroute?.trip_id,
        {
            skip: !tripfromroute?.trip_id,
            refetchOnMountOrArgChange: true,
        }
    );

    const [updateTrip] = useUpdateTripMutation();
    const [cancelTrip] = useCancelTripMutation();
    const [updateTripChanges] = useUpdateTripChangesMutation();

    // ✅ Reset state when trip_id changes to prevent pollution between multi-trips
    useEffect(() => {
        if (tripfromroute?.trip_id) {
            setAssignedDriver(null);
            setDriverLocation(null);
            setDriverLocationHistory([]);
            setEta(2);
            setHasManuallyTransitioned(false);
            setCurrentStatus(tripfromroute.trip_status || TripStatus.REQUESTED);
        }
    }, [tripfromroute?.trip_id]);

    useEffect(() => {
        if (currentStatus === TripStatus.CANCELLED || currentStatus === TripStatus.MID_CANCELLED) {
            console.log('🛑 [TripScreen] Cancellation state detected. Calling AudioService.speak().');
            AudioService.speak("Your trip has been cancelled.");

            const timer = setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: TabNavigation_Nav }],
                });
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [currentStatus]);

    // ==================== DERIVED STATE ====================
    const currentTrip = tripdata?.success ? tripdata.data : tripfromroute;
    // ✅ Reload Protection: If already rated (checked via API data) or already paid, jump straight to summary
    // Safe to do inside useEffect to avoid "Cannot update during render" error
    useEffect(() => {
        if (currentStatus === TripStatus.COMPLETED && (currentTrip?.rating || currentTrip?.payment_status === 'PAID')) {
            navigation.navigate(RideCompletedScreen_Nav, { ...currentTrip, isRated: true });
        }
    }, [currentStatus, currentTrip?.rating, currentTrip?.payment_status]);

    // Prioritize local assignedDriver, then API driver data
    // Prioritize driver_details (new format), then fall back to driver (old format)
    const driverSrc = currentTrip?.driver_details || currentTrip?.driver;
    const apiDriver = driverSrc ? {
        driverId: driverSrc.id || driverSrc.driverId || driverSrc.driver_id,
        driverName: driverSrc.full_name || driverSrc.driverName || driverSrc.name,
        driverPhone: driverSrc.phone_number || driverSrc.phone || driverSrc.driverPhone,
        driverRating: driverSrc.rating || 5,
        driverProfilePic: getProxiedImageUrl(driverSrc.profile_pic_url || driverSrc.profile_pic || driverSrc.avatar || driverSrc.profilePic),
        driverOTP: currentTrip.otp || currentTrip.driver_otp || driverSrc.otp || driverSrc.driverOTP,
        carModel: driverSrc.vehicle_model || driverSrc.car_model || currentTrip.vehicle_model || currentTrip.car_model || currentTrip.car,
        carPlate: driverSrc.vehicle_plate || driverSrc.car_plate || currentTrip.vehicle_plate || currentTrip.car_plate || currentTrip.plate,
        estimatedArrival: currentTrip.eta || driverSrc.estimatedArrival || 5,
        driverLat: driverSrc.current_lat || driverSrc.driverLat,
        driverLng: driverSrc.current_lng || driverSrc.driverLng,
        totalRides: driverSrc.total_trips || driverSrc.total_rides || driverSrc.totalRides,
    } : null;

    const activeDriver = assignedDriver || apiDriver;
    // Update local status when API data changes (fallback)
    useEffect(() => {
        if (tripdata?.success && tripdata.data?.trip_status) {
            setCurrentStatus(tripdata.data.trip_status);
        }
    }, [tripdata?.data?.trip_status]);

    // ==================== SOCKET ROOM & LISTENERS ====================
    useEffect(() => {
        if (!currentTrip?.trip_id) return;

        joinUserRoom(currentTrip.user_id || 'USER');
        joinTripRoom(currentTrip.trip_id, currentTrip.user_id || 'USER', 'USER');

        const handleStatusChange = (data: any) => {
            const incomingTripId = data.trip_id || data.tripId || data.rideId;
            if (incomingTripId?.toString() !== currentTrip.trip_id?.toString()) return;

            const newStatus = data.status || data.trip_status || data.trip?.trip_status;
            const cancelBy = data.cancel_by || data.trip?.cancel_by || data.cancelled_by;
            if (newStatus) {
                setCurrentStatus(newStatus);
                dispatch(updateTripInArray({
                    trip_id: currentTrip.trip_id,
                    trip_status: newStatus,
                    ...(cancelBy && { cancel_by: cancelBy })
                }));
                refetch();

                if (newStatus === TripStatus.CANCELLED || newStatus === TripStatus.MID_CANCELLED) {
                    if (Platform.OS === 'android') {
                        ToastAndroid.show('Trip Cancelled', ToastAndroid.SHORT);
                    }
                }
            }
        };

        const handleAccepted = (data: any) => {
            const incomingTripId = data.trip_id || data.tripId || data.rideId;
            if (incomingTripId?.toString() !== currentTrip.trip_id?.toString()) return;

            setCurrentStatus(TripStatus.ACCEPTED);

            if (Platform.OS === 'android') {
                ToastAndroid.show('Driver Found!', ToastAndroid.SHORT);
            }
            console.log("Driver Data", data);
            // The socket might send the driver data in several formats. 
            // We prioritize driver_details (new format) then fall back.
            const driverData = data.driver_details || data.driverData || data.driver || data;

            setAssignedDriver({
                driverId: driverData.id || driverData.driver_id || driverData.driverId,
                driverName: driverData.full_name || driverData.name || driverData.driverName,
                driverPhone: driverData.phone_number || driverData.phone || driverData.driverPhone,
                driverRating: driverData.rating || driverData.driverRating || 5,
                driverProfilePic: getProxiedImageUrl(driverData.profile_pic_url || driverData.profile_pic || driverData.avatar || driverData.profilePic),
                driverOTP: data.driverOTP || data.otp || driverData.otp,
                carModel: driverData.vehicle_model || driverData.car_model || driverData.carModel,
                carPlate: driverData.vehicle_plate || driverData.car_plate || driverData.carPlate,
                estimatedArrival: data.estimatedArrival || 5,
                driverLat: driverData.current_lat || driverData.driverLat,
                driverLng: driverData.current_lng || driverData.driverLng,
                totalRides: driverData.total_trips || driverData.total_rides || driverData.totalRides,
            });
            dispatch(updateTripInArray({
                trip_id: currentTrip.trip_id,
                trip_status: TripStatus.ACCEPTED,
                driver_details: driverData
            }));
            refetch();
        };

        const handleLocationUpdate = (data: any) => {
            const incomingTripId = data.trip_id || data.tripId;

            // CRITICAL: If an ID is present, it MUST match. 
            // If ID is missing (backend bug), we allow it for the current active trip.
            if (incomingTripId && incomingTripId.toString() !== currentTrip.trip_id?.toString()) {
                return;
            }

            const loc = {
                lat: data.latitude || data.lat,
                lng: data.longitude || data.lng,
                heading: data.heading || 0,
                trip_id: currentTrip.trip_id, // Force current ID so child processes it
                tripId: currentTrip.trip_id,
                eta: data.eta,
            };

            setDriverLocation(loc);
            setDriverLocationHistory((prev: any) => [...prev.slice(-10), loc]);
            if (data.eta) setEta(data.eta);
        };

        const handleDestinationReached = (data: any) => {
            console.log("Destination Reached", data);
            setTripPhase('DESTINATION_REACHED');
            setCurrentStatus(TripStatus.DESTINATION_REACHED);
            dispatch(updateTripInArray({ trip_id: currentTrip.trip_id, trip_status: TripStatus.DESTINATION_REACHED }));
        };

        const unsubStatus = onTripStatusChanged(handleStatusChange);
        const unsubAccepted = onTripAccepted(handleAccepted);
        const unsubLocation = onDriverLocationUpdated(handleLocationUpdate);
        const unsubDestinationReached = onDestinationReached(handleDestinationReached);

        return () => {
            unsubStatus();
            unsubAccepted();
            unsubDestinationReached();
            unsubLocation();
            leaveTripRoom(currentTrip.trip_id);
        };
    }, [currentTrip?.trip_id, isConnected]);

    // ==================== FCM FALLBACK FOR SYNC ====================
    useEffect(() => {
        if (!currentTrip?.trip_id) return;

        const unsubscribe = messaging().onMessage(async (remoteMessage) => {
            const data = remoteMessage.data;
            const type = data?.type;
            const tripId = data?.tripId || data?.trip_id || data?.rideId;

            if (tripId?.toString() === currentTrip.trip_id?.toString()) {
                refetch();

                // If it's a specific "Accepted" notification, we can also manually push the status
                if (type === 'DRIVER_ASSIGNED' || type === 'TRIP_ACCEPTED') {
                    setCurrentStatus(TripStatus.ACCEPTED);
                }
            }
        });

        return () => unsubscribe();
    }, [currentTrip?.trip_id]);

    // ==================== USER LOCATION TRACKER (LIVE SHARING) ====================
    useEffect(() => {
        let watchId: number | null = null;
        if (currentStatus === TripStatus.LIVE && currentTrip?.trip_id && localUser?.id) {
            // console.log("🚀 Trip went live, starting user location share...");
            watchId = Geolocation.watchPosition(
                (position) => {
                    emit(SOCKET_EVENTS.USER_LOCATION_UPDATE, {
                        tripId: currentTrip.trip_id,
                        userId: localUser.id,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        heading: position.coords.heading,
                    });
                },
                (error) => {
                    console.error("❌ Geolocation watch error:", error);
                },
                {
                    enableHighAccuracy: true,
                    distanceFilter: 10,
                    interval: 5000,
                    fastestInterval: 2000,
                }
            );
        }

        return () => {
            if (watchId !== null) {
                Geolocation.clearWatch(watchId);
            }
        };
    }, [currentStatus, currentTrip?.trip_id, localUser?.id]);


    const pickup = {
        address: currentTrip?.pickup_address,
        lat: currentTrip?.pickup_lat,
        lng: currentTrip?.pickup_lng,
    };

    const drop = {
        address: currentTrip?.drop_address,
        lat: currentTrip?.drop_lat,
        lng: currentTrip?.drop_lng,
    };

    // ==================== ANIMATIONS ====================
    const pan = useRef(new Animated.ValueXY()).current;
    const lastOffset = useRef(SNAP_BOTTOM); // Initialize to bottom

    // Debugging logs for socket state & Auto-expand
    useEffect(() => {
        // AUTO-EXPAND BOTTOM SHEET when driver is found or arriving
        if (currentStatus === TripStatus.ACCEPTED || currentStatus === TripStatus.ARRIVING) {
            Animated.spring(pan.y, {
                toValue: SNAP_TOP,
                useNativeDriver: false,
                friction: 8,
            }).start();
            lastOffset.current = SNAP_TOP;
        }
    }, [currentStatus, currentTrip?.trip_status, currentTrip?.trip_id]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
            onPanResponderMove: (e, gestureState) => {
                let newY = lastOffset.current + gestureState.dy;
                if (newY < SNAP_TOP) newY = SNAP_TOP;
                pan.y.setValue(newY);
            },
            onPanResponderRelease: (e, gestureState) => {
                const shouldSnapBottom = gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5;
                const shouldSnapTop = gestureState.dy < -DRAG_THRESHOLD || gestureState.vy < -0.5;

                if (shouldSnapBottom) {
                    Animated.spring(pan.y, {
                        toValue: SNAP_BOTTOM,
                        useNativeDriver: false,
                        friction: 8,
                    }).start();
                    lastOffset.current = SNAP_BOTTOM;
                } else if (shouldSnapTop || lastOffset.current === SNAP_TOP) {
                    Animated.spring(pan.y, {
                        toValue: SNAP_TOP,
                        useNativeDriver: false,
                        friction: 8,
                    }).start();
                    lastOffset.current = SNAP_TOP;
                } else {
                    Animated.spring(pan.y, {
                        toValue: lastOffset.current,
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;


    // ==================== TRIP STATUS: UPDATE ASYNC STORAGE ====================
    useEffect(() => {
        const updateAsyncStorage = async () => {
            try {
                if (
                    currentStatus === TripStatus.LIVE ||
                    currentStatus === TripStatus.ACCEPTED ||
                    currentStatus === TripStatus.ARRIVING ||
                    currentStatus === TripStatus.REQUESTED
                ) {
                    await AsyncStorage.setItem(
                        'active_trip_id',
                        currentTrip.trip_id.toString()
                    );
                } else if (
                    currentStatus === TripStatus.COMPLETED ||
                    currentStatus === TripStatus.CANCELLED ||
                    currentStatus === TripStatus.MID_CANCELLED
                ) {
                    await AsyncStorage.removeItem('active_trip_id');
                }
            } catch (error) {
                Alert.alert('Something Went Wrong!!!', 'Try Again Later');
                // console.error('AsyncStorage Error:', error);
            }
        };

        updateAsyncStorage();
    }, [currentStatus]);

    // ==================== NAVIGATION: SMART BACK ACTION ====================
    useEffect(() => {
        const handleBackAction = () => {
            if (isCancelling) return true; // Prevent default behavior while cancelling
            if (
                currentStatus === TripStatus.LIVE ||
                currentStatus === TripStatus.ACCEPTED ||
                currentStatus === TripStatus.ARRIVING ||
                currentStatus === TripStatus.ARRIVED
            ) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: TabNavigation_Nav }],
                });
                return true; // Prevent default behavior
            }
            if (currentStatus === TripStatus.REQUESTED) {
                return true; // Prevent default behavior without redirecting
            }
            return false; // Let system handle it
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            handleBackAction
        );

        // Also handle navigation actions (header back button, swipe back gestures)
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (isCancelling) {
                e.preventDefault();
                return;
            }
            if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
                if (
                    currentStatus === TripStatus.LIVE ||
                    currentStatus === TripStatus.ACCEPTED ||
                    currentStatus === TripStatus.ARRIVING ||
                    currentStatus === TripStatus.ARRIVED
                ) {
                    e.preventDefault();
                    handleBackAction();
                } else if (currentStatus === TripStatus.REQUESTED) {
                    e.preventDefault();
                }
            }
        });

        return () => {
            backHandler.remove();
            unsubscribe();
        };
    }, [currentStatus, navigation, isCancelling]);

    // ==================== NAVIGATION: TRIP COMPLETED ====================
    // useEffect(() => {
    //     if (currentStatus === TripStatus.COMPLETED) {
    //         console.log('🏁 Trip Completed - Navigating to RideCompletedScreen');
    //         navigation.navigate(RideCompletedScreen_Nav, currentTrip);
    //     }
    // }, [currentStatus, navigation, currentTrip]);

    // ==================== HANDLERS ====================

    /**
     * Handle cancel ride request
     */
    const handleCancelRide = useCallback(
        async (reason: CancelReason, notes: string) => {
            setIsCancelling(true);
            try {
                const finalNotes = reason === CancelReason.OTHER ? `Other: ${otherReason}` : `Cancelled by User: ${notes}`;
                const rawData = {
                    trip_id: currentTrip.trip_id,
                    trip_status: TripStatus.CANCELLED,
                    cancel_by: CancelBy.USER,
                    cancel_reason: reason,
                    notes: finalNotes,
                };

                const result = await cancelTrip(rawData).unwrap();
                if (result.success) {
                    const updatedFields = Object.fromEntries(
                        Object.entries(result.data).filter(
                            ([key, value]) => value !== currentTrip[key] && value != null
                        )
                    );

                    const TripChangesPayload: TripChangesPayload = {
                        trip_id: currentTrip.trip_id,
                        change_type: ChangeType.CANCELLED,
                        old_value: Object.fromEntries(
                            Object.keys(updatedFields).map((key) => [key, currentTrip[key]])
                        ),
                        new_value: updatedFields,
                        changed_by: ChangeBy.USER,
                        notes: `User updated ${Object.keys(updatedFields).join(', ')}`,
                    };

                    await updateTripChanges(TripChangesPayload).unwrap();
                    setShowReasons(false);

                    if (Platform.OS === 'android') {
                        ToastAndroid.show('Booking Cancelled Successfully', ToastAndroid.SHORT);
                    }

                    setCurrentStatus(TripStatus.CANCELLED);
                }
            } catch (error) {
                Alert.alert('Failed to cancel trip. Please try again.');
                console.error('❌ Cancel Trip Error:', error);
            } finally {
                setIsCancelling(false);
            }
        },
        [currentTrip, socket, otherReason]
    );

    /**
     * Handle update ride to LIVE status
     */
    const handleUpdateRide = useCallback(
        async (selectedDriver: any) => {
            try {
                const allowedFields = [
                    'trip_id',
                    'pickup_address',
                    'drop_address',
                    'scheduled_start_time',
                    'driver_id',
                    'ride_type',
                    'trip_status',
                ];

                const rawData = {
                    trip_id: currentTrip.trip_id,
                    ...currentTrip,
                    trip_duration_minutes: currentTrip.trip_duration_minutes,
                    driver_id: selectedDriver?.id || selectedDriver?.driverId,
                    trip_status: TripStatus.LIVE,
                };

                const cleanPayload = Object.fromEntries(
                    Object.entries(rawData).filter(
                        ([key, value]) => allowedFields.includes(key) && value != null
                    )
                );

                const result = await updateTrip(cleanPayload).unwrap();
                if (result.success) {
                    refetch();
                }
            } catch (error) {
                // console.error('❌ Update Ride Error:', error);
                // Alert.alert('Error', 'Failed to update ride. Please try again.');
                Alert.alert('Failed to update ride. Please try again.');
            }
        },
        [currentTrip, refetch]
    );

    /**
     * Handle driver assigned
     */
    const handleDrivers = useCallback((data: any) => {
        const driver = data.driver || data;
        const driverData = {
            driverId: driver.driverId || driver.driver_id || driver.id,
            driverName: driver.driverName || driver.full_name || driver.driver_name || driver.name,
            driverPhone: driver.driverPhone || driver.phone_number || driver.phone,
            driverRating: driver.driverRating || driver.rating,
            driverProfilePic: getProxiedImageUrl(driver.driverProfilePic || driver.profile_pic || driver.profilePic),
            driverOTP: driver.driverOTP || driver.otp,
            carModel: driver.carModel || driver.car_model || driver.vehicle_model,
            carPlate: driver.carPlate || driver.car_plate || driver.vehicle_plate,
            estimatedArrival: driver.estimatedArrival || driver.eta || 5,
            driverLat: driver.current_lat,
            driverLng: driver.current_lng,
            totalRides: driver.total_trips || driver.total_rides || driver.totalRides,
        }
        setAssignedDriver(driverData);
    }, []);

    /**
     * Handle ETA update
     */
    const findETA = useCallback((eta: number) => {
        setEta(eta);
    }, []);

    /**
     * Handle trip phase update
     */
    const onTripPhase = useCallback((tripPhase: TripPhase) => {
        setTripPhase(tripPhase);
    }, []);

    // ==================== RENDER BOTTOM SHEET ====================

    const renderBottomSheet = () => {
        switch (currentStatus) {
            case TripStatus.REQUESTED:
                return (
                    <SearchingDriver
                        tripData={currentTrip}
                        navigation={navigation}
                    />
                );

            case TripStatus.ACCEPTED:
            case TripStatus.ARRIVING:
            case TripStatus.ARRIVED:
                return (
                    <TrackingView
                        trip={currentTrip}
                        driver={activeDriver}
                        eta={eta}
                        status={currentStatus}
                        navigation={navigation}
                    />
                );

            case TripStatus.VERIFICATION_PENDING:
                return (
                    <VerificationPendingView
                        driver={activeDriver}
                        trip={currentTrip}
                    />
                );

            case TripStatus.LIVE:
                return (
                    <OnRideView
                        pickup={currentTrip.pickup_address}
                        destination={currentTrip.drop_address}
                        eta={eta}
                        tripPhase={tripPhase}
                        tripData={currentTrip}
                        driver={activeDriver}
                        navigation={navigation}
                        status={currentStatus} // ✅ Pass reactive status
                    />
                );

            case TripStatus.RETURN_STARTED:
                return (
                    <ReturnStartedView
                        pickup={currentTrip.pickup_address}
                        destination={currentTrip.drop_address}
                        eta={eta}
                        tripPhase={tripPhase}
                        tripData={currentTrip}
                        driver={activeDriver}
                        navigation={navigation}
                        status={currentStatus}
                    />
                );

            case TripStatus.WAITING:
            case TripStatus.DAY_HALT:
            case TripStatus.DESTINATION_REACHED:
            case TripStatus.RETURN_REACHED:
            case TripStatus.COMPLETED:
                return null;

            case TripStatus.CANCELLED:
                return null;

            default:
                return (
                    // <SearchingDriver
                    //     tripData={currentTrip}
                    //     navigation={navigation}
                    // />
                    <TripScreenSkeleton />
                );
        }
    };

    // ==================== RENDER ====================

    if (isLoading) {
        return <TripScreenSkeleton />;
    }

    // ==================== EARLY RETURNS (NO MAP) ====================
    // These states represent the "End of Trip" flows where the map isn't needed

    if (currentStatus === TripStatus.WAITING) {
        if (currentTrip?.ride_type === 'OUTSTATION_ONE_WAY') {
            return (
                <View style={{ flex: 1, backgroundColor: appColors.background, paddingTop: insets.top }}>
                    <RideClosurePreview
                        tripData={currentTrip}
                        fare={currentTrip.total_fare}
                        navigation={navigation}
                    />
                </View>
            );
        }
        return (
            <View style={{ flex: 1, backgroundColor: appColors.background, paddingTop: insets.top }}>
                <RoundTripWaitingView
                    pickup={currentTrip.pickup_address}
                    destination={currentTrip.drop_address}
                    eta={eta}
                    tripPhase={tripPhase}
                    tripData={currentTrip}
                    driver={activeDriver}
                    navigation={navigation}
                    status={currentStatus}
                />
            </View>
        );
    }

    if (currentStatus === TripStatus.DAY_HALT) {
        return (
            <View style={{ flex: 1, backgroundColor: appColors.background, paddingTop: insets.top }}>
                <DayHaltWaitingView
                    pickup={currentTrip.pickup_address}
                    destination={currentTrip.drop_address}
                    eta={eta}
                    tripPhase={tripPhase}
                    tripData={currentTrip}
                    driver={activeDriver}
                    navigation={navigation}
                    status={currentStatus}
                />
            </View>
        );
    }



    if (currentStatus === TripStatus.DESTINATION_REACHED || currentStatus === TripStatus.RETURN_REACHED) {
        if (currentTrip?.ride_type === 'OUTSTATION_ONE_WAY') {
            return (
                <View style={{ flex: 1, backgroundColor: appColors.background, paddingTop: insets.top }}>
                    <RideClosurePreview
                        tripData={currentTrip}
                        fare={currentTrip.total_fare}
                        navigation={navigation}
                        driver={activeDriver}
                    />
                </View>
            );
        }
        return (
            <View style={{ flex: 1, backgroundColor: appColors.background, paddingTop: insets.top }}>
                <RideClosurePreview
                    tripData={currentTrip}
                    fare={currentTrip.total_fare}
                    navigation={navigation}
                    driver={activeDriver}
                />
            </View>
        );
    }

    if (currentStatus === TripStatus.COMPLETED) {
        // If already paid or rated, don't render RatingView, return null to let useEffect navigate
        if (currentTrip?.rating || currentTrip?.payment_status === 'PAID') {
            return null;
        }

        return (
            <View style={{ flex: 1, backgroundColor: appColors.background, paddingTop: insets.top }}>
                <RatingView
                    tripData={currentTrip}
                    fare={currentTrip.total_fare}
                    navigation={navigation}
                    isRated={!!currentTrip.rating}
                    driver={activeDriver}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: appColors.background }]}>
            {/* MAP & BOTTOM SHEET */}
            {/* {currentTrip?.booking_type === 'LIVE' ? ( */}
            {(currentTrip?.booking_type === 'LIVE' || hasManuallyTransitioned) ? (
                <>
                    {/* MAP SECTION */}
                    <View style={styles.mapContainer}>
                        {(currentStatus === TripStatus.REQUESTED || !currentTrip?.driver_id) ? (
                            <MapLocationPolyline
                                status={currentStatus as any}
                                pickup={pickup}
                                dropLocation={drop}
                                driver={driverLocation || activeDriver}
                                nearbyDrivers={[]} // No nearby drivers during active trip
                            />
                        ) : (
                            <UserAppUI
                                trip={currentTrip}
                                status={currentStatus}
                                onFindETA={findETA}
                                onTripPhase={onTripPhase}
                                driver={activeDriver}
                                liveDriverLocation={driverLocation}
                            />
                        )}
                    </View>

                    {/* SCHEDULED TRIP DATE/TIME CARD */}
                    {currentTrip?.booking_type === 'SCHEDULED' && (
                        <View style={[styles.scheduledInfoCard, { top: insets.top + vS(10) }]}>
                            <MaterialCommunityIcons name="calendar-blank" size={mS(22)} color="#2563EB" />
                            <View style={{ marginLeft: hS(10) }}>
                                <Text style={styles.scheduledDateText}>
                                    {currentTrip.scheduled_start_time ? 
                                        new Date(currentTrip.scheduled_start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) 
                                        : 'Pending Time'}
                                </Text>
                                <Text style={styles.scheduledRideTypeText}>
                                    {currentTrip.trip_code ? `${currentTrip.trip_code} • ` : ''}
                                    {currentTrip.ride_type ? currentTrip.ride_type.replace(/_/g, ' ') : 'Outstation One Way'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* SOS BUTTON - Only during active trip phases */}
                    {[TripStatus.ACCEPTED, TripStatus.ARRIVING, TripStatus.ARRIVED, TripStatus.LIVE, TripStatus.WAITING, TripStatus.DAY_HALT, TripStatus.RETURN_STARTED].includes(currentStatus as any) && (
                        <TouchableOpacity
                            style={[styles.sosButton, { top: insets.top + vS(10) }]}
                            onPress={() => setShowSafetyModal(true)}
                        >
                            <MaterialCommunityIcons name="phone" size={mS(18)} color="#EF4444" />
                            <Text style={styles.sosText}>SOS</Text>
                        </TouchableOpacity>
                    )}

                    {/* SAFETY SUPPORT LINK - Only if cancelled */}
                    {(currentStatus === TripStatus.CANCELLED || currentStatus === TripStatus.MID_CANCELLED) && (
                        <TouchableOpacity
                            style={[styles.safetySupportLink, { top: insets.top + vS(10) }]}
                            onPress={() => setShowSafetyModal(true)}
                        >
                            <MaterialCommunityIcons name="shield-account-outline" size={mS(18)} color="#1E293B" />
                            <Text style={styles.safetySupportText}>Safety Support</Text>
                        </TouchableOpacity>
                    )}

                    {/* BOTTOM SHEET OVERLAY */}
                    <View style={styles.overlay}>
                        <Animated.View
                            {...panResponder.panHandlers}
                            style={[
                                styles.bottomSheet,
                                {
                                    backgroundColor: appColors.card,
                                    transform: [{ translateY: pan.y }]
                                }
                            ]}
                        >
                            <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB' }]} />
                            {/* MORE OPTIONS BUTTON (Only for non-REQUESTED trips) */}
                            {currentStatus !== TripStatus.REQUESTED && (
                                <TouchableOpacity
                                    style={styles.moreOptionsButton}
                                    onPress={() => setShowTripOptions(true)}
                                >
                                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#64748B" />
                                </TouchableOpacity>
                            )}

                            {renderBottomSheet()}

                            {/* CANCEL BUTTON (Only for REQUESTED trips) */}
                            {currentStatus === TripStatus.REQUESTED && (
                                <View style={{ alignItems: 'center', width: '100%', marginBottom: insets.bottom + vS(10), marginTop: vS(10) }}>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vS(8) }}
                                        onPress={() => setShowPolicyModal(true)}
                                    >
                                        <MaterialCommunityIcons name="information" size={mS(16)} color="#64748B" />
                                        <Text style={{ marginLeft: hS(4), fontSize: mS(12), color: '#64748B', textDecorationLine: 'underline' }}>
                                            View cancellation policy
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.cancelButton,
                                            { marginHorizontal: hS(20), width: '90%' },
                                        ]}
                                        onPress={() => setShowReasons(true)}
                                    >
                                        <Text style={styles.cancelText}>
                                            Cancel Request
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Animated.View>
                        <SafeAreaView style={{ backgroundColor: appColors.card }} />
                    </View>
                </>
            ) : (
                // SCHEDULED TRIP
                <ScheduledWaitingView
                    tripData={currentTrip}
                    driver={activeDriver}
                    onCancel={() => setShowReasons(true)}
                    onTransition={() => setHasManuallyTransitioned(true)}
                />
            )}

            {/* SAFETY TOOLKIT MODAL */}
            <SafetyToolkitModal
                isVisible={showSafetyModal}
                onClose={() => setShowSafetyModal(false)}
                tripData={currentTrip}
                emergencyContacts={emergencyContacts}
            />

            {/* TRIP OPTIONS MODAL */}
            <Modal statusBarTranslucent navigationBarTranslucent visible={showTripOptions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowTripOptions(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
                    <View style={[{ backgroundColor: appColors.card, width: '85%', borderRadius: 14, overflow: 'hidden' }]}>
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ fontSize: mS(17), fontWeight: '600', color: appColors.text, marginBottom: 4 }}>Trip Options</Text>
                            <Text style={{ fontSize: mS(13), color: appColors.secondaryText, textAlign: 'center' }}>What would you like to do?</Text>
                        </View>
                        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D1D5DB' }} />
                        <TouchableOpacity
                            style={{ padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                            onPress={() => {
                                setShowTripOptions(false);
                                setTimeout(() => setShowPolicyModal(true), 150);
                            }}
                        >
                            <MaterialCommunityIcons name="information" size={18} color="#007AFF" style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: mS(16), color: '#007AFF', textDecorationLine: 'underline', fontWeight: '500' }}>View Cancellation Policy</Text>
                        </TouchableOpacity>
                        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D1D5DB' }} />
                        <TouchableOpacity
                            style={{ padding: 16, alignItems: 'center' }}
                            onPress={() => {
                                setShowTripOptions(false);
                                setTimeout(() => setShowReasons(true), 150);
                            }}
                        >
                            <Text style={{ fontSize: mS(16), color: '#FF3B30', fontWeight: '500' }}>Cancel Ride</Text>
                        </TouchableOpacity>
                        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D1D5DB' }} />
                        <TouchableOpacity
                            style={{ padding: 16, alignItems: 'center' }}
                            onPress={() => setShowTripOptions(false)}
                        >
                            <Text style={{ fontSize: mS(16), color: '#8E8E93', fontWeight: '600' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* CANCEL MODAL */}
            <Modal statusBarTranslucent navigationBarTranslucent visible={showReasons}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setShowReasons(false);
                    setSelectedReason({ value: null, label: '' });
                    setOtherReason('');
                }}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <View style={[styles.reasonSheet, { backgroundColor: appColors.card }]}>
                        <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E5E7EB' }]} />
                        <Text style={[styles.modalTitle, { color: appColors.text }]}>
                            {selectedReason.value === CancelReason.OTHER ? 'Tell us more' : 'Why are you cancelling?'}
                        </Text>

                        {selectedReason.value === CancelReason.OTHER ? (
                            <View style={{ width: '100%' }}>
                                <TextInput
                                    style={[styles.textArea, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0', color: appColors.text }]}
                                    placeholder="Please specify your reason for cancelling..."
                                    placeholderTextColor={isDark ? '#94A3B8' : "#94A3B8"}
                                    multiline
                                    numberOfLines={4}
                                    value={otherReason}
                                    onChangeText={setOtherReason}
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity
                                    style={[styles.submitReasonBtn, { opacity: (otherReason.trim().length > 3 && !isCancelling) ? 1 : 0.6 }]}
                                    disabled={otherReason.trim().length <= 3 || isCancelling}
                                    onPress={() => handleCancelRide(CancelReason.OTHER, otherReason)}
                                >
                                    <Text style={styles.submitReasonText}>Confirm Cancellation</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.backToReasonsBtn}
                                    onPress={() => setSelectedReason({ value: null, label: '' })}
                                >
                                    <Text style={styles.backToReasonsText}>Back to options</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    style={{ marginVertical: vS(10) }}
                                    contentContainerStyle={{ paddingBottom: vS(20) }}
                                >
                                    {(currentStatus === TripStatus.LIVE ? MID_TRIP_REASONS : PRE_TRIP_REASONS).map((reason, index) => {
                                        const isSelected = selectedReason.value === reason.value;
                                        return (
                                            <TouchableOpacity
                                                key={index}
                                                disabled={isCancelling}
                                                style={[
                                                    styles.reasonOption,
                                                    {
                                                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
                                                        opacity: isCancelling ? 0.6 : 1,
                                                        backgroundColor: isSelected ? (isDark ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6') : 'transparent'
                                                    }
                                                ]}
                                                onPress={() => setSelectedReason(reason)}
                                            >
                                                <Text style={[styles.reasonText, { color: appColors.secondaryText, fontWeight: isSelected ? '700' : '500' }]}>{reason.label}</Text>
                                                <MaterialCommunityIcons
                                                    name={isSelected ? "check-circle" : "circle-outline"}
                                                    size={20}
                                                    color={isSelected ? appColors.primary : (isDark ? 'rgba(255, 255, 255, 0.2)' : "#CCC")}
                                                />
                                            </TouchableOpacity>
                                        )
                                    })}
                                </ScrollView>

                                {selectedReason.value && (
                                    <TouchableOpacity
                                        style={[styles.submitReasonBtn, { opacity: isCancelling ? 0.6 : 1 }]}
                                        disabled={isCancelling}
                                        onPress={() => handleCancelRide(selectedReason.value as CancelReason, selectedReason.label)}
                                    >
                                        <Text style={styles.submitReasonText}>Confirm Cancellation</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.keepBookingBtn, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F0F4FF' }]}
                            onPress={() => {
                                setSelectedReason({ value: null, label: '' });
                                setOtherReason('');
                                setShowReasons(false);
                            }}
                        >
                            <Text style={[styles.keepBookingText, { color: appColors.primary }]}>Don't Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* CANCELLING LOADER */}
            <Modal transparent visible={isCancelling} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: appColors.card, padding: 24, borderRadius: 16, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={appColors.primary} />
                        <Text style={{ marginTop: 12, color: appColors.text, fontWeight: '600' }}>Cancelling Trip...</Text>
                    </View>
                </View>
            </Modal>

            {/* POLICY MODAL */}
            <Modal statusBarTranslucent={false} visible={showPolicyModal} animationType="slide" onRequestClose={() => setShowPolicyModal(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: appColors.background }}>
                    <View style={{ flex: 1, padding: hS(20) }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vS(20), paddingTop: vS(10) }}>
                            <TouchableOpacity onPress={() => setShowPolicyModal(false)} style={{ padding: mS(5), marginLeft: -mS(5) }}>
                                <MaterialCommunityIcons name="arrow-left" size={mS(28)} color={appColors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: appColors.text, marginBottom: 0, marginLeft: hS(10) }]}>
                                Cancellation Policy
                            </Text>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: vS(20) }}>
                            <Text style={{ color: appColors.secondaryText, fontSize: mS(16), lineHeight: vS(24) }}>
                                • You can cancel your request free of charge before a driver accepts.{"\n\n"}
                                • If you cancel after a driver is assigned and has started moving towards you, a cancellation fee may apply to compensate the driver for their time and fuel.{"\n\n"}
                                • Cancellations due to driver delays (exceeding the estimated time of arrival significantly) will not incur any fees.{"\n\n"}
                                • Habitual cancellations may result in temporary account restrictions.{"\n\n"}
                                Please be considerate of our drivers' time.
                            </Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.submitReasonBtn, { backgroundColor: appColors.primary, marginTop: vS(10) }]}
                            onPress={() => setShowPolicyModal(false)}
                        >
                            <Text style={styles.submitReasonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    mapContainer: { ...StyleSheet.absoluteFillObject },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: vS(10), color: '#6B7280', fontSize: mS(16) },

    overlay: { position: 'absolute', bottom: 0, width: '100%' },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: mS(30),
        borderTopRightRadius: mS(30),
        paddingHorizontal: hS(20),
        paddingTop: vS(15),
        paddingBottom: vS(20),
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    handle: {
        width: hS(40),
        height: vS(5),
        backgroundColor: '#E5E7EB',
        borderRadius: mS(10),
        alignSelf: 'center',
        marginBottom: vS(15),
    },

    // Cancel Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    reasonSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: mS(20),
        borderTopRightRadius: mS(20),
        padding: hS(20),
        paddingBottom: vS(20),
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: mS(18),
        fontWeight: 'bold',
        color: '#152D5E',
        marginBottom: vS(20),
    },
    reasonOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: vS(15),
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    reasonText: {
        fontSize: mS(15),
        color: '#444',
    },
    keepBookingBtn: {
        marginTop: vS(20),
        padding: vS(15),
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
        borderRadius: mS(10),
    },
    keepBookingText: {
        color: colors.button,
        fontWeight: 'bold',
    },
    textArea: {
        backgroundColor: '#F8FAFC',
        borderRadius: mS(12),
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: '#1E293B',
        padding: mS(15),
        fontSize: mS(15),
        height: vS(120),
        marginBottom: vS(20),
    },
    submitReasonBtn: {
        backgroundColor: '#EF4444',
        paddingVertical: vS(15),
        borderRadius: mS(12),
        alignItems: 'center',
        marginBottom: vS(10),
    },
    submitReasonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: mS(16),
    },
    backToReasonsBtn: {
        paddingVertical: vS(10),
        alignItems: 'center',
    },
    backToReasonsText: {
        color: '#64748B',
        fontSize: mS(14),
    },
    cancelButton: {
        width: '101%',
        height: vS(50),
        borderRadius: mS(12),
        borderWidth: 1,
        borderColor: '#FF4D4D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: { color: '#EF4444', fontWeight: 'bold', fontSize: mS(15) },
    moreOptionsButton: {
        position: 'absolute',
        right: hS(15),
        top: vS(15),
        padding: 5,
        zIndex: 10,
    },

    // SOS Button & Scheduled Card
    scheduledInfoCard: {
        position: 'absolute',
        left: hS(16),
        backgroundColor: '#FFFFFF',
        paddingHorizontal: hS(16),
        paddingVertical: vS(12),
        borderRadius: mS(16),
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        zIndex: 1000,
    },
    scheduledDateText: {
        color: '#111827',
        fontWeight: '800',
        fontSize: mS(14),
    },
    scheduledRideTypeText: {
        color: '#6B7280',
        fontSize: mS(11),
        marginTop: vS(2),
        fontWeight: '500',
    },
    sosButton: {
        position: 'absolute',
        right: hS(16),
        backgroundColor: '#FFFFFF',
        paddingHorizontal: hS(16),
        paddingVertical: vS(12),
        borderRadius: mS(25),
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        zIndex: 1000,
    },
    sosText: {
        color: '#EF4444',
        fontWeight: '800',
        fontSize: mS(14),
        marginLeft: hS(6),
    },
    safetySupportLink: {
        position: 'absolute',
        right: hS(20),
        backgroundColor: '#F1F5F9',
        paddingHorizontal: hS(12),
        paddingVertical: vS(8),
        borderRadius: mS(20),
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        zIndex: 1000,
    },
    safetySupportText: {
        color: '#1E293B',
        fontWeight: '700',
        fontSize: mS(12),
        marginLeft: hS(6),
    },
});

export default TripScreen;