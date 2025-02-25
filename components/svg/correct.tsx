import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const CheckmarkSvg: React.FC<SvgProps> = ({ width = 12, height = 9, color = '#FFFFFF' }) => (
    <Svg width={width} height={height} viewBox="0 0 12 9" fill="none">
        <Path
            d="M4.54162 7.11342L10.6696 0.986084L11.6123 1.92875L4.54162 8.99942L0.29895 4.75675L1.24162 3.81408L4.54162 7.11342Z"
            fill={color}
        />
    </Svg>
);

export default CheckmarkSvg;