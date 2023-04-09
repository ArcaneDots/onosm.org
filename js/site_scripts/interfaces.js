/**
 * @typedef {string} osmTagName
 */

/**
 * @typedef {object} TagValue 
 * @param {string|RADIO_TYPES}
 * 
 */
function TagValue(initValue) {
  let internalValue = toValueRadioType(initValue);

  /**
   * @param {string|RADIO_TYPES} userValue
   * @returns {RADIO_TYPES}
   */
  function toValueRadioType(userValue) {
    let result = RadioTypes.TYPE_UNKNOWN;

    if (userValue === undefined) {
      result = RadioTypes.TYPE_UNKNOWN
    }

    if (typeof userValue === "string") {
      switch (userValue.trim().toLowerCase()) {
        case "yes":
          result =  RadioTypes.TYPE_YES;
          break;
        case "no":
          result =  RadioTypes.TYPE_NO;
          break;
        case "only":
          result =  RadioTypes.TYPE_ONLY;
          break;
        default:
          result =  RadioTypes.TYPE_UNKNOWN;
      }
    }
    if (typeof userValue === RadioTypes) {
      result = userValue
    }

    return result;
  }

  function setValue(value) {
    internalValue = toValueRadioType(value)
  }
  /**
    * @returns {RADIO_TYPES}
    */
  function getValue() {
    return internalValue;
  }

  /**
   * @param {RADIO_TYPES} enumState
   */
  function isEqual(enumState){
    return (internalValue === toValueRadioType(enumState));
  }

  return {
    get: getValue,
    set: setValue,
    isEqual
  }
}

/**
 * @typedef {object} UserSelectionData
 *  
 * @param {*} htmlTag 
 * @param {string} value 
 */
function UserSelectionData(htmlTag, value) {  
  const tag = parseTag(htmlTag);
  const tagParts = tag.split("_");
  const radioValue = (tagParts.length > 2) ? tagParts[2] : value;
  const name = tagParts[0];

  function parseTag(sectionIdSource) {
    if (typeof sectionIdSource === 'string') {
      return sectionIdSource;
    }
    else if (typeof sectionIdSource === 'object') {
      if (sectionIdSource.id !== undefined) {// JQuery object 
        return sectionIdSource.id;
      }
    }
  }

  /**
   * @returns {string}
   */
  function sectionName() {
    return name;
  };

  /**
   * 
   * @returns {object}
   */
  function jqueryObject() {
    return $(htmlTag);
  };

  return {
    sectionName,
    jqueryObject,
    value: radioValue
  };
}

/**
 * @typedef {object} ServiceData
 * @param {sectionName} name 
 */
function ServiceData(name) {
  const prefix = name.toLowerCase();
  const radioValue = TagValue('no')
  let activeSection = true;

  function sectionName() { 
    return prefix; 
  }

  function stateId() {
    return $(`#${prefix}_State`);
  }

  function sectionToggle() {
    return `${prefix}Toggle`
  }

  function sectionId() {
    return $(`#${prefix}Section`);
  }

  function getValue() {
    return radioValue.get();
  }

  function setValue(value) {
    radioValue.set(value);

    if (!radioValue.isEqual(RadioTypes.TYPE_UNKNOWN)){
      enableSection();
    } 
    
    else {
      disableSection();
    }
  }

  function enableSection() {
    // allow user to expand the section
    if (!activeSection) {
      activeSection = true;
      sectionId.removeAttr("disabled");
    }
  }
  function disableSection() {
    // tell aria section is disabled
    if (!activeSection) {
      activeSection = false
      sectionId.attr("aria-expanded", false);

      sectionId.prop('disabled', true);

      // find data-target and disable the actual div section
      const collapseSection = sectionId.data("target");
      $(collapseSection).removeClass("show");
      sectionId.attr("disabled", true);
    }
  }
  return {
    sectionName,
    stateId,
    sectionId,
    sectionToggle,
    getValue,
    setValue
  }
}

/**
 * @typedef {object} OsmKey_ServiceData
 * @property {osmTagName} tagName
 * @property {ServiceData} serviceObject
 */

/**
 * Collection of internally named services
 * @typedef {Map<osmName, ServiceData>} Services
 */
function ServicesMap() {
  const serviceDataMap = [];
  const serviceIterator = iterator(serviceDataMap);

  /**
   * 
   * @param {string} osmName 
   * @param {ServiceData} serviceObject 
   */
  function add(osmName, serviceObject) {
    if (osmName === undefined ||
      serviceObject === undefined) {
      return;
    }
    const entry = { name: osmName, ServiceData: serviceObject }
    serviceDataMap.push(entry);
  }

  /**
   * 
   * @param {string} osmName 
   * @returns {ServiceData} matching service object
   */
  function get(osmName) {
    const matchingObject = serviceDataMap.find(item => item.name === osmName);
    if (matchingObject !== undefined) {
      return matchingObject.ServiceData
    }
    return undefined;
  }

  function list(){
    return serviceDataMap.values();
  }

  function iterator(array) {
    let currentIndex = -1;

    function next() {
      currentIndex = currentIndex + 1;
      return currentIndex < array.length ? {
        value: array[currentIndex],
        done: false
      } : {
        value: "index out of range",
        done: true
      };
    }
    function previous() {
      currentIndex = currentIndex - 1;
      return currentIndex >= 0 ? {
        value: array[currentIndex],
        done: false
      } : {
        value: undefined,
        done: true
      };
    }
    return {
      next,
      previous
    }
  }
  return {
    get,
    add,
    list,
    iterator: serviceIterator,
  };
}

// /**
//  * Radio button -> Service state 
//  * @param {Array<Object>} selectedOptionIds
//  * @param {{Array<ServiceData>}} availableServices 
//  */
function SectionHandler(radioOptionList, availableServices) {
  // /**
  //  * @type {Array<Services>}
  //  */
  // const serviceList = getOtherServices(radioOptionList, availableServices);

  // /**
  //  * 
  //  * @param {*} options 
  //  * @param {Services} availableServices 
  //  * @returns {Array<Services>}
  //  */
  // function getOtherServices(options, availableServices) {

  const sectionList = [];

  for (const radioOption of radioOptionList) {  
    const userData = UserSelectionData(radioOption, radioOption.value);
    const selectedSection = userData.sectionName();
    if (sectionList.findIndex(element => element == selectedSection) == -1) {
      sectionList.push(selectedSection);
    }
  };

  // const allServices = availableServices.values;
  // const serviceList = [];
  // sectionList.forEach(sectionName => {

  //   const selectedData =
  //     allServices.find(elementService => elementService.sectionName == sectionName);

  //   if (selectedData != undefined) {
  //     serviceList.push(selectedData);
  //   }
  // });

  function collapseAllSections() {
    // disable service level radio-button"? confirm with 2 sections
    radioOptionList.removeAttr('checked');
    radioOptionList.prop('disabled', true);

    sectionList.forEach(sectionName => {

      const selectedData =
        availableServices.find(elementService => elementService.sectionName() == sectionName);

      if (selectedData != undefined) {
        selectedData.setValue(RadioTypes.TYPE_UNKNOWN) // =>  .disable()
      }
    });

    // serviceList.forEach(element => {
    //   element.setValue.setValue(TYPE_UNKNOWN) // =>  .disable()
    // })
  }


  // // list of section id to be turned off
  // sectionNames.forEach(sectionName => {
  //   if (availableServices.has(sectionName)) {
  //     availableServices.get(sectionName).setValue(TYPE_UNKNOWN)
  //   }
  //   new Section(sectionName).disableSection();
  // }, this);


  function enableAllSections() {
    // enable service level radio-button? confirm with 2 sections
    radioOptionList.removeAttr('disabled');

    sectionList.forEach(sectionName => {

      const selectedData =
        availableServices.find(elementService => elementService.sectionName() == sectionName);

      if (selectedData != undefined) {
        selectedData.setValue(RadioTypes.TYPE_NO) // => .enable()
      }
    });

    // serviceList.forEach(element => {
    //   element.setValue.setValue(TYPE_NO) // => .enable()
    // });

    // // list of section id to be turned on
    // sectionNames.forEach(sectionName => {
    //   new Section(sectionName).enableSection();
    // });
  }
  return {
    collapseAllSections,
    enableAllSections
  };
}

// class Section {
//   constructor(sectionId) {
//     this.sectionId = $('#' + sectionId);
//   }
//   enableSection() {
//     // allow user to expand the section
//     this.sectionId.removeAttr("disabled");
//   }
//   disableSection() {
//     // tell aria section is disabled
//     this.sectionId.attr("aria-expanded", false);

//     this.sectionId.prop('disabled', true);

//     // find data-target and disable the actual div section
//     const collapseSection = this.sectionId.data("target");
//     $(collapseSection).removeClass("show");
//     this.sectionId.attr("disabled", true);
//   }
// }

/**
 * @enum { string }
 */
const RadioTypes = {
  TYPE_YES: "yes",
  TYPE_NO: "no",
  TYPE_ONLY: "only",
  TYPE_UNKNOWN: "unknown"
}

/** @typedef {'TYPE_YES'|'TYPE_NO'|'TYPE_ONLY'|'TYPE_UNKNOWN'} RADIO_TYPES */




