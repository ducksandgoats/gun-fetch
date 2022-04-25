const makeFetch = require('make-fetch')
const Gun = require('gun')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const http = require('http')
const https = require('https')
require('gun/lib/path')
const SEA = Gun.SEA

const RELAYS = []

const DEFAULT_OPTS = {
  file: path.resolve('./storage'),
  relays: null,
  timeout: 15000,
  relay: false
}

const SUPPORTED_METHODS = ['HEAD', 'GET', 'PUT', 'DELETE']
const encodeType = '-'
const hostType = '_'

module.exports = function makeGunFetch (opts = {}) {
  const finalOpts = { ...DEFAULT_OPTS, ...opts }

  const fileLocation = finalOpts.file
  const startRelay = finalOpts.relay && !finalOpts.gun
  const useTimeOut = finalOpts.timeout

  if (fileLocation && (!fs.existsSync(fileLocation))) {
    fs.mkdirSync(fileLocation)
  }

  const gun = (() => {
    if(finalOpts.gun){
      // if(finalOpts.relays){
      //   for(const data of finalOpts.relays){
      //     if(typeof(data) === 'string' && !RELAYS.includes(data)){
      //       RELAYS.push(data)
      //     }
      //   }
      // }
      return finalOpts.gun
    } else {
      return new Gun(finalOpts)
    }
  })(finalOpts)

  const users = {}
  // const timeout = finalOpts.timeout

  function getIndexedObjectFromArray(arr){
    return arr.reduce((acc, item) => {
      return {
        ...acc,
        [item.id]: item,
      }
    }, {})
  }
  
  function getArrayFromIndexedObject(indexedObj){
    return Object.values(indexedObj)
  }

  function beforeRelays(){

    function getUrls(str, lower = false){
      const regexp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?!&//=]*)/gi;
    
      if (typeof str !== "string") {
        throw new TypeError(
          `The str argument should be a string, got ${typeof str}`
        );
      }
    
      if (str) {
        let urls = str.match(regexp);
        if (urls) {
          return lower ? urls.map((item) => item.toLowerCase()) : urls;
        } else {
          undefined;
        }
      } else {
        undefined;
      }
    }
    
    return new Promise((resolve, reject) => {
      https.get('https://raw.githubusercontent.com/wiki/amark/gun/volunteer.dht.md', res => {
        // res.resume()
        let rejData = null
        let resData = ''
        function handleOff(){
          res.off('error', handleError)
          res.off('data', handleData)
          res.off('close', handleClose)
        }
        function handleData(datas){
          resData += datas
        }
        function handleError(err){
          handleOff()
          console.error(err)
          reject(rejData)
        }
        function handleClose(){
          handleOff()
          if(res.statusCode === 200 && resData){
            resolve(getUrls(resData.toString()))
          } else {
            reject(rejData)
          }
        }
        res.on('error', handleError)
        res.on('data', handleData)
        res.on('close', handleClose)
      })
    })
  }

  // async function afterRelays(){
  //   let relays = null
  //   const relayLocation = path.join(configLocation, './relays')
  //   try {
  //     relays = []
  //     if(await fs.pathExists(relayLocation)){
  //       const readFile = await fs.readFile(relayLocation)
  //       relays = [...relays, ...JSON.parse(readFile.toString())]
  //     }
  //     relays = Array.from(new Set([...relays, ...await beforeRelays()]))
  //   } catch (error) {
  //     console.error(error)
  //     relays = [
  //       'https://relay.peer.ooo/gun',
  //       'https://replicant.adamantium.online/gun',
  //       'http://gun-matrix.herokuapp.com/gun',
  //       'https://gun-ams1.maddiex.wtf:443/gun',
  //       'https://gun-sjc1.maddiex.wtf:443/gun',
  //       'https://shockblox-gun-server.herokuapp.com/gun',
  //       'https://mg-gun-manhattan.herokuapp.com/gun',
  //       'https://gunmeetingserver.herokuapp.com/gun',
  //       'https://gun-eu.herokuapp.com/gun',
  //       'https://gunjs.herokuapp.com/gun',
  //       'https://myriad-gundb-relay-peer.herokuapp.com/gun',
  //       'https://gun-armitro.herokuapp.com/',
  //       'https://fire-gun.herokuapp.com/gun',
  //       'http://34.101.247.230:8765/gun',
  //       'https://gun-manhattan.herokuapp.com/gun',
  //       'https://us-west.xerberus.net/gun',
  //       'https://dletta.rig.airfaas.com/gun',
  //       'https://e2eec.herokuapp.com/gun',
  //       'https://gun-us.herokuapp.com/gun',
  //       'https://www.raygun.live/gun'
  //     ]
  //   }
  //   let putRelays = []
  //   for(let relay of relays){
  //     if(putRelays.includes(relay) || !isURL(relay) || !await checkPeer(relay) || RELAYS.includes(relay)){
  //       continue
  //     } else {
  //       RELAYS.push(relay)
  //       putRelays.push(relay)
  //     }
  //     await new Promise((resolve) => setTimeout(() => resolve(), 2000))
  //   }
  //   await fs.writeFile(relayLocation, JSON.stringify(putRelays))
  //   return putRelays
  // }
  
  async function afterRelays(){
    let relays = null
    try {
      relays = await beforeRelays()
    } catch (error) {
      console.error(error)
      relays = [
        'https://relay.peer.ooo/gun',
        'https://replicant.adamantium.online/gun',
        'http://gun-matrix.herokuapp.com/gun',
        'https://gun-ams1.maddiex.wtf:443/gun',
        'https://gun-sjc1.maddiex.wtf:443/gun',
        'https://shockblox-gun-server.herokuapp.com/gun',
        'https://mg-gun-manhattan.herokuapp.com/gun',
        'https://gunmeetingserver.herokuapp.com/gun',
        'https://gun-eu.herokuapp.com/gun',
        'https://gunjs.herokuapp.com/gun',
        'https://myriad-gundb-relay-peer.herokuapp.com/gun',
        'https://gun-armitro.herokuapp.com/',
        'https://fire-gun.herokuapp.com/gun',
        'http://34.101.247.230:8765/gun',
        'https://gun-manhattan.herokuapp.com/gun',
        'https://us-west.xerberus.net/gun',
        'https://dletta.rig.airfaas.com/gun',
        'https://e2eec.herokuapp.com/gun',
        'https://gun-us.herokuapp.com/gun',
        'https://www.raygun.live/gun'
      ]
    }
    let putRelays = []
    for(let relay of relays){
      if(putRelays.includes(relay) || !isURL(relay) || !await checkPeer(relay) || RELAYS.includes(relay)){
        continue
      } else {
        RELAYS.push(relay)
        putRelays.push(relay)
      }
      await new Promise((resolve) => setTimeout(() => resolve(), 1000))
    }
    return putRelays
  }
  
  function checkPeer(url){
    if(url.startsWith('https')){
      return new Promise((resolve) => {
        let mainData = null
        const req = https.get(url)
        function handleOff(){
          req.off('error', handleErr)
          req.off('response', handleRes)
          req.off('close', handleClose)
        }
        function handleErr(err){
          handleOff()
          console.error(err)
          resolve(mainData)
        }
        function handleRes(res){
          res.resume()
          // handleOff()
          mainData = res.statusCode === 200
        }
        function handleClose(){
          handleOff()
          resolve(mainData)
        }
        req.on('error', handleErr)
        req.on('response', handleRes)
        req.on('close', handleClose)
      })
    } else if(url.startsWith('http')){
      return new Promise((resolve) => {
        let mainData = null
        const req = http.get(url)
        function handleOff(){
          req.off('error', handleErr)
          req.off('response', handleRes)
          req.off('close', handleClose)
        }
        function handleErr(err){
          handleOff()
          console.error(err)
          resolve(mainData)
        }
        function handleRes(res){
          res.resume()
          // handleOff()
          mainData = res.statusCode === 200
        }
        function handleClose(){
          handleOff()
          resolve(mainData)
        }
        req.on('error', handleErr)
        req.on('response', handleRes)
        req.on('close', handleClose)
      })
    } else {
      return null
    }
  }
  
  function isURL(url){
    try {
      const checkUrl = new URL(url)
      return (checkUrl.protocol === 'https:' || checkUrl.protocol === 'http:') && checkUrl.pathname === '/gun'
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async function getBody (body) {
    let mainData = ''
    for await (const data of body) {
      mainData += data
    }
    try {
      mainData = JSON.parse(mainData)
    } catch (error) {
      console.error(error)
    }
    return mainData
  }

  function formatReq (hostname, pathname) {
    const mainReq = {}
    mainReq.mainPath = `${hostname}${pathname}`.split('/').filter(Boolean).map(data => { return decodeURIComponent(data) })
    mainReq.multiple = mainReq.mainPath.length > 1
    mainReq.mainHost = mainReq.mainPath.shift()
    mainReq.queryType = mainReq.mainHost[0] === hostType ? mainReq.mainHost[0] : ''
    mainReq.mainHost = mainReq.mainHost.replace(mainReq.queryType, '')
    mainReq.mainPath = mainReq.mainPath.join('.')

    if (mainReq.queryType) {
      if (mainReq.mainHost) {
        mainReq.mainQuery = true
      } else {
        mainReq.mainQuery = false
      }
    } else {
      mainReq.mainQuery = true
    }

    return mainReq
  }

  function takeOutObj(obj){
    for(const i in obj){
      obj[i] = null
    }
    return obj
  }

  function queryizeReq (mainReq, user) {
    if (user) {
      return mainReq.multiple ? users[mainReq.mainHost].path(mainReq.mainPath) : users[mainReq.mainHost]
    } else {
      if (mainReq.queryType) {
        if (mainReq.mainHost.includes('.') || mainReq.mainHost.includes('-') || mainReq.mainHost.includes('_')) {
          return mainReq.multiple ? gun.get('~' + mainReq.mainHost).path(mainReq.mainPath) : gun.get('~' + mainReq.mainHost)
        } else {
          return mainReq.multiple ? gun.get('~@' + mainReq.mainHost).path(mainReq.mainPath) : gun.get('~@' + mainReq.mainHost)
        }
      } else {
        return mainReq.multiple ? gun.get(mainReq.mainHost).path(mainReq.mainPath) : gun.get('~' + mainReq.mainHost)
      }
    }
  }

  if(startRelay){
    afterRelays().then(res => {
      if(res.length){
        console.log('relays are good')
        gun.opt({peers: res})
      } else {
        console.log('relays are bad')
      }
    }).catch(err => console.error(err))
  }

  const fetch = makeFetch(async request => {
    const { url, method, headers, body } = request

    try {
      const { hostname, pathname, protocol } = new URL(url)
      let mainHostname = null
      if (hostname && hostname[0] === encodeType) {
        mainHostname = Buffer.from(hostname.slice(1), 'hex').toString('utf-8')
      } else {
        mainHostname = hostname
      }

      if (protocol !== 'gun:' || !method || !SUPPORTED_METHODS.includes(method) || !mainHostname || mainHostname[0] === encodeType || !/^[a-zA-Z0-9-_.]+$/.test(mainHostname)) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('query is incorrect')] }
      }

      const main = formatReq(mainHostname, pathname)

      if(method === 'HEAD'){
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          // if this is a query for the user space, then we make sure the user is authenticated
          if (headers['x-authentication']) {
            if (!users[main.mainHost] || !Boolean(await SEA.verify(headers['x-authentication'], users[main.mainHost].check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
            }
          }
          // if the user is authenticated, then we turn the request into a query
          gunQuery = queryizeReq(main, headers['x-authentication'])
          // if x-not or x-paginate is not sent, then we assume this is a regular query
          mainData = await new Promise((resolve) => {
            gunQuery.once(found => {
              // if(found){
              //   delete found['_']
              // }
              resolve(found)
            })
          })
          if (mainData !== undefined) {
            return { statusCode: 200, headers: {}, data: [] }
          } else {
            return { statusCode: 400, headers: {}, data: [] }
          }
        } else {
          if(headers['x-status']){
            if (!RELAYS.length) {
              return { statusCode: 400, headers: {'X-Status': 'false'}, data: [] }
            } else {
              return { statusCode: 200, headers: {'X-Status': 'true'}, data: [] }
            }
          } else if(headers['x-node']){
            if (!RELAYS.includes(headers['x-node'])) {
              return { statusCode: 400, headers: {'X-Node': headers['x-node']}, data: [] }
            } else {
              return { statusCode: 200, headers: {'X-Node': headers['x-node']}, data: [] }
            }
          } else if(headers['x-nodes']){
            const doesNotHaveIt = []
            try {
              for(const relay of JSON.parse(headers['x-nodes'])){
                if(!RELAYS.includes(relay)){
                  doesNotHaveIt.push(relay)
                }
              }
            } catch (err) {
              console.error(err)
            }
            if (doesNotHaveIt.length) {
              return { statusCode: 400, headers: {'X-Nodes': JSON.stringify(doesNotHaveIt)}, data: [] }
            } else {
              return { statusCode: 200, headers: {'X-Nodes': headers['x-nodes']}, data: [] }
            }
          } else if (headers['x-peer']) {
            if (!isURL(headers['x-peer']) || RELAYS.includes(headers['x-peer']) || !await checkPeer(headers['x-peer'])) {
              return { statusCode: 400, headers: {'X-Peer': headers['x-peer']}, data: [] }
            } else {
              RELAYS.push(headers['x-peer'])
              gun.opt({peers: [headers['x-peer']]})
              return { statusCode: 200, headers: {'X-Peer': headers['x-peer']}, data: [] }
            }
          } else if(headers['x-peers']){
            const peersArr = []
            try {
              for(const relay of JSON.parse(headers['x-peers'])){
                if(!isURL(relay) || RELAYS.includes(relay) || !await checkPeer(relay)){
                  continue
                } else {
                  peersArr.push(relay)
                }
              }
            } catch (err) {
              console.error(err)
            }
            if(!peersArr.length){
              return { statusCode: 400, headers: {'X-Peers': JSON.stringify(peersArr)}, data: [] }
            } else {
              RELAYS.push(...peersArr)
              gun.opt({peers: peersArr})
              return { statusCode: 200, headers: {'X-Peers': JSON.stringify(peersArr)}, data: [] }
            }
          } else if(headers['x-relay'] && JSON.parse(headers['x-relay']) === true){
            return RELAYS.length ? { statusCode: 200, headers: {'X-Relay': JSON.stringify(RELAYS.length)}, data: [] } : { statusCode: 400, headers: {'X-Relay': JSON.stringify(RELAYS.length)}, data: [] }
          } else if(headers['x-relay'] && JSON.parse(headers['x-relay']) === false){
            return RELAYS.length ? { statusCode: 200, headers: {'X-Relay': 'true'}, data: [] } : { statusCode: 400, headers: {'X-Relay': 'false'}, data: [] }
          } else {
            return { statusCode: 400, headers: {}, data: [] }
          }
        }
      } else if (method === 'GET') {
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          // if this is a query for the user space, then we make sure the user is authenticated
          if (headers['x-authentication']) {
            if (!users[main.mainHost] || !Boolean(await SEA.verify(headers['x-authentication'], users[main.mainHost].check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
            }
          }
          // if the user is authenticated, then we turn the request into a query
          gunQuery = queryizeReq(main, headers['x-authentication'])
          // if x-not or x-paginate is not sent, then we assume this is a regular query
          if (headers['x-paginate']) {
            const queryTimer = headers['x-timer'] && headers['x-timer'] !== '0' ? JSON.parse(headers['x-timer']) * 1000 : 5000
            mainData = await new Promise((resolve) => {
              const arr = []
              gunQuery.get(JSON.parse(headers['x-paginate'])).once().map().once(found => {
                if(found !== undefined){
                  delete found['_']
                  arr.push(found)
                } else {
                  console.log('data in pagination was empty')
                }
              })
              setTimeout(() => {
                // arr.forEach(data => {if(data !== undefined){delete data['_']}})
                resolve(arr)
              }, queryTimer)
            })
          } else {
            const queryTimer = headers['x-timer'] && headers['x-timer'] !== '0' ? JSON.parse(headers['x-timer']) * 1000 : useTimeOut
            mainData = await Promise.race([
              new Promise((resolve, reject) => {
                setTimeout(() => {
                  const useError = new Error('query was timed out')
                  useError.name = 'ErrorTimeout'
                  reject(useError)
                }, queryTimer)
              }),
              new Promise((resolve, reject) => {
                gunQuery.once(found => {
                  resolve(found)
                })
              })
            ])
          }
          if (mainData !== undefined) {
            delete mainData['_']
            return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('Data is undefined, it is empty')] }
          }
        } else {
          if (headers['x-alias']) {
            if (users[headers['x-alias']]) {
              return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(`you are logged in as${headers['x-alias']}`)] }
            } else {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(`you are not logged in as ${headers['x-alias']}`)] }
            }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('"x-alias" header was not used')] }
          }
        }
      } else if (method === 'PUT') {
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          if (headers['x-authentication']) {
            if (!users[main.mainHost] || !Boolean(await SEA.verify(headers['x-authentication'], users[main.mainHost].check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
            }
          }
          gunQuery = queryizeReq(main, headers['x-authentication'])
          const useBody = await getBody(body)
          const queryTimer = headers['x-timer'] && headers['x-timer'] !== '0' ? JSON.parse(headers['x-timer']) * 1000 : useTimeOut
          if(headers['x-opt']){
            gunQuery = gunQuery.put(useBody, null, JSON.parse(headers['x-opt']))
          } else {
            gunQuery = gunQuery.put(useBody, null)
          }
          mainData = await Promise.race([
            new Promise((resolve, reject) => {
              setTimeout(() => {
                const useError = new Error('query was timed out')
                useError.name = 'ErrorTimeout'
                reject(useError)
              }, queryTimer)
            }),
            new Promise((resolve, reject) => {
              gunQuery.once(found => {
                resolve(found)
              })
            })
          ])
          if(mainData !== undefined){
            delete mainData['_']
            return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('Data is undefined, it is empty')] }
          }
        } else {
          let mainData = null
          if (!headers['x-create'] && !headers['x-login']) {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('"x-create" or "x-login" header is needed with the alias')] }
          } else if (headers['x-create']) {
            const useBody = await getBody(body)
            mainData = await new Promise((resolve) => {
              gun.user().create(headers['x-create'], useBody, ack => {
                resolve(ack)
              }, { already: false })
            })
            if (mainData.err) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
            } else {
              return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
            }
          } else if (headers['x-login']) {
            const useBody = await getBody(body)
            if (users[headers['x-login']]) {
              if (users[headers['x-login']].check.hash === await SEA.work(headers['x-login'], useBody)) {
                return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify({token: users[headers['x-login']].check.token, pub: users[headers['x-login']].check.pub}))] }
              } else {
                return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('password is incorrect')] }
              }
            } else {
              users[headers['x-login']] = gun.user()
              mainData = await new Promise((resolve) => {
                users[headers['x-login']].auth(headers['x-login'], useBody, ack => {
                  resolve(ack)
                })
              })
              if (mainData.err) {
                users[headers['x-login']].leave()
                delete users[headers['x-login']]
                return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
              } else {
                users[headers['x-login']].check = {}
                users[headers['x-login']].check.hash = await SEA.work(headers['x-login'], useBody)
                users[headers['x-login']].check.pub = mainData.sea.pub
                users[headers['x-login']].check.token = await SEA.sign(await SEA.work(crypto.randomBytes(16).toString('hex')), mainData.sea)
                return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify({token: users[headers['x-login']].check.token, pub: users[headers['x-login']].check.pub}))] }
              }
            }
          }
        }
      } else if (method === 'DELETE') {
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          if (headers['x-authentication']) {
            if (!users[main.mainHost] || !Boolean(await SEA.verify(headers['x-authentication'], users[main.mainHost].check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
            }
          }
          gunQuery = queryizeReq(main, headers['x-authentication'])
          const checkBody = await getBody(body)
          const useBody = checkBody === null ? checkBody : takeOutObj(checkBody)
          if(headers['x-opt']){
            gunQuery = gunQuery.put(useBody, cb => console.log(cb.err || cb.ok), JSON.parse(headers['x-opt']))
          } else {
            gunQuery = gunQuery.put(useBody, cb => console.log(cb.err || cb.ok))
          }
          const queryTimer = headers['x-timer'] && headers['x-timer'] !== '0' ? JSON.parse(headers['x-timer']) * 1000 : useTimeOut
          mainData = await Promise.race([
            new Promise((resolve, reject) => {
              setTimeout(() => {
                const useError = new Error('query was timed out')
                useError.name = 'ErrorTimeout'
                reject(useError)
              }, queryTimer)
            }),
            new Promise((resolve, reject) => {
              gunQuery.once(found => {
                resolve(found)
              })
            })
          ])
          if(mainData !== undefined){
            delete mainData['_']
            return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('Data is undefined, it is empty')] }
          }
        } else {
          let mainData = null
          if (!headers['x-delete'] && !headers['x-logout']) {
            return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('"x-delete" or "x-logout" header is needed with the alias')] }
          } else if (headers['x-logout']) {
            if (users[headers['x-logout']]) {
              if (headers['x-authentication']) {
                if (!Boolean(await SEA.verify(headers['x-authentication'], users[headers['x-logout']].check.pub))) {
                  return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('either user is not logged in, or you are not verified')] }
                } else {
                  users[headers['x-logout']].leave()
                  delete users[headers['x-logout']]
                  return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify({ message: 'User has been logged out' }))] }
                }
              } else {
                return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('the header x-authorization is required')] }
              }
            } else {
              return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('user is currently logged out')] }
            }
          } else if (headers['x-delete']) {
            if (users[headers['x-delete']]) {
              return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('user is currently logged in')] }
            } else {
              const useBody = await getBody(body)
              mainData = await new Promise((resolve) => {
                gun.user().delete(headers['x-delete'], useBody, ack => {
                  resolve(ack)
                })
              })
              return { statusCode: 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from(JSON.stringify(mainData))] }
            }
          }
        }
      } else {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' }, data: [Buffer.from('method is not supported')] }
      }
    } catch (e) {
      if(e.name === 'ErrorTimeout'){
        return { statusCode: 408, headers: {}, data: [e.stack] }
      } else {
        return { statusCode: 500, headers: {}, data: [e.stack] }
      }
    }
  })

  return fetch
}
