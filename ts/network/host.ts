
import { Connection } from 'network/connection'

export class Host extends Connection {

	constructor(name : string) {
		super(name);
	}

	initialize() : void {
		let peer = this.peer();

		peer.on("open", () => {
			console.log("Opened host connection for " + peer.id);

			this._pinger.initializeForHost(this);

		    peer.on("connection", (connection) => {
		    	connection.on("open", () => {
			    	this.register(connection);
		    	});
		    });

		    peer.on("close", () => {
		    	console.error("Server closed!");
		    })

		    peer.on("error", (error) => {
		    	// TODO: actually do something
		    	console.error(error);
		    });
		});
	}
}