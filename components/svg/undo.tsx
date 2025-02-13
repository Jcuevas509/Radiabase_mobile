import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { SvgProps } from 'types/componentsTypes';

const UndoSvg: React.FC<SvgProps> = ({ width = 15, height = 13, color = 'black' }) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 15 13" fill="none">
            <Path
                d="M2.404 13V12H9.658C10.6953 12 11.5787 11.6443 12.308 10.933C13.0387 10.2217 13.404 9.353 13.404 8.327C13.404 7.301 13.039 6.43567 12.309 5.731C11.5783 5.02567 10.6947 4.673 9.658 4.673H1.916L4.881 7.638L4.173 8.346L0 4.173L4.173 0L4.881 0.708L1.916 3.673H9.658C10.9667 3.673 12.085 4.12433 13.013 5.027C13.9397 5.92967 14.403 7.02967 14.403 8.327C14.403 9.62433 13.9397 10.7277 13.013 11.637C12.0863 12.5463 10.9677 13.0007 9.657 13H2.404Z"
                fill={color}
            />
        </Svg>
    );
};

export default UndoSvg;