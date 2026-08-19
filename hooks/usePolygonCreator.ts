import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { AreaProps, PolygonProps } from 'types/componentsTypes';


export const usePolygonCreator = () => {
    const [editing, setEditing] = useState<PolygonProps | null>(null);
    const [canFinishArea, setCanFinishArea] = useState<boolean>(false);
    const [polygons, setPolygons] = useState<Array<AreaProps>>([]);
    const [selectedArea, setSelectedArea] = useState<AreaProps | null>(null);

    const handleMapPress = useCallback((e: any) => {
        const newCoord = e.nativeEvent.coordinate;
        setEditing(prev => {
            if (!prev) {
                return {
                    id: Date.now(),
                    coordinates: [newCoord],
                };
            }
            if ([...prev.coordinates, newCoord]?.length > 2) {
                setCanFinishArea(true);
            }
            return {
                ...prev,
                coordinates: [...prev.coordinates, newCoord],
            };
        });
    }, []);

    const handleUndo = useCallback(() => {
        setEditing(prev => {
            if (!prev || prev.coordinates.length === 0) return null;
            const newCoords = [...prev.coordinates];
            newCoords.pop();
            if (newCoords.length < 3) {
                setCanFinishArea(false);
            }
            return { ...prev, coordinates: newCoords };
        });
    }, []);

    const handleDeleteArea = useCallback(async () => {
        if (editing) {
            await Promise.resolve(setEditing(null)).then(() => {
                setCanFinishArea(false);
            });
        }
    }, [editing]);

    const handleFinish = useCallback(() => {
        if (editing && editing.coordinates.length >= 3) {
            setPolygons(prev => [...prev, { ...editing, assignee: null }]);
            setEditing(null);
            setCanFinishArea(false);
        }
    }, [editing]);

    const handleSelectArea = useCallback((polygon: AreaProps) => {
        setSelectedArea(polygon);
    }, []);

    const handleDeleteExistingArea = useCallback(() => {
        if (selectedArea) {
            setPolygons(prevPolygons => prevPolygons.filter(polygon => polygon.id !== selectedArea.id));
            setSelectedArea(null);
            Alert.alert("Area Deleted", "The selected area has been successfully deleted.");
        }
    }, [selectedArea]);
    return {
        editing,
        setEditing,
        canFinishArea,
        setCanFinishArea,
        polygons,
        setPolygons,
        selectedArea,
        setSelectedArea,
        handleMapPress,
        handleUndo,
        handleDeleteArea,
        handleFinish,
        handleSelectArea,
        handleDeleteExistingArea,
    };
};
