-- CreateTable
CREATE TABLE "fc_company" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "creation_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    CONSTRAINT "fc_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_user" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "is_male" BOOLEAN,
    "company_id" INTEGER,
    "user_type" INTEGER DEFAULT 3,
    "creation_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fc_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_user_type" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(50) NOT NULL,

    CONSTRAINT "fc_user_type_pkey" PRIMARY KEY ("id")
);

-- Insert initial data into fc_user_type
INSERT INTO "fc_user_type" ("id", "description") VALUES
(1, 'Superadmin'),
(2, 'Admin'),
(3, 'User');

-- CreateTable
CREATE TABLE "fc_cloth_category" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(100) NOT NULL,

    CONSTRAINT "fc_cloth_category_pkey" PRIMARY KEY ("id")
);

INSERT INTO fc_cloth_category (description) VALUES
('clothing'),
('footwear'),
('head_protection'),
('hand_protection'),
('eye_face_protection'),
('respiratory_protection'),
('high_visibility'),
('thermal_clothing'),
('welding'),
('lab_wear');


-- CreateTable
CREATE TABLE "fc_cloth" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "category_id" INTEGER,
    "description" VARCHAR(100) NOT NULL,

    CONSTRAINT "fc_cloth_pkey" PRIMARY KEY ("id")
);

INSERT INTO fc_cloth (description, category_id) VALUES
('work_pants', 1),
('work_shirt', 1),
('work_jacket', 1),
('safety_jacket', 7),
('protective_gloves', 4),
('work_shoes', 2),
('safety_boots', 2),
('helmet', 3),
('ear_protection', 3),
('eye_protection', 5),
('face_shield', 5),
('respirator_mask', 6),
('high_visibility_vest', 7),
('thermal_underwear', 8),
('raincoat', 1),
('apron', 1),
('tool_belt', 1),
('coveralls', 1),
('lab_coat', 10),
('knee_pads', 1),
('welding_jacket', 9),
('welding_gloves', 9),
('fire_resistant_suit', 9),
('cut_resistant_gloves', 4);

-- CreateTable
CREATE TABLE "fc_cloth_measure_mapping" (
    "id" SERIAL NOT NULL,
    "cloth_id" INTEGER,
    "measure_number" INTEGER,
    "measure_key" VARCHAR(100),

    CONSTRAINT "fc_cloth_measure_mapping_pkey" PRIMARY KEY ("id")
);

-- work_pants
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(1, 1, 'waist_circumference'),
(1, 2, 'inseam_length');

-- work_shirt
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(2, 1, 'chest_circumference'),
(2, 2, 'sleeve_length');

-- work_jacket
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(3, 1, 'chest_circumference'),
(3, 2, 'sleeve_length');

-- safety_jacket
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(4, 1, 'chest_circumference');

-- protective_gloves
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(5, 1, 'wrist_circumference'),
(5, 2, 'hand_length');

-- work_shoes
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(6, 1, 'foot_length'),
(6, 2, 'foot_width');

-- safety_boots
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(7, 1, 'foot_length'),
(7, 2, 'foot_width');

-- helmet
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(8, 1, 'head_circumference'),
(8, 2, 'head_height');

-- ear_protection
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(9, 1, 'head_width');

-- eye_protection
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(10, 1, 'head_width');

-- face_shield
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(11, 1, 'face_height');

-- respirator_mask
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(12, 1, 'face_length');

-- high_visibility_vest
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(13, 1, 'chest_circumference');

-- thermal_underwear
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(14, 1, 'waist_circumference');

-- raincoat
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(15, 1, 'chest_circumference'),
(15, 2, 'length');

-- apron
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(16, 1, 'length');

-- tool_belt
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(17, 1, 'waist_circumference');

-- coveralls
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(18, 1, 'chest_circumference'),
(18, 2, 'inseam_length');

-- lab_coat
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(19, 1, 'chest_circumference'),
(19, 2, 'sleeve_length');

-- knee_pads
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(20, 1, 'knee_circumference');

-- welding_jacket
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(21, 1, 'chest_circumference'),
(21, 2, 'sleeve_length');

-- welding_gloves
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(22, 1, 'wrist_circumference'),
(22, 2, 'hand_length');

-- fire_resistant_suit
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(23, 1, 'chest_circumference'),
(23, 2, 'inseam_length');

-- cut_resistant_gloves
INSERT INTO fc_cloth_measure_mapping (cloth_id, measure_number, measure_key) VALUES
(24, 1, 'wrist_circumference'),
(24, 2, 'hand_length');

-- CreateTable
CREATE TABLE "fc_cloth_measurement_value" (
    "id" SERIAL NOT NULL,
    "measurement_id" INTEGER NOT NULL,
    "measure_number" INTEGER NOT NULL,
    "measure_value" INTEGER,

    CONSTRAINT "fc_cloth_measurement_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_cloth_measurements" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "cloth_id" INTEGER NOT NULL,
    "calculated_size" VARCHAR(5),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fc_cloth_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_company_cloth" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "cloth_id" INTEGER NOT NULL,
    "is_active" BOOLEAN DEFAULT true,

    CONSTRAINT "fc_company_cloth_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fc_cloth_size_template" (
  "id" SERIAL NOT NULL,
  "cloth_id" INTEGER NOT NULL REFERENCES fc_cloth(id) ON DELETE CASCADE,
  "measure_mapping_id" INTEGER NOT NULL REFERENCES fc_cloth_measure_mapping(id) ON DELETE CASCADE,
  "size_label" VARCHAR(5) NOT NULL,
  "min_value" INTEGER NOT NULL,
  "max_value" INTEGER NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT "fc_cloth_size_template_pkey" PRIMARY KEY ("id")
);

INSERT INTO fc_cloth_size_template (cloth_id, measure_mapping_id, size_label, min_value, max_value, priority) VALUES
-- 1. work_pants (1=waist_circumference, 2=inseam_length)
(1,1,'S',78,82,1),(1,1,'M',83,87,1),(1,1,'L',88,92,1),(1,1,'XL',93,97,1),(1,1,'XXL',98,102,1),
(1,2,'S',78,81,2),(1,2,'M',82,85,2),(1,2,'L',86,89,2),(1,2,'XL',90,93,2),(1,2,'XXL',94,97,2),

-- 2. work_shirt (3=chest_circumference, 4=sleeve_length)
(2,3,'S',92,96,1),(2,3,'M',97,101,1),(2,3,'L',102,106,1),(2,3,'XL',107,111,1),(2,3,'XXL',112,116,1),
(2,4,'S',80,82,2),(2,4,'M',83,85,2),(2,4,'L',86,88,2),(2,4,'XL',89,91,2),(2,4,'XXL',92,94,2),

-- 3. work_jacket (5=chest_circumference,6=sleeve_length)
(3,5,'S',95,99,1),(3,5,'M',100,104,1),(3,5,'L',105,109,1),(3,5,'XL',110,114,1),(3,5,'XXL',115,119,1),
(3,6,'S',81,83,2),(3,6,'M',84,86,2),(3,6,'L',87,89,2),(3,6,'XL',90,92,2),(3,6,'XXL',93,95,2),

-- 4. safety_jacket (7=chest_circumference)
(4,7,'S',95,99,1),(4,7,'M',100,104,1),(4,7,'L',105,109,1),(4,7,'XL',110,114,1),(4,7,'XXL',115,119,1),

-- 5. protective_gloves (8=wrist_circumference,9=hand_length)
(5,8,'S',15,17,1),(5,8,'M',18,20,1),(5,8,'L',21,23,1),(5,8,'XL',24,26,1),(5,8,'XXL',27,29,1),
(5,9,'S',18,19,2),(5,9,'M',20,21,2),(5,9,'L',22,23,2),(5,9,'XL',24,25,2),(5,9,'XXL',26,27,2),

-- 6. work_shoes (10=foot_length,11=foot_width)
(6,10,'S',24,25,1),(6,10,'M',26,27,1),(6,10,'L',28,29,1),(6,10,'XL',30,31,1),(6,10,'XXL',32,33,1),
(6,11,'S',8,9,2),(6,11,'M',9.5,10.5,2),(6,11,'L',10.6,11.5,2),(6,11,'XL',11.6,12.5,2),(6,11,'XXL',12.6,13.5,2),

-- 7. safety_boots (12=foot_length,13=foot_width)
(7,12,'S',24,25,1),(7,12,'M',26,27,1),(7,12,'L',28,29,1),(7,12,'XL',30,31,1),(7,12,'XXL',32,33,1),
(7,13,'S',8,9,2),(7,13,'M',9.5,10.5,2),(7,13,'L',10.6,11.5,2),(7,13,'XL',11.6,12.5,2),(7,13,'XXL',12.6,13.5,2),

-- 8. helmet (14=head_circumference,15=head_height)
(8,14,'S',53,55,1),(8,14,'M',56,58,1),(8,14,'L',59,61,1),(8,14,'XL',62,64,1),(8,14,'XXL',65,67,1),
(8,15,'S',22,23,2),(8,15,'M',23,24,2),(8,15,'L',24,25,2),(8,15,'XL',25,26,2),(8,15,'XXL',26,27,2),

-- 9. ear_protection (16=head_width)
(9,16,'S',13,14,1),(9,16,'M',15,16,1),(9,16,'L',17,18,1),(9,16,'XL',19,20,1),(9,16,'XXL',21,22,1),

-- 10. eye_protection (17=head_width)
(10,17,'S',13,14,1),(10,17,'M',15,16,1),(10,17,'L',17,18,1),(10,17,'XL',19,20,1),(10,17,'XXL',21,22,1),

-- 11. face_shield (18=face_height)
(11,18,'S',17,18,1),(11,18,'M',19,20,1),(11,18,'L',21,22,1),(11,18,'XL',23,24,1),(11,18,'XXL',25,26,1),

-- 12. respirator_mask (19=face_length)
(12,19,'S',10,11,1),(12,19,'M',12,13,1),(12,19,'L',14,15,1),(12,19,'XL',16,17,1),(12,19,'XXL',18,19,1),

-- 13. high_visibility_vest (20=chest_circumference)
(13,20,'S',92,96,1),(13,20,'M',97,101,1),(13,20,'L',102,106,1),(13,20,'XL',107,111,1),(13,20,'XXL',112,116,1),

-- 14. thermal_underwear (21=waist_circumference)
(14,21,'S',78,82,1),(14,21,'M',83,87,1),(14,21,'L',88,92,1),(14,21,'XL',93,97,1),(14,21,'XXL',98,102,1),

-- 15. raincoat (22=chest_circumference,23=length)
(15,22,'S',95,99,1),(15,22,'M',100,104,1),(15,22,'L',105,109,1),(15,22,'XL',110,114,1),(15,22,'XXL',115,119,1),
(15,23,'S',80,82,2),(15,23,'M',83,85,2),(15,23,'L',86,88,2),(15,23,'XL',89,91,2),(15,23,'XXL',92,94,2),

-- 16. apron (24=length)
(16,24,'S',80,82,1),(16,24,'M',83,85,1),(16,24,'L',86,88,1),(16,24,'XL',89,91,1),(16,24,'XXL',92,94,1),

-- 17. tool_belt (25=waist_circumference)
(17,25,'S',78,82,1),(17,25,'M',83,87,1),(17,25,'L',88,92,1),(17,25,'XL',93,97,1),(17,25,'XXL',98,102,1),

-- 18. coveralls (26=chest_circumference,27=inseam_length)
(18,26,'S',92,96,1),(18,26,'M',97,101,1),(18,26,'L',102,106,1),(18,26,'XL',107,111,1),(18,26,'XXL',112,116,1),
(18,27,'S',78,81,2),(18,27,'M',82,85,2),(18,27,'L',86,89,2),(18,27,'XL',90,93,2),(18,27,'XXL',94,97,2),

-- 19. lab_coat (28=chest_circumference,29=sleeve_length)
(19,28,'S',92,96,1),(19,28,'M',97,101,1),(19,28,'L',102,106,1),(19,28,'XL',107,111,1),(19,28,'XXL',112,116,1),
(19,29,'S',80,82,2),(19,29,'M',83,85,2),(19,29,'L',86,88,2),(19,29,'XL',89,91,2),(19,29,'XXL',92,94,2),

-- 20. knee_pads (30=knee_circumference)
(20,30,'S',35,37,1),(20,30,'M',38,40,1),(20,30,'L',41,43,1),(20,30,'XL',44,46,1),(20,30,'XXL',47,49,1),

-- 21. welding_jacket (31=chest_circumference,32=sleeve_length)
(21,31,'S',95,99,1),(21,31,'M',100,104,1),(21,31,'L',105,109,1),(21,31,'XL',110,114,1),(21,31,'XXL',115,119,1),
(21,32,'S',81,83,2),(21,32,'M',84,86,2),(21,32,'L',87,89,2),(21,32,'XL',90,92,2),(21,32,'XXL',93,95,2),

-- 22. welding_gloves (33=wrist_circumference,34=hand_length)
(22,33,'S',15,17,1),(22,33,'M',18,20,1),(22,33,'L',21,23,1),(22,33,'XL',24,26,1),(22,33,'XXL',27,29,1),
(22,34,'S',18,19,2),(22,34,'M',20,21,2),(22,34,'L',22,23,2),(22,34,'XL',24,25,2),(22,34,'XXL',26,27,2),

-- 23. fire_resistant_suit (35=chest_circumference,36=inseam_length)
(23,35,'S',92,96,1),(23,35,'M',97,101,1),(23,35,'L',102,106,1),(23,35,'XL',107,111,1),(23,35,'XXL',112,116,1),
(23,36,'S',78,81,2),(23,36,'M',82,85,2),(23,36,'L',86,89,2),(23,36,'XL',90,93,2),(23,36,'XXL',94,97,2),

-- 24. cut_resistant_gloves (37=wrist_circumference,38=hand_length)
(24,37,'S',15,17,1),(24,37,'M',18,20,1),(24,37,'L',21,23,1),(24,37,'XL',24,26,1),(24,37,'XXL',27,29,1),
(24,38,'S',18,19,2),(24,38,'M',20,21,2),(24,38,'L',22,23,2),(24,38,'XL',24,25,2),(24,38,'XXL',26,27,2);

-- CreateIndex
CREATE UNIQUE INDEX "unique_email" ON "fc_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fc_cloth_description_key" ON "fc_cloth"("description");

-- CreateIndex
CREATE UNIQUE INDEX "fc_cloth_category_description_key" ON "fc_cloth_category"("description");

-- CreateIndex
CREATE UNIQUE INDEX "fc_company_cloth_company_id_cloth_id_key" ON "fc_company_cloth"("company_id", "cloth_id");

-- AddForeignKey
ALTER TABLE "fc_user" ADD CONSTRAINT "fc_user_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "fc_company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fc_user" ADD CONSTRAINT "fc_user_user_type_fkey" FOREIGN KEY ("user_type") REFERENCES "fc_user_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fc_cloth" ADD CONSTRAINT "fc_cloth_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "fc_cloth_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fc_cloth_measure_mapping" ADD CONSTRAINT "fc_cloth_measure_mapping_cloth_id_fkey" FOREIGN KEY ("cloth_id") REFERENCES "fc_cloth"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fc_cloth_measurement_value" ADD CONSTRAINT "fc_cloth_measurement_value_measurement_id_fkey" FOREIGN KEY ("measurement_id") REFERENCES "fc_cloth_measurements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fc_cloth_measurements" ADD CONSTRAINT "fc_cloth_measurements_cloth_id_fkey" FOREIGN KEY ("cloth_id") REFERENCES "fc_cloth"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fc_cloth_measurements" ADD CONSTRAINT "fc_cloth_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "fc_user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fc_company_cloth" ADD CONSTRAINT "fc_company_cloth_cloth_id_fkey" FOREIGN KEY ("cloth_id") REFERENCES "fc_cloth"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fc_company_cloth" ADD CONSTRAINT "fc_company_cloth_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "fc_company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
