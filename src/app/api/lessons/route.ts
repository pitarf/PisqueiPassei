import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateStructuredLesson } from "@/lib/gemini";

/**
 * Endpoint para obter ou gerar aula estruturada com cache inteligente
 */
export async function POST(req: NextRequest) {
  try {
    const { topicId, forceRegenerate = false } = await req.json();

    if (!topicId) {
      return NextResponse.json(
        { error: "O campo 'topicId' é obrigatório." },
        { status: 400 }
      );
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: true, lessons: true },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Tópico não encontrado no edital." },
        { status: 404 }
      );
    }

    // 1. Verificar se já existe aula em cache no banco (Economia e velocidade)
    if (!forceRegenerate && topic.lessons.length > 0) {
      const cachedLesson = topic.lessons[0];
      return NextResponse.json({
        cached: true,
        lesson: cachedLesson,
      });
    }

    // 2. Gerar aula estruturada via IA
    const lessonData = await generateStructuredLesson(
      topic.title,
      topic.subject.name,
      topic.officialSource
    );

    // 3. Persistir aula e criar flashcards/questões no banco
    const savedLesson = await prisma.$transaction(async (tx) => {
      // Criar registro da aula
      const newLesson = await tx.lesson.create({
        data: {
          topicId: topic.id,
          title: lessonData.title || topic.title,
          contentJson: lessonData.sections,
          rawMarkdown: JSON.stringify(lessonData.sections),
          sourceType: "AI_GENERATED",
        },
      });

      // Salvar flashcards gerados
      if (lessonData.sections?.step8_flashcards) {
        for (const card of lessonData.sections.step8_flashcards) {
          if (card.front && card.back) {
            await tx.flashcard.create({
              data: {
                topicId: topic.id,
                front: card.front,
                back: card.back,
              },
            });
          }
        }
      }

      // Salvar questões de fixação geradas no banco de questões
      if (lessonData.sections?.step9_practiceQuestions) {
        for (const q of lessonData.sections.step9_practiceQuestions) {
          if (q.statement && q.correctOption) {
            await tx.question.create({
              data: {
                topicId: topic.id,
                statement: q.statement,
                optionA: q.optionA || "Opção A",
                optionB: q.optionB || "Opção B",
                optionC: q.optionC || "Opção C",
                optionD: q.optionD || "Opção D",
                optionE: q.optionE || "Opção E",
                correctOption: q.correctOption,
                explanation: q.explanation || "Gabarito fundamentado.",
                difficulty: "MEDIA",
                origin: "AI_GENERATED",
                banca: "Cesgranrio",
              },
            });
          }
        }
      }

      return newLesson;
    });

    return NextResponse.json({
      cached: false,
      lesson: savedLesson,
    });
  } catch (error) {
    console.error("Erro na geração ou busca de aula:", error);
    return NextResponse.json(
      { error: "Falha ao gerar aula didática com IA. Verifique sua chave de API." },
      { status: 500 }
    );
  }
}
