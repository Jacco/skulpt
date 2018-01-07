import re
import calendar

print calendar.day_name[0:]

class LocaleTime:
    def __init__(self):
        pass

class TimeRE():
    """Handle conversion from format directives to regexes."""

    def __init__(self, locale_time=None):
        """Create keys/values.
        Order of execution is important for dependency reasons.
        """
        if locale_time:
            self.locale_time = locale_time
        else:
            self.locale_time = LocaleTime()
        self.base = dict({
            # The " \d" part of the regex is to make %c from ANSI C work
            'd': r"(?P<d>3[0-1]|[1-2]\d|0[1-9]|[1-9]| [1-9])",
            'f': r"(?P<f>[0-9]{1,6})",
            'H': r"(?P<H>2[0-3]|[0-1]\d|\d)",
            'I': r"(?P<I>1[0-2]|0[1-9]|[1-9])",
            'j': r"(?P<j>36[0-6]|3[0-5]\d|[1-2]\d\d|0[1-9]\d|00[1-9]|[1-9]\d|0[1-9]|[1-9])",
            'm': r"(?P<m>1[0-2]|0[1-9]|[1-9])",
            'M': r"(?P<M>[0-5]\d|\d)",
            'S': r"(?P<S>6[0-1]|[0-5]\d|\d)",
            'U': r"(?P<U>5[0-3]|[0-4]\d|\d)",
            'w': r"(?P<w>[0-6])",
            # W is set below by using 'U'
            'y': r"(?P<y>\d\d)",
            #XXX: Does 'Y' need to worry about having less or more than
            #     4 digits?
            'Y': r"(?P<Y>\d\d\d\d)",
            'A': self.__seqToRE(calendar.day_name[0:], 'A'),
            #'a': self.__seqToRE(self.locale_time.a_weekday, 'a'),
            #'B': self.__seqToRE(self.locale_time.f_month[1:], 'B'),
            #'b': self.__seqToRE(self.locale_time.a_month[1:], 'b'),
            #'p': self.__seqToRE(self.locale_time.am_pm, 'p'),
            #'Z': self.__seqToRE((tz for tz_names in self.locale_time.timezone
            #                            for tz in tz_names),
            #                    'Z'),
            '%': '%'})
        self.base['W'] = self.base['U'].replace('U', 'W')
        self.base['c'] = self.pattern('%d/%m/%Y %H:%M') # (self.locale_time.LC_date_time))
        #base.__setitem__('x', self.pattern(self.locale_time.LC_date))
        #base.__setitem__('X', self.pattern(self.locale_time.LC_time))

    def __seqToRE(self, to_convert, directive):
        """Convert a list to a regex string for matching a directive.
        Want possible matching values to be from longest to shortest.  This
        prevents the possibility of a match occurring for a value that also
        a substring of a larger value that should have matched (e.g., 'abc'
        matching when 'abcdef' should have been the match).
        """
        to_convert = sorted(to_convert, key=len, reverse=True)
        for value in to_convert:
            if value != '':
                break
        else:
            return ''
        regex = '|'.join(stuff for stuff in to_convert) # JPK : re_escape
        regex = '(?P<%s>%s' % (directive, regex)
        return '%s)' % regex

    def pattern(self, format):
        """Return regex pattern for the format string.
        Need to make sure that any characters that might be interpreted as
        regex syntax are escaped.
        """
        processed_format = ''
        # The sub() call escapes all characters that might be misconstrued
        # as regex syntax.  Cannot use re.escape since we have to deal with
        # format directives (%m, etc.).
        regex_chars = r"([\\.^$*+?\(\){}\[\]|])"
        format = re.sub(regex_chars, r"\\\1", format, 10) # JPK remove count 
        whitespace_replacement = '\s+'
        format = re.sub(whitespace_replacement, '\s+', format, 10) # JPK remove count
        while '%' in format:
            directive_index = format.index('%')+1
            processed_format = "%s%s%s" % (processed_format,
                                           format[:directive_index-1],
                                           self.base[format[directive_index]])
            format = format[directive_index+1:]
        print "%s%s" % (processed_format, format)
        return "%s%s" % (processed_format, format)

    def compile(self, format):
        """Return a compiled re object for the format string."""
        return re_compile(self.pattern(format), IGNORECASE)
    
