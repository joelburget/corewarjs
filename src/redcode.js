var parse,preparse;

(function() {
  
  
    var core = require("./core.js");
    var MathParser = require("./mathparser.js").Parser;
    var _ = require("./underscore.js")._;
    
    
    // Function below
    var compile;

    // Lex/Grammar combo
    // regexp, final, callback
    var lex = {};

    // Parser variables
    var indexSequence,currentIndent,labels,equs,indexes;
    var reset = function() {
    
        // Loop counter
        indexSequence = 0;
    
        // Only for pretty formatting purposes
        currentIndent = 0;
    
        labels = {};
        equs = {};
        indexes = {};
    }

    reset();

    var addIndent = function(code) {
        var ind="";
        for (var i=0;i<currentIndent;i++) {
            ind+="  ";
        }
        return code.replace(/\n/g,"\n"+ind);
    }

    var expr = function(x) {
        x=x.replace(/\s+/,"");
        //console.log(x);
        var p = MathParser.parse(x);
    
        var v = p.variables();
        if (v.length==0) {
            return MathParser.parse(x).evaluate();
        }
    
        var varlist = ["CURLINE:i"];
        for (var y=0;y<v.length;y++) {
            var varName = v[y];
        
            if (varName=="CURLINE") break;
        
            var isIndex = !!indexes[varName];
        
            if (isIndex) {
                varlist.push(varName+":indexes['loop_"+varName+"']");
            } else {
                p = p.substitute(varName,varName+"(CURLINE)");
            }
        };
    
        return "parsemath('"+p.toString()+"',{"+varlist.join(",")+"})";
    
    }

    lex.block = [
        [/^\s+/,true,function(m) {
            return "";
        }],
        [/^ORG\s+(.*)/i,true,function(m) {
            return addIndent("\nstartingLine = "+expr(m[1])+";");
        }],
        [/^END\s+(.*)/i,true,function(m) {
            m[1] = m[1].replace(/\s+/g,"");
            if (m[1].length) return addIndent("\ni=0;startingLine = evmath("+expr(m[1])+",labels);");
            return "";
        }],
    
        [/^ROF([^a-zA-z0-9_]+|\n|$)/i,true,function(m) {
            currentIndent--;
            return addIndent("\n}");
        }],
    
        [/^(([a-zA-Z0-9_]+)\:?\s+)?FOR\s+(.*)/i,true,function(m) {
        
            indexSequence++;
            var indexName = "loopi_"+indexSequence;
            //if the index is named
            if (m[1]) {
                indexName = "loop_"+m[2];
                indexes[m[2]]=indexName;
            }
        
            var count = expr(m[3]);
        
            if (parseInt(count)!==count) count="evmath("+count+",labels)";
                
            var ret = addIndent("\nfor (indexes['"+indexName+"']=1;indexes['"+indexName+"']<="+count+";indexes['"+indexName+"']++) {");
            currentIndent++;
        
            return ret;
        }],
    
    
        [/^([a-zA-Z0-9_]+)\:?\s+EQU\s+(.*)((\n\s*EQU\s+.*)*)/i,true,function(m) {
            var cnt = m[2]+"\n"+m[3].replace(/(^|\n)\s*EQU\s+/ig,"$1");

            equs[m[1]] = 1;
        
        
            //Do we have a block with instructions or with just an expression?
            if (cnt.match(/^\s*(DAT|MOV|ADD|SUB|MUL|DIV|MOD|JMP|JMZ|JMN|DJN|CMP|SLT|SPL|ORG|END)(\.(A|B|AB|BA|F|X|I))?\s+(.*)/i)) {
            
                currentIndent++;
                var ret = "\nlabels['"+m[1]+"'] = function() { "+compile(lex.block,cnt)+"\n}";
                currentIndent--;

            } else {
                var ret = "\nlabels['"+m[1]+"'] = function() { return evmath("+expr(cnt)+",labels);}";
            
            }
        
        
            return addIndent(ret);
        }],
    
        [/^(DAT|MOV|ADD|SUB|MUL|DIV|MOD|JMP|JMZ|JMN|DJN|CMP|SLT|SPL|ORG|END)(\.(A|B|AB|BA|F|X|I))?\s+(.*)/i,true,function(m) {
            return addIndent("\nlines[i]=[['"+m[1]+"','"+(m[3]||'')+"'],"+compile(lex.args,m[4])+"]; i++;");
        
        }],
        [/^([a-zA-Z0-9_]+)\:?/,true,function(m) {
            if (equs[m[1]]) {
                return addIndent("\nlabels['"+m[1]+"']();");
            }
            return addIndent("\nlabels['"+m[1]+"'] = (function(line) {return function(y) {return line-y;};})(i);");
        }],
        [/^.*/,true,function(m) {
            return addIndent("// "+m[0]);
        }]
    ];

    lex.args = [
        // whitespace
        [/^\s+/,true,function(m) {
            return "";
        }],
        // mode expr, mode expr
        [/^([\#\$\@\*\<\>\{\}]?)\s*([^\,]+?)\s*\,\s*([\#\$\@\*\<\>\{\}]?)\s*(.*)/,true,function(m) {
            return "['"+(m[1]||'$')+"',"+expr(m[2])+"],['"+(m[3]||'$')+"',"+expr(m[4])+"]";
        }],
        // mode expr
        [/^([\#\$\@\*\<\>\{\}]?)\s*([^\,]+)\s*/,true,function(m) {
            return "['"+(m[1]||'$')+"',"+expr(m[2])+"],null";
        }],
        [/^.*/,true,function(m) {
               return "/* ARGS "+m[0]+" */";
        }],
    ];



    var compile = function(lex,code) {
    
    
        //Remove comments and whitespace
        code = code.replace(/\;.*/g,"");
        code = code.replace(/[ \t]+/g," ");
    
    
        var compiled = "";
        var parsing = code+"";
    
        var regexp,isfinal,cb,matches;
    
        while (parsing.length) {
            //console.log("XXXXXXXX",parsing);
            for (var y=0;y<lex.length;y++) {
            
                regexp = lex[y][0];
                isfinal = lex[y][1];
                cb = lex[y][2];
            
                matches = parsing.match(regexp);
                if (matches) {
                    if (isfinal) {
                        compiled += cb(matches);
                        parsing = parsing.replace(regexp,"");
                    } else {
                        parsing = parsing.replace(regexp,cb(matches));
                    }
                    break;
                }
            }
        
        }
    
        return compiled;
    
    };


    var evmath = function(expr,vars) {
        expr=expr+"";
        var p = MathParser.parse(expr);
        return p.evaluate(vars);
    }

    var parsemath = function(expr,vars) {
        if (parseInt(expr)===expr) return expr;
    
        var p = MathParser.parse(expr);

        if (vars) {
           return p.simplify(vars).toString();
        } else {
           return p.evaluate(); 
        }
    
    };


    // redcode => javascript
    preparse = function(redcode,options) {
    
        if (!options) options = {};
    
        options["CORESIZE"]=options["CORESIZE"] || 8000;
        options["MAXLENGTH"]=options["MAXLENGTH"] || 100;
        options["MAXPROCESSES"]=options["MAXPROCESSES"] || 8000;
        options["PSPACESIZE"]=options["PSPACESIZE"] || 500;
        options["MAXCYCLES"]=options["MAXCYCLES"] || 80000;
        options["WARRIORS"]=options["WARRIORS"] || 2;
        options["MINDISTANCE"]=options["MINDISTANCE"] || 100;
        
        //the version of pMARS, multiplied by 100 (80 or more)
        options["MINDISTANCE"]=options["MINDISTANCE"] || 80;
        
    
        // Prepend constants to the code
        redcode=_.map(options,function(v,k) { return k+" EQU "+v;}).join("\n")+"\n"+redcode;
    
        var compiled=compile(lex.block,redcode);
    

        compiled="var i=0,labels={},indexes={},lines=[],startingLine=0;"+compiled;

        return compiled;
    }

    // redcode => array of lines
    parse = function(redcode,options) {
    
        reset();
    
        //var evmath = function(x) {return x;}
    
        eval(preparse(redcode,options));
    
        var instructions = [];
    
    
    
    
        //After evaluating the preparsed code, we resolve the expressions
        for (var i=0;i<lines.length;i++) {

            //console.log(lines[i][1][1],labels,evmath(lines[i][1][1],labels),labels.qd(6),labels.qf(6),labels.qs(6));
            //if (i>5) break;

            var line = lines[i];
            var cmd = lines[i][0][0].toUpperCase();
            var mod = lines[i][0][1].toUpperCase();
            var op_a = lines[i][1][0];
            var value_a = evmath(lines[i][1][1],labels);
            var op_b = lines[i][2]?lines[i][2][0]:"#"; //DEFAULT = # 0 for mono-instructions?
            var value_b = lines[i][2]?evmath(lines[i][2][1],labels):0;
        
            //DAT when with single values place it in the B register
            if (cmd=="DAT" && !lines[i][2]) {
                op_b = op_a;
                value_b = value_a;
                op_a = "#";
                value_a = 0;
            }
        
        
            lines[i] = [[cmd,mod] , [op_a,value_a], [op_b,value_b]];
        
            instructions[i] = [core[cmd] + (mod===''?0:core[mod]),[core.OP_LOOKUP[op_a], value_a],[core.OP_LOOKUP[op_b], value_b]];
        }

        var start = evmath(startingLine,labels);
        
        var cleanSource = "ORG "+start+"\n"+
            _.map(instructions,function(inst) {
                return core.dump(inst);
            }).join("\n");

        return {
            "instructions":instructions,
            "lines":lines,
            "start":start,
            "cleanSource":cleanSource
        };
    }



    // export in common js
    if( typeof module !== "undefined" && ('exports' in module)){

        module.exports.parse = parse;
        module.exports.preparse = preparse;
    }


})();