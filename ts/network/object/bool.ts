
import { DataObject, DataObjectBase } from 'network/data'

export class Bool extends DataObjectBase<boolean> implements DataObject<boolean> {

	constructor() {
		super();

		this.initialize(false);
	}
}