/**
 * Test data factories for creating consistent test data across e2e tests
 */

export const createJobData = (overrides?: Partial<JobTestData>) => ({
  title: `Test Job ${Date.now()}`,
  category: 'برمجة وتطوير',
  description: 'This is a comprehensive test job description that meets the minimum character requirement of 50 characters for form validation.',
  skills: ['React', 'TypeScript', 'Node.js'],
  jobType: 'fixed_price' as const,
  budgetMin: 100,
  budgetMax: 500,
  duration: 'أسبوع',
  experienceLevel: 'intermediate' as const,
  visibility: 'public' as const,
  ...overrides,
});

export const createProposalData = (overrides?: Partial<ProposalTestData>) => ({
  bidAmount: 350,
  deliveryDays: 7,
  coverLetter: 'I am very interested in this project and believe I am the perfect fit. I have extensive experience with the required technologies and have successfully completed similar projects in the past. I am committed to delivering high-quality work within the specified timeframe and budget.',
  ...overrides,
});

export const createWithdrawalData = (overrides?: Partial<WithdrawalTestData>) => ({
  amount: 50,
  method: 'bank_transfer' as const,
  accountDetails: {
    accountNumber: '1234567890',
    bankName: 'Test Bank',
  },
  ...overrides,
});

// Type definitions
export interface JobTestData {
  title: string;
  category: string;
  description: string;
  skills: string[];
  jobType: 'fixed_price' | 'hourly';
  budgetMin?: number;
  budgetMax?: number;
  hourlyRate?: number;
  duration: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  visibility: 'public' | 'invite_only';
}

export interface ProposalTestData {
  bidAmount: number;
  deliveryDays: number;
  coverLetter: string;
}

export interface WithdrawalTestData {
  amount: number;
  method: 'bank_transfer' | 'mobile_money' | 'paypal';
  accountDetails: {
    accountNumber: string;
    bankName: string;
  };
}

// Selectors for common UI elements
export const SELECTORS = {
  // Auth
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button[type="submit"]',
  
  // Job Post
  jobTitleInput: 'input[name="title"]',
  categorySelect: 'select[name="category"]',
  descriptionTextarea: 'textarea[name="description"]',
  budgetMinInput: 'input[name="budget_min"]',
  budgetMaxInput: 'input[name="budget_max"]',
  
  // Proposal
  bidAmountInput: 'input[name="bid_amount"]',
  coverLetterTextarea: 'textarea[name="cover_letter"]',
  deliveryDaysSelect: 'select[name="delivery_days"]',
  
  // Wallet
  withdrawButton: 'button:has-text("Withdraw"), button:has-text("سحب")',
  amountInput: 'input[name="amount"]',
  
  // Common
  nextButton: 'button:has-text("Next"), button:has-text("التالي")',
  cancelButton: 'button:has-text("Cancel"), button:has-text("إلغاء")',
  saveButton: 'button:has-text("Save"), button:has-text("حفظ")',
};

// Wait times (in milliseconds)
export const WAIT_TIMES = {
  short: 500,
  medium: 1000,
  long: 3000,
  navigation: 10000,
  apiCall: 15000,
};

// Test patterns for i18n text matching
export const TEXT_PATTERNS = {
  login: /login|تسجيل الدخول|connexion/i,
  signup: /sign up|إنشاء حساب|créer un compte/i,
  logout: /logout|تسجيل الخروج|déconnexion/i,
  success: /success|نجح|تم|succès/i,
  error: /error|خطأ|erreur/i,
  required: /required|مطلوب|obligatoire/i,
  wallet: /wallet|محفظة|portefeuille/i,
  proposal: /proposal|عرض|proposition/i,
  job: /job|مشروع|projet/i,
  dashboard: /dashboard|لوحة|tableau/i,
};
