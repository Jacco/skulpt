import unittest
import re
import time
import calendar

# helper functions
def fixasctime(s):
    if s[8] == ' ':
        s = s[:8] + '0' + s[9:]
    return s

def escapestr(text, ampm):
    """
    Escape text to deal with possible locale values that have regex
    syntax while allowing regex syntax used for comparison.
    """
    new_text = re.escape(text)
    new_text = new_text.replace(re.escape(ampm), ampm)
    new_text = new_text.replace('\%', '%')
    new_text = new_text.replace('\:', ':')
    new_text = new_text.replace('\?', '?')
    return new_text

class StrftimeTest(unittest.TestCase):

    #def __init__(self, *k, **kw):
    #    unittest.TestCase.__init__(self, *k, **kw)

    def setup(self):
    	time.setLocale("en-US");
    	print time.locale

    def _update_variables(self, now):
        # we must update the local variables on every cycle
        self.gmt = time.gmtime(now)
        now = time.localtime(now)

        if now[3] < 12: self.ampm='(AM|am)'
        else: self.ampm='(PM|pm)'

        self.jan1 = time.localtime(time.mktime((now[0], 1, 1, 0, 0, 0, 0, 1, 0)))

        try:
            if now[8]: self.tz = time.tzname[1]
            else: self.tz = time.tzname[0]
        except AttributeError:
            self.tz = ''

        if now[3] > 12: self.clock12 = now[3] - 12
        elif now[3] > 0: self.clock12 = now[3]
        else: self.clock12 = 12

        self.now = now

    def test_strftime(self):
        now = time.time()
        self._update_variables(now)
        self.strftest1(now)
        #self.strftest2(now)

        #if test_support.verbose:
        #    print "Strftime test, platform: %s, Python version: %s" % \
        #          (sys.platform, sys.version.split()[0])

        for j in range(-5, 5):
            for i in range(25):
                arg = now + (i+j*100)*23*3603
                self._update_variables(arg)
                self.strftest1(arg)
        #        self.strftest2(arg)

    def strftest1(self, now):
        #if test_support.verbose:
        #    print "strftime test for", time.ctime(now)
        now = self.now
        # Make sure any characters that could be taken as regex syntax is
        # escaped in escapestr()
        expectations = (
            ('%a', calendar.day_abbr[now[6]], 'abbreviated weekday name'),
            ('%A', calendar.day_name[now[6]], 'full weekday name'),
            ('%b', calendar.month_abbr[now[1]], 'abbreviated month name'),
            ('%B', calendar.month_name[now[1]], 'full month name'),
            # %c see below
            ('%d', '%02d' % now[2], 'day of month as number (00-31)'),
            ('%H', '%02d' % now[3], 'hour (00-23)'),
            ('%I', '%02d' % self.clock12, 'hour (01-12)'),
            ('%j', '%03d' % now[7], 'julian day (001-366)'),
            ('%m', '%02d' % now[1], 'month as number (01-12)'),
            ('%M', '%02d' % now[4], 'minute, (00-59)'),
            ('%p', self.ampm, 'AM or PM as appropriate'),
            ('%S', '%02d' % now[5], 'seconds of current time (00-60)'),
            ('%U', '%02d' % ((now[7] + self.jan1[6])//7),
             'week number of the year (Sun 1st)'),
            ('%w', '0?%d' % ((1+now[6]) % 7), 'weekday as a number (Sun 1st)'),
            ('%W', '%02d' % ((now[7] + (self.jan1[6] - 1)%7)//7),
            'week number of the year (Mon 1st)'),
            # %x see below
            ('%X', '%02d:%02d:%02d' % (now[3], now[4], now[5]), '%H:%M:%S'),
            ('%y', '%02d' % (now[0]%100), 'year without century'),
            ('%Y', '%d' % now[0], 'year with century'),
            # %Z see below
            ('%%', '%', 'single percent sign'),
        )

        for e in expectations:
            # musn't raise a value error
            try:
                result = time.strftime(e[0], now)
            except ValueError, error:
                self.fail("strftime '%s' format gave error: %s" % (e[0], error))
            if re.match(escapestr(e[1], self.ampm), result):
                continue
            if not result or result[0] == '%':
                self.fail("strftime does not support standard '%s' format (%s)"
                          % (e[0], e[2]))
            else:
                self.fail("Conflict for %s (%s): expected %s, but got %s"
                          % (e[0], e[2], e[1], result))

if __name__ == '__main__':
    unittest.main()