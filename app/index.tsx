import React, { useState, useRef } from 'react'
import { View, Animated } from 'react-native'
import { StyleSheet } from 'react-native';
import { DrawingMap } from 'components/DrawingMap/DrawingMap';
import { FloatingButton } from 'components/Button/FloatingButton';
import { SettingsSvg, UsersSvg, FilterSvg, DrawSvg, MapSvg, AddSvg, SearchSvg } from 'components/svg';
import PolygonCreator from 'components/DrawingMap/MapV';
import { Button } from 'components/Button/Button';


export default function Map() {
    const [showDrawIcon, setShowDrawIcon] = useState<boolean>(false)
    const [activeDrawing, setActiveDrawing] = useState<boolean>(false)
    const [canFinishArea, setCanFinishArea] = useState<boolean>(false)
    const animation = useRef(new Animated.Value(0)).current;
    const buttons = [
        { icon: <AddSvg />, onPress: () => toggleDrawButton() },
        { icon: <SearchSvg />, onPress: () => console.log('SearchSvg') },
        { icon: <FilterSvg />, onPress: () => console.log('FilterSvg') },
        { icon: <MapSvg />, onPress: () => console.log('MapSvg') },
        { icon: <UsersSvg />, onPress: () => console.log('UsersSvg') },
        { icon: <SettingsSvg />, onPress: () => console.log('SettingsSvg') },
    ];

    const toggleDrawButton = () => {
        setShowDrawIcon(!showDrawIcon);
        Animated.timing(animation, {
            toValue: showDrawIcon ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={styles.container}>
            <PolygonCreator
                stopDrawing={() => {
                    setActiveDrawing(false);
                }}
                canDraw={activeDrawing}
            />
            <View style={styles.floatingButtonsContainer}>
                <Animated.View
                    style={{
                        transform: [
                            {
                                translateY: animation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -24],
                                }),
                            },
                        ],
                        opacity: animation,
                    }
                    }
                >
                    {/* {canFinishArea && <Button

                    />} */}
                    <FloatingButton
                        buttonStyle={{ backgroundColor: activeDrawing ? "#32A0FF" : 'white' }}
                        onPress={() => setActiveDrawing(!activeDrawing)}
                        buttonIcon={<DrawSvg color={activeDrawing ? 'white' : '#1F1F1F'} />}
                    />
                </Animated.View>
                {buttons.map((btn, index) => (
                    <View style={styles.buttonContainer} key={index}>
                        <FloatingButton key={index} onPress={btn.onPress} buttonIcon={btn.icon} />
                    </View>
                ))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContainer: {
        marginBottom: 24
    },
    floatingButtonsContainer: {
        position: 'absolute',
        right: 23,
        bottom: 46
    }
});