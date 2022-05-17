import { getRandomInt, sanitize } from './common.js';
import { toaster } from 'evergreen-ui';
import {
  firstProp,
  dependencyElement,
  dayElement,
  unixDay, 
  randomizeElement,
  writeKeyElement
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
  // timeStampTuple = [eventId, event timestamp]
  let timeStampTuple = []
  if (Array.isArray(recallArr)) {
    recallArr.forEach(e => {
      if (firedEvents[e]) {
        if (timeStampTuple.length === 0) {
          timeStampTuple = [e, firedEvents[e]['timestampUnix']]
        } else if (firedEvents[e]['timestampUnix'] > timeStampTuple[1]) {
          timeStampTuple = [e, firedEvents[e]['timestampUnix']]
        }
      }
    })
  } 
  // return ID of the most recent timestamp
  return timeStampTuple[0] ?? false
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
  if (e[dayElement].trim()[0] === "#") {
    // FIX LATER: bad practice to mutate
    e[dayElement] = e[dayElement].substring(1);
  }
  // Check for multiple dependencies and set recallNum to event with the latest timestamp
  if (Array.isArray(recallCell)) recallNum = checkIsArrayAndHasEvent(recallCell, firedEvents)
  // auto mode: blank days ago, blank randomizer, dependent event = 0.5 to 1 hour timestamp spacing
  if ((parseInt(e[dependencyElement]) || Array.isArray(recallCell)) && !e[dayElement] && !e[randomizeElement]) {
    timestampUnix = firedEvents[recallNum]["timestampUnix"];
    timestampUnix = timestampUnix + (0.04 * unixDay);
    timestampUnix = timestampUnix + (Math.floor((Math.random() * (0.04*unixDay))));
    timestamp = moment(timestampUnix, "X").format();
    return [timestamp, timestampUnix];
  }
  // Automatically key off of dependent event's timestamp
  if (parseInt(recallNum) > 0 && firedEvents[recallNum]["timestampUnix"]) {
    timestampUnix = firedEvents[recallNum]["timestampUnix"];
    timestampUnix = timestampUnix + (parseFloat(e[dayElement]) * unixDay);
    if (e[randomizeElement]) timestampUnix = timestampUnix + (Math.floor((Math.random() * (parseFloat(e[randomizeElement]))*unixDay)));
  } else {
    // Absolute timestamps
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
      for (let i = 0; i < eventsObj[key].length; i++) { 
       for (let newKey in eventsObj[key][i]) { 
         if (newKey.includes('.')) { 
           let temp_arr = newKey.split('.'); 
             if (temp_arr.length > 1) {
              newObj = {[temp_arr[0]]: {[temp_arr[1]]: eventsObj[key][i][newKey]}}
              newObj = mergeDeep(eventsObj[key][i], newObj); 
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

// Used for weighting property selection using brand:[[brand1, 10], [brand2,20]]
const pickWeightedPosition = (chancesArr, position, target, cursor) => {
  let newCursor = cursor + chancesArr[position];
  if (newCursor > target) {
    return position
  } else {
    return pickWeightedPosition(chancesArr, position+1, target, newCursor)
  }
}

export const createEventProps = (e, firedEvents) => {
  // set recallNum for single value
  let recallNum = "0"
  let recallCell = "0"
  let shouldReuseIndex = false; 

  if (e[dependencyElement]) {
    recallNum = parseInt(e[dependencyElement])
    recallCell = JSON.parse(e[dependencyElement])
  } 
  
  // set recallNum to existing value based on dependency
  if (Array.isArray(recallCell)) recallNum = checkIsArrayAndHasEvent(recallCell, firedEvents)

  // remove non property/traits from array
  // if (e[firstProp].length === 32 && !e[firstProp].includes(":")) firstProp++;
  let propsObject = e.slice(firstProp);

  propsObject = propsObject.filter(function(el) { return el; });
  const properties = {};
  var randomInt = 0;
  // create properties object, randomize array element selection per iteration, sanitize 
  for (let i = 0; i < propsObject.length; i++) {
    let temp = propsObject[i].split([":"]);
    // If property key begins with #, reuse the random index from previous property to select position
    shouldReuseIndex = false; 
    if (temp[0][0] === "#") {
      shouldReuseIndex = true;
      temp[0] = temp[0].substring(1);
    }
    temp[0] = temp[0].trim();
    temp[1] = temp[1].trim();

    // check for * recall
    if (temp[1].trim()[0] === "*" && (firedEvents[recallNum])) {
      if (firedEvents[recallNum][temp[0]] !== undefined) properties[temp[0]] = firedEvents[recallNum][temp[0]]; 
    } else if ((temp[1].trim()[0] === "{") && Array.isArray(recallCell)) {
      properties[temp[0]] = createMultipleProperty(temp[1], firedEvents, recallCell);
    } else if (temp[1].trim()[0] === '#') {
      properties[temp[0]] = generateRandomValue(temp[1]);
      if (generateRandomValue(temp[1]) === "") toaster.warning(`Random value error on "${temp[1]}" - Invalid Phrase`, {id: 'single-toast'})
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
          randomInt = getRandomInt(temp[1].length)
          randomValue.push(sanitize(temp[1][randomInt]));
          temp[1].splice(randomInt,1);
        }
        properties[tuple[0]] = randomValue;
      } else { 
        // randomly choose element in array
        if (shouldReuseIndex && temp[1][randomInt]) {
          properties[temp[0]] = sanitize(temp[1][randomInt]);
        } else {
          // If temp[1] is an array of arrays, use weight logic
          if (temp[1][0][0] === '[' && temp[1][0][1] === '[') {
            let cleanedArray = temp[1].map(el => sanitize(el)) 
            let valuesArr = cleanedArray.filter(function(v, i) {return i % 2 == 0;}); // Even positions
            let weightsArr = cleanedArray.filter(function(v, i) {return i % 2 == 1;}); // Odd positions
            let sum = weightsArr.reduce((a, b) => a + b, 0) // number/sum = probability
            let chancesArr = weightsArr.map(el => (el/sum)*100) // Calculate probability
            properties[temp[0]]= valuesArr[pickWeightedPosition(chancesArr, 0, getRandomInt(99), 0)]
          } else {
            // Pick random position from value side
            randomInt = getRandomInt(temp[1].length)
            properties[temp[0]] = sanitize(temp[1][randomInt]);
          }
        }
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

export const fireJSEvents = (fireProperties, eventList, e_i, userList, u_i, context, analytics, timestamp, analyticsOptional, showGroups, groupList) => {
  if (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":")) {
    analyticsOptional._integrations['Segment.io'].options.apiKey = eventList[e_i][writeKeyElement]
  }

  if (eventList[e_i][1] === "group") {
    if (!showGroups) {
      toaster.danger(`Enable groups to use groups in template`, {id: 'single-toast'})
    } else {
      
      (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":"))
      ? analyticsOptional.group(groupList[getRandomInt(groupList.length-1)]['group_id'], fireProperties, context)
      : analytics.group(groupList[getRandomInt(groupList.length-1)]['group_id'], fireProperties, context)
    }
  }

  if (eventList[e_i][1] === "identify") {
    Object.assign(fireProperties, userList[u_i]);
    delete fireProperties.user_id;
    delete fireProperties.anonymousId;
    (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":"))
    ? analyticsOptional.identify(userList[u_i].user_id, fireProperties, context)
    : analytics.identify(userList[u_i].user_id, fireProperties, context);
  }
  let pageName = (eventList[e_i][2] || fireProperties.title || fireProperties.name || "/")
  if (eventList[e_i][1] === "page") {
    (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":"))
    ? analyticsOptional.page(pageName, fireProperties, context)
    : analytics.page(pageName, fireProperties, context);
  }

  if (eventList[e_i][1] === "track") {
    (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":"))
    ? analyticsOptional.track(eventList[e_i][2], fireProperties, context)
    : analytics.track(eventList[e_i][2], fireProperties, context)     
  }

  
}

export const fireNodeEvents = async (fireProperties, eventList, e_i, userList, u_i, context, analytics, timestamp, firedEvents, analyticsOptional,  showGroups, groupList) => {
  let nodeContext = {};
  Object.assign(nodeContext, context);
  delete nodeContext.timestamp;
  if (!nodeContext['ip']) nodeContext["ip"] = firedEvents['ip'];
  if (!nodeContext['userAgent']) nodeContext["userAgent"] = window.navigator.userAgent;

  let payload = {
    userId: userList[u_i].user_id,
    anonymousId: userList[u_i].anonymousId,
    context: nodeContext,
    timestamp: new Date(context.timestamp)
  }
  // Set writeKey for optional node analytics client
  if (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":")) {
    analyticsOptional.writeKey = eventList[e_i][writeKeyElement]
  }
    
  if (eventList[e_i][1] === "identify") {
    Object.assign(fireProperties, userList[u_i]);  
    delete fireProperties.user_id;
    delete fireProperties.anonymousId;
    Object.assign(payload, {traits: fireProperties})    

    if (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":")) {
      analyticsOptional.identify(payload)
    } else {
      analytics.identify(payload)
    }
  }

  if (eventList[e_i][1] === "page") {
    Object.assign(payload, {properties: fireProperties})    
    if (!firedEvents['identify']) {
      delete payload.userId;
    }
    payload.name = eventList[e_i][2] || payload.properties.name || payload.properties.title;

    if (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":")) {
      analyticsOptional.page({ ...payload, });
    } else {
      analytics.page({ ...payload });
    }
  }

  if (eventList[e_i][1] === "track") {
    Object.assign(payload, {properties: fireProperties})    
    if (!firedEvents['identify']) delete payload.userId;
    if (eventList[e_i][writeKeyElement].length === 32 && !eventList[e_i][writeKeyElement].includes(":")) {
      analyticsOptional.track({...payload, event: eventList[e_i][2]})
    } else {
      analytics.track({...payload, event: eventList[e_i][2]})
    }
  }
}