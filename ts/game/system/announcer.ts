
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType, LevelType } from 'game/system/api'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { AnnouncementType, FeedType } from 'ui/api'

import { LinkedList } from 'util/linked_list'

type AnnouncementOptions = {
	type : AnnouncementType;
	names? : string[];
	ttl? : number;
}
type FeedOptions = {
	type : FeedType;
	names? : string[];
	ttl? : number;
}

export class Announcer extends SystemBase implements System {

	private static readonly _supportedTypes = new Set([
		GameMessageType.ANNOUNCEMENT, GameMessageType.FEED,
	]);

	// Queue for exporting one announcement per frame.
	private _messages : LinkedList<GameMessage>

	constructor() {
		super(SystemType.ANNOUNCER);

		this._messages = new LinkedList();

		this.addProp<MessageObject>({
			has: () => { return !this._messages.empty(); },
			export: () => { return this._messages.popFirst().value().exportObject(); },
			import: (obj : MessageObject) => {
				const msg = new GameMessage(GameMessageType.UNKNOWN);
				msg.parseObject(obj);
				this.publishMessage(msg);
			},
			options: {
				filters: GameData.tcpFilters,
				clearAfterPublish: true,
			},
		});
	}

	announce(options : AnnouncementOptions) : void {
		let msg = new GameMessage(GameMessageType.ANNOUNCEMENT);
		msg.setAnnouncementType(options.type);
		if (options.names) {
			msg.setNames(options.names);
		}
		if (options.ttl) {
			msg.setTtl(options.ttl);
		}
    	this.broadcastMessage(msg);
	}
	feed(options : FeedOptions) : void {
		let msg = new GameMessage(GameMessageType.FEED);
		msg.setFeedType(options.type);
		if (options.names) {
			msg.setNames(options.names);
		}
		if (options.ttl) {
			msg.setTtl(options.ttl);
		}
    	this.broadcastMessage(msg);
	}

	broadcastMessage(msg : GameMessage) : void {
		if (!this.isSource()) {
			return;
		}

		if (this.publishMessage(msg)) {
			// Add announcement to be exported.
			this._messages.push(msg);
		}
	}

	private publishMessage(msg : GameMessage) : boolean {
		if (!Announcer._supportedTypes.has(msg.type())) {
			console.error("Error: cannot broadcast message type", GameMessageType[msg.type()]);
			return false;
		}

		if (!msg.valid()) {
			console.error("Error: skipping invalid message", msg);
			return false;
		}

		if (msg.type() === GameMessageType.ANNOUNCEMENT) {
			ui.pushAnnouncement(msg);
		} else if (msg.type() === GameMessageType.FEED) {
			ui.pushFeed(msg);
		}
		return true;
	}
}