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

let test = await fetch('gun://hello/test/testing', {method: 'GET'})

let testText = await test.text()

// show the data
console.log(testText)
```
### special characters
gun-fetch uses special characters to make specific types of queries
| Character        | Type           | Example  |
| ------------- |:-------------:| -----:|
| _ | publickey | gun.get('something') |
| * | alias     |   gun.get('~@someuser') |
| ~ | user crud      |  gun.user().get().put().once()   |
| $ | user interaction     |  gun.user().auth() |

### path
if you use gun-fetch without a special character, then it will assume you are wanting to make a regular path query
```javascript
fetch('gun://something', {method: 'GET'}) // gun-fetch will return the result of gun.get('something')
```

### usage
x = special character

xsomething - as you can see there is only one special character, it is the first character, this is a user query, x can be the following(_, *, ~)

somethingx - this is a single special character at the end, this is a user interaction, x is ($)

something - there are no special characters here, this is a regular path query

if a query does not have any special characters, you are making a standard path query
if you have a special character, you are making a user query/interaction

## examples
```javascript
fetch('gun://testpath/testing', {method: 'GET'}) // same as gun.get('testpath').get('testing')

fetch('gun://*testalias/testing', {method: 'GET'}) // same as gun.get('~@testalias').get('testing')

fetch('gun://_testpublickey/testing', {method: 'GET'}) // same as gun.user('testpublickey').get('testing')

fetch('gun://~testuser/testing', {method: 'GET'}) // same as gun.user().get('testing')

fetch('gun://test/testing', {method: 'OPTIONS'}) // OPTIONS method is for the NOT query, the result is gun.get('test').get('testing').not(data => {data is not found})
```