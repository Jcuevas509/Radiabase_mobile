import Agreement01Icon from '@hugeicons/core-free-icons/Agreement01Icon';
import { EmptyCollectionScreen } from 'components/screens/EmptyCollectionScreen';

export default function MyDealsScreen() {
  return (
    <EmptyCollectionScreen
      title="My Deals"
      message="Your converted and active deals will appear here when deal data is connected."
      icon={Agreement01Icon}
    />
  );
}
