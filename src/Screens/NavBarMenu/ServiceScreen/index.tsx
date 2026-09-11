import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { Styles } from "../../../lib/styles";
import { Logo } from "../../../assets/svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import fonts from "../../../constant/fonts";
import Button from "../../../Components/Button";
import colors from "../../../constant/colors";
import React from "react";
import { HelpContactScreen_Nav } from "../../../Navigations/navigations";
import { useAppTheme } from "../../../hooks/useAppTheme";
import { ResponsiveContainer } from "../../../Components/ResponsiveContainer";



const ServiceScreen: React.FC<ScreenProps> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors: appColors, isDark } = useAppTheme();

    return (
        <View style={[Styles.flex, {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: isDark ? "#020813" : appColors.background,
            gap: 5
        }]}>
            <View style={[Styles.flexRow, Styles.justifyContentSpaceBetween, {
                marginHorizontal: 20
            }]}>
                {/* <Logo width={100} height={100} /> */}
                {
                    isDark ?
                        <Image source={require('../../../assets/png/T2DriveLogo.png')} style={[Styles.logoImage, {
                            shadowColor: isDark ? 'white' : appColors.button
                        }]} resizeMode="contain" />
                        : <Image source={require('../../../assets/png/T2DriveDarkLogo.png')} style={[Styles.logoImage, {
                            shadowColor: isDark ? 'white' : appColors.button
                        }]} resizeMode="contain" />
                }
                <TouchableOpacity style={[Styles.flexRow, Styles.justifyContentCenter, Styles.alignItemsCenter, Styles.g1]} onPress={() => navigation.navigate(HelpContactScreen_Nav)}>
                    <MaterialIcons name="headphones" size={20} color={appColors.text} />
                    <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[Styles.fs16, fonts.light, { color: appColors.text }]}>Help</Text>
                </TouchableOpacity>
            </View>

            <View style={[{ gap: 10, marginHorizontal: 20 }]}>
                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[Styles.fs18, fonts.bold, Styles.textCenter, {
                    fontWeight: 'bold', color: appColors.text
                }]}>Select Your Services</Text>

                {/* <View style={[Styles.bw1, Styles.br2, {
                    borderColor: appColors.border,

                }]}>
                    <ImageBackground source={require('../../../assets/png/CabService.png')} resizeMode='cover' style={[Styles.p5]}>
                        <View style={[Styles.g3]}>
                            <View>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[Styles.fs20, {
                                    fontWeight: 'bold',
                                    color: '#fff'
                                }]}>Cab</Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[{ color: '#fff' }]}>Your Ride,Ready Anytime</Text></View>
                            <View>
                                <Button
                                    onPress={() => navigation.navigate('Home')}
                                    style={[Styles.bw1, Styles.br10, Styles.justifyContentCenter, Styles.alignItemsCenter, {
                                        width: '30%',
                                        height: 30,
                                        backgroundColor: appColors.card,
                                        borderColor: isDark ? 'transparent' : '#111'
                                    }]}>
                                    <View style={[Styles.flexRow, Styles.alignItemsCenter, Styles.g2]}>
                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[Styles.fs12, fonts.light, {
                                            color: appColors.text
                                        }]}>Book Now
                                        </Text>
                                        <MaterialIcons name="east" color={appColors.text} />
                                    </View>
                                </Button>
                            </View>
                        </View>

                    </ImageBackground>
                </View> */}


                <View style={[Styles.bw1, Styles.br2, {
                    borderColor: appColors.border,

                }]}>
                    <ImageBackground source={require('../../../assets/png/DriverService.png')} resizeMode='cover' style={[Styles.p5]}>
                        <View style={[Styles.g3]}>
                            <View>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[Styles.fs20, {
                                    fontWeight: 'bold',
                                    color: '#fff'
                                }]}>Driver</Text>
                                <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[{ color: '#fff' }]}>Your Car,Our trusted driver</Text>
                            </View>
                            <View>
                                <Button
                                    onPress={() => navigation.navigate('Home')}
                                    style={[Styles.bw1, Styles.br10, Styles.justifyContentCenter, Styles.alignItemsCenter, {
                                        width: '30%',
                                        height: 30,
                                        backgroundColor: appColors.card,
                                        borderColor: isDark ? 'transparent' : '#111'
                                    }]}>
                                    <View style={[Styles.flexRow, Styles.alignItemsCenter, Styles.g2]}>
                                        <Text allowFontScaling={true} maxFontSizeMultiplier={1.2} style={[Styles.fs12, fonts.light, {
                                            color: appColors.text
                                        }]}>Hire Now
                                        </Text>
                                        <MaterialIcons name="east" color={appColors.text} />
                                    </View>
                                </Button>
                            </View>
                        </View>
                    </ImageBackground>
                </View>

            </View>
        </View>
    )
}


export default ServiceScreen;