import axios from './axios'

axios.default.headers.common.auth = 'xxxx';
axios.interceptors.request.use(function (config) {
    config.headers.abc = '11'
    return config;
})
axios('../datas/test.json').then((res) => {
    console.log('response info is:', res);
}, (err) => {
    console.log('error info:', err);
})
// axios('../datas/test1.json').then((res) => {
//     console.log('response info is:',res);
// },(err) => {
//     console.log('error info:',err);
// })