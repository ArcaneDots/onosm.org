
function startHtmlLoadingAnimation() {
    $("#findme").addClass("progress-bar progress-bar-striped progress-bar-animated");
}

function stopHtmlLoadingAnimation(){ 
    $("#findme").removeClass("progress-bar progress-bar-striped progress-bar-animated");
}

function showHtmlMapInfo() {
    $("#map-information").html(manualPosition);
    $("#map-information").show();
}

function hideHtmlMapMsg() {
    $("#map-information").hide();
}

function showHtmlAddressNotFoundMsg() {
    $("#couldnt-find").show();
}

function hideHtmlAddressNotFoundMsg() {
    $("#couldnt-find").hide();
}

function showHtmlValidAddress() {
    $("#address").addClass("is-valid");
    $("#address").removeClass("is-invalid");
}

function showHtmlInvalidAddress() {
    $("#address").addClass("is-invalid");
    $("#address").removeClass("is-valid");
}

function showHtmlInvalidAddressMsg() {
    showHtmlAddressNotFoundMsg();
    hideHtmlMapMsg();
    showHtmlInvalidAddress();
}

function showHtmlAllowDetails() {
    $('.step-2 a').attr('href', '#details');
    $('#step2').removeClass("disabled");
    $('#continue').removeClass("disabled");
}



/**
 * Update address related HTML input fields
 * @param {NominatimAddress} nominatimAddressData 
 */
function updateHtmlWithAddressInfo(nominatimAddressData) {

  showHtmlAllowDetails();
  
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

  showHtmlValidAddress();
}