# AGENTS.md — Smart Campus Room Availability Checker

## Project
Smart Campus room availability checker (React + TypeScript + Vite, Tailwind).
User story: as a student, I want to check a room's availability so I can choose a valid booking time.
Fictional data only: one fictional 5-room catalog. One room is checked at a time; the availability
decision is always made for that ONE selected room using its own bookings.
The current time is fixed at 09:00 (`CURRENT_MINUTES = 540`).

## Structure
- `src/data/rooms.ts` — types `Room`, `Booking`, `Equipment` and the fictional room catalog (fixtures).
- `src/lib/constants.ts` — `MINUTES_IN_DAY`, `MAX_BOOKING_MINUTES` (120), `CURRENT_MINUTES`.
- `src/lib/time.ts` — `timeToMinutes`, `minutesToTime`, `parseTimeRange` (end 00:00 = 1440).
- `src/lib/availability.ts` — `checkAvailability(room, start, end, now)`: the booking rule (pure).
- `src/lib/filterRooms.ts` — capacity/equipment filtering and selection fallback (pure).
- `src/components/RoomChecker.tsx` — container: React state and wiring.
- `src/components/*.tsx` — presentation components (filters, list, panel, timeline, banner).
- `tests/*.test.ts(x)` — Vitest unit tests and one jsdom UI test.

## Acceptance criteria (must be preserved)
- AC1: reject start >= end, intervals outside 00:00–24:00 and start <= current time.
- AC2: reject durations longer than 120 minutes (exactly 120 is allowed).
- AC3: reject a blocked room.
- AC4: reject overlaps; bookings touching only at endpoints (600–660 and 660–720) are allowed.
- AC5: never mutate booking or room fixtures.
- AC6: keep clear Available/Unavailable feedback on desktop and mobile widths.

## Constraints (forbidden scope changes)
- No backend, database, login, payments, live APIs or saved booking creation.
- Do not redesign the UI, rename visible labels or change fixture data.
- Do not add dependencies unless asked.
- No secrets, API keys or credentials in code, fixtures or documentation.
- No external deployments: agents must not publish or deploy; publishing is done only by the
  human owner after tests pass and the diff is reviewed.

## Engineering rules
- Prefer pure functions and minimal changes.
- Use at most 2 design patterns, each only with a concrete, stated problem.
- Do not introduce Singleton, Factory, class hierarchies, or Strategy when only one policy exists.
- Adapter only if booking data really arrives in two different shapes.

## Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Tests: `npm test` (= `vitest run`)
- Type check: `npm run typecheck`

## Verification
- Run `npm test` before and after every change, and again before proposing acceptance;
  all existing tests must still pass.
- Never weaken or delete existing assertions; add focused regression tests instead.
- Report: changed files, rationale (problem -> pattern -> benefit) and the test output.
- Review gate: no change is accepted without the diff, the `npm test` output and human approval.
