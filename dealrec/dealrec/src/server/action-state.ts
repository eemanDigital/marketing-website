export type ActionState =
  | {
      ok?: boolean;
      error?: string;
      success?: string;
      fieldErrors?: Record<string, string>;
      devCode?: string;
      code?: string;
      url?: string;
    }
  | null;

export function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
