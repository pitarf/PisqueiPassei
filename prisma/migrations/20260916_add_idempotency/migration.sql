-- Add stable request keys so retries cannot create duplicate attempts or simulations.
ALTER TABLE "QuestionAttempt" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "QuestionAttempt_idempotencyKey_key" ON "QuestionAttempt"("idempotencyKey");

ALTER TABLE "Simulation" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Simulation_idempotencyKey_key" ON "Simulation"("idempotencyKey");
