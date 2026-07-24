async function testSignup() {
  const form = new FormData();
  form.append('name', 'Business Tester');
  form.append('email', 'businesstester1234@example.com');
  form.append('password', 'password123');
  form.append('phone', '1234567890');
  form.append('accountType', 'business');
  form.append('role', 'client');
  form.append('companyName', 'My Business Ltd');

  try {
    const res = await fetch('http://localhost:8000/api/v1/auth/signup', {
      method: 'POST',
      body: form
    });
    const data = await res.json();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}

testSignup();
