
import { useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Platform, Modal, Pressable, ScrollView, Alert, ToastAndroid, ActivityIndicator, Switch, ImageBackground, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dropdown } from 'react-native-element-dropdown';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SelectionPage from '../SelectionScreen/SelectionPage';
import DateTimePickerComponent from '../../Components/DateTimePicker';
import DatePicker from '../../Components/DatePicker';
import colors from '../../constant/colors';
import LocationSearchModal from '../MapTrackingScreen/LocationSearchModal';
import { BookingType, PaymentStatus, RideType, ServiceType, TripStatus } from '../../enums/trip.enum';
import { Trip } from '../../types/trip';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedLocation } from '../../service/utils/storage';
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete';
import Config from 'react-native-config';
import formatDate from '../../Components/FormatDate';
import { selectContactPhone } from 'react-native-select-contact';
import { useContactPicker } from '../../hooks/useContacts';
import RiderOption from './Components/AddnewRider';
import { useUpdateUserMutation } from '../../service/userApi';
import { updateUserStore } from '../../redux/userSlice';
import CustomAlert from '../../Components/CustomAlert';
import { hS, mS, vS } from '../../lib/responsive';
import { ResponsiveContainer } from '../../Components/ResponsiveContainer';
import { ContactScreen_Nav } from '../../Navigations/navigations';
import { useLocation } from '../../hooks/useLocation';
import { useAppTheme } from '../../hooks/useAppTheme';
import SearchableCarPicker from './Components/SearchableCarPicker';
import { ALL_CARS, CarModel } from '../../constant/cars';
import { TransmissionType, VehicleType } from '../../enums/trip.enum';
import { useDirections } from '../../hooks/useDirections';

const RECENT_LOCATIONS_KEY = '@recent_locations';
const RECENT_CONTACTS_KEY = '@recent_contacts';

const GOOGLE_P_API_KEY = Config.GOOGLE_API_KEY;

type PickerMode = 'date' | 'time' | 'datetime';
interface Contact {
    name: string;
    phone: string;
}
interface LocationInputProps extends ScreenProps {
    pickupLocation?: string;
    dropLocation?: string;
    sDate?: Date;
    sRide?: RideType;
    onStartClick?: () => void;
    onDestinationClick?: () => void;
    isadvancebooking?: boolean;
    onDataChange?: (data: Partial<Trip>) => void;
    sVehicleModel?: string;
    sTransmission?: TransmissionType;
}

const SCREEN_TO_RIDE_TYPE: Record<string, RideType> = {
    'OneWay': RideType.ONE_WAY,
    'RoundedTrip': RideType.ROUND_TRIP,
    'Outstation': RideType.OUTSTATION_ONE_WAY,
    'Schedule': RideType.SCHEDULED,
};

const LocationSearch: React.FC<LocationInputProps> = ({ pickupLocation, dropLocation, sDate, sRide, onStartClick, onDestinationClick, navigation, isadvancebooking, onDataChange, sVehicleModel, sTransmission }) => {
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useAppTheme();

    const { pickContact } = useContactPicker();
    const { getCurrentLocation, getAddressFromCoords, loading } = useLocation();
    const { distance, duration, calculateRoute } = useDirections(GOOGLE_P_API_KEY ?? "");

    const { screenName, selectedDropOff, dropoffLocation, rideType } = route.params || {};
    const localuser = useSelector((state: RootState) => state.userSlice.user);
    const [favoriteLocations, setFavoriteLocations] = useState<SavedLocation[]>(localuser?.favourite_places || []);
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [isContactAlertVisible, setIsContactAlertVisible] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
    const [alertMode, setAlertMode] = useState<'add' | 'remove'>('add');
    const dispatch = useDispatch()
    const [updateUser] = useUpdateUserMutation();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;


    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState("Myself");
    const options = ["Myself", "For Someone Else"];


    const rideDetails = [
        { label: 'OneWay', value: RideType.ONE_WAY, iconName: 'directions' },
        { label: 'RoundedTrip', value: RideType.ROUND_TRIP, iconName: 'autorenew' },
        { label: 'Outstation', value: RideType.OUTSTATION_ONE_WAY, iconName: 'map-marker-radius-outline' },
        { label: 'Schedule', value: RideType.SCHEDULED, iconName: 'select-marker' },
    ];

    const [next, setNext] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [scheduledDate, setScheduledDate] = useState<Date | null>(sDate ? sDate : null);
    const [scheduledTime, setScheduledTime] = useState<Date | null>(sDate ? sDate : null);
    const [selectedRide, setSelectedRide] = useState<RideType>(() => {
        const initial = rideType || sRide || SCREEN_TO_RIDE_TYPE[screenName] || RideType.ONE_WAY;
        if (initial === RideType.OUTSTATION_ROUND_TRIP) {
            return RideType.OUTSTATION_ONE_WAY;
        }
        return initial;
    });
    const [selectedService, setSelectedService] = useState('');
    const [pickerMode, setPickerMode] = useState<PickerMode>('date');
    const [advancebooking, setAdvanceBooking] = useState(isadvancebooking || false);

    const now = new Date();
    const minimumSchedulingDate = new Date(now.getTime());
    minimumSchedulingDate.setMinutes(now.getMinutes() + 30);

    // Users cannot book an advanced ride more than 30 days from now
    const maximumSchedulingDate = new Date(now);
    maximumSchedulingDate.setDate(now.getDate() + 30);

    const [startLocation, setStartLocation] = useState(pickupLocation || "");
    const [destination, setDestination] = useState(dropLocation || selectedDropOff || "");
    const [modalType, setModalType] = useState<"start" | "destination" | null>(null);
    const [savedRecents, setSavedRecents] = useState<SavedLocation[]>([]);
    const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
    const [passenger, setPassenger] = useState({
        type: 'Myself', // 'Myself' or 'Someone Else'
        name: '',
        phone: ''
    });

    const [selectedVehicle, setSelectedVehicle] = useState<CarModel | null>(() => {
        if (sVehicleModel) {
            return ALL_CARS.find(car => `${car.brand} ${car.model}` === sVehicleModel) || null;
        }
        return null;
    });
    const [transmission, setTransmission] = useState<TransmissionType>(sTransmission || TransmissionType.MANUAL);
    const [packageHours, setPackageHours] = useState<number | null>(null);
    const packageHourOptions = [
        { label: '2 Hours', value: 2 },
        { label: '4 Hours', value: 4 },
        { label: '6 Hours', value: 6 },
        { label: '8 Hours', value: 8 },
        { label: '12 Hours', value: 12 },
    ];
    const outstationTripTypeOptions = [
        { label: 'One Way', value: RideType.OUTSTATION_ONE_WAY },
        { label: 'Round Trip', value: RideType.OUTSTATION_ROUND_TRIP }
    ];
    const outstationOneWayPackageHourOptions = [
        { label: '4 Hrs', value: 4 },
        { label: '6 Hrs', value: 6 },
        { label: '8 Hrs', value: 8 },
        { label: '10 Hrs', value: 10 },
        { label: '12 Hrs', value: 12 },
        { label: '14 Hrs', value: 14 },
        { label: '16 Hrs', value: 16 },
        { label: '18 Hrs', value: 18 },
    ];
    const outstationRoundTripPackageHourOptions = [
        { label: '12 Hrs', value: 12 },
        { label: '16 Hrs', value: 16 },
        { label: '20 Hrs', value: 20 },
        { label: '1 Day', value: 24 },
        { label: '2 Days', value: 48 },
        { label: '3 Days', value: 72 },
        { label: '4 Days', value: 96 },
        { label: '5 Days', value: 120 },
    ];
    const [outstationTripType, setOutstationTripType] = useState<string | null>(() => {
        const initial = rideType || sRide || SCREEN_TO_RIDE_TYPE[screenName];
        if (initial === RideType.OUTSTATION_ROUND_TRIP || initial === RideType.OUTSTATION_ONE_WAY) {
            return initial;
        }
        return null;
    });
    // 2. Add refs to clear or control inputs if needed

    const [tripPayload, setTripPayload] = useState<Partial<Trip>>({
        user_id: localuser?.id,
        ride_type: selectedRide,
        service_type: ServiceType.DRIVER_ONLY,
        trip_status: TripStatus.REQUESTED,
        booking_type: advancebooking ? BookingType.SCHEDULED : BookingType.LIVE,
        is_for_self: true,
        original_scheduled_start_time: new Date,
        scheduled_start_time: new Date,
        payment_status: PaymentStatus.PENDING,
        pickup_address: startLocation,
        pickup_lat: 0, // Default or from GPS
        pickup_lng: 0,
        drop_lat: dropoffLocation?.dropLat || 0,
        drop_lng: dropoffLocation?.dropLng || 0,
        drop_address: destination,
        distance_km: undefined,
        total_fare: 0,
        platform_fee: 1,
        vehicle_model: '',
        vehicle_type: undefined,
        transmission_type: TransmissionType.MANUAL,
    });

    const formattedDate = scheduledDate ? formatDate(scheduledDate) : 'Select Date';

    const formattedTime = scheduledTime ? scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Select Time';

    const openPicker = (mode: PickerMode) => {
        setPickerMode(mode);
        setShowDatePicker(true);
    };

    const handleDateTimeChange = (newDate: Date) => {
        if (pickerMode === 'date') {
            setScheduledDate(newDate);
        }

        if (pickerMode === 'time') {
            setScheduledTime(newDate);
        }

        const finalDateObj = new Date(newDate);
        onDataChange?.({
            scheduled_start_time: finalDateObj,
        });
        setShowDatePicker(false);

    };

    const handleSave = (scheduledDate: Date, scheduledTime: Date, selectedRide: string) => {
        if (!startLocation || !destination || !selectedVehicle || !scheduledDate || !scheduledTime || !selectedRide) {
            Alert.alert(
                "Incomplete Selection",
                "Please ensure all fields (Pickup, Destination, Vehicle, Date, Time, and Ride Type) are selected before proceeding.",
                [{ text: "OK" }]
            );
            return;
        }

        // Guard: prevent booking a date in the past
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (scheduledDate < startOfToday) {
            Alert.alert('Date Not Allowed', 'You cannot book a ride for a past date.');
            return;
        }

        // Guard: prevent bookings more than 30 days in the future
        const maxAllowed = new Date();
        maxAllowed.setDate(maxAllowed.getDate() + 30);
        maxAllowed.setHours(23, 59, 59, 999);
        if (scheduledDate > maxAllowed) {
            Alert.alert(
                'Date Not Allowed',
                'Advance bookings can only be made up to 30 days from today.'
            );
            return;
        }

        const finalDateObj = new Date(scheduledDate);
        finalDateObj.setHours(scheduledTime.getHours());
        finalDateObj.setMinutes(scheduledTime.getMinutes());
        finalDateObj.setSeconds(0);
        finalDateObj.setMilliseconds(0);
        setTripPayload(prev => ({
            ...prev,
            ride_type: selectedRide as any,
            original_scheduled_start_time: finalDateObj,
            scheduled_start_time: finalDateObj,
        }));

        onDataChange?.({
            scheduled_start_time: finalDateObj,
            ride_type: selectedRide as any
        });
        setNext(true)
        console.log(tripPayload, "tripPayload");
    }



    const handleLocationSelect = (location: string, address: string, lat: number, lng: number) => {
        if (modalType === "start") {
            setStartLocation(location);
            setTripPayload(prev => ({
                ...prev,
                pickup_address: address,
                pickup_lat: lat,
                pickup_lng: lng
            }));

            onDataChange?.({
                pickup_address: address,
                pickup_lat: lat,
                pickup_lng: lng
            });

        } else {
            setDestination(location);
            setTripPayload(prev => ({
                ...prev,
                drop_address: address,
                drop_lat: lat,
                drop_lng: lng
            }));

            onDataChange?.({
                drop_address: address,
                drop_lat: lat,
                drop_lng: lng
            });
        }
    };

    const handlePackageSelect = (packageHours: number) => {

        console.log('Selected package hours:', packageHours);
        setPackageHours(packageHours);
        setTripPayload(prev => ({
            ...prev,
            package_hours: packageHours
        }));

        onDataChange?.({
            package_hours: packageHours
        });
    };

    const handleCarSelect = (car: CarModel, trans: TransmissionType) => {
        setSelectedVehicle(car);
        setTransmission(trans);
        setTripPayload(prev => ({
            ...prev,
            vehicle_model: `${car.brand} ${car.model}`,
            vehicle_type: car.type,
            transmission_type: trans
        }));

        onDataChange?.({
            vehicle_model: `${car.brand} ${car.model}`,
            vehicle_type: car.type,
            transmission_type: trans
        });
    };

    const handleUseCurrentLocation = async () => {
        try {
            const position = await getCurrentLocation();
            if (position) {
                const { latitude, longitude } = position.coords;
                const address = await getAddressFromCoords(latitude, longitude);
                const locationName = "Current Location";
                const formattedAddress = address?.formatted || "Unknown Address";

                setStartLocation(locationName);
                setTripPayload(prev => ({
                    ...prev,
                    pickup_address: formattedAddress,
                    pickup_lat: latitude,
                    pickup_lng: longitude
                }));

                onDataChange?.({
                    pickup_address: formattedAddress,
                    pickup_lat: latitude,
                    pickup_lng: longitude
                });
            }
        } catch (error) {
            Alert.alert("Error", "Could not fetch current location. Please try again.");
        }
    };


    const clearRecents = async () => {
        try {
            await AsyncStorage.removeItem(RECENT_LOCATIONS_KEY);
            setSavedRecents([]); // Clear local state immediately
        } catch (e) {
            Alert.alert('Something Went Wrong!!!', 'Try Again Later');
            // console.error("Error clearing recents", e);
        }
    };

    const loadRecents = async () => {
        const data = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
        if (data) setSavedRecents(JSON.parse(data));
    };

    const loadSavedContacts = async () => {
        const saved = await AsyncStorage.getItem(RECENT_CONTACTS_KEY);
        if (saved) setRecentContacts(JSON.parse(saved));
    };

    const saveNewContact = async (newContact: Contact) => {

        const filtered = recentContacts.filter((c: Contact) => c.phone !== newContact.phone);
        const updatedList = [newContact, ...filtered].slice(0, 5);
        setRecentContacts(updatedList);
        await AsyncStorage.setItem(RECENT_CONTACTS_KEY, JSON.stringify(updatedList));
    };

    const handleOptionSelect = async (item: string, contactData?: Contact) => {
        // 1. Logic for "Myself"
        if (item === 'Myself') {
            setPassenger({ type: 'Myself', name: '', phone: '' });
            setSelected('Myself');
            setTripPayload({
                ...tripPayload, is_for_self: true, passenger_details: {
                    name: localuser?.full_name,
                    phone: localuser?.phone_number
                }
            });
            setVisible(false);
            return;
        }

        // 2. Logic for "For Someone Else" (Triggers the Picker)
        if (item === 'For Someone Else') {
            navigation.navigate(ContactScreen_Nav, {
                onSelectContact: async (contact: any) => {
                    if (contact) {

                        await saveNewContact(contact);
                        setPassenger({
                            type: 'For Someone Else',
                            name: contact.name,
                            phone: contact.phone
                        });
                        setSelected(contact.phone);
                        setTripPayload({
                            ...tripPayload, is_for_self: false, passenger_details: {
                                name: contact.name,
                                phone: contact.phone
                            }
                        });
                        setVisible(false);
                        navigation.goBack(); // Return to Home after selection
                    }
                },
            });
            // const selection = await pickContact(); // Your picker function
            // if (selection) {
            //     await saveNewContact(selection); // Add to the 5-contact list
            //     setPassenger({
            //         type: 'For Someone Else',
            //         name: selection.name,
            //         phone: selection.phone
            //     });
            //     setSelected(selection.phone); // Use phone as unique ID for selection
            //     setTripPayload({
            //         ...tripPayload, is_for_self: false, passenger_details: {
            //             name: selection.name,
            //             phone: selection.phone
            //         }
            //     });
            //     setVisible(false);
            // }
            return;
        }

        // 3. Logic for selecting an existing contact from the list
        if (contactData) {
            setPassenger({
                type: 'For Someone Else',
                name: contactData.name,
                phone: contactData.phone
            });
            setSelected(contactData.phone);
            setTripPayload({
                ...tripPayload, is_for_self: false, passenger_details: {
                    name: contactData.name,
                    phone: contactData.phone
                }
            });
            setVisible(false);
        }
    };

    const deleteContact = async (phone: string) => {
        const updated = recentContacts.filter(c => c.phone !== phone);
        setRecentContacts(updated);
        await AsyncStorage.setItem(RECENT_CONTACTS_KEY, JSON.stringify(updated));

        // If deleted contact was the selected one, switch back to "Myself"
        if (selected === phone) {
            setSelected('Myself');
            setPassenger({ type: 'Myself', name: '', phone: '' });
        }
    };
    const handleDeleteWithAlert = (phone: string) => {
        setContactToDelete(phone);
        setIsContactAlertVisible(true);
    };

    const handleSync = async (updatedArray: SavedLocation[]) => {
        // Optimistic UI update
        setFavoriteLocations(updatedArray);

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
            // console.error("Sync failed", error);
            setFavoriteLocations(localuser?.favourite_places || []);
            Alert.alert("Error", "Could not sync favorites with the server.");
        }
    };

    const onToggleFavorite = async (location: SavedLocation) => {

        const isExist = favoriteLocations.find(f => f.id === location.id);
        setSelectedLocation(location);
        setAlertMode(isExist ? 'remove' : 'add');
        setAlertVisible(true);

    };

    const confirmToggle = async () => {
        if (!selectedLocation) return;
        const updated = alertMode === 'remove'
            ? favoriteLocations.filter(f => f.id !== selectedLocation.id)
            : [...favoriteLocations, selectedLocation];

        setAlertVisible(false);
        await handleSync(updated);
    };

    const handleSelectFavourites = (data: SavedLocation) => {
        setDestination(data.name);
        setTripPayload({
            ...tripPayload,
            drop_lat: data.lat,
            drop_lng: data.lng,
            drop_address: data.address
        })
    }

    const handleToggleAdvanceBooking = () => {
        if (selectedRide === RideType.OUTSTATION_ONE_WAY || selectedRide === RideType.OUTSTATION_ROUND_TRIP) {
            Alert.alert(
                "Advance Booking",
                "You cannot disable advance booking because outstation trips must be scheduled."
            );
            return;
        }

        const newAdvanceBooking = !advancebooking;
        setAdvanceBooking(newAdvanceBooking);
        setTripPayload(prev => ({
            ...prev,
            booking_type: newAdvanceBooking ? BookingType.SCHEDULED : BookingType.LIVE
        }));
    };


    useEffect(() => {
        if (localuser?.favourite_places) {
            setFavoriteLocations(localuser.favourite_places);
        }
    }, [localuser?.favourite_places]);



    useEffect(() => {
        // Set current location as default if no pickup location is provided
        if (!pickupLocation && !startLocation) {
            handleUseCurrentLocation();
        }

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();

        loadRecents();
        loadSavedContacts();
    }, []);

    useEffect(() => {
        if (screenName === 'Schedule') {
            setAdvanceBooking(true)
            setTripPayload(prev => ({
                ...prev,
                booking_type: BookingType.SCHEDULED
            }));
        }
    }, [screenName])

    useEffect(() => {
        if (selectedRide === RideType.OUTSTATION_ONE_WAY || selectedRide === RideType.OUTSTATION_ROUND_TRIP) {
            setAdvanceBooking(true);
            setTripPayload(prev => ({
                ...prev,
                booking_type: BookingType.SCHEDULED,
                ride_type: selectedRide
            }));
        }
    }, [selectedRide]);

    useEffect(() => {
        const { pickup_lat, pickup_lng, drop_lat, drop_lng } = tripPayload;

        if (pickup_lat && pickup_lng && drop_lat && drop_lng) {
            const fetchRoute = async () => {
                const pickup = { lat: pickup_lat, lng: pickup_lng };
                const drop = { lat: drop_lat, lng: drop_lng };

                const result = await calculateRoute(pickup, drop);
                let DistanceKm = 0;
                let DurationMin = 0;

                if (result) {
                    const { distanceText, durationText } = result as any;
                    if (distanceText) {
                        DistanceKm = parseFloat(distanceText.replace(/[^\d.]/g, ''));
                    }
                    if (durationText) {
                        DurationMin = parseInt(durationText.replace(/[^\d.]/g, ''));
                    }

                    setTripPayload((prev) => ({
                        ...prev,
                        distance_km: DistanceKm,
                        trip_duration_minutes: DurationMin
                    }));
                }
            };
            fetchRoute();
        }
    }, [tripPayload.pickup_lat, tripPayload.pickup_lng, tripPayload.drop_lat, tripPayload.drop_lng]);

    // Removed auto-navigation so user can manually confirm

    // Validation constants
    const anyDataPresent = !!(startLocation || destination || selectedVehicle);
    const pickupError = anyDataPresent && !startLocation;
    const destinationError = anyDataPresent && !destination;
    const vehicleError = (startLocation && destination) && !selectedVehicle;
    const advanceError = advancebooking && (startLocation && destination && selectedVehicle) && (!scheduledDate || !scheduledTime || !selectedRide);

    // Additional validations
    const tripTypeError = anyDataPresent && (selectedRide === RideType.OUTSTATION_ONE_WAY || selectedRide === RideType.OUTSTATION_ROUND_TRIP) && !outstationTripType;
    const packageError = anyDataPresent && (selectedRide === RideType.ROUND_TRIP || selectedRide === RideType.OUTSTATION_ONE_WAY || selectedRide === RideType.OUTSTATION_ROUND_TRIP) && !packageHours;

    const getCityFromAddress = (address: string) => {
        if (!address) return '';
        const parts = address.split(',').map(s => s.trim());
        return parts.length >= 3 ? parts[parts.length - 3] : address;
    };
    const pickupCity = getCityFromAddress(tripPayload.pickup_address || startLocation);
    const dropCity = getCityFromAddress(tripPayload.drop_address || destination);
    // Relaxed city matching: we only throw an error if it's a very long one-way trip (>= 4 hours)
    const isDifferentCity = !!(startLocation && destination && pickupCity !== dropCity);
    const isLongOneWay = tripPayload.trip_duration_minutes !== undefined && tripPayload.trip_duration_minutes >= 240;
    const showCityError = selectedRide === RideType.ONE_WAY && isLongOneWay;

    return (
        <View style={[styles.maincontainer, { backgroundColor: colors.background }]}>
            {/* HEADER */}
            {!isadvancebooking && !next && (
                <ImageBackground
                    source={require('../../assets/images/header_bg.jpg')}
                    style={{ width: '100%', height: vS(200), paddingTop: insets.top, zIndex: 0, elevation: 0 }}
                    imageStyle={{ borderBottomLeftRadius: mS(40), borderBottomRightRadius: mS(40) }}
                >
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: hS(20),
                        paddingVertical: vS(14),
                    }}>
                        {/* LEFT SECTION */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: hS(10) }}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: mS(20),
                                    padding: mS(8),
                                    marginRight: hS(10),
                                    ...Platform.select({
                                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                        android: { elevation: 2 },
                                    })
                                }}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={mS(20)} color="#1E293B" />
                            </TouchableOpacity>
                            <Dropdown
                                style={{
                                    width: mS(140),
                                    height: vS(36),
                                    backgroundColor: '#FFFFFF',
                                    paddingHorizontal: hS(12),
                                    borderRadius: mS(18),
                                    ...Platform.select({
                                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                        android: { elevation: 2 },
                                    })
                                }}
                                placeholderStyle={{ color: '#1E293B', fontSize: mS(14), fontWeight: '700' }}
                                selectedTextStyle={{ fontSize: mS(14), fontWeight: '700', color: '#1E293B' }}
                                itemTextStyle={{ color: colors.text, fontSize: mS(14) }}
                                itemContainerStyle={{ backgroundColor: colors.card }}
                                activeColor={isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'}
                                containerStyle={{
                                    backgroundColor: colors.card,
                                    borderRadius: mS(12),
                                    marginTop: vS(5),
                                    overflow: 'hidden',
                                    width: 200,
                                }}
                                iconColor="#1E293B"
                                data={rideDetails}
                                labelField="label"
                                valueField="value"
                                placeholder="Ride Type"
                                value={selectedRide}
                                onChange={(item) => {
                                    setSelectedRide(item.value);
                                    onDataChange?.({
                                        ride_type: item.value as any
                                    });
                                }}
                            />
                        </View>

                        {/* RIGHT SECTION: Selector Pill */}
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => setVisible(true)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(0, 0, 0, 0.2)', // translucent dark
                                paddingHorizontal: hS(8),
                                paddingVertical: vS(6),
                                borderRadius: mS(25),
                            }}
                        >
                            <View style={{ backgroundColor: '#FFD700', borderRadius: mS(12), padding: mS(2) }}>
                                <MaterialCommunityIcons name="account-circle" size={18} color="#1E293B" />
                            </View>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(12), fontWeight: '600', color: '#FFFFFF', marginHorizontal: hS(6) }}>
                                {selected}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* BOTTOM MODAL */}
                    <Modal
                        visible={visible}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setVisible(false)}
                        statusBarTranslucent
                        navigationBarTranslucent
                    >
                        <Pressable
                            onPress={() => setVisible(false)}
                            style={{
                                flex: 1,
                                backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <View style={{
                                backgroundColor: colors.card,
                                paddingHorizontal: hS(20),
                                paddingBottom: vS(40),
                                borderTopLeftRadius: mS(24),
                                borderTopRightRadius: mS(24),
                            }}>
                                {/* Drag Handle */}
                                <View style={{
                                    width: hS(40),
                                    height: vS(5),
                                    backgroundColor: colors.border,
                                    borderRadius: mS(3),
                                    alignSelf: 'center',
                                    marginTop: vS(12),
                                    marginBottom: vS(20),
                                }} />

                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(18), fontWeight: '700', color: colors.text, marginBottom: vS(20) }}>
                                    Who is this ride for?
                                </Text>

                                <ScrollView style={{ maxHeight: vS(400) }}>
                                    {/* Default Option */}
                                    <RiderOption
                                        label="Myself"
                                        subLabel="Your profile"
                                        icon="account"
                                        isSelected={selected === 'Myself'}
                                        onPress={() => handleOptionSelect('Myself')}
                                    />

                                    {/* List of up to 5 Saved Contacts */}
                                    {recentContacts.map((contact, index) => (
                                        <RiderOption
                                            key={contact.phone}
                                            label={contact.name}
                                            subLabel={contact.phone}
                                            icon="account-outline"
                                            isSelected={selected === contact.phone}
                                            onPress={() => handleOptionSelect('Existing', contact)}
                                            onDelete={() => handleDeleteWithAlert(contact.phone)}
                                        />
                                    ))}

                                    {/* Action Button to add more */}
                                    {recentContacts.length < 5 ? (
                                        <TouchableOpacity
                                            onPress={() => handleOptionSelect('For Someone Else')}
                                            style={[styles.addNewContainer, { backgroundColor: colors.iconBox, borderColor: isDark ? colors.primary : colors.button }]}
                                        >
                                            <MaterialCommunityIcons name="account-plus-outline" size={mS(22)} color={isDark ? colors.primary : colors.button} />
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.addNewText, { color: isDark ? colors.primary : colors.button }]}>Add New Contact</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.limitReachedContainer, {
                                            borderColor: isDark ? colors.primary : colors.button
                                        }]}>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.limitReachedText, { color: isDark ? colors.primary : colors.button }]}>
                                                Limit reached. Delete a contact to add a new one.
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        </Pressable>
                    </Modal>
                </ImageBackground>
            )}

            {!next ? (
                <View style={{ flex: 1, zIndex: 100, elevation: 100, marginTop: vS(-120) }}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingBottom: vS(40), paddingTop: vS(10) }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <ResponsiveContainer>

                        {/* LOCATION INPUTS */}
                        <Animated.View
                            style={[styles.container, {
                                backgroundColor: colors.card,
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                                borderWidth: (pickupError || destinationError) ? 1.5 : 0,
                                borderColor: '#EF4444'
                            }]}
                        >
                            {/* Swap Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    setStartLocation(destination);
                                    setDestination(startLocation);

                                    setTripPayload(prev => {
                                        return {
                                            ...prev,
                                            pickup_address: prev.drop_address,
                                            pickup_lat: prev.drop_lat,
                                            pickup_lng: prev.drop_lng,
                                            drop_address: prev.pickup_address,
                                            drop_lat: prev.pickup_lat,
                                            drop_lng: prev.pickup_lng,
                                        };
                                    });
                                    
                                    onDataChange?.({
                                        pickup_address: tripPayload.drop_address,
                                        pickup_lat: tripPayload.drop_lat,
                                        pickup_lng: tripPayload.drop_lng,
                                        drop_address: tripPayload.pickup_address,
                                        drop_lat: tripPayload.pickup_lat,
                                        drop_lng: tripPayload.pickup_lng,
                                    });
                                }}
                                style={{
                                    position: 'absolute',
                                    right: hS(16),
                                    top: '50%',
                                    marginTop: vS(-18),
                                    zIndex: 10,
                                    padding: mS(8),
                                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                    borderRadius: mS(20),
                                    borderWidth: isDark ? 1 : 0,
                                    borderColor: isDark ? colors.border : 'transparent',
                                    ...Platform.select({
                                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                        android: { elevation: 3 },
                                    })
                                }}
                            >
                                <MaterialCommunityIcons name="swap-vertical" size={mS(22)} color={colors.text} />
                            </TouchableOpacity>

                            {/* Pickup Section */}
                            <TouchableOpacity
                                onPress={() => setModalType("start")}
                                activeOpacity={0.7}
                                style={styles.itemContainer}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: pickupError ? 'rgba(239, 68, 68, 0.1)' : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#10B981') }]}>
                                    <MaterialCommunityIcons name='map' size={mS(18)} color={pickupError ? '#EF4444' : (isDark ? '#34D399' : "#FFFFFF")} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.label, { color: colors.secondaryText }]}>PICKUP</Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} numberOfLines={1}
                                        style={[styles.value, { color: startLocation ? colors.text : colors.secondaryText }, !startLocation && styles.placeholder]}
                                    >
                                        {startLocation || "Enter pickup location"}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name='chevron-right' size={mS(20)} color={colors.secondaryText} />
                            </TouchableOpacity>

                            {/* Separator Section */}
                            <View style={styles.separatorWrapper}>
                                <View style={styles.dotColumn}>
                                    {[1, 2, 3].map(i => (
                                        <View key={i} style={[styles.dot, { backgroundColor: isDark ? colors.border : '#E2E8F0' }]} />
                                    ))}
                                </View>
                                <View style={[styles.line, { backgroundColor: colors.border }]} />
                            </View>

                            {/* Drop-off Section */}
                            <TouchableOpacity
                                onPress={() => setModalType("destination")}
                                activeOpacity={0.7}
                                style={styles.itemContainer}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: destinationError ? 'rgba(239, 68, 68, 0.1)' : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#EF4444') }]}>
                                    <MaterialCommunityIcons name='map-marker' size={mS(18)} color={destinationError ? '#EF4444' : (isDark ? '#F87171' : "#FFFFFF")} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.label, { color: colors.secondaryText }]}>DESTINATION</Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} numberOfLines={1}
                                        style={[styles.value, { color: destination ? colors.text : colors.secondaryText }, !destination && styles.placeholder]}
                                    >
                                        {destination || "Where to?"}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name='chevron-right' size={mS(20)} color={colors.secondaryText} />
                            </TouchableOpacity>
                        </Animated.View>

                        {showCityError && (
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#EF4444', fontSize: mS(12), marginTop: vS(8), marginLeft: hS(16) }}>
                                OneWay rides are limited to 4 hours. Please select Outstation.
                            </Text>
                        )}

                        {selectedRide === RideType.ROUND_TRIP && (
                            <View style={{
                                marginHorizontal: hS(16),
                                marginTop: vS(10),
                                marginBottom: vS(6),
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vS(12), marginLeft: hS(4) }}>
                                    <MaterialCommunityIcons name="car-side" size={mS(20)} color={isDark ? '#FFFFFF' : '#1E293B'} />
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#FFFFFF' : '#1E293B', fontSize: mS(16), fontWeight: '800', marginLeft: hS(8) }}>Trip Preferences</Text>
                                </View>
                                <View style={{
                                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                    borderRadius: mS(12),
                                    paddingHorizontal: hS(12),
                                    paddingVertical: vS(6),
                                    borderWidth: 1,
                                    borderColor: packageError ? '#EF4444' : (isDark ? colors.border : 'transparent'),
                                    ...Platform.select({
                                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                        android: { elevation: 2 },
                                    }),
                                }}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#9CA3AF' : '#64748B', fontSize: mS(10), fontWeight: '700', marginBottom: vS(2) }}>Package Hours</Text>
                                    <Dropdown
                                        style={{ height: vS(30) }}
                                        placeholderStyle={{ color: colors.secondaryText, fontSize: mS(14) }}
                                        selectedTextStyle={{ color: isDark ? '#FFFFFF' : '#1E293B', fontSize: mS(14), fontWeight: '700' }}
                                        itemTextStyle={{ color: colors.text }}
                                        itemContainerStyle={{ backgroundColor: colors.card }}
                                        activeColor={isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'}
                                        containerStyle={{
                                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                            borderRadius: mS(12),
                                            marginTop: vS(5),
                                            overflow: 'hidden'
                                        }}
                                        renderLeftIcon={() => (
                                            <MaterialCommunityIcons name="clock-outline" size={mS(18)} color="#3B82F6" style={{ marginRight: hS(6) }} />
                                        )}
                                        data={packageHourOptions}
                                        labelField="label"
                                        valueField="value"
                                        placeholder="Package Hours"
                                        value={packageHours}
                                        onChange={(item) => {
                                            handlePackageSelect(item.value);
                                        }}
                                    />
                                </View>
                            </View>
                        )}

                        {(selectedRide === RideType.OUTSTATION_ONE_WAY || selectedRide === RideType.OUTSTATION_ROUND_TRIP) && (
                            <View style={{
                                marginHorizontal: hS(16),
                                marginTop: vS(10),
                                marginBottom: vS(6),
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vS(12), marginLeft: hS(4) }}>
                                    <MaterialCommunityIcons name="car-side" size={mS(20)} color={isDark ? '#FFFFFF' : '#1E293B'} />
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#FFFFFF' : '#1E293B', fontSize: mS(16), fontWeight: '800', marginLeft: hS(8) }}>Trip Preferences</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1, marginRight: hS(6) }}>
                                        <View style={{
                                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                            borderRadius: mS(12),
                                            paddingHorizontal: hS(12),
                                            paddingVertical: vS(6),
                                            borderWidth: 1,
                                            borderColor: tripTypeError ? '#EF4444' : (isDark ? colors.border : 'transparent'),
                                            ...Platform.select({
                                                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                                android: { elevation: 2 },
                                            }),
                                        }}>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#9CA3AF' : '#64748B', fontSize: mS(10), fontWeight: '700', marginBottom: vS(2) }}>Trip Type</Text>
                                            <Dropdown
                                                style={{ height: vS(30) }}
                                                placeholderStyle={{ color: colors.secondaryText, fontSize: mS(14) }}
                                                selectedTextStyle={{ color: isDark ? '#FFFFFF' : '#1E293B', fontSize: mS(14), fontWeight: '700' }}
                                                itemTextStyle={{ color: colors.text }}
                                                itemContainerStyle={{ backgroundColor: colors.card }}
                                                activeColor={isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'}
                                                containerStyle={{
                                                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                                    borderRadius: mS(12),
                                                    marginTop: vS(5),
                                                    overflow: 'hidden'
                                                }}
                                                renderLeftIcon={() => (
                                                    <MaterialCommunityIcons name="navigation-variant" size={mS(18)} color="#3B82F6" style={{ marginRight: hS(6) }} />
                                                )}
                                                data={outstationTripTypeOptions}
                                                labelField="label"
                                                valueField="value"
                                                placeholder="Trip Type"
                                                value={outstationTripType}
                                                onChange={(item) => {
                                                    setOutstationTripType(item.value);
                                                    const newRideType = item.value as RideType;
                                                    setSelectedRide(newRideType);
                                                    setTripPayload(prev => ({
                                                        ...prev,
                                                        ride_type: newRideType
                                                    }));
                                                }}
                                            />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: hS(6) }}>
                                        <View style={{
                                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                            borderRadius: mS(12),
                                            paddingHorizontal: hS(12),
                                            paddingVertical: vS(6),
                                            borderWidth: 1,
                                            borderColor: packageError ? '#EF4444' : (isDark ? colors.border : 'transparent'),
                                            ...Platform.select({
                                                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                                android: { elevation: 2 },
                                            }),
                                        }}>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#9CA3AF' : '#64748B', fontSize: mS(10), fontWeight: '700', marginBottom: vS(2) }}>Package Hours</Text>
                                            <Dropdown
                                                style={{ height: vS(30) }}
                                                placeholderStyle={{ color: colors.secondaryText, fontSize: mS(14) }}
                                                selectedTextStyle={{ color: isDark ? '#FFFFFF' : '#1E293B', fontSize: mS(14), fontWeight: '700' }}
                                                itemTextStyle={{ color: colors.text }}
                                                itemContainerStyle={{ backgroundColor: colors.card }}
                                                activeColor={isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'}
                                                containerStyle={{
                                                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                                    borderRadius: mS(12),
                                                    marginTop: vS(5),
                                                    overflow: 'hidden'
                                                }}
                                                renderLeftIcon={() => (
                                                    <MaterialCommunityIcons name="clock-outline" size={mS(18)} color="#3B82F6" style={{ marginRight: hS(6) }} />
                                                )}
                                                data={outstationTripType === RideType.OUTSTATION_ONE_WAY ? outstationOneWayPackageHourOptions : outstationRoundTripPackageHourOptions}
                                                labelField="label"
                                                valueField="value"
                                                placeholder="Package Hours"
                                                value={packageHours}
                                                onChange={(item) => {
                                                    handlePackageSelect(item.value);
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={{ marginBottom: vS(2) }}>
                            <SearchableCarPicker
                                onSelect={handleCarSelect}
                                placeholder="Search for your car (e.g., Hyundai Creta)"
                                value={selectedVehicle}
                                initialTransmission={transmission}
                                hasError={vehicleError}
                            />
                            {(pickupError || destinationError || vehicleError || advanceError || tripTypeError || packageError) && (
                                <View style={{ marginTop: vS(8), alignItems: 'center' }}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#EF4444', fontSize: mS(13), fontWeight: '700', textAlign: 'center', paddingHorizontal: hS(20) }}>
                                        {pickupError ? "Please select pickup location" :
                                            destinationError ? "Please select destination" :
                                                vehicleError ? "Please select your vehicle" :
                                                    tripTypeError ? "Please select trip type" :
                                                        packageError ? "Please select package hours" :
                                                            "Please complete all booking details"}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <LocationSearchModal
                            isOpen={modalType !== null}
                            onClose={() => setModalType(null)}
                            onSelect={handleLocationSelect}
                            type={modalType || "start"}
                            advancebooking={advancebooking}
                            onSetNext={setNext}
                        />

                        {/* content */}
                        <View>
                            {/* MAIN BOOKING CARD */}
                            {advancebooking && (
                                <View style={{ marginHorizontal: hS(16), marginTop: vS(2), marginBottom: vS(2) }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vS(12), marginLeft: hS(4) }}>
                                        <MaterialCommunityIcons name="calendar-month" size={mS(20)} color="#3B82F6" />
                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#FFFFFF' : '#1E293B', fontSize: mS(16), fontWeight: '800', marginLeft: hS(8) }}>Schedule Ride</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        {/* Date Picker Item */}
                                        <TouchableOpacity
                                            onPress={() => { setShowDatePicker(true); openPicker('date'); }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                width: '48%',
                                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                                paddingHorizontal: hS(12),
                                                paddingVertical: vS(10),
                                                borderRadius: mS(12),
                                                borderWidth: 1,
                                                borderColor: (advanceError && !scheduledDate) ? '#EF4444' : (isDark ? colors.border : 'transparent'),
                                                ...Platform.select({
                                                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                                    android: { elevation: 2 },
                                                }),
                                            }}
                                        >
                                            <MaterialCommunityIcons name="calendar-month-outline" size={mS(24)} color="#3B82F6" />
                                            <View style={{ marginLeft: hS(8) }}>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#9CA3AF' : '#64748B', fontSize: mS(10), fontWeight: '700', marginBottom: vS(2) }}>Date</Text>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#FFFFFF' : '#1E293B', fontSize: mS(13), fontWeight: '700' }}>
                                                    {formattedDate || "Select Date"}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Time Picker Item */}
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowDatePicker(true);
                                                openPicker('time');
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                width: '48%',
                                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                                paddingHorizontal: hS(12),
                                                paddingVertical: vS(10),
                                                borderRadius: mS(12),
                                                borderWidth: 1,
                                                borderColor: (advanceError && !scheduledTime) ? '#EF4444' : (isDark ? colors.border : 'transparent'),
                                                ...Platform.select({
                                                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                                    android: { elevation: 2 },
                                                }),
                                            }}
                                        >
                                            <MaterialCommunityIcons name="clock-outline" size={mS(24)} color="#3B82F6" />
                                            <View style={{ marginLeft: hS(8) }}>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#9CA3AF' : '#64748B', fontSize: mS(10), fontWeight: '700', marginBottom: vS(2) }}>Time</Text>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#FFFFFF' : '#1E293B', fontSize: mS(13), fontWeight: '700' }}>
                                                    {formattedTime || "Select Time"}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            <View style={{ paddingHorizontal: hS(16), paddingVertical: vS(10) }}>
                                {/* SET ON MAP BUTTON */}
                                {!isadvancebooking && (

                                    <>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                            paddingHorizontal: hS(16),
                                            paddingVertical: vS(14),
                                            borderRadius: mS(16),
                                            marginBottom: vS(10),
                                            borderWidth: 1,
                                            borderColor: isDark ? colors.border : 'transparent',
                                            ...Platform.select({
                                                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                                android: { elevation: 2 },
                                            }),
                                        }}>
                                            <View style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF', borderRadius: mS(20), padding: mS(8), marginRight: hS(12) }}>
                                                <MaterialCommunityIcons name="clock-outline" size={mS(24)} color="#3B82F6" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#FFFFFF' : '#1E293B', fontWeight: '800', fontSize: mS(15), marginBottom: vS(2) }}>Advance Booking</Text>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: isDark ? '#9CA3AF' : '#64748B', fontWeight: '600', fontSize: mS(12) }}>Schedule your ride in advance</Text>
                                            </View>
                                            {(selectedRide === RideType.OUTSTATION_ONE_WAY || selectedRide === RideType.OUTSTATION_ROUND_TRIP) ? (
                                                <Pressable onPress={handleToggleAdvanceBooking}>
                                                    <View pointerEvents="none">
                                                        <Switch
                                                            value={advancebooking}
                                                            onValueChange={handleToggleAdvanceBooking}

                                                            trackColor={{ false: '#767577', true: colors.primary }}
                                                            thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : advancebooking ? '#FFFFFF' : '#f4f3f4'}
                                                            disabled={true}
                                                        />
                                                    </View>
                                                </Pressable>
                                            ) : (
                                                <Switch
                                                    value={advancebooking}
                                                    onValueChange={handleToggleAdvanceBooking}
                                                    trackColor={{ false: '#767577', true: colors.primary }}
                                                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : advancebooking ? '#FFFFFF' : '#f4f3f4'}
                                                    disabled={false}
                                                />
                                            )}
                                        </View>

                                        <TouchableOpacity
                                            disabled={advancebooking ? (!startLocation || !destination || !selectedVehicle || !scheduledDate || !scheduledTime || !selectedRide || tripTypeError || packageError) : (!startLocation || !destination || !selectedVehicle || tripTypeError || packageError)}
                                            onPress={() => {
                                                if (advancebooking) {
                                                    if (scheduledDate && scheduledTime && selectedRide && !tripTypeError && !packageError) {
                                                        handleSave(scheduledDate, scheduledTime, selectedRide);
                                                    }
                                                } else {
                                                    if (startLocation && destination && selectedVehicle && transmission && !tripTypeError && !packageError) {
                                                        setNext(true);
                                                    }
                                                }
                                            }}
                                            style={{
                                                backgroundColor: '#0052FF',
                                                padding: mS(16),
                                                borderRadius: mS(12),
                                                marginBottom: vS(16),
                                                flexDirection: 'row',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                opacity: (advancebooking ? (!startLocation || !destination || !selectedVehicle || !scheduledDate || !scheduledTime || !selectedRide || tripTypeError || packageError) : (!startLocation || !destination || !selectedVehicle || tripTypeError || packageError)) ? 0.6 : 1,
                                                ...Platform.select({
                                                    ios: { shadowColor: '#0052FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
                                                    android: { elevation: 4 },
                                                })
                                            }}
                                        >
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#FFFFFF', fontWeight: '800', fontSize: mS(16), marginRight: hS(8) }}>Continue</Text>
                                            <MaterialCommunityIcons name="arrow-right" size={mS(20)} color="#FFFFFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            disabled={loading}
                                            onPress={handleUseCurrentLocation}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
                                                padding: mS(16),
                                                borderRadius: mS(12),
                                                marginBottom: vS(12),
                                                borderWidth: 1,
                                                borderColor: isDark ? colors.border : 'transparent',
                                                opacity: loading ? 0.7 : 1,
                                                justifyContent: 'space-between'
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <MaterialCommunityIcons name="map-marker-radius" size={mS(24)} color="#3B82F6" style={{ marginRight: hS(12) }} />
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#3B82F6', fontWeight: '700', fontSize: mS(15) }}>
                                                    {loading ? "Locating..." : "Set location on map"}
                                                </Text>
                                            </View>
                                            <MaterialCommunityIcons name="chevron-right" size={mS(24)} color="#3B82F6" />
                                        </TouchableOpacity>

                                        {/* <ScrollView> */}
                                        {favoriteLocations?.length > 0 && (
                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                // marginTop: 10,
                                                marginBottom: vS(10)
                                            }}>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(12), fontWeight: '800', color: colors.secondaryText, letterSpacing: 1 }}>
                                                    FAVOURITES
                                                </Text>
                                                {/* <TouchableOpacity onPress={clearRecents}>
                                                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>
                                                                                Clear All
                                                                            </Text>
                                                                        </TouchableOpacity> */}
                                            </View>
                                        )}
                                        {favoriteLocations?.length === 0 ? (
                                            <View style={{
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: mS(40),
                                            }}>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: colors.secondaryText }}>No favorite places yet. Start searching to add some!</Text>
                                            </View>
                                        ) : (
                                            <View style={{
                                                flexDirection: 'row', // Align items horizontally
                                                flexWrap: 'wrap',     // Wrap to next line when full
                                                gap: mS(10),              // Space between cards (React Native 0.71+)
                                                padding: mS(10),
                                            }}>
                                                {favoriteLocations.map((item: SavedLocation, index: number) => (
                                                    <TouchableOpacity style={{
                                                        backgroundColor: colors.iconBox,
                                                        borderRadius: mS(12),
                                                        paddingHorizontal: hS(12),
                                                        paddingVertical: vS(8),
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        borderWidth: 1,
                                                        borderColor: colors.border,
                                                    }} key={item.id || index}
                                                        onPress={() => handleSelectFavourites(item)}
                                                    >
                                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{
                                                            fontSize: mS(14),
                                                            fontWeight: '600',
                                                            color: colors.text,
                                                            marginRight: hS(6),
                                                        }} numberOfLines={2}>
                                                            {item.showname ? item.showname : item.name}
                                                        </Text>
                                                        <TouchableOpacity
                                                            onPress={() => onToggleFavorite(item)}
                                                        >
                                                            <MaterialCommunityIcons
                                                                name={"heart"}
                                                                size={mS(20)}
                                                                color={"#FF0000"}
                                                            />
                                                        </TouchableOpacity>
                                                    </TouchableOpacity>
                                                ))}
                                                {localuser.favourite_places.length === 10 ? (
                                                    <View style={styles.limitReachedContainer}>
                                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.limitReachedText}>
                                                            Limit reached. Delete a favorite location to add a new one.
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        )}
                                        {/* </ScrollView> */}

                                        <CustomAlert
                                            visible={isAlertVisible}
                                            title={alertMode === 'remove' ? "Remove Favorite" : "Add Favorite"}
                                            message={
                                                alertMode === 'remove'
                                                    ? `Are you sure you want to remove "${selectedLocation?.name}" from your favorites?`
                                                    : `Do you want to save "${selectedLocation?.name}" to your favorite places?`
                                            }
                                            type={alertMode === 'remove' ? 'danger' : 'info'}
                                            confirmText={alertMode === 'remove' ? 'Remove' : 'Save'}
                                            onConfirm={confirmToggle} // Logic runs here
                                            onCancel={() => {
                                                setAlertVisible(false);
                                                setSelectedLocation(null); // Clean up
                                            }}
                                        />

                                        <CustomAlert
                                            visible={isContactAlertVisible}
                                            title="Remove Contact"
                                            message="Are you sure you want to remove this rider from your list?"
                                            confirmText="Delete"
                                            type="danger"
                                            onConfirm={() => {
                                                if (contactToDelete) {
                                                    deleteContact(contactToDelete);
                                                }
                                                setIsContactAlertVisible(false);
                                                setContactToDelete(null);
                                            }}
                                            onCancel={() => {
                                                setIsContactAlertVisible(false);
                                                setContactToDelete(null);
                                            }}
                                        />

                                        {/* RECENT LOCATIONS LIST */}

                                        {/* {!modalType && savedRecents.length > 0 && (
                                        <View style={{ flex: 1, paddingHorizontal: 20 }}>

                                            <View style={{
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: vS(20),
                                                marginBottom: vS(10)
                                            }}>
                                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(12), fontWeight: '800', color: '#94A3B8', letterSpacing: 1 }}>
                                                    RECENT
                                                </Text>
                                                <TouchableOpacity onPress={clearRecents}>
                                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(12), fontWeight: '700', color: '#2563EB' }}>
                                                        Clear All
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                            {/* <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}> */}

                                        {/* RECENT LIST ITEMS */}
                                        {/* {savedRecents.map((item) => (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    onPress={() => {
                                                        handleLocationSelect(item.name, item.address, item.lat, item.lng);
                                                        // onClose();
                                                    }}
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        paddingVertical: vS(12),
                                                        borderBottomWidth: 1,
                                                        borderBottomColor: '#F8FAFC'
                                                    }}
                                                >
                                                    <View style={{
                                                        width: hS(44), height: vS(44), borderRadius: mS(22),
                                                        backgroundColor: '#F1F5F9', alignItems: 'center',
                                                        justifyContent: 'center', marginRight: hS(15)
                                                    }}>
                                                        <MaterialCommunityIcons name="clock-outline" size={mS(22)} color="#64748B" />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(16), fontWeight: '700', color: '#1E293B' }}>
                                                            {item.name}
                                                        </Text>
                                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} numberOfLines={1} style={{ fontSize: mS(13), color: '#64748B', marginTop: vS(2) }}>
                                                            {item.address}
                                                        </Text>
                                                    </View>
                                                    <MaterialCommunityIcons name="chevron-right" size={mS(20)} color="#CBD5E1" />
                                                </TouchableOpacity>
                                            ))} */}
                                        {/* </ScrollView> */}
                                        {/* </View>
                                    )}  */}
                                    </>
                                )}
                            </View>
                        </View>
                        </ResponsiveContainer>
                    </ScrollView>
                </View>
            ) : (
                <View style={{
                    flex: 1,
                    // marginTop: insets.top 
                }}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setNext(false)}
                        style={[styles.compactHeader, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' }]}
                    >
                        <ImageBackground
                            source={require('../../assets/images/header_bg.jpg')}
                            style={{ paddingHorizontal: hS(16), paddingBottom: vS(16), paddingTop: insets.top + vS(10) }}
                            imageStyle={{ opacity: 0.78 }}
                        >
                            <View style={styles.compactHeaderTop}>
                                <View style={[styles.compactHeaderLeft, {
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : '#FFFFFF',
                                    paddingHorizontal: hS(12),
                                    paddingVertical: vS(8),
                                    borderRadius: mS(20),
                                    ...Platform.select({
                                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                        android: { elevation: 3 }
                                    })
                                }]}>
                                    <MaterialCommunityIcons name="arrow-left" size={mS(20)} color={colors.text} />
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.compactLabel, { color: colors.text, fontWeight: '700' }]}>BOOK FOR {selected.toUpperCase()}</Text>
                                </View>
                                <View style={[styles.editIconContainer, {
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : '#FFFFFF',
                                    borderColor: colors.border,
                                    borderWidth: isDark ? 1 : 0,
                                    ...Platform.select({
                                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
                                        android: { elevation: 3 }
                                    })
                                }]}>
                                    <MaterialCommunityIcons name="pencil" size={mS(16)} color={colors.text} />
                                </View>
                            </View>

                            <View style={styles.compactRow}>
                                <View style={[styles.locationContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.compactLabel, { color: colors.secondaryText }]}>FROM</Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} numberOfLines={1} style={[styles.compactValue, { color: colors.text }]}>{startLocation}</Text>
                                </View>
                                <MaterialCommunityIcons name="arrow-right" size={mS(20)} color={colors.secondaryText} />
                                <View style={[styles.locationContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.compactLabel, { color: colors.secondaryText }]}>TO</Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} numberOfLines={1} style={[styles.compactValue, { color: colors.text }]}>{destination}</Text>
                                </View>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>

                    <LocationSearchModal
                        isOpen={modalType !== null}
                        onClose={() => setModalType(null)}
                        onSelect={handleLocationSelect}
                        type={modalType || "start"}
                        advancebooking={advancebooking}
                        onSetNext={setNext}
                    />

                    <SelectionPage screenName={screenName} TripPayload={tripPayload} setTripPayload={setTripPayload} />
                </View>
            )}

            {showDatePicker && pickerMode === 'date' && (
                <DatePicker
                    mode="single"
                    visible={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    minDate={minimumSchedulingDate.toISOString().split('T')[0]}
                    maxDate={maximumSchedulingDate.toISOString().split('T')[0]}
                    onSelect={(d: string) => {
                        const dateParts = d.split('-');
                        const newDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                        handleDateTimeChange(newDate);
                        setShowDatePicker(false);
                    }}
                />
            )}

            {showDatePicker && pickerMode === 'time' && (
                <DateTimePickerComponent
                    value={scheduledDate || minimumSchedulingDate}
                    mode="time"
                    isVisible={showDatePicker}
                    onChange={handleDateTimeChange}
                    onClose={() => setShowDatePicker(false)}
                    minimumDate={minimumSchedulingDate}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // maincontainer: {
    //     flex: 1,
    //     backgroundColor: '#F8FAFC',
    //     paddingVertical: 20
    // },
    // container: {
    //     backgroundColor: '#FFFFFF',
    //     borderRadius: 20,
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 4 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 12,
    //     elevation: 5, // For Android shadow
    //     overflow: 'hidden',
    //     marginHorizontal: 16,
    //     marginTop: 14,
    // },
    // itemContainer: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     padding: 16,
    // },
    // iconCircle: {
    //     width: 44,
    //     height: 44,
    //     borderRadius: 22,
    //     alignItems: 'center',
    //     justifyContent: 'center',
    // },
    // primaryBg: {
    //     backgroundColor: '#32a852',
    // },
    // accentBg: {
    //     backgroundColor: '#EA4335',
    // },
    // textContainer: {
    //     flex: 1,
    //     marginLeft: 16,
    // },
    // label: {
    //     fontSize: 10,
    //     fontWeight: '600',
    //     color: '#64748B',
    //     letterSpacing: 1,
    //     marginBottom: 2,
    // },
    // value: {
    //     fontSize: 15,
    //     fontWeight: '500',
    //     color: '#1E293B',
    // },
    // placeholder: {
    //     color: '#94A3B8',
    // },
    // separatorWrapper: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     paddingHorizontal: 16,
    // },
    // dotColumn: {
    //     width: 44,
    //     alignItems: 'center',
    //     gap: 4,
    // },
    // dot: {
    //     width: 4,
    //     height: 4,
    //     borderRadius: 2,
    //     backgroundColor: '#E2E8F0',
    // },
    // line: {
    //     flex: 1,
    //     height: 1,
    //     backgroundColor: '#E2E8F0',
    //     marginLeft: 16,
    // },
    // addNewBtn: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     paddingVertical: 12,
    //     marginTop: 10,
    //     borderStyle: 'dashed',
    //     borderWidth: 1,
    //     borderColor: colors.button,
    //     borderRadius: 12,
    // },
    // addNewContainer: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     padding: 16,
    //     marginTop: 10,
    //     backgroundColor: '#F3F4F6',
    //     borderRadius: 12,
    //     borderStyle: 'dashed',
    //     borderWidth: 1.5,
    //     borderColor: colors.button
    // },
    // limitReachedContainer: {
    //     padding: 16,
    //     marginTop: 10,
    //     backgroundColor: '#FFFBEB',
    //     borderRadius: 12,
    //     alignItems: 'center',
    //     borderWidth: 1,
    //     borderColor: '#FEF3C7'
    // },
    // limitReachedText: {
    //     color: '#B45309',
    //     fontSize: 13,
    //     fontWeight: '500'
    // },
    // addNewText: {
    //     marginLeft: 12,
    //     color: colors.button,
    //     fontWeight: '700',
    //     fontSize: 16
    // },
    maincontainer: {
        flex: 1,
    },
    compactHeader: {
        paddingHorizontal: hS(16),
        paddingVertical: vS(16),
        borderBottomWidth: 1,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
            android: { elevation: 3 }
        })
    },
    compactHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vS(12),
    },
    compactHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(10),
    },
    compactLabel: {
        fontSize: mS(12),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    compactInfo: {
        marginLeft: hS(4),
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(10),
    },
    locationContainer: {
        flex: 1,
        borderWidth: 1,
        borderRadius: mS(10),
        paddingHorizontal: hS(12),
        paddingVertical: vS(8),
    },
    compactValue: {
        fontSize: mS(15),
        fontWeight: '600',
    },
    editIconContainer: {
        padding: mS(8),
        borderRadius: mS(10),
    },
    container: {
        borderRadius: mS(20),
        shadowOffset: { width: 0, height: vS(2) },
        shadowOpacity: 0.05,
        shadowRadius: mS(4),
        elevation: 2,
        overflow: 'visible', // Change overflow to visible to show shadows properly
        marginHorizontal: hS(16),
        backgroundColor: '#FFFFFF',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vS(10),
        paddingHorizontal: hS(20)
    },
    iconCircle: {
        width: hS(32),
        height: hS(32),
        borderRadius: hS(22),
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBg: {
        backgroundColor: '#10B981',
    },
    accentBg: {
        backgroundColor: '#EF4444',
    },
    textContainer: {
        flex: 1,
        marginLeft: hS(16),
    },
    label: {
        fontSize: mS(10),
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: vS(2),
    },
    value: {
        fontSize: mS(15),
        fontWeight: '600',
    },
    placeholder: {
        color: '#94A3B8',
    },
    separatorWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(20),
    },
    dotColumn: {
        width: hS(32),
        alignItems: 'center',
        gap: vS(4),
    },
    dot: {
        width: hS(4),
        height: hS(4),
        borderRadius: mS(2),
    },
    line: {
        flex: 1,
        height: 1.5,
        marginLeft: hS(16),
    },
    addNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: vS(12),
        marginTop: vS(10),
        borderStyle: 'dashed',
        borderWidth: 1,
        borderRadius: mS(12),
    },
    addNewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: hS(16),
        marginTop: vS(10),
        borderRadius: mS(12),
        borderStyle: 'dashed',
        borderWidth: 1.5,
    },
    limitReachedContainer: {
        padding: hS(16),
        marginTop: vS(10),
        borderRadius: mS(12),
        alignItems: 'center',
        borderWidth: 1,
    },
    limitReachedText: {
        fontSize: mS(13),
        fontWeight: '500'
    },
    addNewText: {
        marginLeft: hS(12),
        fontWeight: '700',
        fontSize: mS(16)
    }
});

export default LocationSearch;


