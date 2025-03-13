import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const AddHouseSvg: React.FC<SvgProps> = ({ width = 24, height = 24, color = '#000' }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Path
            d="M18 14.3158H20.4V17.9474H24V20.3684H20.4V24H18V20.3684H14.4V17.9474H18V14.3158ZM3.6 21.5789V11.8947H0L12 1L24 11.8947H18V9.70368L12 4.25632L6 9.70368V19.1579H12C12 20.0053 12.144 20.8163 12.408 21.5789H3.6Z" fill={color}
        />
    </Svg>
);

export default AddHouseSvg;
