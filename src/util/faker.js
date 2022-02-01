const faker = require('faker');
// const { getRandomInt } = require('./common');

export const generateUsers = (numOfUsers) => {
  let users = []
  for (let id=1; id <= numOfUsers; id++) {

    let firstName = faker.name.firstName();
    let lastName = faker.name.lastName();
    let anonymousId = faker.datatype.uuid();
    let user_id = faker.datatype.uuid().split('-')[0]

    users.push({
        "first_name": firstName,
        "last_name": lastName,
        "email": `${firstName}.${lastName}@gmailx.com`,
        "anonymousId": anonymousId,
        "user_id": user_id
    });
  }

  return users 
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',

  // These options are needed to round to whole numbers if that's what you want.
  //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

export const generateRandomValue = (string) => {
  let value = "";

  if (!string.includes("#")) return string;

  // Return long ID
  if (string.trim() == "##") {
    value = faker.datatype.uuid();
    return value;
  }
  // Return short ID
  if (string.trim() == "#") {
    value = faker.datatype.uuid();
    value = value.split("-")[0]
    return value;
  } 
  
  // Split string and set type equal to string after #
  let type = string.split("#")[1];
  if (type === "id" || type === "short_id") {
    value = faker.datatype.uuid();
    if (type === "short_id") value = value.split("-")[0]
  }
  
  // Locations
  if (type === "city") value = faker.address.city();
  if (type === "zip") value = faker.address.zipCode();
  if (type === "address") value = faker.address.streetAddress();
  if (type === "country") value = faker.address.country();
  if (type === "state") value = faker.address.state();
  if (type === "latitude") value = faker.address.latitude();
  if (type === "longitude") value = faker.address.longitude();
  if (type === "ip") value = faker.internet.ip();

  // Commerce
  if (type === "color") value = faker.commerce.color();
  if (type === "department") value = faker.commerce.department();
  if (type === "price") value = parseFloat(formatter.format(faker.commerce.price()/4.00).substring(1));
  if (type === "price_high") value = parseFloat(formatter.format(faker.commerce.price()).substring(1));
  if (type === "material") value = faker.commerce.material();
  if (type === "product_description") value = faker.commerce.productDescription();

  // Company and People
  if (type === "company_name") value = faker.company.companyName();
  if (type === "role") value = faker.name.jobTitle();
  if (type === "gender") value = faker.name.gender();
  if (type === "title") value = faker.name.title();
  if (type === "job_type") value = faker.name.jobType();
  if (type === "phone") value = faker.phone.phoneNumber().substring(0,12);

  // dates
  if (type === "date_past") value = faker.date.past();
  if (type === "date_recent") value = faker.date.recent();
  if (type.includes("date_between") ) {
    let start = string.split("#")[2];
    let end = string.split("#")[3];
    value = faker.date.between(start, end);
  }

  if (value === "") {
    return string
  }
  
  return value
}