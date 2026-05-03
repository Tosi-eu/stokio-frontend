export const SIGNUP_CONTRACT_VERIFIED_SESSION_KEY =
  "stokio.signupContractVerified";

export type SignupContractVerifiedPayload = {
  code: string;
  email: string;
  verifiedAt: number;
};
