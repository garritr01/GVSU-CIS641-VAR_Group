export const getCurrentTime = () => {
    return new Date().toLocaleTimeString();
}

export const areDigits = (value) => {
    return /^\d+$/.test(value);
};
