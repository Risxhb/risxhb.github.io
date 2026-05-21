const GAME_SETTINGS_KEY = "eve-game-settings-v1";

export const AUDIO_SETTING_ROWS = [
  { key: "master", label: "Master" },
  { key: "sfx", label: "SFX" },
  { key: "ambience", label: "Ambience" }
];

export const PARTY_DISPLAY_OPTIONS = [
  { key: "full", label: "Full Party Trail" },
  { key: "leader", label: "Leader Only" }
];

export function defaultGameSettings() {
  return { partyDisplayMode: "full" };
}

export function normalizeGameSettings(settings = {}) {
  const defaults = defaultGameSettings();
  const validPartyDisplay = PARTY_DISPLAY_OPTIONS.some((option) => option.key === settings.partyDisplayMode);
  return {
    partyDisplayMode: validPartyDisplay ? settings.partyDisplayMode : defaults.partyDisplayMode
  };
}

export function loadGameSettings() {
  try {
    return normalizeGameSettings(JSON.parse(localStorage.getItem(GAME_SETTINGS_KEY) || "{}"));
  } catch {
    return defaultGameSettings();
  }
}

export function saveGameSettings(settings) {
  localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(normalizeGameSettings(settings)));
}
