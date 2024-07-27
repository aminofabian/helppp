// app/types/mpesa.ts

export interface CallbackMetadataItem {
  Name: string;
  Value: string | number;
}

export interface CallbackData {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  amount: number; // Type 'Float' is not a valid TypeScript type. Use 'number' instead.
  phoneNumber?: string | undefined; // Optional field based on the schema
  mpesaReceiptNumber?: string; // Optional field based on the schema
  transactionDate?: Date; // Use 'Date' for DateTime types in TypeScript
  CallbackMetadata: {
    Item: CallbackMetadataItem[];
  };
}

export interface CallbackMetadataItem {
  Name: string;
  Value: string | number;
}



export interface STKCallback {
  stkCallback: CallbackData;
}

export interface RequestBody {
  Body: STKCallback;
}