
import { isMobile } from 'util/common'

export namespace Flags {

	export const disableShadows = isMobile() ? true : false;
	export const enableMinimap = false;

	// TODO: reset back to 2 (warnings and errors)
	export const peerDebug = 3;
}