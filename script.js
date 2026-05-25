const decodePolyline = (str, precision = 5) => {
    let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change, factor = Math.pow(10, precision);
    while (index < str.length) {
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += latitude_change; lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
};

const formatPace = (totalSeconds, totalMiles) => {
    if (totalMiles === 0) return "0:00 /mi";
    const paceInSeconds = totalSeconds / totalMiles;
    const minutes = Math.floor(paceInSeconds / 60);
    const seconds = Math.round(paceInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds} /mi`;
};

const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

// Global variable to keep track of the modal's map so we can destroy/recreate it
let modalMapInstance = null; 

const openModal = (activity) => {
    const modal = document.getElementById('activity-modal');
    const modalBody = document.getElementById('modal-body');
    
    // Formatting the new data
    const distanceMiles = (activity.distance * 0.000621371).toFixed(2);
    const pace = formatPace(activity.moving_time, activity.distance * 0.000621371);
    const elevationFeet = (activity.total_elevation_gain * 3.28084).toFixed(0); // Convert meters to feet
    const hr = activity.has_heartrate ? Math.round(activity.average_heartrate) + ' bpm' : 'N/A';
    const device = activity.device_name || 'N/A';
    const kudos = activity.kudos_count || 0;
    
    // Inject the content into the modal
    modalBody.innerHTML = `
        <h2 style="color: #fc4c02; margin-top: 0; font-size: 2em;">${activity.name}</h2>
        <p style="color: #888; margin-top: -15px; margin-bottom: 25px;">${new Date(activity.start_date_local).toLocaleString()}</p>
        
        <div class="modal-stats-grid">
            <div class="modal-stat"><h4>Distance</h4><div class="val">${distanceMiles} mi</div></div>
            <div class="modal-stat"><h4>Pace</h4><div class="val">${pace}</div></div>
            <div class="modal-stat"><h4>Elevation</h4><div class="val">${elevationFeet} ft</div></div>
            <div class="modal-stat"><h4>Heart Rate</h4><div class="val">${hr}</div></div>
            <div class="modal-stat"><h4>Kudos</h4><div class="val">${kudos} 👏</div></div>
            <div class="modal-stat"><h4>Device</h4><div class="val" style="font-size: 0.9em; line-height: 1.2; margin-top: 5px;">${device}</div></div>
        </div>
        
        <div id="modal-map" class="modal-map"></div>
    `;
    
    // Trigger the CSS animation to show the modal
    modal.classList.add('show');
    
    // Destroy the old map if it exists, Leaflet breaks if you initialize over an old map
    if (modalMapInstance) { modalMapInstance.remove(); }
    
    // Draw the new map inside the modal
    if (activity.map && activity.map.summary_polyline) {
        const coordinates = decodePolyline(activity.map.summary_polyline);
        modalMapInstance = L.map('modal-map');
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(modalMapInstance);
        
        const polyline = L.polyline(coordinates, { color: '#fc4c02', weight: 5 }).addTo(modalMapInstance);
        
        // CRITICAL FIX: Wait for the CSS transition to finish (300ms) before telling Leaflet to calculate its size!
        setTimeout(() => {
            modalMapInstance.invalidateSize();
            modalMapInstance.fitBounds(polyline.getBounds());
        }, 300);
    } else {
        document.getElementById('modal-map').innerHTML = '<div style="padding: 40px; text-align: center; color: #888;"><em>No GPS data for this activity.</em></div>';
    }
};

// Close modal logic
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('activity-modal').classList.remove('show');
});
document.getElementById('activity-modal').addEventListener('click', (e) => {
    // Only close if they click the blurred background, not the white card itself
    if (e.target.id === 'activity-modal') {
        document.getElementById('activity-modal').classList.remove('show');
    }
});

const displayActivities = (activities) => {
    const container = document.getElementById('strava-data');
    const dashboard = document.getElementById('stats-dashboard');
    container.innerHTML = ''; 

    let totalMiles = 0, totalSeconds = 0, maxDistance = 0, furthestActivity = "N/A";

    activities.forEach(activity => {
        const distanceInMiles = activity.distance * 0.000621371;
        totalMiles += distanceInMiles;
        totalSeconds += activity.moving_time;
        if (distanceInMiles > maxDistance) {
            maxDistance = distanceInMiles;
            furthestActivity = activity.name;
        }
    });

    dashboard.innerHTML = `
        <div class="stat-card"><h4>Total Mileage</h4><div class="val" style="font-size: 1.8em; font-weight: bold;">${totalMiles.toFixed(2)} mi</div></div>
        <div class="stat-card"><h4>Total Time</h4><div class="val" style="font-size: 1.8em; font-weight: bold;">${formatTime(totalSeconds)}</div></div>
        <div class="stat-card"><h4>Avg Pace</h4><div class="val" style="font-size: 1.8em; font-weight: bold;">${formatPace(totalSeconds, totalMiles)}</div></div>
        <div class="stat-card"><h4>Furthest Run</h4><div class="val" style="font-size: 1.2em; font-weight: bold; margin-top: 15px;">${furthestActivity} <br> <span style="font-size: 0.8em; color: #888; font-weight: normal;">(${maxDistance.toFixed(2)} mi)</span></div></div>
    `;

    activities.forEach(activity => {
        const distanceInMiles = (activity.distance * 0.000621371).toFixed(2);
        const pace = formatPace(activity.moving_time, activity.distance * 0.000621371);
        const mapId = `map-${activity.id}`;
        
        const activityDiv = document.createElement('div');
        activityDiv.classList.add('activity');
        
        // NEW: Add click event to open the modal!
        activityDiv.addEventListener('click', () => openModal(activity));
        
        activityDiv.innerHTML = `
            <h3>${activity.name}</h3>
            <div class="activity-stats">
                <span><strong>Distance:</strong> ${distanceInMiles} mi</span>
                <span><strong>Pace:</strong> ${pace}</span>
                <span><strong>Date:</strong> ${new Date(activity.start_date_local).toLocaleDateString()}</span>
            </div>
            <div id="${mapId}" class="map-container"></div>
        `;
        
        container.appendChild(activityDiv);

        if (activity.map && activity.map.summary_polyline) {
            const coordinates = decodePolyline(activity.map.summary_polyline);
            const map = L.map(mapId, { scrollWheelZoom: false, zoomControl: false, dragging: false }); // Locked down the mini-maps so they act like images
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            const polyline = L.polyline(coordinates, { color: '#fc4c02', weight: 3 }).addTo(map);
            map.fitBounds(polyline.getBounds());
        }
    });
};

fetch('activities.json')
.then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
})
.then(data => {
    const updateTime = new Date(data.lastUpdated);
    document.getElementById('last-updated').innerText = `Data last updated: ${updateTime.toLocaleString()}`;
    displayActivities(data.activities);
})
.catch(error => {
    console.error('Error:', error);
    document.getElementById('strava-data').innerHTML = 'Failed to load activities.';
});