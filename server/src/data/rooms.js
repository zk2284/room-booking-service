export const ROOMS = [
  { id: 1, name: "Falcon", capacity: 4 },
  { id: 2, name: "Orion", capacity: 8 },
  { id: 3, name: "Meridian", capacity: 12 },
  { id: 4, name: "Atlas", capacity: 2 },
  { id: 5, name: "Zephyr", capacity: 20 },
];

export const ROOMS_BY_ID = new Map(ROOMS.map((room) => [room.id, room]));
