
//jquery version exposes i18next object for translations
var i18n = i18next;

var successString, manualPosition, loadingText, modalText;

const deliveryService = new ServiceData('delivery');
const takeawayService = new ServiceData('takeaway');


var services = new Map();
services.set('delivery', deliveryService);
services.set('takeaway', takeawayService);


// Disables the input if delivery is not checked
$('#delivery_state').prop('indeterminate', true);

// top-level services radio button click handler
$('.osm_section_option').on('click', function () {
  // source: https://stackoverflow.com/questions/33155382/toggle-radio-buttons-checked-status-in-jquery

  const selectedOptionId = this.id;
  
  let selectedOption = new ServiceId(selectedOptionId, selectedOptionId.value);

  console.log(selectedOptionId);

  //use: if (id.contains('only')) <- use with ES6 and above

  // turn off other radio buttons where user clicks "only" option
  if (selectedOption.getValue() === 'only') {

    // disable other checked radio-button in top-level group 
    let otherSelectedOptions = $('[class=osm_section_option]').not('[name=' + this.name + ']');
    const turnOffSection = new Sections(otherSelectedOptions, services).convertToggleSectionIds();
    turnOffSection.collapseAllSections(true);

  } else {
    // reenable previously disabled main service options
    let otherSectionOptions = $('[class=osm_section_option]:disabled').not('[name=' + this.name + ']');
    if (otherSectionOptions.length > 0) {
      //otherSectionOptions.prop('disabled', false);
      let enableSections = new Sections(otherSectionOptions,services);
      enableSections.convertToggleSectionIds();
      enableSections.enableAllSections();
    }
  }

  // update "checked" attribute??
  $(':radio[name=' + this.name + ']').not(selectedOptionId).data('checked', false);

  // update 'service' based on checked option 
  const sectionName = selectedOption.getSection();
  const optionValue = selectedOption.getValue()
  let currentService = services.get(sectionName);
  currentService.setValue(optionValue);

  // log final state change
  for (const _service of services.keys()) {
    console.log(_service + ': ' + services.get(_service).getValue());
  };
});

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
 
  // Delivery
  let drive_through_clicked = false;
  if ($("input:checked[name=delivery-check]").val() && $("#delivery").val() != "") 
    note_body += " delivery=" + $("#delivery").val() + "\n"; 
    else if ($("input:checked[name=delivery-check]").val() && $("#delivery").val() == "") 
    note_body += "delivery=yes" + "\n"; 
    else if ($('#delivery-check').not(':indeterminate') == true) 
    note_body += "delivery=no" + "\n";

  if ($("#delivery_description").val()) note_body += "delivery:description=" + $("#delivery_description").val() + "\n";
  // Delivery during covid
  if ($("input:checked[name=delivery_covid]").val() === 'Y') note_body += "delivery:covid19=yes\n";
  if ($("#delivery_covid_description").val() || $("#takeaway_covid_description").val()) 
    note_body += "description:covid19=";
  if ($("#delivery_covid_description").val()) note_body += $("#delivery_covid_description").val() + " ";
  
  // Take-away
  if ($("input:checked[name=takeaway-check]").val() != "undefined") note_body += "takeaway=" + $("input:checked[name=takeaway]").val() + "\n";  
  if ($("#takeaway_description").val()) note_body += "takeaway:description=" + $("#takeaway_description").val() + "\n";
  // Take-away during Covid-19
  if ($("input:checked[name=takeaway_covid]").val() == "yes" || $("input:checked[name=takeaway_covid]").val() == "only") 
    note_body += "takeaway:covid19=" + $("input:checked[name=takeaway_covid]").val() + "\n"; 
  if ($("#takeaway_covid_description").val()) note_body += $("#takeaway_covid_description").val() + "\n";

  // drive-through
  if ($("input:checked[name=drive_through_yes]").val() != "undefined") note_body += "drive_through=" + $("input:checked[name=takeaway]").val() + "\n";  
  if ($("#takeaway_description").val()) note_body += "takeaway:description=" + $("#takeaway_description").val() + "\n";
  // drive-through during Covid-19
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









