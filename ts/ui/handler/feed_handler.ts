
import { ui } from 'ui'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

import { RingBuffer } from 'util/buffer/ring_buffer'

type Feed = {

}

export class FeedHandler extends HandlerBase implements Handler {

	private _feedElm : HTMLElement;
	private _feeds : RingBuffer<Feed>

	constructor() {
		super(HandlerType.FEED);

		this._feedElm = Html.elm(Html.divFeed);
		this._feeds = new RingBuffer(3);
	}

	pushFeed(feed : Feed) : void {
		if (this._feeds.full()) {
			this._feeds.popFirst();
		}

		this._feeds.push(feed);
	}
}