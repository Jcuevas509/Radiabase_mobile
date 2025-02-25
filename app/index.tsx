import React from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native';
import PolygonCreator from 'components/DrawingMap/MapV';
import { TopMenu } from 'components/Menu/TopMenu';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Map() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                <TopMenu />
                <PolygonCreator />
            </View>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        marginBottom: 24,
        alignItems: 'flex-end',
    },
    floatingButtonsContainer: {
        position: 'absolute',
        alignItems: 'flex-end',
        right: 23,
        bottom: 300,
        zIndex: 6
    },
    completeButtonStyle: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 6,
        height: 34,
        width: 113,
        marginBottom: 24
    },
    buttonTextStyle: {
        marginLeft: 4
    }
});