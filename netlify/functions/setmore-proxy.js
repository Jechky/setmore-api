const API_BASE = 'https://developer.setmore.com/api/v1';
let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
    if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
        return cachedToken;
    }
    const refreshToken = process.env.SETMORE_REFRESH_TOKEN || 'r1/631183ee73wxv92vcd8HrD5T1Klp83Hc51Hd1a4AQvbgr';
    try {
        const response = await fetch(`${API_BASE}/o/oauth2/token?refreshToken=${refreshToken}`);
        const data = await response.json();
        if (data.response && data.data && data.data.token) {
            cachedToken = data.data.token.access_token;
            tokenExpiry = new Date(Date.now() + (data.data.token.expires_in - 300) * 1000);
            return cachedToken;
        }
        throw new Error('Failed to get token');
    } catch (error) {
        throw error;
    }
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Content-Type': 'application/json'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    
    try {
        const path = event.path.replace('/.netlify/functions/setmore-proxy', '') || '/';
        const token = await getAccessToken();
        
        if (!path || path === '/') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: 'ok', hasToken: !!token })
            };
        }
        
        const apiUrl = `${API_BASE}/bookingapi${path}`;
        const fetchOptions = {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (event.body) {
            fetchOptions.body = event.body;
        }
        
        const response = await fetch(apiUrl, fetchOptions);
        const data = await response.json();
        
        return {
            statusCode: response.status,
            headers,
            body: JSON.stringify(data)
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
