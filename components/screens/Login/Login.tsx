import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
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
import { Session } from 'types/storageTypes';
import { InputField } from 'components/Input/InputField';
import { Button } from 'components/Button/Button';
import { isUnauthorizedError, loginWithPassword } from 'services/auth-api';
import { useRouter } from 'expo-router';
import { loadApiBaseUrlOverride, saveApiBaseUrlOverride } from 'utils/api-base-url';

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
} as const;

interface LoginProps {
    signIn: (session: Session) => Promise<void>;
}

/**
 * Matches the Sunnected web login: dark gradient, centered card, bolt mark, blue CTA.
 */
export function Login({ signIn }: LoginProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [isValidEmail, setIsValidEmail] = useState<boolean>(true);
    const canOverrideApiUrl = Constants.expoConfig?.extra?.allowApiUrlOverride === true;
    const [apiBaseUrl, setApiBaseUrl] = useState<string>('');

    useEffect(() => {
        if (!canOverrideApiUrl) {
            return;
        }
        void loadApiBaseUrlOverride().then(setApiBaseUrl);
    }, [canOverrideApiUrl]);

    const handleLogin = async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            if (canOverrideApiUrl) {
                await saveApiBaseUrlOverride(apiBaseUrl);
            }
            const session = await loginWithPassword({ email, password });
            await signIn(session);
        } catch (error) {
            if (isUnauthorizedError(error)) {
                setErrorMessage('Invalid email or password.');
            } else {
                setErrorMessage('Could not reach the API. Check EXPO_PUBLIC_API_URL.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    function handleForgotPassword() {
        router.push('/forgotPassword');
    }

    const isSignInDisabled = !isValidEmail || password.length < 2 || email.length === 0;

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
                                    <Text style={styles.title}>Welcome back</Text>
                                    <Text style={styles.subtitle}>Sign in to your account</Text>
                                </View>
                                <Text style={styles.label}>Email</Text>
                                <InputField
                                    value={email}
                                    placeholder="name@example.com"
                                    onChange={(text, isValid) => {
                                        setEmail(text);
                                        setIsValidEmail(isValid ?? true);
                                    }}
                                    isSignInput
                                    keyboardType="email-address"
                                    isEmail
                                    placeHolderColor={COLORS.muted}
                                    iconColor={COLORS.muted}
                                    style={styles.input}
                                />
                                {canOverrideApiUrl ? (
                                    <>
                                        <Text style={[styles.label, styles.passwordLabel]}>API server</Text>
                                        <InputField
                                            value={apiBaseUrl}
                                            placeholder="http://172.20.10.3:3010/api"
                                            onChange={setApiBaseUrl}
                                            isSignInput
                                            keyboardType="url"
                                            placeHolderColor={COLORS.muted}
                                            iconColor={COLORS.muted}
                                            style={styles.input}
                                        />
                                    </>
                                ) : null}
                                <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
                                <InputField
                                    placeholder="Password"
                                    value={password}
                                    isPassword
                                    onChange={setPassword}
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
                                    onPress={handleLogin}
                                    text={isLoading ? 'Signing in...' : 'Sign In'}
                                    buttonStyle={styles.signInButton}
                                    isLoading={isLoading}
                                    textStyle={styles.signInText}
                                    isDisabled={isSignInDisabled}
                                />
                                <Pressable onPress={handleForgotPassword} style={styles.forgotWrap}>
                                    <Text style={styles.forgotText}>Forgot your password?</Text>
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
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.45,
        shadowRadius: 32,
        elevation: 16,
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
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
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
    passwordLabel: {
        marginTop: 16,
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
