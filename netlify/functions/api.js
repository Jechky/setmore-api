exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };
    
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    try {
        const REFRESH_TOKEN = 'r1/631183ee73wxv92vcd8HrD5T1Klp83Hc51Hd1a4AQvbgr';
        const API_BASE = 'https://developer.setmore.com/api/v1';
        
        // Get token
        const tokenRes = await fetch(`${API_BASE}/o/oauth2/token?refreshToken=${REFRESH_TOKEN}`);
        const tokenData = await tokenRes.json();
        const token = tokenData.data.token.access_token;
        
        // Get path
        const path = event.path.replace('/.netlify/functions/api', '');
        
        // Root endpoint
        if (!path || path === '/') {
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({status: 'ok', token}) 
            };
        }
        
        // Proxy to Setmore
        const fetchOptions = {
            method: event.httpMethod,
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            }
        };
        
        // Only add body for POST/PUT requests
        if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body) {
            fetchOptions.body = event.body;
        }
        
        const apiRes = await fetch(`${API_BASE}/bookingapi${path}`, fetchOptions);
        const data = await apiRes.json();
        
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify(data) 
        };
        
    } catch (error) {
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({error: error.message}) 
        };
    }
};