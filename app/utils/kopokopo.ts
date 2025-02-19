import K2 from "k2-connect-node";

const options = {
  clientId: process.env.KOPOKOPO_CLIENT_ID!,
  clientSecret: process.env.KOPOKOPO_CLIENT_SECRET!,
  apiKey: process.env.KOPOKOPO_API_KEY!,
  baseUrl: process.env.KOPOKOPO_BASE_URL! || "https://sandbox.kopokopo.com",
};

const TokenService = K2(options).TokenService;

export async function getAccessToken(): Promise<string> {
  try {
    const response = await TokenService.getToken();
    console.log("Access Token Response:", response);
    return response.access_token;
  } catch (error) {
    console.error("Error obtaining access token:", error);
    throw new Error("Failed to obtain Kopo Kopo access token");
  }
}
