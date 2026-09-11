import React from "react";
import { ProfessorChat } from "@/components/ai/ProfessorChat";

interface ProfessorPageProps {
  searchParams: Promise<{
    pergunta?: string;
  }>;
}

export const revalidate = 0;

export default async function ProfessorPage({ searchParams }: ProfessorPageProps) {
  const { pergunta } = await searchParams;

  return <ProfessorChat initialQuestion={pergunta || ""} />;
}
