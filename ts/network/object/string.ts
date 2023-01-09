
import { DataObject, DataObjectBase } from 'network/data'

export class String extends DataObjectBase<string> implements DataObject<string> {

	constructor() {
		super();

		this.initialize("");
	}
}