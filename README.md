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

## notes
so to recap, here is how using gun-fetch would work

if you want to create/destroy/login/logout as a user, then use the following
gun://somealiasthing$

$ = special character for user auth, goes at the end of the hostname, password goes in the body as a string the dot in the end is what tells gun-fetch that you are wanting user auth interaction

if you want all other queries(not involving authentication), then use the following

gun://someregularthing - path, no special characters > gun.get(someregularthing)

gun://_someregularthing - pubkey, _ is the special character > gun.user(someregularthing)

gun://*someregularthing - alias, * is the special character > gun.get(~@someregularthing)

gun://~someregularthing - user session/user currently logged in, ~ is the special character > gun.user().auth().get(someregularthing)

the methods that are used is the following, remember this is how the methods would work without a $ special character at the end of the hostname/alias, $ is the special character for user auth

GET, PUT, PATCH, DELETE, POST, OPTIONS

GET: read data

PUT: write data, must have body

PATCH: delete data, body(must be a falsey value, null is preferred) is optional, if no body is provided, then body will be turned to null(next update)

POST: same as PUT, but uses gun.set(), might be removed later on

DELETE: same as PATCH, but uses gun.unset(), might be removed later on

OPTIONS: shows if data is NOT there, uses gun.get('something').not()

now we will talk about which methods will be responsible for user auth, assume the url is the following - gun://someAlias$, remember $ is the special character for user auth, and it goes at the end of the hostname/alias

GET: if logged in, returns the user, if not logged in, returns error message

POST: creates the user

PUT: logs in the user

PATCH: logs out the user

DELETE: destroys(deletes) the user

OPTIONS: returns whether user is logged in or not

if anything else is needed, let me know

## examples
```javascript
fetch('gun://testpath/testing', {method: 'GET'}) // same as gun.get('testpath').get('testing')

fetch('gun://*testalias/testing', {method: 'GET'}) // same as gun.get('~@testalias').get('testing')

fetch('gun://_testpublickey/testing', {method: 'GET'}) // same as gun.user('testpublickey').get('testing')

fetch('gun://~testuser/testing', {method: 'GET'}) // same as gun.user().get('testing')

fetch('gun://test/testing', {method: 'OPTIONS'}) // OPTIONS method is for the NOT query, the result is gun.get('test').get('testing').not(data => {data is not found})
```