import { getRandomInt, sanitize } from './common.js';
import { toaster } from 'evergreen-ui';
import {
  firstProp,
  dependencyElement,
  dayElement,
  unixDay, 
  randomizeElement
} from '../constants/config.js';
import {  generateRandomValue } from './faker';
import moment from 'moment';

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
 const isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
const mergeDeep = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export const checkIsArrayAndHasEvent = (recallArr, firedEvents) => {
  let isArrayAndHasEvent = false
  if (Array.isArray(recallArr)) {
    recallArr.forEach(e => {
      if (firedEvents[e]) isArrayAndHasEvent = e
    })
  } 
  return isArrayAndHasEvent
}

export const removeMissingEvents = (newRecallCell, firedEvents) => {
  let newArr = []; 
  for (let i = 0; i < newRecallCell.length; i++) {
    if (firedEvents[newRecallCell[i]]) newArr.push(newRecallCell[i])
  }
  return newArr;
}

export const createMultipleProperty = (val, firedEvents, recallCell ) => {
  let newRecallCell = recallCell.map(e => JSON.stringify(e));
  let outputArr = [];
  let sourceArr = val.split(",");
  sourceArr = sourceArr.map(e => sanitize(e))
  newRecallCell = removeMissingEvents(newRecallCell, firedEvents)
  for (let i = 0; i < newRecallCell.length; i++) {
    let tempObj = {};
    for (let y = 0; y < sourceArr.length; y++) {
      tempObj[sourceArr[y]] = firedEvents[newRecallCell[i]][sourceArr[y]]
    }
    outputArr.push(tempObj);
  }
  return outputArr
}

export const createTimestamp = (e, firedEvents) => {
  // if recall exists
  let timestamp = "";
  let timestampUnix = 0;
  let recallNum = "0"
  let recallCell = "0"
  if (e[dependencyElement]) {
    recallNum = parseInt(e[dependencyElement])
    recallCell = JSON.parse(e[dependencyElement])
  }  
  if (Array.isArray(recallCell)) recallNum = checkIsArrayAndHasEvent(recallCell, firedEvents)
  // auto mode: blank days ago, blank randomizer, dependent event = 0.5 to 1 hour timestamp spacing
  if ((parseInt(e[dependencyElement]) || Array.isArray(recallCell)) && !e[dayElement] && !e[randomizeElement]) {
    timestampUnix = firedEvents[recallNum]["timestampUnix"];
    timestampUnix = timestampUnix + (0.04 * unixDay);
    timestampUnix = timestampUnix + (Math.floor((Math.random() * (0.04*unixDay))));
    timestamp = moment(timestampUnix, "X").format();
    return [timestamp, timestampUnix];
  }

  if (e[dayElement].trim()[0] === ("#")) {
    timestampUnix = firedEvents[recallNum]["timestampUnix"];
    timestampUnix = timestampUnix + (parseFloat(e[dayElement].substring(1)) * unixDay);
    if (e[randomizeElement]) timestampUnix = timestampUnix + (Math.floor((Math.random() * (parseFloat(e[randomizeElement]))*unixDay)));
  } else {
    timestampUnix = moment().unix();
    if (e[dayElement]) timestampUnix = timestampUnix - e[dayElement]*unixDay;
    if (e[randomizeElement]) timestampUnix = timestampUnix - (Math.floor((Math.random() * (parseFloat(e[randomizeElement]))*unixDay)));
  }
  timestamp = moment(timestampUnix, "X").format();
  return [timestamp, timestampUnix]
}

export const createEventContext = (eventsObj) => {
  let contextObj = {};
  let newObj = {};
  for (let key in eventsObj) {
    if (key.includes("context.")) {
      let temp_arr = key.split(".")
      if (temp_arr.length > 2) {
        newObj = {[temp_arr[1]]: {[temp_arr[2]]: eventsObj[key]}}
      } else {
        newObj = {[temp_arr[1]]: eventsObj[key]}
      }
      contextObj = mergeDeep(contextObj, newObj)
    }
  }
  return contextObj;
}

export const createObjectProperty = (eventsObj) => {
  let propertyObj = {};
  let newObj = {};
  for (let key in eventsObj) {
    if (key.includes(".") && !key.includes("context")) {
      let temp_arr = key.split(".");
      if (temp_arr.length > 1) {
        newObj = {[temp_arr[0]]: {[temp_arr[1]]: eventsObj[key]}}
      } else {
        newObj = {[temp_arr[0]]: eventsObj[key]}
      }
      propertyObj = mergeDeep(propertyObj, newObj);
    } else if (Array.isArray(eventsObj[key])) {
      for (let i = 0; i < eventsObj[key].length; i++) { // eventsObj[key] is SurveyData
       for (let newKey in eventsObj[key][i]) { // eventsObj[key][i] = is object {questionsId, selectedOptions.id}
         if (newKey.includes('.')) { // newKey is questionId, selectedOptions etc.
           let temp_arr = newKey.split('.'); // temp_arr is [selectedOptions, id]
             if (temp_arr.length > 1) {
              newObj = {[temp_arr[0]]: {[temp_arr[1]]: eventsObj[key][i][newKey]}}  // newObj: {selectedObj: {id: 3}}
              newObj = mergeDeep(eventsObj[key][i], newObj); // newObj = {everything}
              delete newObj[newKey] 
            } else {
              newObj = {[temp_arr[0]]: eventsObj[key][i]}
              newObj = mergeDeep(eventsObj[key][i], newObj);
              delete newObj[newKey]
            }
            newObj = mergeDeep(eventsObj[key], newObj)
            propertyObj = mergeDeep(propertyObj, newObj); 
          }
         }
      }
    }
  }
  return propertyObj;
}

export const removeEventContext = (eventsObj) => {
  let newPropsObject = {}
  for (let key in eventsObj) {
    if (!key.includes(".")) {
      newPropsObject[key] = eventsObj[key]
    }
  }
  return newPropsObject;
}


export const createEventProps = (e, firedEvents) => {
  // set recallNum for single value
  let recallNum = "0"
  let recallCell = "0"
  if (e[dependencyElement]) {
    recallNum = parseInt(e[dependencyElement])
    recallCell = JSON.parse(e[dependencyElement])
  } 
  
  // set recallNum to existing value based on dependency
  if (Array.isArray(recallCell)) recallNum = checkIsArrayAndHasEvent(recallCell, firedEvents)

  // remove non property/traits from array
  let propsObject = e.slice(firstProp);
  propsObject = propsObject.filter(function(el) { return el; });
  const properties = {};
  // create properties object, randomize array element selection per iteration, sanitize 
  for (let i = 0; i < propsObject.length; i++) {
    let temp = propsObject[i].split([":"]);
    // check for * recall
    if (temp[1].trim()[0] === "*" && (firedEvents[recallNum])) {
      if (firedEvents[recallNum][temp[0]] !== undefined) properties[temp[0]] = firedEvents[recallNum][temp[0]]; 
    } else if ((temp[1].trim()[0] === "{") && Array.isArray(recallCell)) {
      properties[temp[0]] = createMultipleProperty(temp[1], firedEvents, recallCell);
    } else if (temp[1].trim()[0] === '#') {
      properties[temp[0]] = generateRandomValue(temp[1]);
      if (generateRandomValue(temp[1]) === "") toaster.warning(`Random value error on "${temp[1]}" - Invalid Phrase`)
    } else {
      if (temp[1].trim()[0] === "[") {
        // if pipes are used, split by pipes instead of commas
        temp[1] = (temp[1].includes('|')) ? temp[1].split('|') : temp[1].split(',');
      } else {
        temp[1] = [temp[1]]
      }
      // if val[0] is array
      if (temp[0].trim()[0] === "[") {
        // Create tuple from key [prop, 2]
        if (temp[0].split(",").length > 0) {
          var tuple = [
            sanitize(temp[0].split(',')[0]),
            sanitize(temp[0].split(',')[1])
          ]
        } else {
          var tuple = [sanitize(temp[0].split(',')[0]), 1]
        }
        let randomValue = [];
        // Push in random value i times, pop out element when chosen (block if too many)
        if (tuple[1] > temp[1].length) tuple[1] = temp[1].length;
        for (let i = 0; i < tuple[1]; i++) {
          let randomInt = getRandomInt(temp[1].length)
          randomValue.push(sanitize(temp[1][randomInt]));
          temp[1].splice(randomInt,1);
        }
        properties[tuple[0]] = randomValue;
      } else { 
        // randomly choose element in array
        let randomValue = sanitize(temp[1][getRandomInt(temp[1].length)]);
        properties[temp[0]] = randomValue;
      }
    }
  }
  return properties;
}

export const checkDependency = (dependentOn, firedEvents={}) => {
  let parsedDependentOn = JSON.parse(dependentOn)
  if (Array.isArray(parsedDependentOn)) { 
    return checkIsArrayAndHasEvent(parsedDependentOn, firedEvents)
  } else {
    return (dependentOn in firedEvents ? true : false)
  }
}

export const shouldDropEvent = (dropoff) => {
  return (parseFloat(dropoff) < (Math.floor(Math.random() * 101))) ? false : true;
}


export const fireJSEvents = (fireProperties, eventList, e_i, userList, u_i, context, analytics, timestamp) => {
  if (eventList[e_i][1] === "identify") {
    Object.assign(fireProperties, userList[u_i]);
    delete fireProperties.user_id;
    delete fireProperties.anonymousId;
    analytics.identify(userList[u_i].user_id, fireProperties, context);
  }
  // Page
  if (eventList[e_i][1] === "page") {
    analytics.page(eventList[e_i][2], eventList[e_i][2], fireProperties, context);
  }

  // Track
  if (eventList[e_i][1] === "track") {
    analytics.track(eventList[e_i][2], fireProperties, context);
  }

}

export const fireNodeEvents = (fireProperties, eventList, e_i, userList, u_i, context, analytics, timestamp, firedEvents) => {
  let nodeContext = {};
  Object.assign(nodeContext, context);
  delete nodeContext.timestamp;

  let payload = {
    userId :userList[u_i].user_id,
    anonymousId: userList[u_i].anonymousId,
    context: nodeContext,
    timestamp: new Date(context.timestamp)
  }

  if (eventList[e_i][1] === "identify") {
    Object.assign(fireProperties, userList[u_i])    
    delete fireProperties.user_id;
    delete fireProperties.anonymousId;
    Object.assign(payload, {traits: fireProperties})    
    analytics.identify(payload);
  }

  if (eventList[e_i][1] === "page") {
    Object.assign(payload, {properties: fireProperties})    
    if (!firedEvents['identify']) delete payload.userId;
    analytics.track({
      ...payload,
      event: "Page Viewed"
    });
  }

  if (eventList[e_i][1] === "track") {
    Object.assign(payload, {properties: fireProperties})    
    if (!firedEvents['identify']) delete payload.userId;
    analytics.track({
      ...payload,
      event: eventList[e_i][2]
    });
  }
  
}