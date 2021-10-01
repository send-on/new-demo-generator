import { getRandomInt, sanitize } from './common.js'
import {
  firstProp,
  dependencyElement,
} from '../constants/config.js'
import {  generateRandomValue } from './faker'

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
    } else if (temp[1].includes('##')) {
      properties[temp[0]] = generateRandomValue(1);
    } else if (temp[1].includes ('#')) {
      properties[temp[0]] = generateRandomValue(0);
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
  

export const loadEventProps = (dataArr, u_i, e_i, firedEvents, analytics, setIsLoading, setStatus, anonId) => {
  if (dataArr[e_i][1] === "identify") {
    let properties = createEventProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.identify(anonId, properties);
  }
  if (dataArr[e_i][1] === "page") {
    let properties = createEventProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.page(dataArr[e_i][2], properties);
  }

  if (dataArr[e_i][1] === "track") {
    let properties = createEventProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.track(dataArr[e_i][2], properties, {
      anonymousId: anonId,
    });
  } 
  // next event
  if (dataArr[e_i+1]) {
    setTimeout(()=>loadEventProps(
      dataArr,
      u_i,
      e_i+1,
      firedEvents,
      analytics, 
      setIsLoading,
      setStatus, 
      anonId
    ), 10)
  } else if (u_i < 10) {
    setTimeout(()=>loadEventProps(
      dataArr,
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
  }
}