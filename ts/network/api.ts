
export enum ChannelType {
	UNKNOWN,
	TCP,
	UDP,
}

export enum ChannelStat {
	UNKNOWN,
	PACKETS,
	BYTES,
}

export enum NetworkBehavior {
	UNKNOWN,

	// Determines the value of the prop and publishes it to the network
	SOURCE,

	// Just copies whatever it receives from the network
	COPY,

	// isSource() === false, but will still publish imported data
	RELAY,

	// Don't send any data, local only
	OFFLINE,
}