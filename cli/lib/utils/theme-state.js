export let isDoomsday = false;

export function setDoomsdayMode(enabled) {
  isDoomsday = enabled;
}

export function isDoomsdayMode() {
  return isDoomsday;
}
