import { Dimensions, Platform } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Cap the scaling width/height so it doesn't become humongous on tablets
const scaleWidth = Math.min(SCREEN_WIDTH, 480);
const scaleHeight = Math.min(SCREEN_HEIGHT, 900);

export const hS = (size: number) => (scaleWidth / guidelineBaseWidth) * size;
export const vS = (size: number) => (scaleHeight / guidelineBaseHeight) * size;
export const mS = (size: number, factor = 0.3) => size + (hS(size) - size) * factor;

// Platform helper
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
