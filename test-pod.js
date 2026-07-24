async function test() {
  try {
    const res = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operations@example.com',
        password: 'password123'
      })
    });
    const data = await res.json();
    const token = data.token || data.data.token;
    
    console.log("Logged in!");
    
    const podRes = await fetch('http://localhost:8000/api/missions/5/pod', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        receiverName: 'System Verified',
        remarks: 'Testing POD API'
      })
    });
    const podData = await podRes.json();
    console.log("POD Status:", podRes.status);
    console.log("POD Response:", podData);
  } catch (err) {
    console.error("POD Error:", err);
  }
}

test();
