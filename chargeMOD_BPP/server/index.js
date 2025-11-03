// Load environment variables (like BPP_ID, BPP_URL) from a .env file
require('dotenv').config(); 

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
// The BPP will run on the port defined in its environment, defaulting to 6001.
const PORT = process.env.PORT || 6001; 

// --- Configuration ---
const BPP_ID = process.env.BPP_ID || 'bpp.localhost';
const BPP_URI = process.env.BPP_URL || `http://localhost:${PORT}`; 

// --- Middleware ---
// 1. CORS: Allow requests from all origins for development purposes.
app.use(cors());

// 2. Body Parser: Essential for parsing the Beckn JSON payload.
app.use(express.json());


// --- Helper Function to Send Response (on_search) ---
/**
 * Simulates sending the final on_search response back to the BAP via its URI/Gateway.
 * @param {object} context The context from the original request.
 * @param {object} message The message payload (e.g., catalog data).
 */
const postToBAP = async (context, message) => {
    const bapUri = context.bap_uri; 
    const responseAction = 'on_' + context.action; // 'on_search'

    const becknResponse = {
        context: {
            ...context,
            action: responseAction, 
            bpp_id: BPP_ID,
            bpp_uri: BPP_URI,
            timestamp: new Date().toISOString(),
        },
        message: message
    };

    console.log(`[BPP] Sending ${responseAction} response to BAP URI: ${bapUri}`);
    
    try {
        // Send the response back to the BAP (or Gateway)
        const response = await axios.post(bapUri + '/' + responseAction, becknResponse, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000 
        });
        
        console.log(`[BPP] Successfully posted ${responseAction}. Status: ${response.status}`);
    } catch (error) {
        console.error(`[BPP] ERROR posting ${responseAction} to BAP URI: ${bapUri}`);
        console.error("  Error message:", error.message);
        console.error("  Response Status:", error.response?.status);
        console.error("  Response Data:", error.response?.data);
    }
};


// --- BPP Endpoints ---

// 1. /search endpoint (received from Gateway)
app.post('/search', async (req, res) => {
    const { context, message } = req.body;
    console.log("context: ", context);
    console.log("message: ", message);
        
    console.log(`\n[BPP] Received 'search' request. Txn ID: ${context.transaction_id}`);

    // 1. Send an ACK response immediately to the Gateway/BAP
    res.status(202).json({
        message: { ack: { status: "ACK" } },
        context: { ...context, action: 'ack' }
    });

    // 2. Process and send the final on_search response asynchronously (Simulated)
    const catalogMessage = {
        catalog: {
            bpp: { id: BPP_ID, descriptor: { name: "EV Charging Provider" } },
            providers: [
                { id: "p1", descriptor: { name: "Solar Charge Co." }, 
                  items: [{ id: "i1", descriptor: { name: "Solar Kilowatt Hour" } }]
                },
                { id: "p2", descriptor: { name: "Wind Power Hub" },
                  items: [{ id: "i2", descriptor: { name: "Wind Kilowatt Hour" } }]
                }
            ]
        }
    };
    
    // Simulate lookup delay
    setTimeout(() => {
        postToBAP(context, catalogMessage);
    }, 1000); 

});


// 2. /on_search endpoint (Placeholder)
// This BPP will typically send the on_search, but an endpoint is included
// in case it receives this request type (e.g., for testing or validation).
app.post('/on_search', (req, res) => {
    const { context } = req.body;
    console.log(`\n[BPP] Received 'on_search' request (from BAP/Tester). Txn ID: ${context.transaction_id}`);
    
    // Send ACK back
    res.status(200).json({
        message: { ack: { status: "ACK" } },
        context: { ...context, action: 'ack' }
    });
});


// 3. /status endpoint (Health Check)
app.get('/status', (req, res) => {
    res.status(200).json({ status: "BPP is operational", id: BPP_ID, uri: BPP_URI });
});


// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`BPP Server is running on: ${BPP_URI}`);
  console.log(`Registered BPP ID: ${BPP_ID}`);
});
