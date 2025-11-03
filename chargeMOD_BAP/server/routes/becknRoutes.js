
import axios from 'axios';
import dotenv from "dotenv";
dotenv.config();


// NOTE: In a real app, gatewayUrl would come from process.env (e.g., using dotenv)
// This is a placeholder for the Beckn Gateway's search endpoint.
const gatewayUrl = process.env.GATEWAY_URL; 

/**
 * 2. Search Route: /api/search (POST)
 * Handles search queries from the frontend and forwards a Beckn protocol request to the Gateway.
 */
app.post("/api/search", async (req, res) => {
    console.log("--- BAP /api/search route hit ---");
    try {
        const now = Date.now();
        const timestamp = new Date().toISOString();

        // BECKN Protocol Request Payload
        const becknRequest = {
            context: {
                domain: "nic2004:60221",
                country: "IND",
                city: "std:080",
                action: "search",
                core_version: "1.1.0",
                bap_id: "bap.test.com",
                bap_uri: "http://localhost:5001",
                transaction_id: `txn-test-${now}`, // Dynamically generated
                message_id: `msg-test-${now}`,     // Dynamically generated
                timestamp: timestamp,             // Current timestamp
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
        
        console.log("GatewayURL/Sending to gateway:", gatewayUrl);
        console.log("Request payload:", JSON.stringify(becknRequest, null, 2)); 

        // Send the Beckn search request to the Gateway
        const response = await axios.post(gatewayUrl, becknRequest, {
            headers: { "Content-Type": "application/json" },
        });

        console.log("Beckn Gateway response status:", response.status);
        console.log("Beckn Gateway response (ACK):", response.data);

        // A Beckn Gateway typically returns a 202 Accepted status for async requests
        res.status(202).json({ 
            message: "Search request sent to Gateway. Awaiting asynchronous 'on_search' callback.",
            gatewayResponse: response.data,
            requestSent: becknRequest
        });
    } catch (error) {
        // Log detailed error information
        console.error(
            "Search error details:",
            error.response?.data || error.message
        );
        
        // Return a 500 status with error details
        res.status(500).json({ 
            error: error.message, 
            details: error.response?.data,
            responseStatus: error.response?.status
        });
    }
});


// Start the Server
app.listen(PORT, () => {
    console.log(`🚀 BAP Backend Server listening on http://localhost:${PORT}`);
});
