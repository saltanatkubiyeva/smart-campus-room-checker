export default {
	// JS Object "Rules": the only script in the low-code version.
	// Same deterministic rules as the code-based src/lib/contract.ts + checkAvailability().
	NOW_MIN: 540,          // fixed current time 09:00 (same as CURRENT_MINUTES)
	MAX_MIN: 120,          // AC2 upper limit
	DAY_MIN: 1440,
	ROOM: 'Room A-101',
	// Fictional bookings of Room A-101 (same as src/data/rooms.ts)
	bookings: [
		{ id: 'b1', title: 'Data Structures Lecture', start: '09:00', end: '10:00', bookedBy: 'Dr. Patel' },
		{ id: 'b2', title: 'Algorithms Tutorial', start: '12:00', end: '13:00', bookedBy: 'Prof. Lin' },
		{ id: 'b3', title: 'Faculty Meeting', start: '15:00', end: '16:00', bookedBy: 'Dept. Office' }
	],
	snapshot: '',
	checksRun: 0,
	lastResult: null,

	// Runs on page load: remember the bookings for the T8 "unchanged" check.
	init () {
		this.snapshot = JSON.stringify(this.bookings);
		this.lastResult = null;
		this.checksRun = 0;
	},

	toMin (hhmm) {
		return parseInt(hhmm.slice(0, 2), 10) * 60 + parseInt(hhmm.slice(3, 5), 10);
	},
	toText (min) {
		return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
	},
	fail (reasonCode, message) {
		return { available: false, reasonCode: reasonCode, message: message };
	},

	// AC6 / AC1 / AC2 — validation only (no booking data is read here).
	validate (startText, durationText, status) {
		const start = String(startText || '').trim();
		if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) {
			return { ok: false, result: this.fail('INVALID_INPUT', 'Start must be a time in HH:MM format (00:00–23:59).') };
		}
		const raw = String(durationText === undefined || durationText === null ? '' : durationText).trim();
		const duration = raw === '' ? NaN : Number(raw);
		if (!Number.isInteger(duration) || duration <= 0) {
			return { ok: false, result: this.fail('INVALID_DURATION', 'Duration must be a whole number of minutes greater than zero.') };
		}
		if (duration > this.MAX_MIN) {
			return { ok: false, result: this.fail('INVALID_DURATION', 'Duration must be at most 120 minutes.') };
		}
		if (status !== 'Open' && status !== 'Blocked') {
			return { ok: false, result: this.fail('INVALID_INPUT', 'Room status must be either "Open" or "Blocked".') };
		}
		const s = this.toMin(start);
		const e = s + duration;
		if (e > this.DAY_MIN) {
			return { ok: false, result: this.fail('INVALID_INPUT', 'The booking must end by 24:00.') };
		}
		return { ok: true, start: s, end: e };
	},

	// Deterministic availability rules (AC1, AC3, AC4); never changes bookings (AC5).
	evaluate (startText, durationText, status) {
		const v = this.validate(startText, durationText, status);
		if (!v.ok) return v.result;
		if (v.start <= this.NOW_MIN) {
			return this.fail('PAST_START', 'Start time must be after the current time (' + this.toText(this.NOW_MIN) + ').');
		}
		if (status === 'Blocked') {
			return this.fail('BLOCKED', 'This room is currently blocked and cannot be booked.');
		}
		const conflict = this.bookings.find(b => v.start < this.toMin(b.end) && v.end > this.toMin(b.start));
		if (conflict) {
			return this.fail('OVERLAP', 'Overlaps with "' + conflict.title + '" (' + conflict.start + '–' + conflict.end + ').');
		}
		return { available: true, reasonCode: 'AVAILABLE',
			message: this.ROOM + ' is available from ' + this.toText(v.start) + ' to ' + this.toText(v.end) + '.' };
	},

	// Button1.onClick
	check () {
		this.lastResult = this.evaluate(Input1.text, Input2.text, Select1.selectedOptionValue);
		this.checksRun = this.checksRun + 1;
		return this.lastResult;
	},

	// Input1/Input2.onTextChanged, Select1.onOptionChange: hide a stale decision.
	clear () {
		this.lastResult = null;
	},

	// AC1/AC2/AC6: PAST_START and invalid inputs are validation errors (T4, T5, T6).
	isValidationError (code) {
		return code === 'INVALID_INPUT' || code === 'INVALID_DURATION' || code === 'PAST_START';
	},

	label () {
		const r = this.lastResult;
		if (!r) return 'Enter a start time and a duration, then press "Check availability".';
		const kind = this.isValidationError(r.reasonCode) ? 'Invalid input' : (r.available ? 'Available' : 'Unavailable');
		return kind + ' — ' + r.reasonCode + ': ' + r.message;
	},

	// Debug/test helper: runs T1–T8 against the same rules (Run button in the editor).
	runTests () {
		const cases = [
			['T1', '10:30', '60', 'Open', 'AVAILABLE'],
			['T2', '12:30', '60', 'Open', 'OVERLAP'],
			['T3', '10:30', '60', 'Blocked', 'BLOCKED'],
			['T4', '10:30', '0', 'Open', 'INVALID_DURATION'],
			['T5', '10:30', '121', 'Open', 'INVALID_DURATION'],
			['T6', '08:00', '30', 'Open', 'PAST_START'],
			['T7', '13:00', '120', 'Open', 'AVAILABLE']
		];
		const before = JSON.stringify(this.bookings);
		const rows = cases.map(c => {
			const r = this.evaluate(c[1], c[2], c[3]);
			return { id: c[0], input: c[1] + ' + ' + c[2] + ' min, ' + c[3], expected: c[4], observed: r.reasonCode, pass: r.reasonCode === c[4] };
		});
		const same = JSON.stringify(this.bookings) === before;
		rows.push({ id: 'T8', input: 'after T1–T7', expected: 'bookings unchanged', observed: same ? 'unchanged' : 'CHANGED', pass: same });
		return rows;
	}
}
