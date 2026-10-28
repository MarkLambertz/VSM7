export const defaultColorMode = "white";
export const colorModePreferenceKey = "vsm7-color-mode";
export const supportedColorModes = Object.freeze(["white", "black"]);

export function normalizeColorMode(value) {
  return supportedColorModes.includes(value) ? value : defaultColorMode;
}

export function readColorModePreference(storage) {
  try {
    const preferences = storage ?? globalThis.localStorage;
    const savedMode = preferences?.getItem(colorModePreferenceKey);
    if (supportedColorModes.includes(savedMode)) return savedMode;
    // Keep the former dark preference when upgrading to the single design system.
    return preferences?.getItem("vsm7-interface-skin") === "command-deck" ? "black" : defaultColorMode;
  } catch {
    return defaultColorMode;
  }
}

export function saveColorModePreference(mode, storage) {
  const normalizedMode = normalizeColorMode(mode);
  try {
    (storage ?? globalThis.localStorage)?.setItem(colorModePreferenceKey, normalizedMode);
  } catch {
    // Optional appearance preferences must never block the workspace.
  }
  return normalizedMode;
}

export function applyColorModePreference(mode, root = globalThis.document?.documentElement, storage) {
  const normalizedMode = saveColorModePreference(mode, storage);
  if (root?.dataset) {
    root.dataset.mode = normalizedMode;
    delete root.dataset.skin;
  }
  return normalizedMode;
}
