export async function GET(request: Request): Promise<Response> {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    console.log(clientId,'libyannddf////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////')

    if (!clientId) {
        return new Response(JSON.stringify({ error: "PAYPAL_CLIENT_ID is not set" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ clientId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
