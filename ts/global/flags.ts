
import { BoolFlag, NumberFlag } from 'global/flag'

import { isMobile } from 'util/common'

export namespace Flags {

	export const disableShadows = new BoolFlag("disableShadows", isMobile() ? true : false);
	export const enableMinimap = new BoolFlag("enableMinimap", false);
	export const peerDebug = new NumberFlag("peerDebug", 2);
}