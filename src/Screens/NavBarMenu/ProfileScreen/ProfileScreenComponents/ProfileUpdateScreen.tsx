import { ActivityIndicator, Alert, Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, ToastAndroid, TouchableOpacity, TouchableWithoutFeedback, View, Image } from "react-native"
import { ResponsiveContainer } from "../../../../Components/ResponsiveContainer";
import { Text } from "../../../../Components"
import { Styles } from "../../../../lib/styles"
import Button from "../../../../Components/Button"
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';
import fonts from "../../../../constant/fonts";
import { useRoute } from "@react-navigation/native";
import colorsConstant from "../../../../constant/colors";
import { useAppTheme } from "../../../../hooks/useAppTheme";
import { useEffect, useState, useRef } from "react";
import BottomSheetInput from "../../../../Components/BottomSheetInput";
import { RootState } from '../../../../redux/store';
import { useDispatch, useSelector } from "react-redux";
import { skipToken } from '@reduxjs/toolkit/query';
import { updateUserStore } from "../../../../redux/userSlice";
import { useUpdateUserMutation, useGetUploadUrlMutation, useDeleteDocumentMutation } from "../../../../service/userApi";
import ImagePicker from "react-native-image-crop-picker";
import { useAddTrustedContactMutation, useRemoveTrustedContactMutation, useGetTrustedContactsQuery } from "../../../../service/sosApi";
import DateTimePickerComponent from "../../../../Components/DateTimePicker";
import RelationshipSelectionModal from "../../../../Components/RelationshipSelectionModal";
import { hS, mS, vS } from "../../../../lib/responsive";
import { ContactScreen_Nav } from "../../../../Navigations/navigations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Config from "react-native-config";



const ProfileUpdatescreen: React.FC<ScreenProps> = ({ navigation }) => {
    const { colors, isDark } = useAppTheme();
    const route = useRoute<any>();
    const [updateUser] = useUpdateUserMutation();
    const [getUploadUrl] = useGetUploadUrlMutation();
    const [deleteDocument] = useDeleteDocumentMutation();
    const [addTrustedContact] = useAddTrustedContactMutation();
    const [removeTrustedContact] = useRemoveTrustedContactMutation();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 100);

    const user = useSelector((state: RootState) => state.userSlice.user);

    const { data: serverContactsData, refetch: refetchContacts } = useGetTrustedContactsQuery(
        user?.id ? { userId: user.id } : skipToken
    );

    const BASE_URL = `${Config.DEV_BACKEND_URL}/api`;
    const proxiedImageSource = user?.profile_url ? (user.profile_url.startsWith('http') ? `${BASE_URL}/media/proxy?url=${encodeURIComponent(user.profile_url)}` : user.profile_url) : null;

    const [isUpdating, setIsUpdating] = useState(false);
    const [visible, setVisible] = useState(false);
    const [relationshipModalVisible, setRelationshipModalVisible] = useState(false);
    const [selectedContact, setSelectedContact] = useState<{ name: string, phone: string } | null>(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (!isUpdating) return;
            e.preventDefault();
            if (Platform.OS === 'android') {
                ToastAndroid.show('Please wait while information is updating...', ToastAndroid.SHORT);
            }
        });
        return unsubscribe;
    }, [navigation, isUpdating]);
    const [clickedLabel, setClickedLabel] = useState('')
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('')
    const [gender, setGender] = useState('');
    const [emergencyContacts, setEmergencyContacts] = useState<{ name: string, phone: string, relationship?: string }[]>([]);


    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (serverContactsData?.data && Array.isArray(serverContactsData.data)) {
            setEmergencyContacts(serverContactsData.data);
            AsyncStorage.setItem('@emergency_contacts', JSON.stringify(serverContactsData.data));
            dispatch(updateUserStore({ emergency_contacts: serverContactsData.data }));
        }
    }, [serverContactsData]);


    useEffect(() => {
        if (!user) return;
        if (user?.first_name) {
            setFirstName(user.first_name);
        }
        if (user.last_name) {
            setLastName(user.last_name);
        }
        if (user?.email) {
            setEmail(user.email);
        }
        if (user?.gender) {
            setGender(user.gender)
        }
        if (user?.emergency_contacts) {
            setEmergencyContacts(user.emergency_contacts)
        }
    }, [user]);


    useEffect(() => {
        setImageError(false);
    }, [user?.profile_url]);

    useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);


    const handleEditProfilePicture = async () => {
        try {
            const image = await ImagePicker.openPicker({
                width: 500,
                height: 500,
                cropping: true,
                cropperCircleOverlay: true,
                mediaType: 'photo',
            });
            const uri = image.path;
            const mimeType = image.mime || 'image/jpeg';

            setIsUpdating(true);

            if (user?.profile_url) {
                const oldFilename = user.profile_url.split('/').pop();
                if (oldFilename) {
                    try {
                        await deleteDocument({ userId: user.id, documentType: oldFilename }).unwrap();
                    } catch (e) { }
                }
            }

            const filename = uri.split('/').pop() || `profile_${Date.now()}`;
            const urlResponse = await getUploadUrl({
                userId: user.id,
                documentType: `profile_picture_${filename}`,
                contentType: mimeType,
            }).unwrap();

            const uploadUrl = urlResponse.data?.uploadUrl || urlResponse.data?.data?.uploadUrl;

            const responseFile = await fetch(uri);
            const imageBlob = await responseFile.blob();
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: imageBlob,
                headers: { 'Content-Type': mimeType },
            });
            if (!uploadResponse.ok) throw new Error("Upload failed");

            const publicUrl = uploadUrl.split('?')[0];
            const updateResponse = await updateUser({ id: user.id, profile_url: publicUrl }).unwrap();
            if (updateResponse.success) {
                dispatch(updateUserStore({ profile_url: publicUrl }));
                if (Platform.OS === 'android') ToastAndroid.show("Profile picture updated", ToastAndroid.SHORT);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsUpdating(false);
        }
    };

    if (!user) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }


    const formatDate = (date: any) => {
        const d = new Date(date);

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    };



    const formatDatePretty = (isoString: string) => {
        const d = new Date(isoString);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")
            }/${d.getFullYear()}`;
    };

    const buttons = [
        { id: 1, Label: 'Name', data: user.full_name, iconName: 'account-outline' },
        { id: 2, Label: 'Phone Number', data: user.phone_number, iconName: 'phone-outline' },
        { id: 3, Label: 'Email', data: user.email, iconName: 'email-outline' },
        { id: 4, Label: 'Gender', data: user.gender || 'Add gender', iconName: 'gender-male-female' },
        { id: 5, Label: 'Date of Birth', data: user.date_of_birth, iconName: 'cake-variant-outline' },
        { id: 6, Label: 'Account Since', data: formatDate(user.created_at), iconName: 'history' },
        { id: 7, Label: 'Emergency Contact', data: user.emergency_contacts || 'Add Emergency Contacts', iconName: 'phone-plus-outline' },
    ]


    const handleNameUpdate = async (firstName?: string, lastName?: string) => {
        setIsUpdating(true);
        try {
            const userId = user.id; // from context / redux / api call

            const payload = {
                id: userId,
                first_name: firstName,
                last_name: lastName,
            };


            const result = await updateUser(payload).unwrap();

            if (result.success) {
                dispatch(updateUserStore({ first_name: result.data.first_name, last_name: result.data.last_name, full_name: result.data.full_name }));
                ToastAndroid.show(result.message, ToastAndroid.SHORT);
            }
            else {
                ToastAndroid.show('Something Went Wrong!!!', ToastAndroid.SHORT);
            }

            setVisible(false);

        } catch (error) {
            ToastAndroid.show('Something Went Wrong!!!', ToastAndroid.SHORT);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleEmailUpdate = async (email: string) => {
        setIsUpdating(true);
        try {
            const userId = user.id; // from context / redux / api call

            const payload = {
                id: userId,
                email: email,
            };


            const result = await updateUser(payload).unwrap();

            if (result.success) {
                dispatch(updateUserStore(result.data));
                ToastAndroid.show(result.message, ToastAndroid.SHORT);
            }
            else {
                ToastAndroid.show('Something Went Wrong!!!', ToastAndroid.SHORT);
            }

            setVisible(false);

        } catch (error) {
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDobUpdate = async (selectedDate: Date) => {
        setIsUpdating(true);
        try {
            const userId = user.id;

            // const dob = formatDate(new Date(selectedDate));

            const d = new Date(selectedDate);
            const dob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;



            const payload = {
                id: userId,
                date_of_birth: dob,   // field name in DB
            };

            const result = await updateUser(payload).unwrap();

            // Update redux store

            if (result.success) {
                dispatch(updateUserStore(result.data));
                ToastAndroid.show(result.message, ToastAndroid.SHORT);
            }
            else {
                ToastAndroid.show('Something Went Wrong!!!', ToastAndroid.SHORT);
            } // adjust if your API returns different

            setClickedLabel("");

        } catch (error) {
        } finally {
            setIsUpdating(false);
        }
    };



    const handleGenderUpdate = async (gender: string) => {
        setIsUpdating(true);
        try {
            const userId = user.id; // from context / redux / api call

            const payload = {
                id: userId,
                gender: gender,
            };


            const result = await updateUser(payload).unwrap();

            if (result.success) {
                dispatch(updateUserStore(result.data));
                ToastAndroid.show(result.message, ToastAndroid.SHORT);
            }
            else {
                ToastAndroid.show('Something Went Wrong!!!', ToastAndroid.SHORT);
            }

            setVisible(false);

        } catch (error) {
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddEmergencyContact = () => {
        navigation.navigate(ContactScreen_Nav, {
            onSelectContact: async (SelectedContact: any) => {
                if (SelectedContact) {

                    const incomingPhone = SelectedContact.phone?.replace(/[^0-9]/g, '') || '';
                    const cleanphone = SelectedContact.phone?.replace(/\+91/g, '').replace(/[^0-9]/g, '');

                    const isDuplicate = emergencyContacts.some(contact => {
                        const existingPhone = contact.phone?.replace(/[^0-9]/g, '');
                        return existingPhone === cleanphone;
                    });

                    if (isDuplicate) {
                        Alert.alert("Already Added", `${SelectedContact.name} is already in your emergency list.`);
                        return;
                    }

                    setSelectedContact({
                        name: SelectedContact.name,
                        phone: cleanphone || 'No Number',
                    });
                    setRelationshipModalVisible(true);
                }
            },
        });
        // navigation.goBack();
    }

    const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);

    const handleEditContactRelationship = (index: number) => {
        setEditingContactIndex(index);
        setSelectedContact({
            name: (emergencyContacts || [])[index].name,
            phone: (emergencyContacts || [])[index].phone,
        });
        setRelationshipModalVisible(true);
    };

    const handleRelationshipSelect = async (relationship: string) => {
        if (!selectedContact) return;
        setIsUpdating(true);

        const newContact: any = {
            name: selectedContact.name,
            phone: selectedContact.phone,
            relationship: relationship,
        };

        const updatedList = [...(emergencyContacts || [])];
        let oldContact: any = null;
        if (editingContactIndex !== null) {
            oldContact = updatedList[editingContactIndex];
            if (oldContact.id) newContact.id = oldContact.id;
            updatedList[editingContactIndex] = newContact;
        } else {
            updatedList.push(newContact);
        }

        const cappedList = updatedList.slice(0, 5);
        try {
            const payload = {
                id: user.id,
                emergency_contacts: cappedList
            };

            const response = await updateUser(payload).unwrap();
            if (response.success) {
                dispatch(updateUserStore({ emergency_contacts: response.data.emergency_contacts }));
                ToastAndroid.show("Emergency contact updated successfully", ToastAndroid.SHORT);
            }

            const trustedcontacts = {
                id: user.id,
                name: newContact.name,
                phone: newContact.phone,
                relationship: newContact.relationship,
                user_type: 'customer'
            };

            try {
                if (editingContactIndex === null) {
                    await addTrustedContact(trustedcontacts).unwrap();
                } else {
                    if (oldContact && oldContact.id) {
                        await removeTrustedContact({ id: oldContact.id }).unwrap();
                    }
                    await addTrustedContact(trustedcontacts).unwrap();
                }
            } catch (err) {
                console.log(err, "error adding trusted contact");
            }

            refetchContacts();
            setEmergencyContacts(cappedList);
            await AsyncStorage.setItem('@emergency_contacts', JSON.stringify(cappedList));
        } catch (error) {
            ToastAndroid.show("Something Went Wrong!!! Try Later...", ToastAndroid.SHORT);
        } finally {
            setIsUpdating(false);
            setRelationshipModalVisible(false);
            setSelectedContact(null);
            setEditingContactIndex(null);
        }
    };

    const handleRemoveContact = (index: number) => {
        const contactName = emergencyContacts[index]?.name || "this contact";

        Alert.alert(
            "Remove Contact",
            `Are you sure you want to remove ${contactName} from your emergency list?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => performDelete(index) },
            ]
        );
    };

    const performDelete = async (index: number) => {
        const contactToDelete = emergencyContacts[index];
        const updatedList = (emergencyContacts || []).filter((_, i) => i !== index);

        try {
            const payload = {
                id: user.id,
                emergency_contacts: updatedList
            };

            const response = await updateUser(payload).unwrap();
            const serverContacts = response.data?.emergency_contacts || response.emergency_contacts;

            if (serverContacts) {
                dispatch(updateUserStore({ emergency_contacts: serverContacts }));
            }

            if (contactToDelete && (contactToDelete as any).id) {
                await removeTrustedContact({ id: (contactToDelete as any).id }).unwrap();
            }

            refetchContacts();
            setEmergencyContacts(updatedList);
            await AsyncStorage.setItem('@emergency_contacts', JSON.stringify(updatedList));
            ToastAndroid.show("Contact removed successfully", ToastAndroid.SHORT);
        } catch (error) {
            ToastAndroid.show("Something Went Wrong!!! Try Later...", ToastAndroid.SHORT);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? colors.background : '#F8FAFC' }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: vS(200) }}>
                <Svg height="100%" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <Path
                        fill={isDark ? 'rgba(30, 58, 138, 0.1)' : '#EBF4FF'}
                        d="M0,96L80,112C160,128,320,160,480,170.7C640,181,800,171,960,154.7C1120,139,1280,117,1360,106.7L1440,96L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
                    />
                </Svg>
            </View>

            <ResponsiveContainer>
            {/* Custom Header with back button */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: hS(20), paddingTop: insets.top + vS(10), paddingBottom: vS(10), zIndex: 10 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={isDark ? colors.text : '#0F172A'} />
                </TouchableOpacity>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(20), fontWeight: '700', color: isDark ? colors.text : '#0F172A', marginLeft: hS(16) }}>Profile</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: vS(30) }}
            >
                {/* --- CUSTOM HEADER (FROM SCREENSHOT) --- */}
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: hS(20), paddingTop: vS(10), paddingBottom: vS(10) }}>
                    <View style={{ width: mS(70), height: mS(70), borderRadius: mS(35), backgroundColor: isDark ? '#1E3A8A' : '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        {proxiedImageSource && !imageError ? (
                            <Image
                                source={{ uri: proxiedImageSource }}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <MaterialCommunityIcons name="account-outline" size={mS(36)} color={isDark ? '#60A5FA' : '#1E3A8A'} />
                        )}
                    </View>

                    <View style={{ flex: 1, marginLeft: hS(16) }}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(18), fontWeight: '800', color: isDark ? '#F8FAFC' : '#0F172A' }}>{user?.full_name || 'User'}</Text>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(12), color: isDark ? '#94A3B8' : '#64748B', marginTop: vS(2) }}>Member since</Text>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(13), fontWeight: '700', color: isDark ? '#F8FAFC' : '#0F172A' }}>{formatDate(user?.created_at)}</Text>
                    </View>

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#FFFFFF', paddingHorizontal: hS(12), paddingVertical: vS(6), borderRadius: mS(20), borderWidth: 1, borderColor: isDark ? '#38BDF8' : '#E2E8F0' }}
                        onPress={handleEditProfilePicture}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="pencil-outline" size={mS(14)} color={isDark ? '#38BDF8' : '#2563EB'} />
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(13), fontWeight: '600', color: isDark ? '#38BDF8' : '#2563EB', marginLeft: hS(4) }}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* --- Section: Personal Details --- */}
                <View style={styles.sectionHeader}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : colors.lightTextColor, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800', fontSize: mS(14) }]}>Personal Information</Text>
                </View>

                <View style={[
                    styles.cardContainer, 
                    { backgroundColor: isDark ? colors.card : '#FFFFFF' }, 
                    isDark && { shadowColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }
                ]}>
                    {buttons.slice(0, 5).map((item, index) => {
                        const isEditable = ['Name', 'Email', 'Date of Birth', 'Gender'].includes(item.Label);
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={isEditable ? 0.7 : 1}
                                style={[
                                    styles.actionRow,
                                    index === 0 && styles.firstRow,
                                    index === 4 && styles.lastRow,
                                    { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }
                                ]}
                                onPress={() => {
                                    if (isEditable) {
                                        setClickedLabel(item.Label);
                                        setVisible(true);
                                    }
                                }}
                            >
                                <View style={[styles.rowIconBox, { backgroundColor: isDark ? '#1E293B' : colors.iconBox }]}>
                                    <MaterialCommunityIcons
                                        name={item.iconName}
                                        size={mS(20)}
                                        color={isDark ? '#38BDF8' : colors.button}
                                    />
                                </View>

                                <View style={styles.rowContent}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.rowLabel, { color: isDark ? '#94A3B8' : colors.lightTextColor }]}>{item.Label}</Text>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[
                                        styles.rowValue,
                                        { color: isDark ? '#F8FAFC' : colors.text },
                                        !isEditable && { color: isDark ? '#94A3B8' : colors.lightTextColor }
                                    ]}>
                                        {item.Label === 'Date of Birth' ? formatDatePretty(item.data) : item.data}
                                    </Text>
                                </View>

                                <MaterialCommunityIcons name="chevron-right" size={mS(20)} color={isDark ? '#64748B' : colors.border} />
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* --- Section: Account Details --- */}
                <View style={styles.sectionHeader}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : colors.lightTextColor, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800', fontSize: mS(14) }]}>Account Details</Text>
                </View>

                <View style={[
                    styles.cardContainer, 
                    { backgroundColor: isDark ? colors.card : '#FFFFFF' }, 
                    isDark && { shadowColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }
                ]}>
                    {/* Account Since (Static) */}
                    <View style={[
                        styles.actionRow,
                        styles.firstRow,
                        styles.lastRow,
                        { borderBottomWidth: 0 }
                    ]}>
                        <View style={[styles.rowIconBox, { backgroundColor: isDark ? '#1E293B' : colors.iconBox }]}>
                            <MaterialCommunityIcons name="history" size={mS(20)} color={isDark ? '#38BDF8' : colors.button} />
                        </View>
                        <View style={styles.rowContent}>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.rowLabel, { color: isDark ? '#94A3B8' : colors.lightTextColor }]}>Account Since</Text>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.rowValue, { color: isDark ? '#F8FAFC' : colors.text }]}>{formatDate(user.created_at)}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={mS(20)} color={isDark ? '#64748B' : colors.border} />
                    </View>
                </View>

                {/* --- Section: Emergency Contacts --- */}
                <View style={styles.sectionHeader}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : colors.lightTextColor, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800', fontSize: mS(14) }]}>Emergency Contacts</Text>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sectionSubtitle, { color: isDark ? '#64748B' : colors.secondaryText }]}>Up to 5 trusted contacts</Text>
                </View>

                <View style={[
                    styles.cardContainer, 
                    { backgroundColor: isDark ? colors.card : '#FFFFFF' }, 
                    isDark && { shadowColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }
                ]}>
                    <View style={[styles.emergencyContainer, styles.firstRow, styles.lastRow]}>
                        <View style={styles.emergencyHeader}>
                            <View style={styles.emergencyIconTitle}>
                                <MaterialCommunityIcons name="phone-plus-outline" size={mS(20)} color={isDark ? '#38BDF8' : colors.button} />
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.rowLabel, { color: isDark ? '#F8FAFC' : colors.lightTextColor }]}>Emergency Contacts</Text>
                            </View>

                            <TouchableOpacity
                                disabled={emergencyContacts.length >= 5}
                                style={[
                                    styles.addBadge,
                                    { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' },
                                    emergencyContacts.length >= 5 && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.iconBox }
                                ]}
                                onPress={handleAddEmergencyContact}
                            >
                                <MaterialCommunityIcons
                                    name="plus"
                                    size={mS(16)}
                                    color={emergencyContacts.length >= 5 ? (isDark ? '#475569' : colors.border) : (isDark ? '#38BDF8' : colors.button)}
                                />
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[
                                    styles.addBadgeText,
                                    { color: isDark ? '#38BDF8' : colors.button },
                                    emergencyContacts.length >= 5 && { color: isDark ? '#475569' : colors.lightTextColor }
                                ]}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        {emergencyContacts.length > 0 ? (
                            <View style={styles.contactsList}>
                                {emergencyContacts.map((contact, idx) => (
                                    <View
                                        key={idx}
                                        style={[styles.contactItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'transparent' }]}
                                    >
                                        <View style={[styles.contactAvatar, { backgroundColor: isDark ? '#3B82F6' : colors.button }]}>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.contactInitial}>{contact.name.charAt(0)}</Text>
                                        </View>
                                        <View style={styles.contactInfo}>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.contactName, { color: isDark ? '#F8FAFC' : colors.text }]}>{contact.name}</Text>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.contactPhone, { color: isDark ? '#94A3B8' : colors.lightTextColor }]}>{contact.phone}</Text>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.contactRelationshipText, { color: isDark ? '#94A3B8' : colors.lightTextColor }]}>
                                                <MaterialCommunityIcons name="family-tree" size={mS(12)} /> {contact.relationship}
                                            </Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: hS(8) }}>
                                            <TouchableOpacity
                                                activeOpacity={0.6}
                                                onPress={() => handleEditContactRelationship(idx)}
                                                style={{ padding: mS(6), backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF', borderRadius: mS(8) }}
                                            >
                                                <MaterialCommunityIcons name="pencil-outline" size={mS(18)} color={isDark ? '#38BDF8' : colors.button} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                activeOpacity={0.6}
                                                onPress={() => handleRemoveContact(idx)}
                                                style={{ padding: mS(6), backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', borderRadius: mS(8) }}
                                            >
                                                <MaterialCommunityIcons name="trash-can-outline" size={mS(18)} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.noContactsBox}>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.noContactsText, { color: isDark ? '#64748B' : colors.lightTextColor }]}>No emergency contacts added yet.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
            </ResponsiveContainer>

            {/* --- Modals / Bottom Sheets --- */}
            {clickedLabel === 'Name' &&
                <BottomSheetInput
                    visible={visible}
                    label="Edit Name"
                    fields={[
                        {
                            key: "firstName",
                            placeholder: "First Name",
                            value: firstName,
                            icon: "account"
                        },
                        {
                            key: "lastName",
                            placeholder: "Last Name",
                            value: lastName,
                            icon: "account"
                        }
                    ]}
                    onChange={(key, value) => {
                        if (key === "firstName") setFirstName(value);
                        if (key === "lastName") setLastName(value);
                    }}
                    onSave={() => handleNameUpdate(firstName, lastName)}
                    onClose={() => setVisible(false)}
                    backgroundColor={colors.background}
                />
            }

            {clickedLabel === 'Email' &&
                <BottomSheetInput
                    visible={visible}
                    label="Edit Email"
                    fields={[
                        {
                            key: "email",
                            placeholder: "Email",
                            value: email,
                            icon: "account"
                        }
                    ]}
                    onChange={(key, value) => {
                        if (key === "email") setEmail(value);
                    }}
                    onSave={() => handleEmailUpdate(email)}
                    onClose={() => setVisible(false)}
                    backgroundColor={colors.background}
                />
            }

            {clickedLabel === 'Gender' && (
                <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
                    <Pressable style={localStyles.modalOverlay} onPress={() => setVisible(false)}>
                        <Animated.View
                            style={[
                                localStyles.genderSheet,
                                { backgroundColor: colors.background }
                            ]}
                        >
                            <View style={localStyles.dragHandle} />
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.genderSheetTitle, { color: colors.text }]}>Select Gender</Text>

                            <View style={localStyles.optionsWrapper}>
                                {['Male', 'Female', 'Other'].map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        activeOpacity={0.7}
                                        style={[
                                            localStyles.genderOption,
                                            { backgroundColor: colors.card, borderColor: colors.border },
                                            gender === option.toLowerCase() && { borderColor: isDark ? colors.primary : colors.button, backgroundColor: isDark ? colors.iconBox : '#F8FAFC' }
                                        ]}
                                        onPress={() => setGender(option.toLowerCase())}
                                    >
                                        <View style={localStyles.optionLabelGroup}>
                                            <View style={[
                                                localStyles.optionIconBox,
                                                { backgroundColor: colors.iconBox },
                                                gender === option.toLowerCase() && { backgroundColor: isDark ? colors.background : '#EFF6FF' }
                                            ]}>
                                                <MaterialCommunityIcons
                                                    name={option === 'Male' ? 'gender-male' : option === 'Female' ? 'gender-female' : 'gender-non-binary'}
                                                    size={mS(22)}
                                                    color={gender === option.toLowerCase() ? isDark ? colors.primary : colors.button : colors.lightTextColor}
                                                />
                                            </View>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[
                                                localStyles.optionText,
                                                { color: colors.text },
                                                gender === option.toLowerCase() && { color: isDark ? colors.primary : colors.button, fontWeight: '800' }
                                            ]}>
                                                {option}
                                            </Text>
                                        </View>

                                        <View style={[
                                            localStyles.customRadio,
                                            { borderColor: colors.border },
                                            gender === option.toLowerCase() && { borderColor: isDark ? colors.primary : colors.button }
                                        ]}>
                                            {gender === option.toLowerCase() && <View style={[localStyles.radioDot, { backgroundColor: isDark ? colors.primary : colors.button }]} />}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[localStyles.genderSaveBtn, { backgroundColor: isDark ? colors.primary : colors.button, shadowColor: isDark ? colors.primary : colors.button }]}
                                onPress={() => {
                                    handleGenderUpdate(gender);
                                    setVisible(false);
                                }}
                            >
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={localStyles.genderSaveBtnText}>Save Changes</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </Pressable>
                </Modal>
            )}

            {clickedLabel === 'Date of Birth' &&
                <DateTimePickerComponent
                    value={new Date()}
                    mode={'date'}
                    isVisible={clickedLabel === 'Date of Birth'}
                    onChange={handleDobUpdate}
                    onClose={() => setClickedLabel('')}
                    maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
                    minimumDate={minDate}
                />
            }

            {/* --- UPDATING OVERLAY --- */}
            {isUpdating && (
                <Modal transparent={true} animationType="fade" visible={isUpdating} statusBarTranslucent navigationBarTranslucent onRequestClose={() => { }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <View style={{ backgroundColor: colors.card, padding: hS(24), borderRadius: mS(16), alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ marginTop: vS(12), color: colors.text, fontSize: mS(16), fontWeight: '600' }}>Updating information...</Text>
                        </View>
                    </View>
                </Modal>
            )}

            <RelationshipSelectionModal
                visible={relationshipModalVisible}
                onClose={() => setRelationshipModalVisible(false)}
                contact={selectedContact}
                onSelectRelationship={handleRelationshipSelect}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    sectionHeader: {
        marginTop: vS(16),
        marginHorizontal: hS(20),
        marginBottom: vS(4),
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: mS(14),
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionSubtitle: {
        fontSize: mS(11),
        color: '#94A3B8',
        fontWeight: '500',
    },
    cardContainer: {
        marginHorizontal: hS(16),
        backgroundColor: '#FFFFFF',
        borderRadius: mS(16),
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vS(12),
        paddingHorizontal: hS(14),
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    firstRow: {
        borderTopLeftRadius: mS(16),
        borderTopRightRadius: mS(16),
    },
    lastRow: {
        borderBottomWidth: 0,
        borderBottomLeftRadius: mS(16),
        borderBottomRightRadius: mS(16),
    },
    disabledRow: {
        backgroundColor: '#F8FAFC',
    },
    rowIconBox: {
        width: mS(36),
        height: mS(36),
        borderRadius: mS(10),
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowContent: {
        flex: 1,
        marginLeft: hS(12),
    },
    rowLabel: {
        fontSize: mS(12),
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 0,
    },
    rowValue: {
        fontSize: mS(14),
        color: '#334155',
        fontWeight: '700',
    },
    disabledText: {
        color: '#94A3B8',
    },
    emergencyContainer: {
        padding: hS(12),
    },
    emergencyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vS(12),
    },
    emergencyIconTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: hS(10),
    },
    addBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: hS(10),
        paddingVertical: vS(4),
        borderRadius: mS(16),
        gap: hS(4),
    },
    addBadgeDisabled: {
        backgroundColor: '#F1F5F9',
    },
    addBadgeText: {
        fontSize: mS(12),
        fontWeight: '700',
        color: colorsConstant.button,
    },
    addBadgeTextDisabled: {
        color: '#94A3B8',
    },
    contactsList: {
        gap: vS(8),
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: mS(10),
        borderRadius: mS(10),
    },
    contactAvatar: {
        width: mS(34),
        height: mS(34),
        borderRadius: mS(17),
        backgroundColor: colorsConstant.button,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInitial: {
        color: 'white',
        fontWeight: '800',
        fontSize: mS(14),
    },
    contactInfo: {
        marginLeft: hS(12),
        flex: 1,
    },
    contactName: {
        fontSize: mS(14),
        fontWeight: '700',
        color: '#334155',
    },
    contactPhone: {
        fontSize: mS(12),
        color: '#64748B',
        marginTop: vS(2),
    },
    contactRelationshipText: {
        fontSize: mS(12),
        color: '#94A3B8',
        marginTop: vS(2),
        fontWeight: '500',
        fontStyle: 'italic',
    },
    noContactsBox: {
        paddingVertical: vS(20),
        alignItems: 'center',
    },
    noContactsText: {
        color: '#94A3B8',
        fontSize: mS(14),
        fontStyle: 'italic',
    },
});

export default ProfileUpdatescreen;

const localStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    genderSheet: {
        borderTopLeftRadius: mS(32),
        borderTopRightRadius: mS(32),
        paddingHorizontal: hS(24),
        paddingBottom: vS(40),
        paddingTop: vS(12),
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    dragHandle: {
        width: hS(40),
        height: vS(5),
        backgroundColor: '#E2E8F0',
        borderRadius: mS(10),
        alignSelf: 'center',
        marginBottom: vS(24),
    },
    genderSheetTitle: {
        fontSize: mS(20),
        fontWeight: '800',
        // color: '#1E293B',
        marginBottom: vS(20),
    },
    optionsWrapper: {
        gap: vS(12),
    },
    genderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: mS(14),
        borderRadius: mS(16),
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    activeOption: {
        borderColor: colorsConstant.button,
        backgroundColor: '#F8FAFC',
    },
    optionLabelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIconBox: {
        width: mS(44),
        height: mS(44),
        borderRadius: mS(12),
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: hS(14),
    },
    optionText: {
        fontSize: mS(16),
        fontWeight: '600',
        color: '#475569',
    },
    customRadio: {
        height: mS(22),
        width: mS(22),
        borderRadius: mS(11),
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioDot: {
        height: mS(10),
        width: mS(10),
        borderRadius: mS(5),
        backgroundColor: colorsConstant.button,
    },
    genderSaveBtn: {
        backgroundColor: colorsConstant.button,
        marginTop: vS(24),
        height: vS(60),
        borderRadius: mS(20),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colorsConstant.button,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    genderSaveBtnText: {
        color: '#FFF',
        fontSize: mS(17),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});