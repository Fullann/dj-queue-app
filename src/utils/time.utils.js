function formatRemainingDelay(remainingMs) {
  const totalSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds}s`;
}

function msToMinutesCeil(ms) {
  return Math.max(1, Math.ceil(Math.max(0, ms) / 60000));
}

module.exports = {
  formatRemainingDelay,
  msToMinutesCeil,
};
