export default function(xhr){
    return {
        ok:false,
        status:xhr.status,
        statusText:xhr.statusText,
        data:xhr.response,
    }
}