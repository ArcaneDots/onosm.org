/**
 * Nominatim address 
 * 
 * https://nominatim.org/release-docs/develop/api/Output/#json
 * 
 * @typedef {object} NominatimAddress
 * @property {universalCoordinates} centerPoint
 * @property {number[]} boundingbox  Array of bounding indexes [x1, x2, y1, y2]
 * @property {number[]} bounds Array of bounding points [NE, SW]
 * @property {string{}} address Map of OSM address key:values
 * @property {string} class Result type
 * @property {display_name} display_name Array of OSM address vales
 * @property {number} importance decimal value
 * @property {string} lat latitude
 * @property {string} lon longitude
 * @property {string} license data license note: OSM - ODBL, OHM - CC0
 * @property {nameDetails} osm_details Details
 * @property {number} osm_id id of returned OSM object
 * @property {string} osm_type type of returned OSM object key
 * @property {string} type value of osm_type (osm_type=type)
 * @property {number} place_id id of related OSM place object
 */

/**
 * @typedef {object} nameDetails specific data  
 * @property {object}additional key:value object
*/

/**
 * @typedef {object} errorObject
 * @param {errorObject & {lat: number}} lat
 */

/**
 * Nominatim lookup response promise object
 * @typedef {Promise.<Array.<NominatimAddress>>} NominatimResponse
 */

/**
 * @typedef {Object.<string, any>} universalCoordinates
 * @param {universalCoordinates & {lat: number}} lat
 * @param {universalCoordinates & {lng: number}} lng
 * @param {universalCoordinates & {lot: number}} lon
 */

/**
 * List of string values describing an address
 * @typedef {string[]} display_name i.e. 1313, Mockingbird Lane, Mockingbird Heights
 */

//jquery version exposes i18next object for translations
var i18n = i18next;

var successString, manualPosition, loadingText, modalText;

/**
 * @type {NominatimAddress}
 */
let activeSearchAddress = null;
/**
 * @type {universalCoordinates}
 */
let dragStartLocation = undefined;

const circleRadiusMeters = 50;

function reloadLists(language) {

  $.getJSON('./locales/' + language + '/categories.json')
    .success(function (data) {
      category_data = data;
    })
    .fail(function () {
      // 404? Fall back to en-US
      $.getJSON('./locales/en-US/categories.json')
      .success(function (data) {
        category_data = data;
      });
    });

  $.getJSON('./locales/' + language + '/payment.json').success(function (data) {
    payment_data = data;
  });

  $('#category').children().remove().end();
  $("#category").select2({
    query: function (query) {
      var data = {
        results: []
      },
        i;
      for (i = 0; i < category_data.length; i++) {
        if (query.term.length === 0 || category_data[i].toLowerCase().indexOf(query.term.toLowerCase()) >= 0) {
          data.results.push({
            id: category_data[i],
            text: category_data[i]
          });
        }
      }
      query.callback(data);
    }
  });

  $('#payment').children().remove().end();
  $("#payment").select2({
    multiple: true,
    query: function (query) {
      var data = {
        results: []
      };
      data.results = payment_data;
      query.callback(data);
    }
  });
}

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

// Step change

$(window).on('hashchange', function () {
  if (location.hash == '#details') {
    $('#collect-data-step').removeClass('d-none');
    $('#address-step').addClass('d-none');
    $('#confirm-step').addClass('d-none');
    $('#step2').addClass('active bg-success');
    $('#step3').removeClass('active bg-success');
  } else if (location.hash == '#done') {
    $('#confirm-step').removeClass('d-none');
    $('#collect-data-step').addClass('d-none');
    $('#address-step').addClass('d-none');
    $('#step3').addClass('active bg-success');
    //confetti.start(1000);
  } else {
    $('#address-step').removeClass('d-none');
    $('#collect-data-step').addClass('d-none');
    $('#confirm-step').addClass('d-none');
    $('#step2').removeClass('active bg-success');
    $('#step3').removeClass('active bg-success');
  }
  findme_map.invalidateSize();
});

// Disables the input if delivery is not checked
$('#delivery-check').prop('indeterminate', true);
$(function () { deliveryCheck(); $("#delivery-check").click(deliveryCheck); });
function deliveryCheck() { if (this.checked) { enableDelivery(); } else { disableDelivery(); } }

function disableDelivery() { $("#delivery").attr("disabled", true); $("#delivery_description").attr("disabled", true); $("#label-delivery-check").html(i18n.t('step2.no')); }
function enableDelivery() { $("#delivery").removeAttr("disabled"); $("#delivery_description").removeAttr("disabled"); $("#label-delivery-check").html(i18n.t('step2.yes')); }

function getNoteBody() {
  var paymentIds = [],
    paymentTexts = [];
  $.each($("#payment").select2("data"), function (_, e) {
    paymentIds.push(e.id);
    paymentTexts.push(e.text);
  });


  // add back translation of note header
  
  var note_body = "onosm.org submitted note from a business:\n";
  if ($("#name").val()) note_body += i18n.t('step2.name') + ": " + $("#name").val() + "\n";
  if ($("#hnumberalt").val()) note_body += "addr:housenumber=" + $("#hnumberalt").val() + "\n";
  if ($("#addressalt").val()) note_body += "addr:street=" + $("#addressalt").val() + "\n";
  if ($("#city").val()) note_body += "addr:city=" + $("#city").val() + "\n";
  if ($("#postcode").val()) note_body += "addr:postcode=" + $("#postcode").val() + "\n";
  if ($("#phone").val()) note_body += i18n.t('step2.phone') + ": " + $("#phone").val() + "\n";
  // fixme - this should be default to an empty string or be escaped
  if ($("#website").val()) note_body += i18n.t('step2.website') + ": " + $("#website").val() + "\n";
  if ($("#social").val()) note_body += i18n.t('step2.social') + ": " + $("#social").val() + "\n";
  if ($("#opening_hours").val()) note_body += i18n.t('step2.opening') + ": " + $("#opening_hours").val() + "\n";
  if ($("#wheel").val()) note_body += i18n.t('step2.wheel') + ": " + $("#wheel").val() + "\n";
  if ($("#category").val()) note_body += i18n.t('step2.catlabel') + ": " + $("#category").val() + "\n";
  if ($("#categoryalt").val()) note_body += i18n.t('step2.cataltdesc') + ": " + $("#categoryalt").val() + "\n";
  if (paymentIds) note_body += i18n.t('step2.payment') + ": " + paymentTexts.join(",") + "\n";
 
  if ($("input:checked[name=delivery-check]").val() && $("#delivery").val() != "") note_body += " delivery=" + $("#delivery").val() + "\n"; else if ($("input:checked[name=delivery-check]").val() && $("#delivery").val() == "") note_body += "delivery=yes" + "\n"; else if ($('#delivery-check').not(':indeterminate') == true) note_body += "delivery=no" + "\n";
  if ($("#delivery_description").val()) note_body += "delivery:description=" + $("#delivery_description").val() + "\n";
 
  if ($("input:checked[name=takeaway]").val() != "undefined") note_body += "takeaway=" + $("input:checked[name=takeaway]").val() + "\n";
  if ($("#takeaway_description").val()) note_body += "takeaway:description=" + $("#takeaway_description").val() + "\n";
  if ($("input:checked[name=takeaway_covid]").val() == "yes" || $("input:checked[name=takeaway_covid]").val() == "only") note_body += "takeaway:covid19=" + $("input:checked[name=takeaway_covid]").val() + "\n";
 
  if ($("input:checked[name=delivery_covid]").val() === 'Y') note_body += "delivery:covid19=yes\n";
  if ($("#delivery_covid_description").val() || $("#takeaway_covid_description").val()) note_body += "description:covid19=";
  if ($("#delivery_covid_description").val()) note_body += $("#delivery_covid_description").val() + " ";
  if ($("#takeaway_covid_description").val()) note_body += $("#takeaway_covid_description").val() + "\n";
  return note_body;
}

$("#collect-data-done").click(function () {

  location.hash = '#done';

  var latlon = findme_marker.getLatLng(),
    qwarg = {
      lat: latlon.lat,
      lon: latlon.lng,
      text: getNoteBody()
    };

  $.post('https://api.openstreetmap.org/api/0.6/notes.json', qwarg, function (data) {
    // console.log(data);
    var noteId = data.properties.id;
    var link = 'https://openstreetmap.org/?note=' + noteId + '#map=19/' + latlon.lat + '/' + latlon.lng + '&layers=N';
    $("#linkcoords").append('<div class="mt-3 h4"><a href="' + link + '">' + link + '</a></div>');
  });
});

function clearFields() {
  $("#form")[0].reset();
  $("#address").val("");
  $("#category").select2("val", "");
  $("#payment").select2("val", "");
  $('#delivery-check').val("");
  $('#delivery-check').prop('indeterminate', true);
  disableDelivery();
}
