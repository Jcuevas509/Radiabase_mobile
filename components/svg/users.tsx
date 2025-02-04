import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { SvgProps } from 'react-native-svg';

const UsersSvg: React.FC<SvgProps> = ({ width = 23, height = 24, color = '#1F1F1F' }) => {
    return (
        <Svg width={width} height={height} viewBox="0 0 23 24" fill="none" >
            <Path
                d="M25 21.6667C25 18.88 22.7733 14.9093 19.6667 14.0307M17 21.6667C17 18.132 13.4187 13.6667 9 13.6667C4.58133 13.6667 1 18.132 1 21.6667M17 9C18.0609 9 19.0783 8.57857 19.8284 7.82843C20.5786 7.07828 21 6.06087 21 5C21 3.93913 20.5786 2.92172 19.8284 2.17157C19.0783 1.42143 18.0609 1 17 1M13 5C13 6.06087 12.5786 7.07828 11.8284 7.82843C11.0783 8.57857 10.0609 9 9 9C7.93913 9 6.92172 8.57857 6.17157 7.82843C5.42143 7.07828 5 6.06087 5 5C5 3.93913 5.42143 2.92172 6.17157 2.17157C6.92172 1.42143 7.93913 1 9 1C10.0609 1 11.0783 1.42143 11.8284 2.17157C12.5786 2.92172 13 3.93913 13 5Z"
                stroke={color}
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </Svg>
    );
};

export default UsersSvg;
