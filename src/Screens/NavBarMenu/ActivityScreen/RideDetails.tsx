import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    ScrollView,
    Image
} from "react-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from "../../../hooks/useAppTheme";

// Internal Components & Constants
import { Text } from "../../../Components";
import colors from "../../../constant/colors";
import formatDate from "../../../Components/FormatDate";
import generateInvoicePDF from "../../Invoice/GenerateInvoice";
import { RootState } from "../../../redux/store";
import { hS, mS, vS } from "../../../lib/responsive";
import { HelpContactScreen_Nav } from "../../../Navigations/navigations";

const RideDetails: React.FC<any> = () => {
    const { colors: appColors, isDark } = useAppTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { rideData } = route.params;
    const insets = useSafeAreaInsets();

    // Redux State
    const localuser = useSelector((state: RootState) => state?.userSlice?.user);

    // Component State
    const [routeOpen, setRouteOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Address Parsing
    const pickupaddressname = rideData?.pickup_address?.split(',')[0] || 'Pickup';
    const pickupaddressDetail = rideData?.pickup_address?.substring(rideData.pickup_address.indexOf(',') + 1).trim() || 'Address not available';
    const dropaddressname = rideData?.drop_address?.split(',')[0] || 'Dropoff';
    const dropaddressDetail = rideData?.drop_address?.substring(rideData.drop_address.indexOf(',') + 1).trim() || 'Address not available';

    const handleInvoiceAction = useCallback((action: 'email' | 'display') => {
        generateInvoicePDF(
            navigation,
            action,
            setIsLoading,
            rideData,
            localuser
        );
    }, [navigation, rideData, localuser]);

    // Format Fare properly
    const rawFare = rideData?.total_fare ? String(rideData.total_fare).replace('₹', '') : '0';
    const fareValue = Number(rawFare);

    return (
        <View style={[styles.container, { backgroundColor: isDark ? appColors.background : '#F9FAFB' }]}>
            {/* App Bar Header */}
            <View style={[styles.appBar, { backgroundColor: appColors.card, paddingTop: insets.top + vS(12), paddingBottom: vS(12) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.appBarIcon}>
                    <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={appColors.text} />
                </TouchableOpacity>
                <Text style={[styles.appBarTitle, { color: appColors.text }]}>Ride Details</Text>
                <View style={styles.appBarIcon}>
                    {/* <MaterialCommunityIcons name="dots-vertical" size={mS(24)} color={appColors.text} /> */}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + vS(40) }]}>

                {/* CARD 1: Ride Info & Trip Route */}
                <View style={[styles.card, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }]}>
                    {/* Ride Info Top */}
                    <View style={styles.rideInfoTop}>
                        <View style={styles.rideInfoLeft}>
                            <Text style={[styles.rideTypeTitle, { color: appColors.text }]}>Cab Ride</Text>
                            <Text style={[styles.dateTimeText, { color: appColors.secondaryText }]}>
                                {rideData?.scheduled_start_time ? formatDate(rideData.scheduled_start_time) : 'N/A'}
                                {' • '}
                                {rideData?.scheduled_start_time ? new Date(rideData.scheduled_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                            </Text>
                            <Text style={[styles.fareTextMain, rideData?.trip_status === 'CANCELLED' && styles.strikethrough, { color: appColors.text }]}>
                                ₹{fareValue} <Text style={{ color: appColors.secondaryText }}>(est)</Text>
                            </Text>
                        </View>
                        <View style={styles.rideInfoRight}>
                            <Image
                                source={require('../../../assets/png/T2Drive_SearchableCar.png')}
                                style={styles.carImage}
                            />
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: rideData?.trip_status === 'COMPLETED' ? (isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2') }
                            ]}>
                                <MaterialCommunityIcons
                                    name={rideData?.trip_status === 'COMPLETED' ? "check" : "close"}
                                    size={mS(14)}
                                    color={rideData?.trip_status === 'COMPLETED' ? '#16A34A' : '#EF4444'}
                                />
                                <Text style={[
                                    styles.statusText,
                                    { color: rideData?.trip_status === 'COMPLETED' ? '#16A34A' : '#EF4444' }
                                ]}>
                                    {rideData?.trip_status || 'UNKNOWN'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.horizontalDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]} />

                    {/* Trip Route Bottom */}
                    <TouchableOpacity style={styles.routeHeaderRow} onPress={() => setRouteOpen(!routeOpen)} activeOpacity={0.7}>
                        <Text style={[styles.routeHeaderTitle, { color: appColors.text }]}>Trip Route</Text>
                        <MaterialCommunityIcons name={routeOpen ? "chevron-up" : "chevron-right"} size={mS(20)} color="#2563EB" />
                    </TouchableOpacity>

                    {routeOpen && (
                        <View style={styles.timelineSection}>
                            <View style={styles.timelinePoint}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.circleOutlined, { borderColor: '#16A34A' }]}>
                                        <View style={[styles.circleFilled, { backgroundColor: '#16A34A' }]} />
                                    </View>
                                    <View style={styles.dottedLine} />
                                </View>
                                <View style={styles.timelineRight}>
                                    <Text style={[styles.locationName, { color: appColors.text }]}>{pickupaddressname}</Text>
                                    <Text style={[styles.locationDetail, { color: appColors.secondaryText }]}>{pickupaddressDetail}</Text>
                                </View>
                            </View>

                            <View style={[styles.timelinePoint, { marginTop: 0 }]}>
                                <View style={styles.timelineLeft}>
                                    <View style={[styles.circleOutlined, { borderColor: '#EF4444' }]}>
                                        <View style={[styles.circleFilled, { backgroundColor: '#EF4444' }]} />
                                    </View>
                                </View>
                                <View style={styles.timelineRight}>
                                    <Text style={[styles.locationName, { color: appColors.text }]}>{dropaddressname}</Text>
                                    <Text style={[styles.locationDetail, { color: appColors.secondaryText }]}>{dropaddressDetail}</Text>
                                </View>
                            </View>

                            <View style={styles.estStatsRow}>
                                <MaterialCommunityIcons name="clock-outline" size={mS(14)} color={appColors.secondaryText} />
                                <Text style={[styles.estStatsText, { color: appColors.secondaryText }]}>
                                    {/* Ideally dynamic values from rideData, using mock to match image for now */}
                                    19.8 mins • 8.1 kms (est)
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* CARD 2: Need Help */}
                <TouchableOpacity
                    style={[styles.helpCard, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : '#EFF6FF' }]}
                    onPress={() => navigation.navigate(HelpContactScreen_Nav)}
                >
                    <View style={styles.helpIconBox}>
                        <MaterialCommunityIcons name="headphones" size={mS(24)} color="#FFFFFF" />
                    </View>
                    <View style={styles.helpTextContainer}>
                        <Text style={[styles.helpTitle, { color: '#1E3A8A' }]}>Need help?</Text>
                        <Text style={[styles.helpSubtitle, { color: isDark ? '#94A3B8' : '#475569' }]}>We're a tap away</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={mS(20)} color="#2563EB" />
                </TouchableOpacity>

                {/* CARD 3: Fare Summary */}
                <View style={styles.fareSummaryWrapper}>
                    <View style={styles.fareHeaderRow}>
                        <MaterialCommunityIcons name="text-box-outline" size={mS(20)} color={appColors.text} />
                        <Text style={[styles.fareHeaderTitle, { color: appColors.text }]}>Fare Summary</Text>
                        <MaterialCommunityIcons name="chevron-right" size={mS(20)} color={appColors.secondaryText} />
                    </View>

                    <View style={[styles.fareCard, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }]}>
                        <View style={styles.fareTotalRow}>
                            <Text style={[styles.fareTotalLabel, { color: appColors.text }]}>Total Fare</Text>
                            <Text style={[styles.fareTotalAmount, { color: '#16A34A' }]}>₹{fareValue}</Text>
                        </View>

                        <View style={[styles.dashedDivider, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]} />

                        <View style={styles.breakdownRow}>
                            <Text style={[styles.breakdownLabel, { color: appColors.secondaryText }]}>Base Fare</Text>
                            <Text style={[styles.breakdownValue, { color: appColors.secondaryText }]}>₹{rideData?.base_fare || '0.00'}</Text>
                        </View>

                        <View style={styles.breakdownRow}>
                            <Text style={[styles.breakdownLabel, { color: appColors.secondaryText }]}>Driver Allowance</Text>
                            <Text style={[styles.breakdownValue, { color: appColors.secondaryText }]}>₹{rideData?.driver_allowance || '0.00'}</Text>
                        </View>

                        <View style={[styles.solidDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#E5E7EB' }]} />

                        <View style={styles.actionFooter}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                disabled={rideData?.trip_status === 'CANCELLED'}
                                onPress={() => handleInvoiceAction('email')}
                            >
                                <MaterialCommunityIcons name="email-outline" size={mS(20)} color="#2563EB" />
                                <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Email Receipt</Text>
                            </TouchableOpacity>

                            <View style={[styles.verticalDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }]} />

                            <TouchableOpacity
                                style={styles.actionBtn}
                                disabled={rideData?.trip_status === 'CANCELLED'}
                                onPress={() => handleInvoiceAction('display')}
                            >
                                <Text style={[styles.actionBtnText, { color: '#2563EB', marginRight: hS(6) }]}>Invoice</Text>
                                <View style={styles.invoiceIconCircle}>
                                    <MaterialCommunityIcons name="download" size={mS(12)} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Footer Disclaimer */}
                <View style={[styles.disclaimerBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F1F5F9' }]}>
                    <MaterialCommunityIcons name="information-outline" size={mS(20)} color={isDark ? '#CBD5E1' : '#334155'} style={styles.infoIcon} />
                    <Text style={[styles.disclaimerText, { color: isDark ? '#94A3B8' : '#475569' }]}>
                        T2Drive serves solely as a facilitator between you and independent Captains. The fare displayed is an estimate; the final fare is subject to mutual agreement. A tax invoice will not be provided for this trip. Please refer to the T&Cs for further details.
                    </Text>
                </View>

            </ScrollView>

            {/* Loading Modal */}
            <Modal statusBarTranslucent navigationBarTranslucent transparent visible={isLoading} animationType="fade">
                <View style={styles.modalBackground}>
                    <View style={styles.activityWrapper}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.loadingText}>Processing...</Text>
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
    // App Bar
    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: hS(16),
        paddingVertical: vS(16),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    appBarIcon: {
        padding: mS(4),
    },
    appBarTitle: {
        fontSize: mS(18),
        fontWeight: '700',
        // textAlign: 'center',
        // justifyContent: 'center',
        // alignSelf: 'center',
    },

    scrollContent: {
        paddingHorizontal: hS(16),
        paddingVertical: vS(16),
        paddingBottom: vS(40),
    },

    // Shared Card Styles
    card: {
        borderRadius: mS(16),
        borderWidth: 1,
        marginBottom: vS(16),
        overflow: 'hidden',
    },

    // Ride Info Top
    rideInfoTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: mS(16),
    },
    rideInfoLeft: {
        flex: 1,
    },
    rideTypeTitle: {
        fontSize: mS(16),
        fontWeight: '800',
        marginBottom: vS(4),
    },
    dateTimeText: {
        fontSize: mS(12),
        fontWeight: '500',
        marginBottom: vS(8),
    },
    fareTextMain: {
        fontSize: mS(16),
        fontWeight: '800',
    },
    strikethrough: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    rideInfoRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    carImage: {
        width: mS(80),
        height: mS(40),
        resizeMode: 'contain',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: hS(8),
        paddingVertical: vS(4),
        borderRadius: mS(6),
        marginTop: vS(8),
    },
    statusText: {
        fontSize: mS(11),
        fontWeight: '700',
        marginLeft: hS(4),
    },

    horizontalDivider: {
        height: 1,
        width: '100%',
    },

    // Trip Route Bottom
    routeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: mS(16),
    },
    routeHeaderTitle: {
        fontSize: mS(15),
        fontWeight: '700',
    },
    timelineSection: {
        paddingHorizontal: mS(16),
        paddingBottom: mS(16),
    },
    timelinePoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineLeft: {
        alignItems: 'center',
        width: mS(24),
    },
    circleOutlined: {
        width: mS(16),
        height: mS(16),
        borderRadius: mS(8),
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    circleFilled: {
        width: mS(6),
        height: mS(6),
        borderRadius: mS(3),
    },
    dottedLine: {
        width: 1,
        height: vS(32),
        borderStyle: 'dotted',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginVertical: vS(2),
    },
    timelineRight: {
        flex: 1,
        marginLeft: hS(12),
        paddingBottom: vS(20),
    },
    locationName: {
        fontSize: mS(14),
        fontWeight: '700',
        marginBottom: vS(2),
    },
    locationDetail: {
        fontSize: mS(12),
        fontWeight: '500',
    },
    estStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: hS(36),
        marginTop: -vS(12),
    },
    estStatsText: {
        fontSize: mS(11),
        fontWeight: '500',
        marginLeft: hS(6),
    },

    // Need Help Card
    helpCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: mS(12),
        borderRadius: mS(12),
        marginBottom: vS(16),
    },
    helpIconBox: {
        width: mS(40),
        height: mS(40),
        borderRadius: mS(8),
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpTextContainer: {
        flex: 1,
        marginLeft: hS(12),
    },
    helpTitle: {
        fontSize: mS(15),
        fontWeight: '700',
        marginBottom: vS(2),
    },
    helpSubtitle: {
        fontSize: mS(12),
        fontWeight: '500',
    },

    // Fare Summary
    fareSummaryWrapper: {
        marginBottom: vS(16),
    },
    fareHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: vS(12),
        paddingHorizontal: hS(4),
    },
    fareHeaderTitle: {
        flex: 1,
        fontSize: mS(15),
        fontWeight: '700',
        marginLeft: hS(8),
    },
    fareCard: {
        borderRadius: mS(16),
        borderWidth: 1,
        overflow: 'hidden',
    },
    fareTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: mS(16),
    },
    fareTotalLabel: {
        fontSize: mS(15),
        fontWeight: '700',
    },
    fareTotalAmount: {
        fontSize: mS(16),
        fontWeight: '800',
    },
    dashedDivider: {
        borderTopWidth: 1,
        borderStyle: 'dashed',
        marginHorizontal: mS(16),
        marginBottom: vS(12),
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: mS(16),
        marginBottom: vS(12),
    },
    breakdownLabel: {
        fontSize: mS(13),
        fontWeight: '500',
    },
    breakdownValue: {
        fontSize: mS(13),
        fontWeight: '600',
    },
    solidDivider: {
        height: 1,
        width: '100%',
    },
    actionFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: vS(16),
    },
    actionBtnText: {
        fontSize: mS(14),
        fontWeight: '700',
        marginLeft: hS(6),
    },
    verticalDivider: {
        width: 1,
        height: '60%',
    },
    invoiceIconCircle: {
        width: mS(20),
        height: mS(20),
        borderRadius: mS(10),
        backgroundColor: '#2563EB',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Footer Disclaimer
    disclaimerBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: mS(16),
        borderRadius: mS(12),
    },
    infoIcon: {
        marginTop: vS(2),
    },
    disclaimerText: {
        flex: 1,
        marginLeft: hS(12),
        fontSize: mS(11),
        lineHeight: vS(16),
        fontWeight: '500',
    },

    // Modal
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityWrapper: {
        backgroundColor: '#1E293B',
        padding: mS(24),
        borderRadius: mS(16),
        alignItems: 'center',
    },
    loadingText: {
        marginTop: vS(12),
        fontSize: mS(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default RideDetails;