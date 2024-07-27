interface PaystackPopObject {
  setup(options: PaystackOptions): {
    openIframe(): void;
  };
}

interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
  onError: (error: any) => void;
}

interface Window {
  PaystackPop: PaystackPopObject;
}

