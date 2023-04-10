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
const findme_map = L.map('findme-map')
  .setView([41.69, 12.71], 5),
  osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  osm = L.tileLayer(osmUrl, {
    minZoom: 2,
    maxZoom: 18,
    attribution: "Data &copy; OpenStreetMap contributors"
  }).addTo(findme_map),
  esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });

const baseMaps = {
  "Mapnik": osm,
  "Esri WorldImagery": esri
};

L.control.layers(baseMaps).addTo(findme_map);

var category_data = [];
var payment_data = [];

const findme_marker = L.marker([41.69, 12.71], {
  draggable: true
}).addTo(findme_map);
findme_marker.setOpacity(0);

L.control.locate({
  follow: true
}).addTo(findme_map);

let findme_circle = null;
let findme_rectangle = null;

if (location.hash) location.hash = '';

/**
 * user search event: action
 * @param {Object} submit event object
 * 
 * Use content of address_to_find input element as search terms
 */
$("#find").submit(function (e) {
  e.preventDefault();
  $("#couldnt-find").hide();

  const address_to_find = $("#address").val();
  if (address_to_find.length === 0) return;

  // show loading indicator 
  $("#findme h4").text(loadingText);
  $("#findme").addClass("progress-bar progress-bar-striped progress-bar-animated");

  nominatimSearchAddress(address_to_find)
  .then(result => {    
    activeSearchAddress = parseNominatimData(result);
    
    updateHtmlWithAddressInfo(activeSearchAddress);
        
    findme_marker.setOpacity(1);
    findme_marker.setLatLng(activeSearchAddress.centerPoint);
         
    // delete previously created geo-fencing regions
    if (findme_rectangle != null) {
      findme_rectangle.remove();
      findme_rectangle = null;
    } 
    else if (findme_circle != null) {
      findme_circle.remove();
      findme_circle = null;
    }

    // adjusted circle center to match search results
    findme_circle = new L.circle(activeSearchAddress.centerPoint)
    .addTo(findme_map)
    .setRadius(circleRadiusMeters)
    .setStyle({ opacity: 0 });
    
    if (findme_circle.getBounds().contains(activeSearchAddress.bounds)) {
      // show circle bounding box on map
      findme_circle.setStyle({ opacity: 1 });
      
    } else {      
      // add bounding box to map
      findme_rectangle = new L.rectangle(activeSearchAddress.bounds)
        .addTo(findme_map);
    }
    
    // recenter map on found address
    findme_map.fitBounds(activeSearchAddress.bounds);                                                                
  })

  .catch(e => {
    $("#couldnt-find").show();
    $("#map-information").hide();
    $("#address").addClass("is-invalid");
    $("#address").removeClass("is-valid");

    console.error(`Couldn't find address due to error: ${e.message}`);
  })

  .finally(() => {
    // stop loading animation
    $("#findme").removeClass("progress-bar progress-bar-striped progress-bar-animated");
  }); 
});

/**
 * Save position at the beginning of drag event
 * @param {Object} drag_event
 */
findme_marker.on('dragstart', function (dragged_event) {
  dragStartLocation = getUniversalLocation(dragged_event.target._latlng);
});

/**
 * Geo-fence marker to the bounded region (Marker "drag" event)
 * @param {Object} drag_event
 */
findme_marker.on('drag', function(drag_event) {

  const dragMarkerLocation = drag_event.latlng 
  const activeRegion = findme_rectangle !== null ? findme_rectangle : findme_circle;
  
  if (!activeRegion.getBounds().contains(dragMarkerLocation) ){
    findme_marker.setLatLng(dragStartLocation);
  }  
});

/**
 * Validate new marker location (Marker "drag ended" event)
 * @param {Object} dragged_event
 */
findme_marker.on('dragend', function (dragged_event) {

  // update marker position after drag event 
  const dragEndLocation = getUniversalLocation(dragged_event.target._latlng);

  // drag event was cancelled
  if (dragStartLocation === dragEndLocation) {
    return;
  }
  
  if (!findme_rectangle) {
    // use Circle region
    
    if (!findme_circle) {
      console.error("unable to check bounds due to missing circle region")      
    }
    
    else if (findme_circle.getBounds().contains(dragEndLocation)) {
      // save new valid marker position
      findme_marker.setLatLng(dragEndLocation);
    }

    return;
  }
  
  // show loading animation
  $("#findme h4").text(loadingText);
  $("#findme").addClass("progress-bar progress-bar-striped progress-bar-animated");
      
  // validate marker new location using data from Nominatim reverse lookup

  /** 
   * @type {universalCoordinates} 
   */
  let finalMarkerPositionLatLng = dragEndLocation;  
 
  nominatimReverseLookup(dragEndLocation)
    .then(result => {
      const nearByAddress = parseNominatimData(result);
      
      if (!nearByAddress.bounds.contains(finalMarkerPositionLatLng)) {
        console.info(`User location is outside Nominatim bounding box: ${dragEndLocation}`);

        if (findme_rectangle.getBounds().contains(nearByAddress.centerPoint)) {
          finalMarkerPositionLatLng = nearByAddress.centerPoint
        }

        else {
          console.info(`Nominatim point is outside original bounding box: ${nearByAddress.centerPoint}`);
          finalMarkerPositionLatLng = undefined;
        }
      }
      
      $("#map-information").html(manualPosition);
      $("#map-information").show();
      $('.step-2 a').attr('href', '#details');
      $('#step2').removeClass("disabled");
      $('#continue').removeClass("disabled");
    })

    .catch(err => {

      if (err) {
        if (err.error) { console.error("error: " + err.error); }
        else {
          console.error("error: " + err);
        }
      }
      else {
        $("#couldnt-find").show();
        $("#map-information").hide();
      }
      
      finalMarkerPositionLatLng = undefined;
    })

    .finally(() => {
      // stop loading animation
      $("#findme").removeClass("progress-bar progress-bar-striped progress-bar-animated");

      if (finalMarkerPositionLatLng === undefined) {
        console.warn("drag-end has been canceled");
        return
      }

      // place marker to initial position
      findme_marker.setLatLng(finalMarkerPositionLatLng);

      // recenter map on original search location to deter map drifting too much
      findme_map.panTo(findme_marker.getLatLng());
    });
});

/**
 * Update address related HTML input fields
 * @param {NominatimAddress} nominatimAddressData 
 */
function updateHtmlWithAddressInfo(nominatimAddressData) {

  $('.step-2 a').attr('href', '#details');
  $('#step2').removeClass("disabled");
  $('#continue').removeClass("disabled");
  
  $('#addressalt').val(nominatimAddressData.address.road);
  $('#hnumberalt').val(nominatimAddressData.address.house_number);
  $('#city').val(nominatimAddressData.address.village || nominatimAddressData.address.town || nominatimAddressData.address.city);
  $('#postcode').val(nominatimAddressData.address.postcode);
  $("#address").val(nominatimAddressData.display_name);
  $("#map-information").html(successString);
  $("#map-information").show();
  if (!nominatimAddressData.address.house_number) {
    $("#map-information").append('<hr> <i class="twa twa-warning"></i> ' + i18n.t('step1.nohousenumber'));
  }

  $("#address").addClass("is-valid");
  $("#address").removeClass("is-invalid");
}

/**
 * @param {display_name} address_to_find 
 * @returns {NominatimResponse}
 */
function nominatimSearchAddress(address_to_find) {

  // setup callback
  const qwArgNominatim = {
      format: 'json',
      q: address_to_find,
      addressdetails: 1,
      namedetails: 1
  };

  const addressSearchUrl = "https://nominatim.openstreetmap.org/search?" + $.param(qwArgNominatim);

  // handle request - should include a timeout 
  return new Promise((resolve, reject) => {
      $.ajax({
          'url': addressSearchUrl,
        'success': function (data) {
          // geocode error - sends error message for ocean coordinates
          const dataError = data.error;
          if (dataError !== undefined) {
            return reject(data);
          }

          // address search lookup results array of top matches
          if (!Array.isArray(data) ||
            (data.length < 1) ||
            (data[0] === undefined)) {
            return reject({});
          }

          // found the address
          resolve(data[0]);
        },
        'error': function (error) {
          reject(error);
        },
        'dataType': 'jsonp',
        'jsonp': 'json_callback'
      });
  });
}

/** 
 * @param {universalCoordinates} position 
 * @returns {NominatimResponse}
 */
function nominatimReverseLookup(position) {
  const latitude = position.lat;
  const longitude = position.lon;
       
  /* NOMINATIM PARAM */
  const qwArgNominatim = {
      format: 'json',
      lat: latitude,
      lon: longitude,
      addressdetails: 1,
      namedetails: 1
  };

  const reverseSearchUrl = "https://nominatim.openstreetmap.org/reverse?" + $.param(qwArgNominatim);


  return new Promise((resolve, reject) => {
      $.ajax({
          'url': reverseSearchUrl,
          'success': function (data) {              
              // geocode error - sends error message for ocean coordinates
              const dataError = data.error;
              if (dataError !== undefined) {
                return reject(data);
              }

              // reverse lookup should return one address
              if (data == null) {
                  return reject({});
              }
              resolve(data);
          },
          'error': function (error) {
              reject(error);
          },
          'dataType': 'jsonp',
          'jsonp': 'json_callback'
      });
  });
}

/**
 * Create a JS object from Nominatim JSON object
 * 
 * @param {object} validDataObject nominatim data
 * @returns {NominatimAddress} object initialized with Nominatim data
 */
function parseNominatimData(validDataObject) {
  
  validDataObject.centerPoint = getUniversalLocation({
      lon: validDataObject.lon,
      lat: validDataObject.lat
  });

  const boundedData = new L.LatLngBounds(
    [
      [+validDataObject.boundingbox[0], +validDataObject.boundingbox[2]],
      [+validDataObject.boundingbox[1], +validDataObject.boundingbox[3]]
    ]);
    
  validDataObject.bounds = boundedData;

  return validDataObject;
}

/**
 * Convert [lat, lon|lng] to [lat, (Nominatim)lon, (Leaflet)lng]
 * 
 * @param {Number[]} locationLatLng Map of [lat, lon|lng]
 * @return {universalCoordinates} Map of [lat, lng, lon]
 */
function getUniversalLocation(locationLatLng) {
  if (typeof (locationLatLng) == "object") {
    return {
      lat: Number(locationLatLng.lat),
      lng: locationLatLng.lon ? Number(locationLatLng.lon) : Number(locationLatLng.lng),
      lon: locationLatLng.lon ? Number(locationLatLng.lon) : Number(locationLatLng.lng)
    };
  }
  return { lat: 0, lon: 0, lng: 0 };
}
