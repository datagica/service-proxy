export default function({
  socket, rpc, services
}) {
  return Promise.all(services.map(name => {
    return rpc.proxy(name).then(proxy => {
      return {
        name: name,
        proxy: proxy
      }
    })
  })).then(results => {
    return Promise.resolve(results.reduce((proxies, result) => {
      result.proxy.on = (eventName, onData, onError) => {
        return new ServiceProxy({
          socket: socket,
          proxy: result.proxy,
          name: result.name,
          eventName: eventName,
          onData: onData,
          onError: onError
        }).init()
      }
      proxies[result.name] = result.proxy
      return proxies
    }, {}))
  })
}

class ServiceProxy {

  constructor({
    socket, proxy, name, eventName, onData, onError
  }) {

    this.socket = socket
    this.proxy = proxy
    this.name = name
    this.eventName = eventName
    this.isReady = false
    this.queue = []

    this.onData = (onData || (() => { }))
    this.onError = (onError || (() => { }))

  }

  init() {

    this.socket.on('message', message => {

      // if we are not ready, we queue messages
      if (!this.isReady) return this.queue.push(message)

      // if we are ready and nothing is in queue, we play the message
      if (this.queue.length == 0) return this.onMessage(message)

      // if we just got ready, we replay queued messages
      this.queue.concat([message]).map(msg => this.onMessage(msg))
      this.queue = []

    })

    return new Promise((resolve, reject) => {
      this.proxy.changes(this.eventName).then(ready => {
        this.isReady = true
        resolve(this)
      }).catch(err => {
        reject(`ServiceProxy: couldn't attach changes listener to service ${this.name}`)
      })
    })
  }


  onMessage(message) {
    let response
    try {
      response = JSON.parse(message)
      if (
        (typeof response === "undefined") ||
        (response === "null") ||
        (typeof response.id !== "undefined") ||
        (response.type !== 'changes') ||
        (response.changes !== this.name)
      ) return
    } catch (exc) {
      return
    }
    Promise.resolve(response.data).then(resp => {
      try {
        this.onData(resp)
      } catch (exc) {
        this.onError(exc)
      }
    }).catch(exc => {
      this.onError(exc)
    })
  }
}
