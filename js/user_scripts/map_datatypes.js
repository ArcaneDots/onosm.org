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
 * @property {search_terms} display_name Array of OSM address vales
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
 * @typedef {string[]} search_terms i.e. 1313, Mockingbird Lane, Mockingbird Heights
 */
