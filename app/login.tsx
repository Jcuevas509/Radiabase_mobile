import { Login as LoginScreen } from 'components/screens/Login/Login';
import { useSession } from 'context/AuthenticationContext';

export default function Login() {
    const { signIn } = useSession();
    return <LoginScreen
        signIn={signIn}
    />
}