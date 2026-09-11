import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LessonViewer } from "@/components/lessons/LessonViewer";

interface LessonPageProps {
  params: Promise<{
    topicId: string;
  }>;
}

export const revalidate = 0;

export default async function LessonPage({ params }: LessonPageProps) {
  const { topicId } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subject: true,
      lessons: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!topic) {
    notFound();
  }

  const initialLesson = topic.lessons[0] || null;

  return (
    <LessonViewer
      topic={{
        id: topic.id,
        code: topic.code,
        title: topic.title,
        subject: { name: topic.subject.name },
        officialSource: topic.officialSource,
      }}
      initialLesson={initialLesson}
    />
  );
}
