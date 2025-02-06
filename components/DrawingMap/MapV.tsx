import { Button } from 'components/Button/Button';
import { PlainModal } from 'components/Modal/Modal';
import React, { useState, useCallback, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    TouchableOpacity,
    Alert,
} from 'react-native';
import MapView, { MAP_TYPES, Polygon, Marker } from 'react-native-maps';
import { peopleData } from 'constants/dataExample';
import { AgentCard } from 'components/Card/AgentCard';
const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;
const LATITUDE = 37.78825;
const LONGITUDE = -122.4324;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
interface DrawingMapProps {
    canDraw: boolean;
    stopDrawing: () => void;
}

const PolygonCreator = ({ canDraw, stopDrawing }: DrawingMapProps) => {
    const [region] = useState({
        latitude: LATITUDE,
        longitude: LONGITUDE,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
    });
    const [selectedAgent, setSelectedAgent] = useState<any>(null)
    const [polygons, setPolygons] = useState<Array<{
        id: number;
        assignee: any;
        coordinates: Array<{ latitude: number; longitude: number }>;
    }>>([]);
    const [openAssignModal, setOpenAssignModal] = useState<boolean>(false)

    const [editing, setEditing] = useState<{
        id: number;
        coordinates: Array<{ latitude: number; longitude: number }>;
    } | null>(null);

    const handleFinish = async () => {
        if (editing) {
            stopDrawing();
            setOpenAssignModal(true)
        }
    };

    const handleConfirmAndAssignArea = async () => {
        if (editing) {
            const newPolygon = JSON.parse(JSON.stringify(editing));
            setEditing(null)
            await Promise.resolve(setPolygons(prevPolygons => [...prevPolygons, newPolygon])).then(async () => {
                setOpenAssignModal(false);
            })
        }
    }
    const handleDeleteArea = async () => {
        if (editing) {
            await Promise.resolve(setEditing(null)).then(() => {
                setOpenAssignModal(false);
                setSelectedAgent(null)
            })

        }
    }

    const handleClear = useCallback(() => {
        setPolygons([]);
        setEditing(null);
    }, []);


    const handleUndo = useCallback(() => {
        setEditing(prev => {
            if (!prev || prev.coordinates.length === 0) return null;
            const newCoords = [...prev.coordinates];
            newCoords.pop();
            return { ...prev, coordinates: newCoords };
        });
    }, []);

    const handleMapPress = useCallback((e: any) => {
        const newCoord = e.nativeEvent.coordinate;
        setEditing(prev => {
            if (!prev) {
                return {
                    id: Date.now(),
                    coordinates: [newCoord],
                };
            }
            return {
                ...prev,
                coordinates: [...prev.coordinates, newCoord],
            };
        });
    }, []);

    return (
        <View style={styles.container}>
            <PlainModal
                visible={openAssignModal}
                onClose={() => setOpenAssignModal(false)}
                title="Assign Area to User"
                buttons={
                    < >
                        <Button
                            text='Delete Area'
                            textStyle={{ color: '#CA0105' }}
                            onPress={() => handleDeleteArea()}
                        />
                        <Button
                            text='Confirm & Assign'
                            buttonStyle={{ backgroundColor: 'black' }}
                            textStyle={{ color: 'white' }}
                            onPress={() => handleConfirmAndAssignArea()}
                        />

                    </>
                }
            >
                <>
                    {peopleData?.map((person) => <AgentCard
                        data={person}
                        setIsSelected={setSelectedAgent}
                        isSelected={selectedAgent === person?.id} />)}
                </>
            </PlainModal>
            <MapView
                style={styles.map}
                mapType={'satellite'}
                initialRegion={region}
                onPress={(e) => canDraw && handleMapPress(e)}
            >

                {polygons.map(polygon => (
                    <Polygon
                        key={polygon.id}
                        coordinates={polygon.coordinates}
                        strokeColor="#7243FF"
                        fillColor="rgba(114, 67, 255, 0.2)"
                        strokeWidth={2}
                        onPress={() => Alert.alert('Poly pressed' + polygon.id)}
                    />
                ))}

                {editing && editing.coordinates.length > 0 && (
                    < Polygon
                        coordinates={editing.coordinates}
                        strokeColor="#32A0FF"
                        fillColor="rgba(50, 160, 255, 0.2)"
                        strokeWidth={2}
                        onPress={() => {
                            Alert.alert('Poly pressed' + editing);
                        }}
                    />
                )}
                {/* {
                    editing && editing?.coordinates.map((coord, index) => (
                        <Marker
                            key={`marker-${editing.id}-${index}`}
                            coordinate={coord}
                            title={`Point ${index + 1}`}
                        />
                    ))
                } */}
            </MapView>

            <View style={styles.controls}>
                {editing && (
                    <>
                        <ActionButton onPress={handleFinish} label="Finish" />
                        <ActionButton onPress={handleUndo} label="Undo" />
                    </>
                )}
                <ActionButton onPress={handleClear} label="Clear" />
            </View>
        </View >
    );
};

const ActionButton: React.FC<{ onPress: () => void; label: string }> = ({ onPress, label }) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    controls: {
        flexDirection: 'row',
        gap: 10,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
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
});

export default PolygonCreator;