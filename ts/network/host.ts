
import { Connection } from 'network/connection'

export class Host extends Connection {

	constructor(name : string) {
		super(name);

		let peer = this.peer();
	    peer.on("connection", (connection) => {
	    	this.register(connection);
	    });

	    peer.on("close", () => {
	    	console.error("Server closed!");
	    })

	    peer.on("error", (error) => {
	    	console.error(error);
	    });
	}
}