export const SIGNUP_CONTRACT_VERIFIED_SESSION_KEY =
  "stokio.signupContractVerified";

export type SignupContractVerifiedPayload = {
  code: string;
  email: string;
  verifiedAt: number;
};

let verifiedPayload: SignupContractVerifiedPayload | null = null;

export function readSignupContractVerified(): SignupContractVerifiedPayload | null {
  return verifiedPayload;
}

export function writeSignupContractVerified(
  payload: SignupContractVerifiedPayload | null,
): void {
  verifiedPayload = payload;
}

export function clearSignupContractVerified(): void {
  verifiedPayload = null;
}
