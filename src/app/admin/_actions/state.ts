/** Shape returned by admin server actions to their forms. `error` is an i18n key under `admin`. */
export type ActionState = {
  error?: string;
  /** Extra context for an error, e.g. which packages or requirements are affected. */
  details?: string[];
  message?: string;
  secret?: string;
  secrets?: string[];
  ok?: boolean;
  nonce?: number;
  /** Where to continue after a multi-step flow. */
  next?: string;
};

export const initialActionState: ActionState = {};
