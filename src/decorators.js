/**
 * @constructor
 * @param {Object=} fget (method to get the property value; passed by decorating get-method with @property)
 * @param {Object=} fset (method to set the property value; passed by decoratint set-method with @propname.setter)
 * @param {Object=} fdel (method to delete the property; passed by decorating del-method with @propname.deleter)
 * @param {Object=} doc (documentation of the property; uses the documentation of the get-method if not passed)
 * @param {boolean=} canSuspend (defaults to true in this case, as property() is used directly from Python)
 * @extends Sk.builtin.object
 */
 Sk.builtin.property = function (fget, fset, fdel, doc, canSuspend) {
    if (this instanceof Sk.builtin.property) {
        canSuspend = false;
    } else if (canSuspend === undefined) {
        // Default to true in this case, because 'list' gets called directly from Python
        canSuspend = true;
    }

    if (!(this instanceof Sk.builtin.property)) {
        return new Sk.builtin.property(fget);
    }
    this.fget = fget;
    this.fset = fset;
    this.fdel = fdel;
    this.doc = doc;

    Sk.builtin.object.apply(this, arguments);

    this.__class__ = Sk.builtin.property;

    return this;
};

/*
	dir(property) gives

	['__class__', 
	'__delattr__', 
	'__delete__', 
	'__doc__', 
	'__format__', 
	'__get__', 
	'__getattribute__', 
	'__hash__', 
	'__init__', 
	'__new__', 
	'__reduce__', 
	'__reduce_ex__', 
	'__repr__', 
	'__set__', 
	'__setattr__', 
	'__sizeof__', 
	'__str__', 
	'__subclasshook__', 
	'deleter', 
	'fdel', 
	'fget', 
	'fset', 
	'getter', 
	'setter']

	decorating class with property give 'property object not callable' on instantiation

	decoractors are created while instantiating
*/

goog.inherits(Sk.builtin.property, Sk.builtin.object);

Sk.builtin.property.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("property", Sk.builtin.property);

Sk.builtin.property.prototype.ob$type["$d"] = new Sk.builtin.dict([]);
Sk.builtin.property.prototype.ob$type["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple([Sk.builtin.object]));

Sk.builtin.property.prototype.tp$name = "property";

Sk.builtin.property.prototype["$r"] = function () {
    return new Sk.builtin.str("property");
};

Sk.builtin.property.prototype.__get__ = function(self, target) {
    if (self.fget) {
        if (self.fget.tp$call) {
            return self.fget.tp$call.call(self.fget, [target]);  
        } else {
            throw new Sk.builtin.TypeError("property.__get__: no tp$call");
        }
    } else {
        throw new Sk.builtin.TypeError("property.__get__: fget not set");
    }
};

Sk.builtin.property.prototype.__set__ = function(self, target, value) {
    if (self.fset) {
        if (self.fset.tp$call) {
            return self.fset.tp$call.call(self.fset, [target, value]);  
        } else {
            throw new Sk.builtin.TypeError("property.__set__: no tp$call");
        }
    } else {
        throw new Sk.builtin.TypeError("property.__set__: fget not set");
    }
};

// del is not yet implemented so this does not get called yet
Sk.builtin.property.prototype.__delete__ = function(self, target) {
    if (self.fdel) {
        if (self.fdel.tp$call) {
            return self.fdel.tp$call.call(self.fdel, [target]);  
        } else {
            throw new Sk.builtin.TypeError("property.__delete__: no tp$call");
        }
    } else {
        throw new Sk.builtin.TypeError("property.__delete__: fget not set");
    }
};

Sk.builtin.property.prototype.getter = new Sk.builtin.func(function(self, fget) {
    self.fget = fget;
    return self;
});

Sk.builtin.property.prototype.setter = new Sk.builtin.func(function(self, fset) {
    self.fset = fset;
    return self;
});

Sk.builtin.property.prototype.deleter = new Sk.builtin.func(function(self, fdel) {
    self.fdel = fdel;
    return self;
});

/**
 * @constructor
 * @param {Object=} method (method to get the property value ;passed by decorating get-method with @property)
 * @param {boolean=} canSuspend (defaults to true in this case, as property() is used directly from Python)
 * @extends Sk.builtin.object
 */
Sk.builtin.staticmethod = function (method, canSuspend) {
    if (this instanceof Sk.builtin.staticmethod) {
        canSuspend = false;
    } else if (canSuspend === undefined) {
        // Default to true in this case, because 'list' gets called directly from Python
        canSuspend = true;
    }

    if (!(this instanceof Sk.builtin.staticmethod)) {
        return new Sk.builtin.staticmethod(method);
    }
    this.method = method;

    Sk.builtin.object.apply(this, arguments);

    this.__class__ = Sk.builtin.staticmethod;

    return this;
};

goog.inherits(Sk.builtin.staticmethod, Sk.builtin.object);

Sk.builtin.staticmethod.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("staticmethod", Sk.builtin.staticmethod);

Sk.builtin.staticmethod.prototype.ob$type["$d"] = new Sk.builtin.dict([]);
Sk.builtin.staticmethod.prototype.ob$type["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple([Sk.builtin.object]));

Sk.builtin.staticmethod.prototype.tp$name = "staticmethod";

Sk.builtin.staticmethod.prototype["$r"] = function () {
    return new Sk.builtin.str("staticmethod");
};

Sk.builtin.staticmethod.prototype.__get__ = new Sk.builtin.func(function(self, target) {
    var localmethod, a;
    if (self.method) {
        if (self.method.tp$call)
        {
            localmethod = new Sk.builtin.func(function(kws, args) {
                //a.unshift(null);
                //if (Sk.inBrowser)
                //{
                //    var s = "(";
                //    for (var i=0; i<arguments.length; i++) {
                //        s += (new Sk.builtin.str(arguments[i])).v + ", ";
                //    }
                //    s += ")\n";
                //    Sk.output(s);
                //}
                //self.method.func_locals = this;
                Sk.misceval.apply(self.method, undefined, undefined, kws, args);
                //self.method.tp$call.call(self.method, arguments);
            });
            localmethod.func_code.co_kwargs = true;
            localmethod.func_code.co_varnames = [];
            return localmethod;
        } else {
            throw new Sk.builtin.TypeError("classmethod.tp$call: tp$call not set");
        }
    } else {
        throw new Sk.builtin.TypeError("staticmethod.__get__: method not set");
    } 
});

/**
 * @constructor
 * @param {Object=} method (method to get the property value ;passed by decorating get-method with @property)
 * @param {boolean=} canSuspend (defaults to true in this case, as property() is used directly from Python)
 * @extends Sk.builtin.object
 */
Sk.builtin.classmethod = function (method, canSuspend) {
    if (this instanceof Sk.builtin.classmethod) {
        canSuspend = false;
    } else if (canSuspend === undefined) {
        // Default to true in this case, because 'list' gets called directly from Python
        canSuspend = true;
    }

    if (!(this instanceof Sk.builtin.classmethod)) {
        return new Sk.builtin.classmethod(method);
    }
    this.method = method;

    Sk.builtin.object.apply(this, arguments);

    this.__class__ = Sk.builtin.classmethod;

    return this;
};

goog.inherits(Sk.builtin.classmethod, Sk.builtin.object);

Sk.builtin.classmethod.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("classmethod", Sk.builtin.classmethod);

Sk.builtin.classmethod.prototype.ob$type["$d"] = new Sk.builtin.dict([]);
Sk.builtin.classmethod.prototype.ob$type["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple([Sk.builtin.object]));

Sk.builtin.classmethod.prototype.tp$name = "classmethod";

Sk.builtin.classmethod.prototype["$r"] = function () {
    return new Sk.builtin.str("classmethod");
};

Sk.builtin.classmethod.prototype.__get__ = new Sk.builtin.func(function(self, target, type) {
    var localmethod;
    if (self.method) {
        if (self.method.tp$call)
        {
            type = target.ob$type; // todo: need how to type from args?
            localmethod = new Sk.builtin.func(function(args) {
                args.unshift(type);
                self.method.tp$call.call(self.method, args);
            });
            return localmethod;
        } else {
            throw new Sk.builtin.TypeError("classmethod.tp$call: tp$call not set");
        }
    } else {
        throw new Sk.builtin.TypeError("classmethod.tp$call: method not set");
    } 
});