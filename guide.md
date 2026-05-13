# 📱 WhatsApp Auto-Reply AI Guide

This automation allows your WhatsApp to automatically reply to messages using your own personal style.

## 🚀 Quick Start
1.  **Start the Bot**: Open your terminal and run:
    ```bash
    node index.js
    ```
2.  **Login**: Scan the QR code that appears in the terminal using your WhatsApp (Linked Devices).
3.  **Automatic Mode**: Once you see `[WhatsApp] Client is ready!`, the bot will automatically reply to any private message you receive.

---

## 🛠️ Customization

### 1. Training your AI (Style Matching)
To make the AI sound exactly like you, edit the `training_data.txt` file.
- Add examples of messages you receive and how you usually reply.
- The more examples you add, the better the AI becomes at mimicking your tone.

### 2. Changing the Persona
Open the `.env` file and modify the `PERSONA` variable.
- Example: `PERSONA="You are a funny guy who uses many puns."`

---

## ⚠️ Important Notes
- **Private Chats Only**: By default, the bot only replies to individual chats (not groups) to avoid spamming.
- **Typing Indicator**: The bot will show "typing..." on WhatsApp while it generates a response.
- **Stopping the Bot**: Press `Ctrl + C` in the terminal to stop the automation.

---

## 🛠️ Troubleshooting
- **QR Code not loading**: Ensure you have a stable internet connection.
- **AI Error 400**: This usually means the model name is outdated or the API key is invalid. (Fixed: Currently using `llama-3.3-70b-versatile`).
- **Bot not replying**: Check the terminal for errors. If it says "Generating response..." but nothing happens, check your Groq API usage limits.
