

/*
Template Schema Input
Dependency = [4, 5]
Property = products: {brand, category, sku}

Output event
If both 4 and 5 exist: 

products: [
  {
    brand: brand_4,
    category: category_4, 
    sku: sku_4
  },
  {
    brand: brand_5,
    category: category_5, 
    sku: sku_5
  }
]

if only 4 or 5 exists
products: [
  {
    brand: brand_4,
    category: category_4, 
    sku: sku_4
  }
]

Will fire if at least one element in dependency array exists.
*/

// Build array of fired events (based on dependency) and all their properties
// memory = [{4: {brand, sku}, 5:{brand, sku}}]
// create arrProp: []
// memory.forEach(el)
// push {brand:el.brand, sku:el.sku}

export const combineMultipleProperties = () => {

}

export const loadProps = (dataArr, u_i, e_i, firedEvents, analytics, setIsLoading, setStatus, anonId) => {
  if (dataArr[e_i][1] === "identify") {
    let properties = createProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.identify(anonId, properties);
  }
  if (dataArr[e_i][1] === "page") {
    let properties = createProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.page(dataArr[e_i][2], properties);
  }

  if (dataArr[e_i][1] === "track") {
    let properties = createProps(dataArr[e_i], firedEvents);
    firedEvents[parseInt(dataArr[e_i][0])] = properties
    analytics.track(dataArr[e_i][2], properties, {
      anonymousId: anonId,
    });
  } 
  // next event
  if (dataArr[e_i+1]) {
    setTimeout(()=>loadProps(
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
    setTimeout(()=>loadProps(
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

export const launcher = async (
  dataArr, // data schema
  userList, 
  u_i, // index for user
  e_i, // index for event
  firedEvents={0:true}, // object of events fired
  setIsLoading=false, 
  analytics, 
  setCounter, 
  counter, 
  setUserCounter, 
  setStatus
  ) => {
  // reset ajs on new user
  setStatus("Working...")
  setIsLoading(true);
  if (e_i < 3) {
    analytics.reset();
    analytics.setAnonymousId(userList[u_i].anonymousId);
  }
  // Check for dropoff
  if (shouldDrop(dataArr[e_i][dropoffElement])) {
    // Check for dependency 
    if (!dataArr[e_i][dependencyElement] || (dataArr[e_i][dependencyElement] < 1)) {
      // if no dependency exists, set dependency to 0
      dataArr[e_i][dependencyElement] = 0
    } 
    if (checkDependency(dataArr[e_i][dependencyElement], firedEvents) || e_i === firstEvent) {
      // Handle time set time, index 6 is days_ago, index 7 is hours
      let timestamp = moment().unix();
      if (dataArr[e_i][dayElement]) timestamp = timestamp - dataArr[e_i][dayElement]*unixDay
      if (dataArr[e_i][randomizeElement]) timestamp = timestamp - Math.floor((Math.random() * (parseFloat(dataArr[e_i][randomizeElement]))*unixDay));
      timestamp = moment(timestamp, "X").format();

      counter++;
      // Identify
      if (dataArr[e_i][1] === "identify") {
        let properties = createProps(dataArr[e_i], firedEvents);
        Object.assign(properties, userList[u_i]);
        delete properties.user_id;
        delete properties.anonymousId;
        firedEvents[parseInt(dataArr[e_i][0])] = properties
        await analytics.identify(userList[u_i].user_id, properties, 
          {timestamp:timestamp}
        );
      }

      if (dataArr[e_i][1] === "page") {
        let properties = createProps(dataArr[e_i], firedEvents);
        Object.assign(properties, userList[u_i]);
        delete properties.user_id;
        delete properties.anonymousId;
        firedEvents[parseInt(dataArr[e_i][0])] = properties
        await analytics.page(dataArr[e_i][2], properties, 
          {
            anonymousId: userList[u_i].anonymousId,
            timestamp:timestamp
          }
        );
      }

      // Track
      if (dataArr[e_i][1] === "track") {
        let properties = createProps(dataArr[e_i], firedEvents);
        firedEvents[parseInt(dataArr[e_i][0])] = properties
        await analytics.track(dataArr[e_i][2], properties, {
          anonymousId: userList[u_i].anonymousId,
          timestamp:timestamp
        });
      }
    }
  }