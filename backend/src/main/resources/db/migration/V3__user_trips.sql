CREATE TABLE t_trip (
    id VARCHAR(32) PRIMARY KEY,
    traveler_id VARCHAR(32) NOT NULL,
    poi_id VARCHAR(32) NOT NULL,
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    participates_in_matching BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    create_time DATETIME NOT NULL,
    update_time DATETIME NOT NULL,
    active_owner VARCHAR(32) GENERATED ALWAYS AS (CASE WHEN active THEN traveler_id ELSE NULL END) STORED,
    CONSTRAINT fk_trip_user FOREIGN KEY (traveler_id) REFERENCES t_user(id),
    CONSTRAINT fk_trip_poi FOREIGN KEY (poi_id) REFERENCES t_poi(id),
    CONSTRAINT ck_trip_dates CHECK (arrival_date <= departure_date),
    CONSTRAINT ck_trip_active_consent CHECK (NOT active OR participates_in_matching),
    CONSTRAINT uq_trip_active_owner UNIQUE (active_owner),
    INDEX idx_trip_owner_created (traveler_id, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
