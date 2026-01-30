const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Fallback logic
const getFallbackResponse = (message) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) return "Hello! Welcome to The Vanity. How can I assist you today?";
    if (lowerMsg.includes('order') || lowerMsg.includes('track')) return "You can track your order in the 'My Orders' section.";
    if (lowerMsg.includes('return') || lowerMsg.includes('refund')) return "We offer a 7-day hassle-free return policy.";
    if (lowerMsg.includes('contact')) return "Contact us at support@thevanity.in.";

    return "I am currently offline, but you can browse our products or check our FAQ page.";
};

// System Prompt
const SYSTEM_PROMPT = `
You are the AI Assistant for "The Vanity", a premium luxury beauty and cosmetics store in India.
Your tone should be polite, professional, elegant, and helpful.

Key Information about The Vanity:
- We sell high-end makeup, skincare, and hair care products.
- Free shipping on orders above ₹999.
- 7-day hassle-free return policy for unused items.
- Payment options: UPI, Cards, Net Banking, COD.
- Contact: support@thevanity.in, +91 98765 43210.
- Delivery takes 3-5 business days.

Rules:
1. Answer strictly about beauty, cosmetics, our store policies, and order related queries.
2. If asked about unrelated topics (e.g., coding, math, politics), polite decline and steer back to beauty.
3. Keep answers concise (under 3 sentences) unless the user asks for a detailed explanation.
4. If you don't know an answer, suggest contacting support.
`;

router.post('/', async (req, res) => {
    try {
        const { message } = req.body;
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            console.warn("OPENROUTER_API_KEY is not set. Using fallback logic.");
            return res.json({
                success: true,
                reply: getFallbackResponse(message || '')
            });
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:5000", // Required by OpenRouter
                "X-Title": "The Vanity AI", // Optional
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "z-ai/glm-4.5-air:free",
                "messages": [
                    { "role": "system", "content": SYSTEM_PROMPT },
                    { "role": "user", "content": message }
                ]
            })
        });

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            res.json({
                success: true,
                reply: data.choices[0].message.content
            });
        } else {
            console.error('OpenRouter API Error:', JSON.stringify(data));
            res.json({
                success: true,
                reply: getFallbackResponse(message || '')
            });
        }

    } catch (error) {
        console.error('OpenRouter Chat Error:', error);
        res.json({
            success: true,
            reply: getFallbackResponse(req.body.message || '')
        });
    }
});

module.exports = router;
