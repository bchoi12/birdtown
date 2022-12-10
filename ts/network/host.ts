
import { Connection } from 'network/connection'
import { Pinger } from 'network/pinger'

export class Host extends Connection {

	private _pinger : Pinger;

	constructor(name : string) {
		super(name);

		this._pinger = new Pinger();
	}

	initialize() : void {
		let peer = this.peer();

		peer.on("open", () => {
			console.log("Opened host connection for " + peer.id);

			this._pinger.initialize(this);

		    peer.on("connection", (connection) => {
		    	connection.on("open", () => {
			    	this.register(connection);
		    	});
		    });

		    peer.on("close", () => {
		    	console.error("Server closed!");
		    })

		    peer.on("error", (error) => {
		    	console.error(error);
		    });
		});
	}
}