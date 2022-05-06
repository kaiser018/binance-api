import axios from 'axios';
import qs from 'qs';

const API_URL = 'https://api.binance.com';

class Api {

    constructor(apiKey, apiSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.httpClient = axios.create({
            baseURL: API_URL,
            headers: {
                'content-type': 'application/json',
                'X-MBX-APIKEY': this.apiKey,
            },
        });
    }

    getListenKey = () => this.httpClient
            .post('/api/v3/userDataStream')
            .then(r => r.data.listenKey)
            .catch(e => {
                if (e.response) {
                    console.error('HttpClient Error:', e.response.data.msg);
                    throw e.response.data.msg;
                } else throw e;
            });

    pingListenKey = (listenKey) => this.httpClient
            .put('/api/v3/userDataStream?' + qs.stringify({listenKey}))
            .then(r => r.status === 200)
            .catch(e => {
                if (e.response) {
                    console.error('HttpClient Error:', e);
                    throw e.response.data.msg;
                } else throw e;
            });

    closeListenKey = (listenKey) => this.httpClient
            .delete('/api/v3/userDataStream', { params: { listenKey }})
            .then(r => r.status === 200)
            .catch(e => {
                if (e.response) {
                    console.error('HttpClient Error:', e.response.data.msg);
                    throw e.response.data.msg;
                } else throw e;
            });

}

export default Api;