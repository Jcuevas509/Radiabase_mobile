import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
interface RadioButtonProps {
    value: string;
    checked: boolean;
    onChange: () => void,
}

/**
 * @description A component that can be used as radio button
 */

export function RadioButton({
    value,
    checked,
    onChange
}: RadioButtonProps) {
    return (
        <TouchableOpacity onPress={() => onChange()} style={styles.radioContainer}>
            {checked ? <Ionicons name="checkmark-circle" size={30} color="black" /> :
                <View style={[styles.radioButton, checked && styles.selected]} />}
        </TouchableOpacity >
    );
}

const styles = StyleSheet.create({
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'black',
        marginRight: 4
    },
    selected: {
        borderWidth: 0
    }

});
