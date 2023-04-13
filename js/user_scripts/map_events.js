/**
 * @type {NominatimAddress}
 */
let activeSearchAddress = null;
/**
 * @type {universalCoordinates}
 */
let dragStartLocation = undefined;

const circleRadiusMeters = 50;

/* HERE BE DRAGONS */
const poiMap = L.map('findme-map')
  .setView([41.69, 12.71], 5),
  osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  osm = L.tileLayer(osmUrl, {
    minZoom: 2,
    maxZoom: 18,
    attribution: "Data &copy; OpenStreetMap contributors"
  }).addTo(poiMap),
  esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

const baseMaps = {
  "Mapnik": osm,
  "Esri WorldImagery": esri
};

L.control.layers(baseMaps).addTo(poiMap);

const poiMarker = L.marker([41.69, 12.71], {
  draggable: true
}).addTo(poiMap);
poiMarker.setOpacity(0);

L.control.locate({
  follow: true
}).addTo(poiMap);

let poiCircle = null;
let poiRectangle = null;

if (location.hash) location.hash = '';

/**
 * user search event: action
 * @param {Object} submit event object
 * 
 * Use content of address_to_find input element as search terms
 */
$("#find").submit((e) => {
  e.preventDefault();
  hideHtmlAddressNotFoundMsg();

  const address_to_find = $("#address").val();
  if (address_to_find.length === 0) return;

  startHtmlLoadingAnimation();

  nominatimSearchAddress(address_to_find)
  .then(result => {    
    activeSearchAddress = parseNominatimData(result);
    
    updateHtmlWithAddressInfo(activeSearchAddress);
        
    poiMarker.setOpacity(1);
    poiMarker.setLatLng(activeSearchAddress.centerPoint);
         
    // delete previously created geo-fencing regions
    if (poiRectangle != null) {
      poiRectangle.remove();
      poiRectangle = null;
    } 
    else if (poiCircle != null) {
      poiCircle.remove();
      poiCircle = null;
    }

    // adjusted circle center to match search results
    poiCircle = new L.circle(activeSearchAddress.centerPoint)
    .addTo(poiMap)
    .setRadius(circleRadiusMeters)
    .setStyle({ opacity: 0 });
    
    if (poiCircle.getBounds().contains(activeSearchAddress.bounds)) {
      // show circle bounding box on map
      poiCircle.setStyle({ opacity: 1 });
      
    } else {      
      // add bounding box to map
      poiRectangle = new L.rectangle(activeSearchAddress.bounds)
        .addTo(poiMap);
    }
    
    // recenter map on found address
    poiMap.fitBounds(activeSearchAddress.bounds);                                                                
  })

  .catch(e => {
    showHtmlInvalidAddressMsg();

    console.error(`Couldn't find address due to error: ${e.message}`);
  })

  .finally(() => {
    stopHtmlLoadingAnimation();
  }); 
});

/**
 * Save position at the beginning of drag event
 * @param {Object} drag_event
 */
poiMarker.on('dragstart', (dragged_event) => {
        dragStartLocation = getUniversalLocation(dragged_event.target._latlng);
    });

/**
 * Geo-fence marker to the bounded region (Marker "drag" event)
 * @param {Object} drag_event
 */
poiMarker.on('drag', (drag_event) => {

  const dragMarkerLocation = drag_event.latlng 
  const activeRegion = poiRectangle !== null ? poiRectangle : poiCircle;
  
  if (!activeRegion.getBounds().contains(dragMarkerLocation) ){
    poiMarker.setLatLng(dragStartLocation);
  }  
});

/**
 * Validate new marker location (Marker "drag ended" event)
 * @param {Object} dragged_event
 */
poiMarker.on('dragend', (dragged_event) => {

  // update marker position after drag event 
  const dragEndLocation = getUniversalLocation(dragged_event.target._latlng);

  // drag event was cancelled
  if (dragStartLocation === dragEndLocation) {
    return;
  }
  
  if (!poiRectangle) {
    // use Circle region
    
    if (!poiCircle) {
      console.error("unable to check bounds due to missing circle region")      
    }
    
    else if (poiCircle.getBounds().contains(dragEndLocation)) {
      // save new valid marker position
      poiMarker.setLatLng(dragEndLocation);
    }

    return;
  } 
        
  // validate marker new location using data from Nominatim reverse lookup

  /** 
   * @type {universalCoordinates} 
   */
  let finalMarkerPositionLatLng = dragEndLocation;  
 
  startHtmlLoadingAnimation();

  nominatimReverseLookup(dragEndLocation)
    .then(result => {
      const nearByAddress = parseNominatimData(result);
      
      if (!nearByAddress.bounds.contains(finalMarkerPositionLatLng)) {
        console.info(`User location is outside Nominatim bounding box: ${dragEndLocation}`);

        if (poiRectangle.getBounds().contains(nearByAddress.centerPoint)) {
          finalMarkerPositionLatLng = nearByAddress.centerPoint
        }

        else {
          console.info(`Nominatim point is outside original bounding box: ${nearByAddress.centerPoint}`);
          finalMarkerPositionLatLng = undefined;
        }
      }
      
      showHtmlMapInfo();
      showHtmlAllowDetails();
    })

    .catch(err => {

      if (err) {
        if (err.error) { console.error("error: " + err.error); }
        else {
          console.error("error: " + err);
        }
      }
      else {
        showHtmlAddressNotFoundMsg();
        hideHtmlMapMsg();
      }
      
      finalMarkerPositionLatLng = undefined;
    })

    .finally(() => {
      stopHtmlLoadingAnimation();

      if (finalMarkerPositionLatLng === undefined) {
        console.warn("drag-end has been canceled");
        return
      }

      // place marker to initial position
      poiMarker.setLatLng(finalMarkerPositionLatLng);

      // recenter map on original search location to deter map drifting too much
      poiMap.panTo(poiMarker.getLatLng());
    });
});

