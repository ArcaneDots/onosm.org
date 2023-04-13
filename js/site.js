
//jquery version exposes i18next object for translations
const i18n = i18next;

/**
 * Reload translations for main content
 * @param {*} language 
 */
function reloadLists(language) {
  const category_data = [];
  const payment_data = [];

  $.getJSON(`./locales/${language}/categories.json`)
    .success((data) => {
      category_data = data;
    })
    .fail(function () {
      // 404? Fall back to en-US
      $.getJSON('./locales/en-US/categories.json')
        .success((data) => {
          category_data = data;
        });
    });

  $.getJSON(`./locales/${language}/payment.json`).success((data) => {
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
};

/**
 * Performs screen transitions when hash changes
 */
$(window).on('hashchange', () => {
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
  poiMap.invalidateSize();
});

// services radio buttons

$('input[type=radio][name=drive-thru_state]').on('change', function () {
  radioSelector(this);
});

$('input[type=radio][name=delivery_state]').on('change', function () {
  radioSelector(this);
});

$('input[type=radio][name=takeaway_state]').on('change', function () {
  radioSelector(this);
});


function radioSelector(radioCollectionValue) {
  const localId = radioCollectionValue.id;
  const parts = localId.split('_');
  const currentSection = parts[0];
  const radioValue = (parts.length > 2) ? parts[2] : radioCollectionValue.val().toLowerCase();

  const otherSelectOptions = $('[class=osm_section_option]').not('[name=' + radioCollectionValue.name + ']');

  const otherSectionList = [];
  otherSelectOptions.each(function (index, element) {
    const parts = element.name.split('_');
    const currentName = parts[0];
    if (!otherSectionList.find(nameElement => nameElement === currentName)) {
      otherSectionList.push(currentName);
    }
  });

  switch (radioValue) {
    case 'no': {
      radioChildrenOff(currentSection);
      otherSelectOptions.removeAttr('disabled');

      for (i = 0; i < otherSectionList; i++) {
        toggleOn(otherSectionList[i]);
      }
      break;
    }
    case 'yes': {
      radioChildrenOn(currentSection);
      otherSelectOptions.removeAttr('disabled');

      for (i = 0; i < otherSectionList.length; i++) {
        toggleOn(otherSectionList[i]);
      }
      break;
    }
    case 'only': {
      radioChildrenOn(currentSection);
      otherSelectOptions.attr('disabled', 'true');

      for (i = 0; i < otherSectionList.length; i++) {
        toggleOff(otherSectionList[i])
      }
      break;
    }
  }
};

function radioChildrenOn(sectionName) {
  $("#" + sectionName + "_description").removeAttr("disabled");
  $("#" + sectionName + "_hours").removeAttr("disabled");
}

function radioChildrenOff(sectionName) {
  $("#" + sectionName + "_description").attr("disabled", true);
  $("#" + sectionName + "_hours").attr("disabled", true);
}

function toggleOn(sectionName) {
  $("#" + sectionName + "Toggle").removeAttr("disabled");
}

function toggleOff(sectionName) {
  $("#" + sectionName + "Toggle").attr("disabled", true);
}


/**
 * Collect information for final OSM Note.
 * @returns note data structure
 */
function getNoteBody() {
  const paymentIds = [];
  const paymentTexts = [];
  $.each($("#payment").select2("data"), function (_, e) {
    paymentIds.push(e.id);
    paymentTexts.push(e.text);
  });

  // add back translation of note header

  let note_body = "onosm.org submitted note from a business:\n";
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

  if ($("input:radio[name=delivery-state]").is(':checked')) {
    const deliveryValue = $("input:radio[name=delivery-state]:checked").val();
    const deliveryDescription = $("#delivery_description").val()

    note_body += `delivery=${deliveryValue}\n`;
    if (deliveryDescription.length > 0) note_body += `delivery:description=${deliveryDescription}\n`;
  }

  if ($("input:radio[name=takeaway-state]").is(':checked')) {
    const takeawayValue = $("input:radio[name=takeaway-state]:checked").val();
    const takeawayDescription = $("#takeaway_description").val()

    note_body += `takeaway=${takeawayValue}\n`;
    if (takeawayDescription.length > 0) note_body += `takeaway:description=${takeawayDescription}\n`;
  }

  return note_body;
}

/**
 * Posts Business information to OSM via Note api
 */
$("#collect-data-done").click(() => {

  location.hash = '#done';

  const poiLatLon = poiMarker.getLatLng();
  const qwArg = {
    lat: poiLatLon.lat,
    lon: poiLatLon.lng,
    text: getNoteBody()
  };

  $.post('https://api.openstreetmap.org/api/0.6/notes.json', qwArg, (data) => {
    // console.log(data);
    const noteId = data.properties.id;
    const link = `https://openstreetmap.org/?note=${noteId}#map=19/${poiLatLon.lat}/${poiLatLon.lng}&layers=N`;
    $("#linkcoords").append(`<div class="mt-3 h4"><a href="${link}">${link}</a></div>`);
  });
});

/**
 * Resets main form data
 */
function clearFields() {
  $("#form")[0].reset();
  $("#address").val("");
  $("#category").select2("val", "");
  $("#payment").select2("val", "");
  $('#input:radio[name=delivery-state]').prop('checked', false);
  $('#input:radio[name=takeaway-state]').prop('checked', false);
}
