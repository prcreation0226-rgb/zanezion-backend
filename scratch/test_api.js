import axios from 'axios';

async function testPost() {
    try {
        const loginRes = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
            email: 'viratkholi@example.com', password: 'password123' 
        });
        const loginData = loginRes.data;
        
        if (!loginData.success) {
            console.log("Login failed:", loginData);
            return;
        }

        const token = loginData.data.token;

        const payload = {
            orderId: null,
            clientId: 51,
            missionType: "Delivery",
            transportMode: "Road",
            items: [
                {
                    id: "uuid-123",
                    name: "Asset",
                    qty: 1,
                    orderItemId: null,
                    itemId: 1
                }
            ]
        };

        const res = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/deliveries', payload, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Response:", res.data);
    } catch (err) {
        console.error("ERROR:");
        console.error(err);
    }
}
testPost();
