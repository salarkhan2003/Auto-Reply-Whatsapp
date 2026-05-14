const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCodeWeb = require('qrcode');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const chalk = require('chalk');

dotenv.config();

// Check Environment Variables
if (!process.env.GROQ_API_KEY) {
    console.error(chalk.red('[Critical] GROQ_API_KEY is missing! Please add it to your Railway Variables.'));
}

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || 'MISSING'
});

let lastQr = null;
let isReady = false;

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        protocolTimeout: 0, // Disable timeout
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-default-apps',
            '--mute-audio',
            '--no-default-browser-check',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ],
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-js/main/dist/wppconnect-wa.js'
    },
    authTimeoutMs: 0, // Disable timeout
    qrMaxRetries: 15
});

// Simple health check server for Railway/Render
const http = require('http');
const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (isReady) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #075e54; color: white;">
                <h1 style="font-size: 3rem;">✅ Bot is Online</h1>
                <p style="font-size: 1.2rem;">Status: Connected and listening for messages.</p>
                <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                    <p>API Key Status: ${process.env.GROQ_API_KEY ? 'Active' : '❌ MISSING'}</p>
                </div>
            </div>
        `);
        return;
    }

    if (lastQr) {
        try {
            const qrImage = await QRCodeWeb.toDataURL(lastQr);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f0f2f5;">
                    <h1 style="color: #128c7e;">Scan to Login (Railway)</h1>
                    <div style="background: white; padding: 20px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                        <img src="${qrImage}" style="width: 300px; height: 300px;" />
                    </div>
                    <p style="margin-top: 20px; color: #667781;">Open WhatsApp > Linked Devices > Link a Device</p>
                    <p style="font-size: 0.8rem; color: #999;">If the code expires, refresh this page.</p>
                </div>
            `);
        } catch (err) {
            res.writeHead(500);
            res.end('Error generating QR code');
        }
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
                <h1 style="color: #075e54;">Starting WhatsApp...</h1>
                <p>Please wait while we initialize the browser (approx 30-60s).</p>
                <p>Refresh this page in a moment to see the QR code.</p>
            </div>
        `);
    }
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(chalk.green(`[System] Health check server listening on port ${PORT}`));
});

const fs = require('fs');
const path = require('path');

const PERSONA = process.env.PERSONA || "You are a helpful assistant.";
let trainingData = "";
try {
    trainingData = fs.readFileSync(path.join(__dirname, 'training_data.txt'), 'utf8');
} catch (err) {
    console.log(chalk.yellow('[System] No training_data.txt found, using default persona.'));
}

// Function to get AI Response
async function getAIResponse(incomingMessage, senderName) {
    try {
        console.log(chalk.blue(`[AI] Generating response for ${senderName}...`));
        
        const systemPrompt = `${PERSONA}
        
Here are some examples of how I usually reply:
${trainingData}

You are replying on behalf of me (the user). Match my style based on the examples above. Keep the reply natural, short, and concise. Avoid sounding like an AI.`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: `Message from ${senderName}: ${incomingMessage}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
            max_tokens: 150,
        });

        const aiResponse = completion.choices[0]?.message?.content;
        if (!aiResponse) {
            console.log(chalk.yellow('[AI] Received empty response from Groq.'));
            return null;
        }
        return aiResponse;
    } catch (error) {
        console.error(chalk.red('[Error] Groq API Error:'), error);
        if (error.message.includes('404')) {
            console.log(chalk.yellow('[Tip] Model name might be incorrect. Try llama-3.1-70b-versatile or llama3-70b-8192'));
        }
        return null;
    }
}

// WhatsApp Events
client.on('qr', (qr) => {
    lastQr = qr;
    console.log(chalk.yellow('[WhatsApp] New QR code generated. Access it via your Railway URL.'));
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    isReady = true;
    lastQr = null;
    console.log(chalk.green('[WhatsApp] Client is ready! Waiting for messages...'));
});

client.on('auth_failure', (msg) => {
    isReady = false;
    console.error(chalk.red('[WhatsApp] Auth failure:'), msg);
});

client.on('disconnected', (reason) => {
    isReady = false;
    console.log(chalk.yellow('[WhatsApp] Client was logged out:'), reason);
    client.initialize(); // Attempt to reconnect
});

// Handle Incoming Messages
async function handleMessage(msg) {
    try {
        // Avoid replying to status updates or system messages
        if (msg.from === 'status@broadcast' || msg.type === 'ciphertext') return;

        const chat = await msg.getChat();
        
        // Avoid replying to groups (can be toggled)
        if (chat.isGroup) {
            // console.log(chalk.gray(`[Info] Skipping group message in ${chat.name}`));
            return;
        }

        // Avoid replying to messages sent by the bot itself (to prevent loops)
        if (msg.fromMe) return;

        console.log(chalk.cyan(`[Message] From ${chat.name || msg.from}: ${msg.body}`));

        // Typing indicator
        await chat.sendStateTyping();

        // Get AI Response
        const response = await getAIResponse(msg.body, chat.name || "User");

        if (response) {
            await msg.reply(response);
            console.log(chalk.magenta(`[Reply] Sent to ${chat.name || msg.from}: ${response}`));
        } else {
            console.log(chalk.yellow(`[Warning] No response generated for message from ${chat.name || msg.from}`));
        }
    } catch (error) {
        console.error(chalk.red('[Error] Message handling failed:'), error);
    }
}

client.on('message', handleMessage);

// Optionally handle 'message_create' if you want to respond to your own messages for testing
// client.on('message_create', (msg) => {
//     if (msg.fromMe && msg.body === '!test') {
//         handleMessage(msg);
//     }
// });

// Start Client
console.log(chalk.blue('[System] Starting WhatsApp Bot...'));
client.initialize();
