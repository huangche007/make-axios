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