import {
  LicenseSettings,
  getLicenseSettingsByType,
  toLicenseTerms,
  determineLicenseTypeByGroup,
} from "@/lib/license/settings";
import { LicenseTerms } from "@story-protocol/core-sdk";

export const GROUPS = {
  SELFIE_REQUIRED: [5, 10],
  SUBMIT_REVIEW: [2, 3, 7, 8, 13, 15],
  DIRECT_REGISTER_FIXED_AI: [1, 4, 12, 16],
  DIRECT_REGISTER_MANUAL_AI: [6, 9, 11, 14],
};

export function getLicenseSettingsByGroup(
  group: number,
  aiTrainingManual?: boolean,
  mintingFee?: number,
  revShare?: number,
): LicenseSettings | null {
  if (
    GROUPS.DIRECT_REGISTER_FIXED_AI.includes(group) ||
    GROUPS.DIRECT_REGISTER_MANUAL_AI.includes(group)
  ) {
    const licenseType = determineLicenseTypeByGroup(group);

    // Force aiLearning to false for all AI-generated groups
    // to prevent AI models from being trained on AI-generated content
    const shouldDisableAiLearning = isAiGeneratedGroup(group);
    const aiLearningValue = shouldDisableAiLearning
      ? false
      : GROUPS.DIRECT_REGISTER_MANUAL_AI.includes(group)
        ? (aiTrainingManual ?? true)
        : false;

    return getLicenseSettingsByType(
      licenseType,
      aiLearningValue,
      mintingFee,
      revShare,
    );
  }
  return null;
}

// Langsung dapatkan LicenseTerms on-chain dari grup
export function getLicenseTermsByGroup(
  group: number,
  aiTrainingManual?: boolean,
  mintingFee?: number,
  revShare?: number,
): LicenseTerms | null {
  const settings = getLicenseSettingsByGroup(
    group,
    aiTrainingManual,
    mintingFee,
    revShare,
  );
  return settings ? toLicenseTerms(settings) : null;
}

export const requiresSelfieVerification = (group: number) =>
  GROUPS.SELFIE_REQUIRED.includes(group);
export const requiresSubmitReview = (group: number) =>
  GROUPS.SUBMIT_REVIEW.includes(group);
export const isAiGeneratedGroup = (group: number) =>
  [1, 2, 3, 4, 5, 6, 12, 13].includes(group);
export const canDirectRegister = (group: number) =>
  GROUPS.DIRECT_REGISTER_FIXED_AI.includes(group) ||
  GROUPS.DIRECT_REGISTER_MANUAL_AI.includes(group);
