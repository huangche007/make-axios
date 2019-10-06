import defaultOptions from './default'
import {assert,merge,cloneObj} from './utils'
import request from './request'
const urlLibrary = require('url');
import response from './response'
import err from './error'
import Interceptors from './interceptors'
class Axios{
    constructor(){
        const _this = this;
        this.interceptors = {
            request:new Interceptors(),
            response:new Interceptors()
        }
        return new Proxy(request,{
            apply(fn,thisArg,args){
                let options = _this._preprocessArgs(undefined,args);
                if(!options){
                    if(args.length===2){
                        assert(typeof args[0] === 'string',`the type of first arg is string!`);
                        assert(typeof args[1] === 'object' && args[1] && args[1].constructor === Object,`the type of second arg is invalidate!`);
                        options = {
                            ...args[1],
                            url:args[0],
                            method:'get'
                        }
                    }else{
                        assert(false,`arguments invalidate!`);
                    }
                }
               return _this.request(options);
            },
            get(fn,key){
                return _this[key];
            },
            set(fn,key,val){
                _this[key] = val;
                return true;
            }
        })
    }
    request(options){
        //处理请求头
        let _headers = this.default.headers;
        delete this.default.headers;
        let result = cloneObj(this.default);
        merge(result,this.default);
        merge(result,options);
        this.default.headers = _headers;
        options = result;
        let headers = {};
        merge(headers,this.default.headers.common);
        merge(headers,this.default.headers[options.method.toLowerCase()]);
        merge(headers,options.headers);
        options.headers = headers
        //2.参数的校验
        checkOptions(options);
        // options.url = options.baseUrl+options.url;
        options.url = urlLibrary.resolve(options.baseUrl,options.url);
        delete options.baseUrl;
        const {transformRequest,transformResponse} = options;
        options = transformRequest(options);
        checkOptions(options);
        let list = this.interceptors.request.list();
        list.forEach((fn) => {
            options = fn(options);
            checkOptions(options);
        })
        //发出真正的请求
        return new Promise((resolve,reject) => {
            request(options).then((xhr) => {
                let res = response(xhr);
                res.data = transformResponse(res.data);
                let list = this.interceptors.response.list();
                list.forEach((fn) => {
                    res = fn(res);
                })
                resolve(res)
            },(xhr) => {
                let error = err(xhr);
                reject(error);
            });
        })
    }
    /**
     * 预处理方法参数
     * @param {*} methdoType 
     * @param {*} args 
     */
    _preprocessArgs(methdoType,args){
        let options;
        if(args.length===1 && typeof args[0] === 'string'){
            options = {
                method:methdoType,
                url:args[0]
            }
        }else if(args.length===1 && args[0].constructor === Object) {
            options = {
                ...args[0],
                method:methdoType
            }
        }else{
            return undefined
        }
        return options;
    }
    get(...args){
        let options = this._preprocessArgs('get',args);
        //axios.get(url,{params:{},headers:{}})
        if(!options){
            if(args.length===2){
                assert(typeof args[0] === 'string',`the type of first arg is string!`);
                assert(typeof args[1] === 'object' && args[1] && args[1].constructor === Object,`the type of second arg is invalidate!`);
                options = {
                    ...args[1],
                    url:args[0],
                    method:'get'
                }
            }else{
                assert(false,`arguments invalidate!`);
            }
        }
       return this.request(options);
    }

    post(...args){
        let options = this._preprocessArgs('post',args);
        if(!options){
            //axios.post(url,{a:12,b:13})
            if(args.length===2){
                assert(typeof args[0] === 'string',`the type of first arg is string!`);
                options = {
                    url:args[0],
                    method:'post',
                    data:args[1]
                }
                //axios.post(url,{a:12,b:13},{params:{},headers:{}})
            }else if(args.length===3){
                assert(typeof args[0] === 'string',`the type of first arg is string!`);
                assert(typeof args[2] === 'object' && args[2] && args[2].constructor === Object,`the type of third arg is invalidate!`);
                options = {
                    ...args[2],
                    url:args[0],
                    data:args[1],
                    method:'post'
                }
            }else{
                assert(false,`arguments invalidate!`);
            }
        }
       return this.request(options);
    }

    delete(...args){
        let options = this._preprocessArgs('delete',args);
        if(!options){
            //axios.delete(url,{headers:{},params:{}})
            if(args.length===2){
                assert(typeof args[0] === 'string',`the type of first arg is string!`);
                assert(typeof args[1] === 'object' && args[1] && args[1].constructor === Object,`the type of second arg is invalidate!`);
                options = {
                    ...args[1],
                    url:args[0],
                    method:'delete'
                }
            }else{
                assert(false,`arguments invalidate!`);
            }
        }
        return this.request(options);
    }
}

Axios.create = Axios.prototype.create = function(options){
    let axios = new Axios();
    //拷贝一份默认配置
    let res = cloneObj(defaultOptions);
    merge(res,options);
    axios.default = res;
    return axios;
}

function checkOptions(options){
    assert(options,'options is required!');
    assert(options.url,`not found url!`);
    assert(typeof options.url === 'string',`the type of url must be string!`);
    assert(options.url,`not found method!`);
    assert(typeof options.method === 'string',`the type of method must be string!`);
}
export default Axios.create();