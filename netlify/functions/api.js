exports.handler = async (event) => {
    const REFRESH_TOKEN = 'r1/631183ee73wxv92vcd8HrD5T1Klp83Hc51Hd1a4AQvbgr';
    const API_BASE = 'https://developer.setmore.com/api/v1';
    const DEFAULT_STAFF = 'fc96bd97-461f-424c-a08b-9adb2533e5e9'; // Dein Staff Key
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };
    
    try {
        const tokenRes = await fetch(`${API_BASE}/o/oauth2/token?refreshToken=${REFRESH_TOKEN}`);
        const tokenData = await tokenRes.json();
        const token = tokenData.data.token.access_token;
        
        const path = event.path.replace('/.netlify/functions/api', '');
        
        if (!path || path === '/') {
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({status: 'ok', token, staff: DEFAULT_STAFF}) 
            };
        }
        
        const apiRes = await fetch(`${API_BASE}/bookingapi${path}`, {
            method: event.httpMethod,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: event.httpMethod !== 'GET' ? event.body : undefined
        });
        
        const data = await apiRes.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
        
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({error: error.message}) };
    }
};
