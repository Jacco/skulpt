var $builtinmodule = function (name) {
    "use strict";

    var mod = {};

    var MAXREPEAT = 2147483648;

    var FAILURE = "failure";
    var SUCCESS = "success";
    var ANY = "any";
    var ANY_ALL = "any_all";
    var ASSERT = "assert";
    var ASSERT_NOT = "assert_not";
    var AT = "at";
    var BIGCHARSET = "bigcharset";
    var BRANCH = "branch";
    var CALL = "call";
    var CATEGORY = "category";
    var CHARSET = "charset";
    var GROUPREF = "groupref";
    var GROUPREF_IGNORE = "groupref_ignore";
    var GROUPREF_EXISTS = "groupref_exists";
    var IN = "in";
    var IN_IGNORE = "in_ignore";
    var INFO = "info";
    var JUMP = "jump";
    var LITERAL = "literal";
    var LITERAL_IGNORE = "literal_ignore";
    var MARK = "mark";
    var MAX_REPEAT = "max_repeat";
    var MAX_UNTIL = "max_until";
    var MIN_REPEAT = "min_repeat";
    var MIN_UNTIL = "min_until";
    var NEGATE = "negate";
    var NOT_LITERAL = "not_literal";
    var NOT_LITERAL_IGNORE = "not_literal_ignore";
    var RANGE = "range";
    var REPEAT = "repeat";
    var REPEAT_ONE = "repeat_one";
    var SUBPATTERN = "subpattern";
    var MIN_REPEAT_ONE = "min_repeat_one";

    var OPCODES_ = [
        FAILURE, SUCCESS, ANY, ANY_ALL, ASSERT, ASSERT_NOT, AT, BRANCH, CALL, CATEGORY, CHARSET, 
        BIGCHARSET, GROUPREF, GROUPREF_EXISTS, GROUPREF_IGNORE, IN, IN_IGNORE, INFO, JUMP, LITERAL, LITERAL_IGNORE,
        MARK, MAX_UNTIL, MIN_UNTIL, NOT_LITERAL, NOT_LITERAL_IGNORE, NEGATE, RANGE, REPEAT, REPEAT_ONE, SUBPATTERN, 
        MIN_REPEAT_ONE
    ];

    // positions
    var AT_BEGINNING = "at_beginning";
    var AT_BEGINNING_LINE = "at_beginning_line";
    var AT_BEGINNING_STRING = "at_beginning_string";
    var AT_BOUNDARY = "at_boundary";
    var AT_NON_BOUNDARY = "at_non_boundary";
    var AT_END = "at_end";
    var AT_END_LINE = "at_end_line";
    var AT_END_STRING = "at_end_string";
    var AT_LOC_BOUNDARY = "at_loc_boundary";
    var AT_LOC_NON_BOUNDARY = "at_loc_non_boundary";
    var AT_UNI_BOUNDARY = "at_uni_boundary";
    var AT_UNI_NON_BOUNDARY = "at_uni_non_boundary";

    // categories
    var CATEGORY_DIGIT = "category_digit";
    var CATEGORY_NOT_DIGIT = "category_not_digit";
    var CATEGORY_SPACE = "category_space";
    var CATEGORY_NOT_SPACE = "category_not_space";
    var CATEGORY_WORD = "category_word";
    var CATEGORY_NOT_WORD = "category_not_word";
    var CATEGORY_LINEBREAK = "category_linebreak";
    var CATEGORY_NOT_LINEBREAK = "category_not_linebreak";
    var CATEGORY_LOC_WORD = "category_loc_word";
    var CATEGORY_LOC_NOT_WORD = "category_loc_not_word";
    var CATEGORY_UNI_DIGIT = "category_uni_digit";
    var CATEGORY_UNI_NOT_DIGIT = "category_uni_not_digit";
    var CATEGORY_UNI_SPACE = "category_uni_space";
    var CATEGORY_UNI_NOT_SPACE = "category_uni_not_space";
    var CATEGORY_UNI_WORD = "category_uni_word";
    var CATEGORY_UNI_NOT_WORD = "category_uni_not_word";
    var CATEGORY_UNI_LINEBREAK = "category_uni_linebreak";
    var CATEGORY_UNI_NOT_LINEBREAK = "category_uni_not_linebreak";

    var ATCODES_ = [
        AT_BEGINNING, AT_BEGINNING_LINE, AT_BEGINNING_STRING, AT_BOUNDARY,
        AT_NON_BOUNDARY, AT_END, AT_END_LINE, AT_END_STRING,
        AT_LOC_BOUNDARY, AT_LOC_NON_BOUNDARY, AT_UNI_BOUNDARY,
        AT_UNI_NON_BOUNDARY
    ];

    var CHCODES_ = [
        CATEGORY_DIGIT, CATEGORY_NOT_DIGIT, CATEGORY_SPACE, CATEGORY_NOT_SPACE, CATEGORY_WORD, 
        CATEGORY_NOT_WORD, CATEGORY_LINEBREAK, CATEGORY_NOT_LINEBREAK, CATEGORY_LOC_WORD, CATEGORY_LOC_NOT_WORD, 
        CATEGORY_UNI_DIGIT, CATEGORY_UNI_NOT_DIGIT, CATEGORY_UNI_SPACE, CATEGORY_UNI_NOT_SPACE, CATEGORY_UNI_WORD,
        CATEGORY_UNI_NOT_WORD, CATEGORY_UNI_LINEBREAK, CATEGORY_UNI_NOT_LINEBREAK
    ];

    function makedict(list) {
        var d = {};
        var i = 0;
        for (var item in list) {
            d[list[i]] = i;
            i = i + 1;
        }
        return d;
    }

    var OPCODES = makedict(OPCODES_);
    var ATCODES = makedict(ATCODES_);
    var CHCODES = makedict(CHCODES_);

    // flags
    var SRE_FLAG_TEMPLATE = 1; // template mode (disable backtracking)
    var SRE_FLAG_IGNORECASE = 2; // case insensitive
    var SRE_FLAG_LOCALE = 4; // honour system locale
    var SRE_FLAG_MULTILINE = 8; // treat target as multiline string
    var SRE_FLAG_DOTALL = 16; // treat target as a single string
    var SRE_FLAG_UNICODE = 32; // use unicode "locale"
    var SRE_FLAG_VERBOSE = 64; // ignore whitespace and comments
    var SRE_FLAG_DEBUG = 128; // debugging
    var SRE_FLAG_ASCII = 256; // use ascii "locale"

    // flags for INFO primitive
    var SRE_INFO_PREFIX = 1; // has prefix
    var SRE_INFO_LITERAL = 2; // entire pattern is literal (given by prefix)
    var SRE_INFO_CHARSET = 4; // pattern starts with character from given set

    // Above part belongs in sre_constants but is needed here too!

    function _is_linebreak(c) {
        return c =="\n";
    }

    var ctxid = 0;

    class _Context
    {
        constructor(state, pattern_codes)
        {
            this.id = ctxid++;
            this.state = state;
            this.pattern_codes = pattern_codes;
            this.code_position = 0;
            this.new_context_class = this.constructor;
        }
        push_new_context(pattern_offset, pattern_length)
        {
            if (pattern_length) {
                pattern_length = this.code_position + pattern_offset + pattern_length;
            }
            var child_context = new this.new_context_class(this.state, this.pattern_codes.slice(this.code_position + pattern_offset, pattern_length));
            this.state.context_stack.push(child_context);
            return child_context;
        }
        remaining_codes() {
            return this.pattern_codes.length - this.code_position;
        }
        peek_code(peek) {
            return this.pattern_codes[this.code_position + (peek | 0)];
        }
        skip_code(skip_count) {
            this.code_position += skip_count;
        }
    }

    class _MatchContext extends _Context
    {
        constructor(state, pattern_codes)
        {
            super(state, pattern_codes);
            this.string_position = state.string_position;
            this.has_matched = undefined;
        }
        at_end() {
            return this.string_position == this.state.end;
        }
        skip_char(skip_count) {
            this.string_position += skip_count;
        }
        at_linebreak() {
            return !this.at_end() && _is_linebreak(this.peek_char());
        }
        peek_char(peek) {
            return this.state.string[this.string_position + (peek | 0)];
        }
        remaining_chars() {
            return this.state.end - this.string_position;
        }
        at_beginning() {
            return this.string_position == 0;
        }
        at_boundary(word_checker) {
            if (this.at_beginning() && this.at_end()) {
                return false;
            }
            var that_ = !this.at_beginning() && word_checker(self.peek_char(-1));
            var this_ = !this.at_end() && word_checker(this.peek_char());
            return this_ != that_;
        }
    }

    class _ValidateContext extends _Context
    {
        constructor(state, pattern_codes)
        {
            super(state, pattern_codes);
            this.is_valid = true;
        }
        get_skip_adj(adj)
        {
            if (this.remaining_codes() == 0) {
                throw "codes finished";
            }
            var skip = this.peek_code();
            if (skip - adj > this.remaining_codes()) {
                throw "skip outside code";
            }
            this.code_position++;
            return skip;
        }
        get_skip()
        {
            return this.get_skip_adj(0);
        }
        get_op()
        {
            if (this.remaining_codes() == 0) {
                throw "codes finished";
            }
            var op = this.peek_code();
            this.code_position++;
            return op;
        }
        get_arg()
        {
            if (this.remaining_codes() == 0) {
                throw "codes finished";
            }   
            var arg = this.peek_code();
            this.code_position++;
            return arg;
        }
    } 

    class _RepeatContext extends _MatchContext {
        constructor(context) {
            super(context.state, context.pattern_codes.slice(context.code_position));
            this.count = -1;
            this.previous = context.state.repeat;
            this.last_position = undefined;
            this.new_context_class = _MatchContext;
        }
    }

    var operator = {
        eq: function(x, y) { return x == y; }
    }

    class _Dispatcher {
        constructor() {
            
        }
        dispatch(code, context) {
            var method = this.constructor.DISPATCH_TABLE[code] || this.constructor.prototype.unknown;
            return method.call(this, context);
        }
        unknown(ctx) {
            throw "unknown not inplemented in dispatcher " + this.constructor.name + " code " + ctx.peek_code();
        }

        static build_dispatch_table(code_dict, method_prefix) {
            if (this.DISPATCH_TABLE) {
                return;
            }
            var table = [];
            for(var k in code_dict) {
                if (this.prototype[method_prefix + k]) {
                    table[code_dict[k]] = this.prototype[method_prefix + k];
                }
            }
            this.DISPATCH_TABLE = table;
        }
    }

    class _AtcodeDispatcher extends _Dispatcher {
        constructor() {
            super();
        }
        at_beginning(ctx) {
            return ctx.at_beginning();
        }
        at_beginning_string(ctx) {
            return this.at_beginning(ctx);
        }
        at_beginning_line(ctx) {
            return ctx.at_beginning() || _is_linebreak(ctx.peek_char(-1));
        }
        at_end(ctx) {
            return (ctx.remaining_chars() == 1 && ctx.at_linebreak()) || ctx.at_end();
        }
        at_end_line(ctx) {
            return ctx.at_linebreak() || ctx.at_end();
        }
        at_end_string(ctx) {
            return ctx.at_end();
        }
        at_boundary(ctx) {
            return ctx.at_boundary(_is_word);
        }
        at_non_boundary(ctx) {
            return !ctx.at_boundary(_is_word);
        }
        at_loc_boundary(ctx) {
            return ctx.at_boundary(_is_loc_word);
        }
        at_loc_non_boundary(ctx) {
            return !ctx.at_boundary(_is_loc_word);
        }
        at_uni_boundary(ctx) {
            return ctx.at_boundary(_is_uni_word);
        }
        at_uni_non_boundary(ctx) {
            return !ctx.at_boundary(_is_uni_word);
        }
        unknown(ctx) {
            return false;
        }
    }
    _AtcodeDispatcher.build_dispatch_table(ATCODES, "");

    class _ChcodeDispatcher extends _Dispatcher {
        category_digit(ctx) {
            return _is_digit(ctx.peek_char());
        }
        category_not_digit(ctx) {
            return !_is_digit(ctx.peek_char());
        }
        category_space(ctx) {
            return _is_space(ctx.peek_char());
        }
        category_not_space(ctx) {
            return !_is_space(ctx.peek_char());
        }
        category_word(ctx) {
            return _is_word(ctx.peek_char());
        }
        category_not_word(ctx) {
            return !_is_word(ctx.peek_char());
        }
        category_linebreak(ctx) {
            return _is_linebreak(ctx.peek_char());
        }
        category_not_linebreak(ctx) {
            return !_is_linebreak(ctx.peek_char());
        }
        category_loc_word(ctx) {
            return _is_loc_word(ctx.peek_char());
        }
        category_loc_not_word(ctx) {
            return !_is_loc_word(ctx.peek_char());
        }
        category_uni_digit(ctx) {
            return ctx.peek_char().isdigit();
        }
        category_uni_not_digit(ctx) {
            return !ctx.peek_char().isdigit();
        }
        category_uni_space(ctx) {
            return ctx.peek_char().isspace();
        }
        category_uni_not_space(ctx) {
            return !ctx.peek_char().isspace();
        }
        category_uni_word(ctx) {
            return _is_uni_word(ctx.peek_char());
        }
        category_uni_not_word(ctx) {
            return !_is_uni_word(ctx.peek_char());
        }
        category_uni_linebreak(ctx) {
            return ctx.peek_char().charCodeAt(0) in _uni_linebreaks;
        }
        category_uni_not_linebreak(ctx) {
            return !(ctx.peek_char().charCodeAt(0) in _uni_linebreaks);
        }
        unknown(ctx) {
            return false;
        }
    }

    _ChcodeDispatcher.build_dispatch_table(CHCODES, "");

    class _OpcodeDispatcher extends _Dispatcher
    {
        constructor() {
            super();
            this.executing_contexts = [];
            this.at_dispatcher = new _AtcodeDispatcher();
            this.set_dispatcher = new _CharsetDispatcher();
        }

        match(context) {
            while (context.remaining_codes() > 0 && typeof context.has_matched === "undefined") {
                var opcode = context.peek_code();
                if (!this.dispatch(opcode, context)) {
                    return undefined;
                }
            }
            if (typeof context.has_matched === "undefined") {
                context.has_matched = false;
            }
            return context.has_matched;
        }
        dispatch(opcode, context) {
            var has_finished;
            var generator = this.executing_contexts[context.id];
            if (generator) {
                delete this.executing_contexts[context.id];
                has_finished = generator.next();
            } else {
                var method = this.constructor.DISPATCH_TABLE[opcode] || this.constructor.prototype.unknown;
                has_finished = method.call(this, context);
                if (typeof has_finished.next !== "undefined") {
                    generator = has_finished;
                    has_finished = generator.next();
                }
            }
            if (typeof has_finished.done !== "undefined") {
                if (!has_finished.done && !has_finished.value) {
                    this.executing_contexts[context.id] = generator;
                    has_finished = has_finished.value;
                } else {
                    has_finished = true;
                }
            }
            return has_finished;
        }
        op_success(ctx) {
            ctx.state.string_position = ctx.string_position;
            ctx.has_matched = true;
            return true;
        }
        op_jump(ctx) {
            this._log(ctx, "JUMP", ctx.peek_code(1)); // <JUMP> <offset>
            ctx.skip_code(ctx.peek_code(1) + 1);
            return true;
        }
        op_mark(ctx) {
            this._log(ctx, "OP_MARK", ctx.peek_code(1)); // <MARK> <gid>
            ctx.state.set_mark(ctx.peek_code(1), ctx.string_position);
            ctx.skip_code(2);
            return true;
        }
        op_any(ctx) {
            this._log(ctx, "ANY"); // <ANY>
            if (ctx.at_end() || ctx.at_linebreak()) {
                ctx.has_matched = false;
                return true;
            }
            ctx.skip_code(1);
            ctx.skip_char(1);
            return true;
        }
        general_op_literal(ctx, compare, decorate) {
            if (!decorate) {
                decorate = function(x) { return x; };
            }
            if (ctx.at_end() || !compare(decorate(ctx.peek_char().charCodeAt(0)), decorate(ctx.peek_code(1)))) {
                ctx.has_matched = false;
            }
            ctx.skip_code(2);
            ctx.skip_char(1);
        }
        general_op_in(ctx, decorate) {
            this._log(ctx, "OP_IN");
            if (!decorate) {
                decorate = function(x) { return x; };
            }
            if (ctx.at_end()) {
                ctx.has_matched = false;
                return;
            }
            var skip = ctx.peek_code(1);
            ctx.skip_code(2); // set op pointer to the set code
            if (!this.check_charset(ctx, decorate(ctx.peek_char().charCodeAt(0)))) {
                ctx.has_matched = false;
                return;
            }
            ctx.skip_code(skip - 1);
            ctx.skip_char(1);
        }
        op_in(ctx) {
            // <IN> <skip> <set>
            this.general_op_in(ctx);
            return true;
        }
        op_in_ignore(ctx) {
            this._log(ctx, "OP_IN_IGNORE"); // <IN_IGNORE> <skip> <set>
            this.general_op_in(ctx, ctx.state.lower);
            return true;
        }
        op_branch(ctx) {
            var that = this;

            function* iter() {
                this._log(ctx, "BRANCH"); // <BRANCH> <0=skip> code <JUMP> ... <NULL>
                ctx.state.marks_push();
                ctx.skip_code(1);
                var current_branch_length = ctx.peek_code(0);
                while (current_branch_length) {
                    // The following tries to shortcut branches starting with a
                    // (unmatched) literal. _sre.c also shortcuts charsets here.
                    if (!(ctx.peek_code(1) == OPCODES["literal"] &&
                    (ctx.at_end() || ctx.peek_code(2) != ord(ctx.peek_char())))) {
                        ctx.state.string_position = ctx.string_position;
                        var child_context = ctx.push_new_context(1);
                        yield false;
                        if (child_context.has_matched) {
                            ctx.has_matched = true;
                            yield true;
                        }
                        ctx.state.marks_pop_keep();
                    }
                    ctx.skip_code(current_branch_length)
                    current_branch_length = ctx.peek_code(0);
                }
                ctx.state.marks_pop_discard();
                ctx.has_matched = false;
                yield true;
            }
            return new iter();
        }
        op_literal(ctx) {
            this._log(ctx, "LITERAL", ctx.peek_code(1)); // <LITERAL> <code>
            this.general_op_literal(ctx, operator.eq);
            return true;
        }
        op_repeat(ctx) {
            var that = this;
            function* iter() {
                // create repeat context.  all the hard work is done by the UNTIL      
                that._log(ctx, "REPEAT", ctx.peek_code(2), ctx.peek_code(3)); // <REPEAT> <skip> <1=min> <2=max> item <UNTIL> tail
                var repeat = new _RepeatContext(ctx);
                ctx.state.repeat = repeat;
                ctx.state.string_position = ctx.string_position;
                var child_context = ctx.push_new_context(ctx.peek_code(1) + 1);
                yield false;
                ctx.state.repeat = repeat.previous;
                ctx.has_matched = child_context.has_matched;
                yield true;
            }
            return new iter();
        }
        op_repeat_one(ctx) {
            var that = this;
            function* iter() {
                // match repeated sequence (maximizing).
                // this operator only works if the repeated item is exactly one character
                // wide, and we're not already collecting backtracking points.
                var mincount = ctx.peek_code(2);
                var maxcount = ctx.peek_code(3);
                that._log(ctx, "REPEAT_ONE", mincount, maxcount); // // <REPEAT_ONE> <skip> <1=min> <2=max> item <SUCCESS> tail

                if (ctx.remaining_chars() < mincount) {
                    ctx.has_matched = False;
                    yield true;
                }
                ctx.state.string_position = ctx.string_position;
                var count = that.count_repetitions(ctx, maxcount);
                ctx.skip_char(count);
                if (count < mincount) {
                    ctx.has_matched = false;
                    yield true;
                }
                if (ctx.peek_code(ctx.peek_code(1) + 1) == OPCODES["success"]) {
                    // tail is empty.  we're finished
                    ctx.state.string_position = ctx.string_position;
                    ctx.has_matched = true;
                    yield true;
                }
                ctx.state.marks_push()
                if (ctx.peek_code(ctx.peek_code(1) + 1) == OPCODES["literal"]) {
                    // Special case: Tail starts with a literal. Skip positions where
                    // the rest of the pattern cannot possibly match.
                    var c = ctx.peek_code(ctx.peek_code(1) + 2);
                    while (true) {
                        while (count >= mincount &&
                        (ctx.at_end() || ord(ctx.peek_char()) != c)) {
                            ctx.skip_char(-1);
                            count -= 1;
                        }
                        if (count < mincount) {
                            break;
                        }
                        ctx.state.string_position = ctx.string_position;
                        child_context = ctx.push_new_context(ctx.peek_code(1) + 1);
                        yield false;
                        if (child_context.has_matched) {
                            ctx.has_matched = true;
                            yield true;
                        }
                        ctx.skip_char(-1);
                        count -= 1;
                        ctx.state.marks_pop_keep();
                    }
                } else {
                    // General case: backtracking
                    while (count >= mincount) {
                        ctx.state.string_position = ctx.string_position;
                    }
                    var child_context = ctx.push_new_context(ctx.peek_code(1) + 1);
                    yield false;
                    if (child_context.has_matched) {
                        ctx.has_matched = true;
                    }
                    yield true;
                    ctx.skip_char(-1);
                    count -= 1;
                    ctx.state.marks_pop_keep();
                }
                ctx.state.marks_pop_discard();
                ctx.has_matched = false;
                yield true;
            }
            return new iter();
        }
        op_min_repeat_one(ctx) {
            var that = this;
            function* iter() {
                var count;
                var mincount = ctx.peek_code(2);
                var maxcount = ctx.peek_code(3);
                that._log(ctx, "MIN_REPEAT_ONE", mincount, maxcount); // <MIN_REPEAT_ONE> <skip> <1=min> <2=max> item <SUCCESS> tail

                if (ctx.remaining_chars() < mincount) {
                    ctx.has_matched = false;
                    return;
                }
                ctx.state.string_position = ctx.string_position;
                if (mincount == 0) {
                    count = 0;
                }
                else {
                    count = that.count_repetitions(ctx, mincount);
                    if (count < mincount) {
                        ctx.has_matched = false;
                        return;
                    }
                    ctx.skip_char(count);
                }
                if (ctx.peek_code(ctx.peek_code(1) + 1) == OPCODES["success"]) {
                    ctx.state.string_position = ctx.string_position;
                    ctx.has_matched = true;
                    return;
                }

                ctx.state.last_mark_save(ctx);
                while (maxcount == MAXREPEAT || count <= maxcount) {
                    ctx.state.string_position = ctx.string_position;
                    var child_context = ctx.push_new_context(ctx.peek_code(1) + 1);
                    yield;
                    if (child_context.has_matched) {
                        ctx.has_matched = true;
                        return;
                    }
                    ctx.state.string_position = ctx.string_position;
                    if (that.count_repetitions(ctx, 1) == 0) {
                        break;
                    }
                    ctx.skip_char(1);
                    count += 1;
                    ctx.state.last_mark_restore(ctx);
                }
                ctx.has_matched = false;
                return;
            }
            return new iter();
        }
        op_max_until(ctx) {
            var that = this;
            function* iter() {
                var child_context;
                // maximizing repeat        
                var repeat = ctx.state.repeat;
                if (typeof repeat === "undefined") {
                    throw "Internal re error: MAX_UNTIL without REPEAT.";
                }
                var mincount = repeat.peek_code(2);
                var maxcount = repeat.peek_code(3);
                ctx.state.string_position = ctx.string_position;
                var count = repeat.count + 1;
                that._log(ctx, "MAX_UNTIL", count); // <REPEAT> <skip> <1=min> <2=max> item <MAX_UNTIL> tail

                if (count < mincount) {
                    // not enough matches
                    repeat.count = count;
                    child_context = repeat.push_new_context(4);
                    yield false;
                    ctx.has_matched = child_context.has_matched;
                    if (!ctx.has_matched) {
                        repeat.count = count - 1;
                        ctx.state.string_position = ctx.string_position;
                    }
                    yield true;
                }
                if ((count < maxcount || maxcount == MAXREPEAT)
                    && ctx.state.string_position != repeat.last_position) {
                    // we may have enough matches, if we can match another item, do so
                    repeat.count = count;
                    ctx.state.marks_push();
                    var save_last_position = repeat.last_position; // zero-width match protection
                    repeat.last_position = ctx.state.string_position;
                    child_context = repeat.push_new_context(4);
                    yield false;
                    repeat.last_position = save_last_position;
                    if (child_context.has_matched) {
                        ctx.state.marks_pop_discard();
                        ctx.has_matched = true;
                        yield true;
                    }
                    ctx.state.marks_pop();
                    repeat.count = count - 1;
                    ctx.state.string_position = ctx.string_position;
                }

                // cannot match more repeated items here.  make sure the tail matches
                ctx.state.repeat = repeat.previous;
                child_context = ctx.push_new_context(1);
                yield false;
                ctx.has_matched = child_context.has_matched;
                if (!ctx.has_matched) {
                    ctx.state.repeat = repeat;
                    ctx.state.string_position = ctx.string_position;
                }
                yield true;
            }
            return new iter();
        }
        op_info(ctx) {
            this._log(ctx, "INFO");
            return this.op_jump(ctx);        
        }
        op_at(ctx) {
            // match at given position
            this._log(ctx, "AT", ctx.peek_code(1)); // # <AT> <code>
            if (!this.at_dispatcher.dispatch(ctx.peek_code(1), ctx)) {
                ctx.has_matched = false;
                return true;
            }
            ctx.skip_code(2);
            return true;
        }
        op_assert(ctx) {
            var that = this;
            function* iter() {
                that._log(ctx, "ASSERT", ctx.peek_code(2)); // <ASSERT> <skip> <back> <pattern>
                ctx.state.string_position = ctx.string_position - ctx.peek_code(2);
                if (ctx.state.string_position < 0) {
                    ctx.has_matched = false;
                    return;
                }
                var child_context = ctx.push_new_context(3);
                yield;
                if (child_context.has_matched) {
                    ctx.skip_code(ctx.peek_code(1) + 1);
                }
                else {
                    ctx.has_matched = false;
                }
                return;
            }
            return new iter();
        }
        op_assert_not(ctx) {
            var that = this;
            function* iter() {
                that._log(ctx, "ASSERT_NOT", ctx.peek_code(2)); // <ASSERT_NOT> <skip> <back> <pattern>
                ctx.state.string_position = ctx.string_position - ctx.peek_code(2);
                if (ctx.state.string_position >= 0) {
                    var child_context = ctx.push_new_context(3);
                    yield false;
                    if (child_context.has_matched) {
                        ctx.has_matched = false;
                        yield true;
                    }
                }
                ctx.skip_code(ctx.peek_code(1) + 1);
                yield true;
            }
            return new iter();
        }
        unknown(ctx) {
            throw "error unknown opcode " + ctx.peek_code();
        }
        count_repetitions(ctx, maxcount) {
            var count = 0;
            var real_maxcount = ctx.state.end - ctx.string_position;
            if (maxcount < real_maxcount && maxcount != MAXREPEAT) {
                real_maxcount = maxcount;
            }
            // XXX could special case every single character pattern here, as in C.
            // This is a general solution, a bit hackisch, but works and should be
            // efficient.
            var code_position = ctx.code_position;
            var string_position = ctx.string_position;
            ctx.skip_code(4);
            var reset_position = ctx.code_position;
            while (count < real_maxcount) {
                // this works because the single character pattern is followed by
                // a success opcode
                ctx.code_position = reset_position;
                this.dispatch(ctx.peek_code(), ctx);
                if (ctx.has_matched === false) { // could be None as well
                    break;
                }
                count += 1;
            }
            ctx.has_matched = undefined;
            ctx.code_position = code_position;
            ctx.string_position = string_position;
            return count;
        }
        check_charset(ctx, char) {
            this.set_dispatcher.reset(char);
            var save_position = ctx.code_position;
            var result = undefined;
            while (typeof result === "undefined") {
                result = this.set_dispatcher.dispatch(ctx.peek_code(), ctx);
            }
            ctx.code_position = save_position;
            return result;
        }
        _log(context, opname) {
            var arg_string = Array.prototype.slice.call(arguments, 2).join(" ");
            console.log(context.pattern_codes, context.string_position, opname, arg_string);
            console.log(context.state.string);
            console.log(Array(context.string_position).join(" ") + "^");
        }
    }

    _OpcodeDispatcher.build_dispatch_table(OPCODES, "op_");


    class _CharsetDispatcher extends _Dispatcher {

        constructor() {
            super();
            this.ch_dispatcher = new _ChcodeDispatcher();
        }

        reset(char) {
            this.char = char;
            this.ok = true;
        }
        set_range(ctx) {
            // <RANGE> <lower> <upper>
            if (ctx.peek_code(1) <= this.char && this.char <= ctx.peek_code(2)) {
                return this.ok;
            }
            ctx.skip_code(3);
        }
    }

    _CharsetDispatcher.build_dispatch_table(OPCODES, "set_");

    class _ValidateCharsetDispatcher extends _Dispatcher
    {
        constructor()
        {
            super();
        }
        validate_charset(context)
        {
            while (context.remaining_codes() > 0 && context.is_valid) {
                var opcode = context.get_op();
                try {
                    this.dispatch(opcode, context);
                } catch (e) {
                    console.log(OPCODES_[opcode]);
                    console.log("exception in charset opcode ", e);
                    context.is_valid = false;
                    return false;
                }
                return true;
            }       
        }
        set_range(ctx)
        {
            ctx.get_arg();
            ctx.get_arg();
        }
    }
    _ValidateCharsetDispatcher.build_dispatch_table(OPCODES, "set_");

    class _ValidateDispatcher extends _Dispatcher {
        constructor() {
            super();
            this.charset_dispatcher = new _ValidateCharsetDispatcher();
            this.validating_contexts = [];
        }
        
        op_info(ctx)
        {
            console.log("validating INFO");
            var skip = ctx.get_skip();
            ctx.code_position += skip - 1;
            return true;
        }
        op_mark(ctx)
        {
            console.log("validating MARK");
            var arg = ctx.get_arg();
            if (arg > 2 * ctx.groups + 1) {
                throw "groups too few";
            }
            return true;
        }
        op_at(ctx)
        {
            console.log("validating AT");
            var arg = ctx.get_arg();
            // todo check the code
            return true;
        }
        op_in(ctx)
        {
            console.log("validating IN");
            var skip = ctx.get_skip();
            // Stop 1 before the end; we check the FAILURE below 
            var child_context = ctx.push_new_context(0, skip - 2);
            if (!this.charset_dispatcher.validate_charset(child_context))
                throw "charset error";
            ctx.state.context_stack.pop();
            if (ctx.peek_code(skip-2) != OPCODES["failure"])
                throw "no failer after in";
            ctx.code_position += skip-1;
            return true;
        }
        op_min_repeat_one(ctx)
        {
            function* iter()
            {
                var skip = ctx.get_skip();
                var min = ctx.get_arg();
                var max = ctx.get_arg();
                if (min > max)
                    throw "min > max";
                if (max > MAXREPEAT)
                    throw "max > MAXREPEAT";
                var child_context = ctx.push_new_context(0, skip - 4);
                yield;
                if (!child_context.is_valid)
                    throw "inner failed";
                ctx.code_position += skip - 4;
                var op = ctx.get_op();
                if (op != OPCODES["success"])
                    throw "no success after repeat";
                return true;
            }
            return new iter();
        }
        op_assert(ctx)
        {
            function* iter()
            {
                var skip = ctx.get_skip();
                var arg = ctx.get_arg();
                ctx.code_position--;
                if (arg & 0x80000000) {
                    throw "width too large";
                }
                var child_context = ctx.push_new_context(1, skip - 2);
                yield;
                ctx.code_position += skip - 2;
                var op = ctx.get_op();
                if (op != OPCODES["success"]) {
                    throw "no success after assert";
                }
            }
            return new iter();
        }
        op_literal(ctx)
        {
            ctx.get_arg();
            return true;
        }
        op_not_literal(ctx)
        {
            ctx.get_arg();
            return true;
        }
        op_literal_ignore(ctx)
        {
            ctx.get_arg();
            return true;
        }
        op_not_literal_ignore(ctx)
        {
            ctx.get_arg();
            return true;
        }
        unknown(ctx) {
            throw "unknown not inplemented in dispatcher " + this.constructor.name + " code " + ctx.peek_code(-1);
        }
        validate(context)
        {
            var done = true;
            while (context.remaining_codes() > 0 && context.is_valid) {
                var opcode;
                if (done) {
                    opcode = context.get_op();
                }
                try {
                    done = this.dispatch(opcode, context);
                } catch (e) {
                    console.log(OPCODES_[opcode]);
                    console.log("exception in opcode ", e);
                    context.is_valid = false;
                    return false;
                }
            }
            return context.is_valid;
        }
        dispatch(opcode, context)
        {
            var has_finished;
            var generator = this.validating_contexts[context.id];
            if (generator) {
                delete this.validating_contexts[context.id];
                has_finished = generator.next();
            } else {
                var method = this.constructor.DISPATCH_TABLE[opcode] || this.constructor.prototype.unknown;
                has_finished = method.call(this, context);
                if (typeof has_finished.next !== "undefined") {
                    generator = has_finished;
                    has_finished = generator.next();
                }
            }
            if (typeof has_finished.done !== "undefined") {
                if (!has_finished.done && !has_finished.value) {
                    this.validating_contexts[context.id] = generator;
                    has_finished = has_finished.value;
                } else {
                    has_finished = true;
                }
            }
            console.log("dispatch result: " + has_finished);
            return has_finished;
        }
    }

    _ValidateDispatcher.build_dispatch_table(OPCODES, "op_");

    function _State(string, start, end, flags) {
        this.string = string;
        if (start < 0) {
            start = 0;
        }
        if (end > string.length) {
            end = string.length;
        }
        this.start = start;
        this.string_position = this.start;
        this.end = end;
        this.pos = start;
        this.flags = flags;
        this.reset();
    }
    _State.prototype.reset = function() {
        this.marks = [];
        this.lastindex = -1;
        this.lastmark = -1;
        this.marks_stack = [];
        this.context_stack = [];
        this.repeat = undefined;
    }
    _State.prototype.match = function(pattern_codes) {
        var dispatcher = new _OpcodeDispatcher();
        this.context_stack.push(new _MatchContext(this, pattern_codes));
        var has_matched = undefined;
        while (this.context_stack.length > 0) {
            var context = this.context_stack.slice(-1)[0];
            has_matched = dispatcher.match(context);
            if (typeof has_matched !== "undefined") {
                this.context_stack.pop();
            }
        }
        return has_matched;
    }
    _State.prototype.validate = function(pattern_codes, groups) {

        if (groups < 0 || groups > 100 || pattern_codes.length == 0 || pattern_codes.slice(-1)[0] != OPCODES["success"]) {
            console.log("FAIL: validate outer");
            return false;
        }
        if (groups === 0) {
            groups = 100;
        }
        var dispatcher = new _ValidateDispatcher();
        this.context_stack.push(new _ValidateContext(this, pattern_codes.slice(0,-1)));
        var has_matched = undefined;
        while (this.context_stack.length > 0) {
            var context = this.context_stack.slice(-1)[0];
            has_matched = dispatcher.validate(context);
            if (typeof has_matched !== "undefined") {
                this.context_stack.pop();
            }
        }
        return has_matched;
    }
    _State.prototype.search = function(pattern_codes) {
        var flags = 0;
        if (pattern_codes[0] == OPCODES["info"]) {
            // optimization info block
            // <INFO> <1=skip> <2=flags> <3=min> <4=max> <5=prefix info>
            if (pattern_codes[2] & SRE_INFO_PREFIX && pattern_codes[5] > 1) {
                return this.fast_search(pattern_codes);
            }
            flags = pattern_codes[2];
            pattern_codes = pattern_codes.slice(pattern_codes[1] + 1);
        }

        var string_position = this.start;
        if (pattern_codes[0] == OPCODES["literal"]) {
            // Special case: Pattern starts with a literal character. This is
            // used for short prefixes
            character = pattern_codes[1]
            while (true) {
                while (string_position < this.end 
                        && ord(this.string[string_position]) != character) {
                    string_position += 1;
                }
                if (string_position >= this.end) {
                    return false;
                }
                this.start = string_position;
                string_position += 1;
                this.string_position = string_position;
                if (flags & SRE_INFO_LITERAL) {
                    return true;
                }
                if (this.match(pattern_codes.slice(2))) {
                    return true;
                }
            }
            return false;
        }
        // General case
        while (string_position <= this.end) {
            this.reset();
            this.start = this.string_position = string_position;
            if (this.match(pattern_codes)) {
                return true;
            }
            string_position += 1;
        }
        return false;
    }
    _State.prototype.set_mark = function(mark_nr, position) {
        if (mark_nr & 1) {
            // This id marks the end of a group.
            this.lastindex = Math.floor(mark_nr / 2) + 1;
        }
        if (mark_nr > this.lastmark) {
            // state->lastmark is the highest valid index in the
            //   state->mark array.  If it is increased by more than 1,
            //   the intervening marks must be set to NULL to signal
            //   that these marks have not been encountered.
            var j = this.lastmark + 1;
            while (j < mark_nr) {
                this.marks[j++] = undefined;
            }
            this.lastmark = mark_nr;
        }
        this.marks[mark_nr] = position;
    }
    _State.prototype.marks_push = function() {
        this.marks_stack.push([this.marks.slice(0), this.lastindex]);
    }

    _State.prototype.marks_pop = function() {
        var tmp = this.marks_stack.pop();
        this.marks = tmp[0];
        this.lastindex = tmp[1];
    }
    _State.prototype.marks_pop_keep = function() {
        var tmp = this.marks_stack[this.marks_stack.length-1];
        this.marks = tmp[0];
        this.lastindex = tmp[1];
    }
    _State.prototype.marks_pop_discard = function() {
        this.marks_stack.pop();
    }
    _State.prototype.last_mark_save = function(ctx) {
        ctx.lastmark = this.lastmark;
        ctx.lastindex = this.lastindex;
    }
    _State.prototype.last_mark_restore = function(ctx) {
        this.lastmark = ctx.lastmark;
        this.lastindex = ctx.lastindex;
    }

    function SRE_Match(pattern, state) {
        this.re = pattern;
        this.string = state.string;
        this.pos = state.pos;
        this.endpos = state.end;
        this.lastindex = state.lastindex;
        if (this.lastindex < 0) {
            this.lastindex = undefined;
        }
        this.regs = this._create_regs(state);
        // JPK more
    }
    SRE_Match.prototype._create_regs = function(state) {
        var regs = [[state.start, state.string_position]];
        for (var group=0; group < this.re.groups; group++) {
            var mark_index = 2 * group;
            if (mark_index + 1 < state.lastmark
                                    && typeof state.marks[mark_index] !== "undefined"
                                    && typeof state.marks[mark_index + 1] !== "undefined") {
                regs.push([state.marks[mark_index], state.marks[mark_index + 1]]);
            }
            else {
                regs.push([-1, -1]);
            }
        }
        return regs;
    }
    SRE_Match.prototype.groups = function(default_) {
        var groups = [];
        for (var indices=1; indices < this.regs.length; indices++) {
            if (this.regs[indices][0] >= 0) {
                groups.push(this.string.slice(this.regs[indices][0], this.regs[indices][1]));
            }
            else {
                groups.push(default_);
            }
        }
        return groups;
    }
    var SRE_Match_  = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, obj) {
            self.obj = obj;
        });

        $loc.groups = new Sk.builtin.func(function (self, default_) {
            default_ = Sk.ffi.remapToJs(default_);
            return new Sk.builtin.list(self.obj.groups(default_));
        });
    }
    mod.SRE_Match = Sk.misceval.buildClass(mod, SRE_Match_, "SRE_Match_", []);

    function SRE_Pattern(pattern, flags, code, groups, groupindex, indexgroup) {
        this.pattern = pattern;
        this.flags = flags;
        this.groups = groups;
        this.groupindex = groupindex; // Maps group names to group indices
        this._indexgroup = indexgroup; // Maps indices to group names
        this._code = code;
    }
    SRE_Pattern.prototype.match = function(string, pos, endpos) {
        pos = pos | 0;
        endpos = endpos | 65536 * 128;
        var state = new _State(string, pos, endpos, this.flags);
        if (state.match(this._code)) {
            return new SRE_Match(this, state);
        }
        return undefined;
    }
    SRE_Pattern.prototype.search = function(string, pos, endpos) {
        pos = pos | 0;
        endpos = endpos | 65536 * 128;
        state = new _State(string, pos, endpos, this.flags);
        if (state.search(this._code)) {
            return new SRE_Match(this, state);
        }
        else {
            return undefined;
        }
    }
    SRE_Pattern.prototype.validate = function() {
        var state = new _State("", 0, 65536 * 128, this.flags);
        if (!state.validate(this._code, this.groups)) {
            return false;
        }
        return true;
    }

    function compile(pattern, flags, code, groups, groupindex, indexgroup) {
        var res =  new SRE_Pattern(pattern, flags, code, groups, groupindex, indexgroup);
        console.log("validate result", res.validate());
        return res;
    }

    var SRE_Pattern_ = function ($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(function (self, pattern, flags, code, groups, groupindex, indexgroup) {
            if (pattern) {
                pattern = pattern.v;
            }
            if (flags) {
                flags = flags.v;
            }
            if (code) {
                code = code.v;
            }
            if (groups) {
                groups = groups.v;
            }
            if (groupindex) {
                groupindex = groupindex.v;
            }
            self.obj = new SRE_Pattern(pattern, flags, code, groups, groupindex, indexgroup);
        });

        $loc.__getattr__ = new Sk.builtin.func(function (self, key) {
            key = Sk.ffi.remapToJs(key);
            if (key === "flags") {
                return new Sk.builtin.nmber(self.obj.flags);
            }
        });

        $loc.match = new Sk.builtin.func(function(self, string, pos, endpos) {
            return Sk.misceval.callsim(mod.SRE_Match, self.obj.match(string, pos, endpos));
        });
        // 'findall', 'finditer', 'flags', 'groupindex', 'groups', 
        // 'match', 'pattern', 'scanner', 'search', 'split', 
        // 'sub', 'subn'
    }
    mod.SRE_Pattern = Sk.misceval.buildClass(mod, SRE_Pattern_, "SRE_Pattern", []);

    mod.MAGIC = Sk.builtin.assk$(20031017, Sk.builtin.nmber.int$);

    mod.CODESIZE = Sk.builtin.assk$(4, Sk.builtin.nmber.int$);

    mod.MAXREPEAT = Sk.builtin.assk$(MAXREPEAT, Sk.builtin.int$);

    mod.match = new Sk.builtin.func(function (pattern, string, flags) {
        Sk.builtin.pyCheckArgs('match', arguments, 2, 3);
        if (!Sk.builtin.checkString(pattern)) {
            throw new Sk.builtin.TypeError("pattern must be a string");
        };
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("string must be a string");
        };
        if (flags === undefined) {
            flags = 0;
        };
        if (!Sk.builtin.checkNumber(flags)) {
            throw new Sk.builtin.TypeError("flags must be a number");
        };

        return pattern;
    });

    mod.compile = new Sk.builtin.func(function(pattern, flags, code, groups, groupindex, indexgroup) {
        return Sk.misceval.callsim(mod.SRE_Pattern, flags, code, groups, groupindex, indexgroup);
    });

    return mod;
}