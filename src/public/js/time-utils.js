(() => {
  const DEFAULT_TRACK_DURATION_MS = 3 * 60 * 1000;

  function getDurationMs(value, fallbackMs = DEFAULT_TRACK_DURATION_MS) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackMs;
  }

  function formatMinutes(totalMinutes) {
    const minutes = Math.max(0, Math.floor(totalMinutes));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
  }

  function estimateQueueWaitMinutes(queue, index, fallbackMs = DEFAULT_TRACK_DURATION_MS) {
    if (!Array.isArray(queue) || index <= 0) return 1;

    const totalMs = queue
      .slice(0, index)
      .reduce((sum, item) => sum + getDurationMs(item?.duration_ms, fallbackMs), 0);

    return Math.max(1, Math.ceil(totalMs / 60000));
  }

  window.TimeUtils = {
    DEFAULT_TRACK_DURATION_MS,
    getDurationMs,
    formatMinutes,
    estimateQueueWaitMinutes,
  };
})();
