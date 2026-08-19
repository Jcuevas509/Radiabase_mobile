import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as React from 'react';

export type StorageValue = string | number | boolean | object | null;

export function getPendingSecureStorageDeletionKey(key: string): string {
    return `pending-secure-storage-deletion:${key}`;
}

export async function setStorageItemAsync<T extends StorageValue>(
    key: string,
    value: T | null,
) {
    if (value == null) {
        await SecureStore.deleteItemAsync(key);
    } else {
        await SecureStore.setItemAsync(key, JSON.stringify(value));
    }
}

export function useStorageState<T extends StorageValue>(
    key: string,
): [
    boolean,
    T | null,
    (value: T | null) => Promise<void>,
    () => Promise<void>,
] {
    const [state, setState] = React.useState<T | null>(null);
    const [isLoading, setLoaded] = React.useState<boolean>(true);
    const storageOperationRef = React.useRef<Promise<void>>(Promise.resolve());

    React.useEffect(() => {
        let cancelled = false;
        async function hydrate() {
            try {
                const pendingDeletionKey = getPendingSecureStorageDeletionKey(key);
                const hasPendingDeletion = await AsyncStorage.getItem(pendingDeletionKey);
                if (hasPendingDeletion) {
                    try {
                        await SecureStore.deleteItemAsync(key);
                        await AsyncStorage.removeItem(pendingDeletionKey);
                    } catch {
                        // Keep the tombstone and fail closed until deletion can be retried.
                    }
                    if (!cancelled) {
                        setState(null);
                    }
                    return;
                }
                const value = await SecureStore.getItemAsync(key);
                if (!cancelled) {
                    setState(value == null ? null : JSON.parse(value) as T);
                }
            } catch {
                if (!cancelled) {
                    setState(null);
                }
                await SecureStore.deleteItemAsync(key).catch(() => undefined);
            } finally {
                if (!cancelled) {
                    setLoaded(false);
                }
            }
        }
        storageOperationRef.current = hydrate();
        return () => {
            cancelled = true;
        };
    }, [key]);

    const setValue = React.useCallback(
        async (value: T | null) => {
            const operation = storageOperationRef.current
                .catch(() => undefined)
                .then(async () => {
                    if (value == null) {
                        await setStorageItemAsync(key, null);
                        setState(null);
                        return;
                    }
                    const pendingDeletionKey = getPendingSecureStorageDeletionKey(key);
                    const hasPendingDeletion = await AsyncStorage.getItem(pendingDeletionKey);
                    if (hasPendingDeletion) {
                        // Remove the rejected credential before replacing it. If any step fails,
                        // the tombstone stays authoritative and the new session is never activated.
                        await SecureStore.deleteItemAsync(key);
                        await setStorageItemAsync(key, value);
                        try {
                            await AsyncStorage.removeItem(pendingDeletionKey);
                        } catch (error) {
                            await SecureStore.deleteItemAsync(key).catch(() => undefined);
                            throw error;
                        }
                        setState(value);
                        return;
                    }
                    await setStorageItemAsync(key, value);
                    setState(value);
                });
            storageOperationRef.current = operation.catch(() => undefined);
            await operation;
        },
        [key],
    );

    const invalidateValue = React.useCallback(async () => {
        const operation = storageOperationRef.current
            .catch(() => undefined)
            .then(async () => {
                const pendingDeletionKey = getPendingSecureStorageDeletionKey(key);
                let markerStored = false;
                let markerError: unknown;
                try {
                    await AsyncStorage.setItem(pendingDeletionKey, '1');
                    markerStored = true;
                } catch (error) {
                    markerError = error;
                }

                // A server-rejected credential is invalid even if the device keychain is unavailable.
                setState(null);
                try {
                    await SecureStore.deleteItemAsync(key);
                } catch (error) {
                    throw markerError ?? error;
                }

                if (markerStored) {
                    await AsyncStorage.removeItem(pendingDeletionKey);
                }
            });
        storageOperationRef.current = operation.catch(() => undefined);
        await operation;
    }, [key]);

    return [isLoading, state, setValue, invalidateValue];
}
