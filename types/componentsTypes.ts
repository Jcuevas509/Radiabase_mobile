export interface SvgProps {
    width?: string;
    height?: string;
    stroke?: string | undefined;
    color?: string | undefined;
    backgroundColor?: string | undefined;
}

export interface CoordinateProps {
    latitude: number;
    longitude: number;
}
export interface MarkerProps extends CoordinateProps {
    title: string;
    subtitle: string;
}

export interface PolygonProps {
    coordinates: CoordinateProps[];
    id: number;
}

export interface AreaProps extends PolygonProps {
    assignee: any;
    buildingMarkers: Array<CoordinateProps>;
}

export interface BuildingProps extends CoordinateProps {
    id: number;
    statusId?: number;
    address?: string;
    title?: string;
    subtitle?: string;
}

export interface LeadStatus {
    statusId: number;
    shortName: string;
    fullName: string;
    color: string;
    icon: React.FC<SvgProps>;
}