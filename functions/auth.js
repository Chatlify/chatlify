const { createClient } = require('@supabase/supabase-js');

// Çevre değişkenlerinden Supabase bilgilerini al
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Sadece sunucu tarafında çalışan Supabase istemcisi
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async function (event, context) {
    // CORS başlıklarını ayarla
    const headers = {
        'Access-Control-Allow-Origin': 'https://chatlify-demo.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS isteği için CORS yanıtı
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // POST metodu kontrolü
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const payload = JSON.parse(event.body);
        const { action, email, password, username } = payload;

        // İstek tipine göre işlem yap
        switch (action) {
            case 'signup':
                const { data: signupData, error: signupError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username }
                    }
                });

                if (signupError) throw signupError;

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, data: signupData })
                };

            case 'login':
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (loginError) throw loginError;

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, data: loginData })
                };

            case 'logout':
                const { error: logoutError } = await supabase.auth.signOut();

                if (logoutError) throw logoutError;

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true })
                };

            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }
    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Server Error',
                message: error.message
            })
        };
    }
}; 