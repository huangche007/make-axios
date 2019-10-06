# make-axios

## 从0实现一个axios

> 我们知道，axios是前端一个非常优秀的对于网络请求的框架，其特点主要是请求方便、功能多(如拦截器)。那么作为一枚前端开发人员，了解并能够使用axios其实是基础，深入了解其实现原理才是比较重要的，当然，如果能徒手撸一个axios类似的框架出来，那就是相当的不错了。

这篇文章会从以下几个大的点来实现一个axios框架：

 1. axios的本质是什么？
 2. axios默认值、参数的实现
 3. 常见请求方式:get、post、delete在axios中的实现
 4. 真正请求(XMLHttpRequest)的实现
 5. axios拦截器的实现
 5. 打包发布

同时希望你了解以下的一些知识点：

- webpack
- axios框架的基本使用
- Es6的Proxy、Class等
- XMLHttpRequest
- http协议...等

## axios的本质是什么

使用axios框架的时候，我们大部分情况都是以模块的形式引入进行使用，如:

    import axios from 'axios'
    
发出一个get请求，如：

    axios.get('/user')或axios('/user')
    
从中可以看出，**axios的本质就是一个函数**，那么就先来实现一个axios的雏形。(本篇文章实现利用es6的calss去实现)。

**axios.js**

    class Axios{
        constructor(){
    
        }
    }
    
    export default new Axios();
    
**index.js**

    import axios from './axios'
    
这里毫无疑问可以看出，axios现在只是一个Axios的实例，并不是一个函数，那么要怎样将axios变成一个函数？这就需要两个知识点：Axios的构造函数是可以进行返回值操作、利用ES6的Proxy。更进一步的Axios类的代码如下:

    class Axios{
        constructor(){
            return new Proxy(function(){},{
                apply(fn,thisArg,agrs){
    
                }
            })
        }
    }
    
    export default new Axios();

这样我们得到的一个Axios实例axios就是一个函数了。这里简单提一下，Proxy在进行函数处理的使用，apply是很有用的，使用它我们就可以对一个函数进行代理处理了。

![axios的本质是函数][1]

看看打印出来的内容：

![图片描述][2]

接下来，**要怎样才能够实现axios('/user')或axios.get('/user')这样的效果呢？**,我们知道了axios是一个函数，那么给一个函数增加一个属性(也是函数)，就能够解决这个问题了。先来简单看下函数式的写法：

![图片描述][3]

继续完善Axios类中的代码：

    class Axios{
        constructor(){
            const _this = this;
            return new Proxy(function(){},{
                apply(fn,thisArg,agrs){
                    
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
        get(){
            console.log('get request');
        }
    }

    export default new Axios();
    
这样就实现了axios('/user')或axios.get('/user')这样的效果了。

## axios默认值、默认参数的实现

我们知道，在使用axios的时候，可以有如下的使用情况：

    import Axios from 'axios'

    let axios1 = Axios.create({
        baseUrl:'http://www.xxx.com',
        headers:{
            common:{
                a:'12',
                b:{
                    c:{
    
                    }
                }
            }
        }
    })
    let axios2 = Axios.create({
        baseUrl:"http://www.yyy.com",
    
    })

或
     axios1.default.baseUrl = 'http://www.xxx.com';
     axios2.default.baseUrl= "http://www.yyy.com";
     Axios.default.headers.common.a = '123';

也就是**通过axios的create方法来创建不同的axios实例，那接下来就来实现一下这个create方法**

首先需要一个默认配置项，比如**我们在使用axios('/user')来进行请求的时候，其实默认的请求方式是get、默认配置里面还有baseUrl、headers等基本默认信息。那么就需要抽离出来成为一个独立的模块(设计模式中的单一职责)default.js**：

    export default {
        method:'get',
        bserUrl:'',
        headers:{
            common:{
               'X-Request-By':'XMLHttpRequest'
            },
            get:{
    
            },
            post:{
    
            }
        }
    }

**并在axios.js中引入**

    import defaultOptions from './default'

接下来就是实现create这个方法以及类Axios和实例aixos的default配置属性。

        let axios1 = Axios.create({
        baseUrl:'http://www.xxx.com',
        headers:{
            common:{
                a:'12',
                b:{
                    c:{
    
                    }
                }
            }
        }
    })
    
该方法的参数是一个对象。当我们像上面这样配置的时候，就需要将默认配置项中的部分进行覆盖，也就是需要对对象进行合并操作。首先抽取一个模块，名字叫**utils.js**，主要主要是封装各种工具子模块(参数类型判断、对象合并、对象克隆)。部分代码如下：

![图片描述][4]
并在类Axios所在模块中引入，便于后续使用。

**最终create方法实现如下**：

    Axios.create = Axios.prototype.create = function(options){
        let axios = new Axios();
        //拷贝一份默认配置
        let res = cloneObj(defaultOptions);
        merge(res,options);
        console.log('res:',res);
        axios.default = res;
        return axios;
    }
    
    export default Axios.create();

当我们通过下面代码去使用的时候。

    import Axios from './axios'

    let axios1 = Axios.create({
        baseUrl:'http://www.xxx.com',
        headers:{
            common:{
                a:'12',
                b:{
                    c:{
                        
                    }
                }
            }
        }
    })

或

    let axios2 = Axios.create({})
    axios2.default.headers.common.test = 'test';

最终得到我们想要的：

![图片描述][5]

## 常见请求方式:get、post、delete在axios中的实现

在axios中，这三种常见请求的格式大致如下：

**get请求**:

- axios.get(url)
- axios.get(url,{params:{},headers:{}})
- axios.get({url,params:{},headers:{}})

**post请求**:

- axios.post(url)
- axios.post(url,{a:12,b:13})
- axios.post(url,{a:12,b:13},{params:{},headers:{}})
- axios.post({url,params:{},headers:{},data})

**delete请求**:

- axios.delete(url)
- axios.delete(url,{headers:{},params:{}})
- axios.delete({url,headers:{},params:{}})

**分析三者请求参数的相同点**：

1. 都只有一个参数，其参数是字符串类型

	- axois.get(url)
	- axios.post(url)
	- axios.delete(url)

2. 都只有一个参数，其参数类型是object

	- axios.get({url,params:{},headers:{}}) 
	- axios.post({url,params:{},headers:{},data})
	- axios.delete({url,headers:{},params:{}})

接下来就按照这样的一个规律去实现这三种请求。先来处理get请求的方式：

    get(...agrs){
        let options;
        if(agrs.length===1 && typeof agrs[0] ==='string'){//axois.get(url)
            options = {
                method:'get',
                url:agrs[0]
            }

        }else if(agrs.length === 1 && agrs[0] instanceof Object){//axios.get({url,params:{},headers:{}}) 
            options = {
                ...agrs[0],
                method:'get'
            }
        }else if(agrs.length === 2 && typeof agrs[0] ==='string'){//axios.get(url,{params:{},headers:{}})
            options={
                method:'get',
                url:agrs[0],
                ...agrs[1]
            }
        }else{
            assert(false,`arguments invalidate!`)
        }
        console.log('get options:',options);
    }
    
测试：

![图片描述][6]

![图片描述][7]

那么post与delete的处理方式也类似，它们由很多相同点，所以提取到同一个方法中进行处理。

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
    
最终实现的get、post、delete部分代码如下：

![图片描述][8]

这里还有一种特殊需要处理的，**axios('/user')、axios('/user',{})、axios({url,xxx})这三种情况**，这就需要借助Proxy第二个参数中的apply方法。该方法的第一个参数就是axios这个方法，第三个参数就是axios方法中传递的参数。

![图片描述][9]




## 真正请求(XMLHttpRequest)的实现

**这里真正的网络数据请求模块与axios模块是独立开来的，请求模块只负责数据的请求，而axios模块需要负责对数据请求进行处理**。

从上面实现的get、post、delete方法中，最后调用的实例的request方法，该方法的主要作用有：

- 请求头的处理
- 参数的检测
- 正式调用请求数据
- 变换请求transformRequest、transformResponse的处理

**请求头的处理**：这里有三个地方涉及到请求头，默认的配置项defaultOptions(axios(this).default)、get/post/delete请求中配置的、options中配置的，其优先级是defaultOptions(axios(this).default).default<get/post/delete<options。

![图片描述][10]

**参数的检测**:
     //参数检测
     checkOptions(options);
        
    function checkOptions(options){
        assert(options,'options is required!');
        assert(options.url,`not found url!`);
        assert(typeof options.url === 'string',`the type of url must be string!`);
        assert(options.url,`not found method!`);
        assert(typeof options.method === 'string',`the type of method must be string!`);
    }

**正式调用请求数据**：这里需要实现XMLHttpRequest模块**request.js**，并准备些Mock数据进行测试。


request.js模块代码如下:

    export default function request(options) {
        let xhr = new XMLHttpRequest();
        xhr.open(options.method,options.url,true);
        for(let key in options.headers){
            xhr.setRequestHeader(encodeURIComponent(key),encodeURIComponent(options.headers[key]));
        }
        xhr.send(options.data);
        return new Promise((resolve,reject) => {
            xhr.onreadystatechange = function () {
                if(xhr.readyState===4){
                    if(xhr.status>=200 && xhr.status<300){
                        resolve(xhr);
                    }else{
                        reject(xhr);
                    }
                }
            }
        })
    }


调用情况如下：

![图片描述][11]

Mock数据如下：

src/data/test.json:

    {
        "skill":"javascript",
        "name":"Darkcode"
    }
    
请求方式如下：

    import axios from './axios'
    
    axios.get('../datas/test.json').then((res) => {
        console.log('返回的数据是:',res);
    })


发现url这里有问题：

![图片描述][12]

也就上图中对url拼接这里出了问题。这里有了nodejs内置url模块来解决这个问题:

       options.url = urlLibrary.resolve(options.baseUrl,options.url);

axios.get(url).then()，可以知道get方法返回的是一个promise，所以在最开始处理实现的get、post、delete等地方，需要进行类Axios request方法，该方法返回一个promise。

 ![图片描述][13]

request方法的完善代码如下：

![图片描述][14]

这时候，请求就成功了，可以看到代码:

    axios.get('../datas/test.json').then((res) => {
        console.log('返回的数据是:',res);
    })

打印出来的就是一个xhr对象。
  

![图片描述][15]

发现这返回来的数据与使用真正的axios框架中的返回值不填一样，真正使用axios返回的数据应该是如下：

    {
        status:200,
        statusText:'ok',
        data:{},
        ...
    }
    
**这时候就需要对请求到的数据进行进一步处理了，鉴于请求返回的模式：返回成功、返回失败，抽取成单独的模块进行处理**。

请求成功模块:**response.js，对数据进行封装**

    export default function (xhr) {
        let arr = xhr.getAllResponseHeaders().split('\r\n')
        let headers = {};
        arr.forEach((str) =>{
            if(!str){
                return;
            }
            const [name,value] = str.split(": ");
            headers[name] = value;
        })
        return{
            ok:true,
            status:xhr.status,
            statusText:xhr.statusText,
            data:xhr.response,
            xhr,
            headers
        }
    }
    
请求失败的模块:**error.js**

    export default function(xhr){
        return {
            ok:false,
            status:xhr.status,
            statusText:xhr.statusText,
            data:xhr.response,
        }
    }

接下来在axios.js模块中引入这两个模块，并针对请求request模块部分的代码进行处理。
        import response from './response'
        import err from './error'
        
        //发出真正的请求
        return new Promise((resolve,reject) => {
            request(options).then((xhr) => {
                let res = response(xhr);
                resolve(res)
            },(xhr) => {
                let error = err(xhr);
                reject(error);
            });
        })    

在看一下得到的数据情况：

![图片描述][16]

是不是发现data里面是字符串形式，而不是我们常见的json对象形式，😔，接着搞。

**变换请求transformRequest、transformResponse的处理**

在axios中。
- transformRequest：负责向服务器发送请求前针对数据进行处理
- transformResponse：负责服务器返回数据后针对数据进行处理。

这两个配置对象属性是一个函数。简单用法如下：

    axios.create({
        transformRequest:function (config) {
            //do something
            return config;
        },
        transformResponse:function (res) {
            ////do something
            return JSON.parse(res);
        }
    })
    
那么要解决上面返回的data的值是字符串的问题，就很简单了。直接在默认配置模块中进行配置：

![图片描述][17]

并在真正请求之前，和请求之后对数据做处理:

        const {transformRequest,transformResponse} = options;
        options = transformRequest(options);
        checkOptions(options);
        //发出真正的请求
        return new Promise((resolve,reject) => {
            request(options).then((xhr) => {
                let res = response(xhr);
                res.data = transformResponse(res.data);
                resolve(res)
            },(xhr) => {
                let error = err(xhr);
                reject(error);
            });
        })
        
这下数据就完全正确了。

![图片描述][18]

变换一下请求方式:

    import axios from './axios'
    
    axios.default.headers.common.auth = 'xxxx';
    
    axios('../datas/test.json').then((res) => {
        console.log('返回的数据是:',res);
    })
    
![图片描述][19]    


也是很OK的。

## axios拦截器的实现

**axios拦截器:axios.interceptors**

- axios.interceptors.request.use(config => {config})
- axios.interceptors.response.use(response => { response})

**axios的拦截器的功能有点类似上面提到的transformRequest、transformResponse的功能**，但又有区别，拦截器的功能更加强大，不仅可以针对数据进行处理，还可以针对实际业务进行功能的处理等。

从写法上来看，用法大致一样。分别针对请求前数据、请求后的数据进行拦截处理。这里也是需要抽取成一个独立模块:**interceptors.js**。

    export default class Interceptors{
        constructor(){
            this._list =[]
        }
        use(fn){
            this._list.push(fn);
        }
        list(){
            return this._list;
        }
    }
    
然后在Axios构造函数中初始化interceptors对象属性，包含require、response两个属性：

![图片描述][20]

接下来在**request**方法中进行处理。

![图片描述][21]
    
测试一下使用情况:

    import axios from './axios'
    
    axios.default.headers.common.auth = 'xxxx';
    axios.interceptors.request.use(function(config){
        config.headers.abc = '11'
        return config;
    })
    axios('../datas/test.json').then((res) => {
        console.log('response info is:',res);
    })
    
![图片描述][22]

![图片描述][23]


再测试一个错误的请求：

    axios('../datas/test1.json').then((res) => {
        console.log('response info is:',res);
    },(err) => {
        console.log('error info:',err);
    })
    
![图片描述][24]


## 打包发布


往往在一个库或者框架开发测试完后，需要打包发布给他人使用，接下来就是对已完成的axios进行打包。

    npm run build
    
![图片描述][25]

至于发布操作，通常都会选择发布到npmjs上，这里就不做一一的操作了。很简单。

到此。从0实现一个axios其实不算难，难点在于对各种默认值、参数、请求形式等的处理。
    
最终附上完整代码：

[https://github.com/huangche007/make-axios][26]    


  [1]: /img/bVbyBiu
  [2]: /img/bVbyBix
  [3]: /img/bVbyBiQ
  [4]: /img/bVbyBnm
  [5]: /img/bVbyBnX
  [6]: /img/bVbyBoY
  [7]: /img/bVbyBo3
  [8]: /img/bVbyBpq
  [9]: /img/bVbyBp8
  [10]: /img/bVbyBrh
  [11]: /img/bVbyBsI
  [12]: /img/bVbyBtI
  [13]: /img/bVbyBvz
  [14]: /img/bVbyBvD
  [15]: /img/bVbyBvY
  [16]: /img/bVbyBw1
  [17]: /img/bVbyByk
  [18]: /img/bVbyBy5
  [19]: /img/bVbyBzQ
  [20]: /img/bVbyBAx
  [21]: /img/bVbyBAE
  [22]: /img/bVbyBAY
  [23]: /img/bVbyBAZ
  [24]: /img/bVbyBBa
  [25]: /img/bVbyBBU
  [26]: https://github.com/huangche007/make-axios
