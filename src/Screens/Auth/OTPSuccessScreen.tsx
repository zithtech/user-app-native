import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { hS, vS, mS } from '../../lib/responsive';

import { ResponsiveContainer } from '../../Components/ResponsiveContainer';

const { width } = Dimensions.get('window');

const OTPSuccessScreen: React.FC = () => {
  const { colors: appColors, isDark } = useAppTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { targetScreen } = route.params || {};

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 500 });
  }, []);

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const Particle = ({ delay, color, shape }: { delay: number; color: string; shape: 'circle' | 'square' }) => {
    const pScale = useSharedValue(0);
    const pOpacity = useSharedValue(0);
    const pY = useSharedValue(0);
    const pX = useSharedValue(0);
    const pRotate = useSharedValue(0);

    useEffect(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 150;
      pScale.value = withDelay(delay, withTiming(Math.random() * 0.8 + 0.4, { duration: 200 }));
      pOpacity.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 1000 })
      ));
      pX.value = withDelay(delay, withTiming(Math.cos(angle) * distance, { duration: 2500, easing: Easing.out(Easing.quad) }));
      pY.value = withDelay(delay, withTiming(Math.sin(angle) * distance, { duration: 2500, easing: Easing.out(Easing.quad) }));
      pRotate.value = withDelay(delay, withTiming(Math.random() * 720, { duration: 3000 }));
    }, []);

    const pStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: pX.value },
        { translateY: pY.value },
        { scale: pScale.value },
        { rotate: `${pRotate.value}deg` }
      ],
      opacity: pOpacity.value,
      position: 'absolute',
      backgroundColor: color,
      width: shape === 'circle' ? 10 : 12,
      height: 10,
      borderRadius: shape === 'circle' ? 5 : 2,
    }));

    return <Animated.View style={pStyle} />;
  };

  const particleColors = ['#FCD34D', '#60A5FA', '#F87171', '#34D399', '#A78BFA', '#FB923C', '#EC4899', '#8B5CF6'];
  const particles: Array<{ delay: number; color: string; shape: 'circle' | 'square' }> = Array.from({ length: 50 }).map((_, i) => ({
    delay: Math.random() * 500,
    color: particleColors[i % particleColors.length],
    shape: Math.random() > 0.5 ? 'circle' : 'square',
  }));

  const handleContinue = () => {
    if (targetScreen) {
      navigation.replace(targetScreen);
    } else {
      navigation.goBack();
    }
  };
  useEffect(() => {

    const timer = setTimeout(() => {
      handleContinue();
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [navigation, targetScreen, handleContinue]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={appColors.background} translucent />
      <ResponsiveContainer>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            <View style={[
              styles.mainIconContainer,
              {
                backgroundColor: '#10B981',
                shadowColor: '#10B981',
                shadowOpacity: isDark ? 0.6 : 0.4,
                shadowRadius: isDark ? 20 : 12,
                elevation: isDark ? 20 : 12,
              }
            ]}>
              <MaterialCommunityIcons name="check-decagram" size={60} color="#FFFFFF" />
            </View>
            {particles.map((p, i) => (
              <Particle key={i} delay={p.delay} color={p.color} shape={p.shape} />
            ))}
          </View>

          <Animated.View style={[styles.textContainer, animatedContentStyle]}>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.title, { color: appColors.text }]}>Verification Successful</Text>
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[styles.description, { color: isDark ? appColors.secondaryText : '#64748B' }]}>
              Success! Your OTP is verified. Your account is now active and ready to go.
            </Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: appColors.button,
                shadowColor: isDark ? appColors.button : '#000',
                shadowOpacity: isDark ? 0.5 : 0.2,
                shadowRadius: isDark ? 15 : 8,
                elevation: isDark ? 10 : 4,
              }
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={styles.continueText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: hS(24),
    marginTop: -vS(60), // Slight offset upwards for better visual balance
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vS(32),
  },
  mainIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    zIndex: 10,
  },
  title: {
    fontSize: mS(30),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: vS(16),
  },
  description: {
    fontSize: mS(16),
    textAlign: 'center',
    lineHeight: vS(24),
    paddingHorizontal: hS(20),
  },
  footer: {
    paddingHorizontal: hS(24),
    paddingBottom: vS(32),
  },
  continueButton: {
    width: '100%',
    height: vS(60),
    borderRadius: mS(18),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  continueText: {
    fontSize: mS(18),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});

export default OTPSuccessScreen;
