//jquery version exposes i18next object for translations
var i18n = i18next;

var findme_map = L.map('findme-map')
    .setView([37.7, -97.3], 3),
    osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osmAttrib = 'Map data © OpenStreetMap contributors',
    osm = L.tileLayer(osmUrl, {minZoom: 2, maxZoom: 19, attribution: osmAttrib}).addTo(findme_map),
    category_data = [];

var findme_marker = L.marker([0,0], {draggable: true}).addTo(findme_map);
findme_marker.setOpacity(0);

if (location.hash) location.hash = '';

function loadCategory(language) {

    $('#category').children().remove().end()

    var buildSelectControl = function(data) {
        $("#category").select2({
            multiple: true,
            data: data,
        });
    };
    $.getJSON('./locales/' + language + '/categories.json', buildSelectControl).fail(function () {
        // 404? Fall back to en-US
        $.getJSON('./locales/en-US/categories.json', buildSelectControl);
    });
};

function zoom_to_point(chosen_place, map, marker) {
    console.log(chosen_place);

    marker.setOpacity(1);
    marker.setLatLng([chosen_place.lat, chosen_place.lon]);


    map.setView(chosen_place, 18, {animate: true});
}

function useMyLocation() {
    $("#couldnt-find").hide();
    $("#success").hide();
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var point = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            }

            addressLookupFinished(point);
        }, function (error) {
            $("#couldnt-find").show();
        });
    } else {
        $("#couldnt-find").show();
    }
};

$("#find").submit(function(e) {
    e.preventDefault();
    $("#couldnt-find").hide();
    $("#invalid-location").hide();
    $("#success").hide();

    var address_to_find = []
    var userAddress = $("#address").val().trim()
    var userCity = $("#city").val().trim()
    var userState = $("#state").val().trim()

    if (userAddress.length > 0) {
        address_to_find.push(userAddress)
    }
    // if (userAddress.length == 0) {
    //     $("#invalid-location").show();
    //     $("#error-address").show();
    //     $("#error-address").text("Error!");
    // }

    if (userCity.length > 0) {
        address_to_find.push(userCity)
    }

    // if (userCity.length == 0) {
    //     $("#invalid-location").show();
    //     $("#error-city").show();
    // }

    if (userState.length > 0) {
        address_to_find.push(userState)
    }
    // if (userState.length == 0) {
    //     $("#invalid-location").show();
    //     $("#error-state").show();
    // }

    if (address_to_find.length === 0) return;

    var ccode = $("#country_code").val().trim()
    var languages = [i18next.resolvedLanguage, 'en']
    
    /* NOMINATIM PARAM */
    var qwarg_nominatim = {
        format: 'json',
        q: address_to_find.join(', '),
        addressdetails: 1,
        namedetails: 1,
        countrycode: ccode
    };
    var url_nominatim = "https://nominatim.openstreetmap.org/search?" + $.param(qwarg_nominatim);

    $("#findme").addClass("disabled");
    $("#findme").addClass("loading");
    $.ajax({
        url: url_nominatim,
        success: nominatim_callback,
        dataType: 'jsonp',
        jsonp: 'json_callback',
        headers: {
            'accept-language': languages.join(', ')
        }
    });

});

function nominatim_callback(data) {
    if (data.length > 0) {
        var chosen_place = data[0];

        var bounds = new L.LatLngBounds(
            [+chosen_place.boundingbox[0], +chosen_place.boundingbox[2]],
            [+chosen_place.boundingbox[1], +chosen_place.boundingbox[3]]);

        // update map
        findme_map.fitBounds(bounds);
        findme_marker.setOpacity(1);
        findme_marker.setLatLng([chosen_place.lat, chosen_place.lon]);


        // found address
        var pointRef = chosen_place.address.house_number
        var way = chosen_place.address.road

        var streetAddress = []

        // building or number may need to be added
        if (pointRef !== undefined) {
            streetAddress.push(pointRef)
        }
        
        // road or other way may need to be added 
        if (way !== undefined) {
            streetAddress.push(way)
        }

        if (streetAddress.length < 2) {
            $("#address").addClass("outline-errors");
        }
        else{
            $("#address").removeClass("outline-errors");
        }

        var state = chosen_place.address.state
        var municipality = chosen_place.address.village || chosen_place.address.town || chosen_place.address.city
        //var postcode = chosen_place.address.postcode
        var country = chosen_place.address.country

        // final address
        $("#address").val(streetAddress.join(' '));
        $('#city').val(municipality);
        $('#state').val(state);
        $('#country').val(country);

        // $('#addressalt').val(chosen_place.address.road);
        // $('#hnumberalt').val(chosen_place.address.house_number);
        // $('#postcode').val(postcode);
        
        // returned valid address (could be missing street address)
        $("#find").removeClass("outline-errors");
            

        $('#step2').removeClass("disabled");
        $('#continue').removeClass("disabled");
        $('.step-2 a').attr('href', '#details');

        $('#success').html(i18n.t('messages.success', { escapeInterpolation: false }));
        $('#success').show();
        window.scrollTo(0, $('#address').position().top - 30);
        $('.step-2 a').attr('href', '#details');
    } else {
        // lookup failed
        $("#success").hide();
        $("#find").addClass("outline-errors");
        $("#couldnt-find").show();
    }
    $("#findme").removeClass("loading");
    $("#findme").removeClass("disabled");
});

function addressLookupFinished(pointData) {
    zoom_to_point(pointData, findme_map, findme_marker);

    $('#success').html(i18n.t('messages.success', { escapeInterpolation: false }));
    $('#success').show();
    window.scrollTo(0, $('#address').position().top - 30);
    $('.step-2 a').attr('href', '#details');
}

$(window).on('hashchange', function() {
    if (location.hash == '#details') {
        $('#collect-data-step').removeClass('hide');
        $('#address-step').addClass('hide');
        $('#confirm-step').addClass('hide');
        $('.steps').addClass('on-2');
        $('.steps').removeClass('on-3');
    } else if (location.hash == '#done') {
        $('#confirm-step').removeClass('hide');
        $('#collect-data-step').addClass('hide');
        $('#address-step').addClass('hide');
        $('.steps').addClass('on-3');
    } else {
        $('#address-step').removeClass('hide');
        $('#collect-data-step').addClass('hide');
        $('#confirm-step').addClass('hide');
        $('.steps').removeClass('on-2');
        $('.steps').removeClass('on-3');
    }
    findme_map.invalidateSize();
});

$("#collect-data-done").click(function() {
    // Basic form validation
    if ($("#category").val().length == 0) {
        $("#form-invalid").text(i18n.t('validation.missingCategory'));
        return false;
    } else if ($("#name").val().length < 3) {
        $("#form-invalid").text(i18n.t('validation.missingName'));
        return false;
    } else if ($("#phone").val().length < 5 && $("#website").length < 10) {
        $("#form-invalid").text(i18n.t('validation.missingPhoneOrWebsite'));
        return false;
    } else {
        $("#form-invalid").text("");
    }

    location.hash = '#done';

    var note_body =
        "onosm.org submitted note from a business:\n" +
        "name: " + $("#name").val() + "\n" +
        "phone: " + $("#phone").val() + "\n" +
        "website: " + $("#website").val() + "\n" +
        "twitter: " + $("#twitter").val() + "\n" +
        "facebook: " + $("#facebook").val() + "\n" +
        "email: " + $("#email").val() + "\n" +
        "hours: " + $("#opening_hours").val() + "\n" +
        "category: " + $("#category").val().join(", ") + "\n" +
        "address: " + $("#address").val(),
        latlon = findme_marker.getLatLng(),
        note_data = {
            lat: latlon.lat,
            lon: latlon.lng,
            text: note_body
        };

    $.post(
        'https://api.openstreetmap.org/api/0.6/notes.json',
        note_data,
        function(result) {
            var id = result.properties.id;
            $("#linkcoords").append(
                '<a href="https://osm.org/note/' + id + '">https://osm.org/note/' + id + '</a>'
            );
        }
    );
});


function clearFields() {
    $("#name").val('');
    $("#phone").val('');
    $("#website").val('');
    $("#twitter").val('');
    $("#opening_hours").val('');
    $("#category").val('');
    $("#address").val('');
    $("#linkcoords").empty();
}

function check_coordinates() {
    var latlon = findme_marker.getLatLng();

    if ((latlon.lat != 0) || (latlon.lng != 0)) {
        location.hash = '#details';
    } else {
        $("#invalid-location").show();
    }
}
