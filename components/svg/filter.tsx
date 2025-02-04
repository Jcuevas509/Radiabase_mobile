import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const LinesSvg: React.FC<SvgProps> = ({ width = 28, height = 24, color = '#1F1F1F' }) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 28 24" fill="none">
            <Path
                d="M2 2H26M6 12H22M10.8 22H17.2"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
};

export default LinesSvg;
