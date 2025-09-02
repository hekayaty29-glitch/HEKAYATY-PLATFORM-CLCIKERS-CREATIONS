import { corsHeaders, handleCors } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { to, code, expiresAt, paid = false } = await req.json()

    const subtitle = paid
      ? 'Your VIP journey begins!'
      : 'A complimentary pass to worlds unknown'

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Hekayaty VIP Invitation</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, sans-serif; background:#0f0c29; background:linear-gradient(135deg,#24243e 0%,#302b63 50%,#0f0c29 100%); color:#fff; padding:2rem; }
          .card { max-width:600px; margin:auto; background:rgba(255,255,255,0.05); border-radius:12px; padding:2rem; box-shadow:0 8px 16px rgba(0,0,0,0.4); }
          h1 { text-align:center; font-size:2rem; margin-bottom:0.5rem; }
          h2 { text-align:center; font-weight:400; margin-top:0; color:#facc15; }
          .code { font-size:2.2rem; letter-spacing:0.15em; font-weight:700; background:#1e1b4b; padding:1rem 2rem; border-radius:8px; display:inline-block; margin:1.5rem auto; }
          p { line-height:1.6; }
          .footer { margin-top:2rem; font-size:0.75rem; text-align:center; opacity:0.7; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>✨ Welcome to Hekayaty ✨</h1>
          <h2>${subtitle}</h2>
          <p>Greetings, Storyteller!</p>
          <p>
            Unlock countless tales of magic, mystery, and imagination with your exclusive VIP code below.
            Redeem it inside Hekayaty to start exploring premium stories without limits.
          </p>
          <div style="text-align:center;">
            <span class="code">${code}</span>
          </div>
          <p style="text-align:center;">Expires on <strong>${new Date(expiresAt).toLocaleDateString()}</strong></p>
          <p>May your journeys be legendary,<br/>The Hekayaty Team 📚</p>
          <div class="footer">If you did not request this email, please ignore it.</div>
        </div>
      </body>
    </html>`

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Hekayaty <noreply@hekayaty.com>',
        to,
        subject: paid ? 'Your Hekayaty VIP Code' : 'Your Free Hekayaty VIP Code',
        html: htmlContent
      })
    })

    const emailResult = await emailResponse.json()

    if (!emailResponse.ok) {
      throw new Error(`Email send failed: ${emailResult.message}`)
    }

    return new Response(JSON.stringify({ success: true, emailId: emailResult.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
