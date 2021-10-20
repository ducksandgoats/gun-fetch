const makeFetch = require('make-fetch')
const Gun = require('gun')
require('gun/lib/path')
require('gun/lib/not')
require('./edits/unset')
// require('gun/lib/unset')

// const LIST_OF_URLS = ["https://gun-manhattan.herokuapp.com/gun",
// "https://us-west.xerberus.net/gun",
// "http://gun-matrix.herokuapp.com/gun",
// "https://gun-ams1.maddiex.wtf:443/gun",
// "https://gun-sjc1.maddiex.wtf:443/gun",
// "https://dletta.rig.airfaas.com/gun",
// "https://mg-gun-manhattan.herokuapp.com/gun",
// "https://gunmeetingserver.herokuapp.com/gun",
// "https://e2eec.herokuapp.com/gun",
// "https://gun-us.herokuapp.com/gun",
// "https://gun-eu.herokuapp.com/gun",
// "https://gunjs.herokuapp.com/gun",
// "https://www.raygun.live/gun",
// "https://gun-armitro.herokuapp.com/",
// "https://fire-gun.herokuapp.com/gun"]

module.exports = function makeGunFetch(opts = {}){

    const gun = Gun(opts)

    const SUPPORTED_METHODS = ['GET', 'PUT', 'DELETE']
    const GUN_HEADERS = {TYPE: ['PATH', 'KEY', 'ALIAS', 'USER'], GET: ['REG', 'NOT'], PUT: ['INSERT', 'SET', 'USERCREATE', 'USERAUTH'], DELETE: ['REMOVE', 'UNSET', 'USERLEAVE', 'USERDELETE']}
    const users = {}
    // X-Auth uses GUN_HEADERS.USER
    // X-Gun user all other properties of GUN_HEADERS

    const fetch = makeFetch(async request => {

        // if(request.url.includes(' ')){
        //     return new Error('gun url can not contain spaces')
        // }

        if(request.body !== null){
            request.body = await getBody(request.body)
            try {
                // parse the body in case the body is a higher type of data that is stringified
                request.body = JSON.parse(request.body)
                // request.body = JSON.parse(await getBody(request.body))
            } catch (error) {
                // if there is an error trying to parse the body, then keep the body as it is
                console.log(error)
                // return {statusCode: 400, headers: {}, data: [JSON.stringify(error)]}
            }
        }
        
        const {url, method, headers, body} = request

          try {
            const {hostname, pathname, protocol} = new URL(url)

              if(protocol !== 'gun:'){
                  return new Error('invalid protocol, must be gun:')
              } else if(!method || !SUPPORTED_METHODS.includes(method)){
                  return {statusCode: 400, headers: {}, data: ['Error with Method']}
              } else if(!headers || !headers['x-gun-fig'] || !headers['x-gun-func']){
                  return {statusCode: 400, headers: {}, data: ['Error with Headers']}
              } else if(!hostname){
                  return {statusCode: 400, headers: {}, data: ['Error with Hostname']}
              }

              // declare main response variables, if everything is handled correctly then res variable will be sent back as a response
              let req = formatReq(`${hostname}${pathname}`)
              let query = null
              if(headers['x-gun-fig'] === GUN_HEADERS.TYPE[0]){
                 if(req.count > 2){
                     query = gun.get(req.parts.start).path(req.parts.endPath)
                 } else if(req.count === 2){
                     query = gun.get(req.parts.start).get(req.parts.end)
                 } else if(req.count === 1){
                     query = gun.get(req.parts.start)
                 } else {
                     return {statusCode: 400, headers: {}, data: ['Error with url']}
                 }
                } else if(headers['x-gun-fig'] === GUN_HEADERS.TYPE[1]){
                    if(req.count > 2){
                        query = gun.user(req.parts.start).path(req.parts.endPath)
                    } else if(req.count === 2){
                        query = gun.user(req.parts.start).get(req.parts.end)
                    } else if(req.count === 1){
                        query = gun.user(req.parts.start)
                    } else {
                        return {statusCode: 400, headers: {}, data: ['Error with url']}
                    }
                } else if(headers['x-gun-fig'] === GUN_HEADERS.TYPE[2]){
                    if(!users[req.parts.start]){
                        return {statusCode: 400, headers: {}, data: ['User is not logged in']}
                    } else {
                        if(req.count > 2){
                            query = users[req.parts.start].path(req.parts.endPath)
                        } else if(req.count === 2){
                            query = users[req.parts.start].get(req.parts.end)
                        } else if(req.count === 1){
                            query = users[req.parts.start]
                        } else {
                            return {statusCode: 400, headers: {}, data: ['Error with url']}
                        }
                    }
                } else if(headers['x-gun-fig'] === GUN_HEADERS.TYPE[3]){
                    query = req.parts.start
                }

              if(method === SUPPORTED_METHODS[0]){

                  /* 
                  handle get request with headers, if X-Gun header is NOT, then not method will be used
                  */
                  let res = {statusCode: 0, headers: {}, data: null}

                 if(!GUN_HEADERS.TYPE.includes(headers['x-gun-fig']) || !GUN_HEADERS.GET.includes(headers['x-gun-func'])){
                    return {statusCode: 400, headers: {}, data: ['Error with Headers']}
                 }

                  if(headers['x-gun-func'] === GUN_HEADERS.GET[0]){
                      let mainData = await new Promise((resolve) => {
                          query.once(found => {resolve(found)})
                    })
                    res.statusCode = 200
                    res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(res.data.length){
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    } else {
                        res.headers = {}
                    }
                  } else if(headers['x-gun-func'] === GUN_HEADERS.GET[1]){
                      
                      let checkClear = null

                        let mainData = await new Promise((resolve) => {
                            checkClear = setTimeout(() => {resolve({not: false, message: 'timed out, most likely this has data'})}, 15000)
                            query.not(found => {
                                resolve({found, not: true, message: 'done, most likely this does not have data'})
                            })
                        })

                        clearTimeout(checkClear)

                        res.statusCode = 200
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        } else {
                            res.headers = {}
                        }
                  }

                  return res

              } else if(method === SUPPORTED_METHODS[1]){

                /*
                handle put request with headers, if X-Gun header is SET, then set method will be used
                */
                let res = {statusCode: 0, headers: {}, data: null}

                if(!GUN_HEADERS.TYPE.includes(headers['x-gun-fig']) || !GUN_HEADERS.PUT.includes(headers['x-gun-func'])){
                    return {statusCode: 400, headers: {}, data: ['Error with Headers']}
                 }

                 if(headers['x-gun-func'] === GUN_HEADERS.PUT[0]){
                    let mainData = await new Promise((resolve) => {
                        query.put(body).once(found => {
                            resolve(found)
                        })
                    })
                    
                    res.statusCode = 200
                    res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(res.data.length){
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    } else {
                        res.headers = {}
                    }
                 } else if(headers['x-gun-func'] === GUN_HEADERS.PUT[1]){
                    let mainData = await new Promise((resolve) => {
                        query.set(body).once(found => {resolve(found)})
                    })
                    
                    res.statusCode = 200
                    res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(res.data.length){
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    } else {
                        res.headers = {}
                    }
                 } else if(headers['x-gun-func'] === GUN_HEADERS.PUT[2]){
                    if(!query.match(/^[0-9a-zA-Z]+$/)){
                        return {statusCode: 400, headers: {}, data: ['Error with Alias']}
                    }
                      let mainData = await new Promise((resolve) => {
                          if(!users[query]){
                                gun.user().create(query, body, ack => {
                                    resolve(ack)
                                })
                          } else {
                              resolve({done: 'User is currently logged in'})
                          }
                      })
                      
                      res.statusCode = 200
                      res.headers['Content-Type'] = 'application/json; charset=utf-8'
                      res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                      if(res.data.length){
                          res.headers['Content-Type'] = 'application/json; charset=utf-8'
                      } else {
                          res.headers = {}
                      }
                 } else if(headers['x-gun-func'] === GUN_HEADERS.PUT[3]){
                    if(!query.match(/^[0-9a-zA-Z]+$/)){
                        return {statusCode: 400, headers: {}, data: ['Error with Alias']}
                    }
                      let mainData = await new Promise((resolve) => {
                          if(!users[query]){
                            let tempUser = gun.user()
                            tempUser.auth(query, body, ack => {
                                if(ack.err){
                                    resolve(ack)
                                } else {
                                    users[query] = tempUser
                                    resolve(ack)
                                }
                            })
                          } else {
                              resolve({done: 'User is already logged in'})
                          }
                      })
                      
                      res.statusCode = 200
                      res.headers['Content-Type'] = 'application/json; charset=utf-8'
                      res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                      if(res.data.length){
                          res.headers['Content-Type'] = 'application/json; charset=utf-8'
                      } else {
                          res.headers = {}
                      }
                 }

                 return res

              } else if(method === SUPPORTED_METHODS[2]){

                /*
                handle delete request with headers, if X-Gun header is UNSET, then unset method will be used
                */
                let res = {statusCode: 0, headers: {}, data: null}

                if(!GUN_HEADERS.TYPE.includes(headers['x-gun-fig']) || !GUN_HEADERS.DELETE.includes(headers['x-gun-func'])){
                    return {statusCode: 400, headers: {}, data: ['Error with Headers']}
                 }

                if(headers['x-gun-func'] === GUN_HEADERS.DELETE[0]){
                    let mainData = await new Promise((resolve) => {
                        query.put(null).once(found => {resolve(found)})
                    })
                    
                    res.statusCode = 200
                    res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                    if(res.data.length){
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                    } else {
                        res.headers = {}
                    }
                  } else if(headers['x-gun-func'] === GUN_HEADERS.DELETE[1]){
                        let mainData = await new Promise((resolve) => {
                            query.unset(body).once(found => {resolve(found)})
                        })
                        
                        res.statusCode = 200
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        } else {
                            res.headers = {}
                        }
                  } else if(headers['x-gun-func'] === GUN_HEADERS.DELETE[2]){
                        let mainData = await new Promise((resolve) => {
                            if(!users[query]){
                                resolve({done: 'User is not logged in'})
                            } else {
                                users[query].leave()
                                delete users[query]
                                resolve({done: 'User has been logged out'})
                            }
                        })
                        
                        res.statusCode = 200
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        } else {
                            res.headers = {}
                        }
                  } else if(headers['x-gun-func'] === GUN_HEADERS.DELETE[3]){
                      // work in progress
                        let mainData = await new Promise((resolve) => {
                            if(!users[query]){
                                users[query].delete(query, body, ack => {
                                    resolve(ack)
                                })
                            } else {
                                resolve({err: 'User is currently logged in'})
                            }
                        })
                        
                        res.statusCode = 200
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        } else {
                            res.headers = {}
                        }
                  }

                  return res
                  // UNSET is not working for now, must be fixed
                  /* if(headers['x-gun'] === GUN_HEADERS.DELETE[0]){
                        let mainData = await new Promise((resolve) => {
                            gun.path(mainQuery).unset(body).once(found => {resolve(found)})
                        })
                        
                        res.statusCode = 200
                        res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        } else {
                            res.headers = {}
                        }
                  } */
              }

          } catch (e) {
              // there was an error
              return {statusCode: 500, headers, data: [e.stack]}
          }
    })

    async function getBody(body) {
        let mainData = ''
      
        for await (const data of body) {
          mainData += data
        }
      
        return mainData
      }

    function formatReq(req){
        let split = req.split('/').filter(Boolean)
        let join = split.join('.')
        let count = split.length
        let parts = {start: null, end: null, middle: null, startPath: null, endPath: null}
        let about = {notAble: null, hasMid: null, onlyHost: null, hasPath: null}
        if(count > 2){
            let check = req.split('/').filter(Boolean)
            parts.start = check.shift()
            parts.end = check.pop()
            parts.middle = check.join('.')
            parts.startPath = parts.start + '.' + parts.middle
            parts.endPath = parts.middle + '.' + parts.end
            about.notAble = true
            about.hasMid = true
            about.hasPath = true
            about.onlyHost = false
        } else if(count === 2){
            let check = req.split('/').filter(Boolean)
            parts.start = check.shift()
            parts.end = check.pop()
            parts.middle = check.join('.')
            parts.startPath = parts.start + '.' + parts.middle
            parts.endPath = parts.middle + '.' + parts.end
            about.notAble = true
            about.hasMid = false
            about.hasPath = false
            about.onlyHost = false
        } else if(count === 1){
            let check = req.split('/').filter(Boolean)
            parts.start = check.shift()
            // parts.end = check.join('.')
            parts.end = parts.start
            parts.middle = check.join('.')
            parts.startPath = parts.start + '.' + parts.middle
            parts.endPath = parts.middle + '.' + parts.end
            about.notAble = false
            about.hasMid = false
            about.hasPath = false
            about.onlyHost = true
        } else {
            parts.start = null
            parts.end = null
            parts.middle = null
            parts.startPath = null
            parts.endPath = null
            about.notAble = null
            about.hasMid = null
            about.hasPath = null
            about.onlyHost = null
        }
        return {split, join, count, parts, about}
    }

    fetch.destroy = () => {
        gun = undefined
    }

    return fetch

    // async function gunFetch({ url, headers: rawHeaders, method, signal, body }){}

}