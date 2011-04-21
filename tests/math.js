var assert = require("assert");
var Parser = require("../src/mathparser").Parser;

exports.testParser = {
    testEvaluate: function() {
        assert.strictEqual(Parser.evaluate("2 ^ x", { x: 3 }), 8);
        assert.strictEqual(Parser.evaluate("2 * x + 1", { x: 3 }), 7);
        assert.strictEqual(Parser.evaluate("2 + 3 * x", { x: 4 }), 14);
        assert.strictEqual(Parser.evaluate("(2 + 3) * x", { x: 4 }), 20);
        assert.strictEqual(Parser.evaluate("2-3^x", { x: 4 }), -79);
        assert.strictEqual(Parser.evaluate("-2-3^x", { x: 4 }), -83);
        assert.strictEqual(Parser.evaluate("-3^x", { x: 4 }), -81);
        assert.strictEqual(Parser.evaluate("(-3)^x", { x: 4 }), 81);
    },

    testSubstitute: function() {
        var expr = Parser.parse("2 * x + 1");
        var expr2 = expr.substitute("x", "4 * x"); // ((2*(4*x))+1)
        assert.strictEqual(expr2.evaluate({ x: 3}), 25);
    },

    testSimplify: function() {
        var expr = Parser.parse("x * (y * 2)").simplify({ y: 4 });
        assert.strictEqual(expr.toString(), '(x*8)');
        assert.strictEqual(expr.evaluate({ x: 2 }), 16);
    },

    testVariables: function() {
        var expr = Parser.parse("x * (y * 2)");
        assert.deepEqual(expr.variables(), ['x', 'y']);
        assert.deepEqual(expr.simplify({ y: 4 }).variables(), ['x']);
    },
/*
    testToJSFunction: function() {
        var expr = Parser.parse("x * (y * atan(1))");
        var fn = expr.toJSFunction(['x', 'y']);
        assert.strictEqual(fn(2, 4), 6.283185307179586);
        fn = expr.toJSFunction(['y']);
        assert.throws(function() { return fn(4); });
    }
    */
};

require('test').run(exports);