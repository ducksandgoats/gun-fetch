# gun-fetch

Fetch With GunDB

```javascript
const path = require('path')
const options = {file: path.resolve('./storage'), relay: false}
// file: path where data will be saved
// relay: boolean, truthy means that gun-fetch will connect to relays, falsy means that gun-fetch will not connect to any relays

const gunFetch = require('gun-fetch')

const fetch = gunFetch(options)

let test = await fetch('gun://hello/test/testing', {method: 'GET'})

let testText = await test.text()

// show the data
console.log(testText)
```
## this readme will be updated soon, there has been a lot of changes, the method `HEAD` is now supported

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

`fetch('gun://somedata')` | if there is no `_` with text, then it will be a regular query | `gun.get(somedata)`

`fetch('gun://somedata/someotherdata')` | if there is no `_` with text, then it will be a regular query | `gun.get(somedata).get(someotherdata)`

`fetch('gun://-736f6d657465737474657874')` | if there is a `-` then it will decode the hex encoded query | - means decode 74657374696e67 which decodes into "testing", which means it will be `gun.get(testing)`

`fetch('gun://_', {method: 'GET', headers: {'X-Alias': 'someAliasHere'}})` | if the headers have a `headers['X-Alias']` key then it will return whether that alias is logged in or not

`fetch('gun://some/data/to/paginate', {method: 'GET', headers: {'X-Paginate': 'someGunDBPaginateObject'}})` | if the headers have a `headers['X-Alias']` key then it will return whether that alias is logged in or not

`fetch('gun://some/data/to/check', {method: 'GET', headers: {'X-Not': 'true'}})` | if the headers have a `headers['X-Alias']` key then it will return whether that alias is logged in or not

`fetch('gun://_', {method: 'PUT', headers: {'X-Create': 'someAliasHere'}, body: 'somePasswordHere'})` | if the headers have a `headers['X-Create']` key then a new user will be created like `gun.user().create()`

`fetch('gun://_', {method: 'PUT', headers: {'X-Login': 'someAliasHere'}, body: 'somePasswordHere'})` | if the headers have a `headers['X-Auth']` key then the user will be logged in like `gun.user().auth()`

`fetch('gun://somedata/some/path/to/data', {method: 'PUT', headers: {'X-Set'}, body: JSON.stringify({message: 'message', data: 'data'})})` | if the headers have a `headers['X-Set']` key then the data will be used in a gundb set query like `gun.get('somedata').get('some').get('path').get('to').get('data').set({message: 'message', data: 'data'})`

`fetch('gun://somedata/some/path/to/data', {method: 'PUT', headers: {}, body: JSON.stringify({message: 'message', data: 'data'})})` | if the headers does not have a `headers['X-Set']` key then the data will be used in a gundb put query like `gun.get('somedata').get('some').get('path').get('to').get('data').put({message: 'message', data: 'data'})`

`fetch('gun://somedata/some/path/to/data', {method: 'DELETE', headers: {'X-Unset': 'true'}, body: JSON.stringify({message: 'message', data: 'data'})})` | if the headers have a `headers['X-Set']` key then the data will be used in a gundb unset query like `gun.get('somedata').get('some').get('path').get('to').get('data').unset({message: 'message', data: 'data'})`

`fetch('gun://somedata/some/path/to/data', {method: 'DELETE', headers: {}, body: JSON.stringify({message: 'message', data: 'data'})})` | if the headers does not have a `headers['X-Unset']` key then the data will be null in a gundb put query like `gun.get('somedata').get('some').get('path').get('to').get('data').put(null)`

`fetch('gun://_', {method: 'DELETE', headers: {'X-Logout': 'someAliasHere'}})` | if the headers have a `headers['X-Logout']` key then the alias will be logged out like `gun.user().leave()`

`fetch('gun://_', {method: 'DELETE', headers: {'X-Delete': 'somePasswordHere'}, body: 'somePasswordHere'})` | if the headers ave a `headers['X-Delete']` key then the alias will be deleted like `gun.user().delete()`

## notes
more to come