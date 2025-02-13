import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const DashboardSvg: React.FC<SvgProps> = ({ width = 16, height = 17, color = 'white' }) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 16 17" fill="none">
            <Path
                d="M8.66667 6.01503V2.01503H14V6.01503H8.66667ZM2 8.6817V2.01503H7.33333V8.6817H2ZM8.66667 14.015V7.34837H14V14.015H8.66667ZM2 14.015V10.015H7.33333V14.015H2Z"
                fill={color}
            />
        </Svg>
    );
};

export default DashboardSvg;