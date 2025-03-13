import axios from 'axios';

interface Polygon {
    id: number;
    coordinates: Array<{ latitude: number; longitude: number }>;
    assignee: any;
}

export const fetchOverpassData = async (polygon: Polygon) => {
    const polygonCoordinates = polygon.coordinates;
    if (polygonCoordinates.length < 3) {
        throw new Error("Please draw a polygon with at least 3 points.");
    }

    const polygonString = polygonCoordinates
        .map((coord) => `${coord.latitude} ${coord.longitude}`)
        .join(' ');

    const overpassUrl = `https://overpass-api.de/api/interpreter`;
    const query = `[out:json];
    (
      way["building"](poly:"${polygonString}");
    );
    out center;`;

    try {
        const response = await axios.post(overpassUrl, query, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const data = response.data.elements;

        return data.map((item: any) => ({
            id: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            latitude: item.center?.lat,
            longitude: item.center?.lon,
            assignee: polygon?.assignee || null,
            title: item.tags?.name || "Unnamed Way",
            subtitle: item.tags?.amenity || "No Amenity",
            address: item.tags?.["addr:street"] ? `${item.tags["addr:housenumber"] || ''} ${item.tags["addr:street"]}` : "Unknown Address",
            statusId: null,
        }));
    } catch (error) {
        console.error("Error fetching data: ", error);
        throw error;
    }
};