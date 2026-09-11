import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Alert,
  ToastAndroid,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ResponsiveContainer } from '../../Components/ResponsiveContainer';
import { useAppTheme } from '../../hooks/useAppTheme';
import { hS, vS, mS } from '../../lib/responsive';
import Clipboard from '@react-native-clipboard/clipboard';
import { useGetAvailableCouponsQuery, useSubscribeToCouponTopicMutation } from '../../service/couponApi';
import messaging from '@react-native-firebase/messaging';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

const WavyBackground = () => (
  <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} viewBox="0 0 350 170" preserveAspectRatio="none">
    <Defs>
      <SvgLinearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#0B309B" />
        <Stop offset="100%" stopColor="#0152FF" />
      </SvgLinearGradient>
      <SvgLinearGradient id="waveLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#2F66FF" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#6C38FF" stopOpacity="0.1" />
      </SvgLinearGradient>
      <SvgLinearGradient id="waveDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6C38FF" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="#0B309B" stopOpacity="0.1" />
      </SvgLinearGradient>
    </Defs>
    
    <Path d="M0,0 h350 v170 h-350 Z" fill="url(#bgGrad)" />
    
    <Path d="M0,0 Q120,40 180,0 Z" fill="url(#waveLight)" />
    <Path d="M0,0 Q100,80 200,0 Z" fill="url(#waveDark)" opacity="0.5" />

    <Path d="M0,170 Q100,60 250,170 Z" fill="url(#waveDark)" />
    <Path d="M0,170 Q150,120 300,170 Z" fill="url(#waveLight)" />
  </Svg>
);



const OfferCard = ({ item, index, isDark, colors, userId }: any) => {
  const [subscribeToCoupon] = useSubscribeToCouponTopicMutation();

  const isLimitReached = item.per_user_limit && item.user_usage_count >= item.per_user_limit;

  const handleCopyCode = async () => {
    if (isLimitReached) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('You have already used this coupon to its limit.', ToastAndroid.SHORT);
      } else {
        Alert.alert('Limit Reached', 'You have already used this coupon to its limit.');
      }
      return;
    }

    Clipboard.setString(item.code);

    try {
      const fcmToken = await messaging().getToken();
      if (userId && fcmToken) {
        await subscribeToCoupon({ userId, couponCode: item.code, fcmToken }).unwrap();
      }
    } catch (error) {
      console.log('Error subscribing to topic', error);
    }
    if (Platform.OS === 'android') {
      ToastAndroid.show('Coupon code copied!', ToastAndroid.SHORT);
    }
  };

  const isPromo = item.tag === 'PROMO';
  const cardTheme = isPromo
    ? {
      bg: isDark ? '#1E293B' : '#F4F8FF',
      tagBg: '#3B82F6',
      tagText: '#FFFFFF',
      boxBg: '#0A55F6',
      boxText: '#FFFFFF',
      text: isDark ? '#F8FAFC' : '#0F172A',
      subText: isDark ? '#94A3B8' : '#475569',
      border: isDark ? '#334155' : '#E2E8F0',
    }
    : {
      bg: isDark ? '#14532D' : '#ECFDF5',
      tagBg: '#34D399',
      tagText: '#064E3B',
      boxBg: '#10B981',
      boxText: '#FFFFFF',
      text: isDark ? '#F0FDF4' : '#064E3B',
      subText: isDark ? '#6EE7B7' : '#059669',
      border: isDark ? '#064E3B' : '#D1FAE5',
    };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 150).springify().damping(12)}
      style={[
        styles.card,
        {
          backgroundColor: cardTheme.bg,
          borderColor: cardTheme.border,
          opacity: isLimitReached ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.tagContainer, { backgroundColor: cardTheme.tagBg }]}>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.tagText, { color: cardTheme.tagText }]}>{item.tag}</Text>
        </View>
        <View style={styles.expiryContainer}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={cardTheme.subText} />
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.expiryText, { color: cardTheme.subText }]}>{item.expiry}</Text>
        </View>
      </View>

      <View style={styles.mainContentRow}>
        <View style={styles.leftContent}>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.title, { color: cardTheme.text }]}>{item.title}</Text>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.description, { color: cardTheme.subText }]}>{item.description}</Text>

          <TouchableOpacity
            onPress={handleCopyCode}
            style={[
              styles.codeBox,
              { borderColor: cardTheme.boxBg, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF' },
            ]}
          >
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.codeTextPrefix, { color: cardTheme.text }]}>Code: </Text>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.codeText, { color: cardTheme.boxBg }]}>{item.code}</Text>
            <MaterialCommunityIcons name="content-copy" size={16} color={cardTheme.boxBg} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        <View style={[styles.discountSquare, { backgroundColor: cardTheme.boxBg }]}>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.discountValueText, { color: cardTheme.boxText }]} numberOfLines={1} adjustsFontSizeToFit>{item.discount}</Text>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.discountSubText, { color: cardTheme.boxText }]}>{isPromo ? 'OFF' : 'CASHBACK'}</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.footerText, { color: cardTheme.subText }]}>
          Min. ride amount: ₹{item.min_ride_amount}
        </Text>
        <TouchableOpacity style={styles.viewDetailsBtn}>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.viewDetailsText, { color: cardTheme.boxBg }]}>View Details</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={cardTheme.boxBg} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const OffersScreen: React.FC = () => {
  const { colors, isDark } = useAppTheme();
  const localuser = useSelector((state: RootState) => state.userSlice.user);
  const userId = localuser?.id;
  const visible = true;

  const { data: availableCoupons, isLoading: isFetching } = useGetAvailableCouponsQuery(undefined, {
    skip: !visible,
  });

  const mappedCoupons = React.useMemo(() => {
    if (!availableCoupons) return [];

    const couponsArray = Array.isArray(availableCoupons)
      ? availableCoupons
      : (availableCoupons.data || availableCoupons.coupons || []);

    if (!Array.isArray(couponsArray)) return [];

    return couponsArray.map((coupon: any) => {
      const isPercentage = coupon.discount_type === 'PERCENTAGE';

      let expiryText = 'No Expiry';
      if (coupon.valid_until) {
        const daysLeft = Math.ceil((new Date(coupon.valid_until).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        expiryText = daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired';
      }

      return {
        id: coupon.id || coupon._id || coupon.code || Math.random().toString(),
        title: isPercentage ? `Flat ${coupon.discount_value}% OFF` : `₹${coupon.discount_value} Cashback`,
        description: `on rides up to ₹${coupon.max_discount || 100}`,
        code: coupon.code || '',
        discount: isPercentage ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`,
        expiry: expiryText,
        icon: 'ticket-percent-outline',
        tag: isPercentage ? 'PROMO' : 'CASHBACK',
        per_user_limit: coupon.per_user_limit,
        user_usage_count: coupon.user_usage_count,
        min_ride_amount: coupon.min_ride_amount || 50,
      };
    });
  }, [availableCoupons]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ResponsiveContainer>
      <FlatList
        data={mappedCoupons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <View style={styles.bannerContainer}>
              <WavyBackground />
              
              <View style={styles.bannerTextContainer}>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.bannerTitle}>Exciting discounts{'\n'}and rewards{'\n'}just for you!</Text>
              </View>
              <Image source={require('../../assets/png/10_gift_box.png')} style={styles.bannerImage} resizeMode="contain" />
            </View>

            <View style={styles.tabsContainer}>
              <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                <MaterialCommunityIcons name="label" size={mS(18)} color="#FFFFFF" style={styles.tabIcon} />
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.activeTabText}>All Offers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, styles.inactiveTab, { backgroundColor: isDark ? colors.card : '#FFF', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                <MaterialCommunityIcons name="brightness-percent" size={mS(16)} color={isDark ? colors.text : '#0F172A'} style={styles.tabIcon} />
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.inactiveTabText, { color: isDark ? colors.text : '#0F172A' }]}>Promos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, styles.inactiveTab, { backgroundColor: isDark ? colors.card : '#FFF', borderColor: isDark ? colors.border : '#E2E8F0' }]}>
                <MaterialCommunityIcons name="gift-outline" size={mS(16)} color={isDark ? colors.text : '#0F172A'} style={styles.tabIcon} />
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.inactiveTabText, { color: isDark ? colors.text : '#0F172A' }]}>Rewards</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        renderItem={({ item, index }) => (
          <OfferCard item={item} index={index} isDark={isDark} colors={colors} userId={userId} />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="ticket-outline" size={mS(80)} color={colors.secondaryText} />
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptyText, { color: colors.text }]}>No offers available right now</Text>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.emptySubText, { color: colors.lightTextColor }]}>Check back later for new promotions</Text>
          </View>
        )}
      />
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: hS(16),
    paddingBottom: vS(40),
  },
  header: {
    marginBottom: vS(16),
  },
  bannerContainer: {
    backgroundColor: '#0C35B6',
    borderRadius: mS(16),
    height: mS(170),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vS(20),
    overflow: 'hidden',
  },
  bannerTextContainer: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
    paddingLeft: mS(24),
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: mS(22),
    fontWeight: '800',
    lineHeight: mS(32),
  },
  bannerImage: {
    width: mS(160),
    height: mS(160),
    position: 'absolute',
    right: -mS(20),
    bottom: -mS(15),
    zIndex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vS(12),
    borderRadius: mS(8),
    marginHorizontal: hS(4),
  },
  activeTab: {
    backgroundColor: '#0052FF',
  },
  inactiveTab: {
    borderWidth: 1,
  },
  tabIcon: {
    marginRight: hS(4),
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: mS(13),
  },
  inactiveTabText: {
    fontWeight: '600',
    fontSize: mS(13),
  },
  card: {
    borderRadius: mS(12),
    padding: mS(16),
    marginBottom: vS(16),
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vS(12),
  },
  tagContainer: {
    paddingHorizontal: hS(8),
    paddingVertical: vS(4),
    borderRadius: mS(6),
  },
  tagText: {
    fontSize: mS(10),
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontSize: mS(12),
    fontWeight: '600',
    marginLeft: hS(4),
  },
  mainContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vS(16),
  },
  leftContent: {
    flex: 1,
    paddingRight: hS(12),
  },
  title: {
    fontSize: mS(18),
    fontWeight: '800',
    marginBottom: vS(4),
  },
  description: {
    fontSize: mS(13),
    marginBottom: vS(12),
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: hS(12),
    paddingVertical: vS(8),
    borderRadius: mS(8),
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  codeTextPrefix: {
    fontSize: mS(13),
    fontWeight: '500',
  },
  codeText: {
    fontSize: mS(14),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discountSquare: {
    width: mS(105),
    height: mS(105),
    borderRadius: mS(16),
    justifyContent: 'center',
    alignItems: 'center',
    padding: mS(10),
  },
  discountValueText: {
    fontSize: mS(28),
    fontWeight: '900',
    textAlign: 'center',
  },
  discountSubText: {
    fontSize: mS(14),
    fontWeight: '700',
    marginTop: vS(4),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: vS(12),
  },
  footerText: {
    fontSize: mS(12),
    fontWeight: '500',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: mS(12),
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    height: vS(400),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: mS(16),
    fontWeight: '700',
    marginTop: vS(16),
  },
  emptySubText: {
    fontSize: mS(14),
    marginTop: vS(8),
  },
});

export default OffersScreen;
