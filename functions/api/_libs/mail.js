// @path: api/_libs/mail.js
export async function sendEmail(to, code, env) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Boxcef <send@anic.cc.cd>',
        to: [to],
        subject: '邮箱验证码',
        html: `<div style="text-align:center;font-family:Arial,sans-serif">
          <h2>邮箱验证码</h2>
          <h1 style="letter-spacing:8px;color:#007bff">${code}</h1>
          <p>5分钟内有效</p>
        </div>`
      })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}