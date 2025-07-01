import { z } from 'zod';

export const LoanSchema = z.object({
  loanId: z.string(),
  amount: z.number().positive(),
  term: z.number().int().positive(),
});
export type Loan = z.infer<typeof LoanSchema>;
