
import { BoolFlag, NumberFlag } from 'global/flag'

import { isMobile, isLocalhost } from 'util/common'

export namespace Flags {

	export const disableShadows = new BoolFlag("disableShadows", isMobile() ? true : false);
	export const enableMinimap = new BoolFlag("enableMinimap", false);
	export const enableVoice = new BoolFlag("enableVoice", false);
	export const peerDebug = new NumberFlag("peerDebug", 2);
	export const useLocalPerch = new BoolFlag("useLocalPerch", isLocalhost() ? true : false);
}