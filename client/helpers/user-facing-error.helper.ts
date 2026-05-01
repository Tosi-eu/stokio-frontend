/**
 * Sanitiza mensagens de erro vindas da API ou de exceções para não expor
 * detalhes técnicos (infra, stack, credenciais). Detalhes completos devem ser
 * registados com `logClientError` / `logSanitizedError`.
 */
/** Mensagem quando o sistema substitui detalhe técnico (tom neutro, produto Abrigo/Stokio). */
const GENERIC_ERROR_PT =
  "Não foi possível concluir esta ação. Tente de novo em instantes.";

/**
 * Texto curto para descrições de toast quando o título já diz qual foi a ação.
 * Alinhado ao mesmo tom da mensagem genérica completa.
 */
export const USER_FACING_RETRY_SHORT = "Tente de novo em instantes.";

export function logClientError(context: string, err: unknown): void {
  console.error(`[${context}]`, err);
}

function shouldLogSanitization(raw: string, result: string): boolean {
  return (
    raw.trim().length > 0 &&
    result === GENERIC_ERROR_PT &&
    raw.trim() !== result
  );
}

/** Se a mensagem for simplificada, regista o erro original para suporte. */
export function logSanitizedError(
  context: string,
  err: unknown,
  rawMessage: string,
  sanitized: string,
): void {
  if (shouldLogSanitization(rawMessage, sanitized)) {
    console.error(
      `[${context}] Erro interno (mensagem simplificada para o utilizador)`,
      err,
    );
  }
}

export function sanitizeUserFacingMessage(message: string): string {
  if (!message || typeof message !== "string") {
    return GENERIC_ERROR_PT;
  }

  const safeBusinessMessages = [
    /já existe.*medicamento/i,
    /já existe.*insumo/i,
    /combinação.*nome.*princípio/i,
    /campos obrigatórios/i,
    /quantidade.*inválida/i,
    /casela.*obrigatória/i,
    /usuário não autenticado/i,
    /não encontrado/i,
    /credenciais inválidas/i,
    /token inválido/i,
    /e-mail.*já.*regist/i,
    /não tem os privilégios necessários/i,
    /privilégios necessários/i,
    /não autorizado a/i,
    /permiss(ão|ões)/i,
    /sessão inválida/i,
  ];

  if (safeBusinessMessages.some((pattern) => pattern.test(message))) {
    return message.trim();
  }

  const sensitivePatterns = [
    /database/i,
    /\bsql\b/i,
    /query/i,
    /connection/i,
    /postgres/i,
    /mysql/i,
    /mongodb/i,
    /sequelize/i,
    /prisma/i,
    /\borm\b/i,
    /password/i,
    /\btoken\b/i,
    /secret/i,
    /api[_-]?key/i,
    /credential/i,
    /bearer/i,
    /\bjwt\b/i,
    /\bsession\b/i,
    /file[_-]?path/i,
    /directory/i,
    /\.env/i,
    /\bconfig\b/i,
    /stack[_-]?trace/i,
    /error[_-]?code/i,
    /exception/i,
    /at\s+\w+\.\w+/i,
    /line\s+\d+/i,
    /column\s+\d+/i,
    /\bhost\b/i,
    /\bport\b/i,
    /endpoint/i,
    /\burl\b/i,
    /\buri\b/i,
    /process\.env/i,
    /environment/i,
    /\bos\b/i,
    /platform/i,
    /\br2\b/i,
    /cloudflare/i,
    /amazon\s*s3/i,
    /\bs3\b/i,
    /object\s+storage/i,
    /\bbucket\b/i,
    /cloud\s*storage/i,
    /temporal/i,
    /grpc/i,
    /worker(\b|_)/i,
    /redis/i,
    /nginx/i,
    /\b(502|503|504)\b/,
  ];

  if (sensitivePatterns.some((pattern) => pattern.test(message))) {
    return GENERIC_ERROR_PT;
  }

  const cleanedMessage = message
    .split("\n")[0]
    .replace(/at\s+.*/gi, "")
    .replace(/\(.*\)/g, "")
    .trim();

  const maxLength = 150;
  if (cleanedMessage.length > maxLength) {
    return cleanedMessage.substring(0, maxLength) + "...";
  }

  if (cleanedMessage.length < 3) {
    return GENERIC_ERROR_PT;
  }

  return cleanedMessage;
}

export function getGenericUserErrorMessage(): string {
  return GENERIC_ERROR_PT;
}
