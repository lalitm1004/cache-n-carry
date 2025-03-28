-- create table "user"
CREATE TABLE user (
    id VARCHAR(191) NOT NULL,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL, 

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "hostel"
CREATE TABLE hostel (
    id VARCHAR(191) NOT NULL,
    name VARCHAR(191) NOT NULL,

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "warehouse"
CREATE TABLE warehouse (
    id VARCHAR(191) NOT NULL,
    location VARCHAR(191) NOT NULL,

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "staff"
CREATE TABLE staff (
    id VARCHAR(191) NOT NULL,

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "student"
CREATE TABLE student (
    id VARCHAR(191) NOT NULL,
    current_hostel_id VARCHAR(191) NOT NULL,
    next_hostel_id VARCHAR(191),

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "belonging"
CREATE TABLE belonging (
    id VARCHAR(191) NOT NULL,
    is_checked_in BOOLEAN NOT NULL DEFAULT false,
    student_id VARCHAR(191) NOT NULL,
    warehouse_id VARCHAR(191),

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "mattress"
CREATE TABLE mattress (
    id VARCHAR(191) NOT NULL,

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "luggage"
CREATE TABLE luggage (
    id VARCHAR(191) NOT NULL,

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "session"
CREATE TABLE session (
    id VARCHAR(191) NOT NULL,
    open_time DATETIME(3) NOT NULL,
    close_time DATETIME(3),
    resolved BOOLEAN NOT NULL DEFAULT false,
    staff_id VARCHAR(191) NOT NULL,
    student_id VARCHAR(191) NOT NULL,

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE incident (
    id VARCHAR(191) NOT NULL,
    found_by_id VARCHAR(191) NOT NULL,
    belongs_to_id VARCHAR(191) NOT NULL,
    mattress_id VARCHAR(191) NOT NULL,
    resolved BOOLEAN NOT NULL,

    PRIMARY KEY (id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- foreign keys for "staff"
ALTER TABLE staff 
    ADD CONSTRAINT user_id_staff FOREIGN KEY (id) REFERENCES user(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- foreign keys for "student"
ALTER TABLE student
    ADD CONSTRAINT user_id_student FOREIGN KEY (id) REFERENCES user(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE student
    ADD CONSTRAINT current_hostel FOREIGN KEY (current_hostel_id) REFERENCES hostel(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE student
    ADD CONSTRAINT next_hostel FOREIGN KEY (next_hostel_id) REFERENCES hostel(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- foreign keys for "belonging"
ALTER TABLE belonging
    ADD CONSTRAINT owner_student FOREIGN KEY (student_id) REFERENCES student(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE belonging
    ADD CONSTRAINT warehouse_storage FOREIGN KEY (warehouse_id) REFERENCES warehouse(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- foreign keys for "mattress"
ALTER TABLE mattress
    ADD CONSTRAINT mattress_belonging FOREIGN KEY (id) REFERENCES belonging(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- foreign keys for "mattress"
ALTER TABLE luggage
    ADD CONSTRAINT luggage_belonging FOREIGN KEY (id) REFERENCES belonging(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- foreign keys for "session"
ALTER TABLE session
    ADD CONSTRAINT student_session FOREIGN KEY (student_id) REFERENCES student(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE session
    ADD CONSTRAINT staff_session FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- foreign keys for "incident"
ALTER TABLE incident
    ADD CONSTRAINT student_found_by FOREIGN KEY (found_by_id) REFERENCES student(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE incident
    ADD CONSTRAINT student_belongs_to FOREIGN KEY (belongs_to_id) REFERENCES student(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE incident
    ADD CONSTRAINT mattress_involved FOREIGN KEY (mattress_id) REFERENCES mattress(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

-- unique indices
CREATE UNIQUE INDEX user_email ON user(email);
CREATE UNIQUE INDEX session_staff_student ON session(staff_id, student_id);
CREATE UNIQUE INDEX incident_found_by ON incident(found_by_id);
CREATE UNIQUE INDEX incident_belongs_to ON incident(belongs_to_id);
CREATE UNIQUE INDEX incident_mattress ON incident(mattress_id);