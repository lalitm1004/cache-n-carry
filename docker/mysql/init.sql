-- create table "user"
CREATE TABLE user (
    id VARCHAR(191) NOT NULL,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL, 

    PRIMARY KEY (id),

    UNIQUE (email)
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

    PRIMARY KEY (id),

    CONSTRAINT user_id_staff FOREIGN KEY (id) REFERENCES user(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "student"
CREATE TABLE student (
    id VARCHAR(191) NOT NULL,
    current_hostel_id VARCHAR(191) NOT NULL,
    next_hostel_id VARCHAR(191),

    PRIMARY KEY (id),

    CONSTRAINT user_id_student FOREIGN KEY (id) REFERENCES user(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

    CONSTRAINT current_hostel FOREIGN KEY (current_hostel_id) REFERENCES hostel(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

    CONSTRAINT next_hostel FOREIGN KEY (next_hostel_id) REFERENCES hostel(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "belonging"
CREATE TABLE belonging (
    id VARCHAR(191) NOT NULL,
    is_checked_in BOOLEAN NOT NULL DEFAULT false,
    student_id VARCHAR(191) NOT NULL,
    warehouse_id VARCHAR(191),

    PRIMARY KEY (id),

    CONSTRAINT owner_student FOREIGN KEY (student_id) REFERENCES student(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

    CONSTRAINT warehouse_storage FOREIGN KEY (warehouse_id) REFERENCES warehouse(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "mattress"
CREATE TABLE mattress (
    id VARCHAR(191) NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT mattress_belonging FOREIGN KEY (id) REFERENCES belonging(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "luggage"
CREATE TABLE luggage (
    id VARCHAR(191) NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT luggage_belonging FOREIGN KEY (id) REFERENCES belonging(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "session"
CREATE TABLE session (
    id VARCHAR(191) NOT NULL,
    open_time DATETIME(3) NOT NULL,
    close_time DATETIME(3),
    resolved BOOLEAN NOT NULL DEFAULT false,
    staff_id VARCHAR(191) NOT NULL,
    student_id VARCHAR(191) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT student_session FOREIGN KEY (student_id) REFERENCES student(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

    CONSTRAINT staff_session FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

    UNIQUE (staff_id, student_id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- create table "incident"
CREATE TABLE incident (
    id VARCHAR(191) NOT NULL,
    found_by_id VARCHAR(191) NOT NULL,
    belongs_to_id VARCHAR(191) NOT NULL,
    mattress_id VARCHAR(191) NOT NULL,
    resolved BOOLEAN NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT student_found_by FOREIGN KEY (found_by_id) REFERENCES student(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

    CONSTRAINT student_belongs_to FOREIGN KEY (belongs_to_id) REFERENCES student(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

    CONSTRAINT mattress_involved FOREIGN KEY (mattress_id) REFERENCES mattress(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

    UNIQUE (found_by_id),
    UNIQUE (belongs_to_id),
    UNIQUE (mattress_id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;