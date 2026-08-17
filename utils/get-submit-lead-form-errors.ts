import { SubmitLeadFormValues, SubmitLeadOffice } from 'types/submit-lead.types';
import { isValidSubmitLeadPhone } from 'utils/format-submit-lead-phone';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasRequiredName(value: string): boolean {
  return value.trim().length >= 2;
}

function getQuestionnaireErrors(
  values: SubmitLeadFormValues,
  selectedOffice: SubmitLeadOffice | null,
): string[] {
  if (!values.isSubmitToOffice || !selectedOffice?.isQuestionnaireEnabled) {
    return [];
  }
  return selectedOffice.questions
    .filter((question) => question.required && !values.questionnaire[String(question.id)]?.trim())
    .map((question) => `${question.label} is required`);
}

/**
 * Validates the mobile Submit Lead form the same way the web form does.
 */
export function getSubmitLeadFormErrors(
  values: SubmitLeadFormValues,
  selectedOffice: SubmitLeadOffice | null,
): string[] {
  const errors: string[] = [];
  if (!hasRequiredName(values.firstName)) {
    errors.push('First name is required');
  }
  if (!hasRequiredName(values.lastName)) {
    errors.push('Last name is required');
  }
  if (!isValidSubmitLeadPhone(values.phone)) {
    errors.push('Phone number must be in format (555) 555-5555');
  }
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.push('Email is required');
  }
  if (!values.addressLine1.trim()) {
    errors.push('Street address is required');
  }
  if (!values.city.trim()) {
    errors.push('City is required');
  }
  if (!values.state.trim()) {
    errors.push('State is required');
  }
  if (values.zip.trim().length < 5) {
    errors.push('ZIP code must be at least 5 digits');
  }
  if (values.isSubmitToOffice && !values.officeId) {
    errors.push('Office is required');
  }
  return [...errors, ...getQuestionnaireErrors(values, selectedOffice)];
}
