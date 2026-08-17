import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { buildAppointmentDays } from 'utils/build-appointment-days';
import {
  buildAppointmentTimeSlots,
  combineAppointmentDateTime,
  formatAppointmentSummary,
} from 'utils/build-submit-lead-appointment';

type PickerKind = 'date' | 'time' | null;

type SubmitLeadAppointmentPickerProps = {
  readonly appointmentDate: string | null;
  readonly onChange: (isoDate: string | null) => void;
};

function toTimeValue(date: Date): string {
  const minutes = date.getMinutes() < 30 ? '00' : '30';
  return `${String(date.getHours()).padStart(2, '0')}:${minutes}`;
}

/**
 * Immediate / Schedule appointment picker matching web Submit Lead.
 */
export function SubmitLeadAppointmentPicker({
  appointmentDate,
  onChange,
}: SubmitLeadAppointmentPickerProps) {
  const [isImmediate, setIsImmediate] = useState(true);
  const [openPicker, setOpenPicker] = useState<PickerKind>(null);
  const selectedDate = appointmentDate ? new Date(appointmentDate) : new Date();
  const selectedTime = toTimeValue(selectedDate);

  const handleImmediate = () => {
    setIsImmediate(true);
    setOpenPicker(null);
    onChange(new Date().toISOString());
  };

  const handleSchedule = () => {
    setIsImmediate(false);
    onChange(combineAppointmentDateTime(selectedDate, selectedTime));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Appointment date & time</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggle, isImmediate && styles.toggleActive]}
          onPress={handleImmediate}
        >
          <Text style={[styles.toggleText, isImmediate && styles.toggleTextActive]}>Immediate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggle, !isImmediate && styles.toggleActive]}
          onPress={handleSchedule}
        >
          <Text style={[styles.toggleText, !isImmediate && styles.toggleTextActive]}>Schedule</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.summary}>{formatAppointmentSummary(appointmentDate, isImmediate)}</Text>
      {!isImmediate ? (
        <View style={styles.pickers}>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setOpenPicker('date')}>
            <Text style={styles.pickerLabel}>Date</Text>
            <Text style={styles.pickerValue}>
              {selectedDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setOpenPicker('time')}>
            <Text style={styles.pickerLabel}>Time</Text>
            <Text style={styles.pickerValue}>
              {selectedDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <Modal visible={openPicker !== null} transparent animationType="fade" onRequestClose={() => setOpenPicker(null)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpenPicker(null)}>
          <View style={styles.sheet}>
            <Text style={styles.heading}>{openPicker === 'date' ? 'Select date' : 'Select time'}</Text>
            <ScrollView>
              <View style={styles.slots}>
                {openPicker === 'date'
                  ? buildAppointmentDays().map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={styles.slot}
                      onPress={() => {
                        onChange(combineAppointmentDateTime(new Date(day.value), selectedTime));
                        setOpenPicker(null);
                      }}
                    >
                      <Text style={styles.slotText}>{day.label}</Text>
                    </TouchableOpacity>
                  ))
                  : buildAppointmentTimeSlots().map((slot) => (
                    <TouchableOpacity
                      key={slot.value}
                      style={[styles.slot, selectedTime === slot.value && styles.slotSelected]}
                      onPress={() => {
                        onChange(combineAppointmentDateTime(selectedDate, slot.value));
                        setOpenPicker(null);
                      }}
                    >
                      <Text style={[styles.slotText, selectedTime === slot.value && styles.slotTextSelected]}>
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggle: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#18181B',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#71717A',
  },
  toggleTextActive: {
    color: '#18181B',
  },
  summary: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: '#52525B',
  },
  pickers: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 10,
  },
  pickerLabel: {
    fontSize: 11,
    color: '#71717A',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '70%',
  },
  slots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slot: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  slotSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3F3F46',
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
});
