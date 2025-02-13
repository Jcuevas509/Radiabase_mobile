import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const MyLocationSvg: React.FC<SvgProps> = ({ width = 26, height = 26, color = 'black' }) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 26 26" fill="none">
            <Path
                d="M1 13H4.6M21.4 13H25M13 1V4.6M13 21.4V25"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M13 21.4C17.6392 21.4 21.4 17.6392 21.4 13C21.4 8.36081 17.6392 4.60001 13 4.60001C8.36078 4.60001 4.59998 8.36081 4.59998 13C4.59998 17.6392 8.36078 21.4 13 21.4Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M13 16.6C14.9882 16.6 16.6 14.9882 16.6 13C16.6 11.0118 14.9882 9.39999 13 9.39999C11.0118 9.39999 9.40002 11.0118 9.40002 13C9.40002 14.9882 11.0118 16.6 13 16.6Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};

export default MyLocationSvg;