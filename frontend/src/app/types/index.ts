export type LoanMetric = {
  accepted: number;
  rejected: number;
  error: number;
  batch: number;
  ts: number;
};
export type ErrorLog = {
  loanId: string;
  error: string;
  reason: string;
  ts: number;
};