exports.handler = async (event) => {
    // Configuration
    const REFRESH_TOKEN = 'r1/631183ee73wxv92vcd8HrD5T1Klp83Hc51Hd1a4AQvbgr';
    const API_BASE = 'https://developer.setmore.com/api/v1';
    const DEFAULT_STAFF = 'fc96bd97-461f-424c-a08b-9adb2533e5e9';
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }
    
    try {
        // Get access token
        const tokenRes = await fetch(`${API_BASE}/o/oauth2/token?refreshToken=${REFRESH_TOKEN}`);
        const tokenData = await tokenRes.json();
        
        if (!tokenData.response || !tokenData.data || !tokenData.data.token) {
            throw new Error('Failed to get access token');
        }
        
        const token = tokenData.data.token.access_token;
        
        // Extract path from request
        const path = event.path.replace('/.netlify/functions/setmore-proxy', '');
        
        // Return status if no specific path
        if (!path || path === '/') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: 'ok',
                    token,
                    staff: DEFAULT_STAFF
                })
            };
        }
        
        // Prepare API request
        const apiUrl = `${API_BASE}/bookingapi${path}`;
        const apiOptions = {
            method: event.httpMethod,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        // Add body for POST requests
        if (event.httpMethod === 'POST' && event.body) {
            apiOptions.body = event.body;
        }
        
        // Make API request
        const apiRes = await fetch(apiUrl, apiOptions);
        const apiData = await apiRes.json();
        
        // Convert time slots to 12-hour format
        if (path === '/slots' && apiData.response && Array.isArray(apiData.data)) {
            const convertTo12Hour = (time24) => {
                if (!time24 || !time24.includes(':')) {
                    return time24;
                }
                
                const [hours, minutes] = time24.split(':');
                const hour24 = parseInt(hours);
                const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                const period = hour24 >= 12 ? 'PM' : 'AM';
                
                return `${hour12}:${minutes} ${period}`;
            };
            
            apiData.data = apiData.data.map(convertTo12Hour);
        }
        
        // Return API response
        return {
            statusCode: apiRes.status,
            headers,
            body: JSON.stringify(apiData)
        };
        
    } catch (error) {
        console.error('Proxy Error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
