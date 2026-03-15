import { VALIDATION_LIMITS } from "@/constants/app.constants";

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

export function validateEmail(email: string): {
  valid: boolean;
  error?: string;
} {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "E-mail é obrigatório" };
  }

  const sanitized = sanitizeInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    return { valid: false, error: "E-mail inválido" };
  }

  if (sanitized.length > 255) {
    return {
      valid: false,
      error: "E-mail muito longo (máximo 255 caracteres)",
    };
  }

  return { valid: true };
}

export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
  strength?: "weak" | "medium" | "strong";
} {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Senha é obrigatória" };
  }

  if (password.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: "Senha deve ter no mínimo 8 caracteres",
    };
  }

  if (password.length > VALIDATION_LIMITS.PASSWORD_MAX_LENGTH) {
    return {
      valid: false,
      error: "Senha muito longa (máximo 128 caracteres)",
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const missingRequirements: string[] = [];
  if (!hasUpperCase) missingRequirements.push("letra maiúscula");
  if (!hasLowerCase) missingRequirements.push("letra minúscula");
  if (!hasNumbers) missingRequirements.push("número");
  if (!hasSpecialChar) missingRequirements.push("caractere especial");

  if (missingRequirements.length > 0) {
    return {
      valid: false,
      error: `Senha deve conter: ${missingRequirements.join(", ")}`,
    };
  }

  let strength: "weak" | "medium" | "strong" = "weak";
  if (password.length >= 12) {
    strength = "strong";
  } else if (password.length >= 10) {
    strength = "medium";
  }

  return { valid: true, strength };
}

export function validateTextInput(
  input: string,
  options: {
    minLength?: number;
    maxLength: number;
    required?: boolean;
    fieldName?: string;
  },
): { valid: boolean; error?: string; sanitized?: string } {
  const {
    minLength = 0,
    maxLength,
    required = false,
    fieldName = "Campo",
  } = options;

  if (maxLength > VALIDATION_LIMITS.TEXT_MAX_LENGTH) {
    return {
      valid: false,
      error: `${fieldName} deve ter no máximo ${VALIDATION_LIMITS.TEXT_MAX_LENGTH} caracteres`,
    };
  }

  if (required && (!input || input.trim().length === 0)) {
    return { valid: false, error: `${fieldName} é obrigatório` };
  }

  if (!input) {
    return { valid: true, sanitized: "" };
  }

  const sanitized = sanitizeInput(input);

  if (sanitized.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} deve ter no mínimo ${minLength} caracteres`,
    };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} deve ter no máximo ${maxLength} caracteres`,
    };
  }

  return { valid: true, sanitized };
}

export function validateNumberInput(
  input: string | number,
  options: {
    min?: number;
    max?: number;
    required?: boolean;
    fieldName?: string;
  },
): { valid: boolean; error?: string; value?: number } {
  const { min, max, required = false, fieldName = "Campo" } = options;

  if (required && (input === null || input === undefined || input === "")) {
    return { valid: false, error: `${fieldName} é obrigatório` };
  }

  if (input === null || input === undefined || input === "") {
    return { valid: true, value: undefined };
  }

  const numValue = typeof input === "number" ? input : Number(input);

  if (isNaN(numValue)) {
    return { valid: false, error: `${fieldName} deve ser um número válido` };
  }

  if (min !== undefined && numValue < min) {
    return { valid: false, error: `${fieldName} deve ser no mínimo ${min}` };
  }

  if (min !== undefined && min >= 1 && numValue === 0) {
    return { valid: false, error: `${fieldName} deve ser maior que zero` };
  }

  if (max !== undefined && numValue > max) {
    return { valid: false, error: `${fieldName} deve ser no máximo ${max}` };
  }

  return { valid: true, value: numValue };
}

export function getErrorMessage(
  error: unknown,
  defaultMessage = "Ocorreu um erro inesperado",
): string {
  if (error instanceof Error && error.name === "InvalidSessionError") {
    return "";
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return defaultMessage;
}
