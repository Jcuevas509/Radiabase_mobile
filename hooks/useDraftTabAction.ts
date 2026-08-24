import { useEffect } from 'react';
import { useNavigation } from 'expo-router';
import { useDraftActionsStore, type DraftActions } from 'store/DraftActionsStore';

/**
 * While the tab bar is morphed into draft actions, this screen's tab item
 * is `disabled` — the native bar refuses the switch and emits `tabPress`
 * instead. This hook turns that press into the mapped draft action.
 */
export function useDraftTabAction(action: 'onCancel' | 'onRedraw' | 'onSave') {
  const navigation = useNavigation();
  useEffect(() => {
    return navigation.addListener('tabPress' as never, () => {
      const actions: DraftActions | null = useDraftActionsStore.getState().actions;
      if (!actions) {
        return;
      }
      if (action === 'onSave' && actions.isSaving) {
        return;
      }
      actions[action]();
    });
  }, [navigation, action]);
}
