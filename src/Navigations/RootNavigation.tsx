import { View, Text, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import React, { Suspense, lazy } from 'react';
import { CardStyleInterpolators, createStackNavigator, TransitionSpecs } from '@react-navigation/stack';
import {
  Auth_Nav,
  Dashboard_Nav,
  HomeScreen_Nav,
  MapTracking_Nav,
  LocationSearch_Nav,
  MapViewComponent_Nav,
  ServiceScreen_Nav,
  TabNavigation_Nav,
  ProfilescreenComponents_Nav,
  TripNavigation_Nav,
  RideDetails_Nav,
  RideDetailsEdit_Nav,
  BookedTripScreen_Nav,
  RideCompletedScreen_Nav,
  FareSummaryScreen_Nav,
  CheckoutScreen_Nav,
  PaymentSuccessScreen_Nav,
  FAQDetailsScreen_Nav,
  HelpContactScreen_Nav,
  FavouritelocationScreens_Nav,
  AboutVdriveScreen_Nav,
  PreferencesScreen_Nav,
  NotificationScreen_Nav,
  SafetyScreen_Nav,
  DeleteAccountInfoScreen_Nav,
  DeleteAccountReasonScreen_Nav,
  DeleteAccountVerifyScreen_Nav,
  DeleteAccountConfirmScreen_Nav,
  DeleteAccountSuccessScreen_Nav,
  SearchDriverScreen_Nav,
  ContactScreen_Nav,
  userMapTest_nav,
  ChatScreen_Nav,
  OngoingTripsList_Nav,
  ScheduledTripsList_Nav,
  OffersScreen_Nav,
  WalletScreen_Nav,
  WalletSuccessScreen_Nav,
  WalletPinSetupScreen_Nav,
  TransactionDetailsScreen_Nav,
} from './navigations';
import AuthNavigation from './AuthNavigation';
import DashBoardScreen from '../Screens/Dashboard';
import HomeScreen from '../Screens/HomeScreen/index';
// import LocationSearchScreen from '../Screens/MapTrackingScreen/LocationSearchScreen';
import LocationSearch from '../Screens/LocationSelection/index';
import MapViewComponent from '../Screens/MapTrackingScreen/MapViewComponent';
import MapTracking from '../Screens/MapTrackingScreen/MapTracking';
import ServiceScreen from '../Screens/NavBarMenu/ServiceScreen/index';
import { LeftArrow } from '../assets/svg';
import { useTheme } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Styles } from '../lib/styles';
import TabNavigations from './TabNavigation';
import ProfileScreenComponents from './ProfileScreenNavigation';
import TripNavigation from './TripNavigation';
import RideDetails from '../Screens/NavBarMenu/ActivityScreen/RideDetails';
import PDFViewerScreen from '../Screens/Invoice/PDFViewer';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import ScheduledrideEdit from '../Screens/NavBarMenu/ActivityScreen/ScheduledrideEdit';
import TripScreen from '../Screens/TripScreen';
import RideCompletedScreen from '../Screens/TripScreen/TripComponents/RideCompletedScreen';
import FareSummaryScreen from '../Screens/PaymentScreen/FareSummaryScreen';
import CheckoutScreen from '../Screens/PaymentScreen/CheckoutScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SearchingDriver from '../Screens/TripScreen/TripComponents/SearchingForDriver';
import { vS } from '../lib/responsive';
import { UserAppUI } from '../Screens/MapTrackingScreen/UserMapScreen';
import ChatScreen from '../Screens/ChatScreen';
import OngoingTripsList from '../Screens/TripScreen/TripComponents/LiveRideBadge/OngoingTripsList';
import ScheduledTripCard from '../Screens/TripScreen/TripComponents/ScheduledRideBadge/ScheduledTripList';
import PaymentSuccessScreen from '../Screens/PaymentScreen/PaymentSuccessScreen';

const withSuspense = (Component: any) => {
  return (props: any) => {
    const { colors } = useAppTheme();
    return (
      <Suspense fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      }>
        <Component {...props} />
      </Suspense>
    );
  };
};

const FAQDetails = withSuspense(lazy(() => import('../Screens/HelpScreen/FAQDetails')));
const HelpScreen = withSuspense(lazy(() => import('../Screens/HelpScreen/index')));
const Favourites = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/Favourites')));
const AboutVDrive = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/AboutVDrive')));
const Preferences = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/Preferences')));
const NotificationScreen = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/NotificationScreen')));
const SafetyScreen = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/SafetyScreen')));
const DeleteAccountInfoScreen = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/DeleteAccountInfo')));
const DeleteAccountReasonScreen = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/DeleteAccountReason')));
const DeleteAccountVerifyScreen = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/DeleteAccountVerify')));
const DeleteAccountConfirmScreen = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/DeleteAccountConfirm')));
const DeleteAccountSuccessScreen = withSuspense(lazy(() => import('../Screens/NavBarMenu/ProfileScreen/ProfileScreenComponents/SettingsComponents/DeleteAccountSuccess')));
const ContactListScreen = withSuspense(lazy(() => import('../Screens/ContactScreen')));
const OffersScreen = withSuspense(lazy(() => import('../Screens/Offers/OffersScreen')));
const WalletScreen = withSuspense(lazy(() => import('../Screens/Profile/WalletScreen')));
const WalletSuccessScreen = withSuspense(lazy(() => import('../Screens/Profile/WalletSuccessScreen')));
const WalletPinSetupScreen = withSuspense(lazy(() => import('../Screens/Profile/WalletPinSetupScreen')));
const TransactionDetailsScreen = withSuspense(lazy(() => import('../Screens/Profile/TransactionDetailsScreen')));


const RootNavigation = () => {



  const { colors } = useTheme();
  const { colors: appColors, isDark } = useAppTheme();
  const Stack = createStackNavigator();
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <TouchableOpacity
            style={[Styles.ml4]}
            onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={appColors.text} />
          </TouchableOpacity>
        ),

        headerTitleAllowFontScaling: true,
        headerBackgroundContainerStyle: { backgroundColor: appColors.background },
        headerStyle: {
          backgroundColor: appColors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: appColors.text,
          fontWeight: 'bold',
        },
        headerTintColor: appColors.text,
      })}>


      <Stack.Screen
        name={Auth_Nav}
        component={AuthNavigation}
        options={{ headerShown: false }}
      />


      <Stack.Screen
        name={TabNavigation_Nav}
        component={TabNavigations}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={Dashboard_Nav}
        component={DashBoardScreen}
        options={{ headerTitleAlign: 'center', headerTitle: 'Overview' }}
      />
      <Stack.Screen
        name={HomeScreen_Nav}
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={MapTracking_Nav}
        component={MapTracking}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={LocationSearch_Nav}
        component={LocationSearch}
        options={{
          headerShown: false,
          gestureDirection: 'vertical',
          transitionSpec: {
            open: TransitionSpecs.TransitionIOSSpec,
            close: TransitionSpecs.TransitionIOSSpec,
          },
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateY: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.height, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                  {
                    scale: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                  extrapolate: 'clamp',
                }),
              },
            };
          },
        }}

      />
      <Stack.Screen
        name={MapViewComponent_Nav}
        component={MapViewComponent}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ServiceScreen_Nav}
        component={ServiceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ProfilescreenComponents_Nav}
        component={ProfileScreenComponents}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={TripNavigation_Nav}
        component={TripNavigation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={RideDetails_Nav}
        component={RideDetails}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={RideDetailsEdit_Nav}
        component={ScheduledrideEdit}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PDFViewerScreen"
        component={PDFViewerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={BookedTripScreen_Nav}
        component={TripScreen}
        options={{
          headerTitleAlign: 'center',
          headerTitle: 'Hire Drivers',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={CheckoutScreen_Nav}
        component={CheckoutScreen}
        options={{
          headerTitle: 'Checkout',
        }}
      />
      <Stack.Screen
        name={PaymentSuccessScreen_Nav}
        component={PaymentSuccessScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={RideCompletedScreen_Nav}
        component={RideCompletedScreen}
        options={{
          headerTitle: 'Your Ride',
        }}
      />

      <Stack.Screen
        name={FareSummaryScreen_Nav}
        component={FareSummaryScreen}
        options={{
          presentation: 'modal', // Makes it slide from bottom
          headerShown: false
        }}
      />
      < Stack.Screen
        name={FAQDetailsScreen_Nav}
        component={FAQDetails}
        options={{
          headerTitle: 'FAQs',
        }}
      />
      < Stack.Screen
        name={HelpContactScreen_Nav}
        component={HelpScreen}
        options={{
          headerTitle: 'Help',
        }}
      />
      < Stack.Screen
        name={FavouritelocationScreens_Nav}
        component={Favourites}
        options={{
          headerShown: false,
        }}
      />
      < Stack.Screen
        name={DeleteAccountInfoScreen_Nav}
        component={DeleteAccountInfoScreen}
        options={{ headerTitle: 'Delete Account' }}
      />
      < Stack.Screen
        name={DeleteAccountReasonScreen_Nav}
        component={DeleteAccountReasonScreen}
        options={{ headerTitle: 'Delete Account' }}
      />
      < Stack.Screen
        name={DeleteAccountVerifyScreen_Nav}
        component={DeleteAccountVerifyScreen}
        options={{ headerTitle: 'Verification' }}
      />
      < Stack.Screen
        name={DeleteAccountConfirmScreen_Nav}
        component={DeleteAccountConfirmScreen}
        options={{ headerTitle: 'Confirmation' }}
      />
      < Stack.Screen
        name={DeleteAccountSuccessScreen_Nav}
        component={DeleteAccountSuccessScreen}
        options={{ headerShown: false }}
      />
      < Stack.Screen
        name={AboutVdriveScreen_Nav}
        component={AboutVDrive}
        options={{
          headerShown: false,
        }}
      />
      < Stack.Screen
        name={PreferencesScreen_Nav}
        component={Preferences}
        options={{
          headerTitle: 'Preferences',
        }}
      />
      < Stack.Screen
        name={NotificationScreen_Nav}
        component={NotificationScreen}
        options={{
          headerShown: false,
        }}
      />
      < Stack.Screen
        name={SafetyScreen_Nav}
        component={SafetyScreen}
        options={{
          headerShown: false,
          headerTitle: 'Safety Toolkit',
        }}
      />
      < Stack.Screen
        name={SearchDriverScreen_Nav}
        component={SearchingDriver}
        options={{
          presentation: 'modal', // Makes it slide from bottom
          headerShown: false
        }}
      />

      < Stack.Screen
        name={ContactScreen_Nav}
        component={ContactListScreen}
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />

      < Stack.Screen
        name={userMapTest_nav}
        component={UserAppUI}
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />

      < Stack.Screen
        name={ChatScreen_Nav}
        component={ChatScreen}
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
      < Stack.Screen
        name={OngoingTripsList_Nav}
        component={OngoingTripsList}
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />
      < Stack.Screen
        name={ScheduledTripsList_Nav}
        component={ScheduledTripCard}
        options={{
          presentation: 'modal',
          headerShown: false
        }}
      />

      <Stack.Screen
        name={OffersScreen_Nav}
        component={OffersScreen}
        options={{
          headerTitle: 'Offers & Promotions',
        }}
      />

      {/* ── Wallet Screens ── */}
      <Stack.Screen
        name={WalletScreen_Nav}
        component={WalletScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={WalletSuccessScreen_Nav}
        component={WalletSuccessScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={WalletPinSetupScreen_Nav}
        component={WalletPinSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={TransactionDetailsScreen_Nav}
        component={TransactionDetailsScreen}
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
};

export default RootNavigation;
