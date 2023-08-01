// CSS
import './css/site.css'

import './img/favicon.ico'
import './img/osm.png'
import './css/twemoji.css'

import './img/marker-icon-blue.png'
import './img/marker-icon-red.png'
//import './img/marker-shadow.png'

// bootstrap
import 'bootstrap'

// leaflet
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/images/layers.png';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet'

setupMap();

function setupMap() {
    
    const poiMap = L.map('map')
    .setView([41.69, 12.71], 5);

    const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const osmLayer = L.tileLayer(osmUrl, {
        minZoom: 2,
        maxZoom: 18,
        attribution: "Data &copy; OpenStreetMap contributors"
    }).addTo(poiMap);

    const esriLayer = L.tileLayer(esriUrl, {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    const baseMaps = {
        "Mapnik": osmLayer,
        "Esri WorldImagery": esriLayer
    };

    L.control.layers(baseMaps).addTo(poiMap);

    const blueMarker = new L.Icon({
        iconUrl: './img/marker-icon-blue.png',
        shadowUrl: './img/marker-shadow.png'
        
    });

    const redMarker = new L.Icon({
        iconUrl: './img/marker-icon-red.png',
        shadowUrl: './img/marker-shadow.png'
    });

    const poiMarker = L.marker([41.69, 12.71], {
        icon: blueMarker,
        draggable: true
    }).addTo(poiMap);
    poiMarker.setOpacity(1);
}
