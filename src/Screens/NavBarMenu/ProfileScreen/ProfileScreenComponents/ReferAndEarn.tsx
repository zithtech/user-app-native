import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Linking
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { useAppTheme } from '../../../../hooks/useAppTheme';
import { hS, vS, mS } from '../../../../lib/responsive';
import colors from '../../../../constant/colors';
import { useGetReferralCodeQuery, useGetReferralStatsQuery, useGenerateReferralCodeMutation } from '../../../../service/referralApi';

const ReferAndEarn = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors: appColors, isDark } = useAppTheme();
  const { data: referralResponse, isLoading: codeLoading, refetch: refetchCode } = useGetReferralCodeQuery();
  const { data: statsResponse } = useGetReferralStatsQuery();
  const [generateReferralCode] = useGenerateReferralCodeMutation();
  const referralCode = referralResponse?.data?.referralCode ?? (codeLoading ? '...' : '------');
  const stats = statsResponse?.data || { totalReferrals: 0, totalEarnings: 0 };
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const steps = [
    { id: 1, title: 'Invite Friends', desc: 'Share your code with friends & family.', icon: 'account-multiple-outline' },
    { id: 2, title: 'They Register', desc: 'Your friend gets ₹50 off on first ride.', icon: 'clipboard-check-outline' },
    { id: 3, title: 'You Earn', desc: 'Get ₹100 when they complete a ride.', icon: 'cash-multiple' },
  ];

  useEffect(() => {
    if (!codeLoading && referralResponse?.success && !referralResponse?.data?.referralCode) {
      generateReferralCode()
        .unwrap()
        .then(() => {
          refetchCode();
        })
        .catch(console.error);
    }
  }, [codeLoading, referralResponse, generateReferralCode, refetchCode]);

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    setShowCopyAlert(true);
  };

  const getShareMessage = () => `Join me on T2Drive and get ₹50 off your first ride! Use my referral code: ${referralCode} https://t2drive.com/download`;

  const handleShare = async () => {
    try {
      await Share.open({
        title: 'Refer & Earn',
        message: getShareMessage(),
      });
    } catch (error) {
    }
  };

  const openSocial = (platform: 'whatsapp' | 'telegram' | 'email') => {
    const msg = encodeURIComponent(getShareMessage());
    let url = '';
    switch(platform) {
      case 'whatsapp':
        url = `whatsapp://send?text=${msg}`;
        break;
      case 'telegram':
        url = `tg://msg?text=${msg}`;
        break;
      case 'email':
        url = `mailto:?subject=Join me on T2Drive&body=${msg}`;
        break;
    }
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else handleShare();
    }).catch(() => handleShare());
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: appColors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={appColors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: appColors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={mS(24)} color={appColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: appColors.text }]}>Refer & Earn</Text>
        <View style={{ width: mS(40) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, isDark && { backgroundColor: '#1E3A8A' }]}>
          <View style={styles.heroDecoCircle1} />
          <View style={styles.heroDecoCircle2} />
          
          <View style={styles.heroTopContent}>
            <View style={styles.heroIconBox}>
              <MaterialCommunityIcons name="gift-outline" size={mS(36)} color="#FFFFFF" />
            </View>
            <View style={styles.heroTextContent}>
              <Text style={styles.heroSubtitle}>REFERRAL PROGRAM</Text>
              <Text style={styles.heroTitle}>Refer Friends, Earn Cash</Text>
              <Text style={styles.heroDesc}>Earn ₹100 for every friend who completes a ride.</Text>
            </View>
          </View>
          
          <View style={[styles.heroStatsContainer, isDark && { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{stats.total_referrals || 0}</Text>
              <Text style={styles.heroStatLabel}>Referrals</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>₹{stats.total_earnings || 0}</Text>
              <Text style={styles.heroStatLabel}>Earned</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>₹100</Text>
              <Text style={styles.heroStatLabel}>Per Referral</Text>
            </View>
          </View>
        </View>

        {/* Your Referral Code */}
        <Text style={[styles.sectionHeading, { color: appColors.lightTextColor }]}>YOUR REFERRAL CODE</Text>
        <View style={[styles.codeCard, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
          <View style={styles.codeTextContainer}>
            <Text style={[styles.codeText, { color: appColors.text }]}>{referralCode}</Text>
            <Text style={[styles.tapTip, { color: appColors.lightTextColor }]}>Tap the button to copy & share</Text>
          </View>
          <TouchableOpacity style={[styles.copyButton, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]} onPress={handleCopyCode} activeOpacity={0.7}>
            <MaterialCommunityIcons name="content-copy" size={mS(16)} color={isDark ? '#60A5FA' : '#1D4ED8'} />
            <Text style={[styles.copyButtonText, isDark && { color: '#60A5FA' }]}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <MaterialCommunityIcons name="share-variant" size={mS(20)} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share Referral Link</Text>
        </TouchableOpacity>

        {/* Social Sharing */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} onPress={() => openSocial('whatsapp')}>
            <View style={styles.socialIconBox}>
              <MaterialCommunityIcons name="whatsapp" size={mS(26)} color="#25D366" />
            </View>
            <Text style={[styles.socialText, { color: appColors.text }]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} onPress={() => openSocial('telegram')}>
            <View style={styles.socialIconBox}>
              <MaterialCommunityIcons name="send-outline" size={mS(24)} color="#3B82F6" style={{ transform: [{ rotate: '-45deg' }, { translateX: 2 }] }} />
            </View>
            <Text style={[styles.socialText, { color: appColors.text }]}>Telegram</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} onPress={() => openSocial('email')}>
            <View style={styles.socialIconBox}>
              <MaterialCommunityIcons name="email-outline" size={mS(26)} color="#EA4335" />
            </View>
            <Text style={[styles.socialText, { color: appColors.text }]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]} onPress={handleShare}>
            <View style={styles.socialIconBox}>
              <MaterialCommunityIcons name="dots-horizontal" size={mS(26)} color="#94A3B8" />
            </View>
            <Text style={[styles.socialText, { color: appColors.text }]}>More</Text>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <Text style={[styles.howItWorksHeading, { color: appColors.text }]}>How It Works</Text>
        <View style={[styles.stepsContainer, { backgroundColor: appColors.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
          {steps.map((step, index) => (
            <View key={step.id}>
              <View style={styles.stepItem}>
                <View style={[styles.stepIconBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }]}>
                  <MaterialCommunityIcons name={step.icon} size={mS(22)} color="#3B82F6" />
                  <View style={[styles.stepNumberBadge, { borderColor: appColors.card }]}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                </View>
                <View style={styles.stepContentView}>
                  <Text style={[styles.stepTitle, { color: appColors.text }]}>{step.title}</Text>
                  <Text style={[styles.stepDesc, { color: appColors.lightTextColor }]}>{step.desc}</Text>
                </View>
                {index === 1 && (
                  <View style={[styles.rewardBadge, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Text style={[styles.rewardBadgeText, isDark && { color: '#60A5FA' }]}>₹50 off</Text>
                  </View>
                )}
                {index === 2 && (
                  <View style={[styles.rewardBadge, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Text style={[styles.rewardBadgeText, isDark && { color: '#60A5FA' }]}>₹100</Text>
                  </View>
                )}
              </View>
              {index < steps.length - 1 && <View style={[styles.stepDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]} />}
            </View>
          ))}
        </View>

        {/* Terms Link */}
        <TouchableOpacity style={styles.termsButton} onPress={() => setShowTerms(true)}>
          <Text style={styles.termsText}>View Terms & Conditions</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Premium In-App Alert Modal */}
      <Modal statusBarTranslucent navigationBarTranslucent visible={showCopyAlert}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.alertBox, { backgroundColor: appColors.card, borderColor: appColors.border }]}>
            <View style={[styles.alertIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialCommunityIcons name="check-circle" size={mS(36)} color="#10B981" />
            </View>
            <Text style={[styles.alertTitle, { color: appColors.text }]}>Copied!</Text>
            <Text style={[styles.alertDesc, { color: appColors.lightTextColor }]}>
              Referral code has been copied to your clipboard.
            </Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setShowCopyAlert(false)}
            >
              <Text style={styles.alertButtonText}>OK, Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms & Conditions Modal */}
      <Modal statusBarTranslucent navigationBarTranslucent visible={showTerms}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalBackdrop, { justifyContent: 'flex-end' }]}>
          <View style={[styles.termsModalContainer, { backgroundColor: appColors.card }]}>
            <View style={styles.termsModalHeader}>
              <Text style={[styles.termsModalTitle, { color: appColors.text }]}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTerms(false)}>
                <MaterialCommunityIcons name="close" size={mS(24)} color={appColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.termsScrollView} showsVerticalScrollIndicator={false}>
              <Text style={[styles.termsDummyText, { color: appColors.lightTextColor }]}>
                1. Eligibility: This offer is valid only for new users who sign up using a valid referral code.{"\n\n"}
                2. Referral Bonus: The referrer earns ₹100 only after the referred user completes their first ride.{"\n\n"}
                3. New User Discount: The referred user gets ₹50 off on their first ride.{"\n\n"}
                4. Validity: The referral bonus and discount have no expiry date but are subject to change at the company's discretion.{"\n\n"}
                5. Fair Usage: Any fraudulent activity or misuse of the referral program will result in immediate suspension of both accounts and forfeiture of all earned rewards.{"\n\n"}
                6. Modification: We reserve the right to modify or terminate this program at any time without prior notice.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.termsAcceptBtn} onPress={() => setShowTerms(false)}>
              <Text style={styles.termsAcceptBtnText}>I Understand</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: hS(20),
    paddingVertical: vS(12),
  },
  backButton: {
    width: mS(42),
    height: mS(42),
    borderRadius: mS(21),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: mS(18),
    fontWeight: '700',
  },
  scrollContent: {
    padding: hS(20),
    paddingBottom: vS(40),
  },
  heroCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: mS(24),
    overflow: 'hidden',
    marginBottom: vS(24),
  },
  heroDecoCircle1: {
    position: 'absolute',
    width: mS(200),
    height: mS(200),
    borderRadius: mS(100),
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -mS(50),
    right: -mS(50),
  },
  heroDecoCircle2: {
    position: 'absolute',
    width: mS(150),
    height: mS(150),
    borderRadius: mS(75),
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -mS(30),
    left: -mS(30),
  },
  heroTopContent: {
    flexDirection: 'row',
    padding: hS(24),
    paddingTop: vS(32),
  },
  heroIconBox: {
    width: mS(64),
    height: mS(64),
    borderRadius: mS(20),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hS(16),
  },
  heroTextContent: {
    flex: 1,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: mS(11),
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: vS(4),
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: mS(22),
    fontWeight: '800',
    lineHeight: vS(28),
    marginBottom: vS(6),
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: mS(13),
    lineHeight: vS(18),
  },
  heroStatsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: vS(16),
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: mS(18),
    fontWeight: '800',
    marginBottom: vS(4),
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: mS(12),
    fontWeight: '500',
  },
  heroStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  sectionHeading: {
    fontSize: mS(12),
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: vS(12),
    marginLeft: hS(4),
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: mS(20),
    padding: hS(20),
    borderWidth: 1,
    marginBottom: vS(24),
  },
  codeTextContainer: {
    flex: 1,
  },
  codeText: {
    fontSize: mS(20),
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: vS(4),
  },
  tapTip: {
    fontSize: mS(13),
    fontWeight: '500',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: hS(16),
    paddingVertical: vS(10),
    borderRadius: mS(12),
  },
  copyButtonText: {
    color: '#1D4ED8',
    fontSize: mS(14),
    fontWeight: '700',
    marginLeft: hS(6),
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    height: vS(56),
    borderRadius: mS(28),
    marginBottom: vS(24),
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: mS(16),
    fontWeight: '700',
    marginLeft: hS(8),
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vS(32),
  },
  socialBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '23%',
    paddingVertical: vS(16),
    borderRadius: mS(20),
    borderWidth: 1,
  },
  socialIconBox: {
    marginBottom: vS(8),
  },
  socialText: {
    fontSize: mS(12),
    fontWeight: '600',
  },
  howItWorksHeading: {
    fontSize: mS(18),
    fontWeight: '800',
    marginBottom: vS(16),
    marginLeft: hS(4),
  },
  stepsContainer: {
    borderRadius: mS(24),
    borderWidth: 1,
    paddingHorizontal: hS(20),
    marginBottom: vS(32),
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vS(20),
  },
  stepIconBox: {
    width: mS(48),
    height: mS(48),
    borderRadius: mS(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: hS(16),
  },
  stepNumberBadge: {
    position: 'absolute',
    top: -mS(2),
    right: -mS(2),
    backgroundColor: '#1D4ED8',
    width: mS(18),
    height: mS(18),
    borderRadius: mS(9),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: mS(10),
    fontWeight: '800',
  },
  stepContentView: {
    flex: 1,
  },
  stepTitle: {
    fontSize: mS(16),
    fontWeight: '700',
    marginBottom: vS(4),
  },
  stepDesc: {
    fontSize: mS(13),
    lineHeight: vS(18),
  },
  rewardBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: hS(10),
    paddingVertical: vS(6),
    borderRadius: mS(12),
    marginLeft: hS(12),
  },
  rewardBadgeText: {
    color: '#1D4ED8',
    fontSize: mS(12),
    fontWeight: '700',
  },
  stepDivider: {
    height: 1,
    width: '100%',
  },
  termsButton: {
    alignItems: 'center',
    marginBottom: vS(20),
  },
  termsText: {
    color: '#3B82F6',
    fontSize: mS(14),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: hS(24),
  },
  alertBox: {
    width: '100%',
    padding: hS(24),
    borderRadius: mS(24),
    alignItems: 'center',
    borderWidth: 1,
  },
  alertIconBox: {
    width: mS(64),
    height: mS(64),
    borderRadius: mS(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vS(16),
  },
  alertTitle: {
    fontSize: mS(22),
    fontWeight: '800',
    marginBottom: vS(8),
    textAlign: 'center',
  },
  alertDesc: {
    fontSize: mS(14),
    textAlign: 'center',
    marginBottom: vS(24),
    lineHeight: vS(20),
  },
  alertButton: {
    width: '100%',
    backgroundColor: colors.button,
    paddingVertical: vS(14),
    borderRadius: mS(16),
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: mS(15),
    fontWeight: '800',
  },
  termsModalContainer: {
    width: '100%',
    borderTopLeftRadius: mS(24),
    borderTopRightRadius: mS(24),
    padding: mS(24),
    paddingBottom: mS(40),
  },
  termsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vS(20),
  },
  termsModalTitle: {
    fontSize: mS(18),
    fontWeight: '800',
  },
  termsScrollView: {
    maxHeight: vS(300),
    marginBottom: vS(24),
  },
  termsDummyText: {
    fontSize: mS(14),
    lineHeight: vS(22),
  },
  termsAcceptBtn: {
    width: '100%',
    backgroundColor: colors.button,
    paddingVertical: vS(14),
    borderRadius: mS(16),
    alignItems: 'center',
  },
  termsAcceptBtnText: {
    color: '#FFFFFF',
    fontSize: mS(15),
    fontWeight: '800',
  },
});

export default ReferAndEarn;