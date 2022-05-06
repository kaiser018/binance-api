import Api from './Api.js';
import Websocket from 'ws';
import { nanoid } from 'nanoid'
import 'log-timestamp';

const WEBSOCKET_URL = 'wss://stream.binance.com/ws/';

export default class {

  static events = {
    executionReport: 'executionReport',
    outboundAccountPosition: 'outboundAccountPosition',
    balanceUpdate: 'balanceUpdate',
  };
  
  handlers = new Map();
    
  constructor(apiKey, apiSecret) {
    this.api = new Api(apiKey, apiSecret);
  }

  listen() {
    return new Promise((resolve, reject) => {

      if (this.ws) { this.ws.terminate(); }

      this.api.getListenKey().then( listenKey => {

        // Keepalive a user data stream to prevent a time out.
        // User data streams will close after 60 minutes.
        // It's recommended to send a ping about every 30 minutes.

        this.ws = new Websocket(WEBSOCKET_URL + listenKey);

        this.ws.onopen = () => {
          console.log('WEBSOCKET CONNECTED:', listenKey);
          resolve(listenKey);
        };

        this.ws.onerror = (err) => {
          console.error('CONNECTION ERROR:', err);
          reject(err);
        };

        this.ws.on('ping', () => {
          console.log('PING');
          this.ws.pong();
        });

        this.ws.onclose = () => {
          console.error('CONNECTION CLOSED');
          this.listen();
        };

        this.ws.onmessage = ({data}) => {
          try {
            const message = JSON.parse(data);
            if (message.e) {
              if (this.handlers.has(message.e)) {
                this.handlers.get(message.e).forEach(({callback}) => {
                  callback(message);
                });
              }
            }
          } catch (e) {
            console.error('Parse message failed', {data}, e);
          }
        };

      });

    });
  }
    
  subscribe(event, callback) {

    if ( ! this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    const id = nanoid();

    this.handlers.get(event).push({id, callback});

    return id;

  }

  unsubscribe(event, id = null) {
    if ( ! this.handlers.has(event)) {
      return;
    }
    let handlers = this.handlers.get(event);
    if (id) {
      handlers = handlers.filter(h => h.id !== id);
      if (handlers.length) {
        this.handlers.set(event, handlers);
        return;
      }
    }
    this.handlers.delete(event);
  }

}
