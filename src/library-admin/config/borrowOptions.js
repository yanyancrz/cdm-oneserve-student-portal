export const LOAN_DAY_OPTIONS = [3, 7, 14];
export const DEFAULT_LOAN_DAYS = 7;

// Display only. The server decides the real due date (end of the last loan day).
export function previewDueDate(days) {
    const due = new Date();
    due.setHours(0, 0, 0, 0);
    due.setDate(due.getDate() + days);
    return due;
}