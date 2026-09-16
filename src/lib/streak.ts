import { Prisma } from "@prisma/client";

const TIME_ZONE = "America/Sao_Paulo";

type UserForStreak = { currentStreak: number; lastStudyDate: Date | null };

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function daysBetweenLocalDates(previous: Date, current: Date) {
  const previousKey = localDateKey(previous);
  const currentKey = localDateKey(current);
  const previousUtc = new Date(`${previousKey}T00:00:00Z`).getTime();
  const currentUtc = new Date(`${currentKey}T00:00:00Z`).getTime();
  return Math.round((currentUtc - previousUtc) / 86_400_000);
}

export async function updateStudyStreak(tx: Prisma.TransactionClient, userId: string, now: Date) {
  const user = await tx.user.findUnique({ where: { id: userId }, select: { currentStreak: true, lastStudyDate: true } }) as UserForStreak | null;
  if (!user) return 0;

  if (user.lastStudyDate) {
    const days = daysBetweenLocalDates(user.lastStudyDate, now);
    if (days === 0) return user.currentStreak;
    if (days === 1) {
      const streak = user.currentStreak + 1;
      await tx.user.update({ where: { id: userId }, data: { currentStreak: streak } });
      return streak;
    }
  }

  await tx.user.update({ where: { id: userId }, data: { currentStreak: 1 } });
  return 1;
}
