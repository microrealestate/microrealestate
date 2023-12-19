import {
  CollectionTypes,
  LeaseStatus,
  LeaseTimeRange,
  Locale,
  PaymentMethod,
  PaymentStatus,
  ResponseError,
} from '../../index.js';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GetTenants {
  export type Request = {
    email?: string;
  };

  export type Response =
    | {
        error?: undefined;
        results:
          | {
              tenant: {
                id: string;
                name: string;
                contacts: {
                  name: string;
                  email: string;
                  phone1: string;
                }[];
                addresses: CollectionTypes.PartAddress[];
              };
              landlord: {
                name: string;
                currency: string;
                locale: Locale;
                addresses: CollectionTypes.PartAddress[];
                contacts: {
                  name: string;
                  email: string;
                  phone1: string;
                  phone2: string;
                }[];
              };
              lease: {
                name: string;
                beginDate: Date;
                endDate: Date;
                terminationDate?: Date;
                timeRange: LeaseTimeRange;
                status: LeaseStatus;
                properties: {
                  id: string;
                  name: string;
                  description: string;
                  type: string;
                }[];
                documents:
                  | {
                      name: string;
                      description: string;
                      url: string;
                    }[]
                  | [];
                invoices:
                  | {
                      term: number;
                      balance: number;
                      grandTotal: number;
                      payment: number;
                      payments:
                        | {
                            date: Date;
                            method: string;
                            reference: string;
                            amount: number;
                          }[]
                        | [];
                      status: PaymentStatus;
                      methods: PaymentMethod[] | [];
                    }[]
                  | [];
                balance: number;
                deposit: number;
              };
            }[]
          | [];
      }
    | ResponseError;
}
