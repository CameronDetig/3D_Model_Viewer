function getInputValue(elementID) {
    const element = document.getElementById(elementID);
    if (!element) {
        throw new Error(`Missing UI element: ${elementID}`);
    }
    const elementVal = Number(element.value);
    return elementVal;
}
