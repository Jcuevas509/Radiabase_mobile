import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsShell } from 'components/screens/Settings/SettingsShell';

const FAQS = [
    {
        question: 'How do I create a new area?',
        answer: 'On the field map, tap the draw button and paint a loop around the homes you want. Drag the corner dots to fine-tune the boundary, then save and assign a rep.',
    },
    {
        question: 'What do the colored circles on houses mean?',
        answer: 'Each circle is a saved door: blue is New, red is Not Interested, amber is Not Home, teal is Go Back, and purple is Call Back. A white circle is a saved door with no outcome yet.',
    },
    {
        question: 'How do I convert a knock into a lead?',
        answer: 'Open the house sheet, fill in the homeowner details, and tap Convert to Lead. The lead links back to the door automatically and shows up in My Leads.',
    },
    {
        question: 'Why is a house showing “Unknown Address”?',
        answer: 'The address lookup runs once when a roof is first tapped. Outside covered counties it may not resolve; you can fill the address in manually on the lead form.',
    },
    {
        question: 'Can I change a lead’s status from my phone?',
        answer: 'Yes — in My Leads, tap the colored status pill on any lead and pick the new status.',
    },
    {
        question: 'Who can delete or reassign areas?',
        answer: 'Managers can draw, assign, reassign, and delete turf. Setters see the areas assigned to them and can knock and submit leads.',
    },
];

export default function FaqScreen() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    return (
        <SettingsShell title="FAQ">
            <View style={styles.card}>
                {FAQS.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <View key={faq.question} style={index > 0 ? styles.divider : undefined}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityState={{ expanded: isOpen }}
                                onPress={() => setOpenIndex(isOpen ? null : index)}
                                style={({ pressed }) => [styles.questionRow, pressed && styles.pressed]}
                            >
                                <Text style={styles.question}>{faq.question}</Text>
                                <Ionicons
                                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                                    size={16}
                                    color="#71717A"
                                />
                            </Pressable>
                            {isOpen ? <Text style={styles.answer}>{faq.answer}</Text> : null}
                        </View>
                    );
                })}
            </View>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
    },
    divider: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E4E4E7',
    },
    questionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        minHeight: 50,
    },
    question: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#18181B',
    },
    answer: {
        fontSize: 13,
        lineHeight: 19,
        color: '#52525B',
        paddingBottom: 13,
    },
    pressed: {
        opacity: 0.65,
    },
});
