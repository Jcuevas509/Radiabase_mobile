import { MaterialIcons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileScreen } from 'components/screens/Profile/ProfileScreen';
import { useSession } from 'context/AuthenticationContext';
import { fetchFieldStats, FieldStatsResponse } from 'services/area-api';
import { buildProfileViewModel } from 'utils/build-profile-view-model';

/**
 * Route wrapper: owns data and navigation, keeps the screen presentational.
 * Today the profile comes from the session and activity from field-stats;
 * a dedicated profile API later only changes this file.
 */
export default function Profile() {
    const navigation = useNavigation();
    const { session, signOut } = useSession();
    const profile = buildProfileViewModel(session?.user);
    const [stats, setStats] = useState<FieldStatsResponse | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        if (!session?.token) {
            return;
        }
        let isCancelled = false;
        setIsLoadingStats(true);
        fetchFieldStats()
            .then((response) => {
                if (!isCancelled) {
                    setStats(response);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setStats(null);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsLoadingStats(false);
                }
            });
        return () => {
            isCancelled = true;
        };
    }, [session?.token]);

    const handleSignOut = () => {
        Alert.alert('Log out', 'Log out of Radiabase on this phone?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    hitSlop={12}
                    style={styles.menuHit}
                >
                    <MaterialIcons name="menu" size={28} color="#18181B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={styles.menuHit} />
            </View>
            {profile ? (
                <ProfileScreen
                    profile={profile}
                    stats={stats}
                    isLoadingStats={isLoadingStats}
                    appVersion={Constants.expoConfig?.version ?? '1.0.0'}
                    onSignOut={handleSignOut}
                />
            ) : (
                <View style={styles.signedOut}>
                    <Text style={styles.signedOutText}>Log in to see your profile.</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F4F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#F4F4F5',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#18181B',
    },
    menuHit: {
        width: 40,
        alignItems: 'flex-start',
    },
    signedOut: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    signedOutText: {
        color: '#71717A',
        fontSize: 14,
    },
});
