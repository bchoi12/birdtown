
import { isMobile } from 'util/common'

export namespace Flags {

	export const disableShadows = isMobile() ? true : false;
}