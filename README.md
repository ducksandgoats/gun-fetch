# gun-fetch

Fetch With GunDB

```javascript
const fetch = require('gun-fetch')({peers: ["https://gun-manhattan.herokuapp.com/gun",
"https://us-west.xerberus.net/gun",
"http://gun-matrix.herokuapp.com/gun",
"https://gun-ams1.maddiex.wtf:443/gun",
"https://gun-sjc1.maddiex.wtf:443/gun",
"https://dletta.rig.airfaas.com/gun",
"https://mg-gun-manhattan.herokuapp.com/gun",
"https://gunmeetingserver.herokuapp.com/gun",
"https://e2eec.herokuapp.com/gun",
"https://gun-us.herokuapp.com/gun",
"https://gun-eu.herokuapp.com/gun",
"https://gunjs.herokuapp.com/gun",
"https://www.raygun.live/gun",
"https://gun-armitro.herokuapp.com/",
"https://fire-gun.herokuapp.com/gun"]})

let test = await fetch('gun://_hello/test/testing', {method: 'GET'})

let testText = await test.text()

// show the data
console.log(testText)
```
### special characters
gun-fetch uses special characters to make specific types of queries
| Character        | Type           | Example  |
| ------------- |:-------------:| -----:|
| _ | path | gun.get('something') |
| * | alias     |   gun.get('~@someuser') |
| ~ | public key      |    gun.user('somepublickey') |
| $ | user      |  gun.user()   |
| ! | options      |  gun.get('something').not() |

### options/not
| User Interaction        | Type           | Example  |
| ------------- |:-------------:| -----:|
| _ | path/not | gun.get('something').not() |
| * | alias/not     |   gun.get('~@somealias').not() |
| ~ | publickey/not | gun.user('publickey').not()|
| $ | user/not     |   gun.user().not() |

### users
if you use gun-fetch without a special character as the first letter, then it will assume you are wanting to have user interaction
```javascript
fetch('gun://someUserAlias', {method: 'GET'}) // if you are logged in as someUserAlias, gun-fetch will return the someUserAlias user information
```

### usage
x = special character

xsomething - as you can see there is only one special character, it is the first character, this is a regular query, x can be the following(_, *, ~, $, !)

xxsomething - there are two special character, this is an options/not query, first x is ! and the second x is the following(_, *, ~, $)

something - there are no special characters here, this is a user creation, deletion, logging in and leaving query, if no special character is user, then you are wanting a user interaction

## examples
```javascript
fetch('gun://_testpath/testing', {method: 'GET'}) // same as gun.get('testpath').get('testing')

fetch('gun://*testalias/testing', {method: 'GET'}) // same as gun.get('~@testalias').get('testing')

fetch('gun://~testpublickey/testing', {method: 'GET'}) // same as gun.user('testpublickey').get('testing')

fetch('gun://$testuser/testing', {method: 'GET'}) // same as gun.user().get('testing')

fetch('gun://!_test/testing', {method: 'OPTIONS'}) // ! is the NOT/OPTIONS character, _ is the path character, so this is gun.get('test').get('testing').not(data => {data is not found})
```