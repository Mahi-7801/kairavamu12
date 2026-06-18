import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Replicate from 'replicate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── SMTP – Booking Form ───────────────────────────────────────────
app.post('/api/booking', async (req, res) => {
  try {
    const { name, phone, treatment, date, notes } = req.body;
    if (!name || !phone || !treatment || !date) {
      return res.status(400).json({ error: 'name, phone, treatment, and date are required' });
    }

    if (!process.env.SMTP_HOST || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log('SMTP not configured – logging booking instead');
      console.log({ name, phone, treatment, date, notes });
      return res.json({ success: true, message: 'Booking received (demo mode – SMTP not configured)' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Kairavam Clinic" <${process.env.SMTP_USER}>`,
      to: process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER,
      subject: `New Booking – ${name} – ${treatment}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 10px">
    <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
      <tr>
        <td align="center" style="background:#1a3c34;padding:28px 20px 20px">
          <div style="width:56px;height:56px;background:#fff;border-radius:50%;margin:0 auto 10px;font-size:28px;line-height:56px;color:#1a3c34;font-weight:bold">K</div>
          <h1 style="color:#fff;margin:0;font-size:19px;font-weight:700">Kairavam Clinic</h1>
          <p style="color:#c7e4d1;margin:4px 0 0;font-size:13px">New Appointment Request</p>
        </td>
      </tr>
      <tr><td style="padding:24px 28px">
        <p style="margin:0 0 8px;font-size:14px;color:#374151"><strong style="color:#1a3c34">Name:</strong> ${name}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151"><strong style="color:#1a3c34">Phone:</strong> ${phone}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151"><strong style="color:#1a3c34">Treatment:</strong> ${treatment}</p>
        <p style="margin:0 0 8px;font-size:14px;color:#374151"><strong style="color:#1a3c34">Date:</strong> ${date}</p>
        <p style="margin:0;font-size:14px;color:#374151"><strong style="color:#1a3c34">Notes:</strong> ${notes || '—'}</p>
      </td></tr>
      <tr><td align="center" style="background:#f9fbfa;padding:12px;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb">Kairavam Clinic · Vijayawada · 7998777666</td></tr>
    </table>
  </td></tr></table>
</body>
</html>`,
      text: `New Appointment Request\n\nName: ${name}\nPhone: ${phone}\nTreatment: ${treatment}\nDate: ${date}\nNotes: ${notes || '—'}\n\nKairavam Clinic · Vijayawada · 7998777666`
    });

    res.json({ success: true, message: 'Booking confirmed. Our team will contact you shortly.' });
  } catch (err) {
    console.error('Booking API error:', err.message);
    res.status(500).json({ error: 'Failed to send booking. Please try again.' });
  }
});

// ── AI Skin Quiz Assessment ─────────────────────────────
app.post('/api/assess-skin', async (req, res) => {
  try {
    const { concern, skinType, lang, image } = req.body;
    if (!concern || !skinType) {
      return res.status(400).json({ error: 'concern and skinType are required' });
    }

    const systemPrompt = `You are an AI Dermato-Cosmetologist assistant analyzing patient skin/hair concerns under Dr. Yamini's diagnostic framework.
Analyze the user's primary concern: "${concern}" and skin profile: "${skinType}".
Output a JSON object ONLY. Do not include markdown code block styling or extra text. Use the exact keys:
{
  "recommended": "Treatment Name (be specific, e.g. Pico Hollywood Carbon Laser, GFC Therapy, Q-Switched Laser Toning, PMU Lip Blush, etc.)",
  "details": "A personalized, reassuring, clinical analysis (2-3 sentences) detailing why this treatment matches their skin type and how it addresses their concern. If an image was provided, refer to visible features in the image.",
  "details_te": "Provide a high-quality, professional Telugu translation of the 'details' field.",
  "startingPrice": "₹X,XXX",
  "slug": "Match one exactly from these slugs: 'Pico Hollywood Carbon Laser', 'Laser Toning', 'Clinical Skin Resurfacing', 'Hair Growth Factor Concentrate (GFC) Therapy', 'PMU Brows', 'PMU Lip Blush'",
  "layer": "Biological target layer (e.g. Epidermal Melanin, Deep Dermis, Hair Follicle Bulbs, etc.)",
  "sessions": "Estimated clinical sessions (e.g. 4-6 Sessions)",
  "downtime": "Estimated downtime description (e.g. 1-2 Days of mild redness, Zero Downtime)"
}`;

    let response;
    
    // If user uploaded an image, try to use OpenAI GPT-4o Vision
    if (image && process.env.OPENAI_API_KEY) {
      console.log('Routing request to GPT-4o Vision...');
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                { type: "text", text: `Analyze Concern: "${concern}", Skin Type: "${skinType}"` },
                { type: "image_url", image_url: { url: image } }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });
    } else {
      // Fallback to Groq Llama for text-only
      console.log('Routing request to Groq Llama...');
      const groqApiKey = process.env.GROQ_API_KEY || 'YOUR_GROQ_API_KEY';
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Analyze Concern: "${concern}", Skin Type: "${skinType}"`
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    res.json(content);
  } catch (err) {
    console.error('AI Assessment API error:', err.message);
    res.status(500).json({ error: 'Failed to perform AI assessment. Using local fallback instead.' });
  }
});

// ── AI Before & After Image Transformation ────────────────────────
// 5-Level Fallback Chain: Grok → Gemini Flash → Gemini Lite → Replicate → Mock

async function tryOpenRouter(apiKey, model, prompt, imageDataUri) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      modalities: ['image', 'text'],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageDataUri } },
            { type: 'text', text: prompt }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `OpenRouter ${model} returned status ${response.status}`);
  }

  const resJson = await response.json();

  if (resJson.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
    return resJson.choices[0].message.images[0].image_url.url;
  }

  const content = resJson.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        return part.image_url.url;
      }
    }
  }

  throw new Error(`No image found in ${model} response`);
}

async function tryReplicate(prompt, image) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const output = await replicate.run(
    'timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f',
    {
      input: {
        image,
        prompt,
        num_inference_steps: 25,
        image_guidance_scale: 1.5,
        guidance_scale: 7.5
      }
    }
  );
  if (!output || output.length === 0) throw new Error('Replicate returned empty output');
  return output[0];
}

function getMockImage(category) {
  const images = {
    skin: '/after_face.png',
    hair: '/hair_gfc_after.png',
    pmu: '/pmu_lips_after.png'
  };
  return images[category] || '/after_face.png';
}

app.post('/api/generate-transformation', async (req, res) => {
  try {
    const { image, category } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const prompts = {
      skin: 'Edit this photo: make the skin clear, smooth, glowy, healthy, and remove all blemishes, acne scars, and dark spots. Keep the person and background identical.',
      hair: 'Edit this photo: make the hair look significantly thicker, fuller, healthier, and cover any thinning areas naturally. Keep the person and background identical.',
      pmu: 'Edit this photo: make the lips look beautifully tinted with a soft rose pink color, symmetrical, and perfectly hydrated. Keep the person and background identical.'
    };
    const prompt = prompts[category] || prompts.skin;

    // ── Level 1: Grok ──────────────────────────────────────────
    if (process.env.OPENROUTER_KEY_GROK) {
      try {
        console.log('[Transform] Level 1: Trying Grok...');
        const afterImage = await tryOpenRouter(
          process.env.OPENROUTER_KEY_GROK,
          'x-ai/grok-imagine-image-quality',
          prompt, image
        );
        console.log('[Transform] ✓ Grok succeeded');
        return res.json({ success: true, afterImage, isMocked: false, provider: 'Grok' });
      } catch (err) {
        console.warn(`[Transform] ✗ Grok failed: ${err.message}`);
      }
    }

    // ── Level 2: Gemini Flash ──────────────────────────────────
    if (process.env.OPENROUTER_KEY_GEMINI_FLASH) {
      try {
        console.log('[Transform] Level 2: Trying Gemini Flash...');
        const afterImage = await tryOpenRouter(
          process.env.OPENROUTER_KEY_GEMINI_FLASH,
          'google/gemini-3.1-flash-image',
          prompt, image
        );
        console.log('[Transform] ✓ Gemini Flash succeeded');
        return res.json({ success: true, afterImage, isMocked: false, provider: 'Gemini Flash' });
      } catch (err) {
        console.warn(`[Transform] ✗ Gemini Flash failed: ${err.message}`);
      }
    }

    // ── Level 3: Gemini Lite ───────────────────────────────────
    if (process.env.OPENROUTER_KEY_GEMINI_LITE) {
      try {
        console.log('[Transform] Level 3: Trying Gemini Lite...');
        const afterImage = await tryOpenRouter(
          process.env.OPENROUTER_KEY_GEMINI_LITE,
          'google/gemini-3.1-flash-lite',
          prompt, image
        );
        console.log('[Transform] ✓ Gemini Lite succeeded');
        return res.json({ success: true, afterImage, isMocked: false, provider: 'Gemini Lite' });
      } catch (err) {
        console.warn(`[Transform] ✗ Gemini Lite failed: ${err.message}`);
      }
    }

    // ── Level 4: Replicate ─────────────────────────────────────
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        console.log('[Transform] Level 4: Trying Replicate...');
        const afterImage = await tryReplicate(prompt, image);
        console.log('[Transform] ✓ Replicate succeeded');
        return res.json({ success: true, afterImage, isMocked: false, provider: 'Replicate' });
      } catch (err) {
        console.warn(`[Transform] ✗ Replicate failed: ${err.message}`);
      }
    }

    // ── Level 5: Mock (Static Fallback) ────────────────────────
    console.log('[Transform] Level 5: All providers failed – returning mock image');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return res.json({
      success: true,
      afterImage: getMockImage(category),
      isMocked: true,
      provider: 'Mock',
      message: 'Simulated transformation (all AI providers unavailable)'
    });

  } catch (err) {
    console.error('[Transform] Unhandled error:', err.message);
    res.status(500).json({ error: 'Failed to generate transformation image.' });
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Kairavam API server running on http://localhost:${PORT}`);
});
