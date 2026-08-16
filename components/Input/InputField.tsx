import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TextInput, KeyboardTypeOptions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps {
    value: string;
    keyboardType?: KeyboardTypeOptions;
    placeholder?: string;
    placeHolderColor?: string;
    multiline?: boolean;
    onChange: (text: string, isValid?: boolean) => void;
    style?: object;
    isEmail?: boolean;
    isPassword?: boolean;
    isSignInput?: boolean;
    iconColor?: string;
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
    isPassword = false,
    onFocus,
    onBlur,
    isSignInput = false,
    iconColor = '#6E6A62',
    placeHolderColor = '#D9D9D9',
}: InputProps) {
    const [isValid, setIsValid] = useState(true);
    const [isTouched, setIsTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
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
            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        style,
                        !isValid && isTouched && value !== '' && styles.invalidInput
                    ]}
                    placeholder={placeholder}
                    value={value}
                    keyboardType={keyboardType}
                    placeholderTextColor={placeHolderColor}
                    multiline={multiline}
                    onChangeText={handleChange}
                    onBlur={handleBlur}
                    autoCapitalize={isEmail || isPassword ? 'none' : 'sentences'}
                    autoCorrect={!isEmail && !isPassword}
                    textContentType={isEmail ? 'username' : isPassword ? 'password' : 'none'}
                    onFocus={onFocus}
                    secureTextEntry={isPassword && !showPassword}
                />
                {isPassword && (
                    <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
                        <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={24}
                            color={iconColor}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {isEmail && !isValid && isTouched && value !== '' && (
                <Text style={[styles.errorText, { paddingVertical: isSignInput ? 6 : 0 }]}>Invalid email format</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        height: 35,
        borderColor: '#D9D9D9',
        borderRadius: 8,
        width: '100%',
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
    inputContainer: {
        position: 'relative',
        width: '100%',
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: '20%',
    },
});
