
import { Connection } from 'network/connection'

export class Host extends Connection {

	constructor(name : string) {
		super(name);
	}

	initialize() : void {
		let self = this.self();

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