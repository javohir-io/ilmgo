// Tiny event bridge so any button can open the command palette without prop drilling.
export const PALETTE_EVENT = 'ilmgo:palette'
export const openPalette = () => window.dispatchEvent(new CustomEvent(PALETTE_EVENT))
