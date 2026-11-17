# Smart Campus Room Availability Checker — Assignment #04

React + TypeScript + Vite prototype. A student filters fictional campus rooms by
attendees and equipment, selects a room and checks whether a time slot is available.
Nothing is saved: no login, payments, live APIs or database. The current time is fixed at 09:00.

## Requirements

- Node.js 18 or newer (includes npm)

## Setup

```bash
npm install
```

## Run

```bash
npm run dev        # development server, open the printed http://localhost:5173 URL
npm run build      # production build into dist/
npm run preview    # serve the production build
```

## Test

```bash
npm test           # = vitest run — all 35 tests (unit + UI)
npx vitest run tests/filterRooms.test.ts   # one file only
npm run typecheck  # TypeScript check of src/
```

| File | What it covers |
|---|---|
| `tests/availability.test.ts` | AC1–AC5 regression (valid time, 120 vs 121 min, blocked, touching vs overlapping, immutable data) |
| `tests/regression.test.ts` | focused AC1–AC5 pins: past/reversed times, 121 min, block reason, enclosing vs touching intervals, immutable catalog |
| `tests/time.test.ts` | time parsing, 00:00 end = midnight (1440) |
| `tests/filterRooms.test.ts` | catalog shape, F1–F5 (exact vs insufficient capacity, ALL equipment, blocked, empty, room switching) |
| `tests/roomChecker.ui.test.tsx` | UI/integration: renders the whole page in jsdom and clicks through filters, room switching and checks |

## Structure

```
src/
  data/rooms.ts              room catalog (5 fictional rooms) + types
  lib/constants.ts           120-minute limit, fixed current time
  lib/time.ts                HH:MM parsing/formatting, 00:00 → 1440
  lib/availability.ts        AC1–AC5 and F3 (pure function)
  lib/filterRooms.ts         F1, F2, attendee parsing, F5 selection fallback
  components/RoomChecker.tsx container: state + wiring
  components/*.tsx           RoomFilters, RoomList, AvailabilityPanel, Timeline,
                             TimeField, ResultBanner, BookingList, StatusBadge
tests/                       Vitest test files
```

## Rules

- AC1 0 ≤ start < end ≤ 1440 and start > current time · AC2 ≤ 120 minutes ·
  AC3 blocked room rejected · AC4 half-open intervals (touching is not overlap) ·
  AC5 data never modified · AC6 clear messages, responsive layout
- F1 capacity ≥ attendees · F2 room has ALL selected equipment · F3 blocked room never available ·
  F4 empty state when nothing matches · F5 switching room re-evaluates the result with that room's bookings
