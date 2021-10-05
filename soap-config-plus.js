module.exports = function (RED) {
    function SoapConfigPlus(n) {
        RED.nodes.createNode(this, n);
        this.wsdl = n.wsdl;
        this.auth = n.auth;
        this.user = n.user;
        this.pass = n.pass;
        this.key = n.key;
        this.cert = n.cert;
        this.token = n.token;
    }
    RED.nodes.registerType("soap-config-plus", SoapConfigPlus);
}