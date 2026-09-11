import { View, ActivityIndicator, TouchableOpacity, Dimensions, Modal, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent, Platform, Alert, ToastAndroid, Pressable } from "react-native"
import { Text } from "../../../Components"
import { Styles } from "../../../lib/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    ProfilescreenComponents_Nav,
    RatingScreen_Nav,
    HelpScreen_Nav,
    PaymentScreen_Nav,
    ActivityScreen_Nav,
    ReferAndEarnScreen_Nav,
    SettingsScreen_Nav,
    ProfileUpdateScreen_Nav,
    WalletScreen_Nav
} from "../../../Navigations/navigations";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Button from "../../../Components/Button";
import fonts from "../../../constant/fonts";
import { useEffect, useState } from "react";
import { RootState } from '../../../redux/store';
import { useDispatch, useSelector } from "react-redux";
// import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import ImagePicker from "react-native-image-crop-picker";
import { useDeleteDocumentMutation, useGetUploadUrlMutation, useUploadImageToS3Mutation } from '../../../service/userApi';
import { useUpdateUserMutation } from '../../../service/userApi';
import { updateUserStore } from '../../../redux/userSlice';
import Config from 'react-native-config';
import { useCameraPermission } from "../../../hooks/useCamera";
import { hS, mS, vS } from "../../../lib/responsive";
import { ResponsiveContainer } from "../../../Components/ResponsiveContainer";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { getLoggedUser } from "../../../service/validation";
import Skeleton from "../../../Components/Skeleton";
import FastImage from "react-native-fast-image";
import { useAppTheme } from "../../../hooks/useAppTheme";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreenSkeleton = () => {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useAppTheme();
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + vS(20) }}
            >
                {/* --- DRIVER APP STYLE PROFILE HEADER SKELETON --- */}
                <View style={{ height: vS(120), backgroundColor: isDark ? colors.card : '#E2E8F0', overflow: 'hidden' }}>
                    <Skeleton width="100%" height="100%" borderRadius={0} />
                </View>

                <ResponsiveContainer>
                <View style={{ alignItems: 'center', marginTop: -mS(50), paddingHorizontal: hS(20) }}>
                    {/* Profile Image Skeleton */}
                    <View style={{ position: 'relative' }}>
                        <View style={{
                            width: mS(100),
                            height: mS(100),
                            borderRadius: mS(50),
                            backgroundColor: colors.background,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <Skeleton width={mS(92)} height={mS(92)} borderRadius={mS(46)} />
                        </View>
                        {/* Camera Badge Skeleton */}
                        <View style={{ position: 'absolute', right: 0, bottom: 0, width: mS(28), height: mS(28), borderRadius: mS(14), backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                            <Skeleton width={mS(24)} height={mS(24)} borderRadius={mS(12)} />
                        </View>
                    </View>

                    {/* Name, Phone, Edit Profile Skeleton */}
                    <View style={{ alignItems: 'center', marginTop: vS(10), gap: vS(6) }}>
                        <Skeleton width={150} height={24} borderRadius={4} />
                        <Skeleton width={100} height={16} borderRadius={4} />
                        <View style={{ marginTop: vS(4) }}>
                            <Skeleton width={90} height={18} borderRadius={4} />
                        </View>
                    </View>
                </View>

                {/* --- MENU OPTIONS LIST SKELETON --- */}
                <View style={{ marginTop: vS(15), paddingHorizontal: hS(20) }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <View
                            key={i}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: vS(14),
                                borderBottomWidth: 1,
                                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB'
                            }}
                        >
                            <Skeleton width={mS(24)} height={mS(24)} borderRadius={mS(12)} />
                            <View style={{ flex: 1, marginLeft: hS(16), flexDirection: 'row', alignItems: 'center' }}>
                                <Skeleton width="40%" height={20} borderRadius={4} />
                                {i === 1 && (
                                    <View style={{ marginLeft: hS(10) }}>
                                        <Skeleton width={60} height={18} borderRadius={10} />
                                    </View>
                                )}
                            </View>
                            <Skeleton width={mS(22)} height={mS(22)} borderRadius={mS(11)} />
                        </View>
                    ))}
                </View>

                {/* --- APP INFO SECTION SKELETON --- */}
                <View style={{ alignItems: 'center', marginTop: vS(40), gap: vS(8) }}>
                    <Skeleton width={120} height={14} borderRadius={2} />
                    <Skeleton width={180} height={14} borderRadius={2} />
                </View>
                </ResponsiveContainer>
            </ScrollView>
        </View>
    );
};


const SCREEN_WIDTH = Dimensions.get('window').width;
const CROP_SIZE = SCREEN_WIDTH * 0.8;

const DEFAULT_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80',
    'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=800&q=80',
    'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&q=80',
    'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=800&q=80'
];

const ProfileScreen: React.FC<ScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useAppTheme();
    const localuser = useSelector((state: RootState) => state?.userSlice?.user);
    const dispatch = useDispatch()

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileUri, setProfileUri] = useState<string | null>(localuser?.profile_url || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isViewVisible, setIsViewVisible] = useState(false);
    const [getUploadUrl] = useGetUploadUrlMutation();
    const [uploadImageToS3] = useUploadImageToS3Mutation();
    const [updateUser] = useUpdateUserMutation();
    const [deleteDocument] = useDeleteDocumentMutation();
    const { requestCameraPermission } = useCameraPermission();

    const [bgImage, setBgImage] = useState<string>('#1E1B4B');
    const [bgPickerVisible, setBgPickerVisible] = useState(false);

    useEffect(() => {
        const loadBg = async () => {
            try {
                const savedBg = await AsyncStorage.getItem('profileBg');
                if (savedBg) setBgImage(savedBg);
            } catch (e) { }
        };
        loadBg();
    }, []);

    const handleSetBgImage = async (val: string) => {
        setBgImage(val);
        try {
            await AsyncStorage.setItem('profileBg', val);
        } catch (e) { }
        setBgPickerVisible(false);
    };
    const imageSource = profileUri || localuser?.profile_url;
    const BASE_URL = `${Config.DEV_BACKEND_URL}/api`;
    const proxiedImageSource = imageSource ? (imageSource.startsWith('http') ? `${BASE_URL}/media/proxy?url=${encodeURIComponent(imageSource)}` : imageSource) : null;

    interface ProfileImagePickerProps {
        isVisible: boolean;
        onClose: () => void;
        onCamera: () => void;
        onGallery: () => void;
        onRemove?: () => void;
    }
    const ProfileImagePicker = ({ isVisible, onClose, onCamera, onGallery, onRemove }: ProfileImagePickerProps) => {
        return (
            <Modal
                visible={isVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={onClose}
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
            >
                <Pressable style={styles.modaloverlay} onPress={onClose}>
                    <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + vS(20) }]}>
                        <View style={[styles.handle, { backgroundColor: colors.border }]} />
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.title, { color: colors.text }]}>Profile Photo</Text>

                        <View style={styles.optionsRow}>
                            <TouchableOpacity style={styles.option} onPress={onCamera}>
                                <View style={[styles.iconCircle, { backgroundColor: colors.iconBox }]}>
                                    <MaterialCommunityIcons name="camera" size={30} color={colors.primary} />
                                </View>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.optionLabel, { color: colors.text }]}>Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.option} onPress={onGallery}>
                                <View style={[styles.iconCircle, { backgroundColor: colors.iconBox }]}>
                                    <MaterialCommunityIcons name="image-multiple" size={30} color={colors.primary} />
                                </View>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.optionLabel, { color: colors.text }]}>Gallery</Text>
                            </TouchableOpacity>

                            {imageSource && (
                                <TouchableOpacity style={styles.option} onPress={onRemove}>
                                    <View style={[styles.iconCircle, { backgroundColor: isDark ? '#450a0a' : '#FEE2E2' }]}>
                                        <MaterialCommunityIcons name="trash-can-outline" size={30} color="#EF4444" />
                                    </View>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.optionLabel, { color: colors.text }]}>Remove</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Bottom filler to ensure no gap is visible */}
                        <View style={{
                            position: 'absolute',
                            bottom: -100,
                            left: 0,
                            right: 0,
                            height: 100,
                            backgroundColor: colors.background
                        }} />
                    </View>
                </Pressable>
            </Modal>
        );
    };

    const FullScreenImageModal = () => {
        return (
            <Modal
                visible={isViewVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsViewVisible(false)}
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
            >
                <View style={styles.fullScreenContainer}>
                    {/* Header Overlay */}
                    <View style={[styles.fullScreenHeader, { paddingTop: insets.top + vS(10) }]}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity
                                onPress={() => setIsViewVisible(false)}
                                style={styles.headerIconButton}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={mS(28)} color="white" />
                            </TouchableOpacity>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.fullScreenTitle}>Profile photo</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setIsViewVisible(false);
                                setTimeout(() => setPickerVisible(true), 300);
                            }}
                            style={styles.headerIconButton}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="pencil" size={mS(24)} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Image Viewer */}
                    <View style={styles.fullScreenImageWrapper}>
                        {imageSource ? (
                            <FastImage
                                source={{ uri: proxiedImageSource || '', priority: FastImage.priority.high }}
                                style={styles.fullScreenImage}
                                resizeMode={FastImage.resizeMode.contain}
                            />
                        ) : (
                            <View style={styles.fullScreenPlaceholder}>
                                <FontAwesome name="user" size={mS(150)} color="#475569" />
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.noPhotoText}>No profile photo</Text>
                            </View>
                        )}
                    </View>

                    {/* Bottom Gradient/Overlay for depth (Optional) */}
                    <View style={styles.bottomOverlay} />
                </View>
            </Modal>
        );
    };
    const cropperConfig = {
        width: 500,
        height: 500,
        cropping: true,
        cropperCircleOverlay: true, // Makes the cropping UI circular
        compressImageQuality: 0.6,
        mediaType: 'photo' as const,
        cropperStatusBarColor: 'black',
        cropperToolbarColor: 'black',
        cropperToolbarWidgetColor: 'white',
    };

    const deleteOldProfileImage = async () => {
        try {
            if (!localuser?.profile_url) return;

            const filename = localuser.profile_url.split('/').pop();
            if (!filename) return;

            const payload = {
                userId: localuser.id,
                documentType: filename
            };

            console.log('Deleting old image:', payload);
            await deleteDocument(payload).unwrap();
            console.log("Old image deleted successfully");

        } catch (error) {
            console.error("Error deleting old document:", error);
            // We log but don't necessarily block the next step
        }
    };

    const uploadNewProfileImage = async (uri: string, mimeType: string) => {
        try {
            const filename = uri.split('/').pop() || `profile_${Date.now()}`;

            // Get presigned URL
            const payload = {
                userId: localuser.id,
                documentType: `profile_picture_${filename}`,
                contentType: mimeType,
            };

            const response = await getUploadUrl(payload).unwrap();
            const uploadUrl = response.data.uploadUrl || response.data.data.uploadUrl;

            // Fetch and upload image
            const responseFile = await fetch(uri);
            const imageBlob = await responseFile.blob();

            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: imageBlob,
                headers: { 'Content-Type': mimeType },
            });

            if (!uploadResponse.ok) {
                throw new Error("Upload failed");
            }

            // Update user profile
            const publicUrl = uploadUrl.split('?')[0];
            const updatePayload = {
                id: localuser.id,
                profile_url: publicUrl
            };

            const updateResponse = await updateUser(updatePayload).unwrap();

            if (updateResponse.success) {
                setProfileUri(publicUrl);
                dispatch(updateUserStore({ profile_url: updateResponse.data.profile_url }));
                if (Platform.OS === 'android') {
                    ToastAndroid.show("Profile updated successfully", ToastAndroid.SHORT);
                }
                Alert.alert("Success", "Profile picture updated!");
            }

        } catch (error) {
            console.error("Error uploading new image:", error);
            throw error;
        }
    };

    const uploadProfileImage = async (uri: string, mimeType: string) => {
        setIsUploading(true);
        try {
            // Step 1: Delete old image if it exists
            await deleteOldProfileImage();

            // Step 2: Upload new image
            await uploadNewProfileImage(uri, mimeType);

        } catch (error) {
            console.error("Upload Error:", error);
            if (Platform.OS === 'android') {
                ToastAndroid.show("Could not save image to server", ToastAndroid.SHORT);
            }
            Alert.alert("Error", "Failed to upload profile picture.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageResult = async (image: any) => {
        console.log('Selected image:', image);
        const uri = image.path;
        const mimeType = image.mime || 'image/jpeg';

        setProfileUri(uri); // Show preview immediately
        await uploadProfileImage(uri, mimeType);
    };

    const openCamera = async () => {
        const hasPermission = await requestCameraPermission();

        if (hasPermission) {
            ImagePicker.openCamera(cropperConfig)
                .then(handleImageResult)
                .catch(() => { });
        } else {
            if (Platform.OS === 'android') {
                ToastAndroid.show('App needs Permission to access camera', ToastAndroid.SHORT);
            }
            Alert.alert('Permission Denied', 'App needs Permission to access camera');
        }
    };

    const openGallery = () => {
        ImagePicker.openPicker(cropperConfig)
            .then(handleImageResult)
            .catch(() => { });
    };

    const handleCamera = () => {
        setPickerVisible(false);
        openCamera();
    };

    const handleGallery = () => {
        setPickerVisible(false);
        openGallery();
    };

    const handleRemove = async () => {
        setPickerVisible(false);
        setIsUploading(true);

        try {
            // Delete old image
            await deleteOldProfileImage();

            // Update user profile
            const payload = {
                id: localuser.id,
                profile_url: ""
            };

            const response = await updateUser(payload).unwrap();
            if (response.success) {
                setProfileUri(null);
                dispatch(updateUserStore({ profile_url: "" }));
                if (Platform.OS === 'android') {
                    ToastAndroid.show("Profile picture removed", ToastAndroid.SHORT);
                }
                Alert.alert("Success", "Profile picture removed!");
            }

        } catch (error) {
            console.error("Remove Error:", error);
            if (Platform.OS === 'android') {
                ToastAndroid.show("Could not remove image", ToastAndroid.SHORT);
            }
            Alert.alert("Error", "Failed to remove profile picture.");
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        async function loadUserData() {
            const json = await getLoggedUser();

            if (json?.data) {
                setUser(json.data);
            }

            setLoading(false);
        }

        loadUserData();
    }, []);


    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
            if (!isUploading) {
                return;
            }

            // Prevent default behavior of leaving the screen
            e.preventDefault();

            if (Platform.OS === 'android') {
                ToastAndroid.show('Please wait while profile is updating...', ToastAndroid.SHORT);
            }
        });

        return unsubscribe;
    }, [navigation, isUploading]);

    if (loading) {
        return <ProfileScreenSkeleton />;
    }

    const buttons = [
        { id: 1, name: `${user?.rating || '0.0'}`, subtitle: 'My Rating', iconName: 'star', component: RatingScreen_Nav, iconBgColor: '#F59E0B', iconColor: '#FFFFFF' },
        { id: 3, name: 'My Wallet', subtitle: 'Balance & Transactions', iconName: 'wallet-outline', component: WalletScreen_Nav, iconBgColor: '#3B82F6', iconColor: '#FFFFFF' },
        { id: 4, name: 'Activity', subtitle: 'Rides & History', iconName: 'clipboard-text-clock-outline', component: ActivityScreen_Nav, iconBgColor: '#8B5CF6', iconColor: '#FFFFFF' },
        { id: 5, name: 'Refer and Earn', subtitle: 'Invite friends & earn rewards', iconName: 'gift-open-outline', component: ReferAndEarnScreen_Nav, iconBgColor: '#F97316', iconColor: '#FFFFFF' },
        { id: 2, name: 'Help & Support', subtitle: 'FAQs & Contact Us', iconName: 'help-circle-outline', component: HelpScreen_Nav, iconBgColor: '#10B981', iconColor: '#FFFFFF' },
        { id: 6, name: 'Settings', subtitle: 'App Preferences', iconName: 'cog-outline', component: SettingsScreen_Nav, iconBgColor: '#A855F7', iconColor: '#FFFFFF' },
    ]
    return (
        <View style={{ flex: 1, backgroundColor: isDark ? "#020813" : colors.background }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + vS(20) }}
            >
                {/* --- DRIVER APP STYLE PROFILE HEADER --- */}
                <View style={{ height: vS(120), backgroundColor: bgImage.startsWith('#') ? bgImage : '#1E1B4B', overflow: 'hidden' }}>
                    {!bgImage.startsWith('#') && (
                        <FastImage source={{ uri: bgImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    )}
                    <TouchableOpacity
                        onPress={() => setBgPickerVisible(true)}
                        style={{ position: 'absolute', top: Math.max(insets.top, vS(10)), right: hS(10), backgroundColor: 'rgba(0,0,0,0.4)', padding: mS(8), borderRadius: mS(20), zIndex: 10 }}
                    >
                        <MaterialCommunityIcons name="pencil" size={mS(16)} color="white" />
                    </TouchableOpacity>
                </View>

                <ResponsiveContainer>
                <View style={{ alignItems: 'center', marginTop: -mS(80), paddingHorizontal: hS(20) }}>
                    {/* Profile Image with Edit Icon */}
                    <View style={{ position: 'relative' }}>
                        <TouchableOpacity
                            onPress={() => setIsViewVisible(true)}
                            activeOpacity={0.9}
                            style={styles.avatarMainButton}
                        >
                            <View style={[styles.largeAvatarContainer, { backgroundColor: colors.iconBox, borderColor: colors.background, borderWidth: 4 }]}>
                                {imageSource ? (
                                    <>
                                        <FastImage
                                            source={{ uri: proxiedImageSource || '', priority: FastImage.priority.normal }}
                                            style={styles.largeImageStyle}
                                            resizeMode={FastImage.resizeMode.cover}
                                            onLoadStart={() => setIsImageLoading(true)}
                                            onLoadEnd={() => setIsImageLoading(false)}
                                        />
                                        {isImageLoading && (
                                            <View style={[StyleSheet.absoluteFillObject, styles.largePlaceholder, { backgroundColor: colors.iconBox }]}>
                                                <Skeleton width="100%" height="100%" borderRadius={45} />
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <View style={[styles.largePlaceholder, { backgroundColor: colors.iconBox }]}>
                                        <FontAwesome name="user" size={mS(50)} color={isDark ? colors.lightTextColor : '#CBD5E1'} />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setPickerVisible(true)}
                            activeOpacity={0.8}
                            style={[styles.cameraIconBadge, { borderColor: colors.background, backgroundColor: '#0F172A', right: 0, bottom: 0, borderWidth: 2 }]}
                        >
                            <MaterialCommunityIcons name="camera" size={mS(14)} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ alignItems: 'center', marginTop: vS(10) }}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.userName, { color: colors.text, fontSize: mS(20) }]}>{localuser?.full_name}</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: vS(4) }}>
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.userPhone, { color: colors.lightTextColor, fontSize: mS(13) }]}>{localuser?.phone_number}</Text>

                            <View style={{ width: 1, height: mS(12), backgroundColor: colors.lightTextColor, marginHorizontal: hS(10) }} />

                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}
                                onPress={() => navigation.navigate(ProfilescreenComponents_Nav, { screen: ProfileUpdateScreen_Nav, params: { user } })}
                            >
                                <MaterialCommunityIcons name="pencil" size={mS(14)} color={isDark ? colors.text : '#3B82F6'} />
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.editProfileText, { color: isDark ? colors.text : '#3B82F6', marginLeft: mS(4) }]}>Edit Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* --- MENU OPTIONS LIST --- */}
                <View style={{ marginTop: vS(15), paddingHorizontal: hS(20) }}>
                    {buttons.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => navigation.navigate(ProfilescreenComponents_Nav, { screen: item.component })}
                            activeOpacity={0.7}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: isDark ? vS(8) : vS(14),
                                paddingHorizontal: isDark ? hS(16) : 0,
                                marginBottom: isDark ? vS(8) : 0,
                                backgroundColor: isDark ? '#0A1931' : 'transparent',
                                borderRadius: isDark ? 12 : 0,
                                borderWidth: isDark ? 1 : 0,
                                borderColor: isDark ? '#1E3A8A' : 'transparent',
                                borderBottomWidth: isDark ? 1 : 1,
                                borderBottomColor: isDark ? '#1E3A8A' : (isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB'),
                                shadowColor: '#64748B',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: isDark ? 0.05 : 0,
                                shadowRadius: 8,
                            }}
                        >
                            {/* Icon Box */}
                            <View style={{
                                width: mS(38),
                                height: mS(38),
                                borderRadius: 10,
                                backgroundColor: isDark ? (item.id === 1 ? 'transparent' : item.iconBgColor) : 'transparent',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <MaterialCommunityIcons
                                    name={item.iconName}
                                    size={item.id === 1 && isDark ? mS(34) : mS(20)}
                                    color={isDark ? (item.id === 1 ? '#F59E0B' : item.iconColor) : (item.id === 1 ? '#F59E0B' : '#1E293B')}
                                />
                            </View>

                            <View style={{ flex: 1, marginLeft: hS(16), justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(15), fontWeight: '700', color: isDark ? '#FFFFFF' : colors.text }}>{item.name}</Text>
                                    {item.id === 1 && (
                                        <View style={[styles.ratingBadge, isDark && { backgroundColor: '#F59E0B', borderColor: '#F59E0B', borderWidth: 0, marginLeft: 10 }]}>
                                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.ratingBadgeText, isDark && { color: '#000000', fontWeight: '800' }]}>TOP RATED</Text>
                                        </View>
                                    )}
                                </View>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(12), color: isDark ? '#94A3B8' : colors.lightTextColor, marginTop: 2 }}>{item.subtitle}</Text>
                            </View>

                            <MaterialCommunityIcons name="chevron-right" size={mS(22)} color={isDark ? '#FFFFFF' : colors.lightTextColor} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* --- APP INFO SECTION --- */}
                <View style={isDark ? {
                    marginHorizontal: hS(20),
                    marginTop: vS(20),
                    marginBottom: vS(10),
                    padding: mS(16),
                    backgroundColor: '#0A1931',
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#1E3A8A',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    overflow: 'hidden'
                } : styles.appInfoSection}>
                    {isDark && (
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                            <MaterialCommunityIcons name="information-variant" size={24} color="#60A5FA" />
                        </View>
                    )}
                    <View style={isDark ? { flex: 1, paddingRight: 10 } : {}}>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={isDark ? { fontSize: mS(13), fontWeight: '700', color: '#60A5FA', marginBottom: 4 } : [styles.versionText, { color: colors.lightTextColor }]}>
                            T2Drive v1.0.42 (Beta)
                        </Text>
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={isDark ? { fontSize: mS(11), color: '#94A3B8' } : [styles.brandText, { color: colors.lightTextColor }]}>
                            Made with ❤️ for T2Drive Users
                        </Text>
                    </View>
                    {isDark && (
                        <View style={{ width: 110, height: 50 }}>
                            <FastImage
                                source={require('../../../assets/png/T2Drive_CarSedan.png')}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode={FastImage.resizeMode.contain}
                            />
                        </View>
                    )}
                </View>
                </ResponsiveContainer>

            </ScrollView>

            <Modal
                visible={bgPickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setBgPickerVisible(false)}
                statusBarTranslucent={true}
                navigationBarTranslucent={true}
            >
                <Pressable style={styles.modaloverlay} onPress={() => setBgPickerVisible(false)}>
                    <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + vS(20) }]}>
                        <View style={[styles.handle, { backgroundColor: colors.border }]} />
                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.title, { color: colors.text, marginBottom: vS(15) }]}>Select Profile Background</Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: hS(20) }}>
                            {DEFAULT_BACKGROUNDS.map((url, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => handleSetBgImage(url)}
                                    style={{ width: '48%', height: vS(80), marginBottom: vS(15), borderRadius: mS(8), overflow: 'hidden' }}
                                >
                                    <FastImage source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                </TouchableOpacity>
                            ))}
                            {/* Option to reset to default dark blue */}
                            <TouchableOpacity
                                onPress={() => handleSetBgImage('#1E1B4B')}
                                style={{ width: '48%', height: vS(80), marginBottom: vS(15), borderRadius: mS(8), overflow: 'hidden', backgroundColor: '#1E1B4B', justifyContent: 'center', alignItems: 'center' }}
                            >
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: 'white', fontWeight: '600' }}>Default Color</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Modal>

            <ProfileImagePicker
                isVisible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onCamera={handleCamera}
                onGallery={handleGallery}
                onRemove={handleRemove}
            />

            <FullScreenImageModal />

            {/* --- UPLOADING OVERLAY --- */}
            {isUploading && (
                <Modal transparent={true} animationType="fade" visible={isUploading} statusBarTranslucent navigationBarTranslucent onRequestClose={() => { }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <View style={{ backgroundColor: colors.card, padding: hS(24), borderRadius: mS(16), alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ marginTop: vS(12), color: colors.text, fontSize: mS(16), fontWeight: '600' }}>Updating profile...</Text>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};



const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: hS(20),
        backgroundColor: 'white'
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: hS(15),
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: mS(10)
    },
    avatar: {
        width: hS(70),
        height: hS(70), // Keep hS for height to maintain perfect circle
        borderRadius: hS(35)
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#007AFF',
        width: hS(24),
        height: hS(24),
        borderRadius: hS(12),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: mS(2),
        borderColor: 'white'
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center'
    },
    modalTitle: {
        color: 'white',
        textAlign: 'center',
        marginBottom: vS(20),
        fontSize: mS(18)
    },
    cropWindow: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH, // Standard square aspect ratio for croppers
        backgroundColor: '#111'
    },
    largeImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH,
        resizeMode: 'contain'
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center'
    },
    circleHole: {
        width: CROP_SIZE,
        height: CROP_SIZE,
        borderRadius: CROP_SIZE / 2,
        borderWidth: mS(2),
        borderColor: 'white'
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: vS(40)
    },
    cancelBtn: {
        paddingVertical: vS(15),
        width: hS(120),
        alignItems: 'center',
        borderRadius: mS(10),
        backgroundColor: '#444'
    },
    saveBtn: {
        paddingVertical: vS(15),
        width: hS(120),
        alignItems: 'center',
        borderRadius: mS(10),
        backgroundColor: '#007AFF'
    },

    modaloverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: mS(20),
        borderTopRightRadius: mS(20),
        paddingHorizontal: hS(20),
        paddingTop: vS(20),
        paddingBottom: vS(40), // Extra padding for home indicators/navigation bars
        alignItems: 'center',
    },
    handle: {
        width: hS(40),
        height: vS(5),
        backgroundColor: '#CCC',
        borderRadius: mS(3),
        marginBottom: vS(15),
    },
    title: {
        fontSize: mS(18),
        fontWeight: 'bold',
        marginBottom: vS(20),
        color: '#333',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    option: {
        alignItems: 'center',
        width: hS(100),
    },
    iconCircle: {
        width: hS(60),
        height: hS(60), // Maintain circular aspect ratio
        borderRadius: hS(30),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(10),
    },
    optionLabel: {
        fontSize: mS(14),
        color: '#555',
        fontWeight: '500',
    },
    avatarContainer: {
        width: mS(70),
        height: mS(70),
        borderRadius: mS(35),
        overflow: 'hidden', // Ensures the image stays circular
        backgroundColor: '#E2E8F0', // Light grey background like WhatsApp
    },
    imageStyle: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#B1B3B5', // WhatsApp-like muted grey-blue
        justifyContent: 'center',
        alignItems: 'center',
    },
    // --- NEW PREMIUM STYLES ---
    premiumCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: mS(12),
        marginHorizontal: hS(16),
        marginTop: vS(16),
        paddingHorizontal: hS(16),
        paddingVertical: vS(16),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
    },
    largeAvatarContainer: {
        width: mS(110),
        height: mS(110),
        borderRadius: mS(55),
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
        borderWidth: 3,
        borderColor: '#F8FAFC',
    },
    largeImageStyle: {
        width: '100%',
        height: '100%',
    },
    largePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3B82F6',
        width: mS(28),
        height: mS(28),
        borderRadius: mS(14),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        elevation: 3,
    },
    userInfoContainer: {
        marginLeft: hS(20),
        flex: 1,
    },
    userName: {
        fontSize: mS(22),
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    userPhone: {
        fontSize: mS(14),
        color: '#64748B',
        marginTop: vS(2),
        fontWeight: '500',
    },
    editProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        alignSelf: 'flex-start',
        paddingHorizontal: hS(12),
        paddingVertical: vS(6),
        borderRadius: mS(20),
        marginTop: vS(10),
    },
    editProfileText: {
        fontSize: mS(12),
        color: '#3B82F6',
        fontWeight: '700',
        marginLeft: hS(4),
    },
    menuContainer: {
        marginTop: vS(16),
        marginHorizontal: hS(16),
        backgroundColor: '#FFFFFF',
        borderRadius: mS(12),
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: vS(16),
        paddingHorizontal: hS(16),
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    firstMenuItem: {
        borderTopLeftRadius: mS(20),
        borderTopRightRadius: mS(20),
    },
    lastMenuItem: {
        borderBottomWidth: 0,
        borderBottomLeftRadius: mS(20),
        borderBottomRightRadius: mS(20),
    },
    menuIconBox: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(12),
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabelContainer: {
        flex: 1,
        marginLeft: hS(16),
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: mS(15),
        fontWeight: '600',
        color: '#334155',
    },
    ratingBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: hS(8),
        paddingVertical: vS(2),
        borderRadius: mS(6),
        marginLeft: hS(8),
    },
    ratingBadgeText: {
        fontSize: mS(8),
        fontWeight: '800',
        color: '#D97706',
    },
    appInfoSection: {
        marginTop: vS(40),
        alignItems: 'center',
        paddingBottom: vS(20),
    },
    versionText: {
        fontSize: mS(12),
        color: '#94A3B8',
        fontWeight: '500',
    },
    brandText: {
        fontSize: mS(11),
        color: '#CBD5E1',
        marginTop: vS(4),
        fontWeight: '400',
    },

    // --- FULL SCREEN VIEWER STYLES ---
    fullScreenContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    fullScreenHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: hS(10),
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.4)', // Subtle overlay for header text
        paddingBottom: vS(15),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIconButton: {
        padding: hS(10),
        borderRadius: mS(25),
    },
    fullScreenTitle: {
        color: '#FFFFFF',
        fontSize: mS(19),
        fontWeight: '600',
        marginLeft: hS(8),
    },
    fullScreenImageWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
    fullScreenPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    noPhotoText: {
        color: '#94A3B8',
        fontSize: mS(16),
        marginTop: vS(20),
        fontWeight: '500',
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: vS(80),
        backgroundColor: 'transparent',
    },
    avatarMainButton: {
        borderRadius: mS(45),
        overflow: 'hidden',
    },
});

export default ProfileScreen;