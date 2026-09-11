import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
  Modal,
  TextInput,
  Share,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import {
  useGetWalletBalanceQuery,
  useGetWalletTransactionsQuery,
  useCreateWalletTopupOrderMutation,
  useVerifyWalletTopupPaymentMutation,
  useGetWalletSettingsQuery,
  useUpdateWalletSettingsMutation,
} from '../../service/userApi';
import RazorpayCheckout from 'react-native-razorpay';
import Config from 'react-native-config';
import { ResponsiveContainer } from "../../Components/ResponsiveContainer";
import { useAppTheme } from '../../hooks/useAppTheme';
import { hS, vS, mS } from '../../lib/responsive';
import colors from '../../constant/colors';
import { WalletSuccessScreen_Nav, WalletPinSetupScreen_Nav, TransactionDetailsScreen_Nav } from '../../Navigations/navigations';
import LowBalanceBanner from '../../Components/Wallet/LowBalanceBanner';
import { downloadWalletStatement, shareWalletStatement } from '../../utils/pdfGenerator';

/* ─────────── SKELETON ─────────── */
const Skeleton = ({
  width,
  height,
  borderRadius = 8,
  style,
  isDark,
}: {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  isDark?: boolean;
}) => {
  const opacity = useSharedValue(0.3);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.75, { duration: 800, easing: Easing.ease }),
      -1,
      true
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: isDark ? '#374151' : '#E2E8F0' }, style, animStyle]}
    />
  );
};

/* ─────────── TRANSACTION ICON ─────────── */
const getTxnIcon = (type: string) => {
  switch (type) {
    case 'WALLET_TOPUP':
      return { name: 'arrow-down-circle', color: '#10B981', bg: '#ECFDF5', darkBg: 'rgba(16,185,129,0.2)', darkColor: '#34D399' };
    case 'TRIP_PAYMENT':
      return { name: 'car', color: '#3B82F6', bg: '#EFF6FF', darkBg: 'rgba(59,130,246,0.2)', darkColor: '#60A5FA' };
    case 'REFUND':
      return { name: 'cash-refund', color: '#8B5CF6', bg: '#EDE9FE', darkBg: 'rgba(139,92,246,0.2)', darkColor: '#A78BFA' };
    case 'REFERRAL_REWARD':
      return { name: 'gift', color: '#F59E0B', bg: '#FFFBEB', darkBg: 'rgba(245,158,11,0.2)', darkColor: '#FCD34D' };
    default:
      return { name: 'swap-horizontal', color: '#64748B', bg: '#F1F5F9', darkBg: 'rgba(100,116,139,0.2)', darkColor: '#94A3B8' };
  }
};

/* ─────────── MAIN SCREEN ─────────── */
const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors: appColors, isDark } = useAppTheme();
  const isFocused = useIsFocused();
  const user = useSelector((state: RootState) => state.userSlice.user);
  const userId = user?.id || '';

  // API
  const {
    data: balanceData,
    refetch: refetchBalance,
    isFetching: isBalanceFetching,
    isError: isBalanceError,
  } = useGetWalletBalanceQuery(userId, { skip: !userId });

  const {
    data: txnData,
    refetch: refetchTxns,
    isFetching: isTxnFetching,
    isError: isTxnError,
  } = useGetWalletTransactionsQuery({ userId }, { skip: !userId });

  const [createOrder, { isLoading: isCreating }] = useCreateWalletTopupOrderMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyWalletTopupPaymentMutation();
  const { data: settingsData, refetch: refetchSettings } = useGetWalletSettingsQuery(userId, { skip: !userId });
  const [updateSettings, { isLoading: isUpdatingSettings }] = useUpdateWalletSettingsMutation();

  const balance = balanceData?.data?.balance ?? 0;
  const hasWalletPin = balanceData?.data?.has_wallet_pin ?? false;
  const transactions = txnData?.data ?? [];
  const isLoading = (isBalanceFetching || isTxnFetching) && !balanceData && !txnData;

  const { trendAmount, isTrendPositive } = useMemo(() => {
    if (!transactions || transactions.length === 0) return { trendAmount: 0, isTrendPositive: true };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthNet = 0;
    let lastMonthNet = 0;

    transactions.forEach((txn: any) => {
      if (!txn.date) return;
      const parts = txn.date.split('/');
      if (parts.length === 3) {
        const txnMonth = parseInt(parts[1], 10) - 1;
        const txnYear = parseInt(parts[2], 10);

        const isCredit = txn.type === 'CREDIT' || txn.transaction_type === 'WALLET_TOPUP' || txn.transaction_type === 'REFUND' || txn.transaction_type === 'REFERRAL_REWARD';
        const amount = Number(txn.amount) || 0;
        const signedAmount = isCredit ? Math.abs(amount) : -Math.abs(amount);

        if (txnMonth === currentMonth && txnYear === currentYear) {
          currentMonthNet += signedAmount;
        } else if (txnMonth === lastMonth && txnYear === lastMonthYear) {
          lastMonthNet += signedAmount;
        }
      }
    });

    const diff = currentMonthNet - lastMonthNet;
    return {
      trendAmount: Math.abs(diff),
      isTrendPositive: diff >= 0
    };
  }, [transactions]);

  // Add Money Modal
  const [addMoneyVisible, setAddMoneyVisible] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');

  // PDF Generation State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Transactions Display State
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Auto Reload Modal
  const [autoReloadVisible, setAutoReloadVisible] = useState(false);
  const [arEnabled, setArEnabled] = useState(false);
  const [arThreshold, setArThreshold] = useState('');
  const [arReloadAmount, setArReloadAmount] = useState('');
  const [arPaymentMethod, setArPaymentMethod] = useState('CARD');

  const openAutoReload = () => {
    if (settingsData?.data) {
      setArEnabled(settingsData.data.enabled || false);
      setArThreshold(String(settingsData.data.threshold_amount || 500));
      setArReloadAmount(String(settingsData.data.reload_amount || 1000));
      setArPaymentMethod(settingsData.data.payment_method || 'CARD');
    } else {
      setArEnabled(false);
      setArThreshold('500');
      setArReloadAmount('1000');
      setArPaymentMethod('CARD');
    }
    setAutoReloadVisible(true);
  };

  const handleSaveAutoReload = async () => {
    const isFirstTimeSetup = !settingsData?.data?.enabled && arEnabled;

    const saveSettings = async () => {
      try {
        if (isFirstTimeSetup) {
          const amount = Number(arReloadAmount) || 1000;
          if (amount < 50) {
            Alert.alert('Minimum Amount', 'Auto-reload amount must be at least ₹50');
            return;
          }
          const orderRes = await createOrder({ userId, amount }).unwrap();
          const options = {
            description: 'Auto-Reload Setup Authorization',
            currency: orderRes.data?.currency || 'INR',
            key: Config.RAZORPAY_KEY_ID || 'rzp_test_SCjewpaZ96XBWa',
            amount: orderRes.data?.amount || String(amount * 100),
            name: 'VDrive',
            order_id: orderRes.data?.id,
            prefill: {
              email: user?.email || '',
              contact: user?.phone_number || '',
              name: user?.full_name || '',
            },
            theme: { color: colors.button },
          };
          const data = await RazorpayCheckout.open(options);
          const verifyRes = await verifyPayment({
            userId,
            amount,
            razorpay_order_id: data.razorpay_order_id || '',
            razorpay_payment_id: data.razorpay_payment_id || '',
            razorpay_signature: data.razorpay_signature || '',
          }).unwrap();

          if (!verifyRes.success) {
            throw new Error('Payment verification failed');
          }
        }

        await updateSettings({
          userId,
          enabled: arEnabled,
          threshold_amount: Number(arThreshold) || 500,
          reload_amount: Number(arReloadAmount) || 1000,
          payment_method: arPaymentMethod,
        }).unwrap();

        refetchSettings();
        if (isFirstTimeSetup) {
          refetchBalance();
          refetchTxns();
        }
        setAutoReloadVisible(false);
        Alert.alert('Success', 'Auto Reload settings saved.');
      } catch (e: any) {
        const msg = e?.message || e?.error?.description || e?.description || 'Failed to save settings or payment cancelled.';
        Alert.alert('Error', msg);
      }
    };

    if (isFirstTimeSetup) {
      Alert.alert(
        'Confirm Auto-Reload',
        `To authenticate your ${arPaymentMethod}, an initial top-up of ₹${arReloadAmount} will be processed now. Auto-reload will then trigger automatically when balance falls below ₹${arThreshold}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed to Pay', onPress: saveSettings }
        ]
      );
    } else {
      saveSettings();
    }
  };

  // Refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchBalance(), refetchTxns()]);
    setIsRefreshing(false);
  }, []);

  /* ─────── TOP-UP HANDLER ─────── */
  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!amount || amount < 50) {
      Alert.alert('Minimum Amount', 'Minimum top-up amount is ₹50');
      return;
    }
    setAddMoneyVisible(false);
    try {
      const orderRes = await createOrder({ userId, amount }).unwrap();
      const options = {
        description: 'Wallet Top-up',
        currency: orderRes.data?.currency || 'INR',
        key: Config.RAZORPAY_KEY_ID || 'rzp_test_SCjewpaZ96XBWa',
        amount: orderRes.data?.amount || String(amount * 100),
        name: 'VDrive',
        order_id: orderRes.data?.id,
        prefill: {
          email: user?.email || '',
          contact: user?.phone_number || '',
          name: user?.full_name || '',
        },
        theme: { color: colors.button },
      };
      const data = await RazorpayCheckout.open(options);
      const verifyRes = await verifyPayment({
        userId,
        amount,
        razorpay_order_id: data.razorpay_order_id || '',
        razorpay_payment_id: data.razorpay_payment_id || '',
        razorpay_signature: data.razorpay_signature || '',
      }).unwrap();
      if (verifyRes.success) {
        refetchBalance();
        refetchTxns();
        navigation.navigate(WalletSuccessScreen_Nav, {
          amount,
          transactionId: data.razorpay_payment_id,
          orderId: data.razorpay_order_id,
          date: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      const msg =
        error?.message ||
        error?.error?.description ||
        error?.description ||
        'Payment cancelled or failed';
      Alert.alert('Payment Failed', msg);
    }
  };

  /* ─────── PDF STATEMENT HANDLERS ─────── */
  const handleDownloadStatement = async () => {
    if (isGeneratingPDF || transactions.length === 0) return;
    setIsGeneratingPDF(true);
    try {
      const filePath = await downloadWalletStatement(user, balance, transactions);
      Alert.alert('Success', `Statement downloaded successfully to ${filePath}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to download statement');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareStatement = async () => {
    if (isGeneratingPDF || transactions.length === 0) return;
    setIsGeneratingPDF(true);
    try {
      await shareWalletStatement(user, balance, transactions);
    } catch (error) {
      Alert.alert('Error', 'Failed to share statement');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  /* ─────── RENDER ─────── */
  return (
    <View style={[styles.container, { backgroundColor: appColors.background }]}>
      {isFocused && <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={appColors.background} />}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: appColors.background }]}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={appColors.text} />
        </TouchableOpacity>
        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.headerTitle, { color: appColors.text, flex: 1, textAlign: 'center' }]}>My Wallet</Text>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate("FAQDetailsScreen", {
          title: "Wallet FAQ",
          questions: [
            {
              id: '1',
              question: "How do I add money to my wallet?",
              answer: "You can add money to your wallet using UPI, Credit/Debit Card, or Net Banking."
            },
            // {
            //   id: '2',
            //   question: "How do I withdraw money from my wallet?",
            //   answer: "You can withdraw money from your wallet to your linked bank account."
            // },
            {
              id: '2',
              question: "How do I check my transaction history?",
              answer: "You can check your transaction history in the 'Transactions' tab."
            },
            {
              id: '3',
              question: "How do I change my password?",
              answer: "You can change your password in the 'Settings' tab."
            },
          ]
        })} >
          <MaterialCommunityIcons name="help-circle-outline" size={mS(24)} color={appColors.text} />
        </TouchableOpacity>
      </View>

      <ResponsiveContainer>
      <FlatList
        data={showAllTransactions ? transactions : transactions.slice(0, 5)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + vS(40) }]}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.button} />}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            {isLoading ? (
              <View style={[styles.balanceCard, { backgroundColor: '#082075' }]}>
                <Skeleton width={120} height={16} borderRadius={8} style={{ marginBottom: vS(12) }} />
                <Skeleton width={180} height={40} borderRadius={8} style={{ marginBottom: vS(24) }} />
                <View style={{ flexDirection: 'row', gap: hS(12) }}>
                  <Skeleton width={130} height={42} borderRadius={12} />
                  <Skeleton width={130} height={42} borderRadius={12} />
                </View>
              </View>
            ) : (
              <View style={[styles.balanceCard, { backgroundColor: '#082075', overflow: 'hidden' }]}>
                <MaterialCommunityIcons name="wallet-bifold" size={mS(160)} color="rgba(255,255,255,0.04)" style={{ position: 'absolute', right: -mS(30), top: -mS(20), transform: [{ rotate: '-20deg' }] }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <View style={styles.balanceHeader}>
                      <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.balanceLabel}>Total Balance</Text>
                      <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                        <MaterialCommunityIcons name={showBalance ? "eye" : "eye-off"} size={mS(16)} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.balanceValue}>
                      {showBalance ? `₹${Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••••'}
                    </Text>
                  </View>
                  <View style={styles.walletIconContainer}>
                    {/* <MaterialCommunityIcons name="wallet-bifold" size={mS(36)} color="rgba(255,255,255,0.2)" /> */}
                    <Image source={require('../../assets/png/WalletScreenImage.png')} style={{ width: mS(75), height: mS(75) }} />
                    <View style={styles.currencyBadge}>
                      <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.currencyBadgeText}>₹</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.cardActions, { flexDirection: 'row', justifyContent: 'space-between', marginTop: vS(12) }]}>
                  <TouchableOpacity
                    style={[styles.cardActionBtn, { flex: 1, justifyContent: 'center', backgroundColor: '#FFF' }]}
                    onPress={() => { setTopupAmount(''); setAddMoneyVisible(true); }}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={mS(18)} color="#082075" />
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.cardActionText, { color: '#082075' }]}>Add Money</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardActionBtn, { backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: hS(12), flex: 1, justifyContent: 'center' }]}
                    onPress={() => navigation.navigate(WalletPinSetupScreen_Nav)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="lock-outline" size={mS(18)} color="#FFF" />
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.cardActionText, { color: '#FFF' }]}>
                      {hasWalletPin ? 'Reset PIN' : 'Setup PIN'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Auto Reload Banner */}
            {!isLoading && (
              <TouchableOpacity
                style={[styles.autoReloadCard, { backgroundColor: isDark ? appColors.card : '#FFF', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', borderWidth: 1 }]}
                onPress={openAutoReload}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: hS(12) }}>
                  <View style={{ backgroundColor: '#10B981', padding: mS(6), borderRadius: mS(20), width: mS(36), height: mS(36), justifyContent: 'center', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="autorenew" size={mS(20)} color="#FFF" />
                  </View>
                  <View>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(15), fontWeight: '700', color: appColors.text }}>Auto Reload</Text>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(12), color: appColors.secondaryText, marginTop: vS(2) }}>
                      {settingsData?.data?.enabled ? <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#10B981' }}>Active</Text> : 'Inactive'} • Min. Balance ₹{settingsData?.data?.threshold_amount || 100}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={mS(24)} color={appColors.secondaryText} />
              </TouchableOpacity>
            )}

            {/* Security Banner */}
            <View style={[styles.securityBannerCard, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#DCFCE7' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: hS(8) }}>
                <MaterialCommunityIcons name="shield-check" size={mS(18)} color="#059669" />
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.securityText, { color: isDark ? '#34D399' : '#047857' }]}>
                  All transactions are end-to-end secured
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={mS(20)} color="#059669" />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vS(16), zIndex: 10 }}>
              <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sectionTitle, { color: appColors.text, marginBottom: 0 }]}>Recent Transactions</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {transactions.length > 5 && (
                  <TouchableOpacity onPress={() => setShowAllTransactions(!showAllTransactions)} style={{ marginRight: hS(8) }}>
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#1E3A8A', fontSize: mS(14), fontWeight: '700' }}>
                      {showAllTransactions ? 'See Less' : 'See More'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="dots-vertical" size={mS(22)} color={appColors.text} />
                </TouchableOpacity>
                <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                  <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={{ flex: 1 }}>
                      <View style={[styles.dropdownMenu, { backgroundColor: appColors.card, borderColor: isDark ? '#374151' : '#E2E8F0' }]}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => { setMenuVisible(false); handleDownloadStatement(); }}
                          disabled={isGeneratingPDF || transactions.length === 0}
                        >
                          {isGeneratingPDF ? (
                            <ActivityIndicator size="small" color={appColors.text} style={{ marginRight: hS(8) }} />
                          ) : (
                            <MaterialCommunityIcons name="file-download-outline" size={mS(20)} color={appColors.text} style={{ marginRight: hS(8) }} />
                          )}
                          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.dropdownText, { color: appColors.text }]}>Download PDF</Text>
                        </TouchableOpacity>
                        <View style={{ height: 1, backgroundColor: isDark ? '#374151' : '#E2E8F0' }} />
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => { setMenuVisible(false); handleShareStatement(); }}
                          disabled={isGeneratingPDF || transactions.length === 0}
                        >
                          {isGeneratingPDF ? (
                            <ActivityIndicator size="small" color={appColors.text} style={{ marginRight: hS(8) }} />
                          ) : (
                            <MaterialCommunityIcons name="share-variant-outline" size={mS(20)} color={appColors.text} style={{ marginRight: hS(8) }} />
                          )}
                          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.dropdownText, { color: appColors.text }]}>Share PDF</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const icon = getTxnIcon(item.type);
          const isPositive = Number(item.amount) > 0;
          return (
            <TouchableOpacity
              style={[styles.txnRow, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'transparent', borderWidth: isDark ? 1 : 0 }]}
              onPress={() => navigation.navigate(TransactionDetailsScreen_Nav, { transaction: item })}
              activeOpacity={0.75}
            >
              <View style={[styles.txnIcon, { backgroundColor: isDark ? icon.darkBg : icon.bg }]}>
                <MaterialCommunityIcons name={icon.name} size={mS(22)} color={isDark ? icon.darkColor : icon.color} />
              </View>
              <View style={styles.txnBody}>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.txnTitle, { color: appColors.text }]} numberOfLines={1}>{item.title}</Text>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.txnDate, { color: appColors.secondaryText }]}>{item.date} · {item.time}</Text>
              </View>
              <View style={styles.txnRight}>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.txnAmount, { color: isPositive ? '#10B981' : (isDark ? '#F87171' : '#EF4444') }]}>
                  {isPositive ? '+' : ''}₹{Math.abs(Number(item.amount)).toLocaleString('en-IN')}
                </Text>
                <View style={[styles.txnBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' }]}>
                  <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.txnBadgeText, { color: '#10B981' }]}>{item.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={[styles.txnRow, { backgroundColor: appColors.card }]}>
                  <Skeleton width={mS(48)} height={mS(48)} borderRadius={mS(24)} isDark={isDark} />
                  <View style={{ flex: 1, marginLeft: hS(12) }}>
                    <Skeleton width={'70%'} height={14} borderRadius={7} isDark={isDark} style={{ marginBottom: vS(8) }} />
                    <Skeleton width={'45%'} height={11} borderRadius={5} isDark={isDark} />
                  </View>
                  <Skeleton width={60} height={18} borderRadius={9} isDark={isDark} />
                </View>
              ))}
            </View>
          ) : isTxnError ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="alert-circle-outline" size={mS(56)} color="#EF4444" />
              <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptyText, { color: appColors.text }]}>Failed to load transactions</Text>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.button }]} onPress={onRefresh}>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="receipt-text-outline" size={mS(60)} color={isDark ? '#374151' : '#CBD5E1'} />
              <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptyText, { color: appColors.text }]}>No transactions yet</Text>
              <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptySub, { color: appColors.secondaryText }]}>
                Your wallet activity will appear here.{'\n'}Add money to get started.
              </Text>
            </View>
          )}
      />

      {/* ═══ BOTTOM STICKY FOOTER ═══ */}
      <View style={[styles.bottomStickyFooter, { backgroundColor: isDark ? appColors.card : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', borderWidth: 1 }]}>
        <View style={styles.footerLeft}>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.footerLabel, { color: appColors.secondaryText }]}>Current Balance</Text>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.footerValue, { color: appColors.text }]}>₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>

        {/* <View style={{ alignItems: 'flex-start', flex: 1, paddingLeft: hS(8) }}>
          <View style={[styles.trendBadge, { backgroundColor: isTrendPositive ? (isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5') : (isDark ? 'rgba(239,68,68,0.15)' : '#FEE2E2') }]}>
            <MaterialCommunityIcons name={isTrendPositive ? "arrow-up" : "arrow-down"} size={mS(12)} color={isTrendPositive ? "#10B981" : "#EF4444"} />
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.trendText, { color: isTrendPositive ? '#059669' : '#DC2626' }]}>₹{trendAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.trendSub, { color: appColors.secondaryText }]}>vs last month</Text>
        </View> */}

        {/* <View style={[styles.footerDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]} /> */}

        {/* <TouchableOpacity style={styles.footerRight} activeOpacity={0.75}>
          <View style={styles.footerRightIconBox}>
            <MaterialCommunityIcons name="crown" size={mS(18)} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.footerRightTitle, { color: appColors.text }]}>Wallet Benefits</Text>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.footerRightSub, { color: appColors.secondaryText }]} numberOfLines={2}>Use wallet balance to get faster checkouts & offers!</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={mS(20)} color={appColors.secondaryText} />
        </TouchableOpacity> */}
      </View>
      </ResponsiveContainer>

      {/* ═══ AUTO RELOAD MODAL ═══ */}
      <Modal
        visible={autoReloadVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAutoReloadVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setAutoReloadVisible(false); }}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalSheet, { backgroundColor: appColors.card, paddingBottom: insets.bottom + vS(24) }]}>
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#4B5563' : '#E2E8F0' }]} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: vS(20) }}>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sheetTitle, { color: appColors.text, marginBottom: 0 }]}>Auto Reload</Text>
            <Switch
              value={arEnabled}
              onValueChange={setArEnabled}
              trackColor={{ false: '#767577', true: '#10B981' }}
              thumbColor={'#f4f3f4'}
            />
          </View>

          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sheetSubtitle, { color: appColors.secondaryText, marginBottom: vS(8) }]}>
            When balance falls below:
          </Text>
          <View style={[styles.amountInputRow, { borderBottomColor: isDark ? '#374151' : '#E2E8F0', marginBottom: vS(16), opacity: arEnabled ? 1 : 0.5 }]} pointerEvents={arEnabled ? 'auto' : 'none'}>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.rupee, { color: appColors.text, fontSize: mS(20) }]}>₹</Text>
            <TextInput allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.amountInput, { color: appColors.text, fontSize: mS(24) }]}
              keyboardType="numeric"
              value={arThreshold}
              onChangeText={setArThreshold}
            />
          </View>

          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sheetSubtitle, { color: appColors.secondaryText, marginBottom: vS(8) }]}>
            Top up with:
          </Text>
          <View style={[styles.amountInputRow, { borderBottomColor: isDark ? '#374151' : '#E2E8F0', marginBottom: vS(24), opacity: arEnabled ? 1 : 0.5 }]} pointerEvents={arEnabled ? 'auto' : 'none'}>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.rupee, { color: appColors.text, fontSize: mS(20) }]}>₹</Text>
            <TextInput allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.amountInput, { color: appColors.text, fontSize: mS(24) }]}
              keyboardType="numeric"
              value={arReloadAmount}
              onChangeText={setArReloadAmount}
            />
          </View>

          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sheetSubtitle, { color: appColors.secondaryText, marginBottom: vS(8) }]}>
            Payment Method:
          </Text>
          <View style={[styles.quickRow, { opacity: arEnabled ? 1 : 0.5 }]} pointerEvents={arEnabled ? 'auto' : 'none'}>
            {['CARD', 'UPI'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.quickBtn, { backgroundColor: arPaymentMethod === method ? colors.button : (isDark ? '#374151' : '#F1F5F9') }]}
                onPress={() => setArPaymentMethod(method)}
                activeOpacity={0.75}
              >
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.quickBtnText, { color: arPaymentMethod === method ? '#FFF' : appColors.text }]}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.proceedBtn,
              { backgroundColor: colors.button, shadowColor: colors.button, opacity: isUpdatingSettings ? 0.75 : 1 },
            ]}
            onPress={handleSaveAutoReload}
            disabled={isUpdatingSettings}
            activeOpacity={0.85}
          >
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.proceedBtnText}>
              {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
            </Text>
            <MaterialCommunityIcons name="check" size={mS(20)} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ═══ ADD MONEY MODAL ═══ */}
      <Modal
        visible={addMoneyVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAddMoneyVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setAddMoneyVisible(false); }}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={[styles.modalSheet, { backgroundColor: appColors.card, paddingBottom: insets.bottom + vS(24) }]}>
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#4B5563' : '#E2E8F0' }]} />
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sheetTitle, { color: appColors.text }]}>Add Money to Wallet</Text>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.sheetSubtitle, { color: appColors.secondaryText }]}>
            Current balance:{' '}
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontWeight: '800', color: appColors.text }}>
              ₹{Number(balance).toLocaleString('en-IN')}
            </Text>
          </Text>

          {/* Amount Input */}
          <View style={[styles.amountInputRow, { borderBottomColor: isDark ? '#374151' : '#E2E8F0' }]}>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.rupee, { color: appColors.text }]}>₹</Text>
            <TextInput allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.amountInput, { color: appColors.text }]}
              placeholder="0"
              placeholderTextColor={appColors.secondaryText}
              keyboardType="numeric"
              value={topupAmount}
              onChangeText={setTopupAmount}
              autoFocus
            />
          </View>

          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {[100, 500, 1000, 2000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.quickBtn, { backgroundColor: isDark ? '#374151' : '#F1F5F9' }]}
                onPress={() => setTopupAmount(amt.toString())}
                activeOpacity={0.75}
              >
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.quickBtnText, { color: appColors.text }]}>₹{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.proceedBtn,
              { backgroundColor: colors.button, shadowColor: colors.button, opacity: (isCreating || isVerifying) ? 0.75 : 1 },
            ]}
            onPress={handleTopup}
            disabled={isCreating || isVerifying}
            activeOpacity={0.85}
          >
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.proceedBtnText}>
              {isCreating || isVerifying ? 'Processing...' : 'Proceed to Pay'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={mS(20)} color="#FFF" />
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
};

export default WalletScreen;

/* ─────────── STYLES ─────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hS(16),
    paddingBottom: vS(12),
  },
  backBtn: {
    width: mS(40),
    height: mS(40),
    borderRadius: mS(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: mS(20),
    fontWeight: '800',
  },
  headerIconBtn: {
    width: mS(40),
    height: mS(40),
    borderRadius: mS(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: hS(16),
  },
  balanceCard: {
    backgroundColor: '#0A2585',
    borderRadius: mS(16),
    padding: hS(24),
    marginBottom: vS(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vS(8),
    gap: hS(8),
  },
  balanceLabel: {
    fontSize: mS(14),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: mS(38),
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  walletIconContainer: {
    position: 'relative',
    marginTop: vS(4),
    marginRight: hS(12),
  },
  currencyBadge: {
    position: 'absolute',
    bottom: -mS(6),
    right: -mS(6),
    width: mS(20),
    height: mS(20),
    borderRadius: mS(10),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  currencyBadgeText: {
    color: '#FFF',
    fontSize: mS(10),
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
  },
  cardActionBtn: {
    backgroundColor: '#FFF',
    borderRadius: mS(12),
    paddingVertical: vS(10),
    paddingHorizontal: hS(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hS(6),
  },
  cardActionText: {
    color: '#0A2585',
    fontWeight: '700',
    fontSize: mS(14),
  },
  autoReloadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vS(14),
    paddingHorizontal: hS(16),
    borderRadius: mS(12),
    marginBottom: vS(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  securityBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vS(12),
    paddingHorizontal: hS(16),
    borderRadius: mS(12),
    borderWidth: 1,
    marginBottom: vS(20),
  },
  securityText: {
    fontSize: mS(13),
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: mS(17),
    fontWeight: '800',
    marginBottom: vS(12),
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: mS(12),
    paddingVertical: vS(12),
    paddingHorizontal: hS(12),
    marginBottom: vS(10),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  txnIcon: {
    width: mS(42),
    height: mS(42),
    borderRadius: mS(21),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hS(12),
  },
  bottomStickyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hS(16),
    paddingVertical: vS(16),
    borderTopLeftRadius: mS(20),
    borderTopRightRadius: mS(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  footerLeft: {
    justifyContent: 'center',
  },
  footerLabel: {
    fontSize: mS(12),
    fontWeight: '500',
    marginBottom: vS(2),
  },
  footerValue: {
    fontSize: mS(18),
    fontWeight: '800',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hS(6),
    paddingVertical: vS(2),
    borderRadius: mS(4),
  },
  trendText: {
    fontSize: mS(10),
    fontWeight: '700',
    marginLeft: hS(2),
  },
  trendSub: {
    fontSize: mS(10),
    marginTop: vS(2),
  },
  footerDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: hS(12),
  },
  footerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerRightIconBox: {
    width: mS(32),
    height: mS(32),
    borderRadius: mS(16),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hS(10),
  },
  footerRightTitle: {
    fontSize: mS(13),
    fontWeight: '700',
    marginBottom: vS(2),
  },
  footerRightSub: {
    fontSize: mS(10),
    lineHeight: mS(12),
  },
  txnBody: { flex: 1 },
  txnTitle: { fontSize: mS(14), fontWeight: '700', marginBottom: vS(3) },
  txnDate: { fontSize: mS(12), fontWeight: '500' },
  txnRight: { alignItems: 'flex-end', gap: vS(4) },
  txnAmount: { fontSize: mS(15), fontWeight: '800' },
  txnBadge: {
    paddingHorizontal: hS(8),
    paddingVertical: vS(2),
    borderRadius: mS(6),
  },
  txnBadgeText: { fontSize: mS(11), fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: vS(48),
    gap: vS(12),
  },
  emptyText: { fontSize: mS(17), fontWeight: '700' },
  emptySub: { fontSize: mS(13), textAlign: 'center', lineHeight: vS(20) },
  retryBtn: {
    paddingVertical: vS(10),
    paddingHorizontal: hS(24),
    borderRadius: mS(12),
    marginTop: vS(8),
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: mS(14) },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: mS(28),
    borderTopRightRadius: mS(28),
    paddingHorizontal: hS(24),
    paddingTop: vS(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  sheetHandle: {
    width: hS(40),
    height: vS(4),
    borderRadius: vS(2),
    alignSelf: 'center',
    marginBottom: vS(20),
  },
  sheetTitle: { fontSize: mS(20), fontWeight: '800', marginBottom: vS(4) },
  sheetSubtitle: { fontSize: mS(13), marginBottom: vS(20) },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingBottom: vS(8),
    marginBottom: vS(20),
  },
  rupee: { fontSize: mS(28), fontWeight: '700', marginRight: hS(4) },
  amountInput: { flex: 1, fontSize: mS(36), fontWeight: '800', paddingVertical: 0 },
  quickRow: {
    flexDirection: 'row',
    gap: hS(8),
    marginBottom: vS(24),
    flexWrap: 'wrap',
  },
  quickBtn: {
    paddingVertical: vS(8),
    paddingHorizontal: hS(16),
    borderRadius: mS(10),
  },
  quickBtnText: { fontWeight: '700', fontSize: mS(14) },
  proceedBtn: {
    height: vS(56),
    borderRadius: mS(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hS(10),
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  proceedBtnText: { color: '#FFF', fontWeight: '800', fontSize: mS(17) },

  // Txn Detail
  txnDetailHeader: { alignItems: 'center', marginBottom: vS(20) },
  txnDetailIcon: {
    width: mS(72),
    height: mS(72),
    borderRadius: mS(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vS(12),
  },
  txnDetailTitle: { fontSize: mS(17), fontWeight: '800', marginBottom: vS(4) },
  txnDetailAmount: { fontSize: mS(28), fontWeight: '900' },
  txnDetailCard: {
    borderRadius: mS(16),
    padding: hS(16),
    borderWidth: 1,
    gap: vS(12),
    marginBottom: vS(16),
  },
  txnDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txnDetailLabel: { fontSize: mS(13), fontWeight: '600' },
  txnDetailValue: { fontSize: mS(13), fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  shareBtn: {
    height: vS(52),
    borderRadius: mS(16),
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hS(8),
  },
  shareBtnText: { fontSize: mS(15), fontWeight: '700' },
  dropdownMenu: {
    position: 'absolute',
    top: vS(420),
    right: hS(20),
    width: 180,
    borderRadius: mS(12),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vS(12),
    paddingHorizontal: hS(16),
  },
  dropdownText: {
    fontSize: mS(14),
    fontWeight: '600',
  },
});
