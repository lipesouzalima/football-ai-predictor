const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

function parseDate(date: Date | string) {
  return typeof date === "string" ? new Date(date) : date;
}

export function getBrazilDateParts(date: Date | string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(parseDate(date));
}

export function getTodayInBrazil() {
  return getBrazilDateParts(new Date());
}

export function formatKickoffInBrazil(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseDate(date));
}

export function formatMatchDateInBrazil(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
    .format(parseDate(date))
    .replace(".", "");
}

export function formatBrazilDateLong(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parseDate(date));
}

export function normalizeDateToBrazilIso(input: string) {
  const trimmed = input.trim();

  // If the string already has a timezone offset (Z or +/-HH:mm),
  // it's a valid ISO that we can just normalize.
  if (/Z$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return new Date(trimmed).toISOString();
  }

  // If it's a "local" time string without offset, we assume it's in Brazil Time.
  // We can't rely on `new Date(string)` without offset because Node assumes UTC
  // or local environment time. We will force the Brazil offset (-03:00) 
  // since this is just for normalizing scraped/API data.
  const parsed = new Date(trimmed + "-03:00");
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return trimmed;
}

export { BRAZIL_TIME_ZONE };
