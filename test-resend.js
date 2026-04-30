const fetch = require('node-fetch');

async function testResend() {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer re_Z4Puye3f_JAyWq8NNt4gTNQwXhvtNKPjC',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: 'papelaria573@gmail.com',
      subject: 'Teste Papelaria',
      html: '<p>Test</p>'
    })
  });
  const data = await res.json();
  console.log(data);
}

testResend();
