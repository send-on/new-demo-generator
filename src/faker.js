const faker = require('faker');

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