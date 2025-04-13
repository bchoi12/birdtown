
import { BoolFlag, NumberFlag } from 'global/flag'

import { isMobile, isLocalhost } from 'util/common'

export namespace Flags {

	export const disableShadows = new BoolFlag("disableShadows", false);
	export const enableMinimap = new BoolFlag("enableMinimap", false);
	export const enableVoice = new BoolFlag("enableVoice", false);
	export const peerDebug = new NumberFlag("peerDebug", 2);
	export const useLocalPerch = new BoolFlag("useLocalPerch", false);
	export const localPerchPort = new NumberFlag("perchPort", 3000);
	export const usePerch = new BoolFlag("usePerch", false);

	export function validate() : [boolean, string] {
		if (useLocalPerch.get() && usePerch.get()) {
			return [false, "Requested local and non-local perch"];
		}

		return [true, ""];
	}
}