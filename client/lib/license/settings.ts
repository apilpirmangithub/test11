import { LicenseTerms, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
import { zeroAddress, parseEther } from "viem";

// Type definitions
export type LicenseSettings = {
  pilType:
    | "non_commercial_social_remix"
    | "commercial_use"
    | "commercial_remix";
  aiLearning: boolean;
  licensePrice: number;
  revShare: number;
};

export interface LicenseTypeInfo {
  name: string;
  description: string;
  icon?: string;
  key: string;
}

// Constants
export const DEFAULT_LICENSE_SETTINGS: LicenseSettings = {
  pilType: "commercial_remix",
  aiLearning: false,
  licensePrice: 0,
  revShare: 0,
};

export const LICENSE_TYPES: Record<string, LicenseTypeInfo> = {
  "non-commercial-social-remixing": {
    key: "non-commercial-social-remixing",
    name: "Non-Commercial Social Remixing",
    description: "Let the world build on and play with your creation...",
    icon: "🎨",
  },
  "commercial-use": {
    key: "commercial-use",
    name: "Commercial Use",
    description: "Retain control over reuse of your work...",
    icon: "💼",
  },
  "commercial-remix": {
    key: "commercial-remix",
    name: "Commercial Remix",
    description:
      "Let the world build on and play with your creation… and earn money together!",
    icon: "🔄",
  },
};

// Story Protocol Mainnet addresses
export const ROYALTY_POLICY_LAP = "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E";

// License type detection and mapping functions
export function pilTypeToLicenseKey(
  pilType: LicenseSettings["pilType"],
): string {
  const mapping: Record<string, string> = {
    non_commercial_social_remix: "non-commercial-social-remixing",
    commercial_use: "commercial-use",
    commercial_remix: "commercial-remix",
  };
  return mapping[pilType] || "non-commercial-social-remixing";
}

export function determineLicenseType(license: any): LicenseTypeInfo | null {
  if (!license) return null;

  // Template name matching
  if (license.templateName) {
    const templateLower = license.templateName.toLowerCase();
    if (templateLower.includes("commercial remix")) {
      return LICENSE_TYPES["commercial-remix"];
    }
    if (
      templateLower.includes("commercial use") &&
      !templateLower.includes("remix")
    ) {
      return LICENSE_TYPES["commercial-use"];
    }
    if (
      templateLower.includes("non-commercial") ||
      templateLower.includes("social remix")
    ) {
      return LICENSE_TYPES["non-commercial-social-remixing"];
    }
  }

  // Terms-based detection
  if (!license.terms) return null;

  const {
    commercialUse,
    derivativesAllowed,
    commercialRevShare,
    defaultMintingFee,
  } = license.terms;

  if (
    derivativesAllowed &&
    commercialUse &&
    (defaultMintingFee > 0 || commercialRevShare > 0)
  ) {
    return LICENSE_TYPES["commercial-remix"];
  }
  if (commercialUse && defaultMintingFee > 0 && !derivativesAllowed) {
    return LICENSE_TYPES["commercial-use"];
  }
  if (derivativesAllowed && !commercialUse) {
    return LICENSE_TYPES["non-commercial-social-remixing"];
  }

  return null;
}

export function determineLicenseTypeByGroup(group: number): string {
  // Grup yang aman untuk commercial remix
  const commercialRemixGroups = [1, 12, 16];
  // Grup untuk commercial use
  const commercialUseGroups = [4, 8, 9];

  if (commercialRemixGroups.includes(group)) return "commercial-remix";
  if (commercialUseGroups.includes(group)) return "commercial-use";
  return "non-commercial-social-remixing";
}

export function getLicenseSummaryLabel(license: any): string {
  return (
    determineLicenseType(license)?.name ||
    license.templateName ||
    "Unknown License"
  );
}

// License settings and conversion functions
export function getLicenseSettingsByType(
  licenseType: string,
  aiTrainingManual?: boolean,
  mintingFee?: number,
  revShare?: number,
  isAiGenerated?: boolean,
): LicenseSettings {
  switch (licenseType) {
    case "non-commercial-social-remixing":
      // Non-commercial licenses always disable AI learning
      return {
        pilType: "non_commercial_social_remix",
        aiLearning: false,
        licensePrice: 0,
        revShare: 0,
      };
    case "commercial-use":
      // AI-generated content disables AI learning even for commercial use
      return {
        pilType: "commercial_use",
        aiLearning: isAiGenerated ? false : (aiTrainingManual ?? false),
        licensePrice: mintingFee ?? 1,
        revShare: 0,
      };
    case "commercial-remix":
      // AI-generated content disables AI learning even for commercial remix
      return {
        pilType: "commercial_remix",
        aiLearning: isAiGenerated ? false : (aiTrainingManual ?? true),
        licensePrice: mintingFee ?? 0,
        revShare: revShare ?? 0,
      };
    default:
      return DEFAULT_LICENSE_SETTINGS;
  }
}

// Konversi ke Story Protocol LicenseTerms (on-chain)
export function toLicenseTerms(settings: LicenseSettings): LicenseTerms {
  const isCommercial = settings.pilType !== "non_commercial_social_remix";
  const allowDerivatives = settings.pilType !== "commercial_use";

  // Create metadata URI with AI learning preference
  // Format: ipfs://QmXXX or encoded as URI parameter
  const metadataUri = JSON.stringify({
    aiTrainingAllowed: settings.aiLearning,
  });
  const encodedUri = `data:application/json,${encodeURIComponent(metadataUri)}`;

  return {
    transferable: true,
    royaltyPolicy: isCommercial ? ROYALTY_POLICY_LAP : zeroAddress,
    defaultMintingFee: parseEther(String(settings.licensePrice)),
    expiration: 0n,
    commercialUse: isCommercial,
    commercialAttribution: isCommercial,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x",
    commercialRevShare: settings.revShare,
    commercialRevCeiling: 0n,
    derivativesAllowed: allowDerivatives,
    derivativesAttribution: allowDerivatives,
    derivativesApproval: false,
    derivativesReciprocal: allowDerivatives,
    derivativeRevCeiling: 0n,
    currency: WIP_TOKEN_ADDRESS,
    uri: encodedUri,
  };
}

// Legacy function untuk backward compatibility
export function createLicenseTerms(settings: LicenseSettings) {
  return {
    pilType: settings.pilType,
    terms: toLicenseTerms(settings),
  } as const;
}
