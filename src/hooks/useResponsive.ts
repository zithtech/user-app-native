import { useWindowDimensions } from 'react-native';

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  // Cap the scaling width/height so it doesn't become humongous on tablets
  const scaleWidth = Math.min(width, 480);
  const scaleHeight = Math.min(height, 900);

  const hS = (size: number) => (scaleWidth / guidelineBaseWidth) * size;
  const vS = (size: number) => (scaleHeight / guidelineBaseHeight) * size;
  const mS = (size: number, factor = 0.3) => size + (hS(size) - size) * factor;

  return {
    width,
    height,
    hS,
    vS,
    mS,
  };
};
