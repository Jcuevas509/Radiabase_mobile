import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const DeviceSvg: React.FC<SvgProps> = ({ width = 8, height = 12, color = '#FFFFFF' }) => (
    <Svg width={width} height={height} viewBox="0 0 8 12" fill="none">
        <Path
            d="M1.33333 0C0.593333 0 0 0.593333 0 1.33333V12H8V1.33333C8 0.593333 7.40667 0 6.66667 0H1.33333ZM1.33333 1.33333H6.66667V10.6667H1.33333V1.33333ZM4.66667 5.33333V6.66667H6V5.33333H4.66667Z"
            fill={color}
        />
    </Svg>
);

export default DeviceSvg;