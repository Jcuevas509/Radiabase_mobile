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