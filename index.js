const makeFetch = require('make-fetch')
const Gun = require('gun')
// const fs = require('fs')
// const crypto = require("crypto")
require('gun/lib/path')
require('gun/lib/not')
require('./edits/unset')
// require('gun/lib/unset')

const LIST_OF_URLS = ["https://gun-manhattan.herokuapp.com/gun",
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
"https://fire-gun.herokuapp.com/gun"]

module.exports = function makeGunFetch(opts = null){

    const gun = Gun(opts || {peers: LIST_OF_URLS})

    const SUPPORTED_METHODS = ['GET', 'PUT', 'DELETE', 'POST', 'PATCH', 'OPTIONS']
    // const SUPPORTED_TYPES = ['-', '_', '.']
    const encodeType = '-'
    const hostType = '_'
    const users = {}

    const fetch = makeFetch(async request => {

        if(request.body !== null){
            request.body = await getBody(request.body)
            try {
                request.body = JSON.parse(request.body)
            } catch (error) {
                console.log(error)
            }
        }
        // if(request.method === 'PATCH' && request.body){
        //     request.body = null
        // }

        const {url, method, headers, body} = request

          try {
              let {hostname, pathname, protocol, searchParams} = new URL(url)
              hostname = hostname && hostname[0] === encodeType ? Buffer.from(hostname.slice(1), 'hex').toString('utf-8') : hostname

              if((protocol !== 'gun:' || !method || !SUPPORTED_METHODS.includes(method) || !hostname || hostname[0] === encodeType || !/^[a-zA-Z0-9-_.]+$/.test(hostname)) || (hostname[0] === '.' && hostname.length > 1 && !users[hostname.slice(1)])){
                  console.log('something wrong with the query')
                  return new Error('invalid query, must be a valid query')
              }

              let req = formatReq(`${hostname}${pathname}`, method, protocol, searchParams)

              let res = {statusCode: 0, headers: {}, data: null}
              switch (req.queryMethod) {
                  
                case 'GET': {
                    let mainData = null
                    if(req.mainQuery){
                        if(req.queryReg){
                            mainData = await new Promise((resolve) => {
                                req.makeQuery.once(found => {resolve(found)})
                            })
                        } else {
                            let checkClear = null

                            mainData = await new Promise((resolve) => {
                                checkClear = setTimeout(() => {resolve({not: false, message: 'timed out, most likely this has data'})}, 5000)
                                req.makeQuery.not(found => {
                                    resolve({found, not: true, message: 'done, most likely this does not have data'})
                                })
                            })
        
                            clearTimeout(checkClear)
                        }
                      res.statusCode = 200
                      res.headers = {}
                      res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                      if(res.data.length){
                          res.headers['Content-Type'] = 'application/json; charset=utf-8'
                      }
                    } else {
                        mainData = {message: 'register a user with the other methods'}
                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    }
                  break
                }
                
                case 'PUT': {
                    let mainData = null
                    if(req.mainQuery){
                        mainData = await new Promise((resolve) => {
                            req.makeQuery.put(body).once(found => {
                                resolve(found)
                            })
                        })
                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    } else {
                        if(users[body.user]){
                            mainData = {err: 'User is currently logged in'}
                            res.statusCode = 400
                            res.headers = {}
                            res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                            if(res.data.length){
                                res.headers['Content-Type'] = 'application/json; charset=utf-8'
                            }
                        } else {
                            users[body.user] = gun.user()
                            mainData = await new Promise((resolve) => {
                                users[body.user].auth(body.user, body.pass, ack => {
                                    if(ack.err){
                                        resolve(ack)
                                    } else {
                                        resolve({soul: ack.soul})
                                    }
                                })
                            })

                            if(mainData.err){
                                users[body.user].leave()
                                delete users[body.user]
                                res.statusCode = 400
                                res.headers = {}
                            } else {
                                res.statusCode = 200
                                res.headers = {}
                            }

                            res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                            if(res.data.length){
                                res.headers['Content-Type'] = 'application/json; charset=utf-8'
                            }
                        }
                    }
                    break
                }

                case 'DELETE': {
                    let mainData = null
                    if(req.mainQuery){
                        mainData = await new Promise((resolve) => {
                            req.makeQuery.unset(body).once(found => {resolve(found)})
                        })
                        
                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    } else {
                        mainData = await new Promise((resolve) => {
                            gun.user().delete(body.user, body.pass, ack => {
                                resolve(ack)
                            })
                        })
                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    }
                    break
                }

                case 'POST': {
                    let mainData = null
                    if(req.mainQuery){
                        mainData = await new Promise((resolve) => {
                            req.makeQuery.set(body).once(found => {resolve(found)})
                        })
                        
                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    } else {
                        mainData = await new Promise((resolve) => {
                            gun.user().create(body.user, body.pass, ack => {
                                resolve(ack)
                            })
                        })
                        if(mainData.err){
                            res.statusCode = 400
                            res.headers = {}
                        } else {
                            res.statusCode = 200
                            res.headers = {}
                        }
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    }
                    break
                }

                case 'PATCH': {
                    let mainData = null
                    if(req.mainQuery){
                        mainData = await new Promise((resolve) => {
                            req.makeQuery.put(body).once(found => {resolve(found)})
                        })
                        
                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    } else {
                        if(!users[body.user]){
                            mainData = {message: 'User is not logged in'}
                            res.statusCode = 400
                            res.headers = {}
                            res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                            if(res.data.length){
                                res.headers['Content-Type'] = 'application/json; charset=utf-8'
                            }
                        } else {
                            users[body.user].leave()
                            delete users[body.user]
                            mainData = {message: 'User has been logged out'}
                            res.statusCode = 200
                            res.headers = {}
                            res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                            if(res.data.length){
                                res.headers['Content-Type'] = 'application/json; charset=utf-8'
                            }
                        }
                    }
                    break
                }

                case 'OPTIONS': {
                    if(req.mainQuery){
                        let checkClear = null

                        let mainData = await new Promise((resolve) => {
                            checkClear = setTimeout(() => {resolve({not: false, message: 'timed out, most likely this has data'})}, 5000)
                            req.makeQuery.not(found => {
                                resolve({found, not: true, message: 'done, most likely this does not have data'})
                            })
                        })
    
                        clearTimeout(checkClear)
    
                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    } else {
                        if(!users[req.makeQuery]){
                            mainData = {err: 'User is not logged in'}
                        } else {
                            mainData = {user: query + ' is logged in'}
                        }

                        res.statusCode = 200
                        res.headers = {}
                        res.data = typeof(mainData) !== 'undefined' ? [JSON.stringify(mainData)] : []
                        if(res.data.length){
                            res.headers['Content-Type'] = 'application/json; charset=utf-8'
                        }
                    }
                    break
                }

              }
              return res

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

    function formatReq(req, method, protocol, search){
        let path = req.split('/').filter(Boolean)
        let count = path.length
        let host = decodeURIComponent(path.shift())
        let queryType = host[0] === hostType ? host[0] : ''
        host = host.replace(queryType, '')
        let multiple = count > 1 ? true : false
        // path = path.map(data => {return decodeURIComponent(data.replace(/[^a-zA-Z0-9]/g, ''))}).join('.')
        path = path.map(data => {return decodeURIComponent(data)}).join('.')
        let makeQuery = null
        let mainQuery = null
        if(queryType){
            if(host){
                if(host.includes('.') || host.includes('-')){
                    makeQuery = multiple ? gun.get('~' + host).path(path) : gun.get('~' + host)
                } else if(users[host]){
                    makeQuery = multiple ? users[host].path(path) : users[host]
                } else if(!users[host]){
                    makeQuery = multiple ? gun.get('~@' + host).path(path) : gun.get('~@' + host)
                }
                mainQuery = true
            } else {
                makeQuery = host
                mainQuery = false
            }
        } else {
            makeQuery = multiple ? gun.get(host).path(path) : gun.get(host)
            mainQuery = true
        }
        // switch (queryType) {
        //     case SUPPORTED_TYPES[1]:
        //         if(host.includes('.') || host.includes('-')){
        //             makeQuery = multiple ? gun.get('~' + host).path(path) : gun.get('~' + host)
        //         } else {
        //             makeQuery = multiple ? gun.get('~@' + host).path(path) : gun.get('~@' + host)
        //         }
        //         mainQuery = true
        //         break
        //     case SUPPORTED_TYPES[2]:
        //         if(host){
        //             makeQuery = multiple ? users[host].path(path) : users[host]
        //             mainQuery = true
        //         } else {
        //             makeQuery = host
        //             mainQuery = false
        //         }
        //         break
        //     default:
        //         makeQuery = multiple ? gun.get(host).path(path) : gun.get(host)
        //         mainQuery = true
        //         break
        // }
        let queryMethod = method
        let queryProtocol = protocol
        let queryReg = !search.get('not')
        return {makeQuery, mainQuery, queryMethod, queryProtocol, queryType, queryReg}
    }

    fetch.destroy = () => {
        gun = undefined
    }

    return fetch

}