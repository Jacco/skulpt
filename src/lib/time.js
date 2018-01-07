/*
 implementation of the Python time package.
 */

var $builtinmodule = function (name) {
    var mod = {};

    // locale/setLocale need to be in os.environ or something

    mod.locale;

    mod.timeZone;

    mod.setLocale = new Sk.builtin.func(function (locale) {
        locale = Sk.ffi.remapToJs(locale);
        var df = new Intl.DateTimeFormat(locale);
        if (df.resolved.locale != locale) {
            throw new Sk.builtin.ValueError("locale not supported");
        }
        mod.locale = Sk.builtin.str(df.resolved.locale);
    });

    mod.setTimeZone = new Sk.builtin.func(function (timeZone) {
        timeZone = Sk.ffi.remapToJs(timeZone);
        try {
            var df = new Intl.DateTimeFormat("cu", { timeZone: timeZone });
            mod.timeZone = Sk.builtin.str(df.resolved.timeZone);
        } catch(err) {
            throw new Sk.builtin.VsalueError("timezone not supported");
        }
    });

    function initModule() {
        var df = new Intl.DateTimeFormat();
        mod.locale = Sk.builtin.str(df.resolved.locale);
        mod.timeZone = Sk.builtin.str(df.resolved.timeZone);
    }

    mod.__file__ = "/src/lib/time.js";

    mod.__package__ = Sk.builtin.none.none$;

    var struct_time_fields = {
        "tm_year": "year, for example, 1993", 
        "tm_mon": "month of year, range [1, 12]", 
        "tm_mday": "day of month, range [1, 31]", 
        "tm_hour": "hours, range [0, 23]", 
        "tm_min": "minutes, range [0, 59]", 
        "tm_sec": "seconds, range [0, 61]", 
        "tm_wday": "day of week, range [0, 6], Monday is 0", 
        "tm_yday": "day of year, range [1, 366]", 
        "tm_isdst": "1 if summer time is in effect, 0 if not, and -1 if unknown"
    };

    var struct_time_f = Sk.builtin.make_structseq('time', 'struct_time', struct_time_fields);

    mod.struct_time = struct_time_f;

    function check_struct_time(t) {
        if (!(t instanceof struct_time)) {
            throw new Sk.builtin.TypeError("Required argument 'struct_time' must be of type: 'struct_time'");
        }
        var i;
        var len = self.v.length;
        var obj = self.v;
        for (i = 0; i < len; ++i) {
            if (!Sk.builtin.checkInt(obj[i])) {
                throw new Sk.builtin.TypeError("an integer is required");
            }
        }
        return true;
    }

    function time_f() {
        Sk.builtin.pyCheckArgs("time", arguments, 0, 0);
        var res = Date.now();
        if (performance && performance.now)
        {
            res = res + performance.now() % 1;
        }
        return Sk.builtin.assk$(res / 1000, undefined);
    }
    mod.time = new Sk.builtin.func(time_f);

    // This is an experimental implementation of time.sleep(), using suspensions
    mod.sleep = new Sk.builtin.func(function(delay) {
        Sk.builtin.pyCheckArgs("sleep", arguments, 1, 1);
        Sk.builtin.pyCheckType("delay", "float", Sk.builtin.checkNumber(delay));
        var susp = new Sk.misceval.Suspension();
        susp.resume = function() { return Sk.builtin.none.none$; }
        susp.data = {type: "Sk.promise", promise: new Promise(function(resolve) {
            if (typeof setTimeout === "undefined") {
                // We can't sleep (eg test environment), so resume immediately
                resolve();
            } else {
                setTimeout(resolve, Sk.ffi.remapToJs(delay)*1000);
            }
        })};
        return susp;
    });

    function padLeft(str, l, c) {
        var _str = str.toString();
        return Array(l - _str.length + 1).join(c || " ") + _str;
    }

    function isLeapYear(year) {
        if((year & 3) != 0) return false;
        return ((year % 100) != 0 || (year % 400) == 0);
    }

    function getDayOfYear(date,utc) {
        utc = utc || false;
        var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        var mn = utc ? date.getUTCMonth() : date.getMonth();
        var dn = utc ? date.getUTCDate() : date.getDate();
        var dayOfYear = dayCount[mn] + dn;
        if(mn > 1 && isLeapYear(utc ? date.getUTCFullYear() : date.getFullYear())) {
            dayOfYear++;
        }
        return dayOfYear;
    }

    function stdTimezoneOffset() {
        var jan = new Date(2002, 0, 1);
        var jul = new Date(2002, 6, 1);
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }

    function altTimezoneOffset() {
        var jan = new Date(2002, 0, 1);
        var jul = new Date(2002, 6, 1);
        return Math.min(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }    

    function dst(date) {
        return date.getTimezoneOffset() < stdTimezoneOffset();
    }

    function timeZoneName(date) {
        return /\((.*)\)/.exec(date.toString())[1];
    }

    function timeZoneNames() {
        var jan = new Date(2002, 0, 1);
        var jul = new Date(2002, 6, 1);     
        if (dst(jan)) {
            return [Sk.builtin.str(timeZoneName(jul)), Sk.builtin.str(timeZoneName(jan))];
        } else {
            return [Sk.builtin.str(timeZoneName(jan)), Sk.builtin.str(timeZoneName(jul))];
        }
    }

    function date_to_struct_time(date, utc) {
        utc = utc || false;
        return new struct_time_f(
            [
                Sk.builtin.assk$(utc ? date.getUTCFullYear() : date.getFullYear()), 
                Sk.builtin.assk$((utc ? date.getUTCMonth() : date.getMonth()) + 1), // want January == 1
                Sk.builtin.assk$(utc ? date.getUTCDate() : date.getDate()), 
                Sk.builtin.assk$(utc ? date.getUTCHours() : date.getHours()), 
                Sk.builtin.assk$(utc ? date.getUTCMinutes() : date.getMinutes()), 
                Sk.builtin.assk$(utc ? date.getUTCSeconds() : date.getSeconds()), 
                Sk.builtin.assk$(((utc ? date.getUTCDay() : date.getDay()) + 6) % 7), // Want Monday == 0
                Sk.builtin.assk$(getDayOfYear(date, utc)), // Want January, 1 == 1
                Sk.builtin.assk$(utc ? 0 : (dst(date) ? 1 : 0)) // 1 for DST /0 for non-DST /-1 for unknown
            ]
        );
    }

    function weekNumber(date, firstWeekday) {
        firstWeekday = firstWeekday || 'sunday';
        var weekday = date.getDay();
        if (firstWeekday === 'monday') {
            if (weekday === 0) // Sunday
                weekday = 6;
            else
                weekday--;
        }
        var firstDayOfYearUtc = Date.UTC(date.getFullYear(), 0, 1),
            dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
            yday = Math.floor((dateUtc - firstDayOfYearUtc) / 86400000),
            weekNum = (yday + 7 - weekday) / 7;
        return Math.floor(weekNum);
    }

    function localtime_f(secs) {
        Sk.builtin.pyCheckArgs("localtime", arguments, 0, 1);
        var isNum = Sk.builtin.checkNumber(secs);
        Sk.builtin.pyCheckType("secs", "number", isNum || Sk.builtin.checkNone(secs) || !secs);
        secs = isNum ? Sk.builtin.asnum$(secs) : Sk.builtin.asnum$(time_f());
        if (secs - 1 == secs) {
            throw new Sk.builtin.ValueError("secs out of range");
        }
        var d = new Date();
        d.setTime(secs * 1000);
        return date_to_struct_time(d);
    }

    mod.localtime = new Sk.builtin.func(localtime_f);

    mod.gmtime = new Sk.builtin.func(function(secs) {
        Sk.builtin.pyCheckArgs("gmtime", arguments, 0, 1);
        var isNum = Sk.builtin.checkNumber(secs);
        Sk.builtin.pyCheckType("secs", "number", isNum || Sk.builtin.checkNone(secs) || !secs);
        var secs = isNum ? Sk.builtin.asnum$(secs) : 0;
        if (secs - 1 == secs) {
            throw new Sk.builtin.ValueError("secs out of range");
        }
        var d = new Date();
        d.setTime(secs * 1000);        
        return date_to_struct_time(d, true);
    });

    var monthnames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var daynames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    function asctime_f(time) {
        if (!time || Sk.builtin.checkNone(time))
        {
            time = localtime_f();
        } else if (!(time instanceof struct_time_f)) {
            time = new struct_time_f(time);
        }
        if (time instanceof Sk.builtin.tuple && time.v.length == 9)
        {
            // todo: test validity??
            var parts = [];
            parts.push(daynames[Sk.builtin.asnum$(time.v[6])]);
            parts.push(monthnames[Sk.builtin.asnum$(time.v[1])]);  
            parts.push(padLeft(Sk.builtin.asnum$(time.v[2]).toString(), 2, '0'));
            parts.push(
                padLeft(Sk.builtin.asnum$(time.v[3]).toString(), 2, '0') + ":" +
                padLeft(Sk.builtin.asnum$(time.v[4]).toString(), 2, '0') + ":" +
                padLeft(Sk.builtin.asnum$(time.v[5]).toString(), 2, '0')
            );
            parts.push(padLeft(Sk.builtin.asnum$(time.v[0]).toString(), 4, '0'));

            return Sk.builtin.str(parts.join(" "));
        }
    }

    mod.asctime = new Sk.builtin.func(asctime_f);

    mod.ctime = new Sk.builtin.func(function(secs) {
        return asctime_f(localtime_f(secs));
    });

    function mktime_f(time) {
        if (time instanceof Sk.builtin.tuple && time.v.length == 9)
        {
            var d = new Date(Sk.builtin.asnum$(time.v[0]), Sk.builtin.asnum$(time.v[1])-1, Sk.builtin.asnum$(time.v[2]));
            d.setHours(Sk.builtin.asnum$(time.v[3]));
            d.setMinutes(Sk.builtin.asnum$(time.v[4]));
            d.setSeconds(Sk.builtin.asnum$(time.v[5]));
            return Sk.builtin.assk$(d.getTime() / 1000, undefined);
        }
    }

    mod.mktime = new Sk.builtin.func(mktime_f);

    /*
    The offset of the local (non-DST) timezone, in seconds west of UTC (negative in most of Western Europe, 
    positive in the US, zero in the UK).
    */
    mod.timezone = Sk.builtin.assk$(stdTimezoneOffset() * 60, Sk.builtin.nmber.int$);

    /*
    The offset of the local DST timezone, in seconds west of UTC, if one is defined. This is negative if the
    local DST timezone is east of UTC (as in Western Europe, including the UK). Only use this if daylight is nonzero.
    */
    mod.altzone = Sk.builtin.assk$(altTimezoneOffset() * 60, Sk.builtin.nmber.int$);

    /*
    Nonzero if a DST timezone is defined.
    */
    mod.daylight = Sk.builtin.assk$(dst(new Date()) ? 1 : 0, Sk.builtin.nmber.int$);

    /*
    A tuple of two strings: the first is the name of the local non-DST timezone, the second is the name of the local 
    DST timezone. If no DST timezone is defined, the second string should not be used.
    */
    mod.tzname = Sk.builtin.tuple(timeZoneNames());

    mod.accept2dyear = Sk.builtin.assk$(1, Sk.builtin.nmber.int$);

    mod.clock = new Sk.builtin.func(function() {
        var res = 0.0;
        if (performance && performance.now)
        {
            res = performance.now() / 1000;
        } else {
            res = new Date().getTime() / 1000;
        }
        return Sk.builtin.assk$(res, Sk.builtin.nmber.float$);
    });

    function strftime_f(format, t) {
        Sk.builtin.pyCheckArgs("strftime", arguments, 1, 2);
        if (!Sk.builtin.checkString(format)) {
            throw new Sk.builtin.TypeError("format must be a string");
        }
        format = Sk.ffi.remapToJs(format);
        if (!t)
        {
            t = localtime_f();
        } else if (!(t instanceof struct_time_f)) {
            t = new struct_time_f(t);
        }
        // correct 2d year
        var y = Sk.builtin.asnum$(t.v[0]);
        if (y < 1900) {
            if (!Sk.misceval.isTrue(mod.accept2dyear)) {
                throw new Sk.builtin.ValueError("year >= 1900 required");
            }
            if (69 <= y && y <= 99) {
                y += 1900;
            }
            else if (0 <= y && y <= 68) {
                y += 2000;
            }
            else {
                throw new Sk.builtin.ValueError("year out of range");
            }
            t.v[0] = Sk.builtin.assk$(y);
        }
        // todo correct year if used more often should be in sep function
        if (Sk.builtin.asnum$(t.v[0]) < 1900) {
            throw new Sk.builtin.ValueError("year out of range");            
        }
        if (Sk.builtin.asnum$(t.v[1]) == 0) {
            t.v[1] = Sk.builtin.assk$(1);
        }
        else if (Sk.builtin.asnum$(t.v[1]) < 1 || Sk.builtin.asnum$(t.v[1]) > 12) {
            throw new Sk.builtin.ValueError("month out of range");
        }
        if (Sk.builtin.asnum$(t.v[2]) == 0) {
            t.v[2] = Sk.builtin.assk$(1);
        }
        else if (Sk.builtin.asnum$(t.v[2]) < 1 || Sk.builtin.asnum$(t.v[2]) > 31) {
            throw new Sk.builtin.ValueError("day of month out of range");
        }
        if (Sk.builtin.asnum$(t.v[3]) < 0 || Sk.builtin.asnum$(t.v[3]) > 23) {
            throw new Sk.builtin.ValueError("hour out of range");
        }
        if (Sk.builtin.asnum$(t.v[4]) < 0 || Sk.builtin.asnum$(t.v[4]) > 59) {
            throw new Sk.builtin.ValueError("minute out of range");
        }
        if (Sk.builtin.asnum$(t.v[5]) < 0 || Sk.builtin.asnum$(t.v[5]) > 61) {
            throw new Sk.builtin.ValueError("seconds out of range");
        }
        if (Sk.builtin.asnum$(t.v[6]) < 0 || Sk.builtin.asnum$(t.v[6]) > 6) {
            throw new Sk.builtin.ValueError("day of week out of range");
        }
        if (Sk.builtin.asnum$(t.v[7]) == 0) {
            t.v[7] = Sk.builtin.assk$(1);
        }        
        else if (Sk.builtin.asnum$(t.v[7]) < 1 || Sk.builtin.asnum$(t.v[7]) > 365) {
            throw new Sk.builtin.ValueError("day of year out of range");
        }
        var date = new Date(mktime_f(t).v * 1000);
        var resultString = '',
            inScope = false,
            tmp;
        for (var i = 0; i < format.length; i++) {
            var currentCharCode = format.charCodeAt(i);
            if (inScope === true) {
                switch (currentCharCode) {
                    case 97: // a
                        resultString += date.toLocaleString(mod.locale.v, { weekday: 'short'});
                        break;                  
                    case 65: // A
                        resultString += date.toLocaleString(mod.locale.v, { weekday: 'long'});
                        break;
                    case 98: // b
                        resultString += date.toLocaleString(mod.locale.v, { month: 'short'});
                        break;                  
                    case 66: // B
                        resultString += date.toLocaleString(mod.locale.v, { month: 'long'});
                        break;
                    case 99: // c
                        resultString += date.toLocaleString(mod.locale.v);
                        break;
                    case 100: // d
                        resultString += date.toLocaleString(mod.locale.v, { day: "2-digit" });
                        break;
                    case 72: // H
                        resultString += padLeft(date.toLocaleString(mod.locale.v, { hour: "2-digit", hour12: false }), 2, '0');
                        break;
                    case 73: // I
                        tmp = parseInt(date.toLocaleString(mod.locale.v, { hour: "2-digit", hour12: false }));
                        if (tmp === 0) {
                            tmp = 12;
                        } else if (tmp > 12) {
                            tmp -= 12;
                        }
                        tmp = padLeft(tmp.toString(), 2, "0");
                        resultString += tmp;
                        break;
                    case 106: // j
                        resultString += padLeft(getDayOfYear(date), 3, "0");
                        break;
                    case 109: // m
                        resultString += date.toLocaleString(mod.locale.v, { month: "2-digit" });
                        break;
                    case 77: // M
                        resultString += padLeft(date.toLocaleString(mod.locale.v, { minute: "2-digit" }), 2, '0');
                        break;
                    case 112: // p
                        tmp = date.toLocaleString(mod.locale.v, { hour: "2-digit", hour12: true });
                        tmp = tmp.substring(2).trim();
                        resultString += tmp;
                        break;
                    case 83: // S
                        resultString += padLeft(date.toLocaleString(mod.locale.v, { second: "2-digit" }), 2, '0');
                        break;
                    case 85: // U
                        resultString += padLeft(weekNumber(date), 2, "0");
                        break;
                    case 119: // w
                        resultString += date.getDay();
                        break;
                    case 87: // W
                        resultString += padLeft(weekNumber(date, "monday"), 2, "0");
                        break;
                    case 121: // y
                        resultString += date.getFullYear() % 100;
                        break;
                    case 89: // Y
                        resultString += date.getFullYear();
                        break;
                    case 120: // x
                        resultString += date.toLocaleDateString(mod.locale.v);
                        break;
                    case 88: // X
                        tmp = padLeft(date.toLocaleString(mod.locale.v, { hour: "2-digit", hour12: false }), 2, "0");
                        resultString += tmp + ':' + date.toLocaleString(mod.locale.v, { minute: "2-digit", second: "2-digit" });
                        break;
                    // we need to handle Z
                    case 37: // %
                        resultString += '%';
                        break;
                    default:
                        resultString += "%" + String.fromCharCode(currentCharCode);
                        break;
                }
                inScope = false;
                continue;
            }
            if (currentCharCode === 37) {
                inScope = true;
                continue;
            }
            resultString += format[i];
        }
        return new Sk.builtin.str(resultString);
    }

    mod.strftime = new Sk.builtin.func(strftime_f);

    function tzset_f()
    {
        Sk.builtin.pyCheckArgs("tzset", arguments, 0, 0);
        // todo here we need to recalculate tzname/timezone/altzone/daylight also local date creation needs to be altered

    }

    mod.tzset = new Sk.builtin.func(tzset_f);

    strptime_matchers = {
        'a': [], // for day/month we need localized arrays (calendar?)
        'A': [],
        'b': [],
        'B': [],
        'c': [], // we need to determine pattern
        'd': [],
        'H': [],
        'I': [],
        'j': [],
        'm': [],
        'M': [],
        'p': [],
        'S': [],
        'U': [],
        'w': [],
        'W': [],
        'x': [],
        'X': [],
        'y': [],
        'Y': [],
        'Z': [],
        '%': [ '%', function () {} ]
    };

    function strptime_f(string, format)
    {
        Sk.builtin.pyCheckArgs("strptime", arguments, 1, 2);   
        if (!Sk.builtin.checkString(string)) {
            throw new Sk.builtin.TypeError("fstrptime needs string input");
        }
        if (format) {
            if (!Sk.builtin.checkString(string)) {
                throw new Sk.builtin.TypeError("format should be string");
            }            
        }
    }

    mod.strptime = new Sk.builtin.func(strptime_f);

    initModule();

    return mod;
};
