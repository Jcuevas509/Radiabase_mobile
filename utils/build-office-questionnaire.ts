import { SubmitLeadFormValues, SubmitLeadOffice, SubmitLeadPayload } from 'types/submit-lead.types';

/**
 * Builds the office_questionnaire blob the web Submit Lead form sends.
 */
export function buildOfficeQuestionnaire(input: {
  readonly values: SubmitLeadFormValues;
  readonly selectedOffice: SubmitLeadOffice | null;
  readonly timestamp?: string;
}): SubmitLeadPayload['office_questionnaire'] | undefined {
  if (!input.values.isSubmitToOffice || !input.selectedOffice?.isQuestionnaireEnabled) {
    return undefined;
  }
  return {
    office_id: input.selectedOffice.id,
    timestamp: input.timestamp ?? new Date().toISOString(),
    responses: input.selectedOffice.questions.map((question) => ({
      question_id: question.id,
      question_type: question.type,
      question_text: question.label,
      options: question.options.length > 0 ? question.options : undefined,
      answer: input.values.questionnaire[String(question.id)] ?? '',
      required: question.required,
    })),
  };
}
