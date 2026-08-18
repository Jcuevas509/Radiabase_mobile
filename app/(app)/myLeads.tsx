import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';
import { EmptyCollectionScreen } from 'components/screens/EmptyCollectionScreen';

export default function MyLeadsScreen() {
  return (
    <EmptyCollectionScreen
      title="My Leads"
      message="Leads you submit from the field map will appear here."
      icon={UserGroupIcon}
    />
  );
}
