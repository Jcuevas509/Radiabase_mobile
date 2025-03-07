import * as SecureStore from 'expo-secure-store';
import * as React from 'react';

export type StorageValue = string | number | boolean | object | null;

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
): [boolean, T | null, (value: T | null) => void] {
    const [state, setState] = React.useState<T | null>(null);
    const [isLoading, setLoaded] = React.useState<boolean>(true);

    React.useEffect(() => {
        SecureStore.getItemAsync(key).then((value: string | null) => {
            if (value == null) {
                setState(null);
                setLoaded(false);
                return;
            }
            setState(JSON.parse(value) as T);
            setLoaded(false);
        });
    }, [key]);

    const setValue = React.useCallback(
        (value: T | null) => {
            setState(value);
            setStorageItemAsync(key, value);
        },
        [key],
    );

    return [isLoading, state, setValue];
}
