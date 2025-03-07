import { useStorageState } from 'hooks/useStorageState';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { checkAuth, getSubscription, logout } from '@services/AuthApi';
import { useLocalSettingStore } from 'store/LocalSettingsStore';
import { User } from 'types/storageTypes';
import {
    createContext,
    useContext,
    useEffect,
    type PropsWithChildren,
} from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';


type Session = {
    token: string;
    user: User;
};

type AuthContextType = {
    signIn: (session: Session) => void;
    signOut: () => void;
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
    const [isLoading, session, setSession] =
        useStorageState<Session>(SESSION_KEY);

    const { resetStore } = useLocalSettingStore();

    useEffect(() => {
        if (session) {

        }
    }, [session?.user]);
    useEffect(() => {
        if (session) {
            const subscription = AppState.addEventListener(
                'change',
                (nextAppState: AppStateStatus) => {
                    if (nextAppState === 'active' && session?.token) {
                        check();
                    }
                },
            );
            return () => subscription.remove();
        }
    }, [session?.token]);

    async function handleSignout() {
        await AsyncStorage.clear();
        resetStore();
    }

    async function check() {
        if (!session?.token) {
            return;
        }
        try {
            const isAuth = true
            if (isAuth === undefined) {
                return; //e.g. no internet connection
            }

            if (!isAuth) {
                Alert.alert('Your session has expired. Please login again');
                setSession(null);
                // logout();
            }
        } catch (e) {

        }
    }

    async function signOut() {
        try {
            // await logout();
            setSession(null);
            handleSignout();
        } catch (e) {
            Alert.alert(
                'Unable to logout. Check your internet connection and try again.',
            );
        }
    }

    return (
        <AuthContext.Provider
            value={{
                checkAuth: async () => {
                    return await check();
                },
                signIn: (session: Session) => {
                    setSession(session);
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
export { Session };
