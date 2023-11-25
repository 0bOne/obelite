var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;

var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;

var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;

var YAML_FLOAT_PATTERN = new RegExp(
    // 2.5e4, 2.5 and integers
    '^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
    // .2e4, .2
    // special case, seems not from spec
    '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
    // .inf
    '|[-+]?\\.(?:inf|Inf|INF)' +
    // .nan
    '|\\.(?:nan|NaN|NAN))$');

var YAML_DATE_REGEXP = new RegExp(
    '^([0-9][0-9][0-9][0-9])' + // [1] year
    '-([0-9][0-9])' +           // [2] month
    '-([0-9][0-9])$');          // [3] day
      
var YAML_TIMESTAMP_REGEXP = new RegExp(
    '^([0-9][0-9][0-9][0-9])' + // [1] year
    '-([0-9][0-9]?)' + // [2] month
    '-([0-9][0-9]?)' + // [3] day
    '(?:[Tt]|[ \\t]+)' + // ...
    '([0-9][0-9]?)' + // [4] hour
    ':([0-9][0-9])' + // [5] minute
    ':([0-9][0-9])' + // [6] second
    '(?:\\.([0-9]*))?' + // [7] fraction
    '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
    '(?::([0-9][0-9]))?))?$');           // [11] tz_minute    

var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';

const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

const SIMPLE_ESCAPE_SEQUENCE = {
    0x30 : '\x00',   // 0 
    0x61: '\x07',   // a *
    0x62: '\x08',   // b
    0x74: '\x09',   // t
    0x09: '\x09',   // tab
    0x6E: '\x0A',   // n
    0x76: '\x0B',   // v
    0x66: '\x0C',   // f
    0x72: '\x0D',   // r
    0x65: '\x1B',   // e
    0x20: ' ',      // space
    0x22: '\x22',   // *
    0x2F: '/',      // /
    0x5C:  '\x5C',  // \
    0x4E: '\x85',   // N
    0x5F: '\xA0',   // _
    0x4C: '\u2028', // L
    0x50: '\u2029' // P
};

const CHARS = {
    TAB: 0x09,
    LF: 0x0A,
    CR: 0x0D,
    SPACE: 0x20,
    BANG: 0x21,
    DOUBLE_QUOTE: 0x22,
    HASH: 0x23,
    PERCENT: 0x25,
    AMPERSAND: 0x26,
    SINGLE_QUOTE: 0x27,
    ASTERISK: 0x2A,
    COMMA: 0x2C,
    MINUS: 0x2D,
    PERIOD: 0x2E,
    COLON: 0x3A,
    EQUALS: 0x3D,
    GREATER:  0x3E,
    QUESTION: 0x3F,
    AT: 0x40,
    LEFT_SQUARE_BRACKET: 0x5B,
    RIGHT_SQUARE_BRACKET: 0x5D,
    BACKTICK: 0x60,
    LEFT_CURLY_BRACKET: 0x7B,
    PIPE: 0x7C,
    RIGHT_CURLY_BRACKET: 0x7D,
    BOM: 0xFEFF
};

const EOLS = [CHARS.LF, CHARS.CR];
const WHITE_SPACE = [CHARS.TAB, CHARS.SPACE];
const WS_OR_EOL = [...WHITE_SPACE, ...EOLS];
const SQUARE_BRACKETS = [CHARS.LEFT_SQUARE_BRACKET, CHARS.RIGHT_SQUARE_BRACKET];
const CURLY_BRACKETS = [CHARS.LEFT_CURLY_BRACKET, CHARS.RIGHT_CURLY_BRACKET];
const FLOW_INDICATOR = [CHARS.COMMA, ...SQUARE_BRACKETS, CURLY_BRACKETS];


var simpleEscapeCheck = new Array(256); // integer, for fast access
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  const seseq = SIMPLE_ESCAPE_SEQUENCE[i] || "";
  simpleEscapeCheck[i] = seseq ? 1 : 0;
  simpleEscapeMap[i] = seseq;
}

function isNegativeZero(number) {
    return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
}

function compileStyleAliases(map) {
    var result = {};
  
    if (map !== null) {
      Object.keys(map).forEach(function (style) {
        map[style].forEach(function (alias) {
          result[String(alias)] = style;
        });
      });
    }
  
    return result;
}
  
function Type_Function(tag, options) {
    options = options || {};

    // TODO: Add tag format check.
    this.options = options; // keep original options in case user wants to extend this type later
    this.tag = tag;
    this.kind = options['kind'] || null;
    this.resolve = options['resolve'] || function () { return true; };
    this.construct = options['construct'] || function (data) { return data; };
    this.instanceOf = options['instanceOf'] || null;
    this.predicate = options['predicate'] || null;
    this.defaultStyle = options['defaultStyle'] || null;
    this.multi = options['multi'] || false;
    this.styleAliases = compileStyleAliases(options['styleAliases'] || null);
  
}
  
  
function compileList(schema, name) {
    var result = [];
  
    schema[name].forEach(currentType => {
      var newIndex = result.length;
  
      result.forEach((previousType, previousIndex) => {
        if (previousType.tag === currentType.tag &&
          previousType.kind === currentType.kind &&
          previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
  
      result[newIndex] = currentType;
    });
  
    return result;
}
  
function compileMap(/* lists... */) {
    var result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    }, index, length;
  
    function collectType(type) {
      if (type.multi) {
        result.multi[type.kind].push(type);
        result.multi['fallback'].push(type);
      } else {
        result[type.kind][type.tag] = result['fallback'][type.tag] = type;
      }
    }
  
    for (index = 0, length = arguments.length; index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
}
  
function Schema(definition) {
    return this.extend(definition);
}
  

Schema.prototype.extend = function extend(definition) {
    var implicit = [];
    var explicit = [];
  
    if (definition instanceof Type_Function) {
      // Schema.extend(type)
      explicit.push(definition);
  
    } else if (Array.isArray(definition)) {
      // Schema.extend([ type1, type2, ... ])
      explicit = explicit.concat(definition);
  
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      // Schema.extend({ explicit: [ type1, type2, ... ], implicit: [ type1, type2, ... ] })
      if (definition.implicit) implicit = implicit.concat(definition.implicit);
      if (definition.explicit) explicit = explicit.concat(definition.explicit);
  
    } else {
      throw 'Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })';
    }
  
    implicit.forEach(typeElement => {
        if (!(typeElement instanceof Type_Function)) {
            throw 'Specified list of YAML types (or a single Type object) contains a non-Type object.';
        }

        if (typeElement.loadKind && typeElement.loadKind !== 'scalar') {
            throw 'There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.';
        }

        if (typeElement.multi) {
            throw 'There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.';
        }
    });
  
    explicit.forEach(typeElement => {
      if (!(typeElement instanceof Type_Function)) {
        throw 'Specified list of YAML types (or a single Type object) contains a non-Type object.';
      }
    });
  
    var result = Object.create(Schema.prototype);
  
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
  
    result.compiledImplicit = compileList(result, 'implicit');
    result.compiledExplicit = compileList(result, 'explicit');
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  
    return result;
};
   
var str = new Type_Function('tag:yaml.org,2002:str', {
    kind: 'scalar',
    construct: function (data) { return data !== null ? data : ''; }
});
  
var seq = new Type_Function('tag:yaml.org,2002:seq', {
    kind: 'sequence',
    construct: function (data) { return data !== null ? data : []; }
});
  
var map = new Type_Function('tag:yaml.org,2002:map', {
    kind: 'mapping',
    construct: function (data) { return data !== null ? data : {}; }
});
  
var failsafe = new Schema({
    explicit: [
      str,
      seq,
      map
    ]
});
  
function resolveYamlNull(data) {
    if (data === null) return true;
  
    var max = data.length;
  
    return (max === 1 && data === '~') ||
      (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
}
  
function constructYamlNull() {
    return null;
}
  
function isNull(object) {
    return object === null;
}
  
var _null = new Type_Function('tag:yaml.org,2002:null', {
    kind: 'scalar',
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    defaultStyle: 'lowercase'
});
  
function resolveYamlBoolean(data) {
    if (data === null) return false;
  
    var max = data.length;
  
    return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
      (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
}
  
function constructYamlBoolean(data) {
    return data === 'true' ||
      data === 'True' ||
      data === 'TRUE';
}
  
function isBoolean(object) {
    return Object.prototype.toString.call(object) === '[object Boolean]';
}
  
var bool = new Type_Function('tag:yaml.org,2002:bool', {
    kind: 'scalar',
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    defaultStyle: 'lowercase'
});
  
function isHexCode(c) {
    return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
      ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
      ((0x61/* a */ <= c) && (c <= 0x66/* f */));
}
  
function isOctCode(c) {
    return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
}
  
function isDecCode(c) {
    return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
}
  
function resolveYamlInteger(data) {
    if (data === null) return false;
  
    var max = data.length,
      index = 0,
      hasDigits = false,
      ch;
  
    if (!max) return false;
  
    ch = data[index];
  
    // sign
    if (ch === '-' || ch === '+') {
      ch = data[++index];
    }
  
    if (ch === '0') {
      // 0
      if (index + 1 === max) return true;
      ch = data[++index];
  
      // base 2, base 8, base 16
  
      if (ch === 'b') {
        // base 2
        index++;
  
        for (; index < max; index++) {
          ch = data[index];
          if (ch === '_') continue;
          if (ch !== '0' && ch !== '1') return false;
          hasDigits = true;
        }
        return hasDigits && ch !== '_';
      }
  
  
      if (ch === 'x') {
        // base 16
        index++;
  
        for (; index < max; index++) {
          ch = data[index];
          if (ch === '_') continue;
          if (!isHexCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && ch !== '_';
      }
  
  
      if (ch === 'o') {
        // base 8
        index++;
  
        for (; index < max; index++) {
          ch = data[index];
          if (ch === '_') continue;
          if (!isOctCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && ch !== '_';
      }
    }
  
    // base 10 (except 0)
  
    // value should not start with `_`;
    if (ch === '_') return false;
  
    for (; index < max; index++) {
      ch = data[index];
      if (ch === '_') continue;
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
  
    // Should have digits and should not end with `_`
    if (!hasDigits || ch === '_') return false;
  
    return true;
  }
  
  function constructYamlInteger(data) {
    var value = data, sign = 1, ch;
  
    if (value.indexOf('_') !== -1) {
      value = value.replace(/_/g, '');
    }
  
    ch = value[0];
  
    if (ch === '-' || ch === '+') {
      if (ch === '-') sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
  
    if (value === '0') return 0;
  
    if (ch === '0') {
      if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
      if (value[1] === 'x') return sign * parseInt(value.slice(2), 16);
      if (value[1] === 'o') return sign * parseInt(value.slice(2), 8);
    }
  
    return sign * parseInt(value, 10);
}
  
function isInteger(object) {
    return (Object.prototype.toString.call(object)) === '[object Number]' &&
      (object % 1 === 0 && !isNegativeZero(object));
}
  
var int = new Type_Function('tag:yaml.org,2002:int', {
    kind: 'scalar',
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    defaultStyle: 'decimal',
    styleAliases: {
      binary: [2, 'bin'],
      octal: [8, 'oct'],
      decimal: [10, 'dec'],
      hexadecimal: [16, 'hex']
    }
});
  
function resolveYamlFloat(data) {
    if (data === null) return false;
  
    if (!YAML_FLOAT_PATTERN.test(data) ||
      // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === '_') {
      return false;
    }
  
    return true;
}
  
function constructYamlFloat(data) {
    var value, sign;
  
    value = data.replace(/_/g, '').toLowerCase();
    sign = value[0] === '-' ? -1 : 1;
  
    if ('+-'.indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
  
    if (value === '.inf') {
      return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  
    } else if (value === '.nan') {
      return NaN;
    }
    return sign * parseFloat(value, 10);
}
  
function isFloat(object) {
    return (Object.prototype.toString.call(object) === '[object Number]') &&
      (object % 1 !== 0 || isNegativeZero(object));
}
  
var float = new Type_Function('tag:yaml.org,2002:float', {
    kind: 'scalar',
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    defaultStyle: 'lowercase'
});
  
var json = failsafe.extend({
    implicit: [
      _null,
      bool,
      int,
      float
    ]
});
  
  var core = json;
  
function resolveYamlTimestamp(data) {
    if (data === null) return false;
    if (YAML_DATE_REGEXP.exec(data) !== null) return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
    return false;
}
  
function constructYamlTimestamp(data) {
    var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, date;
  
    match = YAML_DATE_REGEXP.exec(data);
    if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
  
    if (match === null) throw new Error('Date resolve error');
  
    // match: [1] year [2] month [3] day
  
    year = +(match[1]);
    month = +(match[2]) - 1; // JS month starts with 0
    day = +(match[3]);
  
    if (!match[4]) { // no hour
      return new Date(Date.UTC(year, month, day));
    }
  
    // match: [4] hour [5] minute [6] second [7] fraction
  
    hour = +(match[4]);
    minute = +(match[5]);
    second = +(match[6]);
  
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) { // milli-seconds
        fraction += '0';
      }
      fraction = +fraction;
    }
  
    // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute
  
    if (match[9]) {
      tz_hour = +(match[10]);
      tz_minute = +(match[11] || 0);
      delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
      if (match[9] === '-') delta = -delta;
    }
  
    date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  
    if (delta) date.setTime(date.getTime() - delta);
  
    return date;
}
  
  
var timestamp = new Type_Function('tag:yaml.org,2002:timestamp', {
    kind: 'scalar',
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
});
  
function resolveYamlMerge(data) {
    return data === '<<' || data === null;
}
  
var merge = new Type_Function('tag:yaml.org,2002:merge', {
    kind: 'scalar',
    resolve: resolveYamlMerge
});
      
  
function resolveYamlBinary(data) {
    if (data === null) return false;
    var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;
    // Convert one by one.
    for (idx = 0; idx < max; idx++) {
        code = map.indexOf(data.charAt(idx));

        // Skip CR/LF
        if (code > 64) continue;
        // Fail on illegal characters
        if (code < 0) return false;
        bitlen += 6;
    }
  
    // If there are any bits left, source was corrupted
    return (bitlen % 8) === 0;
}
  
function constructYamlBinary(data) {
    var idx, tailbits,
      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
      max = input.length,
      map = BASE64_MAP,
      bits = 0,
      result = [];
  
    // Collect by 6*4 bits (3 bytes)
  
    for (idx = 0; idx < max; idx++) {
      if ((idx % 4 === 0) && idx) {
        result.push((bits >> 16) & 0xFF);
        result.push((bits >> 8) & 0xFF);
        result.push(bits & 0xFF);
      }
  
      bits = (bits << 6) | map.indexOf(input.charAt(idx));
    }
  
    // Dump tail
  
    tailbits = (max % 4) * 6;
  
    if (tailbits === 0) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(bits & 0xFF);
    } else if (tailbits === 18) {
      result.push((bits >> 10) & 0xFF);
      result.push((bits >> 2) & 0xFF);
    } else if (tailbits === 12) {
      result.push((bits >> 4) & 0xFF);
    }
  
    return new Uint8Array(result);
}
  
  
function isBinary(obj) {
    return Object.prototype.toString.call(obj) === '[object Uint8Array]';
}
  
var binary = new Type_Function('tag:yaml.org,2002:binary', {
    kind: 'scalar',
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
});
    
function resolveYamlOmap(data) {
    if (data === null) return true;
  
    var objectKeys = []; 
    var index, length, pair, pairKey, pairHasKey;
    var object = data;
  
    for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        pairHasKey = false;
  
        if (Object.prototype.toString.call(pair) !== '[object Object]') return false;
  
        for (pairKey in pair) {
            if (Object.prototype.hasOwnProperty.call(pair, pairKey)) {
            if (!pairHasKey) pairHasKey = true;
            else return false;
            }
        }
  
        if (!pairHasKey) return false;
  
        if (objectKeys.indexOf(pairKey) === -1) {
            objectKeys.push(pairKey);
        } else {
            return false;
        }
    }
  
    return true;
}
  
function constructYamlOmap(data) {
    return data !== null ? data : [];
}
  
var omap = new Type_Function('tag:yaml.org,2002:omap', {
    kind: 'sequence',
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
});
  
  
function resolveYamlPairs(data) {
    if (data === null) return true;
  
    var index, length, pair, keys, result;
    var object = data;
  
    result = new Array(object.length);
  
    for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        if (Object.prototype.toString.call(pair) !== '[object Object]') return false;
        keys = Object.keys(pair);
        if (keys.length !== 1) return false;
        result[index] = [keys[0], pair[keys[0]]];
    }
  
    return true;
}
  
function constructYamlPairs(data) {
    if (data === null) return [];
  
    var index, length, pair, keys, result,
      object = data;
  
    result = new Array(object.length);
  
    for (index = 0, length = object.length; index < length; index += 1) {
      pair = object[index];
  
      keys = Object.keys(pair);
  
      result[index] = [keys[0], pair[keys[0]]];
    }
  
    return result;
}
  
var pairs = new Type_Function('tag:yaml.org,2002:pairs', {
    kind: 'sequence',
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
});
  
  
function resolveYamlSet(data) {
    if (data === null) return true;
  
    var key, object = data;
  
    for (key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        if (object[key] !== null) return false;
      }
    }
  
    return true;
}
  
function constructYamlSet(data) {
    return data !== null ? data : {};
}
  
var set = new Type_Function('tag:yaml.org,2002:set', {
    kind: 'mapping',
    resolve: resolveYamlSet,
    construct: constructYamlSet
});
  
var _default = core.extend({
    implicit: [
      timestamp,
      merge
    ],
    explicit: [
      binary,
      omap,
      pairs,
      set
    ]
});
  
function _class(obj) { 
    return Object.prototype.toString.call(obj); 
}

  
function fromHexCode(c) {
    var lc;
  
    if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
      return c - 0x30;
    }
  
    lc = c | 0x20;
  
    if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
      return lc - 0x61 + 10;
    }
  
    return -1;
}
  
function escapedHexLen(c) {
    if (c === 0x78/* x */) { return 2; }
    if (c === 0x75/* u */) { return 4; }
    if (c === 0x55/* U */) { return 8; }
    return 0;
}
  
function fromDecimalCode(c) {
    if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
      return c - 0x30;
    }
    return -1;
}
  
function charFromCodepoint(c) {
    if (c <= 0xFFFF) {
      return String.fromCharCode(c);
    }
    // Encode UTF-16 surrogate pair
    // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
    return String.fromCharCode(
      ((c - 0x010000) >> 10) + 0xD800,
      ((c - 0x010000) & 0x03FF) + 0xDC00
    );
}
    
var directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
  
      var match, major, minor;
  
      if (state.version !== null) {
        console.error('duplication of %YAML directive', state);
      }
  
      if (args.length !== 1) {
        console.error('YAML directive accepts exactly one argument', state);
      }
  
      match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
  
      if (match === null) {
        console.error('ill-formed argument of the YAML directive', state);
      }
  
      major = parseInt(match[1], 10);
      minor = parseInt(match[2], 10);
  
      if (major !== 1) {
        console.error('unacceptable YAML version of the document', state);
      }
  
      state.version = args[0];
      state.checkLineBreaks = (minor < 2);
  
      if (minor !== 1 && minor !== 2) {
        console.warn( 'unsupported YAML version of the document', state);
      }
    },
  
    TAG: function handleTagDirective(state, name, args) {
  
      var handle, prefix;
  
      if (args.length !== 2) {
        console.error('TAG directive accepts exactly two arguments', state);
      }
  
      handle = args[0];
      prefix = args[1];
  
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        console.error('ill-formed tag handle (first argument) of the TAG directive', state);
      }
  
      if (_hasOwnProperty$1.call(state.tagMap, handle)) {
        console.error('there is a previously declared suffix for "' + handle + '" tag handle', state);
      }
  
      if (!PATTERN_TAG_URI.test(prefix)) {
        console.error('ill-formed tag prefix (second argument) of the TAG directive', state);
      }
  
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        console.error('tag prefix is malformed: ' + prefix, state);
      }
  
      state.tagMap[handle] = prefix;
    }
};
  
  
function captureSegment(state, start, end, checkJson) {
var _position, _length, _character, _result;

if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
    for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 0x09 ||
        (0x20 <= _character && _character <= 0x10FFFF))) {
        console.error('expected valid JSON character', state);
        }
    }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
    console.error('the stream contains non-printable characters', state);
    }

    state.result += _result;
}
}
  
function mergeMappings(state, destination, source, overridableKeys) {
    var sourceKeys, key, index, quantity;

    if (!source === null || typeof source !== "object") {
        console.error('cannot merge mappings; the provided source object is unacceptable', state);
    }

    sourceKeys = Object.keys(source);

    for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
        key = sourceKeys[index];

        if (!_hasOwnProperty$1.call(destination, key)) {
        destination[key] = source[key];
        overridableKeys[key] = true;
        }
    }
}
  
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode,
    startLine, startLineStart, startPos) {

    var index, quantity;

    // The output is a plain object here, so keys can only be strings.
    // We need to convert keyNode to a string, but doing so can hang the process
    // (deeply nested arrays that explode exponentially using aliases).
    if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);

        for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
            if (Array.isArray(keyNode[index])) {
                console.error('nested arrays are not supported inside keys', state);
            }

            if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
                keyNode[index] = '[object Object]';
            }
        }
    }

    // Avoid code execution in load() via toString property
    // (still use its own toString for arrays, timestamps,
    // and whatever user schema extensions happen to have @@toStringTag)
    if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
        keyNode = '[object Object]';
    }


    keyNode = String(keyNode);

    if (_result === null) {
        _result = {};
    }

    if (keyTag === 'tag:yaml.org,2002:merge') {
        if (Array.isArray(valueNode)) {
        for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
            mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
        } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
        }
    } else {
        if (!state.json &&
            !_hasOwnProperty$1.call(overridableKeys, keyNode) &&
            _hasOwnProperty$1.call(_result, keyNode)) {
            state.line = startLine || state.line;
            state.lineStart = startLineStart || state.lineStart;
            state.position = startPos || state.position;
            console.error('duplicated mapping key', state);
        }

        // used for this specific key only because Object.defineProperty is slow
        if (keyNode === '__proto__') {
        Object.defineProperty(_result, keyNode, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: valueNode
        });
        } else {
        _result[keyNode] = valueNode;
        }
        delete overridableKeys[keyNode];
    }

    return _result;
}
  

function testDocumentSeparator(state) {
    var _position = state.position,
      ch;
  
    ch = state.input.charCodeAt(_position);
  
    // Condition state.position === state.lineStart is tested
    // in parent on each call, for efficiency. No needs to test here again.
    if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
      ch === state.input.charCodeAt(_position + 1) &&
      ch === state.input.charCodeAt(_position + 2)) {
  
      _position += 3;
  
      ch = state.input.charCodeAt(_position);
  
      if (ch === 0 || WS_OR_EOL.includes(ch)) {
        return true;
      }
    }
  
    return false;
}
  
function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += ' ';
    } else if (count > 1) {
      state.result += '\n'.repeat(count - 1);
    }
}
  
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result,
      ch;
  
    ch = state.input.charCodeAt(state.position);
  
    if (WS_OR_EOL.includes(ch) ||
      FLOW_INDICATOR.includes(ch) ||
      ch === 0x23/* # */ ||
      ch === 0x26/* & */ ||
      ch === 0x2A/* * */ ||
      ch === 0x21/* ! */ ||
      ch === 0x7C/* | */ ||
      ch === 0x3E/* > */ ||
      ch === 0x27/* ' */ ||
      ch === 0x22/* " */ ||
      ch === 0x25/* % */ ||
      ch === 0x40/* @ */ ||
      ch === 0x60/* ` */) {
      return false;
    }
  
    if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
      following = state.input.charCodeAt(state.position + 1);
  
      if (WS_OR_EOL.includes(following) ||
        withinFlowCollection && FLOW_INDICATOR.includes(following)) {
        return false;
      }
    }
  
    state.kind = 'scalar';
    state.result = '';
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
  
    while (ch !== 0) {
      if (ch === 0x3A/* : */) {
        following = state.input.charCodeAt(state.position + 1);
  
        if (WS_OR_EOL.includes(following) ||
          withinFlowCollection && FLOW_INDICATOR.includes(following)) {
          break;
        }
  
      } else if (ch === 0x23/* # */) {
        preceding = state.input.charCodeAt(state.position - 1);
  
        if (WS_OR_EOL.includes(preceding)) {
          break;
        }
  
      } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
        withinFlowCollection && FLOW_INDICATOR.includes(ch)) {
        break;
  
      } else if (EOLS.includes(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
  
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
  
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
  
      if (!WHITE_SPACE.includes(ch)) {
        captureEnd = state.position + 1;
      }
  
      ch = state.input.charCodeAt(++state.position);
    }
  
    captureSegment(state, captureStart, captureEnd, false);
  
    if (state.result) {
      return true;
    }
  
    state.kind = _kind;
    state.result = _result;
    return false;
}
  
function readSingleQuotedScalar(state, nodeIndent) {
    var ch;
    var captureStart;
    var captureEnd;
  
    ch = state.input.charCodeAt(state.position);
  
    if (ch !== CHARS.SINGLE_QUOTE) {
      return false;
    }
  
    state.kind = 'scalar';
    state.result = '';
    state.position++;
    captureStart = captureEnd = state.position;
  
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === CHARS.SINGLE_QUOTE) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
  
        if (ch === CHARS.SINGLE_QUOTE) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
  
      } else if (EOLS.includes(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
  
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        console.error('unexpected end of the document within a single quoted scalar', state);
  
      } else {
        state.position++;
        captureEnd = state.position;
      }
    }
  
    console.error('unexpected end of the stream within a single quoted scalar', state);
}
  
function readDoubleQuotedScalar(state, nodeIndent) {
    var captureStart,
      captureEnd,
      hexLength,
      hexResult,
      tmp,
      ch;
  
    ch = state.input.charCodeAt(state.position);
  
    if (ch !== 0x22/* " */) {
      return false;
    }
  
    state.kind = 'scalar';
    state.result = '';
    state.position++;
    captureStart = captureEnd = state.position;
  
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 0x22/* " */) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
  
      } else if (ch === 0x5C/* \ */) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
  
        if (EOLS.includes(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
  
          // TODO: rework to inline fn with no type cast?
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
  
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          hexLength = tmp;
          hexResult = 0;
  
          for (; hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
  
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
  
            } else {
                console.error('expected hexadecimal character', state);
            }
          }
  
          state.result += charFromCodepoint(hexResult);
  
          state.position++;
  
        } else {
            console.error('unknown escape sequence', state);
        }
  
        captureStart = captureEnd = state.position;
  
      } else if (EOLS.includes(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
  
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        console.error('unexpected end of the document within a double quoted scalar', state);
  
      } else {
        state.position++;
        captureEnd = state.position;
      }
    }
  
    console.error('unexpected end of the stream within a double quoted scalar', state);
}
  
function readFlowCollection(state, nodeIndent) {
    var readNext = true,
      _line,
      _lineStart,
      _pos,
      _tag = state.tag,
      _result,
      _anchor = state.anchor,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      overridableKeys = Object.create(null),
      keyNode,
      keyTag,
      valueNode,
      ch;
  
    ch = state.input.charCodeAt(state.position);
  
    if (ch === 0x5B/* [ */) {
      terminator = 0x5D;/* ] */
      isMapping = false;
      _result = [];
    } else if (ch === 0x7B/* { */) {
      terminator = 0x7D;/* } */
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
  
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
  
    ch = state.input.charCodeAt(++state.position);
  
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
  
      ch = state.input.charCodeAt(state.position);
  
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? 'mapping' : 'sequence';
        state.result = _result;
        return true;
      } else if (!readNext) {
        console.error('missed comma between flow collection entries', state);
      } else if (ch === 0x2C/* , */) {
        // "flow collection entries can never be completely empty", as per YAML 1.2, section 7.4
        console.error("expected the node content, but found ','", state);
      }
  
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
  
      if (ch === 0x3F/* ? */) {
        following = state.input.charCodeAt(state.position + 1);
  
        if (WS_OR_EOL.includes(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
  
      _line = state.line; // Save the current line.
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
  
      ch = state.input.charCodeAt(state.position);
  
      if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
  
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
  
      skipSeparationSpace(state, true, nodeIndent);
  
      ch = state.input.charCodeAt(state.position);
  
      if (ch === 0x2C/* , */) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
  
    console.error('unexpected end of the stream within a flow collection', state);
}
  
function readBlockScalar(state, nodeIndent) {
    var captureStart,
      folding,
      chomping = CHOMPING_CLIP,
      didReadContent = false,
      detectedIndent = false,
      textIndent = nodeIndent,
      emptyLines = 0,
      atMoreIndented = false,
      tmp,
      ch;
  
    ch = state.input.charCodeAt(state.position);
  
    if (ch === 0x7C/* | */) {
      folding = false;
    } else if (ch === 0x3E/* > */) {
      folding = true;
    } else {
      return false;
    }
  
    state.kind = 'scalar';
    state.result = '';
  
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
  
      if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
        if (CHOMPING_CLIP === chomping) {
          chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          console.error('repeat of a chomping mode identifier', state);
        }
  
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          console.error('bad explicit indentation width of a block scalar; it cannot be less than one', state);
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          console.error('repeat of an indentation width identifier', state);
        }
  
      } else {
        break;
      }
    }
  
    if (WHITE_SPACE.includes(ch)) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (WHITE_SPACE.includes(ch));
  
      if (ch === 0x23/* # */) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (!EOLS.includes(ch) && (ch !== 0));
      }
    }
  
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
  
      ch = state.input.charCodeAt(state.position);
  
      while ((!detectedIndent || state.lineIndent < textIndent) &&
        (ch === 0x20/* Space */)) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
  
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
  
      if (EOLS.includes(ch)) {
        emptyLines++;
        continue;
      }
  
      // End of the scalar.
      if (state.lineIndent < textIndent) {
  
        // Perform the chomping.
        if (chomping === CHOMPING_KEEP) {
          state.result += '\n'.repeat(didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) { // i.e. only if the scalar is not empty.
            state.result += '\n';
          }
        }
  
        // Break this `while` cycle and go to the funciton's epilogue.
        break;
      }
  
      // Folded style: use fancy rules to handle line breaks.
      if (folding) {
  
        // Lines starting with white space characters (more-indented lines) are not folded.
        if (WHITE_SPACE.includes(ch)) {
          atMoreIndented = true;
          // except for the first content line (cf. Example 8.1)
          state.result += '\n'.repeat(didReadContent ? 1 + emptyLines : emptyLines);
  
          // End of more-indented block.
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += '\n'.repeat(emptyLines + 1);
  
          // Just one line break - perceive as the same line.
        } else if (emptyLines === 0) {
          if (didReadContent) { // i.e. only if we have already read some scalar content.
            state.result += ' ';
          }
  
          // Several line breaks - perceive as different lines.
        } else {
          state.result += '\n'.repeat(emptyLines);
        }
  
        // Literal style: just add exact number of line breaks between content lines.
      } else {
        // Keep all line breaks except the header line break.
        state.result += '\n'.repeat(didReadContent ? 1 + emptyLines : emptyLines);
      }
  
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      captureStart = state.position;
  
      while (!EOLS.includes(ch) && (ch !== 0)) {
        ch = state.input.charCodeAt(++state.position);
      }
  
      captureSegment(state, captureStart, state.position, false);
    }
  
    return true;
}
  
function readBlockSequence(state, nodeIndent) {
    var _line,
      _tag = state.tag,
      _anchor = state.anchor,
      _result = [],
      following,
      detected = false,
      ch;
  
    // there is a leading tab before this token, so it can't be a block sequence/mapping;
    // it can still be flow sequence/mapping or a scalar
    if (state.firstTabInLine !== -1) return false;
  
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
  
    ch = state.input.charCodeAt(state.position);
  
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        console.error('tab characters must not be used in indentation', state);
      }
  
      if (ch !== 0x2D/* - */) {
        break;
      }
  
      following = state.input.charCodeAt(state.position + 1);
  
      if (!WS_OR_EOL.includes(following)) {
        break;
      }
  
      detected = true;
      state.position++;
  
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
  
      _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
  
      ch = state.input.charCodeAt(state.position);
  
      if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
        console.error('bad indentation of a sequence entry', state);
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
  
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = 'sequence';
      state.result = _result;
      return true;
    }
    return false;
}
  
function readBlockMapping(state, nodeIndent, flowIndent) {
    var following,
      allowCompact,
      _line,
      _keyLine,
      _keyLineStart,
      _keyPos,
      _tag = state.tag,
      _anchor = state.anchor,
      _result = {},
      overridableKeys = Object.create(null),
      keyTag = null,
      keyNode = null,
      valueNode = null,
      atExplicitKey = false,
      detected = false,
      ch;
  
    // there is a leading tab before this token, so it can't be a block sequence/mapping;
    // it can still be flow sequence/mapping or a scalar
    if (state.firstTabInLine !== -1) return false;
  
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
  
    ch = state.input.charCodeAt(state.position);
  
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        console.error('tab characters must not be used in indentation', state);
      }
  
      following = state.input.charCodeAt(state.position + 1);
      _line = state.line; // Save the current line.
  
      //
      // Explicit notation case. There are two separate blocks:
      // first for the key (denoted by "?") and second for the value (denoted by ":")
      //
      if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && WS_OR_EOL.includes(following)) {
  
        if (ch === 0x3F/* ? */) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
  
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
  
        } else if (atExplicitKey) {
          // i.e. 0x3A/* : */ === character after the explicit key.
          atExplicitKey = false;
          allowCompact = true;
  
        } else {
          console.error('incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line', state);
        }
  
        state.position += 1;
        ch = following;
  
        //
        // Implicit notation case. Flow-style node as the key first, then ":", and the value.
        //
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
  
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          // Neither implicit nor explicit notation.
          // Reading is done. Go to the epilogue.
          break;
        }
  
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
  
          while (WHITE_SPACE.includes(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
  
          if (ch === 0x3A/* : */) {
            ch = state.input.charCodeAt(++state.position);
  
            if (!WS_OR_EOL.includes(ch)) {
              console.error('a whitespace character is expected after the key-value separator within a block mapping', state);
            }
  
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
  
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
  
          } else if (detected) {
            console.error('can not read an implicit mapping pair; a colon is missed', state);
  
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true; // Keep the result of `composeNode`.
          }
  
        } else if (detected) {
          console.error('can not read a block mapping entry; a multiline key may not be an implicit key', state);
  
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }
      }
  
      //
      // Common reading code for both explicit and implicit notations.
      //
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
  
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
  
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
  
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
  
      if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
        console.error('bad indentation of a mapping entry', state);
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
  
    //
    // Epilogue.
    //
  
    // Special case: last mapping's node contains only the key in explicit notation.
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
  
    // Expose the resulting mapping.
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = 'mapping';
      state.result = _result;
    }
  
    return detected;
}
  
function readTagProperty(state) {
    var _position,
      isVerbatim = false,
      isNamed = false,
      tagHandle,
      tagName,
      ch;
  
    ch = state.input.charCodeAt(state.position);
  
    if (ch !== 0x21/* ! */) return false;
  
    if (state.tag !== null) {
      console.error('duplication of a tag property', state);
    }
  
    ch = state.input.charCodeAt(++state.position);
  
    if (ch === 0x3C/* < */) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
  
    } else if (ch === 0x21/* ! */) {
      isNamed = true;
      tagHandle = '!!';
      ch = state.input.charCodeAt(++state.position);
  
    } else {
      tagHandle = '!';
    }
  
    _position = state.position;
  
    if (isVerbatim) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (ch !== 0 && ch !== 0x3E/* > */);
  
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        console.error('unexpected end of the stream within a verbatim tag', state);
      }
    } else {
      while (ch !== 0 && !WS_OR_EOL.includes(ch)) {
  
        if (ch === 0x21/* ! */) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
  
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              console.error('named tag handle cannot contain such characters', state);
            }
  
            isNamed = true;
            _position = state.position + 1;
          } else {
            console.error('tag suffix cannot contain exclamation marks', state);
          }
        }
  
        ch = state.input.charCodeAt(++state.position);
      }
  
      tagName = state.input.slice(_position, state.position);
  
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        console.error('tag suffix cannot contain flow indicator characters', state);
      }
    }
  
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      console.error('tag name cannot contain such characters: ' + tagName, state);
    }
  
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      console.error('tag name is malformed: ' + tagName, state);
    }
  
    if (isVerbatim) {
      state.tag = tagName;
  
    } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
  
    } else if (tagHandle === '!') {
      state.tag = '!' + tagName;
  
    } else if (tagHandle === '!!') {
      state.tag = 'tag:yaml.org,2002:' + tagName;
  
    } else {
      console.error('undeclared tag handle "' + tagHandle + '"', state);
    }
  
    return true;
}
  
function readAnchorProperty(state) {
    var _position,
      ch;
  
    ch = state.input.charCodeAt(state.position);
  
    if (ch !== 0x26/* & */) return false;
  
    if (state.anchor !== null) {
      console.error('duplication of an anchor property', state);
    }
  
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
  
    while (ch !== 0 && !WS_OR_EOL.includes(ch) && !FLOW_INDICATOR.includes(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
  
    if (state.position === _position) {
      console.error('name of an anchor node must contain at least one character', state);
    }
  
    state.anchor = state.input.slice(_position, state.position);
    return true;
}
  
function readAlias(state) {
    var _position, alias,
      ch;
  
    ch = state.input.charCodeAt(state.position);
  
    if (ch !== 0x2A/* * */) return false;
  
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
  
    while (ch !== 0 && !WS_OR_EOL.includes(ch) && !FLOW_INDICATOR.includes(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
  
    if (state.position === _position) {
      console.error('name of an alias node must contain at least one character', state);
    }
  
    alias = state.input.slice(_position, state.position);
  
    if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
      console.error('unidentified alias "' + alias + '"', state);
    }
  
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
}
  
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
      atNewLine = false,
      hasContent = false,
      typeIndex,
      typeQuantity,
      typeList,
      type,
      flowIndent,
      blockIndent;
  
    if (state.listener !== null) {
      state.listener('open', state);
    }
  
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
  
    allowBlockStyles = allowBlockScalars = allowBlockCollections =
      CONTEXT_BLOCK_OUT === nodeContext ||
      CONTEXT_BLOCK_IN === nodeContext;
  
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
  
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
  
    if (indentStatus === 1) {
      while (readTagProperty(state) || readAnchorProperty(state)) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
  
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
  
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
  
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
  
      blockIndent = state.position - state.lineStart;
  
      if (indentStatus === 1) {
        if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
            readBlockMapping(state, blockIndent, flowIndent)) ||
          readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
  
          } else if (readAlias(state)) {
            hasContent = true;
  
            if (state.tag !== null || state.anchor !== null) {
              console.error('alias node should not have any properties', state);
            }
  
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
  
            if (state.tag === null) {
              state.tag = '?';
            }
          }
  
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      } else if (indentStatus === 0) {
        // Special case: block sequences are allowed to have same indentation level as the parent.
        // http://www.yaml.org/spec/1.2/spec.html#id2799784
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
  
    if (state.tag === null) {
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
  
    } else if (state.tag === '?') {
      // Implicit resolving is not allowed for non-scalar types, and '?'
      // non-specific tag is only automatically assigned to plain scalars.
      //
      // We only need to check kind conformity in case user explicitly assigns '?'
      // tag, for example like this: "!<?> [0]"
      //
      if (state.result !== null && state.kind !== 'scalar') {
        console.error('unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"', state);
      }
  
      for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
        type = state.implicitTypes[typeIndex];
  
        if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
          state.result = type.construct(state.result);
          state.tag = type.tag;
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
          break;
        }
      }
    } else if (state.tag !== '!') {
      if (_hasOwnProperty$1.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
        type = state.typeMap[state.kind || 'fallback'][state.tag];
      } else {
        // looking for multi type
        type = null;
        typeList = state.typeMap.multi[state.kind || 'fallback'];
  
        for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type = typeList[typeIndex];
            break;
          }
        }
      }
  
      if (!type) {
        console.error('unknown tag !<' + state.tag + '>', state);
      }
  
      if (state.result !== null && type.kind !== state.kind) {
        console.error('unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"', state);
      }
  
      if (!type.resolve(state.result, state.tag)) { // `state.result` updated in resolver if matched
        console.error('cannot resolve a node with !<' + state.tag + '> explicit tag');
      } else {
        state.result = type.construct(state.result, state.tag);
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    }
  
    if (state.listener !== null) {
      state.listener('close', state);
    }
    return state.tag !== null || state.anchor !== null || hasContent;
}

///items below are needed:
function skipSeparationSpace(state, allowComments, checkIndent) {
    var lineBreaks = 0,
      ch = state.input.charCodeAt(state.position);
  
    while (ch !== 0) {
      while (WHITE_SPACE.includes(ch)) {
        if (ch === 0x09/* Tab */ && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
  
      if (allowComments && ch === 0x23/* # */) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
      }
  
      if (EOLS.includes(ch)) {
        readLineBreak(state);
  
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
  
        while (ch === 0x20/* Space */) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
  
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      console.warn('deficient indentation', state);
    }
  
    return lineBreaks;
}

function readLineBreak(state) {
    var ch;
  
    ch = state.input.charCodeAt(state.position);
  
    if (ch === 0x0A/* LF */) {
      state.position++;
    } else if (ch === 0x0D/* CR */) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
        state.position++;
      }
    } else {
      console.error('a line break is expected', state);
    }
  
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
}

const _hasOwnProperty$1 = Object.prototype.hasOwnProperty;

export default class NanoYaml {

    static async FromUrl(url ) {
        const response = await fetch(url);
        const input = await response.text();
        var documents = this.loadDocuments(input);
        return documents;
    }

    static newState(input) {
        return {
            input: input,
            schema: _default,
            implicitTypes: _default.compiledImplicit,
            typeMap: _default.compiledTypeMap,
            length: input.length,
            position: 0,
            line: 0,
            lineStart: 0,
            lineIndent: 0,
            firstTabInLine: -1,
            documents: [],
            listener: null
        };
    }

    static loadDocuments(input) {
        input = "" + input;
      
        if (input.length > 0) {
            input = input.split("\r\n").join ("\n");
            input += '\n';
            if (input.charCodeAt(0) === 0xFEFF) {
                input = input.slice(1);  //remove BOM
            }
        }
      
        const state = this.newState(input);
      
        var nullpos = input.indexOf('\0');
      
        if (nullpos !== -1) {
          state.position = nullpos;
          console.error('null byte is not allowed in input', state);
        }
      
        // Use 0 as string terminator. That significantly simplifies bounds check.
        state.input += '\n\0';
      
        while (state.input.charCodeAt(state.position) === CHARS.SPACE) {
          state.lineIndent += 1;
          state.position += 1;
        }
      
        while (state.position < (state.length - 1)) {
            this.readDocument(state);
        }
      
        return state.documents;
      }

    static readDocument(state) {
        let documentStart = state.position;
        let hasDirectives = false;
        let _position;
        let directiveName;
        let directiveArgs;
        let ch;
      
        state.version = null;
        state.checkLineBreaks = state.legacy;
        state.tagMap = {};
        state.anchorMap = {};
      
        while ((ch = state.input.charCodeAt(state.position)) !== 0) {
            skipSeparationSpace(state, true, -1);
            ch = state.input.charCodeAt(state.position);
            if (state.lineIndent > 0 || ch !== CHARS.PERCENT) {
                break;
            }
      
            hasDirectives = true;
            ch = state.input.charCodeAt(++state.position);
            _position = state.position;
      
            while (ch !== 0 && !WS_OR_EOL.includes(ch)) {
                ch = state.input.charCodeAt(++state.position);
            }
      
            directiveName = state.input.slice(_position, state.position);
            directiveArgs = [];
      
            if (directiveName.length < 1) {
                console.error('directive name must not be less than one character in length', state);
            }
      
            while (ch !== 0) {
                while (WHITE_SPACE.includes(ch)) {
                    ch = state.input.charCodeAt(++state.position);
                }
      
                if (ch === CHARS.HASH) {
                    do { 
                        ch = state.input.charCodeAt(++state.position); 
                    } while (ch !== 0 && !EOLS.includes(ch));
                    break;
                }
      
                if (EOLS.includes(ch)) {
                    break;
                }
      
                _position = state.position;
      
                while (ch !== 0 && !WS_OR_EOL.includes(ch)) {
                    ch = state.input.charCodeAt(++state.position);
                }
      
                directiveArgs.push(state.input.slice(_position, state.position));
            }
      
            if (ch !== 0) {
                readLineBreak(state);
            }
      
            if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
                directiveHandlers[directiveName](state, directiveName, directiveArgs);
            } else {
                console.warn('unknown document directive "' + directiveName + '"', state);
            }
        }
      
        skipSeparationSpace(state, true, -1);
      
        if (state.lineIndent === 0 &&
            state.input.charCodeAt(state.position) === 0x2D/* - */ &&
            state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
            state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
            state.position += 3;
            skipSeparationSpace(state, true, -1);
        } else if (hasDirectives) {
            console.error('directives end mark is expected', state);
        }
      
        composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
        skipSeparationSpace(state, true, -1);
      
        if (state.checkLineBreaks &&
            PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
            console.warn('non-ASCII line breaks are interpreted as content', state);
        }
      
        state.documents.push(state.result);
      
        if (state.position === state.lineStart && testDocumentSeparator(state)) {
            if (state.input.charCodeAt(state.position) === CHARS.PERIOD) {
                state.position += 3;
                skipSeparationSpace(state, true, -1);
            }
            return;
        }
      
        if (state.position < (state.length - 1)) {
            console.err('end of the stream or a document separator is expected', state);
        } else {
            return;
        }
    }        
}


