import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ToastAndroid,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, Logo } from '../../assets/svg';
import { Styles } from '../../lib/styles';
import colors from '../../constant/colors';
import fonts from '../../constant/fonts';
import DropDown from '../../Components/DropDown';
import { countryList } from '../../constant/country';
import { useDispatch } from 'react-redux';
import { SignUpScreen_Nav } from '../../Navigations/navigations';
import Button from '../../Components/Button';
import { hS, vS, mS } from '../../lib/responsive';
import { useLogin } from '../../service/auth/login';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { ResponsiveContainer } from '../../Components/ResponsiveContainer';

const LoginScreen: React.FC<any> = ({ navigation }) => {
  const { colors: appColors, isDark } = useAppTheme();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [countryCode, setCountryCode] = useState<string>('+91');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const { handleRequestOtp, loading } = useLogin(navigation);

  // ✅ Validate and send OTP with country code prefixed
  const handleSendOtp = useCallback(async () => {
    const trimmed = mobileNumber.trim();

    if (!trimmed) {
      ToastAndroid.show('Enter Mobile Number', ToastAndroid.SHORT);
      return;
    }

    if (trimmed.length < 10) {
      ToastAndroid.show('Enter a valid Mobile Number', ToastAndroid.SHORT);
      return;
    }

    // ✅ Pass full number with country code
    // const fullPhoneNumber = `${countryCode}${trimmed}`;
    const fullPhoneNumber = `${trimmed}`;
    await handleRequestOtp(fullPhoneNumber);

  }, [mobileNumber, countryCode, handleRequestOtp]);

  const renderItem = useCallback(({ item }: any) => (
    <View style={[localStyles.dropdownItem, { backgroundColor: appColors.card }]}>
      <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[fonts.regular, { fontSize: mS(16), color: appColors.text }]}>{item.label}</Text>
      <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[fonts.regular, localStyles.countryName, { color: appColors.lightTextColor }]}>{item.name}</Text>
    </View>
  ), [appColors]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        localStyles.mainContainer,
        { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: isDark ? '#020813' : appColors.background }
      ]}
    >
      <ScrollView contentContainerStyle={localStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        <ResponsiveContainer>
        {/* PREMIUM HEADER SECTION */}
        <View style={localStyles.headerSection}>
          <View style={localStyles.logoContainer}>
            {/* <Logo width={hS(90)} height={vS(24)} /> */}
            {isDark ? (
              <Image
                source={require('../../assets/png/T2DriveLogo.png')}
                style={{ width: hS(100), height: vS(24), resizeMode: 'contain' }}
              />
            ) : (
              <Image
                source={require('../../assets/png/T2DriveDarkLogo.png')}
                style={{ width: hS(100), height: vS(24), resizeMode: 'contain' }}
              />
            )}
          </View>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.titleText, { color: isDark ? '#FFFFFF' : appColors.text }]}>Welcome to T2Drive</Text>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.descriptionText, { color: isDark ? '#9CA3AF' : appColors.lightTextColor }]}>
            Log in or sign up to book rides, rent cars or hire trusted drivers.
          </Text>
        </View>

        {/* Decorative Car Illustration */}
        <View style={[localStyles.illustrationContainer, { width: '100%' }]}>
          {isDark ? (
            <View style={{ width: '100%', height: vS(260), justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={require('../../assets/png/LoginScreenImageBackground.png')}
                style={{ width: '100%', height: '100%', resizeMode: 'stretch', position: 'absolute' }}
              />
              <Image
                source={require('../../assets/png/LoginScreenMobile.png')}
                style={{ width: hS(180), height: vS(180), resizeMode: 'contain', position: 'absolute', right: hS(20), bottom: vS(0) }}
              />
              <Image
                source={require('../../assets/png/LoginScreenCar.png')}
                style={{ width: hS(200), height: vS(140), resizeMode: 'contain', position: 'absolute', bottom: vS(2), left: hS(40) }}
              />
            </View>
          ) : (
            <Image
              source={require('../../assets/png/LoginScreenImage.png')}
              style={{ width: hS(320), height: vS(260), resizeMode: 'contain' }}
            />
          )}
        </View>

        <View style={localStyles.fieldContainer}>
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.fieldLabel, { color: isDark ? '#FFFFFF' : appColors.text }]}>Mobile Number</Text>
          {/* DropDown UI for Mobile Number */}
          {/* <View style={[localStyles.mobileInputWrapper, { backgroundColor: isDark ? '#0A1931' : appColors.card, borderColor: isDark ? '#152B4D' : appColors.border }]}>
            <DropDown
              data={countryList}
              renderItem={renderItem}
              value={countryCode}
              onSelect={setCountryCode}
              renderTrigger={(selectedItem) => (
                <View style={localStyles.countryPickerTrigger}>
                  <FastImage
                    source={{
                      uri: `https://flagcdn.com/w40/${selectedItem?.code?.toLowerCase() || 'in'}.png`,
                      priority: FastImage.priority.normal
                    }}
                    style={localStyles.flagIcon}
                  />
                  <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.countryText, { color: appColors.text }]}>{selectedItem?.value || '+91'}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={mS(20)} color={appColors.lightTextColor} />
                </View>
              )}
            />
            <View style={[localStyles.verticalDivider, { backgroundColor: appColors.divider }]} />

            <TextInput allowFontScaling={true} maxFontSizeMultiplier={1.2} placeholder="1234567890"
              placeholderTextColor={appColors.lightTextColor}
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              style={[localStyles.phoneInput, { color: appColors.text }]}
              maxLength={10}
            />
          </View> */}
          <View style={[localStyles.mobileInputWrapper, { backgroundColor: isDark ? '#0A1931' : appColors.card, borderColor: isDark ? '#152B4D' : appColors.border }]}>
            <TouchableOpacity
              style={localStyles.countryPickerTrigger}
              onPress={() => ToastAndroid.show('T2Drive is currently available in India only', ToastAndroid.SHORT)}
            >
              <FastImage
                source={{
                  uri: `https://flagcdn.com/w40/in.png`,
                  priority: FastImage.priority.normal
                }}
                style={localStyles.flagIcon}
              />
              <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.countryText, { color: isDark ? '#FFFFFF' : appColors.text }]}>+91</Text>
              <MaterialCommunityIcons name="chevron-down" size={mS(20)} color={isDark ? '#9CA3AF' : appColors.lightTextColor} />
            </TouchableOpacity>
            <View style={[localStyles.verticalDivider, { backgroundColor: isDark ? '#152B4D' : appColors.divider }]} />

            <TextInput allowFontScaling={true} maxFontSizeMultiplier={1.2} placeholder="Enter mobile number"
              placeholderTextColor={isDark ? '#9CA3AF' : appColors.lightTextColor}
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ""))}
              style={[localStyles.phoneInput, { color: isDark ? '#FFFFFF' : appColors.text }]}
              maxLength={10}
            />
          </View>
        </View>

        {/* Send OTP Button */}
        <Button
          onPress={handleSendOtp}
          disabled={loading || mobileNumber.trim().length < 10}
          style={[
            localStyles.primaryButton,
            { backgroundColor: isDark ? '#007BFF' : '#0B3370' }, // Darker blue matching the reference
            (loading || mobileNumber.trim().length < 10) && localStyles.disabledButton,
          ]}
        >
          <View style={localStyles.buttonContentRow}>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={localStyles.primaryButtonText}>
              {loading ? 'Sending...' : 'Send OTP'}
            </Text>
            {!loading && <MaterialCommunityIcons name="arrow-right" size={mS(20)} color="#fff" style={localStyles.buttonIcon} />}
          </View>
        </Button>

        {/* Divider */}
        <View style={localStyles.dividerContainer}>
          <View style={[localStyles.line, { backgroundColor: isDark ? '#152B4D' : appColors.divider }]} />
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.orText, { color: isDark ? '#9CA3AF' : appColors.lightTextColor }]}>or</Text>
          <View style={[localStyles.line, { backgroundColor: isDark ? '#152B4D' : appColors.divider }]} />
        </View>

        {/* CREATE ACCOUNT BUTTON */}
        <Button
          onPress={() => navigation.navigate(SignUpScreen_Nav)}
          style={[
            localStyles.secondaryButton,
            { backgroundColor: isDark ? '#0A1931' : '#FFFFFF', borderColor: isDark ? '#152B4D' : appColors.border }
          ]}
        >
          <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.secondaryButtonText, { color: isDark ? '#FFFFFF' : appColors.text }]}>
            Create Account
          </Text>
        </Button>

        {/* FOOTER SECTION */}
        <View style={localStyles.footer}>
          <View style={localStyles.footerIconItem}>
            <View style={isDark ? { backgroundColor: 'transparent', padding: mS(4), borderRadius: mS(20), marginBottom: vS(4), shadowColor: '#007BFF', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 } : {}}>
              <MaterialCommunityIcons name="shield-check" size={mS(30)} color={isDark ? '#007BFF' : appColors.lightTextColor} />
            </View>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.footerIconText, { color: isDark ? '#FFFFFF' : appColors.lightTextColor, fontWeight: isDark ? '700' : '500' }]}>Safe Rides</Text>
            {isDark && <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#9CA3AF', fontSize: mS(10), marginTop: vS(2) }}>Your safety</Text>}
            {isDark && <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#9CA3AF', fontSize: mS(10) }}>comes first</Text>}
          </View>
          <View style={localStyles.footerIconItem}>
            <View style={isDark ? { backgroundColor: 'transparent', padding: mS(4), borderRadius: mS(20), marginBottom: vS(4), shadowColor: '#00BFFF', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 } : {}}>
              <MaterialCommunityIcons name="account-check" size={mS(30)} color={isDark ? '#00BFFF' : appColors.lightTextColor} />
            </View>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.footerIconText, { color: isDark ? '#FFFFFF' : appColors.lightTextColor, fontWeight: isDark ? '700' : '500' }]}>Verified Drivers</Text>
            {isDark && <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#9CA3AF', fontSize: mS(10), marginTop: vS(2) }}>Trusted &</Text>}
            {isDark && <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#9CA3AF', fontSize: mS(10) }}>background checked</Text>}
          </View>
          <View style={localStyles.footerIconItem}>
            <View style={isDark ? { backgroundColor: 'transparent', padding: mS(4), borderRadius: mS(20), marginBottom: vS(4), shadowColor: '#007BFF', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 } : {}}>
              <MaterialCommunityIcons name="headphones" size={mS(30)} color={isDark ? '#007BFF' : appColors.lightTextColor} />
            </View>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[localStyles.footerIconText, { color: isDark ? '#FFFFFF' : appColors.lightTextColor, fontWeight: isDark ? '700' : '500' }]}>24/7 Support</Text>
            {isDark && <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#9CA3AF', fontSize: mS(10), marginTop: vS(2) }}>Always here</Text>}
            {isDark && <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#9CA3AF', fontSize: mS(10) }}>for you</Text>}
          </View>
        </View>

        {isDark && (
          <View style={{ alignItems: 'center', marginTop: vS(24) }}>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={{ color: '#9CA3AF', fontSize: mS(12), fontWeight: '600' }}>Ride Smart. Ride Safe. 💙</Text>
          </View>
        )}
        </ResponsiveContainer>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const localStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: vS(30),
  },
  headerSection: {
    marginTop: vS(10),
    marginBottom: vS(4),
    paddingHorizontal: hS(24),
  },
  logoContainer: {
    marginBottom: vS(16),
    alignItems: 'flex-start',
    marginLeft: -hS(4), // Slightly offset left to account for image internal padding or contain centering
  },
  titleText: {
    fontSize: mS(24),
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: vS(8),
  },
  descriptionText: {
    fontSize: mS(13),
    color: '#475569',
    lineHeight: vS(20),
    fontWeight: '400',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: vS(10),
  },
  fieldContainer: {
    paddingHorizontal: hS(24),
    marginBottom: vS(16),
  },
  fieldLabel: {
    fontSize: mS(13),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: vS(6),
    marginLeft: hS(2),
  },
  mobileInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: mS(8),
    height: vS(48),
    paddingHorizontal: hS(12),
  },
  countryPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  flagIcon: {
    width: hS(22),
    height: vS(14),
    borderRadius: 2,
    marginRight: hS(6),
  },
  countryText: {
    fontSize: mS(14),
    fontWeight: '600',
    color: '#0F172A',
    marginRight: hS(4),
  },
  verticalDivider: {
    width: 1,
    height: vS(20),
    backgroundColor: '#E2E8F0',
    marginHorizontal: hS(8),
  },
  phoneInput: {
    flex: 1,
    fontSize: mS(14),
    fontWeight: '500',
    color: '#0F172A',
    paddingVertical: 0,
  },
  primaryButton: {
    marginHorizontal: hS(24),
    height: vS(48),
    borderRadius: mS(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vS(16),
  },
  disabledButton: {
    opacity: 0.8,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: mS(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginLeft: hS(6),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: hS(24),
    marginBottom: vS(16),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  orText: {
    paddingHorizontal: hS(16),
    fontSize: mS(12),
    fontWeight: '600',
    color: '#94A3B8',
  },
  secondaryButton: {
    marginHorizontal: hS(24),
    height: vS(48),
    borderRadius: mS(8),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vS(24),
  },
  secondaryButtonText: {
    fontSize: mS(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: hS(30),
    marginTop: 'auto',
  },
  footerIconItem: {
    alignItems: 'center',
  },
  footerIconText: {
    marginTop: vS(4),
    fontSize: mS(10),
    color: '#64748B',
    fontWeight: '500',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: mS(12),
    alignItems: 'center',
  },
  countryName: {
    fontSize: mS(12),
    color: '#94A3B8',
  },
});

export default LoginScreen;