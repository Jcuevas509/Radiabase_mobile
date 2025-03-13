import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from 'components/Button/Button';
import { FloatingButton } from 'components/Button/FloatingButton';
import { Ionicons } from '@expo/vector-icons';
import { DrawSvg, UndoSvg } from 'components/svg';
interface ButtonConfig {
    icon: JSX.Element;
    onPress: () => void;
    style?: object;
}

interface FloatingButtonsProps {
    buttons: ButtonConfig[];
    canFinishArea?: boolean;
    onFinish?: () => void;
    activeDrawing?: boolean;
    setMapType: (type: 'standard' | 'satellite') => void;
    onToggleDrawing?: () => void;
    showUndoButton?: boolean;
    onUndo?: () => void;
    isManager: boolean;
    mapType: 'satellite' | 'standard'
}

interface MapTypeSelectorProps {
    mapType: 'standard' | 'satellite';
    onMapTypeChange: (type: 'standard' | 'satellite') => void;
}

const MapTypeSelector: React.FC<MapTypeSelectorProps> = ({ mapType, onMapTypeChange }) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.typeButton, mapType === 'standard' && styles.activeButton]}
                onPress={() => onMapTypeChange('standard')}
            >
                <Text style={[styles.typeButtonText, mapType === 'standard' && styles.activeButtonText]}>
                    Hybrid
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.typeButton, mapType === 'satellite' && styles.activeButton]}
                onPress={() => onMapTypeChange('satellite')}
            >
                <Text style={[styles.typeButtonText, mapType === 'satellite' && styles.activeButtonText]}>
                    Satellite
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const FloatingButtons: React.FC<FloatingButtonsProps> = ({
    buttons,
    canFinishArea = false,
    onFinish,
    activeDrawing = false,
    onToggleDrawing,
    showUndoButton = false,
    onUndo,
    isManager,
    mapType,
    setMapType,
}) => {
    return (
        <>
            <View style={styles.floatingButtonsContainer}>
                {canFinishArea && isManager && onFinish && (
                    <Button
                        text='Complete'
                        onPress={onFinish}
                        buttonStyle={styles.completeButtonStyle}
                        textStyle={styles.buttonTextStyle}
                        startIcon={<Ionicons name="checkmark-circle-outline" size={24} color="black" />}
                    />
                )}
                {isManager && onToggleDrawing && <View style={styles.buttonContainer}>
                    <FloatingButton
                        buttonStyle={{ backgroundColor: activeDrawing ? "#32A0FF" : 'white' }}
                        onPress={onToggleDrawing}
                        buttonIcon={<DrawSvg color={activeDrawing ? 'white' : '#1F1F1F'} />}
                    />
                </View>}
                {buttons?.map((btn, index) => (
                    <View style={styles.buttonContainer} key={index}>
                        <FloatingButton
                            onPress={btn.onPress}
                            buttonIcon={btn.icon}
                            buttonStyle={btn.style}
                        />
                    </View>
                ))}
                <MapTypeSelector
                    mapType={mapType}
                    onMapTypeChange={setMapType}
                />
            </View>
            {showUndoButton && isManager && onUndo && (
                <View style={styles.undoButtonContainer}>
                    <Button
                        text='Undo'
                        onPress={onUndo}
                        buttonStyle={styles.completeButtonStyle}
                        textStyle={styles.buttonTextStyle}
                        startIcon={<UndoSvg />}
                    />
                </View>
            )}

        </>
    );
};
const styles = StyleSheet.create({
    button: {
        backgroundColor: '#7243FF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '500',
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
    },
    floatingButtonsContainer: {
        flexDirection: 'column',
        position: 'absolute',
        bottom: 70,
        right: 26,
        zIndex: 10,
        alignItems: 'flex-end',
    },
    undoButtonContainer: {
        position: 'absolute',
        bottom: 70,
        left: 25,
        zIndex: 10,
        alignItems: 'flex-end',
    },
    buttonContainer: {
        marginBottom: 24,
        alignItems: 'flex-end',
    },
    container: {
        flexDirection: 'row',
        backgroundColor: '#E9E9E9',
        borderRadius: 4,
        padding: 4,
        height: 31,
        overflow: 'hidden',
    },
    typeButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    activeButton: {
        backgroundColor: 'white',
        borderRadius: 4
    },
    typeButtonText: {
        color: 'black',
        fontSize: 12,
    },
    activeButtonText: {
        fontWeight: 'bold'
    },
});

export default FloatingButtons;