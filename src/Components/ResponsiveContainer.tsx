import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  applySafeArea?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 720,
  style,
  contentContainerStyle,
  applySafeArea = false,
}) => {
  const { width } = useBreakpoint();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    width: '100%',
    ...(applySafeArea && {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }),
  };

  const innerStyle: ViewStyle = {
    width: '100%',
    maxWidth: maxWidth,
    flex: 1,
  };

  return (
    <View style={[containerStyle, style]}>
      <View style={[innerStyle, contentContainerStyle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({});
