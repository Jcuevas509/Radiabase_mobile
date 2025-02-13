export const hexToRgba = (hex: string, opacity: number) => {
    const sanitizedHex = hex.replace('#', '');
    const bigint = parseInt(sanitizedHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
export const getAcronym = (fullName: string): string => {
    const words = fullName.trim().split(" ");
    if (words.length >= 2) {
        return words.map(word => word[0].toUpperCase()).join("");
    } else return ""
}
