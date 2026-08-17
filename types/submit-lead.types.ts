export type SubmitLeadQuestionOption = {
  readonly label: string;
  readonly value: string;
};

export type SubmitLeadQuestion = {
  readonly id: number;
  readonly type: string;
  readonly label: string;
  readonly required: boolean;
  readonly placeholder?: string;
  readonly options: SubmitLeadQuestionOption[];
};

export type SubmitLeadOffice = {
  readonly id: number;
  readonly name: string;
  readonly isQuestionnaireEnabled: boolean;
  readonly questions: SubmitLeadQuestion[];
};

export type SubmitLeadFormValues = {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly email: string;
  readonly addressLine1: string;
  readonly addressLine2: string;
  readonly city: string;
  readonly state: string;
  readonly zip: string;
  readonly about: string;
  readonly isSubmitToOffice: boolean;
  readonly officeId: number | null;
  readonly appointmentDate: string | null;
  readonly questionnaire: Record<string, string>;
};

export type SubmitLeadPayload = {
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly phone_number: string;
  readonly address_line1: string;
  readonly address_line2: string;
  readonly city: string;
  readonly state: string;
  readonly zip_code: string;
  readonly office_id?: number;
  readonly appt_date?: string;
  readonly notes?: string;
  readonly setter_id: number;
  readonly sales_org_id: number;
  readonly is_internal: boolean;
  readonly vertical_id: number;
  readonly creation_method: 'sales_rep_submit';
  readonly location: { readonly lat: number; readonly lng: number };
  readonly house_id?: number;
  readonly office_questionnaire?: {
    readonly office_id: number;
    readonly timestamp: string;
    readonly responses: Array<{
      readonly question_id: number;
      readonly question_type: string;
      readonly question_text: string;
      readonly options?: SubmitLeadQuestionOption[];
      readonly answer: string;
      readonly required: boolean;
    }>;
  };
};
