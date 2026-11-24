// Contact form on the homepage ("Tell me your idea"). Emails the message to
// Nico through Resend, with the sender's address as reply-to.
// Env (Netlify site settings): RESEND_API_KEY, CONTACT_TO, CONTACT_FROM
// (an address on a domain verified in Resend).

const MAX = { name: 120, email: 200, message: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const message = String(body.message ?? '').trim();

  // Bots fill the hidden field; pretend it worked.
  if (body.company) return new Response(null, { status: 204 });

  if (!name || !EMAIL.test(email) || !message) return new Response('Missing fields', { status: 400 });
  if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
    return new Response('Too long', { status: 400 });
  }

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) return new Response('Not set up', { status: 503 });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: CONTACT_TO.split(',').map((s) => s.trim()),
      reply_to: email,
      subject: `New project idea from ${name.replace(/[\r\n]+/g, ' ')}`,
      text: `${name} <${email}>\n\n${message}`,
    }),
  });
  if (!res.ok) {
    console.error('Resend error', res.status);
    return new Response('Send failed', { status: 502 });
  }
  return new Response(null, { status: 204 });
};

export const config = { path: '/api/contact' };
