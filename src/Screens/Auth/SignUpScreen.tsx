import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';

// --- Assets & Constants ---
import { Car, CheckedIcon, UnCheckedIcon } from '../../assets/svg';
import { Styles } from '../../lib/styles';
import colors from '../../constant/colors';
import fonts from '../../constant/fonts';
import { OTPScreen_Nav, TabNavigation_Nav, TermsAndConditions_Nav, PrivacyPolicy_Nav } from '../../Navigations/navigations';
import { hS, vS, mS } from '../../lib/responsive'; // Assuming these are your responsive helpers

// --- Components ---
import Button from '../../Components/Button';
import { Input, DropDown } from '../../Components';
import DateTimePickerComponent from '../../Components/DateTimePicker';
import { countryList } from '../../constant/country';

// --- Redux & API ---
import { setUser } from '../../redux/userSlice';
import { getDeviceId } from '../../service/utils/device';
import { useSendOtpMutation, useSignUpMutation, useUpdateUserMutation } from '../../service/userApi';
import { useRequestOtpMutation } from '../../service/authApi';
import { RootState } from '../../redux/store';
import { OnboardingStatus } from '../../enums/user.enum';
import { useLogin } from '../../service/auth/login';
import { usePreValidateReferralCodeMutation } from '../../service/referralApi';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getEditDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const POPULAR_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
const POPULAR_EXT = ['com', 'in', 'org', 'net', 'edu', 'gov', 'co.in'];

const getEmailTypoError = (email: string) => {
  if (!email || !email.includes('@')) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  const domainFull = parts[1].toLowerCase();

  // If exact match with a popular domain, it's valid
  if (POPULAR_DOMAINS.includes(domainFull)) return null;

  // Check if it's a typo of a popular domain (distance 1 or 2)
  for (const popular of POPULAR_DOMAINS) {
    const distance = getEditDistance(domainFull, popular);
    if (distance > 0 && distance <= 2) {
      return `Did you mean '${popular}'?`;
    }
  }

  // Check extensions
  const domainParts = domainFull.split('.');
  if (domainParts.length >= 2) {
    const ext = domainParts[domainParts.length - 1];
    if (!POPULAR_EXT.includes(ext)) {
      if (getEditDistance(ext, 'com') <= 1) {
        return "Did you mean '.com'?";
      }
    }
  }

  return null;
};

const SignUpScreen: React.FC<any> = ({ navigation }) => {
  const [sendOtp, { isLoading: otpLoading }] = useSendOtpMutation();
  const [signUp, { isLoading: signUpLoading }] = useSignUpMutation();
  const [updateUser, { isLoading: updateLoading }] = useUpdateUserMutation();
  const [requestOtp] = useRequestOtpMutation();
  const [preValidateReferral, { isLoading: isValidatingReferral }] = usePreValidateReferralCodeMutation();
  const { handleRequestOtp } = useLogin(navigation);

  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { colors: appColors, isDark } = useAppTheme();
  const localuser = useSelector((state: RootState) => state.userSlice.user);

  // --- State ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState(localuser?.phone_number || '');
  const [countryCode, setCountryCode] = useState('+91');
  const [email, setEmail] = useState('');
  const [dob, setDOB] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [deviceid, setDeviceid] = useState('');
  const [gender, setGender] = useState('male');
  const [showValidation, setShowValidation] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [isReferralApplied, setIsReferralApplied] = useState(false);
  const [referralError, setReferralError] = useState('');

  const options = [
    { label: 'Male', value: 'male', icon: 'gender-male' },
    { label: 'Female', value: 'female', icon: 'gender-female' },
    { label: 'Other', value: 'other', icon: 'gender-non-binary' },
  ];

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);

  useEffect(() => {
    const loadId = async () => {
      const DeviceId = await getDeviceId();
      setDeviceid(DeviceId);
    };
    loadId();
  }, []);

  // --- Logic ---
  const handleSignUp = async () => {
    if (!firstName || !mobileNumber || !mobileValidation.valid || !EMAIL_REGEX.test(email) || !!getEmailTypoError(email) || !dob || !agreedToTerms) {
      setShowValidation(true);
      if (!agreedToTerms) {
        ToastAndroid.show("Please agree to the Terms & Conditions.", ToastAndroid.SHORT);
      } else if (getEmailTypoError(email)) {
        ToastAndroid.show(getEmailTypoError(email) as string, ToastAndroid.SHORT);
      } else {
        ToastAndroid.show("Please fill all required fields correctly.", ToastAndroid.SHORT);
      }
      return;
    }

    if (firstName.trim().length < 2 || firstName.trim().length > 30) {
      setShowValidation(true);
      ToastAndroid.show("First Name must be between 2 and 30 characters.", ToastAndroid.SHORT);
      return;
    }

    if (/[^a-zA-Z\s]/.test(firstName)) {
      setShowValidation(true);
      ToastAndroid.show("First Name should not contain numbers or special characters.", ToastAndroid.SHORT);
      return;
    }

    if (lastName && (lastName.trim().length < 2 || lastName.trim().length > 30)) {
      setShowValidation(true);
      ToastAndroid.show("Last Name must be between 2 and 30 characters.", ToastAndroid.SHORT);
      return;
    }

    if (lastName && /[^a-zA-Z\s]/.test(lastName)) {
      setShowValidation(true);
      ToastAndroid.show("Last Name should not contain numbers or special characters.", ToastAndroid.SHORT);
      return;
    }

    const userId = localuser?.id;
    if (!userId) {
      const payload = {
        first_name: firstName,
        last_name: lastName || '',
        phone_number: mobileNumber,
        role: 'customer',
        device_id: deviceid,
        email: email.trim(),
        date_of_birth: dob || null,
        gender: gender,
        onboarding_status: OnboardingStatus.PROFILE_COMPLETED,
        referral_code: isReferralApplied ? referralCode.trim() : undefined,
        // phone_verified: false,
      }
      console.log(payload, "payload")
      const response = await signUp(payload).unwrap();
      if (response.success) {
        ToastAndroid.show('Profile Updated Successfully', ToastAndroid.SHORT);
        // dispatch(setUser(response.data));
        // navigation.replace(TabNavigation_Nav);
        // const res = await handleRequestOtp(mobileNumber, false, false);
        // console.log("res", res);
        // if(res.success){
        //   ToastAndroid.show('OTP Sent Successfully', ToastAndroid.SHORT);  
        // }
        const res = await requestOtp({
          phone_number: mobileNumber,
          role: 'customer',          // ✅ consistent role
          device_id: deviceid,
          allow_new_device: false,
        }).unwrap();
        if (res.success) {
          ToastAndroid.show('OTP Sent Successfully', ToastAndroid.SHORT);
          navigation.navigate(OTPScreen_Nav, {
            OTPdata: res.data,
            userData: { phone_number: mobileNumber }, // ✅ only phone_number needed here
            device_id: deviceid,
          });
        }
      }
    }
    else {
      const payload = {
        id: userId,
        first_name: firstName,
        last_name: lastName || '',
        phone_number: mobileNumber,
        role: 'customer',
        device_id: deviceid,
        email: email.trim(),
        date_of_birth: dob || null,
        gender: gender,
        onboarding_status: OnboardingStatus.COMPLETED,
        referral_code: isReferralApplied ? referralCode.trim() : undefined,
      };

      try {
        const response = await updateUser(payload).unwrap();
        if (response.success) {
          ToastAndroid.show('Profile Updated Successfully', ToastAndroid.SHORT);
          dispatch(setUser(response.data));
          navigation.replace(TabNavigation_Nav);
        }
      } catch (err: any) {
        ToastAndroid.show(err?.data?.message || 'Update failed', ToastAndroid.SHORT);
      }
    }
  };

  const formatDatePretty = (dateInput: string): string => {
    if (!dateInput) return '';
    const [yyyy, mm, dd] = dateInput.split("-");
    return `${dd}/${mm}/${yyyy}`;
  };

  const validateMobile = (number: string, code: string) => {
    if (!number) return { valid: false, message: "Mobile number is required" };

    // India specific
    if (code === '+91') {
      if (number.startsWith('0')) return { valid: false, message: "Mobile number cannot start with zero" };
      if (number.length !== 10) return { valid: false, message: "Mobile number must be 10 digits" };
      return { valid: true };
    }

    // USA / Canada
    if (code === '+1') {
      if (number.length !== 10) return { valid: false, message: "Mobile number must be 10 digits" };
      return { valid: true };
    }

    // UK
    if (code === '+44') {
      if (number.length !== 10) return { valid: false, message: "Mobile number must be 10 digits" };
      return { valid: true };
    }

    // Default E.164 check (7-15 digits)
    if (number.length < 7 || number.length > 15) {
      return { valid: false, message: "Mobile number must be 7-15 digits" };
    }

    return { valid: true };
  };


  const handleApplyReferral = async () => {
    console.log(referralCode, "referralCode 1")
    if (!referralCode.trim()) {
      setReferralError('Please enter a referral code');
      return;
    }

    try {
      console.log(referralCode, referralCode.trim(), "referralCode")
      const response = await preValidateReferral({ code: referralCode }).unwrap();
      console.log(response, "response")
      if (response.success) {
        setIsReferralApplied(true);
        setReferralError('');
        ToastAndroid.show('Referral Code Applied!', ToastAndroid.SHORT);
      } else {
        setIsReferralApplied(false);
        setReferralError(response.error || 'Invalid referral code');
      }
    } catch (err: any) {
      setIsReferralApplied(false);
      setReferralError(err?.data?.error || 'Validation failed');
    }
  };

  const mobileValidation = validateMobile(mobileNumber, countryCode);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: isDark ? '#020813' : appColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* --- PREMIUM HEADER SECTION --- */}
        <View style={[styles.headerContainer, isDark && { zIndex: 10 }]}>
          {isDark && (
            <View style={{ position: 'absolute', top: vS(-insets.top), right: hS(-24), width: Dimensions.get('window').width, height: vS(240), pointerEvents: 'none' }}>
              <Image
                source={require('../../assets/png/SignupBackground.png')}
                style={{ width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' }}
              />
              {/* <Image
                source={require('../../assets/png/LoginscreenLocation.png')}
                style={{ width: hS(40), height: vS(50), resizeMode: 'contain', position: 'absolute', right: hS(60), top: vS(80) }}
              /> */}
              {/* <Image
                source={require('../../assets/png/t2drive_car_transparent_hd.png')}
                style={{ width: hS(180), height: vS(100), resizeMode: 'contain', position: 'absolute', right: hS(-20), bottom: vS(40) }}
              /> */}
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: vS(16), zIndex: 10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: mS(4), zIndex: 10 }}>
              <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={isDark ? '#FFFFFF' : appColors.text} />
            </TouchableOpacity>
            <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
              <Image source={isDark ? require('../../assets/png/T2DriveLogo.png') : require('../../assets/png/T2DriveDarkLogo.png')} style={{ width: hS(100), height: vS(24), resizeMode: 'contain' }} />
            </View>
          </View>

          <View style={{ zIndex: 10 }}>
            <Text style={[styles.titleText, { color: isDark ? '#FFFFFF' : appColors.text }]}>Create Your Account</Text>
            <Text style={[styles.descriptionText, { color: isDark ? '#FFFFFF' : appColors.lightTextColor, maxWidth: '60%' }]}>
              {isDark ? "Let's get you started on the road!" : "Join T2Drive and enjoy seamless travel experience."}
            </Text>
          </View>
        </View>

        <View style={isDark ? { zIndex: 20, backgroundColor: '#020813', borderWidth: 1, borderColor: '#152B4D', borderRadius: mS(24), padding: hS(16), paddingTop: vS(20), marginTop: vS(0) } : {}}>

          <FormInput
            required
            label="First Name"
            placeholder="First name"
            placeholderTextColor={isDark ? '#9CA3AF' : appColors.lightTextColor}
            value={firstName}
            onChangeText={setFirstName}
            maxLength={30}
            icon="account-outline"
            appColors={appColors}
            isDark={isDark}
            hasError={(showValidation && (!firstName || firstName.trim().length < 2 || firstName.trim().length > 30)) || /[^a-zA-Z\s]/.test(firstName)}
            errorMessage={
              /[^a-zA-Z\s]/.test(firstName) ? "First Name should not contain numbers or special characters" :
                !firstName ? "First Name is required" :
                  (firstName.trim().length < 2 || firstName.trim().length > 30) ? "First Name must be 2-30 characters" : undefined
            }
          />

          <FormInput
            label="Last Name"
            placeholder="Last name"
            placeholderTextColor={isDark ? '#9CA3AF' : appColors.lightTextColor}
            value={lastName}
            onChangeText={setLastName}
            maxLength={30}
            icon="account-outline"
            appColors={appColors}
            isDark={isDark}
            hasError={(showValidation && !!(lastName && (lastName.trim().length < 2 || lastName.trim().length > 30))) || !!(lastName && /[^a-zA-Z\s]/.test(lastName))}
            errorMessage={
              lastName && /[^a-zA-Z\s]/.test(lastName) ? "Last Name should not contain numbers or special characters" :
                lastName && (lastName.trim().length < 2 || lastName.trim().length > 30) ? "Last Name must be 2-30 characters" : undefined
            }
          />

          {/* Mobile Number Input */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : appColors.text }]}>Mobile Number</Text>
            {/* 
              <View style={[styles.inputWrapper, {
              backgroundColor: isDark ? '#041026' : appColors.card,
              borderColor: (showValidation && (!mobileValidation.valid)) ? '#EF4444' : isDark ? '#152B4D' : appColors.border,
              shadowColor: isDark ? '#000' : '#64748B',
              borderRadius: isDark ? mS(12) : mS(8)
            }]}>
              <DropDown
                data={countryList}
                value={countryCode}
                onSelect={setCountryCode}
                renderTrigger={(selectedItem) => (
                  <View style={styles.countryPickerTrigger}>
                    <FastImage
                      source={{
                        uri: `https://flagcdn.com/w40/${selectedItem?.code?.toLowerCase() || 'in'}.png`,
                        priority: FastImage.priority.normal
                      }}
                      style={styles.flagIcon}
                    />
                    <Text style={[styles.countryCode, { color: isDark ? '#FFFFFF' : appColors.text }]}>{selectedItem?.value || '+91'}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={mS(20)} color={isDark ? '#9CA3AF' : appColors.lightTextColor} />
                  </View>
                )}
              />
              <View style={[styles.verticalDivider, { backgroundColor: isDark ? '#152B4D' : appColors.divider }]} />
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFFFFF' : appColors.text }]}
                placeholder="1234567890"
                placeholderTextColor={isDark ? '#9CA3AF' : appColors.lightTextColor}
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ""))}
                maxLength={10}
              />
            </View>
            */}
            <View style={[styles.inputWrapper, {
              backgroundColor: isDark ? '#041026' : appColors.card,
              borderColor: (showValidation && (!mobileValidation.valid)) ? '#EF4444' : isDark ? '#152B4D' : appColors.border,
              shadowColor: isDark ? '#000' : '#64748B',
              borderRadius: isDark ? mS(12) : mS(8)
            }]}>
              <TouchableOpacity
                style={styles.countryPickerTrigger}
                onPress={() => ToastAndroid.show('T2Drive is currently available in India only', ToastAndroid.SHORT)}
              >
                <FastImage
                  source={{
                    uri: `https://flagcdn.com/w40/in.png`,
                    priority: FastImage.priority.normal
                  }}
                  style={styles.flagIcon}
                />
                <Text style={[styles.countryCode, { color: isDark ? '#FFFFFF' : appColors.text }]}>+91</Text>
                <MaterialCommunityIcons name="chevron-down" size={mS(20)} color={isDark ? '#9CA3AF' : appColors.lightTextColor} />
              </TouchableOpacity>
              <View style={[styles.verticalDivider, { backgroundColor: isDark ? '#152B4D' : appColors.divider }]} />
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFFFFF' : appColors.text }]}
                placeholder="1234567890"
                placeholderTextColor={isDark ? '#9CA3AF' : appColors.lightTextColor}
                keyboardType="phone-pad"
                value={mobileNumber}
                onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ""))}
                maxLength={10}
              />
            </View>
            {showValidation && (!mobileValidation.valid) ? (
              <Text style={{ color: '#EF4444', fontSize: mS(12), marginTop: vS(4), marginLeft: hS(4) }}>{mobileValidation.message}</Text>
            ) : null}
          </View>

          {/* Email Input */}
          <FormInput
            required
            label="Email Address"
            placeholder="Enter your email address"
            placeholderTextColor={isDark ? '#9CA3AF' : appColors.lightTextColor}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            icon="email-outline"
            appColors={appColors}
            isDark={isDark}
            hasError={(showValidation && !email) || (email.length > 0 && !EMAIL_REGEX.test(email)) || !!getEmailTypoError(email)}
            errorMessage={
              !email && showValidation ? "Email Address is required" :
              getEmailTypoError(email) ? getEmailTypoError(email) :
              (email.length > 0 && !EMAIL_REGEX.test(email)) ? "Invalid email format" : undefined
            }
          />

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : appColors.text }]}>Select Gender</Text>
            <View style={styles.segmentedControl}>
              {options.map((item, index) => {
                const isSelected = gender === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.segmentButton,
                      { backgroundColor: isDark ? '#041026' : appColors.card, borderColor: isDark ? '#152B4D' : appColors.border, borderRadius: isDark ? mS(12) : mS(8) },
                      isSelected && [styles.segmentButtonActive, { backgroundColor: isDark ? '#007BFF' : '#0B3370', borderColor: isDark ? '#007BFF' : '#0B3370' }],
                      index === 0 ? { marginLeft: 0 } : {},
                      index === options.length - 1 ? { marginRight: 0 } : {}
                    ]}
                    onPress={() => setGender(item.value)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={mS(18)}
                      color={isSelected ? '#FFFFFF' : isDark ? '#9CA3AF' : '#64748B'}
                    />
                    <Text style={[
                      styles.segmentText,
                      { color: isDark ? '#9CA3AF' : appColors.text },
                      isSelected && styles.segmentTextActive
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* DOB Input */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : appColors.text }]}>Date of Birth</Text>
              <Text style={styles.fieldAsterisk}>*</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
              style={[styles.premiumPickerContainer, {
                backgroundColor: isDark ? '#041026' : appColors.card,
                borderColor: (showValidation && !dob) ? '#EF4444' : isDark ? '#152B4D' : appColors.border,
                borderRadius: isDark ? mS(12) : mS(8)
              }]}
            >
              <MaterialCommunityIcons name="calendar-month-outline" size={mS(20)} color={isDark ? '#FFFFFF' : appColors.lightTextColor} />
              <Text style={[styles.premiumPickerText, { color: dob ? (isDark ? '#FFFFFF' : appColors.text) : (isDark ? '#9CA3AF' : appColors.lightTextColor) }]}>
                {dob ? formatDatePretty(dob) : "Select your birthday"}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={mS(20)} color={isDark ? '#9CA3AF' : appColors.lightTextColor} />
            </TouchableOpacity>
            {showValidation && !dob ? (
              <Text style={{ color: '#EF4444', fontSize: mS(12), marginTop: vS(4), marginLeft: hS(4) }}>Date of Birth is required</Text>
            ) : null}
          </View>

          {/* --- REFERRAL SECTION --- */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : appColors.text }]}>Referral Code (Optional)</Text>
            <View style={[styles.inputWrapper, {
              backgroundColor: isDark ? '#041026' : appColors.card,
              borderColor: referralError ? '#EF4444' : isReferralApplied ? '#10B981' : isDark ? '#152B4D' : appColors.border,
              borderRadius: isDark ? mS(12) : mS(8)
            }]}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'transparent' : appColors.background }]}>
                <MaterialCommunityIcons
                  name="gift-outline"
                  size={mS(20)}
                  color={referralError ? '#EF4444' : isReferralApplied ? '#10B981' : isDark ? '#FFFFFF' : appColors.lightTextColor}
                />
              </View>
              <TextInput
                placeholder="Enter referral code"
                placeholderTextColor={isDark ? '#9CA3AF' : appColors.lightTextColor}
                style={[styles.textInput, { color: isDark ? '#FFFFFF' : appColors.text }]}
                value={referralCode}
                onChangeText={(text) => {
                  setReferralCode(text);
                  setIsReferralApplied(false);
                  setReferralError('');
                }}
                autoCapitalize="characters"
                editable={!isReferralApplied}
              />
              {isReferralApplied ? (
                <TouchableOpacity onPress={() => setIsReferralApplied(false)}>
                  <MaterialCommunityIcons name="close-circle" size={mS(24)} color="#EF4444" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleApplyReferral}
                  disabled={isValidatingReferral || !referralCode.trim()}
                  style={[styles.applyButton, { backgroundColor: isDark ? '#007BFF' : appColors.button }]}
                >
                  {isValidatingReferral ? (
                    <Text style={styles.applyButtonText}>...</Text>
                  ) : (
                    <Text style={styles.applyButtonText}>Apply</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {referralError ? (
              <Text style={styles.errorText}>{referralError}</Text>
            ) : isReferralApplied ? (
              <Text style={styles.successText}>Code applied successfully!</Text>
            ) : null}
          </View>



          {/* Terms Section */}
          <View style={styles.termsRow}>
            <TouchableOpacity onPress={() => setAgreedToTerms(!agreedToTerms)}>
              {agreedToTerms ? <View style={{ backgroundColor: isDark ? '#007BFF' : 'transparent', borderRadius: 4 }}><CheckedIcon width={mS(18)} height={mS(18)} fill={isDark ? '#007BFF' : appColors.primary} /></View> : <UnCheckedIcon width={mS(18)} height={mS(18)} stroke={isDark ? '#9CA3AF' : appColors.lightTextColor} />}
            </TouchableOpacity>
            <Text style={[styles.termsText, { color: isDark ? '#9CA3AF' : appColors.lightTextColor }]}>
              By signing up, you agree to T2Drive's
              <Text onPress={() => navigation.navigate(TermsAndConditions_Nav)} style={[fonts.bold, { color: isDark ? '#00BFFF' : appColors.text, textDecorationLine: 'underline' }]}> Terms & Conditions </Text>
              and <Text onPress={() => navigation.navigate(PrivacyPolicy_Nav)} style={[fonts.bold, { color: isDark ? '#00BFFF' : appColors.text, textDecorationLine: 'underline' }]}>Privacy Policy</Text>.
            </Text>
          </View>



          {/* Action Button */}
          <Button
            onPress={handleSignUp}
            loading={updateLoading || otpLoading}
            style={[styles.signUpButton, { backgroundColor: isDark ? '#007BFF' : '#0B3370', borderRadius: isDark ? mS(12) : mS(8) }]}
          >
            <View style={styles.buttonContentRow}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
              {(!updateLoading && !otpLoading) && (
                <MaterialCommunityIcons name="arrow-right" size={mS(20)} color="#fff" style={styles.buttonIcon} />
              )}
            </View>
          </Button>
        </View>

        <View pointerEvents="none" style={[styles.taxiPosition, { marginHorizontal: -hS(24) }]}>
          {isDark ? (
            <View style={{ width: Dimensions.get('window').width, height: vS(220), justifyContent: 'flex-end', alignItems: 'center', marginTop: vS(20) }}>
              <Image
                source={require('../../assets/png/SignupBackground.png')}
                style={{ width: Dimensions.get('window').width, height: '100%', resizeMode: 'cover', position: 'absolute' }}
              />
              {/* <Image
                source={require('../../assets/png/LoginscreenLocation.png')}
                style={{ width: hS(40), height: vS(50), resizeMode: 'contain', position: 'absolute', bottom: vS(100), right: hS(100) }}
              /> */}
              <Image
                source={require('../../assets/png/SignupCar.png')}
                style={{ width: hS(280), height: vS(140), resizeMode: 'contain', position: 'absolute', bottom: vS(-10) }}
              />
            </View>
          ) : (
            <Image
              source={require('../../assets/png/t2drive_yellow_taxi.png')}
              style={{ width: '100%', height: vS(180), resizeMode: 'cover' }}
            />
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePickerComponent
          value={new Date()}
          mode={'date'}
          isVisible={showDatePicker}
          onChange={(date: Date) => {
            const d = new Date(date);
            setDOB(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
          minimumDate={minDate}
        />
      )}
    </View>
  );
};

const FormInput = ({ label, icon, required, appColors, isDark, hasError, errorMessage, ...props }: any) => (
  <View style={styles.fieldContainer}>
    {label && (
      <View style={styles.fieldLabelRow}>
        <Text style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : appColors.text }]}>{label}</Text>
        {required && <Text style={styles.fieldAsterisk}>*</Text>}
      </View>
    )}
    <View style={[styles.inputWrapper, {
      backgroundColor: isDark ? '#041026' : appColors.card,
      borderColor: hasError ? '#EF4444' : isDark ? '#152B4D' : appColors.border,
      borderRadius: isDark ? mS(12) : mS(8)
    }]}>
      <View style={[styles.iconBox, { backgroundColor: isDark ? 'transparent' : appColors.background }]}>
        <MaterialCommunityIcons name={icon} size={mS(20)} color={hasError ? '#EF4444' : isDark ? '#FFFFFF' : appColors.lightTextColor} />
      </View>
      <TextInput
        placeholderTextColor={isDark ? '#9CA3AF' : appColors.lightTextColor}
        style={[styles.textInput, { color: isDark ? '#FFFFFF' : appColors.text }]}
        {...props}
      />
    </View>
    {hasError && errorMessage ? (
      <Text style={{ color: '#EF4444', fontSize: mS(12), marginTop: vS(4), marginLeft: hS(4) }}>{errorMessage}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: hS(24),
    paddingBottom: vS(20),
  },
  headerContainer: {
    marginTop: vS(20),
    marginBottom: vS(16),
  },
  welcomeText: {
    fontSize: mS(14),
    fontWeight: '700',
    color: colors.button,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: vS(8),
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
  fieldContainer: {
    marginBottom: vS(12),
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vS(6),
    marginLeft: hS(2),
  },
  fieldLabel: {
    fontSize: mS(13),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: vS(6),
    marginLeft: hS(2),
  },
  fieldAsterisk: {
    color: '#EF4444',
    fontSize: mS(13),
    marginLeft: hS(2),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: mS(8),
    height: vS(48),
    paddingHorizontal: hS(12),
  },
  iconBox: {
    width: mS(40),
    height: mS(40),
    borderRadius: mS(12),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hS(12),
  },
  textInput: {
    flex: 1,
    fontSize: mS(16),
    fontWeight: '700',
    color: '#1E293B',
    paddingVertical: 0,
  },
  countryPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagIcon: {
    width: hS(28),
    height: vS(18),
    borderRadius: 4,
    marginRight: hS(10),
  },
  countryCode: {
    fontSize: mS(16),
    fontWeight: '700',
    color: '#1E293B',
    marginRight: hS(6),
  },
  verticalDivider: {
    width: 1,
    height: vS(20),
    backgroundColor: '#E2E8F0',
    marginHorizontal: hS(8),
  },
  premiumPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: mS(8),
    paddingHorizontal: hS(12),
    height: vS(48),
  },
  premiumPickerText: {
    flex: 1,
    fontSize: mS(14),
    fontWeight: '500',
    marginLeft: hS(10),
  },
  segmentedControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginTop: vS(4),
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: vS(48),
    borderRadius: mS(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginHorizontal: hS(4),
  },
  segmentButtonActive: {
    backgroundColor: '#0B3370',
    borderColor: '#0B3370',
  },
  segmentText: {
    fontSize: mS(13),
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: hS(6),
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vS(10),
    marginBottom: vS(24),
    paddingHorizontal: hS(4),
  },
  termsText: {
    flex: 1,
    fontSize: mS(13),
    color: '#64748B',
    marginLeft: hS(12),
    lineHeight: vS(20),
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: '#0B3370',
    height: vS(48),
    borderRadius: mS(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: vS(8),
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginLeft: hS(6),
  },
  signUpButtonText: {
    fontSize: mS(15),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taxiPosition: {
    marginTop: vS(20),
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  applyButton: {
    paddingHorizontal: hS(12),
    paddingVertical: vS(6),
    borderRadius: mS(8),
    marginLeft: hS(8),
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: mS(12),
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: mS(12),
    marginTop: vS(4),
    marginLeft: hS(4),
    fontWeight: '600',
  },
  successText: {
    color: '#10B981',
    fontSize: mS(12),
    marginTop: vS(4),
    marginLeft: hS(4),
    fontWeight: '600',
  },
});

export default SignUpScreen;