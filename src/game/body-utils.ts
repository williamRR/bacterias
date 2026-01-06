import { Color, OrganSlot } from './types';

export function isMapBody(body: any): body is Map<Color, OrganSlot> {
  return body instanceof Map;
}

export function getSlotFromBody(body: Map<Color, OrganSlot> | Record<string, OrganSlot>, color: Color): OrganSlot | undefined {
  return isMapBody(body) ? body.get(color) : body[color];
}

export function setSlotInBody(body: Map<Color, OrganSlot> | Record<string, OrganSlot>, color: Color, slot: OrganSlot): void {
  if (isMapBody(body)) {
    body.set(color, slot);
  } else {
    body[color] = slot;
  }
}

export function getBodySlots(body: Map<Color, OrganSlot> | Record<string, OrganSlot>): OrganSlot[] {
  return isMapBody(body) ? Array.from(body.values()) : Object.values(body);
}

export function getBodyEntries(body: Map<Color, OrganSlot> | Record<string, OrganSlot>): Array<[Color, OrganSlot]> {
  return isMapBody(body) ? Array.from(body.entries()) : Object.entries(body) as Array<[Color, OrganSlot]>;
}

export function serializeBody(body: Map<Color, OrganSlot> | Record<string, OrganSlot>): Record<string, OrganSlot> {
  return isMapBody(body) ? Object.fromEntries(body.entries()) : body;
}

export function initializeEmptySlot(): OrganSlot {
  return { organCard: undefined, virusCards: [], medicineCards: [] };
}

export const COLORS = [Color.RED, Color.BLUE, Color.GREEN, Color.YELLOW] as const;
export const ALL_COLORS = [...COLORS, Color.MULTICOLOR] as const;
export const SLOT_COLORS = COLORS;
