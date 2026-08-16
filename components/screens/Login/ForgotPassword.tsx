import { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { InputField } from 'components/Input/InputField';
import { Button } from 'components/Button/Button';
import { requestPasswordReset } from 'services/auth-api';
import { getApiErrorMessage } from 'utils/get-api-error-message';

const COLORS = {
    gradientStart: '#000000',
    gradientEnd: '#18181b',
    card: '#27272a',
    cardBorder: 'rgba(63, 63, 70, 0.5)',
    inputBg: '#3f3f46',
    inputBorder: '#52525b',
    text: '#ffffff',
    muted: '#a1a1aa',
    primary: '#1890ff',
    link: '#40a9ff',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    errorBorder: 'rgba(239, 68, 68, 0.3)',
    errorText: '#fecaca',
    errorIcon: '#f87171',
    successBg: 'rgba(34, 197, 94, 0.12)',
    successBorder: 'rgba(34, 197, 94, 0.35)',
    successText: '#bbf7d0',
    successIcon: '#4ade80',
} as const;

/**
 * Sends a password reset email. The link opens the Sunnected web app.
 */
export function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState<string>('');
    const [isValidEmail, setIsValidEmail] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isSent, setIsSent] = useState<boolean>(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            await requestPasswordReset(email);
            setIsSent(true);
        } catch (error) {
            setErrorMessage(
                getApiErrorMessage(error, 'Could not send a reset link. Check EXPO_PUBLIC_API_URL.'),
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.gradient}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            bounces={false}
                        >
                            <View style={styles.card}>
                                <View style={styles.header}>
                                    <View style={styles.boltWrap}>
                                        <Ionicons name="flash" size={64} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.title}>Reset your password</Text>
                                    <Text style={styles.subtitle}>
                                        {isSent
                                            ? 'Check your email for reset instructions'
                                            : "Enter your email and we'll send a link to reset your password"}
                                    </Text>
                                </View>
                                {isSent ? (
                                    <View style={styles.successBox}>
                                        <Ionicons name="checkmark-circle" size={20} color={COLORS.successIcon} />
                                        <Text style={styles.successText}>
                                            Reset link sent. Open it on the web to choose a new password, then sign in here.
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <Text style={styles.label}>Email</Text>
                                        <InputField
                                            value={email}
                                            placeholder="name@example.com"
                                            onChange={(text, isValid) => {
                                                setEmail(text);
                                                setIsValidEmail(isValid ?? true);
                                                setErrorMessage('');
                                            }}
                                            isSignInput
                                            keyboardType="email-address"
                                            isEmail
                                            placeHolderColor={COLORS.muted}
                                            iconColor={COLORS.muted}
                                            style={styles.input}
                                        />
                                        {errorMessage ? (
                                            <View style={styles.errorBox}>
                                                <Ionicons name="close-circle" size={20} color={COLORS.errorIcon} />
                                                <Text style={styles.errorText}>{errorMessage}</Text>
                                            </View>
                                        ) : null}
                                        <Button
                                            onPress={handleSubmit}
                                            text={isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                                            buttonStyle={styles.signInButton}
                                            isLoading={isLoading}
                                            textStyle={styles.signInText}
                                            isDisabled={!isValidEmail || email.length === 0}
                                        />
                                    </>
                                )}
                                <Pressable onPress={() => router.replace('/login')} style={styles.forgotWrap}>
                                    <Text style={styles.forgotText}>Back to login</Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 448,
        alignSelf: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        padding: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    boltWrap: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        marginTop: 24,
        fontSize: 30,
        fontWeight: '800',
        color: COLORS.text,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.muted,
        textAlign: 'center',
    },
    label: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    input: {
        width: '100%',
        height: 48,
        marginBottom: 0,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        backgroundColor: COLORS.inputBg,
        color: COLORS.text,
        fontSize: 16,
        borderRadius: 8,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
        padding: 16,
        borderRadius: 8,
        backgroundColor: COLORS.errorBg,
        borderWidth: 1,
        borderColor: COLORS.errorBorder,
    },
    errorText: {
        flex: 1,
        color: COLORS.errorText,
        fontSize: 14,
        fontWeight: '500',
    },
    successBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 16,
        borderRadius: 8,
        backgroundColor: COLORS.successBg,
        borderWidth: 1,
        borderColor: COLORS.successBorder,
    },
    successText: {
        flex: 1,
        color: COLORS.successText,
        fontSize: 14,
        fontWeight: '500',
    },
    signInButton: {
        backgroundColor: COLORS.primary,
        width: '100%',
        maxWidth: '100%',
        height: 48,
        marginTop: 24,
        marginBottom: 0,
        borderRadius: 8,
    },
    signInText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    forgotWrap: {
        marginTop: 24,
        alignItems: 'center',
    },
    forgotText: {
        fontSize: 14,
        color: COLORS.link,
    },
});
