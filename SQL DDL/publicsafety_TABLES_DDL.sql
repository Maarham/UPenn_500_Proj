CREATE DATABASE publicsafety;
-- then change connection to database publicsafety and run the below tables with publicsafety console

CREATE TABLE "311_service_requests" (
unique_key VARCHAR(20) NOT NULL,
created_date TIMESTAMP,
closed_date TIMESTAMP,
status VARCHAR(50),
status_notes VARCHAR(200),
agency_name VARCHAR(100),
category VARCHAR(50),
complaint_type VARCHAR(100),
descriptor VARCHAR(100),
incident_address VARCHAR(100),
neighborhood VARCHAR(50),
location VARCHAR(100),
latitude NUMERIC(10, 6),
longitude NUMERIC(10, 6),
police_district VARCHAR(50),
PRIMARY KEY (unique_key)
);

CREATE TABLE fire_inspections (
    inspection_number VARCHAR(20) NOT NULL,
    inspection_type VARCHAR(10),
    inspection_type_description VARCHAR(100),
    inspection_status VARCHAR(50),
    inspection_start_date TIMESTAMP,
    inspection_end_date TIMESTAMP,
    invoice_date TIMESTAMP,
    sent_to_bureau_of_delinquent_revenue BOOLEAN,
    billable_inspection BOOLEAN,
    address VARCHAR(100),
    zip_code VARCHAR(10),
    permit_number VARCHAR(20),
    referral_number VARCHAR(20),
    dbi_application_number VARCHAR(30),
    invoice_amount NUMERIC(10, 2),
    fee NUMERIC(10, 2),
    paid_amount NUMERIC(10, 2),
    paid_date TIMESTAMP,
    fire_prevention_district VARCHAR(10),
    analysis_neighborhood VARCHAR(50),
    PRIMARY KEY (inspection_number)
);

CREATE TABLE fire_safety_complaints (
complaint_id VARCHAR(30) NOT NULL,
complaint_item_type_description VARCHAR(100),
inspection_number VARCHAR(20),
address VARCHAR(100),
zipcode VARCHAR(10),
received_date TIMESTAMP,
disposition VARCHAR(50),
disposition_date TIMESTAMP,
neighborhood_district VARCHAR(50),
location VARCHAR(100),
PRIMARY KEY (complaint_id),
FOREIGN KEY (inspection_number)
REFERENCES fire_inspections(inspection_number)
ON DELETE SET NULL
);

CREATE TABLE fire_violations (
inspection_number VARCHAR(20),
violation_id VARCHAR(30) NOT NULL,
address VARCHAR(100),
close_date TIMESTAMP,
corrective_action VARCHAR(100),
status VARCHAR(50),
violation_item_description VARCHAR(100),
violation_date TIMESTAMP,
violation_number VARCHAR(20),
violation_item VARCHAR(10),
zipcode VARCHAR(10),
neighborhood_district VARCHAR(50),
location VARCHAR(100),
PRIMARY KEY (violation_id)
);

CREATE TABLE fire_incidents (
    incident_number VARCHAR(20) NOT NULL,
    exposure_number INTEGER NOT NULL,
    id VARCHAR(20),
    address VARCHAR(100),
    city VARCHAR(50),
    zip_code VARCHAR(10),
    incident_date DATE,
    call_number VARCHAR(20),
    alarm_dt_tm TIMESTAMP,
    arrival_dt_tm TIMESTAMP,
    close_dt_tm TIMESTAMP,
    suppression_units NUMERIC(5,2),
    suppression_personnel NUMERIC(5,2),
    ems_units NUMERIC(5,2),
    ems_personnel NUMERIC(5,2),
    other_units NUMERIC(5,2),
    other_personnel NUMERIC(5,2),
    fire_fatalities INTEGER,
    fire_injuries NUMERIC(5,4),
    civilian_fatalities INTEGER,
    civilian_injuries INTEGER,
    number_of_alarms INTEGER,
    primary_situation VARCHAR(100),
    mutual_aid VARCHAR(50),
    action_taken_primary VARCHAR(100),
    action_taken_secondary VARCHAR(100),
    property_use VARCHAR(50),
    supervisor_district VARCHAR(50),
    analysis_neighborhood VARCHAR(50),
    PRIMARY KEY (incident_number, exposure_number)
);

CREATE TABLE sffd_service_calls (
call_number VARCHAR(20),
unit_id VARCHAR(20) NOT NULL,
incident_number VARCHAR(20) NOT NULL,
call_type VARCHAR(100),
call_date DATE,
received_timestamp TIMESTAMP,
dispatch_timestamp TIMESTAMP,
response_timestamp TIMESTAMP,
on_scene_timestamp TIMESTAMP,
transport_timestamp TIMESTAMP,
hospital_timestamp TIMESTAMP,
call_final_disposition VARCHAR(100),
address VARCHAR(100),
city VARCHAR(50),
zipcode_of_incident VARCHAR(10),
final_priority INTEGER,
als_unit BOOLEAN,
number_of_alarms INTEGER,
unit_type VARCHAR(50),
unit_sequence_in_call_dispatch INTEGER,
fire_prevention_district VARCHAR(10),
supervisor_district VARCHAR(10),
location VARCHAR(100),
latitude NUMERIC(10, 6),
longitude NUMERIC(10, 6),
PRIMARY KEY (incident_number, unit_id)
);

CREATE TABLE sfpd_incidents (
unique_key VARCHAR(20) NOT NULL,
category VARCHAR(50),
descript VARCHAR(100),
day_of_week VARCHAR(20),
pddistrict VARCHAR(50),
resolution VARCHAR(100),
address VARCHAR(100),
location VARCHAR(100),
latitude NUMERIC(10, 6),
longitude NUMERIC(10, 6),
pdid VARCHAR(30),
timestamp TIMESTAMP,
PRIMARY KEY (unique_key)
);



