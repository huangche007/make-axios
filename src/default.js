export default {
    method:'get',
    baseUrl:'',
    headers:{
        common:{
            'X-Request-By':'XMLHttpRequest'
        },
        get:{

        },
        post:{

        }
    },
    transformRequest:function (config) {
        return config;
    },
    transformResponse:function (res) {
        return JSON.parse(res);
    }
}