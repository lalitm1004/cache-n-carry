import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const connection = await mysql.createConnection({
	host: 'localhost',
	port: 3307,
	user: 'dev_user',
	password: 'dev_password',
	database: 'dev_db',
});

const hostels = [
	"1A", "1B", "1C",
	"2A", "2B", "2C",
	"3A", "3B", "3C",
	"4A", "4B", "4C",
	"5A", "5B", "5C",
];

async function seedHostelRoomData() {
	const hostelConfigs = [
		{ name: '1A', type: 'double' },
		{ name: '1B', type: 'double' },
		{ name: '1C', type: 'double' },
		{ name: '2A', type: 'double' },
		{ name: '2B', type: 'double' },
		{ name: '2C', type: 'double' },
		{ name: '3A', type: 'double' },
		{ name: '3B', type: 'double' },
		{ name: '3C', type: 'double' },
		{ name: '4A', type: 'single' },
		{ name: '4B', type: 'single' },
		{ name: '5A', type: 'single' },
		{ name: '5B', type: 'single' },
		{ name: '5C', type: 'single' },
	];

	for (const { name, type } of hostelConfigs) {
		const hostelId = uuidv4();

		await connection.execute(
			'INSERT INTO hostel (id, name) VALUES (?, ?)',
			[hostelId, name]
		);

		if (type === 'double') {
			for (let floor = 0; floor < 6; floor++) {
				for (let roomNumber = 1; roomNumber <= 30; roomNumber++) {
					const number = `${floor}${roomNumber.toString().padStart(2, '0')}`;
					for (const letter of ['A', 'B']) {
						const fullRoomNumber = number + letter;
						await connection.execute(
							'INSERT INTO room (id, number, hostel_id) VALUES (?, ?, ?)',
							[uuidv4(), fullRoomNumber, hostelId]
						);
					}
				}
			}
		} else if (type === 'single') {
			for (let floor = 0; floor < 6; floor++) {
				for (let roomNumber = 1; roomNumber <= 45; roomNumber++) {
					const fullRoomNumber = `${floor}${roomNumber.toString().padStart(2, '0')}`;
					await connection.execute(
						'INSERT INTO room (id, number, hostel_id) VALUES (?, ?, ?)',
						[uuidv4(), fullRoomNumber, hostelId]
					);
				}
			}
		}
	}
}

async function seedWarehouseData() {
	for (const hostel of hostels) {
		const location = `${hostel}-cloakroom`;
		await connection.execute(
			'INSERT INTO warehouse (id, location) VALUES (?, ?)',
			[uuidv4(), location]
		);
	}
}

async function createTimeLogTriggers() {
	const triggerQueries = [
		`DROP TRIGGER IF EXISTS belonging_checkin_log;`,
		`
			CREATE TRIGGER belonging_checkin_log
			BEFORE UPDATE ON belonging
			FOR EACH ROW
			BEGIN
				IF OLD.is_checked_in = FALSE AND NEW.is_checked_in = TRUE THEN
					SET NEW.checked_in_at = NOW();
				END IF;
			END;
		`,

		`DROP TRIGGER IF EXISTS belonging_checkout_log;`,
		`
			CREATE TRIGGER belonging_checkout_log
			BEFORE UPDATE ON belonging
			FOR EACH ROW
			BEGIN
				IF OLD.is_checked_in = TRUE AND NEW.is_checked_in = FALSE THEN
					SET NEW.checked_out_at = NOW();
				END IF;
			END;
		`,

		`DROP TRIGGER IF EXISTS session_log;`,
		`
			CREATE TRIGGER session_log
			BEFORE UPDATE ON session
			FOR EACH ROW
			BEGIN
				IF OLD.terminated = FALSE AND NEW.terminated = TRUE THEN
					SET NEW.close_time = NOW();
				END IF;
			END;
		`,

		`DROP TRIGGER IF EXISTS incident_log;`,
		`
			CREATE TRIGGER incident_log
			BEFORE UPDATE ON incident
			FOR EACH ROW
			BEGIN
				IF OLD.resolved = FALSE AND NEW.resolved = TRUE THEN
					SET NEW.close_time = NOW();
				END IF;
			END;
		`,
	];

	try {
		for (const query of triggerQueries) {
			console.log("executing query...");
			await connection.query(query);
		}
	} catch (error) {
		console.error("🚨 Error executing triggers:", error);
	}
}

async function main() {
	try {
		await seedHostelRoomData();
		console.log("✅ Seeded hostel and room data");

		await seedWarehouseData();
		console.log("✅ Seeded warehouse data");

		await createTimeLogTriggers();
		console.log("✅ Created time log triggers");
	} catch (e) {
		console.error("🚨 Something failed in main:", e);
	} finally {
		await connection.end();
	}
}

main();
