const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

function toBrazilDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Date(value.toLocaleString("en-US", { timeZone: BRAZIL_TIME_ZONE }));
}

export function getBrazilDateParts(date: Date | string) {
  const value = toBrazilDate(date);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(value);
}

export function getTodayInBrazil() {
  return getBrazilDateParts(new Date());
}

export function formatKickoffInBrazil(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(toBrazilDate(date));
}

export function formatMatchDateInBrazil(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(toBrazilDate(date))
    .replace(".", "");
}

export function formatBrazilDateLong(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(toBrazilDate(date));
}

export function normalizeDateToBrazilIso(input: string) {
  const trimmed = input.trim();

  if (/Z$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return new Date(trimmed).toISOString();
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const normalized = new Date(parsed.toLocaleString("en-US", { timeZone: BRAZIL_TIME_ZONE }));
    return normalized.toISOString();
  }

  return trimmed;
}

export { BRAZIL_TIME_ZONE };
