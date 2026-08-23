import { Redirect, Slot } from 'expo-router';
import { useSession } from 'context/AuthenticationContext';

/** Role gate for every /manager route: standard reps are bounced to Home.
 * Server-side authorization comes with the real API — this only keeps the
 * UI honest. */
export default function ManagerLayout() {
    const { session } = useSession();
    if (session?.user?.role !== 'manager') {
        return <Redirect href="/dashboard" />;
    }
    return <Slot />;
}
