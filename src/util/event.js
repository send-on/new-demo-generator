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
  if (e[dayElement].includes("#")) {
    let recallNum = "0"
    let recallCell = "0"
    if (e[dependencyElement]) {
      recallNum = parseInt(e[dependencyElement])
      recallCell = JSON.parse(e[dependencyElement])
    } 
    if (Array.isArray(recallCell)) recallNum = checkIsArrayAndHasEvent(recallCell, firedEvents)
    timestampUnix = firedEvents[recallNum]["timestampUnix"] 
    timestampUnix = timestampUnix + (parseFloat(e[dayElement].substring(1)) * unixDay)
    if (e[randomizeElement]) timestampUnix = timestampUnix + (Math.floor((Math.random() * (parseFloat(e[randomizeElement]))*unixDay)));
    
  } else {
    timestampUnix = moment().unix();
    if (e[dayElement]) timestampUnix = timestampUnix - e[dayElement]*unixDay
    if (e[randomizeElement]) timestampUnix = timestampUnix - (Math.floor((Math.random() * (parseFloat(e[randomizeElement]))*unixDay)));
  }
  timestamp = moment(timestampUnix, "X").format();
  return [timestamp, timestampUnix]
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
    if (temp[1].includes("*") && (firedEvents[recallNum])) {
      if (firedEvents[recallNum][temp[0]] !== undefined) properties[temp[0]] = firedEvents[recallNum][temp[0]]
    } else if (temp[1].includes("{") && Array.isArray(recallCell)) {
      properties[temp[0]] = createMultipleProperty(temp[1], firedEvents, recallCell);
    } else if (temp[1].includes('#')) {
      properties[temp[0]] = generateRandomValue(temp[1]);
      if (generateRandomValue(temp[1]) === "") toaster.warning(`Random value error on "${temp[1]}" - Invalid Phrase`)
    } else {
      temp[1] = temp[1].split(',')
      // if val[0] is array
      if (temp[0].includes("[")) {
        // Create tuple from key [prop, 2]
        let tuple = [
          sanitize(temp[0].split(',')[0]),
          sanitize(temp[0].split(',')[1])
        ]
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
  

export const loadEventProps = (eventList, u_i, e_i, firedEvents, analytics, setIsLoading, setStatus, anonId) => {
  if (eventList[e_i][1] === "identify") {
    let properties = createEventProps(eventList[e_i], firedEvents);
    firedEvents[parseInt(eventList[e_i][0])] = properties
    analytics.identify(anonId, properties);
  }
  if (eventList[e_i][1] === "page") {
    let properties = createEventProps(eventList[e_i], firedEvents);
    firedEvents[parseInt(eventList[e_i][0])] = properties
    analytics.page(eventList[e_i][2], properties);
  }

  if (eventList[e_i][1] === "track") {
    let properties = createEventProps(eventList[e_i], firedEvents);
    firedEvents[parseInt(eventList[e_i][0])] = properties
    analytics.track(eventList[e_i][2], properties, {
      anonymousId: anonId,
    });
  } 
  // next event
  if (eventList[e_i+1]) {
    setTimeout(()=>loadEventProps(
      eventList,
      u_i,
      e_i+1,
      firedEvents,
      analytics, 
      setIsLoading,
      setStatus, 
      anonId
    ), 10)
  } else if (u_i < 30) {
    setTimeout(()=>loadEventProps(
      eventList,
      u_i+1,
      1,
      firedEvents,
      analytics, 
      setIsLoading,
      setStatus, 
      anonId
    ), 10)
  } else {
    setIsLoading(false);
    setStatus("DONE, Fire Again?");
    toaster.success("All events fired!")
  }
}