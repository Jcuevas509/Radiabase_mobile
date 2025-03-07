import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const initialState = {
};

type LocalSettingsStore = {
    hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
    resetStore: () => void;
};

export const useLocalSettingStore = create<LocalSettingsStore>()(
    persist(
        (set) => ({
            hasHydrated: false,
            setHasHydrated: (state: boolean) => {
                set({
                    hasHydrated: state,
                });
            },
            resetStore: () => {
                set(initialState);
            },
        }),
        {
            name: 'local-settings',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: (state) => {

                return (state, error) => {
                    if (error) {
                        console.error('an error happened during hydration', error);
                    } else {
                        if (state) {
                            console.debug('hydration finished');
                            state.setHasHydrated(true);
                        }
                    }
                };
            },
        },
    ),
);

