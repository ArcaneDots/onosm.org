
//jquery version exposes i18next object for translations
const i18n = i18next;

let completedAddress = undefined;

const findLocationForm = document.getElementById('formFindLocation');
const userAddressForm = document.getElementById('formUserAddress');

/**
 * Reload translations for main content
 * @param {*} language 
 */
function reloadLists(language) {
  let category_data = [];
  let payment_data = [];

  $.getJSON(`./locales/${language}/categories.json`)
    .success((data) => {
      category_data = data;
    })
    .fail(() => {
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
      let data = {
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
      let data = {
        results: []
      };
      data.results = payment_data;
      query.callback(data);
    }
  });
};

findLocationForm.addEventListener('submit', (event) => {

  event.preventDefault();

  const searchTerms = new FormData(findLocationForm).get("search_terms")
  console.info("data:") 
  console.info(searchTerms);
  
  if (searchTerms == null || searchTerms.length == 0) { 
    console.warn("missing search terms")
    return; 
  }

  hideHtmlAddressNotFoundMsg();

  addressLookup(searchTerms); 
});

function verifyLocation(){
  if (activeSearchAddress === null) {
    return;
  }

  location.hash = '#details';
  $('#collect-data-step').removeClass('d-none');
  $('#address-step').addClass('d-none');
  $('#confirm-step').addClass('d-none');
  $('#step2').addClass('active bg-success');
  $('#step3').removeClass('active bg-success');
  poiMap.invalidateSize();
}

userAddressForm.addEventListener("submit", function (e){
  e.preventDefault();

  completedAddress = getNoteBody();

  if (completedAddress === null) {
    return;
  }

  var poiLatLon = poiMarker.getLatLng(),
    qwArg = {
      lat: poiLatLon.lat,
      lon: poiLatLon.lng,
      text: completedAddress
    };

  // map data dev site: https://master.apis.dev.openstreetmap.org/
  $.post('https://api.openstreetmap.org/api/0.6/notes.json', qwArg, function (data) {
    console.info(data);
    const noteId = data.properties.id;
    const link = 'https://openstreetmap.org/?note=' + noteId + '#map=19/' + poiLatLon.lat + '/' + poiLatLon.lng + '&layers=N';
    $("#linkcoords").append('<div class="mt-3 h4"><a href="' + link + '">' + link + '</a></div>');
  });

  location.hash = '#done';
  $('#confirm-step').removeClass('d-none');
  $('#collect-data-step').addClass('d-none');
  $('#address-step').addClass('d-none');
  $('#step3').addClass('active bg-success');
  //confetti.start(1000);
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

  
  if ($('input[type=radio][name=drive-thru_state]').is(':checked')) {
    const sectionValue = $("input[type=radio][name=drive-thru_state]:checked").val();
    const sectionHours = $("#drive-thru_hours").val()
    const sectionDescription = $("#drive-thru_description").val()

    note_body += `drive_through=${sectionValue}\n`;
    if (sectionHours.length > 0) note_body += `opening_hours:drive_through=${sectionHours}\n`;
    if (sectionDescription.length > 0) note_body += `drive_through:description=${sectionDescription}\n`;
  }
  
  if ($('input[type=radio][name=delivery_state]').is(':checked')) {
    const sectionValue = $("input[type=radio][name=delivery_state]:checked").val();
    const sectionHours = $("#delivery_hours").val()
    const sectionDescription = $("#delivery_description").val()

    note_body += `delivery=${sectionValue}\n`;
    if (sectionHours.length > 0) note_body += `opening_hours:delivery=${sectionHours}\n`;
    if (sectionDescription.length > 0) note_body += `delivery:description=${sectionDescription}\n`;
  }

  if ($("input[type=radio][name=takeaway-state]").is(':checked')) {
    const sectionValue = $("input[type=radio][name=takeaway_state]:checked").val();
    const sectionHours = $("#takeaway_hours").val()
    const sectionDescription = $("#takeaway_description").val()

    note_body += `takeaway=${sectionValue}\n`;
    if (sectionHours.length > 0) note_body += `opening_hours:takeaway=${sectionHours}\n`;
    if (sectionDescription.length > 0) note_body += `takeaway:description=${sectionDescription}\n`;
  }

  return note_body;
}

/**
 * Resets main form data
 */
function clearFields() {
  $("#formUserAddress")[0].reset();
  $("#address").val("");
  $("#category").select2("val", "");
  $("#payment").select2("val", "");
  $('#input:radio[name=drive-thru_state]').prop('checked', false);
  $('#input:radio[name=delivery-state]').prop('checked', false);
  $('#input:radio[name=takeaway-state]').prop('checked', false);
}

function returnToLocation(){

  clearFields();

  location.hash = '#location';

  $('#address-step').removeClass('d-none');
  $('#collect-data-step').addClass('d-none');
  $('#confirm-step').addClass('d-none');
  $('#step2').removeClass('active bg-success');
  $('#step3').removeClass('active bg-success');

  poiMap.invalidateSize();
}