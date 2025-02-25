import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, KeyboardTypeOptions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps {
    value: string;
    keyboardType?: KeyboardTypeOptions;
    placeholder?: string;
    multiline?: boolean;
    onChange: (text: string, isValid?: boolean) => void;
    style?: object;
    isEmail?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

export function InputField({
    value,
    placeholder,
    keyboardType,
    multiline = false,
    onChange,
    style,
    isEmail = false,
    onFocus,
    onBlur
}: InputProps) {
    const [isValid, setIsValid] = useState(true);
    const [isTouched, setIsTouched] = useState(false);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    useEffect(() => {
        if (isEmail) {
            const valid = validateEmail(value);
            setIsValid(valid);
            onChange(value, valid);
        }
    }, [value, isEmail]);

    const handleChange = (text: string) => {
        if (isEmail) {
            const valid = validateEmail(text);
            setIsValid(valid);
            onChange(text, valid);
        } else {
            onChange(text, true);
        }
    };

    const handleBlur = () => {
        onBlur && onBlur();
        setIsTouched(true);
    };

    return (
        <View>
            <TextInput
                style={[styles.input, style, !isValid && isTouched && value !== '' && styles.invalidInput]}
                placeholder={placeholder}
                value={value}
                keyboardType={keyboardType}
                placeholderTextColor='#D9D9D9'
                multiline={multiline}
                onChangeText={handleChange}
                onBlur={handleBlur}
                onFocus={onFocus}
            />
            {isEmail && !isValid && isTouched && value !== '' && (
                <Text style={styles.errorText}>Invalid email format</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        height: 35,
        borderColor: '#D9D9D9',
        borderRadius: 8,
        width: 165,
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 12,
        fontSize: 12
    },
    invalidInput: {
        borderColor: 'red',
        marginBottom: 9
    },
    errorText: {
        color: 'red',
        fontSize: 10,
        marginTop: -10,
    },
});
