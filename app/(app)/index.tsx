import React from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native';
import PolygonCreator from 'components/DrawingMap/PolygonCreator';

export default function Map() {
    return (
        <View style={styles.container}>
            <PolygonCreator />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
