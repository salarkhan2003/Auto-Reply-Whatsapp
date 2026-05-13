const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCodeWeb = require('qrcode');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const chalk = require('chalk');

dotenv.config();

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

let lastQr = null;
let isReady = false;

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        protocolTimeout: 60000, // Increase timeout to 60 seconds
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    },
    authTimeoutMs: 60000, // Increase auth timeout
    qrMaxRetries: 10 // Allow more retries for QR
});

// Simple health check server for Railway/Render
const http = require('http');
const server = http.createServer(async (req, res) => {
    if (isReady) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>WhatsApp Bot is Running!</h1><p>Status: Connected</p>');
        return;
    }

    if (lastQr) {
        try {
            const qrImage = await QRCodeWeb.toDataURL(lastQr);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
                    <h1>Scan to Login</h1>
                    <img src="${qrImage}" style="width: 300px; height: 300px; border: 10px solid white; box-shadow: 0 0 20px rgba(0,0,0,0.1);" />
                    <p>Refresh the page if the QR code expires.</p>
                </div>
            `);
        } catch (err) {
            res.writeHead(500);
            res.end('Error generating QR code');
        }
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Starting...</h1><p>Please wait a few seconds and refresh the page.</p>');
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

        return completion.choices[0].message.content;
    } catch (error) {
        console.error(chalk.red('[Error] Groq API Error:'), error.message);
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

client.on('message', async (msg) => {
    // Avoid replying to groups (optional, can be toggled)
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    // Avoid replying to status updates or system messages
    if (msg.from === 'status@broadcast') return;

    console.log(chalk.cyan(`[Message] From ${msg.from}: ${msg.body}`));

    // Typing indicator
    await chat.sendStateTyping();

    // Get AI Response
    const response = await getAIResponse(msg.body, chat.name);

    if (response) {
        await msg.reply(response);
        console.log(chalk.magenta(`[Reply] Sent: ${response}`));
    }
});

// Start Client
console.log(chalk.blue('[System] Starting WhatsApp Bot...'));
client.initialize();
