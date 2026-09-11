import { useWindowDimensions } from 'react-native';
import { BREAKPOINTS } from '../theme/breakpoints';

export type Breakpoint = 'small' | 'compact' | 'large' | 'tablet' | 'foldable';

export const useBreakpoint = () => {
  const { width, height } = useWindowDimensions();

  let breakpoint: Breakpoint = 'foldable';
  if (width < BREAKPOINTS.SMALL) {
    breakpoint = 'small';
  } else if (width < BREAKPOINTS.COMPACT) {
    breakpoint = 'compact';
  } else if (width < BREAKPOINTS.TABLET) {
    breakpoint = 'large';
  } else if (width < BREAKPOINTS.FOLDABLE) {
    breakpoint = 'tablet';
  }

  return {
    width,
    height,
    breakpoint,
    isSmall: breakpoint === 'small',
    isCompact: breakpoint === 'compact',
    isLargePhone: breakpoint === 'large',
    isTablet: breakpoint === 'tablet',
    isFoldable: breakpoint === 'foldable',
    isLandscape: width > height,
  };
};
