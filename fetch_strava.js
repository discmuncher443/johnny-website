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

        // NEW: Get the current date locked to US Eastern Time
        const easternTimeStr = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
        const targetDate = new Date(easternTimeStr);

        // Go back 6 days to create a 7-day window (e.g., Monday back to Tuesday)
        targetDate.setDate(targetDate.getDate() - 6);

        // Set the time to exactly 12:00:00 AM local time
        targetDate.setHours(0, 0, 0, 0);

        // Convert to Unix Epoch Timestamp (in seconds) for Strava
        const startOfWindow = Math.floor(targetDate.getTime() / 1000);

        // 2. Fetch activities using our new precise 'startOfWindow' timestamp
        const activitiesResponse = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${startOfWindow}&per_page=100`, {
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