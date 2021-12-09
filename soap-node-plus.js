module.exports = function (RED) {
    function SoapCallPlus(n) {
        var soap = require('soap');
        RED.nodes.createNode(this, n);
        this.topic = n.topic;
        this.name = n.name;
        this.wsdl = n.wsdl;
        this.server = RED.nodes.getNode(this.wsdl);
        this.method = n.method;
        this.payload = n.payload;
        var node = this;
        this.status({});

        this.showerror = (msg, text) => {
            node.status({ fill: "red", shape: "dot", text: text });
            this.send([null, msg]);
        };

        try {
            node.on('input', function (msg) {
                var server = (msg.server)?{wsdl:msg.server, auth:0}:node.server;
                var lastFiveChar = server.wsdl.substr(server.wsdl.length-5);
                if(server.wsdl.indexOf("://")>0 && lastFiveChar !== '?wsdl'){
                    server.wsdl += '?wsdl';
                }
                soap.createClient(server.wsdl, msg.options||{}, function (err, client) {
                    if (err) {
                        msg.payload = "WSDL Config Error: " + err;
                        node.showerror(msg,"WSDL Config Error");
                        return;
                    }
                    switch (node.server.auth) {
                        case '1':
                            client.setSecurity(new soap.BasicAuthSecurity(server.user, server.pass));
                            break;
                        case '2':
                            client.setSecurity(new soap.ClientSSLSecurity(server.key, server.cert, {}));
                            break;
                        case '3':
                            client.setSecurity(new soap.WSSecurity(server.user, server.pass));
                            break;
                        case '4':
                            client.setSecurity(new soap.BearerSecurity(server.token));
                            break;
                    }
                    node.status({fill: "yellow", shape: "dot", text: "SOAP Request..."});
                    if(msg.headers){
                        if (msg.headersOptions){
                            client.addSoapHeader(msg.headers, msg.headersOptions.name, msg.headersOptions.nameSpace, msg.headersOptions.xmlns);
                        } else {
                            client.addSoapHeader(msg.header);
                        }
                    }

                    if(client.hasOwnProperty(node.method)){
                        client[node.method](msg.payload, function (err, result) {
                            if (err) {
                                msg.payload = "Service Call Error: " + err;
                                node.showerror(msg, "Service Call Error");
                                return;
                            }
                            node.status({fill:"green", shape:"dot", text:"SOAP result received"});
                            msg.payload = result;
                            node.send(msg);
                        });
                    } else {
                        msg.payload = "Method does not exist";
                        node.showerror(msg, msg.payload)
                    };
                });
            });
        } catch (err) {
            msg.payload = err.message;
            node.showerror(msg, msg.payload)

        }
    }
    RED.nodes.registerType("soap request plus", SoapCallPlus);
};
