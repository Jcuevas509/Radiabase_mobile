import { useEffect, useState } from "react"
import { Keyboard } from "react-native"
const emptyCoordinates = Object.freeze({
    screenX: 0,
    screenY: 0,
    width: 0,
    height: 0,
})
const initialValue = {
    start: emptyCoordinates,
    end: emptyCoordinates,
}
export function useKeyboard() {
    const [shown, setShown] = useState(false)
    const [coordinates, setCoordinates] = useState(initialValue)
    const [keyboardHeight, setKeyboardHeight] = useState(0)
    const handleKeyboardDidShow = (e: any) => {
        setShown(true)
        setCoordinates({ start: e.startCoordinates, end: e.endCoordinates })
        setKeyboardHeight(e.endCoordinates.height)
    }
    const handleKeyboardDidHide = (e: any) => {
        setShown(false)
        if (e) {
            setCoordinates({ start: e.startCoordinates, end: e.endCoordinates })
        } else {
            setCoordinates(initialValue)
            setKeyboardHeight(0)
        }
    }
    useEffect(() => {
        let didShow = Keyboard.addListener("keyboardDidShow", handleKeyboardDidShow)
        let didHide = Keyboard.addListener("keyboardDidHide", handleKeyboardDidHide)
        return () => {
            didShow?.remove()
            didHide?.remove()
        }
    }, [])
    return {
        keyboardShown: shown,
        coordinates,
        keyboardHeight,
    }
}
