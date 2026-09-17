import React from "react";
import { prisma } from "@/lib/prisma";
import { EditalVerticalizadoClient } from "./EditalVerticalizadoClient";

export const revalidate = 0;

export default async function EditalPage() {
  const user = await prisma.user.findFirst({
    where: { email: "rafael@estudos.transpetro" },
  });

  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: {
          userProgress: {
            where: { userId: user?.id },
          },
          lessons: {
            select: { id: true },
          },
          _count: {
            select: { questions: true, flashcards: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const totalTopics = subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const studiedTopicsCount = subjects.reduce(
    (acc, s) =>
      acc +
      s.topics.filter(
        (t) =>
          t.userProgress[0] && t.userProgress[0].status !== "NAO_INICIADO"
      ).length,
    0
  );

  return (
    <EditalVerticalizadoClient
      subjects={subjects}
      totalTopics={totalTopics}
      studiedTopicsCount={studiedTopicsCount}
    />
  );
}
