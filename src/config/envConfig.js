let baseIP = 'http://219.141.209.3:8082';
if(process.env.NODE_ENV === 'development') {
    baseIP = 'http://100.64.174.1:8082';
}
global.constants = {
    ip: baseIP
};
