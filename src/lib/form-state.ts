export type LeadFormState = {
  fullName: string;
  email: string;
  company: string;
  roleTitle: string;
  region: string;
  timeline: string;
  projectType: string;
  budgetRange: string;
  deploymentPriorities: string;
};

export type VendorSubmissionFormState = {
  companyName: string;
  websiteUrl: string;
  contactName: string;
  contactEmail: string;
  categories: string;
  routingCategory: string;
  summary: string;
};

export type ClaimFormState = {
  companyName: string;
  websiteUrl: string;
  claimantName: string;
  claimantEmail: string;
  notes: string;
};

export const emptyLeadForm: LeadFormState = {
  fullName: "",
  email: "",
  company: "",
  roleTitle: "",
  region: "",
  timeline: "",
  projectType: "",
  budgetRange: "",
  deploymentPriorities: "",
};

export const emptyVendorSubmissionForm: VendorSubmissionFormState = {
  companyName: "",
  websiteUrl: "",
  contactName: "",
  contactEmail: "",
  categories: "",
  routingCategory: "",
  summary: "",
};

export const emptyClaimForm: ClaimFormState = {
  companyName: "",
  websiteUrl: "",
  claimantName: "",
  claimantEmail: "",
  notes: "",
};
