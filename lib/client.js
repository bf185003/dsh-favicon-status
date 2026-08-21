window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-favicon-status",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region ../../../vendor/cosmokit/src/misc.ts
		/** Return true when a value is `null` or `undefined`. */
		function isNullable(value) {
			return value === null || value === void 0;
		}
		/** Return true for non-array object values. */
		function isPlainObject(data) {
			return data && typeof data === "object" && !Array.isArray(data);
		}
		/** Filter object entries and return a new object. */
		function filterKeys(object, filter) {
			return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
		}
		/** Map object values while preserving the original key set. */
		function mapValues(object, transform) {
			return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
		}
		/** Pick selected keys from an object, optionally including `undefined` values. */
		function pick(source, keys, forced) {
			if (!keys) return { ...source };
			const result = {};
			for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
			return result;
		}
		//#endregion
		//#region ../../../vendor/cosmokit/src/types.ts
		/** Test values using `instanceof` with a `toStringTag` fallback. */
		function is(type, value) {
			if (arguments.length === 1) return (value) => is(type, value);
			return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
		}
		function isArrayBufferLike(value) {
			return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
		}
		function isArrayBufferSource(value) {
			return isArrayBufferLike(value) || ArrayBuffer.isView(value);
		}
		let Binary;
		(function(_Binary) {
			_Binary.is = isArrayBufferLike;
			_Binary.isSource = isArrayBufferSource;
			function fromSource(source) {
				if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
				else return source;
			}
			_Binary.fromSource = fromSource;
			function toBase64(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
				let binary = "";
				const bytes = new Uint8Array(source);
				for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
				return btoa(binary);
			}
			_Binary.toBase64 = toBase64;
			function fromBase64(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
				return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
			}
			_Binary.fromBase64 = fromBase64;
			function toHex(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
				return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
			}
			_Binary.toHex = toHex;
			function fromHex(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
				const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
				const buffer = [];
				for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
				return Uint8Array.from(buffer).buffer;
			}
			_Binary.fromHex = fromHex;
		})(Binary || (Binary = {}));
		Binary.fromBase64;
		Binary.toBase64;
		Binary.fromHex;
		Binary.toHex;
		/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
		function clone(source, refs = /* @__PURE__ */ new Map()) {
			if (!source || typeof source !== "object") return source;
			if (is("Date", source)) return new Date(source.valueOf());
			if (is("RegExp", source)) return new RegExp(source.source, source.flags);
			if (isArrayBufferLike(source)) return source.slice(0);
			if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
			const cached = refs.get(source);
			if (cached) return cached;
			if (Array.isArray(source)) {
				const result = [];
				refs.set(source, result);
				source.forEach((value, index) => {
					result[index] = Reflect.apply(clone, null, [value, refs]);
				});
				return result;
			}
			const result = Object.create(Object.getPrototypeOf(source));
			refs.set(source, result);
			for (const key of Reflect.ownKeys(source)) {
				const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
				if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
				Reflect.defineProperty(result, key, descriptor);
			}
			return result;
		}
		/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
		function deepEqual(a, b, strict) {
			if (a === b) return true;
			if (!strict && isNullable(a) && isNullable(b)) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a !== "object") return false;
			if (!a || !b) return false;
			function check(test, then) {
				return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
			}
			return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
				if (a.byteLength !== b.byteLength) return false;
				const viewA = new Uint8Array(a);
				const viewB = new Uint8Array(b);
				for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
				return true;
			}) ?? Object.keys({
				...a,
				...b
			}).every((key) => deepEqual(a[key], b[key], strict));
		}
		//#endregion
		//#region ../../../vendor/cosmokit/src/time.ts
		let Time;
		(function(_Time) {
			_Time.millisecond = 1;
			const second = _Time.second = 1e3;
			const minute = _Time.minute = second * 60;
			const hour = _Time.hour = minute * 60;
			const day = _Time.day = hour * 24;
			const week = _Time.week = day * 7;
			let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
			function setTimezoneOffset(offset) {
				timezoneOffset = offset;
			}
			_Time.setTimezoneOffset = setTimezoneOffset;
			function getTimezoneOffset() {
				return timezoneOffset;
			}
			_Time.getTimezoneOffset = getTimezoneOffset;
			function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
				if (typeof date === "number") date = new Date(date);
				if (offset === void 0) offset = timezoneOffset;
				return Math.floor((date.valueOf() / minute - offset) / 1440);
			}
			_Time.getDateNumber = getDateNumber;
			function fromDateNumber(value, offset) {
				const date = new Date(value * day);
				if (offset === void 0) offset = timezoneOffset;
				return new Date(+date + offset * minute);
			}
			_Time.fromDateNumber = fromDateNumber;
			const numeric = /\d+(?:\.\d+)?/.source;
			const timeRegExp = new RegExp(`^${[
				"w(?:eek(?:s)?)?",
				"d(?:ay(?:s)?)?",
				"h(?:our(?:s)?)?",
				"m(?:in(?:ute)?(?:s)?)?",
				"s(?:ec(?:ond)?(?:s)?)?"
			].map((unit) => `(${numeric}${unit})?`).join("")}$`);
			function parseTime(source) {
				const capture = timeRegExp.exec(source);
				if (!capture) return 0;
				return (parseFloat(capture[1]) * week || 0) + (parseFloat(capture[2]) * day || 0) + (parseFloat(capture[3]) * hour || 0) + (parseFloat(capture[4]) * minute || 0) + (parseFloat(capture[5]) * second || 0);
			}
			_Time.parseTime = parseTime;
			function parseDate(date) {
				const parsed = parseTime(date);
				if (parsed) date = Date.now() + parsed;
				else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
				else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
				return date ? new Date(date) : /* @__PURE__ */ new Date();
			}
			_Time.parseDate = parseDate;
			function format(ms) {
				const abs = Math.abs(ms);
				if (abs >= day - hour / 2) return Math.round(ms / day) + "d";
				else if (abs >= hour - minute / 2) return Math.round(ms / hour) + "h";
				else if (abs >= minute - second / 2) return Math.round(ms / minute) + "m";
				else if (abs >= second) return Math.round(ms / second) + "s";
				return ms + "ms";
			}
			_Time.format = format;
			function toDigits(source, length = 2) {
				return source.toString().padStart(length, "0");
			}
			_Time.toDigits = toDigits;
			function template(template, time = /* @__PURE__ */ new Date()) {
				return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
			}
			_Time.template = template;
		})(Time || (Time = {}));
		//#endregion
		//#region ../../../vendor/schemastery/src/index.ts
		const kSchema = Symbol.for("schemastery");
		const kValidationError = Symbol.for("ValidationError");
		globalThis.__schemastery_index__ ??= 0;
		globalThis.__schemastery_refs__ = void 0;
		var ValidationError = class extends TypeError {
			options;
			name = "ValidationError";
			constructor(message, options) {
				let prefix = "$";
				for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
				else if (typeof segment === "number") prefix += "[" + segment + "]";
				else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
				if (prefix.startsWith(".")) prefix = prefix.slice(1);
				super((prefix === "$" ? "" : `${prefix} `) + message);
				this.options = options;
			}
			static is(error) {
				return !!error?.[kValidationError];
			}
		};
		Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
		const Schema = function(options) {
			const schema = function(data, options = {}) {
				return Schema.resolve(data, schema, options)[0];
			};
			if (options.refs) {
				const refs = mapValues(options.refs, (options) => new Schema(options));
				const getRef = (uid) => refs[uid];
				for (const key in refs) {
					const options = refs[key];
					options.sKey = getRef(options.sKey);
					options.inner = getRef(options.inner);
					options.list = options.list && options.list.map(getRef);
					options.dict = options.dict && mapValues(options.dict, getRef);
				}
				return refs[options.uid];
			}
			Object.assign(schema, options);
			if (typeof schema.callback === "string") try {
				schema.callback = new Function("return " + schema.callback)();
			} catch {}
			Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
			Object.setPrototypeOf(schema, Schema.prototype);
			schema.meta ||= {};
			schema.toString = schema.toString.bind(schema);
			return schema;
		};
		Schema.prototype = Object.create(Function.prototype);
		Schema.prototype[kSchema] = true;
		Object.defineProperty(Schema.prototype, "~standard", { get() {
			return {
				version: 1,
				vendor: "schemastery",
				validate: (value) => {
					try {
						return { value: Schema.resolve(value, this, {})[0] };
					} catch (error) {
						if (ValidationError.is(error)) return { issues: [{
							message: error.message,
							path: error.options.path
						}] };
						throw error;
					}
				}
			};
		} });
		Schema.ValidationError = ValidationError;
		Schema.prototype.toJSON = function toJSON() {
			if (globalThis.__schemastery_refs__) {
				globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
				return this.uid;
			}
			globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
			globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
			const result = {
				uid: this.uid,
				refs: globalThis.__schemastery_refs__
			};
			globalThis.__schemastery_refs__ = void 0;
			return result;
		};
		Schema.prototype.set = function set(key, value) {
			this.dict[key] = value;
			return this;
		};
		Schema.prototype.push = function push(value) {
			this.list.push(value);
			return this;
		};
		function mergeDesc(original, messages) {
			const result = typeof original === "string" ? { "": original } : { ...original };
			for (const locale in messages) {
				const value = messages[locale];
				if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
				else if (typeof value === "string") result[locale] = value;
			}
			return result;
		}
		function getInner(value) {
			return value?.$value ?? value?.$inner;
		}
		function extractKeys(data) {
			return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
		}
		Schema.prototype.i18n = function i18n(messages) {
			const schema = Schema(this);
			const desc = mergeDesc(schema.meta.description, messages);
			if (Object.keys(desc).length) schema.meta.description = desc;
			if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
				return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
			});
			if (schema.list) schema.list = schema.list.map((inner, index) => {
				return inner.i18n(mapValues(messages, (data = {}) => {
					if (Array.isArray(getInner(data))) return getInner(data)[index];
					if (Array.isArray(data)) return data[index];
					return extractKeys(data);
				}));
			});
			if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
				if (getInner(data)) return getInner(data);
				return extractKeys(data);
			}));
			if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
			return schema;
		};
		Schema.prototype.extra = function extra(key, value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		};
		for (const key of [
			"required",
			"disabled",
			"collapse",
			"hidden",
			"loose"
		]) Object.assign(Schema.prototype, { [key](value = true) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		Schema.prototype.deprecated = function deprecated() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "deprecated",
				type: "danger"
			});
			return schema;
		};
		Schema.prototype.experimental = function experimental() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "experimental",
				type: "warning"
			});
			return schema;
		};
		Schema.prototype.pattern = function pattern(regexp) {
			const schema = Schema(this);
			const pattern = pick(regexp, ["source", "flags"]);
			schema.meta = {
				...schema.meta,
				pattern
			};
			return schema;
		};
		Schema.prototype.simplify = function simplify(value) {
			if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
			if (isNullable(value)) return value;
			if (this.type === "object" || this.type === "dict") {
				const result = {};
				for (const key in value) {
					const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
					if (this.type === "dict" || !isNullable(item)) result[key] = item;
				}
				if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
				return result;
			} else if (this.type === "array" || this.type === "tuple") {
				const result = [];
				value.forEach((value, index) => {
					const schema = this.type === "array" ? this.inner : this.list[index];
					const item = schema ? schema.simplify(value) : value;
					result.push(item);
				});
				return result;
			} else if (this.type === "intersect") {
				const result = {};
				for (const item of this.list) Object.assign(result, item.simplify(value));
				return result;
			} else if (this.type === "union") for (const schema of this.list) try {
				Schema.resolve(value, schema, {});
				return schema.simplify(value);
			} catch {}
			return value;
		};
		Schema.prototype.toString = function toString(inline) {
			return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
		};
		Schema.prototype.role = function role(role, extra) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				role,
				extra
			};
			return schema;
		};
		for (const key of [
			"default",
			"link",
			"comment",
			"description",
			"max",
			"min",
			"step"
		]) Object.assign(Schema.prototype, { [key](value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		const resolvers = {};
		Schema.extend = function extend(type, resolve) {
			resolvers[type] = resolve;
		};
		Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
			if (!schema) return [data];
			if (options.ignore?.(data, schema)) return [data];
			if (isNullable(data) && schema.type !== "lazy") {
				if (schema.meta.required) throw new ValidationError(`missing required value`, options);
				let current = schema;
				let fallback = schema.meta.default;
				while (current?.type === "intersect" && isNullable(fallback)) {
					current = current.list[0];
					fallback = current?.meta.default;
				}
				if (isNullable(fallback)) return [data];
				data = clone(fallback);
			}
			const callback = resolvers[schema.type];
			if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
			try {
				return callback(data, schema, options, strict);
			} catch (error) {
				if (!schema.meta.loose) throw error;
				return [schema.meta.default];
			}
		};
		Schema.from = function from(source) {
			if (isNullable(source)) return Schema.any();
			else if ([
				"string",
				"number",
				"boolean"
			].includes(typeof source)) return Schema.const(source).required();
			else if (source[kSchema]) return source;
			else if (typeof source === "function") switch (source) {
				case String: return Schema.string().required();
				case Number: return Schema.number().required();
				case Boolean: return Schema.boolean().required();
				case Function: return Schema.function().required();
				default: return Schema.is(source).required();
			}
			else throw new TypeError(`cannot infer schema from ${source}`);
		};
		Schema.lazy = function lazy(builder) {
			const toJSON = () => {
				if (!schema.inner[kSchema]) {
					schema.inner = schema.builder();
					schema.inner.meta = {
						...schema.meta,
						...schema.inner.meta
					};
				}
				return schema.inner.toJSON();
			};
			const schema = new Schema({
				type: "lazy",
				builder,
				inner: { toJSON }
			});
			return schema;
		};
		Schema.natural = function natural() {
			return Schema.number().step(1).min(0);
		};
		Schema.percent = function percent() {
			return Schema.number().step(.01).min(0).max(1).role("slider");
		};
		Schema.date = function date() {
			return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
				const date = new Date(value);
				if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
				return date;
			}, true)]);
		};
		Schema.regExp = function regExp(flag = "") {
			return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
				try {
					return new RegExp(value, flag);
				} catch (e) {
					throw new ValidationError(e.message, options);
				}
			}, true)]);
		};
		Schema.arrayBuffer = function arrayBuffer(encoding) {
			return Schema.union([
				Schema.is(ArrayBuffer),
				Schema.is(SharedArrayBuffer),
				Schema.transform(Schema.any(), (value, options) => {
					if (Binary.isSource(value)) return Binary.fromSource(value);
					throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
				}, true),
				...encoding ? [Schema.transform(Schema.string(), (value, options) => {
					try {
						return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
					} catch (e) {
						throw new ValidationError(e.message, options);
					}
				}, true)] : []
			]);
		};
		Schema.extend("lazy", (data, schema, options, strict) => {
			if (!schema.inner[kSchema]) {
				schema.inner = schema.builder();
				schema.inner.meta = {
					...schema.meta,
					...schema.inner.meta
				};
			}
			return Schema.resolve(data, schema.inner, options, strict);
		});
		Schema.extend("any", (data) => {
			return [data];
		});
		Schema.extend("never", (data, _, options) => {
			throw new ValidationError(`expected nullable but got ${data}`, options);
		});
		Schema.extend("const", (data, { value }, options) => {
			if (deepEqual(data, value)) return [value];
			throw new ValidationError(`expected ${value} but got ${data}`, options);
		});
		function checkWithinRange(data, meta, description, options, skipMin = false) {
			const { max = Infinity, min = -Infinity } = meta;
			if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
			if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
		}
		Schema.extend("string", (data, { meta }, options) => {
			if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
			if (meta.pattern) {
				const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
				if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
			}
			checkWithinRange(data.length, meta, "string length", options);
			return [data];
		});
		function decimalShift(data, digits) {
			const str = data.toString();
			if (str.includes("e")) return data * Math.pow(10, digits);
			const index = str.indexOf(".");
			if (index === -1) return data * Math.pow(10, digits);
			const frac = str.slice(index + 1);
			const integer = str.slice(0, index);
			if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
			return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
		}
		function isMultipleOf(data, min, step) {
			step = Math.abs(step);
			if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
			const index = step.toString().indexOf(".");
			const digits = step.toString().slice(index + 1).length;
			return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
		}
		Schema.extend("number", (data, { meta }, options) => {
			if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
			checkWithinRange(data, meta, "number", options);
			const { step } = meta;
			if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
			return [data];
		});
		Schema.extend("boolean", (data, _, options) => {
			if (typeof data === "boolean") return [data];
			throw new ValidationError(`expected boolean but got ${data}`, options);
		});
		Schema.extend("bitset", (data, { bits, meta }, options) => {
			let value = 0, keys = [];
			if (typeof data === "number") {
				value = data;
				for (const key in bits) if (data & bits[key]) keys.push(key);
			} else if (Array.isArray(data)) {
				keys = data;
				for (const key of keys) {
					if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
					if (key in bits) value |= bits[key];
				}
			} else throw new ValidationError(`expected number or array but got ${data}`, options);
			if (value === meta.default) return [value];
			return [value, keys];
		});
		Schema.extend("function", (data, _, options) => {
			if (typeof data === "function") return [data];
			throw new ValidationError(`expected function but got ${data}`, options);
		});
		Schema.extend("is", (data, { constructor }, options) => {
			if (typeof constructor === "function") {
				if (data instanceof constructor) return [data];
				throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
			} else {
				if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
				let prototype = Object.getPrototypeOf(data);
				while (prototype) {
					if (prototype.constructor?.name === constructor) return [data];
					prototype = Object.getPrototypeOf(prototype);
				}
				throw new ValidationError(`expected ${constructor} but got ${data}`, options);
			}
		});
		function property(data, key, schema, options) {
			try {
				const [value, adapted] = Schema.resolve(data[key], schema, {
					...options,
					path: [...options.path || [], key]
				});
				if (adapted !== void 0) data[key] = adapted;
				return value;
			} catch (e) {
				if (!options?.autofix) throw e;
				delete data[key];
				return schema.meta.default;
			}
		}
		Schema.extend("array", (data, { inner, meta }, options) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
			return [data.map((_, index) => property(data, index, inner, options))];
		});
		Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in data) {
				let rKey;
				try {
					rKey = Schema.resolve(key, sKey, options)[0];
				} catch (error) {
					if (strict) continue;
					throw error;
				}
				result[rKey] = property(data, key, inner, options);
				data[rKey] = data[key];
				if (key !== rKey) delete data[key];
			}
			return [result];
		});
		Schema.extend("tuple", (data, { list }, options, strict) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			const result = list.map((inner, index) => property(data, index, inner, options));
			if (strict) return [result];
			result.push(...data.slice(list.length));
			return [result];
		});
		function merge(result, data) {
			for (const key in data) {
				if (key in result) continue;
				result[key] = data[key];
			}
		}
		Schema.extend("object", (data, { dict }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in dict) {
				const value = property(data, key, dict[key], options);
				if (!isNullable(value) || key in data) result[key] = value;
			}
			if (!strict) merge(result, data);
			return [result];
		});
		Schema.extend("union", (data, { list, toString }, options, strict) => {
			const messages = [];
			for (const inner of list) try {
				return Schema.resolve(data, inner, options, strict);
			} catch (error) {
				messages.push(error);
			}
			throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		});
		Schema.extend("intersect", (data, { list, toString }, options, strict) => {
			if (!list.length) return [data];
			let result;
			for (const inner of list) {
				const value = Schema.resolve(data, inner, options, true)[0];
				if (isNullable(value)) continue;
				if (isNullable(result)) result = value;
				else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
				else if (typeof value === "object") merge(result ??= {}, value);
				else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
			}
			if (!strict && isPlainObject(data)) merge(result, data);
			return [result];
		});
		Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
			const [result, adapted = data] = Schema.resolve(data, inner, options, true);
			if (preserve) return [callback(result)];
			else return [callback(result), callback(adapted)];
		});
		const formatters = {};
		function defineMethod(name, keys, format) {
			formatters[name] = format;
			Object.assign(Schema, { [name](...args) {
				const schema = new Schema({ type: name });
				keys.forEach((key, index) => {
					switch (key) {
						case "sKey":
							schema.sKey = args[index] ?? Schema.string();
							break;
						case "inner":
							schema.inner = Schema.from(args[index]);
							break;
						case "list":
							schema.list = args[index].map(Schema.from);
							break;
						case "dict":
							schema.dict = mapValues(args[index], Schema.from);
							break;
						case "bits":
							schema.bits = {};
							for (const key in args[index]) {
								if (typeof args[index][key] !== "number") continue;
								schema.bits[key] = args[index][key];
							}
							break;
						case "callback": {
							const callback = schema.callback = args[index];
							callback["toJSON"] ||= () => callback.toString();
							break;
						}
						case "constructor": {
							const constructor = schema.constructor = args[index];
							if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
							break;
						}
						default: schema[key] = args[index];
					}
				});
				if (name === "object" || name === "dict") schema.meta.default = {};
				else if (name === "array" || name === "tuple") schema.meta.default = [];
				else if (name === "bitset") schema.meta.default = 0;
				return schema;
			} });
		}
		defineMethod("is", ["constructor"], ({ constructor }) => {
			if (typeof constructor === "function") return constructor.name;
			else return constructor;
		});
		defineMethod("any", [], () => "any");
		defineMethod("never", [], () => "never");
		defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
		defineMethod("string", [], () => "string");
		defineMethod("number", [], () => "number");
		defineMethod("boolean", [], () => "boolean");
		defineMethod("bitset", ["bits"], () => "bitset");
		defineMethod("function", [], () => "function");
		defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
		defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
		defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
		defineMethod("object", ["dict"], ({ dict }) => {
			if (Object.keys(dict).length === 0) return "{}";
			return `{ ${Object.entries(dict).map(([key, inner]) => {
				return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
			}).join(", ")} }`;
		});
		defineMethod("union", ["list"], ({ list }, inline) => {
			const result = list.map(({ toString: format }) => format()).join(" | ");
			return inline ? `(${result})` : result;
		});
		defineMethod("intersect", ["list"], ({ list }) => {
			return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
		});
		defineMethod("transform", [
			"inner",
			"callback",
			"preserve"
		], ({ inner }, isInner) => inner.toString(isInner));
		//#endregion
		//#region lib/types/client/status.js
		/** All-zero counts: nothing to indicate, the default favicon stays. */
		const EMPTY_TAB_COUNTS = {
			running: 0,
			pending: 0,
			done: 0
		};
		/**
		* One session's tab state. A pending interaction outranks live activity,
		* which outranks the done reminders; everything else is idle (unprompted,
		* open-but-quiet, or a session the user is watching).
		* @param summary - the sessions list row.
		* @param recentlyDone - monitor-tracked running→idle transition still within
		* its visibility window: shown green even when the background-completion
		* reminder is not armed (the user was watching, so the product never armed it).
		* @returns the derived tab state.
		*/
		function sessionTabState(summary, recentlyDone = false) {
			if (summary.pendingInteraction !== void 0) return "pending";
			if (summary.running) return "running";
			if (summary.completed === true || recentlyDone) return "done";
			return "idle";
		}
		/**
		* Aggregate every listed session into tab counts; idle sessions do not count.
		* @param byId - the sessions list projection's id-to-row map.
		* @param recentlyDone - ids of sessions whose running→idle transition is
		* still within the monitor's visibility window (shown green).
		* @returns per-state counts (never partial: a fresh object per call).
		*/
		function aggregateTabCounts(byId, recentlyDone) {
			const counts = {
				running: 0,
				pending: 0,
				done: 0
			};
			for (const summary of Object.values(byId)) switch (sessionTabState(summary, recentlyDone?.has(summary.id) === true)) {
				case "running":
					counts.running += 1;
					break;
				case "pending":
					counts.pending += 1;
					break;
				case "done":
					counts.done += 1;
					break;
				case "idle": break;
			}
			return counts;
		}
		/**
		* Whether the counts show nothing to indicate.
		* @param counts - aggregate tab counts.
		* @returns true when every state is zero.
		*/
		function isEmptyTabCounts(counts) {
			return counts.running === 0 && counts.pending === 0 && counts.done === 0;
		}
		//#endregion
		//#region lib/types/client/favicon.js
		const TAU = Math.PI * 2;
		/**
		* Fixed trailing gap in radians — at least 30° so the anchor reads clearly at
		* 16 px. The gap exists to show rotation: while any session runs the ring
		* spans TAU - END_GAP and the gap rides the rotation phase, so even a
		* single-color ring visibly spins; a static ring (nothing running) is
		* complete. 0.6 rad ≈ 34.4°.
		*/
		const END_GAP = .6;
		/** Ring hole radius as a fraction of the icon size. */
		const INNER_RADIUS_RATIO = .36;
		/** Outer radius inset in px, so the ring never touches the icon edge. */
		const OUTER_INSET = 1;
		/** Center-graphic edge as a fraction of the icon size, kept inside the hole. */
		const CENTER_EDGE_RATIO = .58;
		/**
		* Split the ring into state segments proportional to counts, rotated by the
		* animation phase (a running mix spins; a static mix stays put at 0). While
		* anything runs, the ring leaves the fixed {@link END_GAP} gap, which moves
		* with the phase and makes the rotation legible; with nothing running the
		* ring is complete — the gap exists to show rotation, and a static done or
		* pending ring needs no anchor.
		* @param counts - aggregate tab counts.
		* @param rotation - clockwise rotation of the first segment start, radians.
		* @param palette - per-state fill colors.
		* @returns the wedge list in running/pending/done order, empty for all-zero counts.
		*/
		function wedgeSlices(counts, rotation, palette) {
			const total = counts.running + counts.pending + counts.done;
			if (total === 0) return [];
			const gap = counts.running > 0 ? END_GAP : 0;
			const slices = [];
			let cursor = -Math.PI / 2 + rotation;
			const push = (count, color) => {
				if (count <= 0) return;
				const span = count / total * (TAU - gap);
				slices.push({
					start: cursor,
					end: cursor + span,
					color
				});
				cursor += span;
			};
			push(counts.running, palette.running);
			push(counts.pending, palette.pending);
			push(counts.done, palette.done);
			return slices;
		}
		/**
		* Paint one favicon frame: the segmented annulus described by the slices,
		* then the center graphic (the default favicon's whale) inside the hole when
		* one was loaded. Each slice is an outer arc, an inner reverse arc, and a
		* closing chord — the nonzero winding rule fills exactly the ring sector,
		* leaving the hole and the outside transparent.
		* @param painter - canvas face to paint on (already sized by the caller).
		* @param slices - ring segments to fill.
		* @param size - icon side length in px (geometry derives from it).
		* @param center - optional graphic drawn centered inside the ring hole.
		*/
		function paintFavicon(painter, slices, size, center = null) {
			const centerPoint = size / 2;
			const outerRadius = size / 2 - OUTER_INSET;
			const innerRadius = size * INNER_RADIUS_RATIO;
			painter.clearRect(0, 0, size, size);
			for (const slice of slices) {
				painter.setFillStyle(slice.color);
				painter.beginPath();
				painter.arc(centerPoint, centerPoint, outerRadius, slice.start, slice.end);
				painter.arc(centerPoint, centerPoint, innerRadius, slice.end, slice.start, true);
				painter.closePath();
				painter.fill();
			}
			if (center !== null) {
				const edge = size * CENTER_EDGE_RATIO;
				const offset = (size - edge) / 2;
				painter.drawImage(center, offset, offset, edge, edge);
			}
		}
		/**
		* Browser renderer: one reusable offscreen canvas, painted and PNG-encoded
		* per frame.
		* @param doc - document owning the offscreen canvas.
		* @param palette - per-state fill colors.
		* @param size - icon side length in px (64 keeps the ring and its gap crisp
		* when the browser downscales to the 16 px tab bar).
		* @returns the renderer.
		*/
		function createCanvasRenderer(doc, palette, size = 64) {
			const canvas = doc.createElement("canvas");
			canvas.width = size;
			canvas.height = size;
			let center = null;
			return {
				render(counts, rotation) {
					if (isEmptyTabCounts(counts)) return null;
					const ctx = canvas.getContext("2d");
					if (ctx === null) return null;
					paintFavicon(createCanvasPainter(ctx), wedgeSlices(counts, rotation, palette), size, center);
					return canvas.toDataURL("image/png");
				},
				setCenter(image) {
					center = image;
				}
			};
		}
		/**
		* Adapt a real 2D context to the painter face.
		* @param ctx - a canvas 2D context.
		* @returns the painter face over it.
		*/
		function createCanvasPainter(ctx) {
			return {
				clearRect: (x, y, width, height) => {
					ctx.clearRect(x, y, width, height);
				},
				setFillStyle: (color) => {
					ctx.fillStyle = color;
				},
				beginPath: () => {
					ctx.beginPath();
				},
				arc: (x, y, radius, startAngle, endAngle, counterclockwise) => {
					ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
				},
				closePath: () => {
					ctx.closePath();
				},
				fill: () => {
					ctx.fill();
				},
				drawImage: (image, x, y, width, height) => {
					ctx.drawImage(image, x, y, width, height);
				}
			};
		}
		//#endregion
		//#region lib/types/client/monitor.js
		const DEFAULT_SPIN_MS = 1200;
		const DEFAULT_TICK_MS = 150;
		const DEFAULT_DONE_VISIBLE_MS = 3e4;
		/** Find the document's primary tab favicon link (rel containing "icon"). */
		function faviconLink(doc) {
			return doc.querySelector("link[rel~=\"icon\"]");
		}
		/**
		* Create the tab-status monitor over one sessions list source. The monitor
		* subscribes itself: list changes repaint immediately, and dispose tears the
		* subscription down with the favicon restore.
		* @param doc - document whose favicon link is swapped.
		* @param list - the sessions list projection (ctx.sessions.list).
		* @param renderer - frame painter (canvas-based in the browser, fake in specs).
		* @param options - spin/tick tuning.
		* @returns the monitor handle.
		*/
		function createTabStatusMonitor(doc, list, renderer, options = {}) {
			const spinMs = options.spinMs ?? DEFAULT_SPIN_MS;
			const tickMs = options.tickMs ?? DEFAULT_TICK_MS;
			const doneVisibleMs = options.doneVisibleMs ?? DEFAULT_DONE_VISIBLE_MS;
			const originalLink = faviconLink(doc);
			const originalHref = originalLink?.getAttribute("href");
			let ownLink = null;
			let timer;
			let counts = EMPTY_TAB_COUNTS;
			/** Sessions whose running→idle transition is still shown green: id → expiry. */
			const doneUntil = /* @__PURE__ */ new Map();
			/** Running sessions as of the previous snapshot, for transition detection. */
			let previousRunning = /* @__PURE__ */ new Set();
			/** Dispose already ran: late image loads must not repaint a torn-down monitor. */
			let disposed = false;
			const activeLink = () => {
				if (originalLink !== null) return originalLink;
				if (ownLink !== null) return ownLink;
				const created = doc.createElement("link");
				created.rel = "icon";
				created.type = "image/png";
				doc.head.appendChild(created);
				ownLink = created;
				return created;
			};
			const stop = () => {
				if (timer === void 0) return;
				window.clearInterval(timer);
				timer = void 0;
			};
			const restore = () => {
				stop();
				if (originalLink !== null) {
					if (originalHref !== null && originalHref !== void 0) originalLink.setAttribute("href", originalHref);
				} else if (ownLink !== null) {
					ownLink.remove();
					ownLink = null;
				}
			};
			const paint = (rotation) => {
				const dataUrl = renderer.render(counts, rotation);
				if (dataUrl === null) {
					restore();
					return;
				}
				const link = activeLink();
				if (link !== null) link.href = dataUrl;
			};
			const rotationOf = () => Date.now() % spinMs / spinMs * Math.PI * 2;
			/**
			* Full re-evaluation: detect running→idle transitions, prune expired done
			* windows, re-aggregate counts, and repaint. Runs on every list change and
			* every animation tick, so an expiring done window restores the favicon
			* even when the list itself has not changed.
			*/
			const evaluate = () => {
				const byId = list.getSnapshot().byId;
				const now = Date.now();
				const runningIds = /* @__PURE__ */ new Set();
				for (const summary of Object.values(byId)) if (summary.running) runningIds.add(summary.id);
				for (const id of previousRunning) {
					if (runningIds.has(id)) continue;
					const summary = byId[id];
					if (summary !== void 0 && !summary.pendingInteraction) doneUntil.set(id, now + doneVisibleMs);
				}
				previousRunning = runningIds;
				for (const [id, until] of doneUntil) if (until <= now) doneUntil.delete(id);
				counts = aggregateTabCounts(byId, doneUntil.size > 0 ? new Set(doneUntil.keys()) : void 0);
				if (isEmptyTabCounts(counts)) {
					restore();
					return;
				}
				if (counts.running > 0 || doneUntil.size > 0) start();
				else stop();
				paint(counts.running > 0 ? rotationOf() : 0);
			};
			const start = () => {
				if (timer !== void 0) return;
				timer = window.setInterval(evaluate, tickMs);
			};
			const unsubscribe = list.subscribe(evaluate);
			evaluate();
			if (originalHref !== null && originalHref !== void 0) {
				const image = new Image();
				image.onload = () => {
					if (disposed) return;
					renderer.setCenter(image);
					evaluate();
				};
				image.onerror = () => {};
				image.src = originalHref;
			}
			return {
				sync: evaluate,
				dispose() {
					disposed = true;
					unsubscribe();
					restore();
				}
			};
		}
		//#endregion
		//#region lib/types/client/index.js
		/**
		* Browser tab status indicator: paints the document favicon from the sessions
		* list projection 鈥?green done / amber waiting-on-user / blue running 鈥?so a
		* backgrounded dsh web tab still shows whether work finished, waits on the
		* user, or is executing. The segmented ring spins clockwise while any session
		* runs; with mixed states the ring splits proportionally (one finished and
		* one running session reads as half green, half blue).
		*
		* The colors default to the GUI's canonical state semantics (the StateDot
		* palette: deepseek blue for ongoing, amber for user attention, green for
		* done) and are overridable through Config, as is the spin period.
		*/
		/** Default fill colors: the GUI's canonical state palette (StateDot semantics). */
		const DEFAULT_PALETTE = {
			running: "#5686FE",
			pending: "#F59E0B",
			done: "#22C55E"
		};
		const Config = Schema.object({
			spinMs: Schema.number().step(1).min(200).default(1200),
			doneVisibleMs: Schema.number().step(1).min(1e3).default(3e4),
			colors: Schema.object({
				running: Schema.string().default(DEFAULT_PALETTE.running),
				pending: Schema.string().default(DEFAULT_PALETTE.pending),
				done: Schema.string().default(DEFAULT_PALETTE.done)
			}).default(DEFAULT_PALETTE)
		});
		/** Required services: the sessions list projection. */
		const inject = ["sessions"];
		/**
		* Client plugin body: mount the favicon monitor over the sessions list.
		* @param ctx - client root context.
		* @param config - validated {@link Config}; schema defaults fill every field.
		*/
		function apply(ctx, config) {
			const palette = {
				running: config.colors.running,
				pending: config.colors.pending,
				done: config.colors.done
			};
			ctx.effect(() => {
				const renderer = createCanvasRenderer(document, palette);
				const monitor = createTabStatusMonitor(document, ctx.sessions.list, renderer, {
					spinMs: config.spinMs,
					doneVisibleMs: config.doneVisibleMs
				});
				return () => {
					monitor.dispose();
				};
			}, "ui-favicon-status: session favicon");
		}
		//#endregion
		exports.Config = Config;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map