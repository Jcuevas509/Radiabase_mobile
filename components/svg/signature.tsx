import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const SignatureSvg: React.FC<SvgProps> = ({ width = 17, height = 16, color = '#FFFFFF' }) => (
    <Svg width={width} height={height} viewBox="0 0 17 16" fill="none">
        <Path
            d="M6.375 11C6.375 11 6.709 9.33336 7.04167 9.33336C7.37433 9.33336 7.755 11 8.04167 11C8.32833 11 8.39833 10.3334 8.70833 10.3334C9.01833 10.3334 9.08433 11 9.375 11C9.66567 11 10.375 10.3334 10.375 10.3334M6.375 4.69336H10.375M6.375 6.16669H10.375M6.375 7.66669H10.375"
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M11.0417 3H5.70837C5.15609 3 4.70837 3.44772 4.70837 4V12C4.70837 12.5523 5.15609 13 5.70837 13H11.0417C11.594 13 12.0417 12.5523 12.0417 12V4C12.0417 3.44772 11.594 3 11.0417 3Z"
            stroke={color}
        />
    </Svg>
);

export default SignatureSvg;