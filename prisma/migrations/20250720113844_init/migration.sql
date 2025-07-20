-- CreateTable
CREATE TABLE "fc_company" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(200) NOT NULL,

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

-- CreateTable
CREATE TABLE "fc_cloth" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER,
    "description" VARCHAR(100) NOT NULL,

    CONSTRAINT "fc_cloth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_cloth_category" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(100) NOT NULL,

    CONSTRAINT "fc_cloth_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_cloth_measure_mapping" (
    "id" SERIAL NOT NULL,
    "cloth_id" INTEGER,
    "measure_number" INTEGER,
    "measure_key" VARCHAR(100),

    CONSTRAINT "fc_cloth_measure_mapping_pkey" PRIMARY KEY ("id")
);

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
