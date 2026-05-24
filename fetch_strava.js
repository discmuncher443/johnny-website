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

        // 2. Use the new access token to fetch your latest activities
        const activitiesResponse = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=7`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const activitiesData = await activitiesResponse.json();

        // 3. Save the data to a static JSON file
        fs.writeFileSync('activities.json', JSON.stringify(activitiesData, null, 2));
        console.log('Successfully saved activities.json');

    } catch (error) {
        console.error('Error fetching Strava data:', error);
        process.exit(1); // Fail the GitHub Action if something goes wrong
    }
}

getStravaData();