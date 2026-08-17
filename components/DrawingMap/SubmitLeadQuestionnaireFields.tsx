import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { InputField } from 'components/Input/InputField';
import { SubmitLeadQuestion } from 'types/submit-lead.types';

type SubmitLeadQuestionnaireFieldsProps = {
  readonly questions: SubmitLeadQuestion[];
  readonly answers: Record<string, string>;
  readonly onChangeAnswer: (questionId: number, answer: string) => void;
};

/**
 * Renders the office questionnaire from web Submit Lead (text + single select).
 */
export function SubmitLeadQuestionnaireFields({
  questions,
  answers,
  onChangeAnswer,
}: SubmitLeadQuestionnaireFieldsProps) {
  if (questions.length === 0) {
    return null;
  }
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Office questions</Text>
      {questions.map((question) => (
        <View key={question.id} style={styles.question}>
          <Text style={styles.label}>
            {question.label}
            {question.required ? ' *' : ''}
          </Text>
          {question.type === 'singleSelect' ? (
            <View style={styles.options}>
              {question.options.map((option) => {
                const isSelected = answers[String(question.id)] === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => onChangeAnswer(question.id, option.value)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <InputField
              value={answers[String(question.id)] ?? ''}
              placeholder={question.placeholder || 'Answer'}
              onChange={(text) => onChangeAnswer(question.id, text)}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 12,
  },
  question: {
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
  },
  option: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
  },
  optionSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  optionText: {
    fontSize: 12,
    color: '#3F3F46',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
});
