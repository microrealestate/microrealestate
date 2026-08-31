export interface AccountType {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  mustChangePassword?: boolean;
  /** Sortable date string YYYY-MM-DDTHH:mm. */
  createdDate?: string;
}
