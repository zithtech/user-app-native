import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, Dimensions } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const lightCarouselData = [
  { id: '1', image: require('../../assets/png/light_book_a_ride_hd.png') },
  { id: '2', image: require('../../assets/png/light_safe_secure_hd.png') },
  { id: '3', image: require('../../assets/png/light_track_your_ride_hd.png') },
];

const darkCarouselData = [
  { id: '1', image: require('../../assets/png/dark_book_a_ride_hd.png') },
  { id: '2', image: require('../../assets/png/dark_safe_secure_hd.png') },
  { id: '3', image: require('../../assets/png/dark_track_your_ride_hd.png') },
];
import { Car, Logo } from '../../assets/svg';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { SignUpScreen_Nav, TabNavigation_Nav } from '../../Navigations/navigations';
import { OnboardingStatus } from '../../enums/user.enum';
import { useAppTheme } from '../../hooks/useAppTheme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hS, mS, vS } from '../../lib/responsive';
import { ResponsiveContainer } from '../../Components/ResponsiveContainer';

// ✅ No fetch, no checkSession, no useEffect
// App.tsx handles all session validation
const WelcomeScreen: React.FC<any> = ({ navigation }) => {
  const { colors: appColors, isDark } = useAppTheme();
  const user = useSelector((state: RootState) => state.userSlice.user);
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const currentCarouselData = isDark ? darkCarouselData : lightCarouselData;

  useEffect(() => {
    let interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % currentCarouselData.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex, isDark]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = ({ item }: any) => {
    const bgColor = isDark ? appColors.background : '#F4F7FB';
    return (
      <View style={{ width, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={item.image} style={styles.carImage} resizeMode='cover' />
        <LinearGradient
          colors={[bgColor, 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: vS(120) }}
        />
        <LinearGradient
          colors={['transparent', bgColor]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: vS(80) }}
        />
      </View>
    );
  };

  const handleGetStarted = () => {
    if (!user) {
      navigation.navigate('LoginScreen');
      return;
    }

    const onboarding_status = user?.onboarding_status?.toLowerCase();
    const status = user?.status?.toLowerCase();

    if (
      onboarding_status === OnboardingStatus.PROFILE_COMPLETED &&
      status === 'active'
    ) {
      navigation.replace(TabNavigation_Nav);
      return;
    }

    if (onboarding_status === OnboardingStatus.PHONE_VERIFIED) {
      navigation.replace(SignUpScreen_Nav);
      return;
    }

    navigation.navigate('LoginScreen');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? appColors.background : '#F4F7FB', paddingTop: insets.top, paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>

      <View style={styles.content}>
        <ResponsiveContainer style={{ flex: 0 }} contentContainerStyle={{ flex: 0 }}>
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              {
                isDark ?
                  <Image
                    source={require('../../assets/png/t2drive_logo.png')}
                    style={{ width: hS(100), height: vS(24), resizeMode: 'contain' }}
                  />
                  : <Image
                    source={require('../../assets/png/T2DriveDarkLogo.png')}
                    style={{ width: hS(100), height: vS(24), resizeMode: 'contain' }}
                  />
              }
            </View>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ fontSize: mS(24), fontWeight: '800', color: isDark ? '#FFFFFF' : '#0F172A', marginTop: vS(24), textAlign: 'center' }}>
              Welcome to <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#0066FF' }}>T2Drive</Text>
            </Text>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.subtitle, { color: isDark ? '#E2E8F0' : '#475569', marginTop: vS(8), fontSize: mS(14), paddingHorizontal: hS(20) }]}>
              Book affordable rides with T2Drive, your trusted ride-sharing companion.
            </Text>
          </View>
        </ResponsiveContainer>

        <View style={styles.carContainer}>
          <FlatList
            ref={flatListRef}
            data={currentCarouselData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            scrollEventThrottle={16}
            onScrollToIndexFailed={info => {
              const wait = new Promise(resolve => setTimeout(() => resolve(undefined), 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
          />
        </View>


        <ResponsiveContainer style={{ flex: 0 }} contentContainerStyle={{ flex: 0 }}>
          <View style={styles.bottomWrapper}>
            <View style={styles.paginationContainer}>
              {currentCarouselData.map((_, index) => (
                <View key={index} style={[styles.dot, activeIndex === index && styles.activeDot]} />
              ))}
            </View>

            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted} activeOpacity={0.8}>
                <View style={styles.buttonTextContainer}>
                  <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.getStartedText}>Get Started</Text>
                </View>
                <View style={styles.iconCircleContainer}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#0066FF" />
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.loginButton, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#CBD5E1' }]} onPress={() => navigation.navigate('LoginScreen')} activeOpacity={0.8}>
                <MaterialCommunityIcons name="account-outline" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} style={styles.loginIcon} />
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.loginText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.createAccountContainer} onPress={() => navigation.navigate(SignUpScreen_Nav)}>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.newHereText, { color: isDark ? '#CBD5E1' : '#64748B' }]}>
                  New here? <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.createAccountText}>Create an account</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ResponsiveContainer>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoImage: {
    width: 280,
    height: 80,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },
  carContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  bottomWrapper: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    width: '100%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#0066FF',
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  bottomSection: {
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: '#0066FF',
    borderRadius: 30,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
    position: 'relative',
  },
  buttonTextContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  iconCircleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 30,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginIcon: {
    marginRight: 8,
  },
  loginText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createAccountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newHereText: {
    fontSize: 14,
    color: '#64748B',
  },
  createAccountText: {
    color: '#0066FF',
    fontWeight: '600',
  },
});

export default WelcomeScreen;