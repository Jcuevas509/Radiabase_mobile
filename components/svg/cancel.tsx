import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const CancelSvg: React.FC<SvgProps> = ({ width = 19, height = 18, color = '#FFFFFF' }) => (
    <Svg width={width} height={height} viewBox="0 0 19 18" fill="none">
        <Path
            d="M3.96565 3.34065C7.08652 0.219783 12.1546 0.219783 15.2844 3.34065C18.4052 6.46152 18.4052 11.5296 15.2844 14.6594C12.1635 17.7802 7.09541 17.7802 3.96565 14.6594C0.844783 11.5385 0.844783 6.47041 3.96565 3.34065Z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M4.28564 3.66064L14.9553 14.3303"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export default CancelSvg;