// Look for the local file created by GitHub Actions instead of the Strava API
const url = 'activities.json';

// Fetch data from the local file
fetch(url)
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
})
.then(data => {
    displayActivities(data);
})
.catch(error => {
    console.error('Error fetching Strava data:', error);
    document.getElementById('strava-data').innerHTML = 'Failed to load activities.';
});