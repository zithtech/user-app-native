import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ToastAndroid,
    ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContactPicker } from '../../../../../hooks/useContacts';
import colors from '../../../../../constant/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../../redux/store';
import { useUpdateUserMutation } from '../../../../../service/userApi';
import { updateUserStore } from '../../../../../redux/userSlice';
import { hS, mS, vS } from '../../../../../lib/responsive';
import { ContactScreen_Nav } from '../../../../../Navigations/navigations';
import { useAppTheme } from "../../../../../hooks/useAppTheme";
import RelationshipSelectionModal from '../../../../../Components/RelationshipSelectionModal';
import { useAddTrustedContactMutation, useGetTrustedContactsQuery, useRemoveTrustedContactMutation } from '../../../../../service/sosApi';
import { skipToken } from '@reduxjs/toolkit/query';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Mask, Image as SvgImage } from 'react-native-svg';
import { Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// const WhiteWave = ({ color }: { color: string }) => (
//     <Svg width="100%" height={mS(50)} style={{ position: 'absolute', bottom: -1, left: 0, zIndex: 10 }} viewBox="0 0 375 50" preserveAspectRatio="none">
//         <Path d="M0,50 L0,0 C 150,50 250,50 375,35 L375,50 Z" fill={color} />
//     </Svg>
// );
// const BannerWaves = () => (
//     <>
//         {/* Light blue back wave */}
//         <Svg
//             width="100%"
//             height={mS(55)}
//             style={{
//                 position: 'absolute',
//                 bottom: -1,
//                 left: 0,
//                 zIndex: 8,
//             }}
//             viewBox="0 0 375 55"
//             preserveAspectRatio="none"
//         >
//             <Path
//                 d="
//           M 0 10
//           C 80 35, 145 50, 225 42
//           C 290 36, 330 18, 375 15
//           L 375 55
//           L 0 55
//           Z
//         "
//                 fill="#DCEEFF"
//             />
//         </Svg>

//         {/* Main white wave */}
//         <Svg
//             width="100%"
//             height={mS(48)}
//             style={{
//                 position: 'absolute',
//                 bottom: -1,
//                 left: 0,
//                 zIndex: 9,
//             }}
//             viewBox="0 0 375 48"
//             preserveAspectRatio="none"
//         >
//             <Path
//                 d="
//           M 0 0
//           C 70 30, 135 48, 215 42
//           C 280 38, 330 20, 375 17
//           L 375 48
//           L 0 48
//           Z
//         "
//                 fill="#F7FAFC"
//             />
//         </Svg>
//     </>
// );
const BannerWaves = ({ isDark, appColors }: { isDark?: boolean, appColors?: any }) => {
    return (
        <>
            {/* Light blue outer wave */}
            <Svg
                width="100%"
                height={mS(65)}
                viewBox="0 0 375 65"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    zIndex: 8,
                }}
            >
                <Path
                    d="
            M 0 0
            C 55 25, 120 55, 195 52
            C 270 50, 320 20, 375 12
            L 375 65
            L 0 65
            Z
          "
                    fill={isDark ? '#1E293B' : '#DCEEFF'}
                />
            </Svg>

            {/* White inner wave */}
            <Svg
                width="100%"
                height={mS(52)}
                viewBox="0 0 375 52"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    zIndex: 9,
                }}
            >
                <Path
                    d="
            M 0 0
            C 60 28, 125 48, 200 46
            C 270 44, 325 16, 375 10
            L 375 52
            L 0 52
            Z
          "
                    fill={isDark && appColors ? appColors.background : '#FFFFFF'}
                />
            </Svg>
        </>
    );
};
export interface EmergencyContact {
    name: string;
    phone: string;
    relationship: string;
}

const RELATIONSHIP_SUGGESTIONS = [
    'Mother',
    'Father',
    'Sister',
    'Brother',
    'Spouse',
    'Friend',
    'Colleague',
    'Guardian',
];

const SafetyScreen = ({ navigation }: any) => {
    const { pickContact, loading } = useContactPicker();
    const localuser = useSelector((state: RootState) => state?.userSlice?.user);
    const dispatch = useDispatch()
    const [updateUser] = useUpdateUserMutation();
    const [addTrustedContact] = useAddTrustedContactMutation();
    const [removeTrustedContact] = useRemoveTrustedContactMutation();
    const insets = useSafeAreaInsets()
    const { colors: appColors, isDark } = useAppTheme();
    const { data: serverContactsData, refetch: refetchContacts } = useGetTrustedContactsQuery(
        localuser?.id ? { userId: localuser.id } : skipToken
    );;

    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
    const [pickerloading, setpickerLoading] = useState(false);
    const [relationshipModalVisible, setRelationshipModalVisible] = useState(false);
    const [selectedContact, setSelectedContact] = useState<{ name: string; phone: string } | null>(null);

    if (!localuser) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: appColors.background }}>
                <ActivityIndicator size="large" color={colors.button} />
            </View>
        );
    }
    console.log(serverContactsData?.data, "serverContactsData")
    useEffect(() => {
        loadSavedContacts();
    }, []);

    // Sync with Redux store (primary ground truth for display)
    useEffect(() => {
        if (localuser?.emergency_contacts && Array.isArray(localuser.emergency_contacts)) {
            setEmergencyContacts(localuser.emergency_contacts);
            AsyncStorage.setItem('@emergency_contacts', JSON.stringify(localuser.emergency_contacts));
        }
    }, [localuser?.emergency_contacts]);

    // Sync with Server (source of truth for data integrity)
    useEffect(() => {
        if (serverContactsData?.data && Array.isArray(serverContactsData.data)) {
            setEmergencyContacts(serverContactsData.data);
            AsyncStorage.setItem('@emergency_contacts', JSON.stringify(serverContactsData.data));
            // Also sync back to Redux if different
            dispatch(updateUserStore({ emergency_contacts: serverContactsData.data }));
        }
    }, [serverContactsData]);

    const loadSavedContacts = async () => {
        const saved = await AsyncStorage.getItem('@emergency_contacts');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setEmergencyContacts(parsed);
            } catch (e) {
                console.error("Error parsing saved contacts", e);
            }
        }
    };

    const openContactPicker = async () => {
        if ((emergencyContacts || []).length >= 5) {
            Alert.alert(
                "Limit Reached",
                "You can only add up to 5 emergency contacts. Please remove one to add a new one."
            );
            return;
        }
        setpickerLoading(true);

        navigation.navigate(ContactScreen_Nav, {
            onSelectContact: async (SelectedContact: any) => {
                if (SelectedContact) {
                    const cleanphone = SelectedContact.phone?.replace(/\+91/g, '').replace(/[^0-9]/g, '');

                    const isDuplicate = (emergencyContacts || []).some(contact => {
                        const existingPhone = contact.phone?.replace(/[^0-9]/g, '');
                        const incomingPhone = cleanphone?.replace(/[^0-9]/g, '');
                        return existingPhone === incomingPhone;
                    });

                    if (isDuplicate) {
                        Alert.alert("Already Added", `${SelectedContact.name} is already in your emergency list.`);
                        setpickerLoading(false);
                        return;
                    }

                    // Store contact and show relationship modal
                    setSelectedContact({
                        name: SelectedContact.name,
                        phone: cleanphone || 'No Number',
                    });
                    setRelationshipModalVisible(true);
                }
                setpickerLoading(false);
            },
        });
    };

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

        try {
            const payload = {
                id: localuser.id,
                emergency_contacts: updatedList
            };

            const response = await updateUser(payload).unwrap();
            if (response.success) {
                dispatch(updateUserStore({ emergency_contacts: response.data.emergency_contacts }));
                ToastAndroid.show("Emergency contact updated successfully", ToastAndroid.SHORT);
            }

            const trustedcontacts = {
                id: localuser.id,
                name: newContact.name,
                phone: newContact.phone,
                relationship: newContact.relationship,
                user_type: 'customer'
            }

            if (editingContactIndex === null) {
                await addTrustedContact(trustedcontacts).unwrap();
            } else {
                if (oldContact && oldContact.id) {
                    await removeTrustedContact({ id: oldContact.id }).unwrap();
                }
                await addTrustedContact(trustedcontacts).unwrap();
            }

            refetchContacts();
            setEmergencyContacts(updatedList);
            await AsyncStorage.setItem('@emergency_contacts', JSON.stringify(updatedList));
        } catch (error) {
            ToastAndroid.show("Something Went Wrong!!! Try Later...", ToastAndroid.SHORT);
        } finally {
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
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => performDelete(index),
                },
            ]
        );
    };

    const performDelete = async (index: number) => {
        const contactToDelete = emergencyContacts[index];
        const updatedList = (emergencyContacts || []).filter((_, i) => i !== index);

        try {
            const payload = {
                id: localuser.id,
                emergency_contacts: updatedList
            };

            const response = await updateUser(payload).unwrap();
            const serverContacts = response.data?.emergency_contacts || response.emergency_contacts;

            if (serverContacts) {
                dispatch(updateUserStore({ emergency_contacts: serverContacts }));
            }

            // Also remove from trusted_contacts table if ID exists
            if (contactToDelete && (contactToDelete as any).id) {
                await removeTrustedContact({ id: (contactToDelete as any).id }).unwrap();
            }

            setEmergencyContacts(updatedList);
            await AsyncStorage.setItem('@emergency_contacts', JSON.stringify(updatedList));
            ToastAndroid.show("Contact removed successfully", ToastAndroid.SHORT);
        } catch (error) {
            ToastAndroid.show("Something Went Wrong!!! Try Later...", ToastAndroid.SHORT);
        }
    };

    const ContactAvatar = ({ name }: { name: string }) => {
        const initials = name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        return (
            <View style={[styles.avatarBox, { backgroundColor: isDark ? '#334155' : appColors.iconBox }]}>
                <Text style={[styles.avatarText, { color: isDark ? '#93C5FD' : appColors.button }]}>{initials}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? appColors.background : appColors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + vS(40) }}
            >
                {/* --- PREMIUM HEADER --- */}
                <View style={[styles.premiumHeader, { paddingTop: insets.top, height: mS(260) + insets.top }]}>
                    {/* Gradient Dark Blue Background */}
                    <Svg style={StyleSheet.absoluteFill}>
                        <Defs>
                            <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#0B309B" />
                                <Stop offset="1" stopColor="#051340" />
                            </LinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
                    </Svg>
                    <View style={styles.customHeader}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={mS(24)} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.customHeaderTitle}>Safety Toolkit</Text>
                    </View>

                    <View style={styles.headerContent}>
                        <View style={[styles.headerImageContainer, { zIndex: 1 }]}>
                            {/* True Alpha Mask to smoothly fade the image itself into transparency */}
                            <Svg style={StyleSheet.absoluteFill}>
                                <Defs>
                                    <LinearGradient id="alphaFade" x1="0" y1="0" x2="1" y2="0">
                                        <Stop offset="0" stopColor="white" stopOpacity="0" />
                                        <Stop offset="0.4" stopColor="white" stopOpacity="1" />
                                    </LinearGradient>
                                    <Mask id="fadeMask">
                                        <Rect x="0" y="0" width="100%" height="100%" fill="url(#alphaFade)" />
                                    </Mask>
                                </Defs>
                                <SvgImage
                                    href={require('../../../../../assets/png/SafetyScreenBanner.png')}
                                    width="100%"
                                    height="100%"
                                    preserveAspectRatio="xMaxYMax slice"
                                    mask="url(#fadeMask)"
                                />
                            </Svg>

                            <Image source={require('../../../../../assets/png/t2drive_safety_shield_transparent_hd.png')} style={styles.shieldImage} resizeMode="contain" />
                        </View>

                        <View style={[styles.headerTextContainer, { zIndex: 2 }]}>
                            <Text style={styles.premiumTitle}>Your Safety,{'\n'}Our Priority</Text>
                            <Text style={styles.premiumSubtitle}>
                                Ride with confidence. We're here{'\n'}to keep you safe, always.
                            </Text>
                        </View>
                    </View>

                    {/* <WhiteWave color={appColors.background} /> */}
                    <BannerWaves isDark={isDark} appColors={appColors} />
                </View>

                {/* --- EMERGENCY CONTACTS SECTION --- */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {isDark && <MaterialCommunityIcons name="shield-check-outline" size={mS(18)} color="#38BDF8" style={{ marginRight: hS(6) }} />}
                                <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : appColors.text }]}>Emergency Contacts</Text>
                            </View>
                            <Text style={[styles.sectionSubtitle, { color: isDark ? '#94A3B8' : appColors.secondaryText }]}>Up to 5 trusted contacts</Text>
                        </View>
                        <TouchableOpacity
                            disabled={(emergencyContacts || []).length >= 5 || pickerloading}
                            onPress={openContactPicker}
                            activeOpacity={0.7}
                            style={[
                                styles.addIconButton,
                                { backgroundColor: isDark ? '#003366' : '#EFF6FF' },
                                (emergencyContacts.length >= 5 || pickerloading) && { opacity: 0.5 }
                            ]}
                        >
                            {pickerloading ? (
                                <ActivityIndicator size="small" color="#3B82F6" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="plus" size={mS(18)} color={isDark ? '#38BDF8' : "#3B82F6"} />
                                    <Text style={[styles.addBtnText, { color: isDark ? '#38BDF8' : '#3B82F6' }]}>Add</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.cardWrapper, { backgroundColor: isDark ? appColors.card : appColors.card, shadowColor: 'transparent', borderColor: isDark ? 'rgba(255,255,255,0.02)' : appColors.border, borderWidth: 1 }]}>
                        {emergencyContacts.length === 0 ? (
                            <TouchableOpacity
                                activeOpacity={0.6}
                                onPress={openContactPicker}
                                style={styles.emptyStateBox}
                            >
                                <MaterialCommunityIcons name="account-plus-outline" size={mS(32)} color={isDark ? '#64748B' : appColors.secondaryText} />
                                <Text style={[styles.emptyStateText, { color: isDark ? '#F8FAFC' : appColors.text }]}>No emergency contacts added yet.</Text>
                                <Text style={[styles.emptyStateSubtext, { color: isDark ? '#94A3B8' : appColors.secondaryText }]}>Tap to add your first contact</Text>
                            </TouchableOpacity>
                        ) : (
                            (emergencyContacts || []).map((item, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.contactActionRow,
                                        { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : appColors.border },
                                        index === emergencyContacts.length - 1 && { borderBottomWidth: 0 }
                                    ]}
                                >
                                    <View style={[styles.avatarBox, { backgroundColor: isDark ? '#0066FF' : colors.button, width: mS(36), height: mS(36), borderRadius: mS(18), justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: mS(16) }}>{item.name.charAt(0)}</Text>
                                    </View>
                                    <View style={[styles.contactInfo, { flex: 1, marginLeft: hS(12) }]}>
                                        <Text style={[styles.contactNameText, { color: isDark ? '#F8FAFC' : appColors.text }]}>{item.name}</Text>
                                        <Text style={[styles.contactPhoneText, { color: isDark ? '#94A3B8' : appColors.secondaryText }]}>{item.phone}</Text>
                                        <Text style={[styles.contactRelationshipText, { color: isDark ? '#94A3B8' : appColors.secondaryText }]}>
                                            <MaterialCommunityIcons name="account-outline" size={mS(12)} /> {item.relationship}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity
                                            activeOpacity={0.5}
                                            onPress={() => handleEditContactRelationship(index)}
                                            style={[styles.deleteAction, { backgroundColor: isDark ? '#001F3F' : '#EFF6FF', padding: mS(6), borderRadius: mS(6), marginRight: hS(8) }]}
                                        >
                                            <MaterialCommunityIcons name="pencil-outline" size={mS(18)} color={isDark ? '#00BFFF' : "#3B82F6"} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            activeOpacity={0.5}
                                            onPress={() => handleRemoveContact(index)}
                                            style={[styles.deleteAction, { backgroundColor: isDark ? '#3F0000' : '#FEF2F2', padding: mS(6), borderRadius: mS(6) }]}
                                        >
                                            <MaterialCommunityIcons name="trash-can-outline" size={mS(18)} color={isDark ? '#FF3333' : '#EF4444'} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* --- QUICK SAFETY ACTIONS SECTION --- */}
                <View style={styles.sectionContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isDark && <MaterialCommunityIcons name="lightning-bolt" size={mS(20)} color="#38BDF8" style={{ marginRight: hS(6), marginBottom: vS(10) }} />}
                        <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : appColors.text }]}>Quick Safety Actions</Text>
                    </View>

                    <View style={styles.quickActionsRow}>
                        <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: isDark ? appColors.card : '#FEF2F2', borderColor: isDark ? 'rgba(255,255,255,0.02)' : 'transparent', borderWidth: 1 }]} activeOpacity={0.7}>
                            <View style={[styles.actionIconBox, { backgroundColor: isDark ? '#3F0000' : '#EF4444' }]}>
                                <MaterialCommunityIcons name="phone" size={mS(24)} color={isDark ? '#FF4D4D' : "#FFF"} />
                            </View>
                            <Text style={[styles.actionTitle, { color: isDark ? '#FF4D4D' : '#EF4444' }]}>SOS</Text>
                            <Text style={[styles.actionSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Call Emergency</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: isDark ? appColors.card : '#EFF6FF', borderColor: isDark ? 'rgba(255,255,255,0.02)' : 'transparent', borderWidth: 1 }]} activeOpacity={0.7}>
                            <View style={[styles.actionIconBox, { backgroundColor: isDark ? '#001F3F' : '#3B82F6' }]}>
                                <MaterialCommunityIcons name="map-marker-account" size={mS(24)} color={isDark ? '#00BFFF' : "#FFF"} />
                            </View>
                            <Text style={[styles.actionTitle, { color: isDark ? '#00BFFF' : '#3B82F6' }]}>Share Trip</Text>
                            <Text style={[styles.actionSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Share Live Location</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.quickActionCard, { backgroundColor: isDark ? appColors.card : '#FFFBEB', borderColor: isDark ? 'rgba(255,255,255,0.02)' : 'transparent', borderWidth: 1 }]} activeOpacity={0.7}>
                            <View style={[styles.actionIconBox, { backgroundColor: isDark ? '#3F3F00' : '#F59E0B' }]}>
                                <MaterialCommunityIcons name="shield-alert" size={mS(24)} color={isDark ? '#FFCC00' : "#FFF"} />
                            </View>
                            <Text style={[styles.actionTitle, { color: isDark ? '#FFCC00' : '#F59E0B' }]}>Report Issue</Text>
                            <Text style={[styles.actionSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Get Help</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- SAFETY GUIDANCE SECTION --- */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderRow}>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {isDark && <MaterialCommunityIcons name="shield-check-outline" size={mS(18)} color="#38BDF8" style={{ marginRight: hS(6) }} />}
                                <Text style={[styles.sectionTitle, { color: isDark ? '#F8FAFC' : appColors.text }]}>Safety Guidance</Text>
                            </View>
                            <Text style={[styles.sectionSubtitle, { color: isDark ? '#94A3B8' : appColors.secondaryText }]}>Tips for a safer journey</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.guidanceCard, { backgroundColor: isDark ? appColors.card : appColors.card, shadowColor: 'transparent', borderColor: isDark ? 'rgba(255,255,255,0.02)' : appColors.border, borderWidth: 1 }]} activeOpacity={0.7}>
                        <View style={[styles.guideIconBox, { backgroundColor: isDark ? '#003F1F' : '#ECFDF5' }]}>
                            <MaterialCommunityIcons name="shield-check" size={mS(24)} color={isDark ? '#00FF7F' : "#10B981"} />
                        </View>
                        <View style={styles.guideContent}>
                            <Text style={[styles.guideTitle, { color: isDark ? '#F8FAFC' : appColors.text }]}>Verify Your Ride</Text>
                            <Text style={[styles.guideDescription, { color: isDark ? '#94A3B8' : appColors.secondaryText }]}>Check vehicle plate and driver's photo before getting in.</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={mS(20)} color={isDark ? '#64748B' : appColors.secondaryText} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.guidanceCard, { backgroundColor: isDark ? appColors.card : appColors.card, shadowColor: 'transparent', borderColor: isDark ? 'rgba(255,255,255,0.02)' : appColors.border, borderWidth: 1 }]} activeOpacity={0.7}>
                        <View style={[styles.guideIconBox, { backgroundColor: isDark ? '#001F3F' : '#EFF6FF' }]}>
                            <MaterialCommunityIcons name="share-variant" size={mS(24)} color={isDark ? '#00BFFF' : "#3B82F6"} />
                        </View>
                        <View style={styles.guideContent}>
                            <Text style={[styles.guideTitle, { color: isDark ? '#F8FAFC' : appColors.text }]}>Share Trip Status</Text>
                            <Text style={[styles.guideDescription, { color: isDark ? '#94A3B8' : appColors.secondaryText }]}>Share your live location with trusted contacts.</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={mS(20)} color={isDark ? '#64748B' : appColors.secondaryText} />
                    </TouchableOpacity>
                </View>

                {/* --- BOTTOM PROMO BANNER --- */}
                <View style={styles.bottomPromoContainer}>
                    <View style={[styles.bottomPromoCard, { backgroundColor: isDark ? '#1E293B' : '#EBF4FF' }]}>
                        <Image source={require('../../../../../assets/png/t2drive_city_road_clouds_background_hd.png')} style={[styles.bottomPromoBg, isDark && { opacity: 0.2 }]} resizeMode="cover" />
                        <View style={styles.bottomPromoContent}>
                            <Image source={require('../../../../../assets/png/t2drive_safety_shield_transparent_hd.png')} style={styles.bottomPromoShield} resizeMode="contain" />
                            <View style={styles.bottomPromoTexts}>
                                <Text style={[styles.bottomPromoTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Stay Safe,{'\n'}Ride Smart</Text>
                            </View>
                        </View>
                        <Image source={require('../../../../../assets/png/t2drive_car_transparent_hd.png')} style={styles.bottomPromoCar} resizeMode="contain" />
                    </View>
                </View>
            </ScrollView>

            <RelationshipSelectionModal
                visible={relationshipModalVisible}
                contact={selectedContact}
                onSelectRelationship={handleRelationshipSelect}
                onClose={() => {
                    setRelationshipModalVisible(false);
                    setSelectedContact(null);
                }}
                suggestions={RELATIONSHIP_SUGGESTIONS}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    premiumHeader: {
        position: 'relative',
        overflow: 'hidden',
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(15),
        paddingTop: vS(10),
        zIndex: 5,
    },
    backButton: {
        padding: mS(5),
    },
    customHeaderTitle: {
        fontSize: mS(18),
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginLeft: hS(5),
    },
    headerBgImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    headerBlueOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0032c880',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        paddingTop: vS(15),
        paddingHorizontal: hS(20),
        position: 'relative',
        zIndex: 2,
    },
    headerTextContainer: {
        flex: 1,
        marginTop: vS(20),
    },
    premiumTitle: {
        color: '#FFFFFF',
        fontSize: mS(24),
        fontWeight: '900',
        lineHeight: mS(32),
    },
    premiumSubtitle: {
        color: '#F8FAFC',
        marginTop: vS(10),
        fontSize: mS(12),
        lineHeight: vS(18),
        fontWeight: '600',
    },
    headerImageContainer: {
        width: mS(220),
        height: mS(220),
        position: 'absolute',
        bottom: vS(0),
        right: -hS(10),
        zIndex: 1,
    },
    shieldImage: {
        width: mS(100),
        height: mS(100),
        position: 'absolute',
        right: hS(15),
        top: 0,
    },
    carImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    sectionContainer: {
        marginTop: vS(20),
        paddingHorizontal: hS(20),
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: vS(12),
    },
    sectionTitle: {
        fontSize: mS(16),
        fontWeight: '800',
    },
    sectionSubtitle: {
        fontSize: mS(12),
        marginTop: vS(2),
        fontWeight: '500',
    },
    addIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: hS(12),
        paddingVertical: vS(6),
        borderRadius: mS(20),
    },
    addBtnText: {
        color: '#3B82F6',
        fontWeight: '700',
        fontSize: mS(13),
        marginLeft: hS(2),
    },
    cardWrapper: {
        borderRadius: mS(20),
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    emptyStateBox: {
        padding: vS(30),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        fontSize: mS(14),
        fontWeight: '700',
        marginTop: vS(12),
    },
    emptyStateSubtext: {
        fontSize: mS(12),
        marginTop: vS(4),
    },
    contactActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: mS(16),
        borderBottomWidth: 1,
    },
    avatarBox: {
        width: mS(46),
        height: mS(46),
        borderRadius: mS(23),
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: mS(18),
        fontWeight: '800',
        color: '#1E3A8A',
    },
    contactInfo: {
        flex: 1,
        marginLeft: hS(16),
    },
    contactNameText: {
        fontSize: mS(14),
        fontWeight: '800',
    },
    contactPhoneText: {
        fontSize: mS(12),
        marginTop: vS(2),
        fontWeight: '600',
    },
    contactRelationshipText: {
        fontSize: mS(11),
        marginTop: vS(4),
        fontWeight: '600',
    },
    deleteAction: {
        padding: mS(8),
    },
    limitBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: vS(12),
        gap: hS(6),
    },
    limitText: {
        fontSize: mS(12),
        color: '#B45309',
        fontWeight: '600',
    },
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: vS(8),
    },
    quickActionCard: {
        width: (width - hS(40) - hS(20)) / 3,
        borderRadius: mS(16),
        paddingVertical: vS(16),
        paddingHorizontal: hS(4),
        alignItems: 'center',
    },
    actionIconBox: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(10),
    },
    actionTitle: {
        fontSize: mS(12),
        fontWeight: '800',
        marginBottom: vS(4),
    },
    actionSubtitle: {
        fontSize: mS(10),
        color: '#64748B',
        fontWeight: '500',
        textAlign: 'center',
    },
    viewAllBtn: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: hS(12),
        paddingVertical: vS(6),
        borderRadius: mS(16),
    },
    viewAllText: {
        color: '#3B82F6',
        fontWeight: '700',
        fontSize: mS(11),
    },
    guidanceCard: {
        flexDirection: 'row',
        padding: mS(16),
        borderRadius: mS(16),
        marginBottom: vS(12),
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    guideIconBox: {
        width: mS(44),
        height: mS(44),
        borderRadius: mS(14),
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideContent: {
        flex: 1,
        marginLeft: hS(16),
        marginRight: hS(8),
    },
    guideTitle: {
        fontSize: mS(14),
        fontWeight: '800',
    },
    guideDescription: {
        fontSize: mS(11),
        lineHeight: mS(16),
        marginTop: vS(4),
        fontWeight: '500',
    },
    bottomPromoContainer: {
        marginTop: vS(20),
        paddingHorizontal: hS(20),
    },
    bottomPromoCard: {
        height: mS(80),
        borderRadius: mS(16),
        backgroundColor: '#EBF4FF',
        overflow: 'hidden',
        position: 'relative',
    },
    bottomPromoBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    bottomPromoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        paddingHorizontal: hS(16),
        zIndex: 2,
    },
    bottomPromoShield: {
        width: mS(36),
        height: mS(36),
        marginRight: hS(12),
    },
    bottomPromoTexts: {
        justifyContent: 'center',
    },
    bottomPromoTitle: {
        fontSize: mS(14),
        fontWeight: '900',
        color: '#0F172A',
        lineHeight: mS(18),
    },
    bottomPromoCar: {
        position: 'absolute',
        width: mS(110),
        height: mS(60),
        right: hS(5),
        bottom: vS(5),
        zIndex: 3,
    }
});

export default SafetyScreen;