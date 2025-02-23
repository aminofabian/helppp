export const paystackRequest = async (endpoint: string, method = "POST", body?: object) => {
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  
    if (!PAYSTACK_SECRET) {
      throw new Error("Missing Paystack secret key in environment variables");
    }
  
    const res = await fetch(`https://api.paystack.co/${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : null,
    });
  
    return res.json();
  };
  