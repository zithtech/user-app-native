import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform,
    Image, Dimensions,
    ActivityIndicator,
    Linking,
    Alert,
    Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { hS, mS, vS } from '../../lib/responsive';
import { useLocation } from '../../hooks/useLocation';
import ImagePicker from "react-native-image-crop-picker";
import { useChat } from '../../hooks/useChat';
import { ChatMessage } from '../../Socket/socket.types';
import Skeleton from '../../Components/Skeleton';
import colors from '../../constant/colors';
import { useAppTheme } from '../../hooks/useAppTheme';

const QUICK_SUGGESTIONS = [
    "Hello, I am waiting!",
    "Where are you?",
    "I've arrived.",
    "Okay, thanks!",
    "On my way!"
];

const ChatScreenSkeleton = () => {
    const { colors: appColors } = useAppTheme();
    return (
        <View style={{ flex: 1, padding: mS(16), backgroundColor: appColors.background }}>
            {[
                { align: 'flex-start', width: '60%' },
                { align: 'flex-end', width: '40%' },
                { align: 'flex-start', width: '70%' },
                { align: 'flex-start', width: '50%' },
                { align: 'flex-end', width: '65%' },
                { align: 'flex-start', width: '45%' },
            ].map((item, index) => (
                <View
                    key={index}
                    style={{
                        alignSelf: item.align as any,
                        width: item.width as any,
                        height: vS(45),
                        marginBottom: vS(16),
                        borderRadius: mS(20),
                        overflow: 'hidden'
                    }}
                >
                    <Skeleton width="100%" height="100%" />
                </View>
            ))}
        </View>
    );
};



const ChatScreen = ({ route, navigation }: any) => {
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const anim1 = useRef(new Animated.Value(0.3)).current;
    const anim2 = useRef(new Animated.Value(0.3)).current;
    const anim3 = useRef(new Animated.Value(0.3)).current;

    const { driverName, rideId, userId, driverId, driverImage, driverPhone } = route.params;
    const insets = useSafeAreaInsets();
    const { getCurrentLocation } = useLocation();
    const {
        sendMessage,
        sendImage,
        sendLocation,
        sendTyping,
        sendSeen,
        setChatScreenPresence,
        onMessage,
        onTyping,
        onDelivered,
        onDeliveredToUser,
        onSeen,
        onHistory,
    } = useChat(rideId, userId);

    useFocusEffect(
        useCallback(() => {
            setChatScreenPresence(true);
            return () => setChatScreenPresence(false);
        }, [setChatScreenPresence])
    );
    const { colors: appColors, isDark } = useAppTheme();

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', text: 'I have arrived at the pickup point.', sender: 'other', time: '12:01 PM' },
        { id: '2', text: 'Okay, I am coming in 2 minutes.', sender: 'me', time: '12:02 PM' },
    ]);
    const [showMenu, setShowMenu] = useState(false);
    const [typingUser, setTypingUser] = useState("");
    const [isLoading, setIsLoading] = useState(true);


    const flatListRef = useRef<FlatList>(null);

    const AttachmentOption = ({ icon, color, label, onPress }: any) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.iconCircle, { backgroundColor: color }]}>
                <MaterialCommunityIcons name={icon} size={mS(24)} color="#FFF" />
            </View>
            <Text style={[styles.menuLabel, { color: appColors.text }]}>{label}</Text>
        </TouchableOpacity>
    );

    const openInExternalMap = (lat: number, lng: number) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const label = 'Shared Location';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) Linking.openURL(url);
    };

    // --- Camera & Gallery Actions ---

    const handleImageSelection = (image: any) => {
        const msg = sendImage(image.path);

        const newMessage: ChatMessage = {
            id: msg.messageId,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            image: msg.image, // Path provided by image-crop-picker
        };

        setMessages(prev => [...prev, newMessage]);
        // Scroll to bottom after state update
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    };

    const handleCameraLaunch = async () => {
        setShowMenu(false); // Close menu first
        try {
            const image = await ImagePicker.openCamera({
                width: 1000,
                height: 1000,
                cropping: true,
                compressImageQuality: 0.8,
            });
            handleImageSelection(image);
        } catch (error: any) {
            // Handle "User cancelled" error gracefully
            if (error.message !== 'User cancelled image selection') {
            }
        }
    };

    const handleGalleryLaunch = async () => {
        setShowMenu(false); // Close menu first
        try {
            const image = await ImagePicker.openPicker({
                width: 1000,
                height: 1000,
                cropping: true,
                compressImageQuality: 0.8,
                mediaType: 'photo',
            });
            handleImageSelection(image);
        } catch (error: any) {
            if (error.message !== 'User cancelled image selection') {
            }
        }
    };

    // --- Actions ---
    const shareCurrentLocation = async () => {
        try {
            const position = await getCurrentLocation();
            const { latitude, longitude } = position.coords;

            const msg = sendLocation(latitude, longitude);
            const newMessage: ChatMessage = {
                id: msg.messageId,
                sender: 'me',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                location: msg.location,
            };

            setMessages(prev => [...prev, newMessage]);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 200);
        } catch (error) {
        }
    };

    const handleSendMessage = () => {
        if (message.trim().length === 0) return;
        const msg = sendMessage(message);

        const newMessage: ChatMessage = {
            id: msg.messageId,
            text: msg.text,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'pending',
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage('');
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    };

    const handleQuickReply = (text: string) => {
        const msg = sendMessage(text);
        const newMessage: ChatMessage = {
            id: msg.messageId,
            text: msg.text,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'pending',
        };
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    };

    // --- Render Helpers ---
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? appColors.card : '#F1F5F9' }]}>
                <MaterialCommunityIcons name="message-text-outline" size={mS(48)} color={appColors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: appColors.text }]}>Start a Conversation</Text>
            <Text style={[styles.emptySubtitle, { color: appColors.lightTextColor }]}>
                Ask your driver about their location or provide pickup details.
            </Text>
        </View>
    );

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'me';
        const lat = item.location?.latitude ? Number(item.location.latitude) : null;
        const lng = item.location?.longitude ? Number(item.location.longitude) : null;

        return (
            <View style={[
                styles.messageBubble,
                isUser ? [styles.meBubble, { backgroundColor: appColors.primary }] : [styles.otherBubble, { backgroundColor: appColors.card, shadowColor: isDark ? '#000' : '#000' }],
                item.location && { width: hS(220), padding: mS(4) }
            ]}>
                {/* 1. Map Content */}
                {lat && lng ? (
                    <View style={styles.mapWrapper}>
                        <MapView
                            provider={PROVIDER_GOOGLE}
                            style={styles.miniMap}
                            region={{
                                latitude: lat,
                                longitude: lng,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            scrollEnabled={false}
                            liteMode={true}
                            pitchEnabled={false}
                            rotateEnabled={false}
                        >
                            <Marker
                                coordinate={{ latitude: lat, longitude: lng }}
                            />
                        </MapView>
                        {/* Optional: Overlay to handle clicks if liteMode isn't capturing them */}
                        <TouchableOpacity
                            style={StyleSheet.absoluteFill}
                            onPress={() => openInExternalMap(lat, lng)}
                        />
                    </View>
                ) : item.location ? (
                    // Show a loader if location exists but coordinates aren't parsed yet
                    <View style={[styles.miniMap, { justifyContent: 'center', backgroundColor: isDark ? appColors.background : '#f0f0f0' }]}>
                        <ActivityIndicator size="small" color={appColors.primary} />
                    </View>
                ) : null}

                {/* 2. Image Content */}
                {item.image && (
                    <View style={styles.messageImageContainer}>
                        <FastImage
                            source={{ uri: item.image, priority: FastImage.priority.normal }}
                            style={styles.messageImage}
                        />
                    </View>
                )}

                {/* 3. Text Content */}
                {item.text ? (

                    <Text style={[
                        styles.messageText,
                        isUser ? styles.userText : [styles.driverText, { color: appColors.text }]
                    ]}>
                        {item.text}
                    </Text>



                ) : null}

                {/* 4. Timestamp */}
                <Text
                    style={[
                        styles.timeText,
                        isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: appColors.lightTextColor }
                    ]}
                >
                    {item.time}
                </Text>

                {isUser && (
                    <MaterialCommunityIcons
                        name={
                            item.status === 'seen'
                                ? 'check-all'           // Blue double tick
                                : item.status === 'delivered'
                                    ? 'check-all'           // Gray double tick
                                    : item.status === 'sent'
                                        ? 'check'               // Single gray tick
                                        : 'clock'               // pending
                        }
                        size={14}
                        color={
                            item.status === 'seen'
                                ? '#fff'
                                : 'rgba(255,255,255,0.7)'
                        }
                        style={{ marginLeft: 4, alignSelf: 'flex-end' }}
                    />
                )}
            </View>
        );
    };

    const handleCall = () => {
        let driverphone = 1234567890
        Linking.openURL(`tel:+${driverphone}`).catch(() =>
            Alert.alert('Error', 'Call feature is not supported on this device')
        );
    };

    useEffect(() => {
        const animateDot = (anim: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                ])
            ).start();
        };

        animateDot(anim1, 0);
        animateDot(anim2, 200);
        animateDot(anim3, 400);
    }, []);

    useEffect(() => {

        onHistory((history: any[]) => {
            const mapped: ChatMessage[] = history.map((m) => ({
                id: m.messageId,
                text: m.text ?? undefined,
                image: m.image ?? undefined,
                location: m.location ?? undefined,
                sender: m.senderId === userId ? "me" : "other",
                time: new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit"
                }),
                status: m.status ?? "seen",
            }));

            setMessages(mapped);
            setIsLoading(false);

            // Scroll to bottom without animation (instant load)
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
        });

        onMessage((msg) => {
            setMessages((prev) => [...prev, {
                id: msg.messageId,
                text: msg.text,
                image: msg.image,
                location: msg.location,
                sender: msg.senderId === userId ? "me" : "other",
                time: new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit", minute: "2-digit"
                }),
                status: "seen",
            }]);

            // Mark incoming message as seen instantly
            sendSeen(msg.messageId);
        });

        onTyping((data) => {
            if (data.userId !== userId) {
                setTypingUser(data.isTyping ? "typing" : "");
            }
        });

        onDelivered((data) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === data.messageId
                        ? { ...msg, status: 'sent' }
                        : msg
                )
            );
        });

        onDeliveredToUser((data) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === data.messageId
                        ? { ...msg, status: 'delivered' }
                        : msg
                )
            );
        });

        onSeen((data) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === data.messageId
                        ? { ...msg, status: 'seen' }
                        : msg
                )
            );
        });
    }, []);

    return (
        <View style={[styles.container, {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            backgroundColor: appColors.background
        }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: appColors.card, borderBottomColor: appColors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <MaterialCommunityIcons name="chevron-left" size={mS(30)} color={appColors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerName, { color: appColors.text }]}>{driverName}</Text>
                    <Text style={[styles.headerStatus, { color: isDark ? appColors.primary : '#10B981' }]}>Online • Driver</Text>
                    {typingUser !== "" && (
                        <View style={styles.typingContainer}>
                            <View style={styles.typingBubble}>
                                <Text style={[styles.typingText, { color: appColors.lightTextColor }]}>{driverName} is typing...</Text>

                                <View style={styles.typingDots}>
                                    <Animated.View style={[styles.dot, { opacity: anim1, backgroundColor: appColors.lightTextColor }]} />
                                    <Animated.View style={[styles.dot, { opacity: anim2, backgroundColor: appColors.lightTextColor }]} />
                                    <Animated.View style={[styles.dot, { opacity: anim3, backgroundColor: appColors.lightTextColor }]} />
                                </View>
                            </View>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={[styles.callIcon, { backgroundColor: isDark ? appColors.background : '#EFF6FF' }]} onPress={() => handleCall}>
                    <MaterialCommunityIcons name="phone" size={mS(22)} color={appColors.primary} />
                </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            {isLoading ? (
                <ChatScreenSkeleton />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[styles.listContent, messages.length === 0 && { flex: 1, justifyContent: 'center' }]}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyComponent}
                />

            )}

            {/* Quick Suggestions */}
            <View style={[styles.suggestionsWrapper, { backgroundColor: appColors.background }]}>
                <FlatList
                    horizontal
                    data={QUICK_SUGGESTIONS}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.suggestionChip, { backgroundColor: appColors.card, borderColor: appColors.border }]}
                            onPress={() => handleQuickReply(item)}
                        >
                            <Text style={[styles.suggestionText, { color: appColors.text }]}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsContent}
                />
            </View>

            {/* Input Footer */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? vS(90) : 0}
            >
                <View style={[styles.inputContainer, { backgroundColor: appColors.card, borderTopColor: appColors.border }]}>
                    <TouchableOpacity
                        style={styles.attachBtn}
                        onPress={() => setShowMenu(true)} // Opens the menu
                    >
                        <MaterialCommunityIcons name="plus" size={mS(28)} color={appColors.primary} />
                    </TouchableOpacity>

                    {/* <TouchableOpacity style={styles.attachBtn} onPress={shareCurrentLocation}>
                        <MaterialCommunityIcons name="map-marker-radius" size={mS(24)} color="#3B82F6" />
                    </TouchableOpacity> */}

                    <TextInput
                        style={[styles.input, { backgroundColor: appColors.background, color: appColors.text }]}
                        placeholder="Type a message..."
                        placeholderTextColor={appColors.lightTextColor}
                        value={message}
                        // onChangeText={setMessage}
                        onChangeText={(text) => {
                            setMessage(text);
                            sendTyping(true);

                            // Automatically stop typing after 1.5s of inactivity
                            typingTimeout?.current && clearTimeout(typingTimeout.current);
                            typingTimeout.current = setTimeout(() => sendTyping(false), 1500);
                        }}
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.sendBtn, !message && { backgroundColor: isDark ? appColors.background : '#F1F5F9' }, message && { backgroundColor: appColors.primary }]}
                        onPress={handleSendMessage}
                        disabled={!message}
                    >
                        <MaterialCommunityIcons
                            name="send"
                            size={mS(20)}
                            color={message ? "#FFF" : (isDark ? appColors.lightTextColor : "#CBD5E1")}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>


            {/* Attachment Menu Modal */}
            {showMenu && (
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMenu(false)}
                >
                    <View style={[styles.attachmentMenu, { backgroundColor: appColors.card, shadowColor: isDark ? '#000' : '#000' }]}>
                        <View style={styles.menuGrid}>
                            {/* Camera Option */}
                            <AttachmentOption
                                icon="camera"
                                color="#FF4B4B"
                                label="Camera"
                                onPress={() => {
                                    setShowMenu(false);
                                    handleCameraLaunch();
                                }}
                            />
                            {/* Gallery Option */}
                            <AttachmentOption
                                icon="image"
                                color="#A855F7"
                                label="Gallery"
                                onPress={() => {
                                    setShowMenu(false);
                                    handleGalleryLaunch();
                                }}
                            />
                            {/* Location Option */}
                            <AttachmentOption
                                icon="map-marker"
                                color="#10B981"
                                label="Location"
                                onPress={() => {
                                    setShowMenu(false);
                                    shareCurrentLocation();
                                }}
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: mS(16),
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerInfo: { flex: 1, marginLeft: hS(10) },
    headerName: { fontSize: mS(16), fontWeight: '700', color: '#0F172A' },
    headerStatus: { fontSize: mS(12), color: '#10B981', fontWeight: '600' },
    callIcon: { padding: mS(8), backgroundColor: '#EFF6FF', borderRadius: mS(12) },
    listContent: { padding: mS(16), paddingBottom: vS(20) },
    messageBubble: {
        maxWidth: '80%',
        padding: mS(12),
        borderRadius: mS(20),
        marginBottom: vS(12),
    },
    meBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#3B82F6',
        borderBottomRightRadius: vS(4),
    },
    otherBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFF',
        borderBottomLeftRadius: vS(4),
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: mS(5),
    },
    messageText: { fontSize: mS(15), lineHeight: vS(20) },
    userText: { color: '#FFF' },
    driverText: { color: '#1E293B' },
    timeText: { fontSize: mS(10), color: 'rgba(0,0,0,0.4)', marginTop: vS(4), alignSelf: 'flex-end' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: mS(12),
        backgroundColor: '#FFF',
        borderTopWidth: hS(1),
        borderTopColor: '#F1F5F9',
    },
    attachBtn: { padding: mS(8) },
    input: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: mS(20),
        paddingHorizontal: hS(16),
        paddingVertical: vS(8),
        marginHorizontal: hS(8),
        maxHeight: vS(100),
        fontSize: mS(15),
    },
    sendBtn: {
        width: hS(44),
        height: vS(44),
        borderRadius: mS(22),
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapWrapper: {
        height: vS(150),
        width: '100%',
        borderRadius: mS(12),
        overflow: 'hidden', // Clips map corners to bubble radius
        backgroundColor: '#E2E8F0', // Shows while tiles load
    },
    miniMap: {
        ...StyleSheet.absoluteFillObject,
    },
    messageImage: {
        width: hS(200),
        height: vS(150),
        borderRadius: mS(16),
        marginBottom: vS(4),
    },
    messageImageContainer: {
        position: 'relative',
        width: hS(200),
        height: vS(150),
        borderRadius: mS(16),
        marginBottom: vS(4),
        overflow: 'hidden',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'flex-end',
    },
    attachmentMenu: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: mS(24),
        borderTopRightRadius: mS(24),
        padding: mS(20),
        paddingBottom: vS(40), // Extra padding for bottom safe area
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    menuGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    menuItem: {
        alignItems: 'center',
        width: hS(80),
    },
    iconCircle: {
        width: mS(54),
        height: mS(54),
        borderRadius: mS(27),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(8),
    },
    menuLabel: {
        fontSize: mS(13),
        color: '#475569',
        fontWeight: '500',
    },

    //typing
    typingContainer: {
        marginLeft: hS(12),
        marginBottom: vS(6),
    },

    typingBubble: {
        flexDirection: "row",
        alignItems: "center",
        // backgroundColor: "#E2E8F0",
        // paddingHorizontal: hS(12),
        // paddingVertical: vS(8),
        // borderRadius: mS(20),
        maxWidth: "65%",
    },

    typingText: {
        color: "#475569",
        fontSize: mS(12),
        marginRight: hS(8),
    },

    typingDots: {
        flexDirection: "row",
        alignItems: "center",
    },

    dot: {
        width: mS(6),
        height: mS(6),
        backgroundColor: "#94A3B8",
        borderRadius: mS(3),
        marginHorizontal: mS(2),
    },
    // Empty state
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: hS(40),
        marginTop: vS(-100), // Slightly above center
    },
    emptyIconCircle: {
        width: mS(100),
        height: mS(100),
        borderRadius: mS(50),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: vS(20),
    },
    emptyTitle: {
        fontSize: mS(20),
        fontWeight: '800',
        marginBottom: vS(8),
    },
    emptySubtitle: {
        fontSize: mS(14),
        textAlign: 'center',
        lineHeight: vS(20),
    },
    // Suggestions
    suggestionsWrapper: {
        paddingVertical: vS(12),
        borderTopWidth: 1,
        borderTopColor: 'transparent', // Visual separator if needed
    },
    suggestionsContent: {
        paddingHorizontal: hS(16),
        gap: hS(8),
    },
    suggestionChip: {
        paddingHorizontal: hS(16),
        paddingVertical: vS(8),
        borderRadius: mS(20),
        borderWidth: 1,
    },
    suggestionText: {
        fontSize: mS(13),
        fontWeight: '600',
    },
});

export default ChatScreen;