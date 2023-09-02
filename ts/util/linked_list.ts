
import { defined } from 'util/common'

type ComparatorFn<T> = (a : T, b : T) => boolean;

export class LinkedNode<T> {
	private _value: T;
	private _prev: LinkedNode<T>;
	private _next : LinkedNode<T>;

	constructor(value : T) {
		this._value = value;
		this._prev = null;
		this._next = null;
	}

	setValue(value : T) : void { this._value = value; }
	value() : T { return this._value; }

	hasNext() : boolean { return defined(this._next); }
	setNext(next : LinkedNode<T>) { this._next = next; }
	next() : LinkedNode<T> { return this._next; }

	hasPrev() : boolean { return defined(this._prev); }
	setPrev(prev : LinkedNode<T>) { this._prev = prev; }
	prev() : LinkedNode<T> { return this._prev; }
}

export class LinkedList<T> {

	private _head : LinkedNode<T>;
	private _tail : LinkedNode<T>;
	private _size : number;

	constructor() {
		this._head = null;
		this._tail = null;
		this._size = 0;
	}

	push(value : T) : void {
		this._size++;

		if (!defined(this._head)) {
			this._head = new LinkedNode<T>(value);
			this._tail = this._head;
			return;
		}

		const node = new LinkedNode<T>(value);
		node.setPrev(this._tail);
		this._tail.setNext(node);
		this._tail = node;
	}

	size() : number { return this._size; }
	empty() : boolean { return !defined(this._head); }
	head() : LinkedNode<T> { return this._head; }
	tail() : LinkedNode<T> { return this._tail; }

	insert(value : T, comparator : ComparatorFn<T>) : void {
		let current = this._head;

		while(defined(current)) {
			if (comparator(value, current.value())) {
				let node = new LinkedNode<T>(value);
				if (current.hasPrev()) {
					let prev = current.prev();
					node.setPrev(prev);
					prev.setNext(node);
				}
				current.setPrev(node);
				node.setNext(current);
			}
			current = current.next();
		}
	}

	delete(node : LinkedNode<T>) : void {
		if (node.hasPrev()) {
			let prev = node.prev();
			prev.setNext(node.next());
		}

		if (node.hasNext()) {
			let next = node.next();
			next.setPrev(node.prev());
		}
	}
}