const fs = require('fs');

// Pull secrets from GitHub Actions environment
const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;
const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

async function getStravaData() {
    try {
        // 1. Exchange refresh token for a brand new access token
        const tokenResponse = await fetch(`https://www.strava.com/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
const accessToken = tokenData.access_token;

        // NEW: Calculate the timestamp for exactly 7 days ago (in seconds)
        const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

        // 2. Fetch activities using the 'after' parameter (grabbing up to 100 just in case you had a crazy week!)
        const activitiesResponse = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${sevenDaysAgo}&per_page=100`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        const activitiesData = await activitiesResponse.json();

        if (!activitiesResponse.ok) {
            console.error('🚨 Failed to fetch activities. Strava responded with:', activitiesData);
            process.exit(1); 
        }

        // NEW: Wrap the data in an object that includes the current time
        const finalOutput = {
            lastUpdated: new Date().toISOString(),
            activities: activitiesData
        };

        // 3. Save the structured data to a static JSON file
        fs.writeFileSync('activities.json', JSON.stringify(finalOutput, null, 2));
        console.log('✅ Successfully saved activities.json');

    } catch (error) {
        console.error('🚨 Script crashed:', error);
        process.exit(1); 
    }
}

getStravaData();