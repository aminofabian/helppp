declare module 'k2-connect-node' {
  interface K2Options {
    clientId: string;
    clientSecret: string;
    baseUrl: string;
    apiKey: string;
  }

  interface TokenService {
    getToken(): Promise<any>;
  }

  interface PayService {
    initiatePayment(paymentData: any): Promise<any>;
  }

  interface K2Instance {
    TokenService: TokenService;
    PayService: PayService;
  }

  function K2(options: K2Options): K2Instance;

  export = K2;
} 