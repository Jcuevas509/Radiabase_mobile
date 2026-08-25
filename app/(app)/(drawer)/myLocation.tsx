import React from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native';
import { TopMenu } from 'components/Menu/TopMenu';
import MapComponent from 'components/MyLocation/MapComponent';

export default function Map() {
    return (
        <View style={styles.container}>
            <TopMenu />
            <MapComponent />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});