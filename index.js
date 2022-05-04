const Gun = require('gun')
const makeFetch = require('make-fetch')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const http = require('http')
const https = require('https')
require('gun/lib/path')
const SEA = Gun.SEA

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
  const startRelay = finalOpts.relay
  const useTimeOut = finalOpts.timeout

  if (fileLocation && (!fs.existsSync(fileLocation))) {
    fs.mkdirSync(fileLocation)
  }

  const gun = ((finalOpts) => {
    if(finalOpts.gun){
      return finalOpts.gun
    } else {
      return Gun(finalOpts)
    }
  })(finalOpts)

  const user = gun.user()
  // const timeout = finalOpts.timeout

  // function getIndexedObjectFromArray(arr){
  //   return arr.reduce((acc, item) => {
  //     return {
  //       ...acc,
  //       [item.id]: item,
  //     }
  //   }, {})
  // }
  
  // function getArrayFromIndexedObject(indexedObj){
  //   return Object.values(indexedObj)
  // }

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
    const check = Object.keys(gun.back('opt.peers'))
    if(check.length > 2){
      throw new Error('there are already enough relays')
    }
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
    relays.sort(() => Math.random() - 0.5)
    for(let relay of relays){
      if(check.length > 2){
        break
      } else {
        if(!isURL(relay) || check.includes(relay) || !await checkPeer(relay)){
          continue
        } else {
          check.push(relay)
        }
        await new Promise((resolve) => setTimeout(() => resolve(), 1000))
      }
    }
    relays = null
    return check
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

  function queryizeReq (mainReq, auth) {
    if (auth) {
      return mainReq.multiple ? user.path(mainReq.mainPath) : user
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
    afterRelays().then(data => {
      if(data.length){
        console.log('relays are good')
        gun.opt({peers: data})
      } else {
        console.log('relays are bad')
      }
    }).catch(err => console.error(err))
  }

  const fetch = makeFetch(async request => {
    const { url, method, headers, body } = request
    const mainReq = headers.accept && headers.accept.includes('text/html')
    const mainRes = mainReq ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8'

    try {
      const { hostname, pathname, protocol } = new URL(url)
      const mainHostname = hostname && hostname[0] === encodeType ? Buffer.from(hostname.slice(1), 'hex').toString('utf-8') : hostname

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
            if (!user.is || !Boolean(await SEA.verify(headers['x-authentication'], user.check.pub))) {
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
          if(headers['x-relay']){
            if (Object.keys(gun.back('opt.peers')).length) {
              return { statusCode: 200, headers: {'X-Relay': 'true'}, data: [] }
            } else {
              return { statusCode: 400, headers: {'X-Relay': 'false'}, data: [] }
            }
          } else if(headers['x-node']){
            if (Object.keys(gun.back('opt.peers')).includes(headers['x-node'])) {
              return { statusCode: 200, headers: {'X-Node': headers['x-node']}, data: [] }
            } else {
              return { statusCode: 400, headers: {'X-Node': headers['x-node']}, data: [] }
            }
          } else if (headers['x-peer']) {
            if (!isURL(headers['x-peer']) || !await checkPeer(headers['x-peer'])) {
              return { statusCode: 400, headers: {'X-Peer': headers['x-peer']}, data: [] }
            } else {
              const mesh = gun.back('opt.mesh')
              const relays = Object.keys(gun.back('opt.peers'))
              relays.sort(() => Math.random() - 0.5)
              while(relays.length > 2){
                // relays.splice(Math.floor(Math.random() * relays.length), 1)
                mesh.bye(relays.pop())
              }
              relays.push(headers['x-peer'])
              gun.opt({peers: relays})
              return { statusCode: 200, headers: {'X-Peer': headers['x-peer']}, data: [] }
            }
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
            if (!user.is || !Boolean(await SEA.verify(headers['x-authentication'], user.check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>either user is not logged in, or you are not verified</p></div></body></html>`] : [JSON.stringify('either user is not logged in, or you are not verified')] }
            }
          }
          // if the user is authenticated, then we turn the request into a query
          gunQuery = queryizeReq(main, headers['x-authentication'])
          // if x-not or x-paginate is not sent, then we assume this is a regular query
          if (headers['x-paginate']) {
            const queryTimer = headers['x-timer'] && headers['x-timer'] !== '0' ? JSON.parse(headers['x-timer']) * 1000 : 5000
            mainData = await new Promise((resolve) => {
              const arr = []
              gunQuery.get(JSON.parse(headers['x-paginate'])).once((data) => {console.log(typeof(data))}).map().once((found) => {
                // if(found !== undefined){
                //   // delete found['_']
                  arr.push(found)
                // } else {
                //   // might as well log something
                //   console.log('data is ', found)
                // }
              })
              setTimeout(() => {
                // arr.forEach(data => {if(data !== undefined){delete data['_']}})
                arr.shift()
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
            // delete mainData['_']
            return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${mainData}</p></div></body></html>`] : [JSON.stringify(mainData)] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>Data is undefined, it is empty</p></div></body></html>`] : [JSON.stringify('Data is undefined, it is empty')] }
          }
        } else {
          if (user.is) {
            return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>you are logged in as ${headers['x-alias']}</p></div></body></html>`] : [JSON.stringify(`you are logged in as ${headers['x-alias']}`)] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>you are not logged in as ${headers['x-alias']}</p></div></body></html>`] : [JSON.stringify(`you are not logged in as ${headers['x-alias']}`)] }
          }
        }
      } else if (method === 'PUT') {
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          if (headers['x-authentication']) {
            if (!user.is || !Boolean(await SEA.verify(headers['x-authentication'], user.check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>either user is not logged in, or you are not verified</p></div></body></html>`] : [JSON.stringify('either user is not logged in, or you are not verified')] }
            }
          }
          gunQuery = queryizeReq(main, headers['x-authentication'])
          const useBody = await getBody(body)
          const queryTimer = headers['x-timer'] && headers['x-timer'] !== '0' ? JSON.parse(headers['x-timer']) * 1000 : useTimeOut
          if(headers['x-opt']){
            gunQuery = gunQuery.put(useBody, putData => {console.log(putData.err || putData.ok)}, JSON.parse(headers['x-opt']))
          } else {
            gunQuery = gunQuery.put(useBody, putData => {console.log(putData.err || putData.ok)})
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
            // delete mainData['_']
            return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${mainData}</p></div></body></html>`] : [JSON.stringify(mainData)] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>Data is undefined, it is empty</p></div></body></html>`] : [JSON.stringify('Data is undefined, it is empty')] }
          }
        } else {
          let mainData = null
          if (headers['x-create']) {
            const useBody = await getBody(body)
            mainData = await new Promise((resolve) => {
              user.create(headers['x-create'], useBody, ack => {
                resolve(ack)
              }, { already: false })
            })
            if (mainData.err) {
              return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${mainData}</p></div></body></html>`] : [JSON.stringify(mainData)] }
            } else {
              return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${mainData}</p></div></body></html>`] : [JSON.stringify(mainData)] }
            }
          } else if (headers['x-login']) {
            const useBody = await getBody(body)
            if (user.is) {
              if (user.check && user.check.hash === await SEA.work(headers['x-login'], useBody)) {
                return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${{token: user.check.token, pub: user.check.pub}}</p></div></body></html>`] : [JSON.stringify({token: user.check.token, pub: user.check.pub})] }
              } else {
                return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>password is incorrect</p></div></body></html>`] : [JSON.stringify('password is incorrect')] }
              }
            } else {
              mainData = await new Promise((resolve) => {
                user.auth(headers['x-login'], useBody, ack => {
                  resolve(ack)
                })
              })
              if (mainData.err) {
                user.check = null
                user.leave()
                return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${mainData}</p></div></body></html>`] : [JSON.stringify(mainData)] }
              } else {
                user.check = {}
                user.check.hash = await SEA.work(headers['x-login'], useBody)
                user.check.pub = mainData.sea.pub
                user.check.token = await SEA.sign(await SEA.work(crypto.randomBytes(16).toString('hex')), mainData.sea)
                user,check.alias = headers['x-login']
                return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${{token: user.check.token, pub: user.check.pub}}</p></div></body></html>`] : [JSON.stringify({token: user.check.token, pub: user.check.pub})] }
              }
            }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>"X-Create" or "X-Login" header is needed with the alias</p></div></body></html>`] : [JSON.stringify('"x-create" or "x-login" header is needed with the alias')] }
          }
        }
      } else if (method === 'DELETE') {
        if (main.mainQuery) {
          let gunQuery = null
          let mainData = null
          if (headers['x-authentication']) {
            if (!user.is || !Boolean(await SEA.verify(headers['x-authentication'], user.check.pub))) {
              return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>either user is not logged in, or you are not verified</p></div></body></html>`] : [JSON.stringify('either user is not logged in, or you are not verified')] }
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
            // delete mainData['_']
            return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${mainData}</p></div></body></html>`] : [JSON.stringify(mainData)] }
          } else {
            return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>Data is undefined, it is empty</p></div></body></html>`] : [JSON.stringify('Data is undefined, it is empty')] }
          }
        } else {
          let mainData = null
          if (!headers['x-delete'] && !headers['x-logout']) {
            return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>"X-Delete" or "X-Logout" header is needed with the alias</p></div></body></html>`] : [JSON.stringify('"x-delete" or "x-logout" header is needed with the alias')] }
          } else if (headers['x-logout']) {
            if (user.is) {
              if (headers['x-authentication']) {
                if (user.check && user.check.alias !== headers['x-logout'] && !Boolean(await SEA.verify(headers['x-authentication'], user.check.pub))) {
                  return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>either user is not logged in, or you are not verified</p></div></body></html>`] : [JSON.stringify('either user is not logged in, or you are not verified')] }
                } else {
                  user.check = null
                  user.leave()
                  return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>user has been logged out</p></div></body></html>`] : [JSON.stringify('user has been logged out')] }
                }
              } else {
                return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>"X-Authentication" header is needed</p></div></body></html>`] : [JSON.stringify('"X-Authentication" header is needed')] }
              }
            } else {
              return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>user is currently logged out</p></div></body></html>`] : [JSON.stringify('user is currently logged out')] }
            }
          } else if (headers['x-delete']) {
            const useBody = await getBody(body)
            if (user.is) {
              if (headers['x-authentication']) {
                if (user.check && user.check.alias !== headers['x-delete'] && !Boolean(await SEA.verify(headers['x-authentication'], user.check.pub))) {
                  return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>either user is not logged in, or you are not verified</p></div></body></html>`] : [JSON.stringify('either user is not logged in, or you are not verified')] }
                } else {
                  if(user.check && user.check.hash === await SEA.work(headers['x-delete'], useBody)){
                    user.check = null
                    user.leave()
                    mainData = await new Promise((resolve) => {
                      user.delete(headers['x-delete'], useBody, ack => {
                        resolve(ack)
                      })
                    })
                    return { statusCode: 200, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>${mainData}</p></div></body></html>`] : [JSON.stringify(mainData)] }
                  } else {
                    return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>not authorized</p></div></body></html>`] : [JSON.stringify('not authorized')] }
                  }
                }
              } else {
                return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>"X-Authentication" header is needed</p></div></body></html>`] : [JSON.stringify('"X-Authentication" header is needed')] }
              }
            } else {
              return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>user is currently logged out</p></div></body></html>`] : [JSON.stringify('user is currently logged out')] }
            }
          }
        }
      } else {
        return { statusCode: 400, headers: { 'Content-Type': mainRes }, data: mainReq ? [`<html><head><title>${mainHostname}</title></head><body><div><p>${pathname}</p><p>method is not supported</p></div></body></html>`] : [JSON.stringify('method is not supported')] }
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
