
class Sections {
  constructor(radioOptionList, services) { 
    this.radioOptionList = radioOptionList,
    this.services = services,
    this.sectionNames = []   
  }
  // call first
  //Looking for matching id named ___Toggle 
  convertToggleSectionIds() {
    // jquery list radio options
    this.radioOptionList.each((index, element) => {
      const sectionName = element.name.split('_')[0];
      if (!this.sectionNames.includes(sectionName)) {
        this.sectionNames.push(sectionName);
      }
    });

    return this;
  }
  collapseAllSections() {
    // disable service level radio-button"? confirm with 2 sections
    this.radioOptionList.removeAttr('checked');
    this.radioOptionList.prop('disabled', true);
    //this.radioOptionList.data('checked', false);


    // list of section id to be turned off
    this.sectionNames.forEach(function (sectionName) {
      if (this.services.has(sectionName)) {
        this.services.get(sectionName).setValue();
      }
      new Section(sectionName  + 'Toggle').disableSection();
    }, this );
  }
  enableAllSections() {
    // enable service level radio-button? confirm with 2 sections
    this.radioOptionList.removeAttr('disabled');

    // list of section id to be turned on
    this.sectionNames.map(function (sectionName) {
      new Section(sectionName  + 'Toggle').enableSection();
    });
  }
}

class Section {
  constructor(sectionId) {
    this.sectionId = $('#' + sectionId);
  }
  enableSection() {
    // allow user to expand the section
    this.sectionId.removeAttr("disabled");
  }
  disableSection() {
    // tell aria section is disabled
    this.sectionId.attr("aria-expanded", false);

    this.sectionId.prop('disabled', true);

    // find data-target and disable the actual div section
    const collapseSection = this.sectionId.data("target");
    $(collapseSection).removeClass("show");
    this.sectionId.attr("disabled", true);
  }
}

class ServiceId {
  constructor(sectionId, value) {
    this.sectionId = sectionId,
    this.sectionParts = sectionId.split("_"),
    this.value = value
  }

  getId() {
    return this.sectionId;
  }
  
  getJqueryId() {
    return $(this.sectionId);
  }

  getSection() {
    return this.sectionParts[0]
  }

  getName() {
    return this.sectionParts[0]
  }

  getValue() {
    const localValue = (this.sectionParts.length > 2) ? this.sectionParts[2] : this.value;
    return localValue.toLowerCase();
  }
}

class ServiceData {
  constructor(labelString) {
    this.label = labelString,
    this.value = "no",
    this.hours = "",
    this.description = "",
    this.covid19Active = "no",
    this.covid19Hours = "no";
  }
  getLabel() {
    return this.label;
  }
  getValue() {
    return this.value;
  }
  setValue(userIsActive) {

    if (userIsActive === undefined) {
      this.value = userIsActive
      return
    }

    const isActive = userIsActive.toLowerCase();
    if (isActive === "yes" || isActive === "no" || isActive === "only") {
      this.value = isActive;
    }      
  }

  getDescription() {
    return this.description;
  }

  setDescription(userDescription) {
    this.description = userDescription.toString(value);
  }

  getHours() {
    return this.hours;
  }

  setHours(userHours) {
    this.hours = userHours.toString();
  }

  getCovid19Active() {
    return this.covid19Active;
  }
  
  setCovid19Active(userIsActive) {
    isActive = userIsActive.toLowerCase();
    if (isActive === "yes" || isActive === "no" || isActive === "only") {
      this.covid19Active = isActive;
    }
  }
  getCovid19Hours() {
    return this.covid19Hours;
  }
  setCovid19Hours(userHours) {
    this.covid19Hours = userHours.toString();
  }
}



