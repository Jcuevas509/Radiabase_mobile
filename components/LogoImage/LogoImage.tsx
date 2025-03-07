import React from 'react'
import { Image, ImageBackground, StyleSheet, Dimensions } from 'react-native'

interface LogoProps {
    type?: 'large' | 'medium'
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const LogoImage = ({ type = 'medium' }: LogoProps) => {
    const backgroundHeight = type === 'large' ? 217 : 152
    const logoWidth = SCREEN_WIDTH * 0.6 // 60% of screen width
    const logoHeight = (logoWidth * 43) / 247 // Maintain aspect ratio
    return (
        <ImageBackground
            source={require('../../assets/images/MenuImage.png')}
            style={[styles.menuImage, { height: backgroundHeight }]}
            resizeMode="cover"
        >
            <Image
                source={require('../../assets/images/TextLogo.png')}
                style={{
                    width: logoWidth,
                    height: logoHeight,
                }}
                resizeMode="contain"
            />
        </ImageBackground>
    )
}

export default LogoImage

const styles = StyleSheet.create({
    menuImage: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
})