export function timeAgo(dateInput: string, tx: any): string {
  const now = Date.now();
  const then = new Date(dateInput).getTime();

  if (!Number.isFinite(then)) {
    return tx('pages.jobDetail.timeAgo.justNow');
  }

  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return tx('pages.jobDetail.timeAgo.justNow');

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return tx('pages.jobDetail.timeAgo.minute', { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return tx('pages.jobDetail.timeAgo.hour', { count: hours });

  const days = Math.floor(hours / 24);
  if (days < 7) return tx('pages.jobDetail.timeAgo.day', { count: days });

  const weeks = Math.floor(days / 7);
  return tx('pages.jobDetail.timeAgo.week', { count: weeks });
}
