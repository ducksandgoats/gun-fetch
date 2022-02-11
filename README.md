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
| Character        | Type           |
| ------------- |:-------------:|
| _ | special queries |
| - | hex encoded     |

### usage
`fetch('gun://_someuser')` | if the text after `_` does not contain special characters, then this will be a user query | `gun.get(~@someuser)`\

`fetch('gun://_some.gun-key_here')` | if the text after the `_` contains special characters, then it will be a public key query | `gun.get(~some.pub-key_here)`\

`fetch('gun://_', {method: 'PUT', body: JSON.stringify({user: 'someuser', pass: 'somepass'})})` | if there is only `_` without any text, then this will be a user register/login query | `gun.user()`\

`fetch('gun://somedata')` | if there is no `_` with text, then it will be a regular query | `gun.get(somedata)`\

`fetch('gun://-736f6d657465737474657874')` | if there is a `-` then it will decode the hex encoded query | - means decode 74657374696e67 which decodes into "testing", which means it will be `gun.get(testing)`

`fetch('gun://_', {method: 'PUT', headers: {'X-Create': 'true'}, body: JSON.stringify({user: 'username', pass: 'password'})})` | if the headers have a `headers['X-Create']` key then a new user will be created

`fetch('gun://_', {method: 'PUT', headers: {'X-Create': 'true'}, body: JSON.stringify({user: 'username', pass: 'password'})})` | if the headers have a `headers['X-Create']` key then a new user will be created

`fetch('gun://_', {method: 'PUT', headers: {'X-Create': 'true'}, body: JSON.stringify({user: 'username', pass: 'password'})})` | if the headers have a `headers['X-Create']` key then a new user will be created

`fetch('gun://_', {method: 'PUT', headers: {}, body: JSON.stringify({user: 'username', pass: 'password'})})` | if the headers does not have a `headers['X-Create']` key then the user will login, a new user will not be created, you will be logging in as a user who has already been registered

`fetch('gun://somedata/some/path/to/data', {method: 'PUT', headers: {'X-Set'}, body: JSON.stringify({message: 'message', data: 'data'})})` | if the headers have a `headers['X-Set']` key then the data will be used in a gundb set query like `gun.get('somedata').get('some').get('path').get('to').get('data').set({message: 'message', data: 'data'})`

`fetch('gun://somedata/some/path/to/data', {method: 'PUT', headers: {}, body: JSON.stringify({message: 'message', data: 'data'})})` | if the headers does not have a `headers['X-Set']` key then the data will be used in a gundb put query like `gun.get('somedata').get('some').get('path').get('to').get('data').put({message: 'message', data: 'data'})`

`fetch('gun://somedata/some/path/to/data', {method: 'DELETE', headers: {'X-Unset': 'true'}, body: JSON.stringify({message: 'message', data: 'data'})})` | if the headers have a `headers['X-Set']` key then the data will be used in a gundb unset query like `gun.get('somedata').get('some').get('path').get('to').get('data').unset({message: 'message', data: 'data'})`

`fetch('gun://somedata/some/path/to/data', {method: 'DELETE', headers: {}, body: JSON.stringify({message: 'message', data: 'data'})})` | if the headers does not have a `headers['X-Unset']` key then the data will be null in a gundb put query like `gun.get('somedata').get('some').get('path').get('to').get('data').put(null)`

## notes
more to come