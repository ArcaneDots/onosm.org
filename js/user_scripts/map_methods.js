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

  const addressSearchUrl = `https://nominatim.openstreetmap.org/search?${$.param(qwArgNominatim)}`;

  // handle request - should include a timeout 
  return new Promise((resolve, reject) => {
    axios.get(addressSearchUrl)
      .then(function (response) {

        // geocode error - sends error message for ocean coordinates
        if (response.error !== undefined) {
          return reject(response.error);
        }

        // address search lookup results array of top matches
        if (!Array.isArray(response.data) ||
          (response.data.length < 1) ||
          (response.data[0] === undefined)) {
          return reject({});
        }

        // found the address
        resolve(response.data[0]);
      })
      .catch(function (error) {
        reject(error);
      })
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

  const reverseSearchUrl = `https://nominatim.openstreetmap.org/reverse?${$.param(qwArgNominatim)}`;


  return new Promise((resolve, reject) => {
    axios.get(reverseSearchUrl)
      .then((response) => {
        // geocode error - sends error message for ocean coordinates
        if (response.error !== undefined) {
          return reject(response.error);
        }

        // reverse lookup should return one address
        if (response.data == null) {
          return reject({});
        }
        resolve(response.data);
      })
      .catch((error) =>
        reject(error)
      )
  });
}

function osmPostNote(poiLatLon, note_body) {

  const qwArg = {
    lat: poiLatLon.lat,
    lon: poiLatLon.lng,
    text: note_body
  };

  $.post('https://api.openstreetmap.org/api/0.6/notes.json', qwArg, (data) => {
    // console.log(data);
    const noteId = data.properties.id;
    const link = `https://openstreetmap.org/?note=${noteId}#map=19/${poiLatLon.lat}/${poiLatLon.lng}&layers=N`;
    $("#linkcoords").append(`<div class="mt-3 h4"><a href="${link}">${link}</a></div>`);
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
 * @param {universalCoordinates} position 
 */
function displayPosition(position){
  return `@ lat:${position.lat} lon:${position.lon}`;
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
