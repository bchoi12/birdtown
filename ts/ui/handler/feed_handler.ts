
import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { FeedType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { FeedWrapper } from 'ui/wrapper/feed_wrapper'

import { LinkedList, LinkedNode } from 'util/linked_list'

export class FeedHandler extends HandlerBase implements Handler {

	private static readonly _defaultTTL = 4000;
	private static readonly _maxSize = 3;

	private _feedElm : HTMLElement;
	private _feeds : LinkedList<FeedWrapper>

	constructor() {
		super(HandlerType.FEED);

		this._feedElm = Html.elm(Html.divFeed);
		this._feeds = new LinkedList();
	}

	pushFeed(msg : GameMessage) : void {
		if (msg.type() !== GameMessageType.FEED) {
			return;
		}

		this.popExtra();

		const feed = new FeedWrapper(msg);
		feed.setVisible(true);
		this._feedElm.appendChild(feed.elm());
		
		let node = this._feeds.push(feed);
		setTimeout(() => {
			this.removeFeed(node);
		}, msg.getTtlOr(FeedHandler._defaultTTL))
	}

	private popExtra() : void {
		while(this._feeds.size() >= FeedHandler._maxSize) {
			let feed = this._feeds.popFirst();
			this.removeFeed(feed);
		}
	}

	private removeFeed(feedNode : LinkedNode<FeedWrapper>) : void {
		feedNode.value().setVisible(false, () => {
			this._feedElm.removeChild(feedNode.value().elm());
			this._feeds.delete(feedNode);
		});
	}
}