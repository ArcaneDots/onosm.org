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

    var userAddress = $("#address").val()
    var userCity = $("#city").val()
    var userState = $("#state").val()
    var userCountryCode = $("#country_code").val()

    if (userAddress.length == 0) {
        $("#invalid-location").show();
        $("#error-address").show();
        $("#error-address").text("Error!");
    }

    if (userCity.length == 0) {
        $("#invalid-location").show();
        $("#error-city").show();
    }

    if (userState.length == 0) {
        $("#invalid-location").show();
        $("#error-state").show();
    }



    var address_to_find = userAddress + ' ' + userCity + ' ' + userState + ' ' + userCountryCode;

    if (address_to_find.length === 0) return;    
    var qwarg = {
        format: 'json',
        q: address_to_find
    };
    
    var url = "https://nominatim.openstreetmap.org/search?" + $.param(qwarg);
    //$("#loading-banner").val(i18n.t('messages.loadingText'));
    $("#findme").addClass("disabled");
    $("#findme").addClass("loading");
    $.getJSON(url, function(data) {
        if (data.length > 0) {
            addressLookupFinished(data[0]);
        } else {
            $("#couldnt-find").show();
        }
    });
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
