// Room catalog — fictional data only (no database, no live API).

export const EQUIPMENT_OPTIONS = [
  'Projector',
  'Whiteboard',
  'Video conferencing',
  'Computers',
] as const;

export type Equipment = (typeof EQUIPMENT_OPTIONS)[number];

export interface Booking {
  id: string;
  start: number; // minutes from midnight (0–1440)
  end: number; // minutes from midnight
  title: string;
  bookedBy: string;
}

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: readonly Equipment[];
  blocked: boolean;
  blockReason?: string;
  bookings: readonly Booking[];
}

export const rooms: readonly Room[] = [
  {
    id: 'A-101',
    name: 'Room A-101',
    building: 'Engineering Block',
    capacity: 40,
    equipment: ['Projector', 'Whiteboard'],
    blocked: false,
    bookings: [
      { id: 'b1', start: 540, end: 600, title: 'Data Structures Lecture', bookedBy: 'Dr. Patel' },
      { id: 'b2', start: 720, end: 780, title: 'Algorithms Tutorial', bookedBy: 'Prof. Lin' },
      { id: 'b3', start: 900, end: 960, title: 'Faculty Meeting', bookedBy: 'Dept. Office' },
    ],
  },
  {
    id: 'B-204',
    name: 'Room B-204',
    building: 'Science Block',
    capacity: 25,
    equipment: ['Whiteboard', 'Computers'],
    blocked: false,
    bookings: [
      { id: 'b4', start: 600, end: 660, title: 'Physics Lab', bookedBy: 'Dr. Garcia' },
      { id: 'b5', start: 840, end: 900, title: 'Chemistry Seminar', bookedBy: 'Prof. Nguyen' },
    ],
  },
  {
    id: 'C-310',
    name: 'Room C-310',
    building: 'Library Wing',
    capacity: 12,
    equipment: ['Projector', 'Video conferencing'],
    blocked: true,
    blockReason: 'Under renovation until further notice.',
    bookings: [],
  },
  {
    id: 'D-115',
    name: 'Room D-115',
    building: 'Library Wing',
    capacity: 8,
    equipment: ['Whiteboard'],
    blocked: false,
    bookings: [
      { id: 'b6', start: 660, end: 720, title: 'Study Group', bookedBy: 'Student Council' },
    ],
  },
  {
    id: 'E-220',
    name: 'Room E-220',
    building: 'Main Hall',
    capacity: 60,
    equipment: ['Projector', 'Whiteboard', 'Video conferencing'],
    blocked: false,
    bookings: [
      { id: 'b7', start: 600, end: 720, title: 'Guest Lecture', bookedBy: 'Career Center' },
    ],
  },
];
