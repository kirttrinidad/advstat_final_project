type SafeDatabaseDiagnostic = {
  errorClass: string;
  errorCode: string;
  sanitizedMessage: string;
};

function readProperty(value: object, property: string): unknown {
  try {
    return Reflect.get(value, property);
  } catch {
    return undefined;
  }
}

function getErrorClass(value: object): string {
  const constructor = readProperty(value, "constructor");
  const name = typeof constructor === "function" ? readProperty(constructor, "name") : undefined;
  return typeof name === "string" && /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) ? name : "Error";
}

function isErrorCode(value: string): boolean {
  return /^(P\d{4}|[A-Z0-9]{5}|ECONN[A-Z]+|EAI_AGAIN|ENOTFOUND|ETIMEDOUT|ERR_[A-Z0-9_]+)$/.test(value);
}

export function getSafeDatabaseDiagnostic(error: unknown): SafeDatabaseDiagnostic {
  const pending: object[] = [];
  if ((typeof error === "object" && error !== null) || typeof error === "function") {
    pending.push(error as object);
  }

  const seen = new Set<object>();
  const messages: string[] = [];
  const codes: string[] = [];
  let errorClass = "Error";
  let foundErrorClass = false;

  for (let depth = 0; pending.length > 0 && depth < 6; depth += 1) {
    const current = pending.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    const currentErrorClass = getErrorClass(current);
    if (!foundErrorClass || currentErrorClass === "ErrorEvent") {
      errorClass = currentErrorClass;
      foundErrorClass = true;
    }

    for (const property of ["message", "originalMessage"]) {
      const value = readProperty(current, property);
      if (typeof value === "string") messages.push(value.toLowerCase());
    }
    for (const property of ["code", "originalCode"]) {
      const value = readProperty(current, property);
      if (typeof value === "string" && isErrorCode(value)) codes.push(value);
    }
    for (const property of ["error", "cause"]) {
      const value = readProperty(current, property);
      if ((typeof value === "object" && value !== null) || typeof value === "function") {
        pending.push(value as object);
      } else if (typeof value === "string") {
        messages.push(value.toLowerCase());
      }
    }
  }

  const errorCode = codes.find((code) => code.startsWith("P")) ?? codes[0] ?? "none";
  const message = messages.join(" ");

  let sanitizedMessage = "Unclassified database failure; raw message omitted.";
  if (errorCode === "P2021" || errorCode === "42P01") {
    sanitizedMessage = "A required database table is missing; migrations may not be applied.";
  } else if (errorCode === "P2022" || errorCode === "42703") {
    sanitizedMessage = "A required database column is missing; schema may be out of date.";
  } else if (errorCode === "P1000" || errorCode === "28P01" || /authentication failed|password authentication failed/.test(message)) {
    sanitizedMessage = "Database authentication failed.";
  } else if (errorCode === "P1001" || /^(ECONN|EAI_AGAIN|ENOTFOUND|ETIMEDOUT)/.test(errorCode) || /ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|timed out|could not connect|connection timeout/.test(message)) {
    sanitizedMessage = "The database host could not be reached or the connection timed out.";
  } else if (errorCode === "P1002") {
    sanitizedMessage = "The database connection timed out.";
  } else if (errorCode === "P1013" || /invalid connection string/.test(message)) {
    sanitizedMessage = "The database connection string is invalid.";
  } else if (errorCode === "P1011" || /ssl|tls/.test(message)) {
    sanitizedMessage = "The database TLS connection failed.";
  } else if (errorClass === "ErrorEvent" || /websocket/.test(message)) {
    sanitizedMessage = "The Neon WebSocket transport reported an error; the underlying reason was not classified.";
  }

  return { errorClass, errorCode, sanitizedMessage };
}
