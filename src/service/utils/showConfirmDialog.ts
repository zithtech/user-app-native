// utils/showConfirmDialog.ts
import { Alert } from 'react-native';

export const showConfirmDialog = (
    message: string,
    title: string = 'Device Conflict',
    confirmText: string = 'Yes, Log Out'
): Promise<boolean> => {
    return new Promise((resolve) => {
        Alert.alert(
            title,
            message,
            [
                { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
                { text: confirmText, onPress: () => resolve(true), style: 'destructive' },
            ],
            { cancelable: false }
        );
    });
};