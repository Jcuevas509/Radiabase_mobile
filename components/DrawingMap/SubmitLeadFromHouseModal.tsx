import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'components/Button/Button';
import { InputField } from 'components/Input/InputField';
import { SubmitLeadAppointmentPicker } from 'components/DrawingMap/SubmitLeadAppointmentPicker';
import { SubmitLeadQuestionnaireFields } from 'components/DrawingMap/SubmitLeadQuestionnaireFields';
import { useUserOffices } from 'hooks/useUserOffices';
import { useKeyboard } from 'hooks/useKeyboard';
import { BuildingProps } from 'types/componentsTypes';
import { User } from 'types/storageTypes';
import { SubmitLeadFormValues, SubmitLeadOffice } from 'types/submit-lead.types';
import { buildSubmitLeadDefaults } from 'utils/build-submit-lead-defaults';
import { buildSubmitLeadPayload } from 'utils/build-submit-lead-payload';
import { formatSubmitLeadPhone } from 'utils/format-submit-lead-phone';
import { getSubmitLeadFormErrors } from 'utils/get-submit-lead-form-errors';
import { hasIncompleteHouseAddress } from 'utils/parse-house-address';
import { reverseGeocodeHouseAddress } from 'utils/reverse-geocode-house-address';
import { createFieldLead } from 'services/leads-api';

type SubmitLeadFromHouseModalProps = {
  readonly visible: boolean;
  readonly house: BuildingProps;
  readonly user: User;
  readonly onBack: () => void;
  readonly onSubmitted: () => Promise<void> | void;
};

function pickSelectedOffice(
  offices: SubmitLeadOffice[],
  officeId: number | null,
): SubmitLeadOffice | null {
  return offices.find((office) => office.id === officeId) ?? null;
}

/**
 * Separate Submit Lead form, prefilled from a canvassing house.
 */
export function SubmitLeadFromHouseModal({
  visible,
  house,
  user,
  onBack,
  onSubmitted,
}: SubmitLeadFromHouseModalProps) {
  const insets = useSafeAreaInsets();
  const { keyboardShown, keyboardHeight } = useKeyboard();
  const { offices, isLoading } = useUserOffices(visible);
  const [values, setValues] = useState<SubmitLeadFormValues>(() => {
    return buildSubmitLeadDefaults(house, user.officeId);
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLookingUpAddress, setIsLookingUpAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedOffice = useMemo(
    () => pickSelectedOffice(offices, values.officeId),
    [offices, values.officeId],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    const defaults = buildSubmitLeadDefaults(house, user.officeId);
    setValues(defaults);
    setErrors([]);
    if (!hasIncompleteHouseAddress({
      addressLine1: defaults.addressLine1,
      city: defaults.city,
      state: defaults.state,
      zip: defaults.zip,
    })) {
      return;
    }
    let isActive = true;
    setIsLookingUpAddress(true);
    reverseGeocodeHouseAddress(house.latitude, house.longitude)
      .then((lookedUp) => {
        if (!isActive || !lookedUp) {
          return;
        }
        setValues((current) => ({
          ...current,
          addressLine1: current.addressLine1 || lookedUp.addressLine1,
          city: current.city || lookedUp.city,
          state: current.state || lookedUp.state,
          zip: current.zip || lookedUp.zip,
        }));
      })
      .catch(() => undefined)
      .finally(() => {
        if (isActive) {
          setIsLookingUpAddress(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [visible, house, user.officeId]);

  const updateValue = <Key extends keyof SubmitLeadFormValues>(
    key: Key,
    value: SubmitLeadFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    const nextErrors = getSubmitLeadFormErrors(values, selectedOffice);
    setErrors(nextErrors);
    if (nextErrors.length > 0) {
      return;
    }
    setIsSubmitting(true);
    try {
      await createFieldLead(buildSubmitLeadPayload({
        user,
        values,
        selectedOffice,
        latitude: house.latitude,
        longitude: house.longitude,
        houseId: Number(house.id),
      }));
      await onSubmitted();
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Could not submit this lead.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color="#18181B" />
              <Text style={styles.backText}>House</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Submit Lead</Text>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.subtitle}>
            Same Radiabase submit as the web app, linked to this house.
          </Text>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: keyboardShown ? keyboardHeight : 24 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>Customer information</Text>
            <View style={styles.row}>
              <View style={styles.half}>
                <InputField
                  value={values.firstName}
                  placeholder="First name *"
                  onChange={(text) => updateValue('firstName', text)}
                />
              </View>
              <View style={styles.half}>
                <InputField
                  value={values.lastName}
                  placeholder="Last name *"
                  onChange={(text) => updateValue('lastName', text)}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <InputField
                  value={values.phone}
                  placeholder="Phone *"
                  keyboardType="phone-pad"
                  onChange={(text) => updateValue('phone', formatSubmitLeadPhone(text))}
                />
              </View>
              <View style={styles.half}>
                <InputField
                  value={values.email}
                  placeholder="Email *"
                  keyboardType="email-address"
                  isEmail
                  onChange={(text) => updateValue('email', text)}
                />
              </View>
            </View>
            {isLookingUpAddress ? (
              <Text style={styles.lookupText}>Looking up this house address…</Text>
            ) : null}
            <InputField
              value={values.addressLine1}
              placeholder="Street address *"
              onChange={(text) => updateValue('addressLine1', text)}
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <InputField
                  value={values.city}
                  placeholder="City *"
                  onChange={(text) => updateValue('city', text)}
                />
              </View>
              <View style={styles.quarter}>
                <InputField
                  value={values.state}
                  placeholder="State *"
                  onChange={(text) => updateValue('state', text)}
                />
              </View>
              <View style={styles.quarter}>
                <InputField
                  value={values.zip}
                  placeholder="ZIP *"
                  keyboardType="number-pad"
                  onChange={(text) => updateValue('zip', text)}
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Lead details</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggle, values.isSubmitToOffice && styles.toggleActive]}
                onPress={() => updateValue('isSubmitToOffice', true)}
              >
                <Text style={[styles.toggleTitle, values.isSubmitToOffice && styles.toggleTitleActive]}>
                  Assign to Office
                </Text>
                <Text style={styles.toggleHint}>Send to office for processing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, !values.isSubmitToOffice && styles.toggleActive]}
                onPress={() => updateValue('isSubmitToOffice', false)}
              >
                <Text style={[styles.toggleTitle, !values.isSubmitToOffice && styles.toggleTitleActive]}>
                  Internal Lead
                </Text>
                <Text style={styles.toggleHint}>Manage the lead yourself</Text>
              </TouchableOpacity>
            </View>
            {values.isSubmitToOffice ? (
              <View style={styles.officeBlock}>
                <Text style={styles.label}>Office *</Text>
                {isLoading ? <ActivityIndicator color="#32A0FF" /> : (
                  <View style={styles.options}>
                    {offices.map((office) => {
                      const isSelected = values.officeId === office.id;
                      return (
                        <TouchableOpacity
                          key={office.id}
                          style={[styles.chip, isSelected && styles.chipSelected]}
                          onPress={() => updateValue('officeId', office.id)}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {office.name}
                            {office.id === user.officeId ? ' · Current' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            <SubmitLeadAppointmentPicker
              appointmentDate={values.appointmentDate}
              onChange={(isoDate) => updateValue('appointmentDate', isoDate)}
            />

            <Text style={styles.label}>About</Text>
            <InputField
              value={values.about}
              placeholder="Notes for the office"
              multiline
              style={styles.about}
              onChange={(text) => updateValue('about', text)}
            />

            {values.isSubmitToOffice && selectedOffice?.isQuestionnaireEnabled ? (
              <SubmitLeadQuestionnaireFields
                questions={selectedOffice.questions}
                answers={values.questionnaire}
                onChangeAnswer={(questionId, answer) => {
                  updateValue('questionnaire', {
                    ...values.questionnaire,
                    [String(questionId)]: answer,
                  });
                }}
              />
            ) : null}

            {errors.length > 0 ? (
              <View style={styles.errors}>
                {errors.map((error) => (
                  <Text key={error} style={styles.errorText}>{error}</Text>
                ))}
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button
              text={values.isSubmitToOffice ? 'Submit to Office' : 'Create Lead'}
              buttonStyle={styles.submitButton}
              textStyle={styles.submitText}
              onPress={handleSubmit}
              isLoading={isSubmitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 72,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  headerSpacer: {
    minWidth: 72,
  },
  subtitle: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    color: '#71717A',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  half: {
    flex: 1,
  },
  quarter: {
    width: 72,
  },
  lookupText: {
    fontSize: 12,
    color: '#32A0FF',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggle: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  toggleActive: {
    borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717A',
    marginBottom: 4,
  },
  toggleTitleActive: {
    color: '#18181B',
  },
  toggleHint: {
    fontSize: 11,
    color: '#71717A',
  },
  officeBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3F3F46',
    marginBottom: 8,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3F3F46',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  about: {
    height: 80,
    textAlignVertical: 'top',
  },
  errors: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12,
    marginBottom: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
  },
  submitButton: {
    backgroundColor: '#18181B',
    width: '100%',
    height: 44,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
