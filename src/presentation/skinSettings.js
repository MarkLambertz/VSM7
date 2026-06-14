export const defaultSkin = "workshop";
export const skinPreferenceKey = "vsm7-interface-skin";
export const supportedSkins = Object.freeze(["workshop", "command-deck"]);

export function normalizeSkin(value) {
  return supportedSkins.includes(value) ? value : defaultSkin;
}

export function readSkinPreference(storage = globalThis.localStorage) {
  try {
    return normalizeSkin(storage?.getItem(skinPreferenceKey));
  } catch {
    return defaultSkin;
  }
}

export function saveSkinPreference(skin, storage = globalThis.localStorage) {
  const normalizedSkin = normalizeSkin(skin);

  try {
    storage?.setItem(skinPreferenceKey, normalizedSkin);
  } catch {
    // The visual preference is optional and must never block the workspace.
  }

  return normalizedSkin;
}

export function applySkinPreference(skin, root = globalThis.document?.documentElement, storage = globalThis.localStorage) {
  const normalizedSkin = saveSkinPreference(skin, storage);

  if (root?.dataset) {
    root.dataset.skin = normalizedSkin;
  }

  return normalizedSkin;
}
