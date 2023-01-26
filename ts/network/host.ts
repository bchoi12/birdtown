
import { Netcode } from 'network/netcode'

export class Host extends Netcode {

	constructor(name : string) {
		super(name);
	}

	initialize() : void {
		let self = this.peer();

		self.on("open", () => {
			console.log("Opened host connection for " + self.id);

			this._pinger.initializeForHost(this);

		    self.on("connection", (connection) => {
		    	connection.on("open", () => {
			    	this.register(connection);
		    	});
		    });

		    self.on("close", () => {
		    	console.error("Server closed!");
		    })

		    self.on("error", (error) => {
		    	// TODO: actually do something
		    	console.error(error);
		    });
		});
	}
}