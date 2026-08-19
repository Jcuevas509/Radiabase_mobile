import { useStorageState } from 'hooks/useStorageState';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSettingStore } from 'store/LocalSettingsStore';
import { Session } from 'types/storageTypes';
import { setAccessToken } from 'services/api-client';
import { fetchCurrentUser, isUnauthorizedError } from 'services/auth-api';
import {
    beginRadiabaseReminderAccountTransition,
    cancelAllRadiabaseLeadAppointmentReminders,
    finishRadiabaseReminderAccountTransition,
    retryPendingRadiabaseReminderCleanup,
} from 'services/lead-appointment-reminders';
import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type PropsWithChildren,
} from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';

type AuthContextType = {
    signIn: (session: Session) => Promise<void>;
    signOut: () => Promise<void>;
    session?: Session | null;
    isLoading: boolean;
    checkAuth: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useSession(): AuthContextType {
    const value = useContext(AuthContext) as AuthContextType;
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useSession must be wrapped in a <SessionProvider />');
        }
    }
    return value;
}
export const SESSION_KEY = 'session';

export function SessionProvider({ children }: PropsWithChildren) {
    const [isLoading, storedSession, setStoredSession, invalidateStoredSession] =
        useStorageState<Session>(SESSION_KEY);
    const [session, setActiveSession] = useState<Session | null>(null);
    const activeSessionRef = useRef<Session | null>(null);
    const currentSessionTokenRef = useRef<string | null>(null);
    const authGenerationRef = useRef(0);
    const hasActivatedHydratedSessionRef = useRef(false);

    const { resetStore } = useLocalSettingStore();

    useEffect(() => {
        if (isLoading || hasActivatedHydratedSessionRef.current) {
            return;
        }
        hasActivatedHydratedSessionRef.current = true;
        // Only the initial persisted session is activated here. Sign-in/out operations
        // activate their own generation after persistence completes, so stale state
        // renders cannot re-enable an older account or reminder scheduling.
        if (authGenerationRef.current === 0) {
            const hydratedSession = storedSession ?? null;
            const hydratedToken = hydratedSession?.token ?? null;
            activeSessionRef.current = hydratedSession;
            setActiveSession(hydratedSession);
            currentSessionTokenRef.current = hydratedToken;
            setAccessToken(hydratedToken);
            if (hydratedToken) {
                finishRadiabaseReminderAccountTransition();
            }
        }
    }, [isLoading, storedSession]);

    useEffect(() => {
        void retryPendingRadiabaseReminderCleanup().catch(() => undefined);
    }, []);

    useEffect(() => {
        if (session) {
            const subscription = AppState.addEventListener(
                'change',
                (nextAppState: AppStateStatus) => {
                    if (nextAppState === 'active' && session?.token) {
                        void retryPendingRadiabaseReminderCleanup().catch(() => undefined);
                        check();
                    }
                },
            );
            return () => subscription.remove();
        }
    }, [session?.token]);

    async function handleSignout(): Promise<boolean> {
        setAccessToken(null);
        const results = await Promise.allSettled([
            AsyncStorage.removeItem('local-settings'),
            cancelAllRadiabaseLeadAppointmentReminders(),
        ]);
        resetStore();
        return results.every((result) => result.status === 'fulfilled');
    }

    async function check() {
        const checkedToken = currentSessionTokenRef.current;
        const checkedGeneration = authGenerationRef.current;
        if (!checkedToken) {
            return;
        }
        try {
            await fetchCurrentUser();
        } catch (error) {
            if (isUnauthorizedError(error)) {
                if (
                    currentSessionTokenRef.current !== checkedToken
                    || authGenerationRef.current !== checkedGeneration
                ) {
                    return;
                }
                authGenerationRef.current += 1;
                currentSessionTokenRef.current = null;
                activeSessionRef.current = null;
                setActiveSession(null);
                beginRadiabaseReminderAccountTransition();
                Alert.alert('Your session has expired. Please login again');
                setAccessToken(null);
                await Promise.allSettled([
                    invalidateStoredSession(),
                    handleSignout(),
                ]);
            }
        }
    }

    async function signOut() {
        const sessionAtSignOut = activeSessionRef.current;
        const signOutGeneration = authGenerationRef.current + 1;
        authGenerationRef.current = signOutGeneration;
        currentSessionTokenRef.current = null;
        activeSessionRef.current = null;
        setActiveSession(null);
        beginRadiabaseReminderAccountTransition();
        try {
            setAccessToken(null);
            const [sessionResult, cleanupResult] = await Promise.allSettled([
                setStoredSession(null),
                handleSignout(),
            ]);
            if (sessionResult.status === 'rejected') {
                throw sessionResult.reason;
            }
            if (
                authGenerationRef.current === signOutGeneration
                && cleanupResult.status === 'fulfilled'
                && !cleanupResult.value
            ) {
                Alert.alert(
                    'Signed out with cleanup pending',
                    'Radiabase will retry clearing old local reminders the next time the app opens.',
                );
            }
        } catch (e) {
            if (authGenerationRef.current !== signOutGeneration) {
                return;
            }
            activeSessionRef.current = sessionAtSignOut;
            setActiveSession(sessionAtSignOut);
            currentSessionTokenRef.current = sessionAtSignOut?.token ?? null;
            setAccessToken(sessionAtSignOut?.token ?? null);
            if (sessionAtSignOut?.token) {
                finishRadiabaseReminderAccountTransition();
            }
            Alert.alert(
                'Unable to securely erase this session. The account remains signed in; please try again.',
            );
        }
    }

    return (
        <AuthContext.Provider
            value={{
                checkAuth: async () => {
                    return await check();
                },
                signIn: async (nextSession: Session) => {
                    const sessionBeforeSignIn = activeSessionRef.current;
                    const signInGeneration = authGenerationRef.current + 1;
                    authGenerationRef.current = signInGeneration;
                    currentSessionTokenRef.current = null;
                    activeSessionRef.current = null;
                    setActiveSession(null);
                    setAccessToken(null);
                    beginRadiabaseReminderAccountTransition();
                    try {
                        await cancelAllRadiabaseLeadAppointmentReminders().catch(() => undefined);
                        if (authGenerationRef.current !== signInGeneration) {
                            return;
                        }
                        await setStoredSession(nextSession);
                        if (authGenerationRef.current !== signInGeneration) {
                            return;
                        }
                        activeSessionRef.current = nextSession;
                        setActiveSession(nextSession);
                        currentSessionTokenRef.current = nextSession.token;
                        setAccessToken(nextSession.token);
                        finishRadiabaseReminderAccountTransition();
                    } catch (error) {
                        let storageWasReconciled = false;
                        if (authGenerationRef.current === signInGeneration) {
                            try {
                                await setStoredSession(sessionBeforeSignIn);
                                storageWasReconciled = true;
                            } catch {
                                if (authGenerationRef.current === signInGeneration) {
                                    await invalidateStoredSession().catch(() => undefined);
                                }
                            }
                        }
                        if (authGenerationRef.current === signInGeneration && storageWasReconciled) {
                            activeSessionRef.current = sessionBeforeSignIn;
                            setActiveSession(sessionBeforeSignIn);
                        }
                        if (
                            authGenerationRef.current === signInGeneration
                            && storageWasReconciled
                            && sessionBeforeSignIn?.token
                        ) {
                            currentSessionTokenRef.current = sessionBeforeSignIn.token;
                            setAccessToken(sessionBeforeSignIn.token);
                            finishRadiabaseReminderAccountTransition();
                        }
                        throw error;
                    }
                },
                signOut,
                session,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
export type { Session };
