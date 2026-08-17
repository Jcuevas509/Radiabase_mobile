import { SubmitLeadOffice, SubmitLeadQuestion } from 'types/submit-lead.types';

type OfficeQuestionResponse = {
  readonly id?: number;
  readonly type?: string;
  readonly label?: string;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly options?: Array<{ label?: string; value?: string }>;
};

type UserOfficeResponse = {
  readonly id: number;
  readonly name: string;
  readonly is_questionnaire_enabled?: boolean;
  readonly office_questionnaire?: { readonly questions?: OfficeQuestionResponse[] } | null;
  readonly questionnaire?: { readonly questions?: OfficeQuestionResponse[] } | null;
};

function mapOfficeQuestion(question: OfficeQuestionResponse): SubmitLeadQuestion | null {
  if (typeof question.id !== 'number' || !question.label || !question.type) {
    return null;
  }
  return {
    id: question.id,
    type: question.type,
    label: question.label,
    required: Boolean(question.required),
    placeholder: question.placeholder,
    options: (question.options ?? [])
      .filter((option): option is { label: string; value: string } => Boolean(option.label && option.value)),
  };
}

/**
 * Maps GET /offices/user-offices into the Submit Lead office list.
 */
export function mapUserOffices(offices: UserOfficeResponse[]): SubmitLeadOffice[] {
  return offices.map((office) => {
    const questions = office.office_questionnaire?.questions ?? office.questionnaire?.questions ?? [];
    return {
      id: office.id,
      name: office.name,
      isQuestionnaireEnabled: Boolean(office.is_questionnaire_enabled),
      questions: questions
        .map(mapOfficeQuestion)
        .filter((question): question is SubmitLeadQuestion => question !== null),
    };
  });
}
