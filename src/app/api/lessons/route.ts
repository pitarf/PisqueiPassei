import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStructuredLesson } from "@/lib/gemini";

const OPTIONS = new Set(["A", "B", "C", "D", "E"]);
const REQUIRED_SECTIONS = ["step1_whatYouNeedToLearn", "step2_simpleExplanation", "step3_fundamentalConcepts", "step4_examples", "step5_cesgranrioTraps", "step6_whatToMemorize", "step7_summary", "step8_flashcards", "step9_practiceQuestions"];
const GENERATION_WINDOW_MS = 30_000;

function isNonEmptyString(value: unknown) { return typeof value === "string" && value.trim().length > 0; }
function validateLesson(data: any) {
  if (!data || typeof data !== "object" || !isNonEmptyString(data.title) || !data.sections || typeof data.sections !== "object") throw new Error("A IA retornou uma aula em formato inválido.");
  for (const key of REQUIRED_SECTIONS) if (data.sections[key] === undefined || data.sections[key] === null) throw new Error(`A aula gerada não contém a seção obrigatória: ${key}.`);
  const flashcards = Array.isArray(data.sections.step8_flashcards) ? data.sections.step8_flashcards : [];
  for (const card of flashcards) if (!isNonEmptyString(card?.front) || !isNonEmptyString(card?.back)) throw new Error("A aula contém flashcard inválido.");
  const questions = Array.isArray(data.sections.step9_practiceQuestions) ? data.sections.step9_practiceQuestions : [];
  const seenStatements = new Set<string>();
  for (const question of questions) {
    const options = ["optionA", "optionB", "optionC", "optionD", "optionE"];
    if (!isNonEmptyString(question?.statement) || !isNonEmptyString(question?.explanation)) throw new Error("A aula contém questão de fixação inválida.");
    if (!options.every((key) => isNonEmptyString(question?.[key])) || !OPTIONS.has(question?.correctOption)) throw new Error("Aula contém questão sem alternativas A-E válidas.");
    const normalized = question.statement.trim().toLocaleLowerCase().replace(/\s+/g, " ");
    if (seenStatements.has(normalized)) throw new Error("A aula contém questões de fixação duplicadas.");
    seenStatements.add(normalized);
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { topicId, forceRegenerate = false } = await req.json();
    if (typeof topicId !== "string" || !topicId.trim()) return NextResponse.json({ error: "O campo 'topicId' é obrigatório." }, { status: 400 });
    if (typeof forceRegenerate !== "boolean") return NextResponse.json({ error: "Parâmetro forceRegenerate inválido." }, { status: 400 });

    const topic = await prisma.topic.findUnique({ where: { id: topicId }, include: { subject: true, lessons: { orderBy: { createdAt: "desc" } } } });
    if (!topic) return NextResponse.json({ error: "Tópico não encontrado no edital." }, { status: 404 });
    if (!forceRegenerate && topic.lessons.length > 0) return NextResponse.json({ cached: true, lesson: topic.lessons[0] });

    // Mesmo com regeneração solicitada, evita duas chamadas simultâneas do mesmo tópico.
    const recentLesson = topic.lessons.find((lesson) => lesson.createdAt.getTime() >= Date.now() - GENERATION_WINDOW_MS);
    if (recentLesson) return NextResponse.json({ cached: true, lesson: recentLesson, generationSkipped: true });

    const lessonData = validateLesson(await generateStructuredLesson(topic.title, topic.subject.name, topic.officialSource));
    const savedLesson = await prisma.$transaction(async (tx) => {
      const newLesson = await tx.lesson.create({ data: { topicId: topic.id, title: lessonData.title.trim() || topic.title, contentJson: lessonData.sections, rawMarkdown: JSON.stringify(lessonData.sections), sourceType: "AI_GENERATED" } });
      const flashcards = Array.isArray(lessonData.sections.step8_flashcards) ? lessonData.sections.step8_flashcards : [];
      const existingCards = await tx.flashcard.findMany({ where: { topicId: topic.id }, select: { front: true } });
      const cardKeys = new Set(existingCards.map((card) => card.front.trim().toLocaleLowerCase().replace(/\s+/g, " ")));
      for (const card of flashcards) {
        const front = card.front.trim();
        const key = front.toLocaleLowerCase().replace(/\s+/g, " ");
        if (!cardKeys.has(key)) { await tx.flashcard.create({ data: { topicId: topic.id, front, back: card.back.trim() } }); cardKeys.add(key); }
      }
      const practiceQuestions = Array.isArray(lessonData.sections.step9_practiceQuestions) ? lessonData.sections.step9_practiceQuestions : [];
      const existingQuestions = await tx.question.findMany({ where: { topicId: topic.id }, select: { statement: true } });
      const questionKeys = new Set(existingQuestions.map((q) => q.statement.trim().toLocaleLowerCase().replace(/\s+/g, " ")));
      for (const q of practiceQuestions) {
        const statement = q.statement.trim();
        const key = statement.toLocaleLowerCase().replace(/\s+/g, " ");
        if (questionKeys.has(key)) continue;
        await tx.question.create({ data: { topicId: topic.id, statement, optionA: q.optionA.trim(), optionB: q.optionB.trim(), optionC: q.optionC.trim(), optionD: q.optionD.trim(), optionE: q.optionE.trim(), correctOption: q.correctOption, explanation: q.explanation.trim(), difficulty: "MEDIA", origin: "AI_GENERATED", banca: "IA (perfil Cesgranrio)", sourceRef: "Questão inédita gerada por IA com RAG local" } });
        questionKeys.add(key);
      }
      return newLesson;
    });
    return NextResponse.json({ cached: false, lesson: savedLesson });
  } catch (error) {
    console.error("Erro na geração ou busca de aula:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao gerar aula didática com IA." }, { status: 500 });
  }
}
