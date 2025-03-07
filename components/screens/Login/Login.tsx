import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, SafeAreaView, Text, Image, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Session } from 'context/AuthenticationContext';
import { useLocalSettingStore } from 'store/LocalSettingsStore';
import { InputField } from 'components/Input/InputField';
import { Button } from 'components/Button/Button';
import LogoImage from 'components/LogoImage/LogoImage';

interface LoginProps {
    signIn: (session: Session) => void;
}

/**
 * @description Login component for the app
 */

export function Login({
    signIn,
}: LoginProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [password, setPassword] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [isValidEmail, setIsValidEmail] = useState(true)
    const { resetStore } = useLocalSettingStore();
    /**
     * @description Handles the login button press
     */

    const handleLogin = async () => {
        setIsLoading(true);
        setErrorMessage('');



        try {
            const loginResult = await login(email, password);
            if (loginResult.success) {
                let role: 'agent' | 'manager';
                if (email.toLowerCase().includes('agent')) {
                    role = 'agent';
                } else if (email.toLowerCase().includes('manager')) {
                    role = 'manager';
                } else {
                    // Default role if neither 'agent' nor 'manager' is in the email
                    role = 'manager';
                }

                signIn({
                    user: {
                        id: '12345',
                        firstName: 'Mock',
                        lastName: 'User',
                        email: loginResult.session.user.email,
                        role: role
                    },
                    token: loginResult.session.token
                });
            } else {
                setErrorMessage('Error occurred. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    async function login(username: string, password: string) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        return {
            success: true,
            session: {
                user: {
                    email: username,
                    role: 'user' // Add role here. In a real app, this would come from your backend.
                },
                token: 'mock-token-123',
            },
        };
    }

    async function handleForgotPassword() {
        console.log('first step to send forgot password email');
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <SafeAreaView style={[styles.safeArea]}>
                    {/* <ScrollView > */}
                    <View style={{ paddingLeft: 24, paddingBottom: 24 }}>
                        <Image
                            source={require('../../../assets/images/TextLogoBlack.png')}
                            style={{
                                width: 247,
                                height: 43
                            }}
                        />
                    </View>
                    <View style={styles.formContainer}>
                        <Text style={styles.formName}>
                            Sign In with Email
                        </Text>
                        <InputField
                            value={email}
                            placeholder="Email"
                            onChange={(text, isValid) => {
                                setEmail(text);
                                setIsValidEmail(isValid || true)
                            }}
                            isSignInput
                            keyboardType="email-address"
                            isEmail={true}
                            placeHolderColor='#6E6A62'
                            style={styles.input}
                        />
                        <InputField
                            placeholder='Password'
                            value={password}
                            isPassword
                            onChange={setPassword}
                            placeHolderColor='#6E6A62'
                            style={[styles.input, { marginBottom: 34 }]}
                        />
                        <Button
                            onPress={handleLogin}
                            text='Sign In'
                            buttonStyle={styles.signInButton}
                            isLoading={isLoading}
                            textStyle={{ color: 'white', fontSize: 16 }}
                            isDisabled={!isValidEmail || password.length < 2 || email.length === 0}
                        />
                        <Button
                            onPress={handleForgotPassword}
                            text='Forgot Password'
                            buttonStyle={{ width: '100%', height: 59 }}
                            textStyle={{ color: 'black', fontSize: 14 }}
                        />
                    </View>
                    {/* </ScrollView> */}
                </SafeAreaView>
                <LogoImage type='large' />
            </View>
        </TouchableWithoutFeedback >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'flex-end',
    },
    safeArea: {
        backgroundColor: 'white',
    },
    formContainer: {
        width: '100%',
        padding: 24,
        marginBottom: 56,
    },
    formName: {
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 12
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 0,
        backgroundColor: '#F3F2EF',
        fontSize: 16
    },
    signInButton: {
        backgroundColor: 'black',
        maxWidth: 350,
        height: 59,
        marginBottom: 16,
        width: '100%'
    }
});
