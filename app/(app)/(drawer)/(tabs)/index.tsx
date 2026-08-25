import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FieldMapScreen } from 'components/FieldMap/FieldMapScreen';

export default function Map() {
    return (
        <View style={styles.container}>
            <FieldMapScreen />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
