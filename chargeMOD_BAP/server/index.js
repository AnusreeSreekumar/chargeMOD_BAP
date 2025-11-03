
import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import cors from "cors";
import axios from 'axios';
import jws from 'jws';
import crypto from 'crypto'; 

const app = express();
const PORT = 5001;

// --- CONFIGURATION CONSTANTS ---
const gatewayUrl = process.env.GATEWAY_URL;
const BAP_PRIVATE_KEY = process.env.BAP_PRIVATE_KEY; // Your private signing key
const BAP_KEY_ID = process.env.BAP_KEY_ID;           // Your signing key ID

// MANDATORY CHECK: Ensure required variables are configured
if (!gatewayUrl) {
    console.error("FATAL ERROR: GATEWAY_URL not found in environment variables. Please check your .env file.");
    process.exit(1);
}
if (!BAP_PRIVATE_KEY || !BAP_KEY_ID) {
    console.error("FATAL ERROR: BAP_PRIVATE_KEY or BAP_KEY_ID not set. Signature is mandatory for Beckn. Please check your .env file.");
    process.exit(1);
}

// Function to generate the required Beckn signature header
const generateSignatureHeader = (becknRequest) => {
    // 1. Calculate Blake2b hash of the request body
    const bodyString = JSON.stringify(becknRequest);
    const bodyHash = crypto.createHash('sha256').update(bodyString).digest('base64');

    // 2. Construct the signing string (time + hash)
    const signingString = `(created): ${Math.floor(Date.now() / 1000)}\n(expires): ${Math.floor(Date.now() / 1000) + 3600}\nDigest: BLAKE-512=${bodyHash}`;

    // 3. Sign the signing string using JWS and the private key
    const signature = jws.sign({
        header: { alg: 'EdDSA' }, // Use EdDSA or what your key/network requires
        payload: signingString,
        secret: BAP_PRIVATE_KEY,
    });

    // 4. Create the Authorization header value
    const authHeader = `Signature keyId="${BAP_KEY_ID}",algorithm="ed25519",headers="(created) (expires) digest",signature="${signature}"`;

    return authHeader;
};

app.use(cors({
    origin: 'http://localhost:5173' 
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send(`BAP Backend API is running! Gateway set to: ${gatewayUrl}`);
});

app.post("/api/search", async (req, res) => {
    console.log("--- BAP /api/search route hit ---");
    try {
        const now = Date.now();
        const timestamp = new Date().toISOString();

        // 1. Construct the Beckn Request Payload (Transaction Context)
        const becknRequest = {
            context: {
                domain: "nic2004:60221",
                country: "IND",
                city: "std:080",
                action: "search",
                core_version: "1.1.0",
                bap_id: "bap.test.com",
                bap_uri: "http://localhost:5001",
                transaction_id: `txn-test-${now}`,
                message_id: `msg-test-${now}`,
                timestamp: timestamp,
                ttl: "PT10M",
            },
            message: {
                intent: {
                    item: {
                        descriptor: {
                            name: "EV Charging Services",
                        },
                    },
                    fulfillment: {
                        start: {
                            location: {
                                gps: "12.9716, 77.5946", // Bengaluru coordinates
                            },
                        },
                    },
                },
            },
        };

        // 2. Generate the required digital signature
        const signatureHeader = generateSignatureHeader(becknRequest);
        
        console.log("Sending search request to Gateway URL:", gatewayUrl);
        // console.log("Request payload:", JSON.stringify(becknRequest, null, 2)); // Keep this commented for cleaner log
        console.log("Authorization Header (Signature):", signatureHeader);

        // 3. Send the Beckn search request to the Gateway with the signature
        const response = await axios.post(gatewayUrl, becknRequest, {
            headers: { 
                "Content-Type": "application/json",
                "Authorization": signatureHeader // ADDED SIGNATURE HERE
            },
        });

        console.log("Beckn Gateway response status:", response.status);
        console.log("Beckn Gateway response (ACK):", response.data);

        res.status(202).json({ 
            message: "Search request sent to Gateway. Awaiting asynchronous 'on_search' callback.",
            gatewayResponse: response.data,
            requestSent: becknRequest
        });
    } catch (error) {

        console.error(
            "Search error details:",
            error.response?.data || error.message
        );

        res.status(500).json({ 
            error: error.message, 
            details: error.response?.data,
            responseStatus: error.response?.status,
            hint: "If this is ECONNRESET or 401/403, check your BAP_PRIVATE_KEY and BAP_KEY_ID in .env and ensure the Gateway is running."
        });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 BAP Backend Server listening on http://localhost:${PORT}`);
});
