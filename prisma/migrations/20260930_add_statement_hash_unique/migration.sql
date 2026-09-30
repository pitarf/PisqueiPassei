-- 1. Garante coluna statementHash caso ainda não exista
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "statementHash" TEXT NOT NULL DEFAULT '';

-- 2. Detecta e remove duplicatas de (topicId, statementHash) mantendo o registro mais antigo (menor id / menor createdAt)
-- Se houver tentativas ou relações atreladas às duplicatas, redireciona para a questão mantida antes da remoção
DO $$
DECLARE
    r RECORD;
    keeper_id TEXT;
BEGIN
    FOR r IN
        SELECT "topicId", "statementHash"
        FROM "Question"
        WHERE "statementHash" <> ''
        GROUP BY "topicId", "statementHash"
        HAVING COUNT(*) > 1
    LOOP
        -- Identifica o registro guardião (menor createdAt, desempatando pelo menor id)
        SELECT "id" INTO keeper_id
        FROM "Question"
        WHERE "topicId" = r."topicId" AND "statementHash" = r."statementHash"
        ORDER BY "createdAt" ASC, "id" ASC
        LIMIT 1;

        RAISE NOTICE 'Resolvendo duplicata para topicId=%, statementHash=%. Registro mantido: %', r."topicId", r."statementHash", keeper_id;

        -- Reassocia QuestionAttempt das duplicatas para o keeper_id
        UPDATE "QuestionAttempt"
        SET "questionId" = keeper_id
        WHERE "questionId" IN (
            SELECT "id" FROM "Question"
            WHERE "topicId" = r."topicId" 
              AND "statementHash" = r."statementHash" 
              AND "id" <> keeper_id
        );

        -- Exclui as duplicatas excedentes
        DELETE FROM "Question"
        WHERE "topicId" = r."topicId"
          AND "statementHash" = r."statementHash"
          AND "id" <> keeper_id;
    END LOOP;
END $$;

-- 3. Cria índice único @@unique([topicId, statementHash]) se ainda não existir
CREATE UNIQUE INDEX IF NOT EXISTS "Question_topicId_statementHash_key" ON "Question"("topicId", "statementHash");
