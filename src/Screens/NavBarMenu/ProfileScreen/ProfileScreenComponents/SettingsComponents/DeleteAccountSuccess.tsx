import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../../../hooks/useAppTheme';
import { hS, mS, vS } from '../../../../../lib/responsive';
import fonts from '../../../../../constant/fonts';
import Button from '../../../../../Components/Button';
import { useDispatch } from 'react-redux';
import { logout } from '../../../../../redux/userSlice';
import { storage } from '../../../../../service/utils/storage';

// Utility to calculate date 30 days from now
const getDeletionDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const DeleteAccountSuccess = ({ navigation }: any) => {
    const { colors: appColors, isDark } = useAppTheme();
    const deletionDate = getDeletionDate();

    const dispatch = useDispatch();

    const handleReturn = async () => {
        await storage.removeAccessToken();
        await storage.removeRefreshToken();
        dispatch(logout());
        
        navigation.reset({
            index: 0,
            routes: [
                {
                    name: "AuthNavigation",
                    params: { screen: "LoginScreen" }
                }
            ],
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: appColors.background }]}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="check-circle-outline" size={mS(64)} color="#10B981" />
                </View>

                <Text style={[fonts.bold, styles.title, { color: appColors.text }]}>
                    Request Received
                </Text>

                <Text style={[styles.subtitle, { color: appColors.secondaryText }]}>
                    Your account is scheduled for deletion on:
                </Text>

                <View style={[styles.dateBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }]}>
                    <Text style={[fonts.bold, styles.dateText, { color: '#3B82F6' }]}>
                        {deletionDate}
                    </Text>
                </View>

                <Text style={[styles.infoText, { color: appColors.text }]}>
                    You will be logged out now. If you change your mind, you can cancel this request by logging back into your account anytime before the deletion date.
                </Text>
            </View>

            <View style={[styles.footer, { backgroundColor: appColors.background }]}>
                <Button
                    style={styles.doneButton}
                    onPress={handleReturn}
                >
                    <Text style={[fonts.bold, { color: '#FFFFFF', fontSize: mS(16) }]}>Done</Text>
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: hS(24),
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: vS(24),
    },
    title: {
        fontSize: mS(24),
        textAlign: 'center',
        marginBottom: vS(16),
    },
    subtitle: {
        fontSize: mS(14),
        textAlign: 'center',
        marginBottom: vS(12),
    },
    dateBox: {
        paddingHorizontal: hS(20),
        paddingVertical: vS(12),
        borderRadius: 8,
        marginBottom: vS(32),
    },
    dateText: {
        fontSize: mS(16),
    },
    infoText: {
        fontSize: mS(14),
        lineHeight: vS(22),
        textAlign: 'center',
    },
    footer: {
        padding: hS(20),
        paddingBottom: vS(32),
    },
    doneButton: {
        width: '100%',
        height: vS(48),
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default DeleteAccountSuccess;
